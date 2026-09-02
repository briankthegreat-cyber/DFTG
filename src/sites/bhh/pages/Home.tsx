import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, CalendarCheck, MapPin, Clock, ChevronDown } from 'lucide-react';
import LightRays from '@react-bits/Backgrounds/LightRays/LightRays';
import Particles from '@react-bits/Backgrounds/Particles/Particles';
import BlurText from '@react-bits/TextAnimations/BlurText/BlurText';
import RotatingText from '@react-bits/TextAnimations/RotatingText/RotatingText';
import ShinyText from '@react-bits/TextAnimations/ShinyText/ShinyText';
import CountUp from '@react-bits/TextAnimations/CountUp/CountUp';
import ScrollReveal from '@react-bits/TextAnimations/ScrollReveal/ScrollReveal';
import GradientText from '@react-bits/TextAnimations/GradientText/GradientText';
import ScrollStack, { ScrollStackItem } from '@react-bits/Components/ScrollStack/ScrollStack';
import TiltedCard from '@react-bits/Components/TiltedCard/TiltedCard';
import ElectricBorder from '@react-bits/Animations/ElectricBorder/ElectricBorder';
import { clinic, doctor, brand, featuredServices, services, pillars, steps, sampleTestimonials } from '../data';
import { Button, Eyebrow, Reveal, Section, Title, Divider } from '../components/ui';
import ServiceCard from '../components/ServiceCard';

const stats = [
  { value: doctor.years, suffix: '+', label: 'Years of physician experience' },
  { value: services.length, suffix: '', label: 'Services under one roof' },
  { value: 5, suffix: '', label: 'Days a week in clinic' },
  { value: 3, suffix: '', label: 'Ways to be seen: office, video, home' }
];

