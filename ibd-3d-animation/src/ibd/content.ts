// All patient-facing copy for the explainer, kept apart from rendering code so a
// clinician can review and edit it without touching the animation.
//
// Reading level target: about 6th grade. Tone: calm, plain, reassuring.
// Fill in REVIEW below once a licensed clinician has signed off; it is shown in the info panel.

import type { TubeKey } from './conditions.ts';
import type { ChapterId } from './timeline.ts';

export interface ChapterContent { eyebrow: string; title: string; body: string; facts: string[] }
export interface HotspotLabel {
  chapter: ChapterId;
  tube: TubeKey;
  u: number;
  text: string;
  appear: number;
  vanish: number;
  side: 1 | -1;
}

export const REVIEW = Object.freeze({
  reviewedBy: 'Pending clinician review',
  lastReviewed: 'Pending',
});

export const DISCLAIMER =
  'This animation is general health education. It is not medical advice, it does not diagnose any condition, and it ' +
  'does not replace talking with a clinician. Viewing it does not create a doctor-patient relationship. The drawings ' +
  'are simplified and not to scale. If you have symptoms, please talk with your doctor. In an emergency, call 911.';

export const SOURCES_NOTE = 'These links go to outside websites that we do not control.';

export const SOURCES = Object.freeze([
  { name: "Crohn's & Colitis Foundation: What is IBD?", url: 'https://www.crohnscolitisfoundation.org/what-is-ibd' },
  { name: 'American College of Gastroenterology: IBD', url: 'https://gi.org/topics/inflammatory-bowel-disease/' },
  { name: 'NIDDK: Crohn’s disease', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease' },
  { name: 'NIDDK: Ulcerative colitis', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/ulcerative-colitis' },
]);

export const CHAPTER_CONTENT: Readonly<Record<ChapterId, ChapterContent>> = Object.freeze({
  healthy: {
    eyebrow: 'Chapter 1',
    title: 'A healthy gut',
    body:
      'Your digestive tract is one long, muscular tube. Food travels through the small intestine, where nutrients ' +
      'are absorbed, then through the colon, which absorbs water and forms stool. A healthy lining is smooth, pink ' +
      'and calm, and gentle muscle waves keep everything moving.',
    facts: [
      'Small intestine: about 20 feet long, absorbs nutrients',
      'Colon: about 5 feet long, absorbs water',
      'Gentle waves called peristalsis move food along',
    ],
  },
  ibd: {
    eyebrow: 'Chapter 2',
    title: 'What is IBD?',
    body:
      'Inflammatory bowel disease (IBD) happens when the immune system mistakenly attacks the lining of the digestive ' +
      'tract, causing ongoing inflammation. The two main types are Crohn’s disease and ulcerative colitis. IBD is ' +
      'not the same as irritable bowel syndrome (IBS), and it is not caused by stress or by anything you did. IBD ' +
      'looks different in every person; this animation shows the most common patterns.',
    facts: [
      'A long-term immune condition, not an infection',
      'Different from IBS, which does not damage the lining',
      'Many good treatments are available today',
    ],
  },
  crohns: {
    eyebrow: 'Chapter 3',
    title: 'Crohn’s disease',
    body:
      'Crohn’s disease can affect any part of the digestive tract, from the mouth to the anus. It shows up most ' +
      'often at the end of the small intestine, called the terminal ileum, and at the start of the colon. Inflamed ' +
      'patches sit next to healthy stretches of bowel. Doctors call these skip lesions. Crohn’s can also reach ' +
      'through the whole thickness of the bowel wall.',
    facts: [
      'Patchy “skip” pattern with healthy bowel between',
      'Full-thickness inflammation thickens the wall',
      'Can cause narrow spots (strictures) or small tunnels (fistulas)',
      'The rectum is often, but not always, spared',
    ],
  },
  uc: {
    eyebrow: 'Chapter 4',
    title: 'Ulcerative colitis',
    body:
      'Ulcerative colitis affects only the colon and rectum. It starts in the rectum and spreads upward in one ' +
      'continuous stretch, staying in the inner lining of the bowel wall. The irritated lining develops small ' +
      'ulcers, which can cause urgency, diarrhea and blood in the stool.',
    facts: [
      'Colon and rectum only',
      'Continuous, always starting at the rectum',
      'Inner lining (mucosa) only',
      'Ranges from rectum-only to the whole colon',
    ],
  },
  flares: {
    eyebrow: 'Chapter 5',
    title: 'Flares and remission',
    body:
      'IBD comes in waves. A flare is when inflammation and symptoms are active. Remission is when the lining calms ' +
      'down and heals. With the right treatment plan, many people have long stretches with few or no symptoms. ' +
      'The goal is not just to feel better, but to heal the lining itself.',
    facts: [
      'Flares can settle down with treatment',
      'Remission means a calm, healing lining',
      'Regular follow-up catches flares early',
    ],
  },
  next: {
    eyebrow: 'Chapter 6',
    title: 'Don’t fret the gut',
    body:
      'Ongoing diarrhea, belly pain, blood in the stool, unexplained weight loss or constant tiredness deserve a ' +
      'proper look. Simple blood and stool tests are usually the first step, and we guide you from there. Some ' +
      'symptoms need care right away: heavy bleeding, severe belly pain, a high fever, or not being able to keep ' +
      'fluids down. Call us or go to an emergency room.',
    facts: [
      'Start with a visit and simple lab tests',
      'Finding it early gives you more options',
      'We coordinate GI specialist care when needed',
      'Urgent: heavy bleeding, severe pain or high fever',
    ],
  },
});

/**
 * Hotspot labels anchored to the anatomy. `appear` / `vanish` are fractions of
 * the chapter during which the label is shown.
 */
export const ALL_LABELS: readonly HotspotLabel[] = Object.freeze([
  { chapter: 'healthy', tube: 'stomach', u: 0.3, text: 'Stomach', appear: 0.1, vanish: 0.95, side: 1 },
  { chapter: 'healthy', tube: 'smallIntestine', u: 0.5, text: 'Small intestine', appear: 0.2, vanish: 0.95, side: 1 },
  { chapter: 'healthy', tube: 'colon', u: 0.4, text: 'Colon (large intestine)', appear: 0.3, vanish: 0.95, side: 1 },
  { chapter: 'healthy', tube: 'colon', u: 0.93, text: 'Rectum', appear: 0.4, vanish: 0.95, side: 1 },

  { chapter: 'ibd', tube: 'smallIntestine', u: 0.6, text: 'Immune cells gather in the lining', appear: 0.3, vanish: 0.95, side: 1 },

  { chapter: 'crohns', tube: 'smallIntestine', u: 0.94, text: 'Terminal ileum: most common site', appear: 0.12, vanish: 0.98, side: -1 },
  { chapter: 'crohns', tube: 'smallIntestine', u: 0.8, text: 'Healthy “skip” area', appear: 0.4, vanish: 0.98, side: 1 },
  { chapter: 'crohns', tube: 'colon', u: 0.06, text: 'Patch in the cecum (start of the colon)', appear: 0.32, vanish: 0.98, side: -1 },
  { chapter: 'crohns', tube: 'colon', u: 0.47, text: 'Patch in the transverse colon', appear: 0.7, vanish: 0.98, side: 1 },
  { chapter: 'crohns', tube: 'colon', u: 0.96, text: 'Rectum often spared', appear: 0.78, vanish: 0.98, side: 1 },

  { chapter: 'uc', tube: 'colon', u: 0.97, text: 'Starts in the rectum', appear: 0.1, vanish: 0.98, side: 1 },
  { chapter: 'uc', tube: 'colon', u: 0.62, text: 'Left-sided colitis', appear: 0.42, vanish: 0.98, side: 1 },
  { chapter: 'uc', tube: 'colon', u: 0.2, text: 'Extensive colitis: most of the colon', appear: 0.72, vanish: 0.98, side: -1 },

  { chapter: 'flares', tube: 'colon', u: 0.6, text: 'Flare: active inflammation', appear: 0.12, vanish: 0.5, side: 1 },
  { chapter: 'flares', tube: 'colon', u: 0.6, text: 'Remission: the lining heals', appear: 0.62, vanish: 0.98, side: 1 },
]);

export const UI_TEXT = Object.freeze({
  brand: 'Beverly Hills Health',
  series: 'Don’t Fret The Gut',
  kicker: 'Inside the gut: understanding IBD',
  viewNote: 'Front view, as if facing the patient',
  insetTitle: 'Bowel wall, cut across',
  insetLayers: ['Inner lining (mucosa)', 'Submucosa', 'Muscle layers', 'Outer coat (serosa)'],
  play: 'Play tour',
  pause: 'Pause',
  replay: 'Replay',
  reduceMotion: 'Reduce motion',
  fullscreen: 'Full screen',
  bookCta: 'Book a visit',
});
