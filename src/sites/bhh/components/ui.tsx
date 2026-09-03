import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
import AnimatedContent from '@react-bits/Animations/AnimatedContent/AnimatedContent';
import StarBorder from '@react-bits/Animations/StarBorder/StarBorder';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Magnet from '@react-bits/Animations/Magnet/Magnet';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
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

/**
 * Cards that stack as the page scrolls. Each card sticks below the top of the viewport while the
 * next one slides over it, and earlier cards ease back in scale. Native scrolling and GPU
 * transforms only, so it stays smooth.
 */
export function StackCards({ children, className = '' }: { children: ReactNode[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const total = children.length;
  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <StackCard key={i} index={i} total={total} progress={scrollYProgress}>
          {child}
        </StackCard>
      ))}
    </div>
  );
}

function StackCard({ index, total, progress, children }: { index: number; total: number; progress: MotionValue<number>; children: ReactNode }) {
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - index - 1) * 0.045]);
  const last = index === total - 1;
  return (
    <div className={`sticky flex items-start justify-center ${last ? 'h-auto pb-6' : 'h-[62vh] md:h-[58vh]'}`} style={{ top: `calc(14vh + ${index * 22}px)` }}>
      <motion.div
        style={{ scale, transformOrigin: 'top center' }}
        className="card grain relative w-full rounded-[32px] p-8 will-change-transform md:p-12"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * A framed statement whose words reveal as the reader scrolls. Wrap a phrase in *asterisks* to
 * set it in gold italic. Signed with a script signature to echo the logo lettering.
 */
export function Statement({
  text,
  eyebrow = 'Our promise',
  signature = 'Michael Katiraie',
  caption = 'Dr. Michael Katiraie, DO · Medical Director'
}: {
  text: string;
  eyebrow?: string;
  signature?: string;
  caption?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('.sw');
    const tween = gsap.fromTo(
      words,
      { opacity: 0.12, filter: 'blur(4px)', y: 6 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 45%', scrub: 0.6 }
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [text]);

  const words = tokenizeStatement(text);
  return (
    <div className="rounded-[34px] bg-gradient-to-br from-gold-light/70 via-gold-pale to-gold-light/70 p-[2px] shadow-[0_30px_80px_-40px_rgba(120,90,30,0.45)]">
      <div className="grain relative overflow-hidden rounded-[32px] bg-white/85 px-6 py-14 text-center backdrop-blur md:px-16 md:py-20">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,187,133,0.45),rgba(217,187,133,0)_70%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,187,133,0.4),rgba(217,187,133,0)_70%)] blur-2xl" />
        <img src="/bhh/mark.png" alt="" className="mx-auto mb-5 h-14 w-14" />
        <p className="eyebrow mb-8">{eyebrow}</p>
        <p ref={ref} className="font-display mx-auto max-w-4xl text-[1.75rem] leading-[1.3] font-normal text-ink md:text-[2.6rem]">
          {words.map((segs, i) => (
            <span key={i} className="sw inline-block">
              {segs.map((seg, j) => (
                <span key={j} className={seg.gold ? 'italic text-gold' : undefined}>
                  {seg.t}
                </span>
              ))}
              &nbsp;
            </span>
          ))}
        </p>
        <div className="mx-auto mt-10 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <p className="font-script mt-6 text-[2.6rem] leading-none text-gold md:text-[3.2rem]">{signature}</p>
        <p className="mt-3 text-[0.68rem] tracking-[0.3em] text-ink/55 uppercase">{caption}</p>
      </div>
    </div>
  );
}

/** Splits statement text into words; asterisks toggle gold styling and punctuation stays attached to its word. */
function tokenizeStatement(text: string): { t: string; gold: boolean }[][] {
  const words: { t: string; gold: boolean }[][] = [];
  let word: { t: string; gold: boolean }[] = [];
  let buf = '';
  let gold = false;
  const flush = () => {
    if (buf) word.push({ t: buf, gold });
    buf = '';
  };
  for (const ch of text) {
    if (ch === '*') {
      flush();
      gold = !gold;
    } else if (ch === ' ') {
      flush();
      if (word.length) words.push(word);
      word = [];
    } else {
      buf += ch;
    }
  }
  flush();
  if (word.length) words.push(word);
  return words;
}
