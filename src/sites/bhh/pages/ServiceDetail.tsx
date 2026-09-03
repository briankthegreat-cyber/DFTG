import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, CalendarCheck, Phone } from 'lucide-react';
import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import { services, clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title, FloatTitle, Orb } from '../components/ui';
import ServiceCard from '../components/ServiceCard';
import Faq from '../components/Faq';

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = services.find(s => s.slug === slug);

  useEffect(() => {
    if (service) document.title = `${service.name} in Beverly Hills | Beverly Hills Health`;
  }, [service]);

  if (!service) return <Navigate to="/services" replace />;

  const Icon = service.icon;
  const related = services.filter(s => s.slug !== service.slug).slice(0, 3);

  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-60">
        <Aurora colorStops={service.colors} amplitude={1.1} blend={0.55} speed={0.7} lightMode />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-cream to-transparent" />
      </div>

      <Section className="relative pt-40 md:pt-48">
        <nav className="mb-8 text-xs tracking-[0.2em] text-ink/50 uppercase">
          <Link to="/" className="hover:text-gold">Home</Link> <span className="mx-2">/</span>
          <Link to="/services" className="hover:text-gold">Services</Link> <span className="mx-2">/</span>
          <span className="text-gold">{service.name}</span>
        </nav>
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
              <Icon className="h-6 w-6" />
            </span>
            <Title text={service.name} as="h1" className="text-5xl md:text-7xl" />
            <p className="mt-4 text-sm tracking-[0.25em] text-gold uppercase">{service.tagline}</p>
          </div>
          <Reveal>
            <p className="text-lg leading-relaxed text-ink/70">{service.short}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to={clinic.bookingHref}>
                <CalendarCheck className="h-4 w-4" /> Book now
              </Button>
              <Button to={clinic.phoneHref} variant="ghost">
                <Phone className="h-4 w-4" /> Call
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <Orb className="-top-10 -right-40" speed={0.35} />
        <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
          <Reveal>
            <Eyebrow>Overview</Eyebrow>
            {service.description.map(p => (
              <p key={p} className="mt-4 leading-relaxed text-ink/65">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={0.15}>
            <Eyebrow>What to expect</Eyebrow>
            <ul className="mt-4 grid gap-3">
              {service.highlights.map(h => (
                <li key={h} className="glass flex items-start gap-3 rounded-2xl p-4 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  <span className="text-ink/80">{h}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Common questions</Eyebrow>
            <FloatTitle text="Answers before you book." className="text-4xl md:text-5xl" />
          </div>
          <Reveal>
            <Faq items={service.faq} />
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="rounded-[34px] bg-gradient-to-br from-gold-light/70 via-gold-pale to-gold-light/70 p-[2px] shadow-[0_30px_80px_-40px_rgba(120,90,30,0.45)]">
          <div className="grain relative flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-white p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <p className="font-display text-3xl font-semibold md:text-4xl">Ready to get started with {service.name.toLowerCase()}?</p>
              <p className="mt-2 text-ink/60">Book online or call {clinic.phone}. Most new patients are seen within the week.</p>
            </div>
            <Button to={clinic.bookingHref}>
              <CalendarCheck className="h-4 w-4" /> Book an appointment
            </Button>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <Eyebrow>Related services</Eyebrow>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {related.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.08}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </Section>
    </main>
  );
}
