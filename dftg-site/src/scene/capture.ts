// Deterministic rendering hooks for screenshots and the video renderer.
// With ?capture=1 the page exposes window.__ibd so a script can step time.

import { CHAPTERS, TOTAL_DURATION } from '@/ibd/timeline.ts';
import { player } from '@/store/player.ts';

type Advance = (timestamp: number) => void;
const advancers = new Map<string, Advance>();
/** Renderer internals for tests and diagnostics (capture mode only). */
export const debugHandles: Record<string, { gl: unknown; scene: unknown; camera: unknown }> = {};
let readyResolve: (() => void) | null = null;
const ready = new Promise<void>((resolve) => { readyResolve = resolve; });
let frameCounter = 0;

/** When `immediate` is set, damped followers (camera, inset, labels) snap instead of gliding. */
export const captureFlags = { immediate: false };

export function registerAdvance(id: string, advance: Advance): () => void {
  advancers.set(id, advance);
  return () => advancers.delete(id);
}

export function markReady(): void {
  readyResolve?.();
}

async function nextPaint(): Promise<void> {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
}

async function renderAt(time: number, { snap = false, passes = 1 }: { snap?: boolean; passes?: number } = {}): Promise<void> {
  player.seek(time, { play: false });
  player.notify();
  captureFlags.immediate = snap;
  for (let i = 0; i < passes; i++) {
    for (const advance of advancers.values()) advance(++frameCounter);
  }
  captureFlags.immediate = false;
  await nextPaint();
  await nextPaint();
}

export function installCaptureApi(): void {
  const api = {
    ready,
    totalDuration: TOTAL_DURATION,
    chapters: CHAPTERS.map((c) => ({ id: c.id, title: c.title, duration: c.duration })),
    setTime: renderAt,
    debug: debugHandles,
  };
  (window as unknown as { __ibd: typeof api }).__ibd = api;
}
