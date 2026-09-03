import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import AnimatedContent from '@react-bits/Animations/AnimatedContent/AnimatedContent';
import SplitText from '@react-bits/TextAnimations/SplitText/SplitText';

/** Circular "dftg" monogram, drawn in CSS so it scales and recolors freely. */
export function Monogram({ className = 'h-11 w-11', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`font-display grid shrink-0 place-items-center rounded-full border italic leading-none ${dark ? 'border-ivory/70 text-ivory' : 'border-forest text-forest'} ${className}`}
      style={{ fontSize: 'calc(var(--mono-size, 1em) * 0.42)' }}
    >
      dftg
    </span>
  );
}

export function Wordmark({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Monogram dark={dark} className="h-11 w-11 text-[2.6rem]" />
      <span className={`font-display text-[1.05rem] leading-[1.05] ${dark ? 'text-ivory' : 'text-forest'}`}>
        Don’t Fret
        <br />
        the Gut
      </span>
    </span>
  );
}

export function Eyebrow({ children, rule = false, className = '', dark = false }: { children: ReactNode; rule?: boolean; className?: string; dark?: boolean }) {
  return <p className={`eyebrow ${rule ? 'eyebrow-rule' : ''} ${dark ? '!text-peach' : ''} ${className}`}>{children}</p>;
}

/** "01 / LEARN" section marker. Only used where the site really is a numbered sequence. */
export function SectionIndex({ index, label, className = '' }: { index: string; label: string; className?: string }) {
  return (
    <p className={`text-[0.66rem] font-semibold tracking-[0.3em] text-muted uppercase ${className}`}>
      {index} / {label}
    </p>
  );
}

type DisplaySize = 'hero' | 'xl' | 'lg' | 'md';
const displaySizes: Record<DisplaySize, string> = {
  hero: 'text-[clamp(3.4rem,9vw,7.5rem)]',
  xl: 'text-[clamp(2.9rem,6.4vw,5.6rem)]',
  lg: 'text-[clamp(2.4rem,4.6vw,4rem)]',
  md: 'text-[clamp(1.9rem,3.2vw,2.75rem)]',
};

/**
 * Display heading with an italic peach accent phrase, e.g. "Your gut story deserves to be" + "heard."
 * The lead animates in word by word (React Bits SplitText); the accent fades in after it.
 */
export function Display({
  lead,
  accent,
  as = 'h2',
  size = 'lg',
  className = '',
  animate = true,
  dark = false,
  lines,
}: {
  lead?: string;
  accent?: string;
  as?: 'h1' | 'h2' | 'h3';
  size?: DisplaySize;
  className?: string;
  animate?: boolean;
  dark?: boolean;
  /** Alternative: explicit lines, each optionally italic. */
  lines?: { text: string; accent?: boolean }[];
}) {
  const Tag = as;
  const color = dark ? 'text-ivory' : 'text-forest';
  if (lines) {
    return (
      <Tag className={`display ${displaySizes[size]} ${color} ${className}`}>
        {lines.map((l, i) => (
          <span key={i} className="block">
            {l.accent ? <em>{l.text}</em> : l.text}
          </span>
        ))}
      </Tag>
    );
  }
  return (
    <Tag className={`display ${displaySizes[size]} ${color} ${className}`}>
      {lead && animate ? (
        <SplitText
          text={lead}
          tag="span"
          className="block"
          splitType="words"
          delay={45}
          duration={0.9}
          ease="power3.out"
          from={{ opacity: 0, y: 28 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.05}
          rootMargin="0px"
          textAlign="left"
        />
      ) : (
        lead && <span className="block">{lead}</span>
      )}
      {accent && (
        <AnimatedContent distance={18} duration={0.9} ease="power3.out" delay={0.35} initialOpacity={0} animateOpacity threshold={0.05}>
          <em className="block">{accent}</em>
        </AnimatedContent>
      )}
    </Tag>
  );
}

/** Scroll reveal with the site's default easing. */
export function Reveal({ children, delay = 0, className = '', distance = 40 }: { children: ReactNode; delay?: number; className?: string; distance?: number }) {
  return (
    <AnimatedContent distance={distance} duration={0.9} ease="power3.out" initialOpacity={0} animateOpacity threshold={0.1} delay={delay} className={className}>
      {children}
    </AnimatedContent>
  );
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'peach';
const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-forest text-ivory hover:bg-forest-deep',
  outline: 'border border-forest text-forest hover:bg-forest hover:text-ivory',
  ghost: 'text-forest hover:bg-forest/5',
  peach: 'bg-peach text-forest-deep hover:bg-[#e2946c]',
};

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className = '',
  icon = 'arrow',
}: {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  icon?: 'arrow' | 'external' | 'none';
}) {
  const base = `inline-flex items-center gap-3 px-6 py-3.5 text-sm font-semibold transition-colors duration-200 ${buttonStyles[variant]} ${className}`;
  const Icon = icon === 'external' ? ArrowUpRight : ArrowRight;
  const external = /^(https?:|mailto:)/.test(to);
  const content = (
    <>
      <span>{children}</span>
      {icon !== 'none' && <Icon className="h-4 w-4" />}
    </>
  );
  return external ? (
    <a href={to} target={to.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className={base}>
      {content}
    </a>
  ) : (
    <Link to={to} className={base}>
      {content}
    </Link>
  );
}

export function TextLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  const external = /^(https?:|mailto:)/.test(to);
  const inner = (
    <>
      {children}
      <ArrowRight className="h-4 w-4" />
    </>
  );
  return external ? (
    <a href={to} className={`link-underline ${className}`} rel="noopener noreferrer">{inner}</a>
  ) : (
    <Link to={to} className={`link-underline ${className}`}>{inner}</Link>
  );
}

export function Tag({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-[0.64rem] font-semibold tracking-[0.14em] uppercase ${dark ? 'border-ivory/50 text-ivory' : 'border-forest/40 text-forest'}`}>
      {children}
    </span>
  );
}

export function Faq({ items, dark = false }: { items: { q: string; a: string }[]; dark?: boolean }) {
  return (
    <div className={`divide-y ${dark ? 'divide-ivory/15' : 'divide-line'} border-y ${dark ? 'border-ivory/15' : 'border-line'}`}>
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className={`flex cursor-pointer list-none items-center justify-between gap-6 text-[0.95rem] font-medium ${dark ? 'text-ivory' : 'text-forest'} [&::-webkit-details-marker]:hidden`}>
            {item.q}
            <span className="text-lg leading-none transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${dark ? 'text-ivory/70' : 'text-muted'}`}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Placeholder product art until real photos exist: a garment-coloured tile with the monogram. */
export function ProductArt({ color, name }: { color: 'onyx' | 'ivory' | 'forest' | 'midnight'; name: string }) {
  const bg = { onyx: '#26262a', ivory: '#efeae0', forest: '#1f3b2d', midnight: '#1d2438' }[color];
  const fg = color === 'ivory' ? '#1f3b2d' : 'rgba(250,247,241,0.85)';
  return (
    <div role="img" aria-label={`${name} placeholder`} className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: `linear-gradient(160deg, #d9d3c7 0%, #c9c2b4 100%)` }}>
      <div className="absolute inset-[12%] rounded-[22%_22%_8%_8%]" style={{ background: bg, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.45)' }} />
      <span className="font-display absolute inset-0 grid place-items-center text-[3.2rem] italic" style={{ color: fg }}>
        DFG
      </span>
    </div>
  );
}

export function SourceList({ sources }: { sources: { name: string; url: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:text-forest">
            {s.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
