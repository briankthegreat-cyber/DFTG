import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Phone, MapPin, Clock, X, Sparkles, Instagram, Facebook } from 'lucide-react';
import PillNav from '@react-bits/Components/PillNav/PillNav';
import ClickSpark from '@react-bits/Animations/ClickSpark/ClickSpark';
import ShinyText from '@react-bits/TextAnimations/ShinyText/ShinyText';
import { clinic, services, promo, brand } from '../data';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/about#team' },
  { label: 'Contact', href: '/contact' },
  { label: 'Book', href: clinic.bookingHref }
];

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function PromoToast() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="fixed right-4 bottom-4 left-4 z-[900] sm:left-auto sm:max-w-sm md:right-8 md:bottom-8">
      <div className="glass grain relative overflow-hidden rounded-2xl p-4 pr-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <button
          aria-label="Dismiss offer"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 rounded-full p-1 text-cream/60 transition hover:bg-white/10 hover:text-cream"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="eyebrow mb-1 flex items-center gap-2 text-[0.62rem]">
          <Sparkles className="h-3 w-3" /> {promo.label}
        </p>
        <p className="font-display text-xl font-semibold leading-tight">{promo.title}</p>
        <p className="mt-1 hidden text-xs text-cream/60 sm:block">{promo.body}</p>
        <Link to={promo.href} className="mt-3 inline-block text-xs font-semibold text-gold underline-offset-4 hover:underline">
          See the offer
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative mt-10 border-t border-white/10 bg-[#04060c]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img src="/bhh/logo.svg" alt="" className="h-10 w-10" />
            <span className="font-display text-2xl font-semibold">Beverly Hills Health</span>
          </Link>
          <ShinyText text={brand.motto} className="mt-4 block text-sm tracking-[0.25em] uppercase" speed={4} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/55">{clinic.tagline}</p>
          <div className="mt-6 flex gap-3">
            <a href={clinic.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-white/10 p-2 transition hover:border-gold hover:text-gold">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={clinic.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full border border-white/10 p-2 transition hover:border-gold hover:text-gold">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4">Services</p>
          <ul className="space-y-2 text-sm text-cream/70">
            {services.slice(0, 7).map(s => (
              <li key={s.slug}>
                <Link to={`/services/${s.slug}`} className="transition hover:text-gold">
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/services" className="text-gold">
                All services
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Clinic</p>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link to="/about" className="transition hover:text-gold">About</Link></li>
            <li><Link to="/about#team" className="transition hover:text-gold">Our team</Link></li>
            <li><Link to="/contact" className="transition hover:text-gold">Contact</Link></li>
            <li><Link to="/careers" className="transition hover:text-gold">Careers</Link></li>
            <li><a href={clinic.bookingHref} target="_blank" rel="noreferrer" className="transition hover:text-gold">Book online</a></li>
          </ul>
        </div>
        <div className="space-y-4 text-sm text-cream/70">
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <a href={clinic.address.mapsHref} target="_blank" rel="noreferrer" className="transition hover:text-gold">
              {clinic.address.line1}
              <br />
              {clinic.address.line2}
            </a>
          </p>
          <p className="flex items-center gap-3">
            <Phone className="h-4 w-4 shrink-0 text-gold" />
            <a href={clinic.phoneHref} className="transition hover:text-gold">{clinic.phone}</a>
          </p>
          <p className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              Mon – Fri, 9:00 AM – 5:00 PM
              <br />
              Sat – Sun, closed
            </span>
          </p>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-6 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} {clinic.legalName} All rights reserved. This site provides general information and is not a substitute for medical advice. If you are experiencing a medical emergency, call 911.
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  return (
    <ClickSpark sparkColor="#d8b46a" sparkSize={10} sparkRadius={22} sparkCount={8} duration={450}>
      <ScrollToTop />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[1000] flex h-0 justify-center">
        <div className="pointer-events-auto">
          <PillNav
            logo="/bhh/logo.svg"
            logoAlt="Beverly Hills Health"
            items={navItems}
            activeHref={pathname}
            baseColor="#0c1020"
            pillColor="#d8b46a"
            pillTextColor="#14110a"
            hoveredPillTextColor="#14110a"
            initialLoadAnimation
          />
        </div>
      </header>
      <Outlet />
      <Footer />
      <PromoToast />
    </ClickSpark>
  );
}
