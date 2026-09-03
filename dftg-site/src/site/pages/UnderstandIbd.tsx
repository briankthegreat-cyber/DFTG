import { useMemo } from 'react';
import { LazyExplainer } from '@/explainer/LazyExplainer.tsx';
import { ibdPage, org, related, seo } from '../data';
import { breadcrumbSchema, faqSchema, medicalPageSchema, useSeo, videoSchema } from '../seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { RelatedLinks } from '../components/RelatedLinks';
import { useExplainerCta } from '../components/sections';
import { ButtonLink, Display, Eyebrow, Faq, Reveal, SourceList } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function UnderstandIbd() {
  const cta = useExplainerCta();
  const crumbs = useMemo(() => [{ name: 'Home', path: '/' }, { name: 'Learn', path: '/learn' }, { name: 'Understand IBD', path: '/learn/ibd' }], []);
  const jsonLd = useMemo(() => [
    breadcrumbSchema(crumbs),
    medicalPageSchema({
      name: seo.ibd.title,
      description: seo.ibd.description,
      path: '/learn/ibd',
      conditions: [
        { name: 'Inflammatory bowel disease', alternateName: ['IBD'] },
        { name: 'Crohn’s disease' },
        { name: 'Ulcerative colitis' },
      ],
      sources: ibdPage.sources,
    }),
    faqSchema(ibdPage.faq),
    videoSchema(),
  ], [crumbs]);
  useSeo({ title: seo.ibd.title, description: seo.ibd.description, path: '/learn/ibd', image: seo.ibd.image, type: 'article', jsonLd });
  return (
    <>
      <section className={`${wrap} pt-8 md:pt-12`}>
        <Breadcrumbs items={crumbs} className="mb-8" />
        <Eyebrow rule>{ibdPage.eyebrow}</Eyebrow>
        <Display as="h1" lead={ibdPage.titleLead} accent={ibdPage.titleAccent} size="xl" className="mt-6" />
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">{ibdPage.intro}</p>
      </section>

      <section id="explainer" className={`${wrap} scroll-mt-24 pt-12`} aria-label="Inside the gut, 3D explainer">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-forest-deep shadow-[0_40px_80px_-40px_rgba(20,41,31,0.6)] sm:aspect-[16/10]">
          <LazyExplainer options={{ theme: 'dark', link: cta.link, cta: cta.cta }} />
        </div>
        <p className="mt-4 text-xs text-muted">{ibdPage.explainerNote}</p>
      </section>

      <section className={`${wrap} grid gap-12 pt-20 md:grid-cols-[0.3fr_0.7fr]`}>
        <nav aria-label="On this page" className="hidden md:block">
          <div className="sticky top-28">
            <p className="eyebrow mb-4">On this page</p>
            <ol className="space-y-2 text-sm">
              {ibdPage.sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${slug(s.heading)}`} className="text-muted transition hover:text-forest">{s.heading}</a>
                </li>
              ))}
              <li><a href="#faq" className="text-muted transition hover:text-forest">Questions people ask</a></li>
            </ol>
          </div>
        </nav>
        <div className="space-y-14">
          {ibdPage.sections.map((s) => (
            <Reveal key={s.heading} distance={24}>
              <article id={slug(s.heading)} className="scroll-mt-28">
                <h2 className="font-display text-[2rem] leading-[1.08] text-forest">{s.heading}</h2>
                <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink/80">{s.body}</p>
              </article>
            </Reveal>
          ))}
          <div id="faq" className="scroll-mt-28">
            <Eyebrow>Questions people ask</Eyebrow>
            <div className="mt-4">
              <Faq items={ibdPage.faq} />
            </div>
          </div>
          <div>
            <Eyebrow>Sources</Eyebrow>
            <div className="mt-3">
              <SourceList sources={ibdPage.sources} />
            </div>
            <p className="mt-6 max-w-[62ch] text-xs leading-relaxed text-muted">{org.disclaimer}</p>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-line pt-10">
            <ButtonLink to="/learn/ibs" variant="outline">Understand IBS</ButtonLink>
            <ButtonLink to="/community" variant="ghost">Read community stories</ButtonLink>
          </div>
        </div>
      </section>
      <RelatedLinks links={related.ibd} />
    </>
  );
}
