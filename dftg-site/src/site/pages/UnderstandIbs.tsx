import { ibsPage, org } from '../data';
import { ComparisonTable } from '../components/sections';
import { ButtonLink, Display, Eyebrow, Faq, Reveal, SourceList } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function UnderstandIbs() {
  return (
    <>
      <section className={`${wrap} pt-14 md:pt-20`}>
        <Eyebrow rule>{ibsPage.eyebrow}</Eyebrow>
        <Display as="h1" lead={ibsPage.titleLead} accent={ibsPage.titleAccent} size="xl" className="mt-6" />
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">{ibsPage.intro}</p>
      </section>

      <section className={`${wrap} grid gap-12 pt-16 md:grid-cols-[0.3fr_0.7fr]`}>
        <nav aria-label="On this page" className="hidden md:block">
          <div className="sticky top-28">
            <p className="eyebrow mb-4">On this page</p>
            <ol className="space-y-2 text-sm">
              {ibsPage.sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${slug(s.heading)}`} className="text-muted transition hover:text-forest">{s.heading}</a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <div className="space-y-14">
          {ibsPage.sections.map((s) => (
            <Reveal key={s.heading} distance={24}>
              <article id={slug(s.heading)} className="scroll-mt-28">
                <h2 className="font-display text-[2rem] leading-[1.08] text-forest">{s.heading}</h2>
                <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink/80">{s.body}</p>
              </article>
            </Reveal>
          ))}
          <ComparisonTable compact />
          <div>
            <Eyebrow>Questions people ask</Eyebrow>
            <div className="mt-4">
              <Faq items={ibsPage.faq} />
            </div>
          </div>
          <div>
            <Eyebrow>Sources</Eyebrow>
            <div className="mt-3">
              <SourceList sources={ibsPage.sources} />
            </div>
            <p className="mt-6 max-w-[62ch] text-xs leading-relaxed text-muted">{org.disclaimer}</p>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-line pt-10">
            <ButtonLink to="/learn/ibd" variant="outline">Understand IBD</ButtonLink>
            <ButtonLink to="/community" variant="ghost">Read community stories</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
