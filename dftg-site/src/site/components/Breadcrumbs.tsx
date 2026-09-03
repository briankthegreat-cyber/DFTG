import { Link } from 'react-router-dom';
import type { Crumb } from '../seo';

/** Breadcrumb trail for inner pages. Pair with breadcrumbSchema() in useSeo for structured data. */
export function Breadcrumbs({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-[0.72rem] font-medium tracking-wide text-muted ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-2">
              {item.path && !last ? (
                <Link to={item.path} className="transition hover:text-forest">{item.name}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-forest' : ''}>{item.name}</span>
              )}
              {!last && <span aria-hidden="true" className="text-peach">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
