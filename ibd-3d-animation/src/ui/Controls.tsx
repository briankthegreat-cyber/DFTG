import { useEffect, useRef } from 'react';
import Magnet from '@react-bits/Animations/Magnet/Magnet';
import StarBorder from '@react-bits/Animations/StarBorder/StarBorder';
import { UI_TEXT } from '@/ibd/content.ts';
import { CHAPTERS, chapterStart, TOTAL_DURATION } from '@/ibd/timeline.ts';
import { useSceneContext } from '@/scene/scene-context.ts';
import { player, usePlayer } from '@/store/player.ts';
import { ChapterNav } from './ChapterNav.tsx';
import { FullscreenIcon, MotionIcon, PauseIcon, PlayIcon, ReplayIcon } from './icons.tsx';

function ProgressBar() {
  const segs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => player.onFrame((s) => {
    CHAPTERS.forEach((c, i) => {
      const start = chapterStart(i);
      const f = Math.max(0, Math.min(1, (s.time - start) / c.duration));
      const el = segs.current[i];
      if (el) el.style.transform = `scaleX(${f})`;
    });
  }), []);
  return (
    <div className="progress-track pointer-events-auto mt-2 w-full" role="group" aria-label="Tour progress">
      {CHAPTERS.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className="progress-seg cursor-pointer"
          style={{ flexBasis: `${(c.duration / TOTAL_DURATION) * 100}%` }}
          aria-label={`Go to chapter ${i + 1}: ${c.title}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const frac = (e.clientX - rect.left) / rect.width;
            player.seek(chapterStart(i) + frac * c.duration, { play: true });
          }}
        >
          <i ref={(el) => { segs.current[i] = el; }} />
        </button>
      ))}
    </div>
  );
}

export function Controls() {
  const playing = usePlayer((s) => s.playing);
  const ended = usePlayer((s) => s.ended);
  const reduced = usePlayer((s) => s.reducedMotion);
  const { stageRef, options } = useSceneContext();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); player.togglePlay(); }
      if (e.key === 'ArrowRight') player.seek(player.get().time + 5);
      if (e.key === 'ArrowLeft') player.seek(player.get().time - 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    // Rejections are expected when an embedding iframe lacks allow="fullscreen".
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  const label = ended ? UI_TEXT.replay : playing ? UI_TEXT.pause : UI_TEXT.play;
  return (
    <div className="pointer-events-auto mt-3" data-avoid-labels>
      <div className="flex items-center gap-2 sm:gap-3">
        <Magnet padding={30} magnetStrength={8} disabled={reduced}>
          <button
            type="button"
            onClick={() => player.togglePlay()}
            aria-label={label}
            title={`${label} (space)`}
            className="grid h-11 w-11 place-items-center rounded-full bg-(--accent) text-(--accent-ink) shadow-lg shadow-black/30 transition-transform hover:scale-105 active:scale-95"
          >
            {ended ? <ReplayIcon /> : playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </Magnet>
        <ChapterNav />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => player.set({ reducedMotion: !reduced })}
            aria-pressed={reduced}
            title={UI_TEXT.reduceMotion}
            aria-label={UI_TEXT.reduceMotion}
            className={`glass hidden h-9 w-9 place-items-center rounded-full transition sm:grid ${reduced ? 'text-(--accent)' : 'text-(--muted) hover:text-(--text)'}`}
          >
            <MotionIcon />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={UI_TEXT.fullscreen}
            aria-label={UI_TEXT.fullscreen}
            className="glass grid h-9 w-9 place-items-center rounded-full text-(--muted) transition hover:text-(--text)"
          >
            <FullscreenIcon />
          </button>
          <span className="hidden sm:inline-block">
            <StarBorder
              as="a"
              href={options.book}
              target="_blank"
              rel="noopener noreferrer"
              color="var(--accent)"
              speed="7s"
              thickness={1}
              className="text-xs font-semibold"
              backgroundColor="var(--surface-strong)"
              textColor="var(--text)"
              borderColor="var(--border)"
            >
              <span className="px-1">{UI_TEXT.bookCta}</span>
            </StarBorder>
          </span>
        </div>
      </div>
      <ProgressBar />
    </div>
  );
}
