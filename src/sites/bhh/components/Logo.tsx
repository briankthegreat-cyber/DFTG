type Props = {
  /** 'lockup' = full logo with wordmark and tagline. 'mark' = circle monogram only. */
  variant?: 'lockup' | 'mark';
  className?: string;
  size?: number;
};

/** Beverly Hills Health logo. Source artwork: public/bhh/logo-full.png (full) and public/bhh/mark.png (monogram). */
export default function Logo({ variant = 'lockup', className = '', size = 48 }: Props) {
  if (variant === 'mark') {
    return <img src="/bhh/mark.png" alt="Beverly Hills Health" width={size} height={size} className={`h-auto ${className}`} />;
  }
  return (
    <img
      src="/bhh/logo-full.png"
      alt="Beverly Hills Health. Your health is our priority."
      className={`h-auto w-[min(100%,520px)] ${className}`}
    />
  );
}
