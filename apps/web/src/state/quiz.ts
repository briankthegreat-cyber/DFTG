import { create } from 'zustand';
import {
  advance,
  createQuizSession,
  getPublicQuestion,
  submitAnswer,
  summarize,
  type PublicQuizQuestion,
  type QuizSessionState,
  type SubmitResult,
} from '@anatomy/core';
import { useCameraStore } from '@anatomy/viewer';
import { availableStructureIds, ensureGeometryForStructure, labelFor } from '../controller';
import { useDataStore } from './data';
import { useStudyStore } from './study';

/**
 * Quiz session state. Wraps the pure engine from @anatomy/core; grading is by
 * structure_id and questions are filtered to geometry that is actually loaded
 * so identify-on-model is always answerable.
 */

interface QuizState {
  session: QuizSessionState | null;
  lastResult: SubmitResult | null;
  start: (options?: { count?: number; system?: string; targetStructureId?: string }) => void;
  answerWith: (structureId: string) => void;
  next: () => void;
  abort: () => void;
}

// Fixed seed keeps fixture-stage sessions reproducible (documented in
// IMPLEMENTATION_STATUS.md; swap for a random seed once real decks exist).
const QUIZ_SEED = 42;

export const useQuizStore = create<QuizState>((set, get) => ({
  session: null,
  lastResult: null,

  start: (options = {}) => {
    const data = useDataStore.getState();
    let pool = data.quizQuestions;
    if (options.targetStructureId !== undefined) {
      const targeted = pool.filter((q) =>
        q.target_structure_ids.includes(options.targetStructureId ?? ''),
      );
      if (targeted.length > 0) pool = targeted;
    }
    const sessionOptions: Parameters<typeof createQuizSession>[1] = {
      sessionId: `session-${Date.now()}`,
      availableStructureIds: availableStructureIds(),
      seed: QUIZ_SEED,
    };
    if (options.count !== undefined) sessionOptions.count = options.count;
    if (options.system !== undefined) sessionOptions.system = options.system;
    set({ session: createQuizSession(pool, sessionOptions), lastResult: null });
  },

  answerWith: (structureId) => {
    const session = get().session;
    if (!session || session.phase !== 'question') return;
    const result = submitAnswer(session, structureId);
    set({ session: result.state, lastResult: result });
    // Reveal: focus and highlight the correct structure after grading.
    const correctId = result.correct_structure_ids[0];
    if (correctId) {
      void ensureGeometryForStructure(correctId).then(() =>
        useCameraStore.getState().requestFocus(correctId),
      );
    }
  },

  next: () => {
    const session = get().session;
    if (!session) return;
    const advanced = advance(session);
    set({ session: advanced, lastResult: null });
    if (advanced.phase === 'complete' && session.phase === 'feedback') {
      const summary = summarize(advanced);
      if (summary.total > 0) {
        useStudyStore.getState().appendQuizHistory({
          at: new Date().toISOString(),
          total: summary.total,
          correct: summary.correct_count,
          mode: 'mixed',
        });
      }
    }
  },

  abort: () => set({ session: null, lastResult: null }),
}));

export function usePublicQuestion(): PublicQuizQuestion | null {
  const session = useQuizStore((s) => s.session);
  if (!session) return null;
  return getPublicQuestion(session, labelFor);
}
