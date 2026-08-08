import type { ReactNode } from 'react';

export interface BadgeProps {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
  title?: string;
}

export function Badge({ tone = 'neutral', children, title }: BadgeProps) {
  return (
    <span className={`aui-badge aui-badge--${tone}`} title={title}>
      {children}
    </span>
  );
}
