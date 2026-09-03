// Runtime options, brand palette and quality tiers.
// Brand tokens mirror the Beverly Hills Health website (cream, sand, ink, gold, teal).

export const BRAND = Object.freeze({
  cream: '#faf6ee',
  sand: '#f2eadb',
  ink: '#1f1b16',
  gold: '#b8934f',
  goldLight: '#d9bb85',
  goldPale: '#f1e4c8',
  teal: '#2a9d8f',
});

export const STAGE_THEMES = Object.freeze({
  dark: {
    bgTop: '#14343f',
    bgBottom: '#040b10',
    glow: '#2a6d70',
    fog: '#0a1a21',
    hemiSky: '#dff7f1',
    hemiGround: '#0d1f26',
    keyLight: '#fff6ec',
    fillLight: '#9ee9d9',
    rimLight: '#ffd7a8',
    exposure: 1.0,
    insetPanel: '#0b161c',
  },
  light: {
    bgTop: '#fbfffe',
    bgBottom: '#d3e6e1',
    glow: '#ffffff',
    fog: '#e9f2f0',
    hemiSky: '#ffffff',
    hemiGround: '#b8cfc9',
    keyLight: '#fff8ee',
    fillLight: '#d6f3ec',
    rimLight: '#ffd9a0',
    exposure: 1.0,
    insetPanel: '#f2f8f6',
  },
});

export const TISSUE_COLORS = Object.freeze({
  healthy: '#dd9287',
  healthyDeep: '#b8665f',
  inflamed: '#b62a26',
  dusky: '#6d1f3a',
  ulcer: '#450c15',
  fat: '#e6d09c',
  rimHealthy: '#f4b9a8',
  rimInflamed: '#ff6b4a',
  particle: '#ffe2b8',
});

export const QUALITY = Object.freeze({
  high: {
    smallIntestine: { tubular: 1100, radial: 28 },
    colon: { tubular: 560, radial: 36 },
    stomach: { tubular: 140, radial: 44 },
    bloom: true,
    shadows: true,
    maxPixelRatio: 2,
    particles: 220,
    msaaSamples: 4,
  },
  low: {
    smallIntestine: { tubular: 600, radial: 18 },
    colon: { tubular: 320, radial: 24 },
    stomach: { tubular: 90, radial: 28 },
    bloom: false,
    shadows: false,
    maxPixelRatio: 1.5,
    particles: 110,
    msaaSamples: 0,
  },
});

const DEFAULT_BOOKING_URL = 'https://beverlyhills-health.com/';

/** Parses `?key=value` options. Everything has a safe default. */
export type ThemeKey = 'dark' | 'light';
export type QualityKey = 'high' | 'low';
export interface Options {
  theme: ThemeKey;
  quality: QualityKey | null;
  autoplay: boolean;
  inset: boolean;
  ui: boolean;
  labels: boolean;
  capture: boolean;
  loop: boolean;
  chapter: string | null;
  t: number | null;
  book: string;
}

export function readOptions(search = ''): Options {
  const params = new URLSearchParams(search);
  const bool = (key: string, fallback: boolean): boolean => {
    if (!params.has(key)) return fallback;
    const v = params.get(key);
    return !(v === '0' || v === 'false' || v === 'no');
  };
  const num = (key: string, fallback: number | null): number | null => {
    const v = Number(params.get(key));
    return params.has(key) && Number.isFinite(v) ? v : fallback;
  };
  const theme: ThemeKey = params.get('theme') === 'light' ? 'light' : 'dark';
  const q = params.get('quality');
  const quality: QualityKey | null = q === 'high' || q === 'low' ? q : null;
  let book = params.get('book') || DEFAULT_BOOKING_URL;
  if (!/^https:\/\//i.test(book)) book = DEFAULT_BOOKING_URL;
  return {
    theme,
    quality,
    autoplay: bool('autoplay', true),
    inset: bool('inset', true),
    ui: bool('ui', true),
    labels: bool('labels', true),
    capture: bool('capture', false),
    loop: bool('loop', false),
    chapter: params.get('chapter'),
    t: num('t', null),
    book,
  };
}

/** Picks a quality tier from the device. Safe to call without `navigator`. */
export function detectQuality(nav: Navigator | null = typeof navigator !== 'undefined' ? navigator : null, win: Window | null = typeof window !== 'undefined' ? window : null): QualityKey {
  if (!nav) return 'high';
  const cores = nav.hardwareConcurrency || 8;
  const memory = (nav as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  const smallScreen = win ? Math.min(win.innerWidth, win.innerHeight) < 480 : false;
  const coarse = win?.matchMedia ? win.matchMedia('(pointer: coarse)').matches : false;
  if (cores <= 4 || memory <= 4 || (smallScreen && coarse)) return 'low';
  return 'high';
}

export function prefersReducedMotion(win: Window | null = typeof window !== 'undefined' ? window : null): boolean {
  return Boolean(win?.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
