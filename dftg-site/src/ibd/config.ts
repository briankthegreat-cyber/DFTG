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
    bgTop: '#24493b',
    bgBottom: '#06140e',
    glow: '#3f7a63',
    fog: '#0f241b',
    hemiSky: '#e9f0e4',
    hemiGround: '#0f1f18',
    keyLight: '#fff6ec',
    fillLight: '#cfe0d2',
    rimLight: '#f2b58f',
    exposure: 1.0,
    insetPanel: '#12271e',
  },
  light: {
    bgTop: '#fcfaf5',
    bgBottom: '#e6dcc9',
    glow: '#ffffff',
    fog: '#f1ebe0',
    hemiSky: '#ffffff',
    hemiGround: '#c8bfae',
    keyLight: '#fff8ee',
    fillLight: '#efe6d8',
    rimLight: '#e8a27e',
    exposure: 1.0,
    insetPanel: '#f6f1e8',
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
  particle: '#ffd9b4',
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

const DEFAULT_LINK_URL = 'https://dont-fret-the-gut.bkthegreat.chatgpt.site/';
const DEFAULT_CTA = 'Learn more';
const MAX_CTA_LENGTH = 40;

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
  /** Destination of the call-to-action button (https only). */
  link: string;
  /** Label of the call-to-action button (plain text, short). */
  cta: string;
  /** Ambient mode: a calm, slowly drifting healthy gut with no controls (used in the site hero). */
  ambient: boolean;
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
  let link = params.get('link') || DEFAULT_LINK_URL;
  if (!/^https:\/\//i.test(link)) link = DEFAULT_LINK_URL;
  const ctaRaw = (params.get('cta') || '').replace(/[<>]/g, '').trim();
  const cta = ctaRaw && ctaRaw.length <= MAX_CTA_LENGTH ? ctaRaw : DEFAULT_CTA;
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
    link,
    cta,
    ambient: bool('ambient', false),
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
