import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, CalendarCheck, Phone } from 'lucide-react';
import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import ElectricBorder from '@react-bits/Animations/ElectricBorder/ElectricBorder';
import { services, clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title } from '../components/ui';
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]">
        <Aurora colorStops={service.colors} amplitude={1.1} blend={0.55} speed={0.7} />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <Section className="relative pt-40 md:pt-48">
        <nav className="mb-8 text-xs tracking-[0.2em] text-cream/50 uppercase">
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
            <p className="text-lg leading-relaxed text-cream/70">{service.short}</p>
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
        <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
          <Reveal>
            <Eyebrow>Overview</Eyebrow>
            {service.description.map(p => (
              <p key={p} className="mt-4 leading-relaxed text-cream/65">
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
                  <span className="text-cream/80">{h}</span>
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
            <Title text="Answers before you book." className="text-4xl md:text-5xl" />
          </div>
          <Reveal>
            <Faq items={service.faq} />
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <ElectricBorder color={service.colors[0]} speed={0.8} chaos={0.4} borderRadius={32}>
          <div className="grain relative flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-[#0c1020] p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <p className="font-display text-3xl font-semibold md:text-4xl">Ready to get started with {service.name.toLowerCase()}?</p>
              <p className="mt-2 text-cream/60">Book online or call {clinic.phone}. Most new patients are seen within the week.</p>
            </div>
            <Button to={clinic.bookingHref}>
              <CalendarCheck className="h-4 w-4" /> Book an appointment
            </Button>
          </div>
        </ElectricBorder>
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
