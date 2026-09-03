import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, CalendarCheck, MapPin, Clock, ChevronDown } from 'lucide-react';
import Silk from '@react-bits/Backgrounds/Silk/Silk';
import GradualBlur from '@react-bits/Animations/GradualBlur/GradualBlur';
import ScrollVelocity from '@react-bits/TextAnimations/ScrollVelocity/ScrollVelocity';
import Particles from '@react-bits/Backgrounds/Particles/Particles';
import BlurText from '@react-bits/TextAnimations/BlurText/BlurText';
import RotatingText from '@react-bits/TextAnimations/RotatingText/RotatingText';
import CountUp from '@react-bits/TextAnimations/CountUp/CountUp';
import ScrollReveal from '@react-bits/TextAnimations/ScrollReveal/ScrollReveal';
import GradientText from '@react-bits/TextAnimations/GradientText/GradientText';
import ScrollStack, { ScrollStackItem } from '@react-bits/Components/ScrollStack/ScrollStack';
import TiltedCard from '@react-bits/Components/TiltedCard/TiltedCard';
import ElectricBorder from '@react-bits/Animations/ElectricBorder/ElectricBorder';
import { clinic, doctor, brand, featuredServices, services, pillars, steps, sampleTestimonials } from '../data';
import { Button, Eyebrow, Reveal, Section, Title, Divider, FloatTitle, MagnetWrap, Parallax, Orb } from '../components/ui';
import ServiceCard from '../components/ServiceCard';
import Logo from '../components/Logo';

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
        <div className="absolute inset-0 opacity-70">
          <Silk speed={3} scale={1.1} color="#d9bb85" noiseIntensity={1.2} rotation={0.25} lightMode />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,246,238,0.35),rgba(250,246,238,0.9)_75%)]" />
        <div className="absolute inset-0 opacity-80">
          <Particles
            particleColors={['#b8934f', '#d9bb85']}
            particleCount={110}
            particleSpread={12}
            speed={0.05}
            particleBaseSize={70}
            moveParticlesOnHover
            particleHoverFactor={0.6}
            alphaParticles
            disableRotation={false}
            className="h-full w-full"
          />
        </div>
        <GradualBlur position="bottom" height="9rem" strength={2} divCount={6} curve="bezier" target="parent" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-32 pb-24 text-center">
          <div className="mb-10 drop-shadow-[0_10px_30px_rgba(184,147,79,0.35)]">
            <Logo className="w-[min(100%,560px)]" />
          </div>
          <Title text={brand.headline} as="h1" align="center" splitType="chars" className="max-w-4xl text-4xl md:text-6xl lg:text-7xl" />
          <BlurText
            text={brand.mission}
            className="mt-8 max-w-2xl justify-center text-base leading-relaxed text-ink/70 md:text-lg"
            animateBy="words"
            delay={35}
          />
          <div className="mt-8 flex flex-col items-center gap-3 text-xs tracking-[0.2em] text-ink/60 uppercase sm:flex-row sm:text-sm">
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
            <MagnetWrap>
              <Button to={clinic.bookingHref}>
                <CalendarCheck className="h-4 w-4" /> Book an appointment
              </Button>
            </MagnetWrap>
            <MagnetWrap>
              <Button to={clinic.phoneHref} variant="ghost">
                <Phone className="h-4 w-4" /> {clinic.phone}
              </Button>
            </MagnetWrap>
          </div>
        </div>
        <a href="#intro" className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-ink/50 transition hover:text-gold" aria-label="Scroll">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </a>
      </section>

      {/* TICKER: speeds up and reverses with scroll */}
      <div className="ticker relative -mt-6 border-y border-gold/15 bg-sand/60 py-4">
        <ScrollVelocity
          texts={[
            'Primary Care  ✦  Medical Weight Loss  ✦  IV Therapy  ✦  Emsculpt Neo  ✦  Annual Physicals  ✦  Telehealth  ✦  ',
            'Osteopathic Treatment  ✦  Podiatry  ✦  Geriatric Care  ✦  Pre-Op Clearance  ✦  House Calls  ✦  B12 Shots  ✦  '
          ]}
          velocity={60}
          numCopies={4}
          scrollerClassName="scroller text-gold/70"
          className="px-3"
        />
      </div>

      {/* STATS */}
      <Section id="intro" className="!py-16">
        <Orb className="-top-20 -left-32" speed={0.5} />
        <div className="grid gap-8 rounded-3xl border border-gold/20 card p-8 md:grid-cols-4 md:p-10">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className="text-center md:text-left">
                <p className="font-display text-5xl font-semibold text-gold">
                  <CountUp to={s.value} duration={1.6} />
                  {s.suffix}
                </p>
                <p className="mt-2 text-sm text-ink/55">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* PILLARS */}
      <Section className="!pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Why patients stay</Eyebrow>
          <FloatTitle text="Medicine that knows your name." align="center" className="text-4xl md:text-6xl" />
          <p className="mt-6 text-ink/60">
            Beverly Hills Health is built around a single physician-led team, so you are never a stranger at your own doctor's office.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="card grain relative h-full rounded-3xl p-7">
                <span className="font-display text-5xl text-gold/35">0{i + 1}</span>
                <h3 className="font-display mt-4 text-2xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services">
        <Orb className="top-10 -right-40" speed={0.35} />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Services</Eyebrow>
            <FloatTitle text="Primary care and modern wellness, in one place." className="text-4xl md:text-6xl" />
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
        <Orb className="top-0 -left-40" speed={0.3} />
        <Divider />
        <div className="mx-auto mt-16 max-w-4xl">
          <ScrollReveal
            enableBlur
            baseOpacity={0.08}
            baseRotation={2}
            blurStrength={6}
            textClassName="font-display text-3xl md:text-5xl leading-[1.25] font-medium text-ink"
          >
            Honest healthcare means telling you what you need, what you do not, and why. It means a doctor who reads your labs with you, answers the phone, and treats prevention as seriously as treatment.
          </ScrollReveal>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="!pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Your first visit</Eyebrow>
          <FloatTitle text="Simple from the first call." align="center" className="text-4xl md:text-6xl" />
        </div>
        <div className="mt-10">
          <ScrollStack useWindowScroll itemDistance={80} itemStackDistance={24} baseScale={0.88} stackPosition="18%" scaleEndPosition="8%">
            {steps.map(step => (
              <ScrollStackItem
                key={step.n}
                itemClassName="!bg-white !border !border-gold/20 !shadow-[0_30px_80px_-30px_rgba(120,90,30,0.35)]"
              >
                <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <span className="font-display text-7xl text-gold/40">{step.n}</span>
                    <h3 className="font-display mt-2 text-3xl font-semibold md:text-4xl">{step.title}</h3>
                  </div>
                  <p className="max-w-md text-base leading-relaxed text-ink/65">{step.body}</p>
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
            <Parallax speed={0.25} className="flex justify-center">
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
                  <span className="m-5 inline-block rounded-full bg-white/80 px-4 py-1.5 text-xs tracking-[0.2em] text-gold uppercase backdrop-blur">
                    {doctor.role}
                  </span>
                }
              />
            </Parallax>
          </Reveal>
          <div>
            <Eyebrow>Meet your physician</Eyebrow>
            <Title text={doctor.name} className="text-4xl md:text-6xl" />
            <p className="mt-3 text-sm tracking-[0.2em] text-gold/80 uppercase">{doctor.board}</p>
            <p className="mt-6 leading-relaxed text-ink/65">{doctor.intro}</p>
            <ul className="mt-6 space-y-2 text-sm text-ink/60">
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
          <GradientText colors={['#b8934f', '#d9bb85', '#2a9d8f', '#d9bb85', '#b8934f']} animationSpeed={6} className="font-display text-4xl font-semibold md:text-5xl">
            Rated 5.0 by our patients
          </GradientText>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-amber-800 uppercase">
            Sample quotes below, replace with real reviews before launch
          </span>
        </div>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-6 hover:[animation-play-state:paused]">
            {[...sampleTestimonials, ...sampleTestimonials].map((t, i) => (
              <figure key={i} className="card w-[340px] shrink-0 rounded-3xl p-7">
                <div className="text-gold">★★★★★</div>
                <blockquote className="font-display mt-4 text-xl leading-snug">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-xs tracking-[0.15em] text-ink/50 uppercase">
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
        <ElectricBorder color="#c9a86a" speed={0.8} chaos={0.4} borderRadius={32}>
          <div className="grain relative grid gap-10 overflow-hidden rounded-[32px] bg-white p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
            <div>
              <Eyebrow>Visit us</Eyebrow>
              <FloatTitle text="In the heart of Beverly Hills and West LA." className="text-4xl md:text-5xl" />
              <p className="mt-5 max-w-lg text-ink/60">
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
                  <a href={clinic.address.mapsHref} target="_blank" rel="noreferrer" className="text-ink/60 hover:text-gold">
                    {clinic.address.line1}, {clinic.address.line2}
                  </a>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href={clinic.phoneHref} className="text-ink/60 hover:text-gold">{clinic.phone}</a>
                  <p className="text-ink/40">Fax {clinic.fax}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">Hours</p>
                  {clinic.hours.map(h => (
                    <p key={h.day} className="text-ink/60">
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
