import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  active?: boolean;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  active,
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  const classes = ['aui-btn', `aui-btn--${variant}`, `aui-btn--${size}`];
  if (active) classes.push('is-active');
  if (className) classes.push(className);
  return (
    <button
      type={type ?? 'button'}
      className={classes.join(' ')}
      aria-pressed={active === undefined ? undefined : active}
      {...rest}
    >
      {children}
    </button>
  );
}