export default function Home() {
  useEffect(() => {
    document.title = 'Beverly Hills Health | Personalized Primary Care & Wellness';
  }, []);

  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#d8b46a"
            raysSpeed={0.9}
            lightSpread={1.1}
            rayLength={1.6}
            followMouse
            mouseInfluence={0.12}
            noiseAmount={0.06}
            distortion={0.03}
            className="h-full w-full"
          />
        </div>
        <div className="absolute inset-0 opacity-70">
          <Particles
            particleColors={['#ecd6a2', '#d8b46a', '#5ee7d3']}
            particleCount={140}
            particleSpread={12}
            speed={0.06}
            particleBaseSize={80}
            moveParticlesOnHover
            particleHoverFactor={0.6}
            alphaParticles
            disableRotation={false}
            className="h-full w-full"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink to-transparent" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-32 pb-24 text-center">
          <img src="/bhh/logo.svg" alt="" className="mb-6 h-16 w-16 drop-shadow-[0_0_30px_rgba(216,180,106,0.5)]" />
          <ShinyText text={brand.motto} className="mb-6 text-[0.7rem] font-semibold tracking-[0.4em] uppercase" speed={3} />
          <Title text={brand.headline} as="h1" align="center" splitType="chars" className="max-w-4xl text-5xl md:text-7xl lg:text-[5.5rem]" />
          <BlurText
            text={brand.mission}
            className="mt-8 max-w-2xl justify-center text-base leading-relaxed text-cream/70 md:text-lg"
            animateBy="words"
            delay={35}
          />
          <div className="mt-8 flex flex-col items-center gap-3 text-xs tracking-[0.2em] text-cream/60 uppercase sm:flex-row sm:text-sm">
            <span>Specializing in</span>
            <RotatingText
              texts={['Primary Care', 'Medical Weight Loss', 'IV Therapy', 'Emsculpt Neo', 'Telehealth', 'Geriatric Care']}
              mainClassName="overflow-hidden rounded-full bg-gold/15 px-4 py-1.5 whitespace-nowrap text-gold"
              staggerFrom="last"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              staggerDuration={0.02}
              splitLevelClassName="overflow-hidden pb-0.5"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2400}
            />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button to={clinic.bookingHref}>
              <CalendarCheck className="h-4 w-4" /> Book an appointment
            </Button>
            <Button to={clinic.phoneHref} variant="ghost">
              <Phone className="h-4 w-4" /> {clinic.phone}
            </Button>
          </div>
        </div>
        <a href="#intro" className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-cream/50 transition hover:text-gold" aria-label="Scroll">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </a>
      </section>

      {/* STATS */}
      <Section id="intro" className="!py-16">
        <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-4 md:p-10">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="text-center md:text-left">
                <p className="font-display text-5xl font-semibold text-gold-light">
                  <CountUp to={s.value} duration={1.6} />
                  {s.suffix}
                </p>
                <p className="mt-2 text-sm text-cream/55">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* PILLARS */}
      <Section className="!pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why patients stay</Eyebrow>
          <Title text="Medicine that knows your name." align="center" className="text-4xl md:text-6xl" />
          <p className="mt-6 text-cream/60">
            Beverly Hills Health is built around a single physician-led team, so you are never a stranger at your own doctor's office.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="glass grain relative h-full rounded-3xl p-7">
                <span className="font-display text-5xl text-gold/30">0{i + 1}</span>
                <h3 className="font-display mt-4 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Services</Eyebrow>
            <Title text="Primary care and modern wellness, in one place." className="max-w-2xl text-4xl md:text-6xl" />
          </div>
          <Link to="/services" className="text-sm font-semibold text-gold underline-offset-4 hover:underline">
            View all {services.length} services
          </Link>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {featuredServices.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.08}>
              <ServiceCard service={s} large />
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services
            .filter(s => !s.featured)
            .slice(0, 4)
            .map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.08}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
        </div>
      </Section>

      {/* PHILOSOPHY */}
      <Section className="!py-20">
        <Divider />
        <div className="mx-auto mt-16 max-w-4xl">
          <ScrollReveal
            enableBlur
            baseOpacity={0.08}
            baseRotation={2}
            blurStrength={6}
            textClassName="font-display text-3xl md:text-5xl leading-[1.25] font-medium text-cream"
          >
            Honest healthcare means telling you what you need, what you do not, and why. It means a doctor who reads your labs with you, answers the phone, and treats prevention as seriously as treatment.
          </ScrollReveal>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="!pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Your first visit</Eyebrow>
          <Title text="Simple from the first call." align="center" className="text-4xl md:text-6xl" />
        </div>
        <div className="mt-10">
          <ScrollStack useWindowScroll itemDistance={80} itemStackDistance={24} baseScale={0.88} stackPosition="18%" scaleEndPosition="8%">
            {steps.map(step => (
              <ScrollStackItem
                key={step.n}
                itemClassName="!bg-[#0c1020] !border !border-white/10 !shadow-[0_30px_80px_-30px_rgba(216,180,106,0.25)]"
              >
                <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <span className="font-display text-7xl text-gold/40">{step.n}</span>
                    <h3 className="font-display mt-2 text-3xl font-semibold md:text-4xl">{step.title}</h3>
                  </div>
                  <p className="max-w-md text-base leading-relaxed text-cream/65">{step.body}</p>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </Section>

      {/* DOCTOR */}
      <Section>
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal direction="horizontal" distance={80}>
            <div className="flex justify-center">
              <TiltedCard
                imageSrc={doctor.photo}
                altText={doctor.name}
                captionText={doctor.name}
                containerHeight="520px"
                containerWidth="100%"
                imageHeight="520px"
                imageWidth="400px"
                rotateAmplitude={10}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent
                overlayContent={
                  <span className="m-5 inline-block rounded-full bg-black/50 px-4 py-1.5 text-xs tracking-[0.2em] text-gold uppercase backdrop-blur">
                    {doctor.role}
                  </span>
                }
              />
            </div>
          </Reveal>
          <div>
            <Eyebrow>Meet your physician</Eyebrow>
            <Title text={doctor.name} className="text-4xl md:text-6xl" />
            <p className="mt-3 text-sm tracking-[0.2em] text-gold/80 uppercase">{doctor.board}</p>
            <p className="mt-6 leading-relaxed text-cream/65">{doctor.intro}</p>
            <ul className="mt-6 space-y-2 text-sm text-cream/60">
              <li>Medical degree, {doctor.school}</li>
              <li>Residency, {doctor.residency}</li>
              <li>{doctor.years}+ years in personalized and wellness medicine</li>
            </ul>
            <Button to="/about" variant="ghost" className="mt-8">
              About the practice
            </Button>
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="!py-16">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <Eyebrow>Patient voices</Eyebrow>
          <GradientText colors={['#ecd6a2', '#d8b46a', '#5ee7d3', '#d8b46a', '#ecd6a2']} animationSpeed={6} className="font-display text-4xl font-semibold md:text-5xl">
            Rated 5.0 by our patients
          </GradientText>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-amber-200 uppercase">
            Sample quotes below, replace with real reviews before launch
          </span>
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-6 hover:[animation-play-state:paused]">
            {[...sampleTestimonials, ...sampleTestimonials].map((t, i) => (
              <figure key={i} className="glass w-[340px] shrink-0 rounded-3xl p-7">
                <div className="text-gold">★★★★★</div>
                <blockquote className="font-display mt-4 text-xl leading-snug">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-xs tracking-[0.15em] text-cream/50 uppercase">
                  {t.name} · {t.context}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </Section>

      {/* VISIT / CTA */}
      <Section>
        <ElectricBorder color="#d8b46a" speed={0.8} chaos={0.4} borderRadius={32}>
          <div className="grain relative grid gap-10 overflow-hidden rounded-[32px] bg-[#0c1020] p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
            <div>
              <Eyebrow>Visit us</Eyebrow>
              <Title text="In the heart of Beverly Hills and West LA." className="text-4xl md:text-5xl" />
              <p className="mt-5 max-w-lg text-cream/60">
                A modern, calm clinic on Pico Boulevard with easy parking, short waits, and a team that knows you by name.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to={clinic.bookingHref}>
                  <CalendarCheck className="h-4 w-4" /> Request an appointment
                </Button>
                <Button to="/contact" variant="ghost">
                  Contact the clinic
                </Button>
              </div>
            </div>
            <div className="grid gap-5 text-sm">
              <div className="flex gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">Address</p>
                  <a href={clinic.address.mapsHref} target="_blank" rel="noreferrer" className="text-cream/60 hover:text-gold">
                    {clinic.address.line1}, {clinic.address.line2}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href={clinic.phoneHref} className="text-cream/60 hover:text-gold">{clinic.phone}</a>
                  <p className="text-cream/40">Fax {clinic.fax}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">Hours</p>
                  {clinic.hours.map(h => (
                    <p key={h.day} className="text-cream/60">
                      {h.day}: {h.time}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ElectricBorder>
      </Section>
    </main>
  );
}
