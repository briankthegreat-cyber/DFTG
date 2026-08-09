import type { ReactNode } from 'react';

export interface PanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function Panel({
  title,
  actions,
  children,
  className,
  'aria-label': ariaLabel,
}: PanelProps) {
  return (
    <section className={className ? `aui-panel ${className}` : 'aui-panel'} aria-label={ariaLabel}>
      <header className="aui-panel__header">
        <h2 className="aui-panel__title">{title}</h2>
        {actions != null ? <div className="aui-panel__actions">{actions}</div> : null}
      </header>
      <div className="aui-panel__body">{children}</div>
    </section>
  );
}
