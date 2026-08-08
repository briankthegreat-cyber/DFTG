import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  hint?: string;
  children?: ReactNode;
}

export function EmptyState({ title, hint, children }: EmptyStateProps) {
  return (
    <div className="aui-empty">
      <p className="aui-empty__title">{title}</p>
      {hint ? <p className="aui-empty__hint">{hint}</p> : null}
      {children}
    </div>
  );
}
