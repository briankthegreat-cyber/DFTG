import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
import AnimatedContent from '@react-bits/Animations/AnimatedContent/AnimatedContent';
import StarBorder from '@react-bits/Animations/StarBorder/StarBorder';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Magnet from '@react-bits/Animations/Magnet/Magnet';
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow mb-4 ${className}`}>{children}</p>;
}

export function Title({
  text,
  as = 'h2',
  className = '',
  align = 'left',
  splitType = 'words'
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  align?: 'left' | 'center';
  splitType?: 'chars' | 'words' | 'lines';
}) {
  return (
    <SplitText
      text={text}
      tag={as}
      textAlign={align}
      splitType={splitType}
      delay={splitType === 'chars' ? 25 : 70}
      duration={1}
      ease="power3.out"
      from={{ opacity: 0, y: 36, rotateX: -35 }}
      to={{ opacity: 1, y: 0, rotateX: 0 }}
      threshold={0.15}
      className={`font-display font-medium leading-[1.05] tracking-[-0.01em] ${className}`}
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  className = '',
  direction = 'vertical',
  distance = 60
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  distance?: number;
}) {
  return (
    <AnimatedContent
      distance={distance}
      direction={direction}
      duration={1}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      scale={0.98}
      threshold={0.15}
      delay={delay}
      className={className}
    >
      {children}
    </AnimatedContent>
  );
}

type ButtonProps = {
  to: string;
  children: ReactNode;
  variant?: 'gold' | 'ghost';
  className?: string;
};

export function Button({ to, children, variant = 'gold', className = '' }: ButtonProps) {
  const external = /^(https?:|tel:|mailto:|#)/.test(to);
  const inner =
    variant === 'gold' ? (
      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e8cf95] via-[#d8b46a] to-[#b8934f] px-7 py-3.5 text-sm font-semibold text-[#1f1b16] shadow-[0_14px_40px_-12px_rgba(184,147,79,0.7)] transition-transform duration-300 hover:scale-[1.03]">
        {children}
        <ArrowRight className="h-4 w-4" />
      </span>
    ) : (
      <StarBorder as="span" color="#b8934f" speed="5s" thickness={1} backgroundColor="#ffffff" textColor="#1f1b16" borderColor="rgba(184,147,79,0.35)" className="transition-transform duration-300 hover:scale-[1.03]">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">{children}</span>
      </StarBorder>
    );
  if (external) {
    return (
      <a href={to} className={`inline-block ${className}`} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={`inline-block ${className}`}>
      {inner}
    </Link>
  );
}

export function Section({
  children,
  className = '',
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative mx-auto w-full max-w-7xl px-6 py-24 md:px-10 md:py-32 ${className}`}>
      {children}
    </section>
  );
}

export function Divider() {
  return <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />;
}

/** Heading whose letters float up as the user scrolls, scrubbed to scroll position. Words never break mid-word. */
export function FloatTitle({ text, className = '', align = 'left' }: { text: string; className?: string; align?: 'left' | 'center' }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = el.querySelectorAll<HTMLElement>('.fc');
    const tween = gsap.fromTo(
      chars,
      { opacity: 0, yPercent: 110, scaleY: 2.2, scaleX: 0.75, transformOrigin: '50% 0%' },
      {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger: 0.03,
        ease: 'back.inOut(2)',
        duration: 1,
        scrollTrigger: { trigger: el, start: 'center bottom+=40%', end: 'bottom bottom-=30%', scrub: true }
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [text]);
  const words = text.split(' ');
  return (
    <h2
      ref={ref}
      className={`font-display overflow-hidden pb-[0.18em] font-medium leading-[1.1] tracking-[-0.01em] ${align === 'center' ? 'text-center' : ''} ${className}`}
    >
      {words.map((w, i) => (
        <span key={i}>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c, j) => (
              <span key={j} className="fc inline-block">
                {c}
              </span>
            ))}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </h2>
  );
}

/** Wraps children in a hover magnet so buttons pull toward the cursor. */
export function MagnetWrap({ children }: { children: ReactNode }) {
  return (
    <Magnet padding={50} magnetStrength={5} wrapperClassName="inline-block">
      {children}
    </Magnet>
  );
}

/** Moves children vertically at a different rate than the page while scrolling. */
export function Parallax({ children, speed = 0.2, className = '' }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 160, speed * -160]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Soft gold orb that drifts with scroll, used as section decoration. */
export function Orb({ className = '', speed = 0.4 }: { className?: string; speed?: number }) {
  return (
    <Parallax speed={speed} className={`pointer-events-none absolute -z-10 ${className}`}>
      <div className="h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,187,133,0.55),rgba(217,187,133,0)_70%)] blur-2xl md:h-[28rem] md:w-[28rem]" />
    </Parallax>
  );
}
