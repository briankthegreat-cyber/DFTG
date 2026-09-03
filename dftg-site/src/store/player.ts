// Tiny external store for playback state. React reads it with useSyncExternalStore;
// the render loop mutates it directly to avoid re-rendering the UI every frame.

import { useSyncExternalStore } from 'react';
import { TOTAL_DURATION } from '@/ibd/timeline.ts';

export interface PlayerState {
  time: number;
  playing: boolean;
  ended: boolean;
  reducedMotion: boolean;
  fullscreen: boolean;
  loop: boolean;
}

type Listener = () => void;

let state: PlayerState = { time: 0, playing: true, ended: false, reducedMotion: false, fullscreen: false, loop: false };
const listeners = new Set<Listener>();
const frameListeners = new Set<(s: PlayerState) => void>();

function emit(): void {
  for (const l of listeners) l();
}

export const player = {
  get(): PlayerState {
    return state;
  },
  set(partial: Partial<PlayerState>): void {
    state = { ...state, ...partial };
    emit();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** High-frequency subscription (every tick) for DOM-driven widgets such as the progress bar. */
  onFrame(listener: (s: PlayerState) => void): () => void {
    frameListeners.add(listener);
    return () => frameListeners.delete(listener);
  },
  /** Advance the clock by dt seconds. Called from the render loop. */
  tick(dt: number): void {
    if (!state.playing) return;
    let time = Math.max(0, state.time + dt);
    let ended = false;
    let playing = true;
    if (time >= TOTAL_DURATION) {
      if (state.loop) time -= TOTAL_DURATION;
      else {
        time = TOTAL_DURATION - 1e-3;
        ended = true;
        playing = false;
      }
    }
    // Mutate without notifying React on every frame; chapter changes are detected by selectors below.
    state = { ...state, time, ended, playing };
    for (const l of frameListeners) l(state);
    if (ended || !playing) emit();
  },
  /** Called by the loop when the chapter index changes so React re-renders. */
  notify(): void {
    emit();
  },
  seek(time: number, { play }: { play?: boolean } = {}): void {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION - 1e-3, time));
    state = { ...state, time: clamped, ended: false, playing: play ?? state.playing };
    for (const l of frameListeners) l(state);
    emit();
  },
  togglePlay(): void {
    if (state.ended) {
      player.seek(0, { play: true });
      return;
    }
    player.set({ playing: !state.playing });
  },
};

export function usePlayer<T>(selector: (s: PlayerState) => T): T {
  return useSyncExternalStore(player.subscribe, () => selector(state), () => selector(state));
}
