import { useEffect } from 'react';
import type { RefObject } from 'react';
import { player } from '@/store/player.ts';

/** Pause when the tab is hidden or the embed scrolls out of view; resume where it left off. */
export function useAutoPause(stageRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let pausedBySystem = false;
    const pauseIf = (hidden: boolean) => {
      const p = player.get();
      if (hidden && p.playing) {
        pausedBySystem = true;
        player.set({ playing: false });
      } else if (!hidden && pausedBySystem) {
        pausedBySystem = false;
        player.set({ playing: true });
      }
    };
    const onVisibility = () => pauseIf(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && stageRef.current) {
      observer = new IntersectionObserver((entries) => pauseIf(!entries[0].isIntersecting), { threshold: 0.05 });
      observer.observe(stageRef.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [stageRef, enabled]);
}

/**
 * Tells a host page the content size so it can size the iframe if it wants to.
 * The payload is only the viewport size and the embedding origin is unknown in
 * advance, so a wildcard target is intentional. Nothing listens for replies.
 */
export function useIframeSizeReport(): void {
  useEffect(() => {
    if (window.parent === window) return;
    const report = () => window.parent.postMessage({ type: 'ibd-animation:size', width: window.innerWidth, height: window.innerHeight }, '*');
    report();
    window.addEventListener('resize', report);
    return () => window.removeEventListener('resize', report);
  }, []);
}
