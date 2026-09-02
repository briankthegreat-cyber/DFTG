import { useState } from 'react';

type Props = {
  /** 'lockup' = mark + script name + tagline (hero, footer). 'mark' = circle monogram only. */
  variant?: 'lockup' | 'mark';
  tone?: 'gold' | 'cream';
  className?: string;
  size?: number;
};

/**
 * Beverly Hills Health logo.
 * Drop the original artwork at public/bhh/logo-full.png and it is used automatically;
 * until then a vector recreation (monogram + script wordmark + tagline) renders instead.
 */
export default function Logo({ variant = 'lockup', tone = 'gold', className = '', size = 88 }: Props) {
  const [hasFile, setHasFile] = useState(true);
  const mark = tone === 'cream' ? '/bhh/mark-cream.svg' : '/bhh/mark.svg';

  if (variant === 'mark') {
    return <img src={mark} alt="Beverly Hills Health" width={size} height={size} className={className} />;
  }

  if (hasFile) {
    return (
      <img
        src="/bhh/logo-full.png"
        alt="Beverly Hills Health. Your health is our priority."
        onError={() => setHasFile(false)}
        className={`h-auto w-[min(100%,520px)] ${className}`}
      />
    );
  }

  const color = tone === 'cream' ? 'text-[#fffaf0]' : 'text-[#c9a86a]';
  return (
    <div className={`flex flex-col items-center ${color} ${className}`} role="img" aria-label="Beverly Hills Health. Your health is our priority.">
      <img src={mark} alt="" width={size} height={size} />
      <span className="font-script mt-1 text-[3.4rem] leading-none whitespace-nowrap sm:text-[4.6rem]">Beverly Hills Health</span>
      <span className="mt-2 text-[0.62rem] font-medium tracking-[0.42em] uppercase sm:text-[0.7rem]">Your health is our priority</span>
    </div>
  );
}
