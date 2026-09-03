import { useState } from 'react';
import CountUp from '@react-bits/TextAnimations/CountUp/CountUp';
import { shop } from '../data';
import { ProductGrid } from '../components/sections';
import { Display, Eyebrow, Faq, Reveal, SectionIndex } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';
type Category = (typeof shop.categories)[number];

export default function Shop() {
  const [category, setCategory] = useState<Category>('All');
  const products = category === 'All' ? shop.products : shop.products.filter((p) => p.category === category);
  return (
    <>
      <section className={`${wrap} grid gap-12 pt-14 md:grid-cols-[0.75fr_1.25fr] md:pt-20`}>
        <div>
          <SectionIndex index={shop.index} label={shop.label} />
          <Display as="h1" lines={shop.titleLines.map((t) => ({ text: t }))} size="xl" className="mt-4" />
          <p className="mt-6 max-w-sm text-[1.02rem] leading-relaxed text-muted">{shop.body}</p>
          <p className="mt-8 max-w-sm text-[11px] text-muted">{shop.note}</p>
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
            <div role="tablist" aria-label="Category" className="flex flex-wrap gap-5">
              {shop.categories.map((c) => (
                <button key={c} role="tab" type="button" aria-selected={category === c} onClick={() => setCategory(c)} className={`text-sm transition-colors ${category === c ? 'text-forest underline underline-offset-8' : 'text-muted hover:text-forest'}`}>
                  {c}
                </button>
              ))}
            </div>
            <span className="text-[0.66rem] tracking-[0.2em] text-muted uppercase">{products.length} pieces</span>
          </div>
          <div className="mt-8">
            <ProductGrid products={products} columns="grid-cols-2" />
          </div>
        </div>
      </section>

      <section className={`${wrap} pt-24`}>
        <Reveal>
          <div className="grid gap-10 bg-forest p-8 text-ivory md:grid-cols-[0.5fr_0.5fr] md:p-14">
            <div>
              <p className="font-display text-[clamp(4rem,10vw,7rem)] leading-none">
                <CountUp to={shop.proceeds.stat} duration={1.4} />%
              </p>
              <p className="mt-2 max-w-xs text-sm text-ivory/80">{shop.proceeds.statLabel}</p>
            </div>
            <div>
              <div className="grid gap-6 sm:grid-cols-3">
                {shop.proceeds.pillars.map((p) => (
                  <div key={p.label} className="border-t border-ivory/30 pt-4">
                    <p className="text-[0.62rem] tracking-[0.2em] text-peach uppercase">{p.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ivory/85">{p.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-[11px] leading-relaxed text-ivory/60">{shop.proceeds.note}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className={`${wrap} max-w-3xl pt-20`}>
        <Eyebrow>Good to know</Eyebrow>
        <div className="mt-4">
          <Faq items={shop.faq} />
        </div>
      </section>
    </>
  );
}
