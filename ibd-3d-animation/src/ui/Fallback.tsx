import { CHAPTER_CONTENT, DISCLAIMER } from '@/ibd/content.ts';
import { CHAPTERS } from '@/ibd/timeline.ts';

/** Shown when WebGL is unavailable: a video of the tour, or the written summary. */
export function Fallback({ message }: { message: string }) {
  return (
    <div className="h-full w-full overflow-auto bg-(--color-stage-900) p-5 text-(--text)">
      <p className="eyebrow">Don’t Fret The Gut</p>
      <h1 className="font-display mt-1 text-2xl">Inside the gut: understanding IBD</h1>
      <p className="mt-2 text-sm text-(--muted)">{message} Here is the same tour as a video, and in writing below.</p>
      <video className="mt-4 w-full max-w-3xl rounded-xl" controls muted playsInline poster="./poster.jpg" preload="metadata">
        <source src="./ibd-animation.mp4" type="video/mp4" />
      </video>
      <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        {CHAPTERS.map((c) => (
          <section key={c.id} className="glass rounded-2xl p-4">
            <p className="eyebrow">{CHAPTER_CONTENT[c.id].eyebrow}</p>
            <h2 className="font-display mt-1 text-lg">{CHAPTER_CONTENT[c.id].title}</h2>
            <p className="mt-1 text-sm text-(--muted)">{CHAPTER_CONTENT[c.id].body}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 max-w-3xl text-xs text-(--muted)">{DISCLAIMER}</p>
    </div>
  );
}
