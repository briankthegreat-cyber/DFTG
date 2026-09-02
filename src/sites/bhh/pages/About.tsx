import { useEffect } from 'react';
import Particles from '@react-bits/Backgrounds/Particles/Particles';
import ScrollReveal from '@react-bits/TextAnimations/ScrollReveal/ScrollReveal';
import { brand, doctor, pillars, clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title, Divider } from '../components/ui';
import TeamGrid from '../components/TeamGrid';

const milestones = [
  { label: 'Medical degree', value: doctor.school },
  { label: 'Residency', value: doctor.residency },
  { label: 'Certification', value: doctor.board },
  { label: 'Experience', value: `${doctor.years}+ years in personalized and wellness medicine` },
  { label: 'Beyond the clinic', value: 'Telehealth, house calls, and care at skilled nursing and assisted living facilities' }
];

export default function About() {
  useEffect(() => {
    document.title = 'About | Beverly Hills Health';
  }, []);
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] opacity-60">
        <Particles particleColors={['#ecd6a2', '#d8b46a']} particleCount={120} particleSpread={10} speed={0.05} particleBaseSize={70} alphaParticles className="h-full w-full" />
      </div>
      <Section className="relative pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>About the practice</Eyebrow>
          <Title text="Honest healthcare, built around you." as="h1" align="center" className="text-5xl md:text-7xl" />
          <p className="mt-6 text-cream/60">{brand.mission}</p>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal enableBlur baseOpacity={0.08} baseRotation={2} blurStrength={6} textClassName="font-display text-3xl md:text-5xl leading-[1.25] font-medium text-cream">
            We started Beverly Hills Health because good medicine had become hard to find: rushed visits, unreturned calls, and care split across strangers. We wanted one physician-led team that patients could actually reach.
          </ScrollReveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-14 md:grid-cols-[1fr_1fr]">
          <div>
            <Eyebrow>Medical Director</Eyebrow>
            <Title text={doctor.name} className="text-4xl md:text-6xl" />
            <p className="mt-6 leading-relaxed text-cream/65">{doctor.intro}</p>
            <Button to={clinic.bookingHref} className="mt-8">
              Book with Dr. Katiraie
            </Button>
          </div>
          <ol className="relative border-l border-gold/30 pl-8">
            {milestones.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.1}>
                <li className="relative mb-8">
                  <span className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-2 border-gold bg-ink shadow-[0_0_20px_rgba(216,180,106,0.6)]" />
                  <p className="eyebrow !mb-1">{m.label}</p>
                  <p className="font-display text-2xl">{m.value}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      <Section className="!pt-0">
        <Divider />
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="glass grain relative h-full rounded-3xl p-7">
                <h3 className="font-display text-2xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="team" className="!pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Our team</Eyebrow>
          <Title text="The people who know your name." align="center" className="text-4xl md:text-6xl" />
          <p className="mt-6 text-cream/60">Physicians, clinicians, and a front desk that answers the phone.</p>
        </div>
        <div className="mt-14">
          <TeamGrid />
        </div>
      </Section>
    </main>
  );
}
