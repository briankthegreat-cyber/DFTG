import { DISCLAIMER, REVIEW, SOURCES, SOURCES_NOTE } from '@/ibd/content.ts';

export function Disclaimer({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="false" aria-label="About this animation" className="glass absolute top-16 right-3 z-20 max-w-sm rounded-2xl p-5 text-sm leading-relaxed sm:right-5">
      <p className="eyebrow mb-2">About this animation</p>
      <p className="text-(--text)">{DISCLAIMER}</p>
      <p className="mt-3 text-xs text-(--muted)">
        Anatomy is simplified and shown from the front, as if you were facing the patient. Colors and sizes are exaggerated to make the ideas easy to see.
      </p>
      <p className="mt-3 text-xs text-(--muted)">Reviewed by: {REVIEW.reviewedBy} · Last reviewed: {REVIEW.lastReviewed}</p>
      <p className="mt-3 text-xs font-semibold tracking-wide text-(--muted) uppercase">Sources</p>
      <p className="mt-1 text-[11px] text-(--muted)">{SOURCES_NOTE}</p>
      <ul className="mt-1 space-y-1 text-xs">
        {SOURCES.map((s) => (
          <li key={s.url}>
            <a className="text-(--accent) underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className="mt-4 rounded-full border border-(--border) px-3 py-1 text-xs text-(--muted) hover:text-(--text)">Close</button>
    </div>
  );
}
