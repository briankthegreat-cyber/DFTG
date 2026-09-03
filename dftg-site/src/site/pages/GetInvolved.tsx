import { getInvolved, org } from '../data';
import { DonateBox, WaysGrid } from '../components/sections';
import { Display, Eyebrow } from '../components/ui';

const wrap = 'mx-auto max-w-[1400px] px-5 md:px-10';

const detail = [
  { title: 'Volunteer', body: 'Help at events, moderate community spaces, translate guides, or lend a professional skill for an afternoon. Tell us what you are good at and how much time you have.' },
  { title: 'Partner', body: 'Clinics, campus groups, and brands can co-create education, host a talk, or sponsor a guide. We keep editorial independence and say so on anything we make together.' },
  { title: 'Fundraise', body: 'Birthday campaigns, a campus bake sale, a charity run. We will send you a kit with graphics, a short script, and a page to collect gifts once processing is live.' },
];

export default function GetInvolved() {
  return (
    <>
      <section className={`${wrap} pt-14 md:pt-20`}>
        <Eyebrow rule>{getInvolved.label}</Eyebrow>
        <Display as="h1" lead={getInvolved.titleLead} accent={getInvolved.titleAccent} size="xl" className="mt-6" />
        <p className="mt-6 max-w-2xl text-[1.08rem] leading-relaxed text-muted">{getInvolved.body}</p>
      </section>
      <section className={`${wrap} pt-14`}>
        <WaysGrid />
      </section>
      <section className={`${wrap} pt-16`}>
        <DonateBox id="donate" />
      </section>
      <section className={`${wrap} grid gap-8 pt-20 md:grid-cols-3`}>
        {detail.map((d) => (
          <article key={d.title} className="border-t border-forest pt-5">
            <h2 className="font-display text-3xl text-forest">{d.title}</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{d.body}</p>
            <a href={`mailto:${org.email}?subject=${encodeURIComponent(`${d.title}: Don’t Fret the Gut`)}`} className="link-underline mt-5">
              Email us about {d.title.toLowerCase()}
            </a>
          </article>
        ))}
      </section>
    </>
  );
}
