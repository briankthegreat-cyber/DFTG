import { useEffect } from 'react';
import { clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title } from '../components/ui';

const roles = ['Medical Assistant', 'Front Desk Coordinator', 'Nurse Practitioner / Physician Assistant', 'Billing Specialist'];

export default function Careers() {
  useEffect(() => {
    document.title = 'Careers | Beverly Hills Health';
  }, []);
  return (
    <main className="relative">
      <Section className="pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Careers</Eyebrow>
          <Title text="Join a team that patients trust." as="h1" align="center" className="text-5xl md:text-7xl" />
          <p className="mt-6 text-ink/60">
            We hire people who are kind under pressure, precise with details, and proud of the way patients are treated. If that is you, we would like to meet.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-4">
          {roles.map((r, i) => (
            <Reveal key={r} delay={i * 0.08}>
              <div className="card flex items-center justify-between rounded-2xl px-6 py-5">
                <span className="font-display text-2xl">{r}</span>
                <span className="text-xs tracking-[0.2em] text-gold uppercase">Ongoing interest</span>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-ink/60">To apply, call the office at {clinic.phone} and ask for the office manager.</p>
          <Button to={clinic.phoneHref} className="mt-6">
            Call about a role
          </Button>
        </div>
      </Section>
    </main>
  );
}
