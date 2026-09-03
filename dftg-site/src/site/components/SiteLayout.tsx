import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Instagram, Mail, Menu, X } from 'lucide-react';
import { footer, nav, org } from '../data';
import { Wordmark } from './ui';

// ---------------------------------------------------------------------------
// Bag: a tiny client-side count so the shop feels alive before checkout exists.
// ---------------------------------------------------------------------------
interface BagContextValue {
  count: number;
  add: (slug: string) => void;
  toast: string | null;
}
const BagContext = createContext<BagContextValue>({ count: 0, add: () => {}, toast: null });
export const useBag = () => useContext(BagContext);

function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const add = useCallback((slug: string) => {
    setItems((prev) => [...prev, slug]);
    setToast('Added to your bag. Checkout opens at launch.');
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);
  const value = useMemo(() => ({ count: items.length, add, toast }), [items.length, add, toast]);
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useBag();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-3 md:px-10">
        <Link to="/" aria-label="Don’t Fret the Gut, home" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `text-[0.82rem] font-semibold transition-colors ${isActive ? 'text-peach' : 'text-forest hover:text-peach'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/shop" aria-label="Bag" className="hidden items-center gap-2 text-[0.82rem] font-semibold text-forest sm:flex">
            Bag
            <span className="grid h-6 min-w-6 place-items-center rounded-full border border-forest px-1 text-[0.68rem] tabular-nums">{count}</span>
          </Link>
          <Link to="/get-involved#donate" className="bg-forest px-5 py-2.5 text-[0.82rem] font-semibold text-ivory transition-colors hover:bg-forest-deep">
            Donate
          </Link>
          <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center text-forest md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Primary, mobile" className="border-t border-line bg-cream px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => `block py-2.5 font-display text-2xl ${isActive ? 'text-peach' : 'text-forest'}`}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <Link to="/shop" className="text-sm font-semibold text-forest">Bag ({count})</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Wordmark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{org.mission}</p>
          <div className="mt-6 flex gap-3">
            <a href={org.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-forest/25 p-2 text-forest transition hover:border-peach hover:text-peach">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={`mailto:${org.email}`} aria-label="Email" className="rounded-full border border-forest/25 p-2 text-forest transition hover:border-peach hover:text-peach">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
        {footer.columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="space-y-2 text-sm text-ink/75">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition hover:text-peach">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-5 py-6 md:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>{footer.fine}</p>
          <p>© {new Date().getFullYear()} {org.legalName} · Est. {org.established}</p>
        </div>
        <p className="mx-auto mt-3 max-w-[1400px] text-[11px] leading-relaxed text-muted/80">{org.disclaimer}</p>
      </div>
    </footer>
  );
}

function Toast() {
  const { toast } = useBag();
  if (!toast) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-forest px-5 py-2.5 text-sm text-ivory shadow-lg">
      {toast}
    </div>
  );
}

export function SiteLayout() {
  return (
    <BagProvider>
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </BagProvider>
  );
}
