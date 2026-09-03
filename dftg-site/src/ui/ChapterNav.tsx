import { CHAPTERS, chapterAt, timeForChapter } from '@/ibd/timeline.ts';
import { player, usePlayer } from '@/store/player.ts';

export function ChapterNav() {
  const active = usePlayer((s) => chapterAt(s.time).index);
  const go = (index: number) => player.seek(timeForChapter(index) + 0.01, { play: true });
  return (
    <nav aria-label="Chapters" className="pointer-events-auto min-w-0 flex-1">
      <div role="tablist" className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
        {CHAPTERS.map((c, i) => {
          const isActive = i === active;
          return (
            <button
              key={c.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => go(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') go(Math.min(CHAPTERS.length - 1, i + 1));
                if (e.key === 'ArrowLeft') go(Math.max(0, i - 1));
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                isActive
                  ? 'border-transparent bg-(--accent) text-(--accent-ink)'
                  : 'border-(--border) bg-(--surface) text-(--muted) hover:text-(--text)'
              }`}
            >
              <span className="mr-1.5 opacity-60">{i + 1}</span>
              {c.title}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
