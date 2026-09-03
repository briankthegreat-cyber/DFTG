import { lazy, Suspense } from 'react';
import type { ExplainerProps } from './Explainer.tsx';

// The 3D scene (three.js and friends) is the heaviest code on the site, so it is loaded on demand
// and a still poster fills the space until it arrives.
const ExplainerImpl = lazy(() => import('./Explainer.tsx').then((m) => ({ default: m.Explainer })));

const BASE = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');

export function ExplainerPoster({ ambient = false }: { ambient?: boolean }) {
  return (
    <img
      src={`${BASE}/og/${ambient ? 'poster-hero' : 'poster-explainer'}.jpg`}
      alt={ambient ? 'A healthy digestive tract rendered in 3D: stomach, small intestine and colon in soft pink on a deep green stage' : 'Still from the Inside the Gut 3D explainer showing the digestive tract with chapter controls'}
      width={ambient ? 900 : 1280}
      height={ambient ? 1125 : 800}
      loading={ambient ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
}

export function LazyExplainer(props: ExplainerProps) {
  return (
    <Suspense fallback={<ExplainerPoster ambient={props.options?.ambient} />}>
      <ExplainerImpl {...props} />
    </Suspense>
  );
}
