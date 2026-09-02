import Aurora from '@react-bits/Backgrounds/Aurora/Aurora';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
import BlurText from '@react-bits/TextAnimations/BlurText/BlurText';
import ShinyText from '@react-bits/TextAnimations/ShinyText/ShinyText';
import SpotlightCard from '@react-bits/Components/SpotlightCard/SpotlightCard';
import FadeContent from '@react-bits/Animations/FadeContent/FadeContent';

const features = [
  {
    title: 'Backgrounds',
    body: 'Aurora, Particles, Light Rays, Silk and 40+ more animated backgrounds for hero sections.'
  },
  {
    title: 'Text Animations',
    body: 'Split, blur, shiny, gradient and typewriter headings that draw attention without slowing the page.'
  },
  {
    title: 'Components',
    body: 'Spotlight cards, carousels, docks, navigation menus, steppers and galleries ready to drop in.'
  },
  {
    title: 'Animations',
    body: 'Fade-ins, hover glows, cursor effects and scroll reveals to add polish to any section.'
  }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 h-[70vh]">
        <Aurora colorStops={['#5227FF', '#7cff67', '#5227FF']} amplitude={1.0} blend={0.6} speed={0.8} />
      </div>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-32 pb-20 text-center">
        <ShinyText
          text="React Bits is wired up and ready"
          className="mb-6 text-xs font-semibold tracking-[0.3em] uppercase"
          speed={3}
        />
        <SplitText
          text="Build stunning websites, fast."
          tag="h1"
          className="text-5xl font-bold tracking-tight md:text-7xl"
          splitType="chars"
          delay={40}
          duration={0.9}
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
        />
        <BlurText
          text="171 animated, customizable components are vendored into this repo. Every new site starts from here."
          className="mt-6 max-w-2xl justify-center text-lg text-white/70"
          animateBy="words"
          delay={60}
        />
        <FadeContent delay={800} duration={800} blur>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="https://reactbits.dev"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Browse the component gallery
            </a>
            <a
              href="https://github.com/DavidHDev/react-bits"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Source on GitHub
            </a>
          </div>
        </FadeContent>
      </section>

      <section className="relative z-10 mx-auto grid max-w-5xl gap-6 px-6 pb-32 md:grid-cols-2">
        {features.map((f, i) => (
          <FadeContent key={f.title} delay={i * 120} duration={700}>
            <SpotlightCard className="h-full" spotlightColor="rgba(124, 255, 103, 0.18)">
              <h2 className="text-xl font-semibold">{f.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{f.body}</p>
            </SpotlightCard>
          </FadeContent>
        ))}
      </section>
    </main>
  );
}
