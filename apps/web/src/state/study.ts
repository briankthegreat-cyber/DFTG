import { create } from 'zustand';
import {
  LocalStudyRepository,
  MemoryStorage,
  emptyStudyData,
  type QuizHistoryEntry,
  type StudyData,
  type StudyRepository,
} from '@anatomy/core';

/** Local-first study data. Components talk to this store, never to localStorage. */

function createRepository(): StudyRepository {
  try {
    const probeKey = '__anatomy_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return new LocalStudyRepository(window.localStorage);
  } catch {
    return new LocalStudyRepository(new MemoryStorage());
  }
}

interface StudyState {
  data: StudyData;
  toggleBookmark: (structureId: string) => void;
  pushRecent: (structureId: string) => void;
  appendQuizHistory: (entry: QuizHistoryEntry) => void;
  setLessonProgress: (lessonId: string, stepIndex: number) => void;
  clearAll: () => void;
}

const repository = createRepository();

export const useStudyStore = create<StudyState>((set) => ({
  data: typeof window !== 'undefined' ? repository.load() : emptyStudyData(),
  toggleBookmark: (structureId) => set({ data: repository.toggleBookmark(structureId) }),
  pushRecent: (structureId) =>
    set({ data: repository.pushRecent(structureId, new Date().toISOString()) }),
  appendQuizHistory: (entry) => set({ data: repository.appendQuizHistory(entry) }),
  setLessonProgress: (lessonId, stepIndex) =>
    set({ data: repository.setLessonProgress(lessonId, stepIndex) }),
  clearAll: () => set({ data: repository.clear() }),
}));
