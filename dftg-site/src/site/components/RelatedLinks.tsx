import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { RelatedLink } from '../data';
import { Eyebrow } from './ui';

/** "Keep going" block: contextual internal links at the end of a page. */
export function RelatedLinks({ links }: { links: RelatedLink[] }) {
  return (
    <section aria-labelledby="keep-going" className="mx-auto max-w-[1400px] px-5 pt-24 md:px-10">
      <Eyebrow>Where next</Eyebrow>
      <h2 id="keep-going" className="font-display mt-2 text-[2rem] text-forest">Keep going</h2>
      <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="group flex flex-col bg-cream p-6 transition-colors hover:bg-ivory">
            <span className="font-display text-xl text-forest">{l.label}</span>
            <span className="mt-2 text-sm leading-relaxed text-muted">{l.blurb}</span>
            <ArrowRight className="mt-6 h-4 w-4 text-forest transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
