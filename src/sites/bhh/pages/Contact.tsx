import { useEffect } from 'react';
import { Phone, MapPin, Clock, CalendarCheck, Printer, Video } from 'lucide-react';
import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import { clinic } from '../data';
import { Button, Eyebrow, Reveal, Section, Title } from '../components/ui';

const mapSrc = 'https://www.google.com/maps?q=9200+W+Pico+Blvd,+Los+Angeles,+CA+90035&output=embed';

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact | Beverly Hills Health';
  }, []);
  const cards = [
    { icon: Phone, title: 'Call the office', body: clinic.phone, href: clinic.phoneHref, cta: 'Call now' },
    { icon: CalendarCheck, title: 'Book online', body: 'Same-week availability for new patients', href: clinic.bookingHref, cta: 'Request appointment' },
    { icon: MapPin, title: 'Visit', body: `${clinic.address.line1}, ${clinic.address.line2}`, href: clinic.address.mapsHref, cta: 'Get directions' },
    { icon: Video, title: 'Telehealth', body: 'Video visits for established and new patients across California', href: clinic.phoneHref, cta: 'Schedule a video visit' }
  ];
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]">
        <Aurora colorStops={['#5ee7d3', '#d8b46a', '#5ee7d3']} amplitude={0.8} blend={0.5} speed={0.5} />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>
      <Section className="relative pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Contact</Eyebrow>
          <Title text="We answer the phone." as="h1" align="center" className="text-5xl md:text-7xl" />
          <p className="mt-6 text-cream/60">Call, book online, or stop by. For emergencies, call 911.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="glass grain group relative block h-full rounded-3xl p-8 transition hover:border-gold/40">
                <c.icon className="h-6 w-6 text-gold" />
                <h3 className="font-display mt-5 text-3xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-cream/65">{c.body}</p>
                <p className="mt-5 text-sm font-semibold text-gold underline-offset-4 group-hover:underline">{c.cta}</p>
              </a>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <div className="glass grain relative h-full rounded-3xl p-8">
              <Clock className="h-6 w-6 text-gold" />
              <h3 className="font-display mt-5 text-3xl font-semibold">Hours</h3>
              <ul className="mt-4 space-y-2 text-cream/70">
                {clinic.hours.map(h => (
                  <li key={h.day} className="flex justify-between gap-6 border-b border-white/5 pb-2">
                    <span>{h.day}</span>
                    <span className={h.time === 'Closed' ? 'text-cream/40' : 'text-cream'}>{h.time}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-center gap-2 text-sm text-cream/50">
                <Printer className="h-4 w-4" /> Fax {clinic.fax}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full min-h-[360px] overflow-hidden rounded-3xl border border-white/10">
              <iframe title="Map to Beverly Hills Health" src={mapSrc} className="h-full min-h-[360px] w-full grayscale-[0.4] invert-[0.9] hue-rotate-180" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </Reveal>
        </div>
        <div className="mt-14 text-center">
          <Button to={clinic.bookingHref}>
            <CalendarCheck className="h-4 w-4" /> Request an appointment
          </Button>
        </div>
      </Section>
    </main>
  );
}
