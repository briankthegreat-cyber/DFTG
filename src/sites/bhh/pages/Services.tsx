import { useEffect } from 'react';
import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import { services, clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title } from '../components/ui';
import ServiceCard from '../components/ServiceCard';

export default function Services() {
  useEffect(() => {
    document.title = 'Services | Beverly Hills Health';
  }, []);
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-60">
        <Aurora colorStops={['#d9bb85', '#2a9d8f', '#d9bb85']} amplitude={0.9} blend={0.5} speed={0.6} lightMode />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />
      </div>
      <Section className="relative pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Services</Eyebrow>
          <Title text="Everything your health needs, coordinated by one team." as="h1" align="center" className="text-5xl md:text-7xl" />
          <p className="mt-6 text-ink/60">
            Primary care, prevention, weight management, and wellness treatments, delivered in the office, by video, or at home.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 0.08}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button to={clinic.bookingHref}>Book an appointment</Button>
        </div>
      </Section>
    </main>
  );
}
