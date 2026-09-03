import { community, org } from '../data';
import { StoryCards } from '../components/sections';
import { ButtonLink, Display, Eyebrow, Reveal } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';

export default function Community() {
  const share = community.share;
  const mailto = `mailto:${org.email}?subject=${encodeURIComponent('My story for Don’t Fret the Gut')}`;
  return (
    <>
      <section className={`${wrap} pt-14 md:pt-20`}>
        <Eyebrow rule>Community</Eyebrow>
        <Display as="h1" lead={community.titleLead} accent={community.titleAccent} size="xl" className="mt-6" />
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">{community.body}</p>
      </section>

      <section className={`${wrap} pt-14`}>
        <StoryCards />
        <p className="mt-5 text-[11px] text-muted">{community.note}</p>
      </section>

      <section id="share" className={`${wrap} scroll-mt-24 pt-20`}>
        <Reveal>
          <div className="grid gap-10 bg-ivory p-8 md:grid-cols-[1fr_1fr] md:p-14">
            <div>
              <Eyebrow>{share.title}</Eyebrow>
              <Display lead="Your words might be the ones" accent="someone needs." size="lg" className="mt-3" />
              <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-muted">{share.body}</p>
              <div className="mt-8">
                <ButtonLink to={mailto} icon="external">{share.cta}</ButtonLink>
              </div>
            </div>
            <div className="self-center">
              <p className="eyebrow">If it helps, start from one of these</p>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {share.prompts.map((p) => (
                  <li key={p} className="font-display py-4 text-2xl text-forest">{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
