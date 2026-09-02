import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';
import AnimatedContent from '@react-bits/Animations/AnimatedContent/AnimatedContent';
import StarBorder from '@react-bits/Animations/StarBorder/StarBorder';

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
      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e8cf95] via-[#d8b46a] to-[#b8893f] px-7 py-3.5 text-sm font-semibold text-[#14110a] shadow-[0_10px_40px_-10px_rgba(216,180,106,0.6)] transition-transform duration-300 hover:scale-[1.03]">
        {children}
        <ArrowRight className="h-4 w-4" />
      </span>
    ) : (
      <StarBorder as="span" color="#d8b46a" speed="5s" thickness={1} className="transition-transform duration-300 hover:scale-[1.03]">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-cream">{children}</span>
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
