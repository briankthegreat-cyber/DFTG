import { z } from 'zod';

/**
 * Local-first study data behind a repository interface. Components never
 * touch localStorage directly; a future account backend implements the same
 * interface. Data is versioned under a single storage key and validated on
 * read (corrupt data resets rather than crashing).
 */

export const STUDY_STORAGE_KEY = 'anatomy-app.study.v1';

const RecentEntrySchema = z.object({ structure_id: z.string(), at: z.string() });
export type RecentEntry = z.infer<typeof RecentEntrySchema>;

const QuizHistoryEntrySchema = z.object({
  at: z.string(),
  total: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  mode: z.string(),
});
export type QuizHistoryEntry = z.infer<typeof QuizHistoryEntrySchema>;

const StudyDataSchema = z.object({
  version: z.literal(1),
  bookmarks: z.array(z.string()),
  recents: z.array(RecentEntrySchema),
  quiz_history: z.array(QuizHistoryEntrySchema),
  lesson_progress: z.record(z.number().int().nonnegative()),
});
export type StudyData = z.infer<typeof StudyDataSchema>;

export function emptyStudyData(): StudyData {
  return { version: 1, bookmarks: [], recents: [], quiz_history: [], lesson_progress: {} };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StudyRepository {
  load(): StudyData;
  toggleBookmark(structureId: string): StudyData;
  pushRecent(structureId: string, at: string): StudyData;
  appendQuizHistory(entry: QuizHistoryEntry): StudyData;
  setLessonProgress(lessonId: string, stepIndex: number): StudyData;
  clear(): StudyData;
}

const MAX_RECENTS = 30;

export class LocalStudyRepository implements StudyRepository {
  constructor(
    private readonly storage: StorageLike,
    private readonly key: string = STUDY_STORAGE_KEY,
  ) {}

  load(): StudyData {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return emptyStudyData();
    try {
      return StudyDataSchema.parse(JSON.parse(raw));
    } catch {
      // Corrupt or outdated payload: reset rather than crash.
      return emptyStudyData();
    }
  }

  private save(data: StudyData): StudyData {
    this.storage.setItem(this.key, JSON.stringify(data));
    return data;
  }

  toggleBookmark(structureId: string): StudyData {
    const data = this.load();
    const bookmarks = data.bookmarks.includes(structureId)
      ? data.bookmarks.filter((id) => id !== structureId)
      : [...data.bookmarks, structureId];
    return this.save({ ...data, bookmarks });
  }

  pushRecent(structureId: string, at: string): StudyData {
    const data = this.load();
    const recents = [
      { structure_id: structureId, at },
      ...data.recents.filter((r) => r.structure_id !== structureId),
    ].slice(0, MAX_RECENTS);
    return this.save({ ...data, recents });
  }

  appendQuizHistory(entry: QuizHistoryEntry): StudyData {
    const data = this.load();
    return this.save({ ...data, quiz_history: [...data.quiz_history, entry] });
  }

  setLessonProgress(lessonId: string, stepIndex: number): StudyData {
    const data = this.load();
    return this.save({
      ...data,
      lesson_progress: { ...data.lesson_progress, [lessonId]: stepIndex },
    });
  }

  clear(): StudyData {
    this.storage.removeItem(this.key);
    return emptyStudyData();
  }
}

/** In-memory fallback (private browsing, tests, SSR). */
export class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}
