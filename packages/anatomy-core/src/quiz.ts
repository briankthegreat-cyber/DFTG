import type { QuizQuestion } from './schemas';

/**
 * Declarative quiz engine. Pure data-in/data-out so it can be driven by any
 * UI and unit-tested without React or Three.js. Grading is ALWAYS by stable
 * structure_id, never by display text, and the public question view never
 * exposes the correct answer before submission.
 */

export interface QuizAnswerRecord {
  question_id: string;
  submitted_structure_id: string | null;
  correct: boolean;
}

export type QuizPhase = 'question' | 'feedback' | 'complete';

export interface QuizSessionState {
  session_id: string;
  questions: QuizQuestion[];
  current_index: number;
  answers: QuizAnswerRecord[];
  phase: QuizPhase;
  seed: number;
}

export interface PublicQuizOption {
  structure_id: string;
  label: string;
}

/** What the UI is allowed to see before an answer is submitted. */
export interface PublicQuizQuestion {
  id: string;
  type: QuizQuestion['type'];
  prompt: string;
  index: number;
  total: number;
  difficulty?: QuizQuestion['difficulty'];
  system?: string;
  /** Multiple choice only: shuffled options with no correctness marking. */
  options?: PublicQuizOption[];
}

export interface QuizSessionOptions {
  sessionId: string;
  count?: number;
  system?: string;
  /**
   * When provided, only questions whose target/accepted/distractor structures
   * are all present (e.g. geometry currently available) are used. Keeps quizzes
   * honest about missing coverage instead of asking unanswerable questions.
   */
  availableStructureIds?: ReadonlySet<string>;
  seed?: number;
}

/** Small deterministic PRNG so shuffles are reproducible in tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

function questionIsAnswerable(
  question: QuizQuestion,
  available: ReadonlySet<string> | undefined,
): boolean {
  if (!available) return true;
  const required = [
    ...question.target_structure_ids,
    ...(question.type === 'multiple_choice' ? (question.distractor_structure_ids ?? []) : []),
  ];
  return required.every((id) => available.has(id));
}

export function createQuizSession(
  questions: readonly QuizQuestion[],
  options: QuizSessionOptions,
): QuizSessionState {
  const seed = options.seed ?? 1;
  const rng = mulberry32(seed);
  let pool = questions.filter((q) => questionIsAnswerable(q, options.availableStructureIds));
  if (options.system !== undefined) {
    pool = pool.filter((q) => q.system === undefined || q.system === options.system);
  }
  const ordered = shuffled(pool, rng);
  const selected = options.count !== undefined ? ordered.slice(0, options.count) : ordered;
  return {
    session_id: options.sessionId,
    questions: selected,
    current_index: 0,
    answers: [],
    phase: selected.length > 0 ? 'question' : 'complete',
    seed,
  };
}

export function currentQuestion(state: QuizSessionState): QuizQuestion | null {
  return state.questions[state.current_index] ?? null;
}

export function getPublicQuestion(
  state: QuizSessionState,
  labelFor: (structureId: string) => string,
): PublicQuizQuestion | null {
  const question = currentQuestion(state);
  if (!question || state.phase === 'complete') return null;
  const publicQuestion: PublicQuizQuestion = {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    index: state.current_index,
    total: state.questions.length,
  };
  if (question.difficulty !== undefined) publicQuestion.difficulty = question.difficulty;
  if (question.system !== undefined) publicQuestion.system = question.system;
  if (question.type === 'multiple_choice') {
    const rng = mulberry32(state.seed + state.current_index + 7);
    const ids = [...question.target_structure_ids, ...(question.distractor_structure_ids ?? [])];
    publicQuestion.options = shuffled(ids, rng).map((structure_id) => ({
      structure_id,
      label: labelFor(structure_id),
    }));
  }
  return publicQuestion;
}

export interface SubmitResult {
  state: QuizSessionState;
  correct: boolean;
  correct_structure_ids: string[];
  explanation?: string;
  citations?: QuizQuestion['citations'];
}

export function submitAnswer(state: QuizSessionState, structureId: string): SubmitResult {
  const question = currentQuestion(state);
  if (!question || state.phase !== 'question') {
    return {
      state,
      correct: false,
      correct_structure_ids: [],
    };
  }
  const accepted = question.accepted_structure_ids ?? question.target_structure_ids;
  const correct = accepted.includes(structureId);
  const next: QuizSessionState = {
    ...state,
    answers: [
      ...state.answers,
      { question_id: question.id, submitted_structure_id: structureId, correct },
    ],
    phase: 'feedback',
  };
  const result: SubmitResult = {
    state: next,
    correct,
    correct_structure_ids: [...question.target_structure_ids],
  };
  if (question.explanation !== undefined) result.explanation = question.explanation;
  if (question.citations !== undefined) result.citations = question.citations;
  return result;
}

export function advance(state: QuizSessionState): QuizSessionState {
  if (state.phase !== 'feedback') return state;
  const nextIndex = state.current_index + 1;
  if (nextIndex >= state.questions.length) {
    return { ...state, phase: 'complete' };
  }
  return { ...state, current_index: nextIndex, phase: 'question' };
}

export interface QuizSummary {
  total: number;
  correct_count: number;
  answers: QuizAnswerRecord[];
}

export function summarize(state: QuizSessionState): QuizSummary {
  return {
    total: state.questions.length,
    correct_count: state.answers.filter((a) => a.correct).length,
    answers: [...state.answers],
  };
}
