import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import ScrollVelocity from '@react-bits/TextAnimations/ScrollVelocity/ScrollVelocity';
import { Explainer } from '@/explainer/Explainer.tsx';
import { community, getInvolved, hero, learn, resources, shop, ticker } from '../data';
import { ComparisonTable, ConditionCards, DonateBox, ExplainerTeaser, GuideCards, NewsletterPanel, ProductGrid, StoryCards, WaysGrid } from '../components/sections';
import { ButtonLink, Display, Eyebrow, Reveal, SectionIndex, TextLink } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';

function Hero() {
  return (
    <section className={`${wrap} grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20`}>
      <div>
        <Eyebrow rule>{hero.eyebrow}</Eyebrow>
        <Display as="h1" lead={hero.titleLead} accent={hero.titleAccent} size="hero" className="mt-8" />
        <p className="mt-8 max-w-xl text-[1.12rem] leading-relaxed text-muted">{hero.body}</p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <ButtonLink to={hero.primary.to} icon="external">{hero.primary.label}</ButtonLink>
          <TextLink to={hero.secondary.to}>{hero.secondary.label}</TextLink>
        </div>
        <div className="mt-14 flex items-center gap-4">
          <span className="flex -space-x-2">
            <span className="h-7 w-7 rounded-full border-2 border-cream bg-sage" />
            <span className="h-7 w-7 rounded-full border-2 border-cream bg-peach-pale" />
            <span className="h-7 w-7 rounded-full border-2 border-cream bg-forest" />
          </span>
          <p className="text-xs leading-snug">
            <span className="block font-semibold text-forest">{hero.madeWith}</span>
            <span className="text-muted">{hero.madeWithSub}</span>
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[560px]">
        <span aria-hidden="true" className="absolute -top-6 -right-4 z-10 h-24 w-24 rounded-full bg-peach/90 sm:-right-8 sm:h-28 sm:w-28" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-2xl bg-forest-deep">
          <Explainer options={{ ambient: true, theme: 'dark' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/40 to-transparent p-7 pt-24 text-ivory sm:p-9">
            <p className="font-display text-[1.6rem] leading-[1.15] italic sm:text-[1.9rem]">“{hero.pull}”</p>
            <p className="mt-4 text-[0.66rem] font-semibold tracking-[0.28em] text-peach uppercase">{hero.arch.eyebrow} · {hero.arch.title}</p>
          </div>
        </div>
        <Link to={hero.arch.cta.to} className="mt-4 flex items-center justify-between border-b border-forest pb-2 text-sm font-semibold text-forest">
          {hero.arch.cta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-2 text-[11px] text-muted">{hero.arch.body}</p>
      </div>
    </section>
  );
}

function Ticker() {
  const row = (
    <>
      {ticker.map((t) => (
        <span key={t} className="mr-8 inline-flex items-center gap-8">
          {t}
          <span className="text-peach not-italic">✦</span>
        </span>
      ))}
    </>
  );
  return (
    <div className="ticker border-y border-line bg-ivory py-3" aria-hidden="true">
      <ScrollVelocity texts={[row]} velocity={35} className="pr-2" parallaxClassName="parallax" scrollerClassName="scroller" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />

      <section className={`${wrap} pt-24 md:pt-32`} aria-labelledby="learn-title">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] md:items-end">
          <div className="relative md:pl-28">
            <SectionIndex index={learn.index} label={learn.label} className="md:absolute md:bottom-3 md:left-0" />
            <Eyebrow>{learn.eyebrow}</Eyebrow>
            <Display lead={learn.titleLead} accent={learn.titleAccent} size="xl" className="mt-3" />
          </div>
          <div className="md:pb-3">
            <p className="max-w-md text-[1.02rem] leading-relaxed text-muted">{learn.body}</p>
            <div className="mt-5">
              <TextLink to={learn.link.to}>{learn.link.label}</TextLink>
            </div>
          </div>
        </div>
        <h2 id="learn-title" className="sr-only">Learn about IBD and IBS</h2>
        <div className="mt-14">
          <ConditionCards />
        </div>
        <div className="mt-6">
          <Reveal>
            <ComparisonTable />
          </Reveal>
        </div>
      </section>

      <section className={`${wrap} pt-24 md:pt-32`}>
        <SectionIndex index={resources.index} label={resources.label} />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <Display lead={resources.titleLead} accent={resources.titleAccent} size="xl" />
          <TextLink to={resources.link.to}>{resources.link.label}</TextLink>
        </div>
        <div className="mt-12">
          <GuideCards />
        </div>
        <p className="mt-6 text-xs text-muted">{resources.note}</p>
      </section>

      <section className={`${wrap} pt-24 md:pt-32`}>
        <Reveal>
          <ExplainerTeaser />
        </Reveal>
      </section>

      <section className={`${wrap} grid gap-12 pt-24 md:grid-cols-[0.85fr_1.15fr] md:pt-32`}>
        <div>
          <SectionIndex index={community.index} label={community.label} />
          <Display lead={community.titleLead} accent={community.titleAccent} size="xl" className="mt-4" />
          <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-muted">{community.body}</p>
          <div className="mt-8">
            <ButtonLink to={community.cta.to} variant="outline" icon="external">{community.cta.label}</ButtonLink>
          </div>
        </div>
        <div>
          <StoryCards />
          <p className="mt-5 text-[11px] text-muted">{community.note}</p>
        </div>
      </section>

      <section className={`${wrap} pt-24 md:pt-32`}>
        <div className="border-t border-line pt-16">
          <SectionIndex index={getInvolved.index} label={getInvolved.label} />
          <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <Display lead={getInvolved.titleLead} accent={getInvolved.titleAccent} size="xl" />
            <p className="max-w-md text-[1.02rem] leading-relaxed text-muted md:pb-4">{getInvolved.body}</p>
          </div>
          <div className="mt-12">
            <WaysGrid />
          </div>
          <div className="mt-16">
            <DonateBox />
          </div>
        </div>
      </section>

      <section className={`${wrap} grid gap-12 pt-24 md:grid-cols-[0.8fr_1.2fr] md:pt-32`}>
        <div>
          <SectionIndex index={shop.index} label={shop.label} />
          <Display lines={shop.titleLines.map((t) => ({ text: t }))} size="xl" className="mt-4" />
          <p className="mt-6 max-w-sm text-[1.02rem] leading-relaxed text-muted">{shop.body}</p>
          <div className="mt-8">
            <TextLink to="/shop">Shop the core collection</TextLink>
          </div>
          <p className="mt-10 max-w-sm text-[11px] text-muted">{shop.note}</p>
        </div>
        <ProductGrid products={shop.products.slice(0, 4)} columns="grid-cols-2" />
      </section>

      <section className={`${wrap} pt-24 md:pt-32`}>
        <Reveal>
          <NewsletterPanel />
        </Reveal>
        <p className="mt-6 flex items-center gap-2 text-xs text-muted">
          <ArrowUpRight className="h-3.5 w-3.5" /> Everything here is free to read and share.
        </p>
      </section>
    </>
  );
}
