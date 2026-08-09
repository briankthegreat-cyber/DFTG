import type { ReactNode } from 'react';

export interface InlineNoticeProps {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  children: ReactNode;
}

export function InlineNotice({ tone = 'info', children }: InlineNoticeProps) {
  const role = tone === 'warning' || tone === 'danger' ? 'alert' : 'status';
  return (
    <div className={`aui-notice aui-notice--${tone}`} role={role}>
      {children}
    </div>
  );
}
