import type { ReactNode } from 'react';

export interface KeyValueListProps {
  items: { key: string; value: ReactNode }[];
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="aui-kv">
      {items.map((item) => (
        <div className="aui-kv__row" key={item.key}>
          <dt className="aui-kv__key">{item.key}</dt>
          <dd className="aui-kv__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
