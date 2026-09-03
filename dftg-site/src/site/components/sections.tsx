import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useHref } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { community, comparison, explainerSection, getInvolved, guides, learn, newsletter, org, shop } from '../data';
import type { Guide, Product } from '../data';
import { ButtonLink, Display, Eyebrow, Reveal, Tag, TextLink } from './ui';
import { ProductArt } from './ui';
import { useBag } from './SiteLayout';

const toneCard = {
  forest: 'bg-forest text-ivory',
  peach: 'bg-peach-pale text-forest',
} as const;

/** The two big condition cards (IBD dark green, IBS pale peach). */
export function ConditionCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {learn.conditions.map((c, i) => (
        <Reveal key={c.slug} delay={i * 0.1}>
          <article className={`relative flex min-h-[540px] flex-col p-8 md:p-10 ${toneCard[c.tone]}`}>
            <span className="absolute top-8 right-8 text-[0.66rem] tracking-[0.2em]">0{i + 1}</span>
            <span className={`font-display grid h-28 w-28 place-items-center rounded-full border text-[1.75rem] italic ${c.tone === 'forest' ? 'border-ivory/70' : 'border-forest'}`}>
              {c.code}
            </span>
            <h3 className="font-display mt-auto pt-16 text-[2.6rem] leading-[1.02]">{c.name.replace(' ', '\n')}</h3>
            <p className={`mt-5 max-w-lg text-[0.95rem] leading-relaxed ${c.tone === 'forest' ? 'text-ivory/85' : 'text-ink/80'}`}>{c.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <Tag key={t} dark={c.tone === 'forest'}>{t}</Tag>
              ))}
            </div>
            <Link to={c.to} className={`mt-12 flex items-center justify-between border-b pb-3 text-sm font-semibold ${c.tone === 'forest' ? 'border-ivory/60' : 'border-forest'}`}>
              {c.cta}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export function ComparisonTable({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`bg-ivory ${compact ? 'p-6 md:p-10' : 'p-8 md:p-14'}`}>
      <div className={`grid gap-10 ${compact ? '' : 'md:grid-cols-[0.8fr_1.2fr]'}`}>
        {!compact && (
          <div>
            <Eyebrow>{comparison.eyebrow}</Eyebrow>
            <Display lines={comparison.title.map((t) => ({ text: t }))} size="lg" className="mt-3" />
          </div>
        )}
        <div>
          <table className="w-full border-collapse text-left text-[0.92rem]">
            <thead>
              <tr className="text-[0.62rem] tracking-[0.22em] text-muted uppercase">
                {comparison.columns.map((c) => (
                  <th key={c} scope="col" className="border-b border-line pb-3 font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row[0]} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-medium text-ink">{row[0]}</th>
                  <td className="py-4 pr-4 text-forest">{row[1]}</td>
                  <td className="py-4 text-forest">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">{comparison.note}</p>
        </div>
      </div>
    </section>
  );
}

/** Dark panel that points to the 3D explainer page. */
export function ExplainerTeaser() {
  return (
    <section className="grain relative overflow-hidden bg-forest-deep text-ivory">
      <div className="grid gap-10 p-8 md:grid-cols-[1.05fr_0.95fr] md:p-14">
        <div>
          <Eyebrow dark>{explainerSection.eyebrow}</Eyebrow>
          <Display lead={explainerSection.titleLead} accent={explainerSection.titleAccent} size="xl" dark className="mt-3" />
          <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-ivory/80">{explainerSection.body}</p>
          <div className="mt-8">
            <ButtonLink to={explainerSection.cta.to} variant="peach" icon="external">{explainerSection.cta.label}</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-ivory/55">About 70 seconds. Pause any time and drag to look around.</p>
        </div>
        <ol className="self-center divide-y divide-ivory/15 border-y border-ivory/15">
          {explainerSection.chapters.map((c, i) => (
            <li key={c} className="flex items-baseline gap-6 py-4">
              <span className="text-[0.66rem] tracking-[0.2em] text-peach">0{i + 1}</span>
              <span className="font-display text-2xl">{c}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const guideTone = {
  forest: { panel: 'bg-sage-pale', blob: 'bg-forest text-ivory' },
  peach: { panel: 'bg-peach-pale', blob: 'bg-peach text-forest' },
  sage: { panel: 'bg-sage', blob: 'bg-forest text-ivory' },
} as const;

function GuideArt({ guide, big = false }: { guide: Guide; big?: boolean }) {
  const tone = guideTone[guide.tone];
  const word = guide.tone === 'forest' ? 'Start\nhere' : guide.tone === 'peach' ? '?' : 'Rest';
  return (
    <div className={`relative overflow-hidden ${tone.panel} ${big ? 'min-h-[320px] md:min-h-full' : 'aspect-[4/3]'}`}>
      {guide.tone === 'forest' && <span className="absolute top-8 right-10 h-32 w-32 rounded-full bg-peach/90" />}
      <span
        className={`font-display absolute grid place-items-center text-center italic whitespace-pre-line ${tone.blob} ${
          guide.tone === 'sage' ? 'top-1/2 left-1/2 h-32 w-60 -translate-x-1/2 -translate-y-1/2 rounded-[50%] text-4xl' : guide.tone === 'peach' ? 'top-1/2 left-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full text-7xl' : 'top-1/2 left-1/2 h-64 w-52 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-[50%] text-4xl leading-none'
        }`}
      >
        {word}
      </span>
    </div>
  );
}

/** Resource cards for the home page: one featured "start here" card and two standard cards. */
export function GuideCards() {
  const [first, ...rest] = guides;
  return (
    <div className="grid gap-4 md:grid-cols-[1.35fr_1fr_1fr]">
      <Reveal>
        <article className="grid h-full grid-cols-1 bg-sage-pale sm:grid-cols-[0.9fr_1.1fr]">
          <GuideArt guide={first} big />
          <div className="flex flex-col p-7 md:p-8">
            <Tag>{first.tag}</Tag>
            <h3 className="font-display mt-4 text-[1.9rem] leading-[1.05] text-forest">{first.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{first.blurb}</p>
            <Link to={`/learn#guide-${first.slug}`} className="mt-auto flex items-center justify-between border-b border-forest pt-8 pb-2 text-sm font-semibold text-forest">
              Read the {first.minutes}-minute guide <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </Reveal>
      {rest.map((g, i) => (
        <Reveal key={g.slug} delay={0.1 * (i + 1)}>
          <article className="flex h-full flex-col bg-ivory">
            <GuideArt guide={g} />
            <div className="flex flex-1 flex-col p-7">
              <Tag>{g.tag}</Tag>
              <h3 className="font-display mt-4 text-[1.7rem] leading-[1.05] text-forest">{g.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{g.blurb}</p>
              <Link to={`/learn#guide-${g.slug}`} className="mt-auto flex items-center justify-between border-b border-forest pt-8 pb-2 text-sm font-semibold text-forest">
                Read guide <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

const storyTone = { ivory: 'bg-ivory', sage: 'bg-sage-pale', peach: 'bg-peach-pale' } as const;

export function StoryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {community.stories.map((s, i) => (
        <Reveal key={s.name} delay={i * 0.12} className={i === 1 ? 'sm:mt-8' : ''}>
          <figure className={`flex h-full min-h-[420px] flex-col p-7 ${storyTone[s.tone]}`}>
            <span className="text-peach">✦</span>
            <blockquote className="font-display mt-6 text-[1.45rem] leading-[1.25] text-forest italic">{s.quote}</blockquote>
            <figcaption className="mt-auto border-t border-line pt-4 text-xs">
              <span className="block font-semibold text-forest">{s.name}</span>
              <span className="text-muted">{s.living}</span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}

function mailto(subject: string): string {
  return `mailto:${org.email}?subject=${encodeURIComponent(subject)}`;
}

export function WaysGrid() {
  return (
    <div className="grid border border-line md:grid-cols-4">
      {getInvolved.ways.map((w, i) => {
        const to = w.to === 'mailto' ? mailto(`${w.title}: Don’t Fret the Gut`) : w.to;
        const inner = (
          <>
            <span className="text-[0.66rem] tracking-[0.2em] text-forest">0{i + 1}</span>
            <span className="font-display mt-20 block text-[2.2rem] text-forest">{w.title}</span>
            <span className="mt-3 block text-sm leading-relaxed text-muted">{w.body}</span>
            <ArrowRight className="mt-10 h-5 w-5 text-forest transition-transform group-hover:translate-x-1" />
          </>
        );
        const cls = 'group flex flex-col border-line p-7 md:border-r md:last:border-r-0 border-b md:border-b-0 last:border-b-0 hover:bg-ivory transition-colors';
        return w.to === 'mailto' ? (
          <a key={w.title} href={to} className={cls}>{inner}</a>
        ) : (
          <Link key={w.title} to={to} className={cls}>{inner}</Link>
        );
      })}
    </div>
  );
}

export function DonateBox({ id }: { id?: string }) {
  const d = getInvolved.donate;
  const [tier, setTier] = useState(d.defaultTier);
  const [thanks, setThanks] = useState(false);
  return (
    <section id={id} className="grain relative overflow-hidden bg-peach scroll-mt-24">
      <div className="grid gap-10 p-8 md:grid-cols-[1.15fr_0.85fr] md:p-14">
        <div>
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <Display lead={d.title} size="xl" className="mt-3" />
          <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-forest-deep/85">{d.body}</p>
        </div>
        <div className="self-center bg-ivory p-7">
          <p className="eyebrow">{d.label}</p>
          <div role="radiogroup" aria-label="Gift amount" className="mt-4 grid grid-cols-4 gap-2">
            {d.tiers.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tier === t}
                aria-label={`$${t}`}
                onClick={() => setTier(t)}
                className={`border py-3.5 text-[0.95rem] font-medium transition-colors ${tier === t ? 'border-forest bg-forest text-ivory' : 'border-line text-forest hover:border-forest'}`}
              >
                ${t}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setThanks(true)} className="mt-4 flex w-full items-center justify-between bg-forest px-5 py-4 text-sm font-semibold text-ivory transition-colors hover:bg-forest-deep">
            Donate ${tier}
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-muted" aria-live="polite">
            {thanks ? 'Thank you. Secure donation processing is being connected; nothing was charged yet.' : d.note}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add } = useBag();
  return (
    <article className="group">
      <div className="relative">
        <ProductArt color={product.color} name={product.name} />
        {product.badge && (
          <span className="absolute top-4 left-4 bg-peach px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.18em] text-forest-deep uppercase">{product.badge}</span>
        )}
        <span className="absolute top-4 right-4 text-[0.62rem] tracking-[0.2em] text-forest/70">0{index + 1}</span>
        <button
          type="button"
          onClick={() => add(product.slug)}
          aria-label={`Add ${product.name} to bag`}
          className="absolute right-4 bottom-4 grid h-11 w-11 place-items-center rounded-full bg-forest text-ivory shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl text-forest">{product.name}</h3>
          <p className="mt-1 text-[11px] text-muted">{product.meta}</p>
        </div>
        <span className="text-sm font-semibold text-forest tabular-nums">${product.price}</span>
      </div>
    </article>
  );
}

export function ProductGrid({ products, columns = 'sm:grid-cols-2 lg:grid-cols-3' }: { products: Product[]; columns?: string }) {
  return (
    <div className={`grid gap-x-5 gap-y-10 ${columns}`}>
      {products.map((p, i) => (
        <Reveal key={p.slug} delay={(i % 3) * 0.08}>
          <ProductCard product={p} index={shop.products.indexOf(p)} />
        </Reveal>
      ))}
    </div>
  );
}

export function NewsletterPanel() {
  const [done, setDone] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };
  return (
    <section id="newsletter" className="grid scroll-mt-24 md:grid-cols-[0.42fr_0.58fr]">
      <div className="relative min-h-[320px] overflow-hidden bg-forest">
        <span className="font-display absolute top-1/2 left-1/2 grid h-56 w-56 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[46%_54%_52%_48%/55%_45%_55%_45%] bg-peach text-center text-3xl leading-none text-forest-deep italic">
          Gut
          <br />
          check
        </span>
        <span className="absolute bottom-6 left-6 text-peach">✦</span>
      </div>
      <div className="bg-sage-pale p-8 md:p-14">
        <Eyebrow>{newsletter.eyebrow}</Eyebrow>
        <Display lead={newsletter.titleLead} accent={newsletter.titleAccent} size="lg" className="mt-3" />
        <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted">{newsletter.body}</p>
        <form onSubmit={onSubmit} className="mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input id="newsletter-email" type="email" required placeholder="you@example.com" className="flex-1 border border-forest/30 bg-ivory px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-forest" />
          <button type="submit" className="bg-forest px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-deep">{newsletter.cta}</button>
        </form>
        <p className="mt-3 text-[11px] text-muted" aria-live="polite">
          {done ? 'Thank you. Signup connects to the newsletter provider at launch; nothing was stored.' : newsletter.privacy}
        </p>
      </div>
    </section>
  );
}

/** Link to the explainer page that renders correctly under both routers. */
export function useExplainerCta(): { link: string; cta: string } {
  const link = useHref('/get-involved');
  return { link, cta: 'Get involved' };
}

export { TextLink };
