import { useState } from 'react';
import ShinyText from '@react-bits/TextAnimations/ShinyText/ShinyText';
import { UI_TEXT } from '@/ibd/content.ts';
import { Disclaimer } from './Disclaimer.tsx';
import { CloseIcon, InfoIcon } from './icons.tsx';

export function BrandBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pointer-events-auto flex items-start justify-between gap-3" data-avoid-labels>
      <div className="glass rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
        <p className="eyebrow">{UI_TEXT.series}</p>
        <ShinyText text={UI_TEXT.kicker} className="font-display mt-0.5 block text-base leading-tight sm:mt-1 sm:text-xl" speed={4} color="var(--text)" shineColor="var(--accent)" />
      </div>
      <div className="flex items-center gap-2">
        <span className="glass hidden rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide text-(--muted) sm:inline-block">
          {UI_TEXT.viewNote}
        </span>
        <button
          type="button"
          className="glass grid h-9 w-9 place-items-center rounded-full text-(--muted) transition hover:text-(--text)"
          aria-label={open ? 'Close information' : 'About this animation'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <InfoIcon />}
        </button>
      </div>
      {open && <Disclaimer onClose={() => setOpen(false)} />}
    </header>
  );
}
