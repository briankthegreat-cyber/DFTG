import { describe, expect, it } from 'vitest';
import { emptyStudyData, LocalStudyRepository, MemoryStorage, STUDY_STORAGE_KEY } from './storage';

describe('LocalStudyRepository', () => {
  it('loads emptyStudyData from empty storage', () => {
    const repo = new LocalStudyRepository(new MemoryStorage());
    expect(repo.load()).toEqual(emptyStudyData());
  });

  it('toggleBookmark twice returns to empty', () => {
    const repo = new LocalStudyRepository(new MemoryStorage());
    expect(repo.toggleBookmark('TEST-S-A').bookmarks).toEqual(['TEST-S-A']);
    expect(repo.toggleBookmark('TEST-S-A').bookmarks).toEqual([]);
    expect(repo.load()).toEqual(emptyStudyData());
  });

  it('pushRecent dedupes by structure_id with newest first', () => {
    const repo = new LocalStudyRepository(new MemoryStorage());
    repo.pushRecent('TEST-S-A', '2026-01-01T00:00:00Z');
    repo.pushRecent('TEST-S-B', '2026-01-02T00:00:00Z');
    const data = repo.pushRecent('TEST-S-A', '2026-01-03T00:00:00Z');
    expect(data.recents).toEqual([
      { structure_id: 'TEST-S-A', at: '2026-01-03T00:00:00Z' },
      { structure_id: 'TEST-S-B', at: '2026-01-02T00:00:00Z' },
    ]);
  });

  it('caps recents at 30, dropping the oldest', () => {
    const repo = new LocalStudyRepository(new MemoryStorage());
    let data = emptyStudyData();
    for (let i = 0; i < 35; i++) {
      data = repo.pushRecent(`TEST-S-R${i}`, `2026-01-01T00:00:${String(i).padStart(2, '0')}Z`);
    }
    expect(data.recents).toHaveLength(30);
    expect(data.recents[0]?.structure_id).toBe('TEST-S-R34');
    expect(data.recents.at(-1)?.structure_id).toBe('TEST-S-R5');
    expect(data.recents.some((r) => r.structure_id === 'TEST-S-R0')).toBe(false);
  });

  it('appends quiz history in order', () => {
    const repo = new LocalStudyRepository(new MemoryStorage());
    repo.appendQuizHistory({ at: '2026-01-01T00:00:00Z', total: 5, correct: 3, mode: 'system' });
    const data = repo.appendQuizHistory({
      at: '2026-01-02T00:00:00Z',
      total: 4,
      correct: 4,
      mode: 'mixed',
    });
    expect(data.quiz_history).toEqual([
      { at: '2026-01-01T00:00:00Z', total: 5, correct: 3, mode: 'system' },
      { at: '2026-01-02T00:00:00Z', total: 4, correct: 4, mode: 'mixed' },
    ]);
  });

  it('resets to empty without throwing on corrupt or schema-invalid payloads', () => {
    const storage = new MemoryStorage();
    const repo = new LocalStudyRepository(storage);

    storage.setItem(STUDY_STORAGE_KEY, '{"version": 1, "bookmarks":');
    expect(() => repo.load()).not.toThrow();
    expect(repo.load()).toEqual(emptyStudyData());

    storage.setItem(STUDY_STORAGE_KEY, JSON.stringify({ version: 99, bookmarks: 'nope' }));
    expect(repo.load()).toEqual(emptyStudyData());
  });

  it('persists data across repository instances sharing one storage', () => {
    const storage = new MemoryStorage();
    const first = new LocalStudyRepository(storage);
    first.toggleBookmark('TEST-S-A');
    first.pushRecent('TEST-S-B', '2026-01-01T00:00:00Z');

    const second = new LocalStudyRepository(storage);
    const data = second.load();
    expect(data.bookmarks).toEqual(['TEST-S-A']);
    expect(data.recents).toEqual([{ structure_id: 'TEST-S-B', at: '2026-01-01T00:00:00Z' }]);
  });
});
