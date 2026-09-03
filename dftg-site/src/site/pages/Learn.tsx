import { guides, learn, org } from '../data';
import { ComparisonTable, ConditionCards, ExplainerTeaser } from '../components/sections';
import { Display, Eyebrow, Reveal, Tag } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';

export default function Learn() {
  return (
    <>
      <section className={`${wrap} pt-14 md:pt-20`}>
        <Eyebrow rule>{learn.eyebrow}</Eyebrow>
        <Display as="h1" lead="Start with" accent="understanding." size="xl" className="mt-6" />
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">{learn.body}</p>
      </section>

      <section className={`${wrap} pt-14`}>
        <ConditionCards />
        <div className="mt-6">
          <Reveal>
            <ComparisonTable />
          </Reveal>
        </div>
      </section>

      <section className={`${wrap} pt-20`}>
        <Reveal>
          <ExplainerTeaser />
        </Reveal>
      </section>

      <section id="guides" className={`${wrap} scroll-mt-24 pt-24`}>
        <Eyebrow>Guides</Eyebrow>
        <Display lead="Short reads for" accent="real questions." size="lg" className="mt-3" />
        <div className="mt-10 divide-y divide-line border-y border-line">
          {guides.map((g, i) => (
            <details key={g.slug} id={`guide-${g.slug}`} open={i === 0} className="group scroll-mt-28 py-6">
              <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="flex flex-wrap items-center gap-3">
                  <Tag>{g.tag}</Tag>
                  <span className="text-xs text-muted">{g.minutes}-minute read</span>
                </span>
                <span className="text-lg text-forest transition-transform duration-300 group-open:rotate-45">+</span>
                <span className="font-display block w-full text-[1.9rem] leading-[1.1] text-forest">{g.title}</span>
              </summary>
              <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted">{g.blurb}</p>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {g.sections.map((s) => (
                  <div key={s.heading}>
                    <h3 className="font-display text-xl text-forest">{s.heading}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/80">{s.body}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">{org.reviewNote}</p>
      </section>
    </>
  );
}
