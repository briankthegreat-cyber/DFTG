import { useState } from 'react';
import type { ReactNode, UIEvent } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  getKey,
  overscan = 6,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + overscan + 1);
  const visible = start < end ? items.slice(start, end) : [];

  return (
    <div
      className={className ? `aui-vlist ${className}` : 'aui-vlist'}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      onScroll={(event: UIEvent<HTMLDivElement>) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="aui-vlist__spacer" style={{ height: items.length * itemHeight }}>
        {visible.map((item, offset) => {
          const index = start + offset;
          return (
            <div
              key={getKey(item, index)}
              className="aui-vlist__row"
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
