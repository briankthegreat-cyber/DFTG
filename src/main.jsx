import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, BookOpen, HeartHandshake, Megaphone, Menu, Minus, Plus, ShoppingBag, Sprout, Users, X } from 'lucide-react';
import './styles.css';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Learn', href: '#learn' },
  { label: 'Shop', href: '#shop' },
  { label: 'Impact', href: '#impact' },
  { label: 'Get Involved', href: '#get-involved' },
];

const educationTopics = [
  { title: 'Crohn’s Disease', description: 'A chronic inflammatory bowel disease that can affect any part of the digestive tract and often requires lifelong care.' },
  { title: 'Ulcerative Colitis', description: 'A form of inflammatory bowel disease that causes inflammation and ulcers in the lining of the colon and rectum.' },
  { title: 'IBS', description: 'Irritable bowel syndrome is a common gut-brain interaction condition that can affect comfort, routines, and quality of life.' },
  { title: 'Living With Gut Disease', description: 'Practical education on advocacy, symptom tracking, nutrition conversations, school, work, and emotional well-being.' },
];

const products = [
  { id: 1, name: 'Don’t Fret The Gut Hoodie', price: 58, description: 'Premium fleece hoodie with a calm awareness mark.' },
  { id: 2, name: 'Gut Health Matters Tee', price: 32, description: 'Soft cotton tee designed for everyday advocacy.' },
  { id: 3, name: 'More Than My Diagnosis Crewneck', price: 52, description: 'Cozy crewneck with an empowering patient-centered message.' },
  { id: 4, name: 'IBD Awareness Tote Bag', price: 24, description: 'Durable canvas tote for campaigns, clinics, and daily errands.' },
  { id: 5, name: 'Digestive Health Awareness Hat', price: 28, description: 'Minimal embroidered cap with a soft teal accent.' },
  { id: 6, name: 'Don’t Fret The Gut Sticker Pack', price: 12, description: 'A hopeful set of awareness stickers for laptops and journals.' },
];

function Button({ children, href, variant = 'primary', className = '', onClick }) {
  const styles = variant === 'secondary'
    ? 'border border-sky/35 bg-white/70 text-navy hover:border-teal/45 hover:bg-sky/10'
    : variant === 'ghost'
      ? 'bg-coral/12 text-coral-dark hover:bg-coral/20'
      : 'bg-navy text-white shadow-soft hover:-translate-y-0.5 hover:bg-navy-light';
  const shared = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${styles} ${className}`;
  if (href) return <a className={shared} href={href}>{children}</a>;
  return <button className={shared} onClick={onClick} type="button">{children}</button>;
}

function Navbar({ cartCount, onCartOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-navy/5 bg-cream/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8" aria-label="Main navigation">
        <a href="#home" className="flex items-center gap-3 font-semibold tracking-tight text-navy">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky/25 text-teal"><Sprout size={20} /></span>
          <span className="leading-tight">Don’t Fret<br className="sm:hidden" /> The Gut</span>
        </a>
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => <a key={link.href} className="text-sm font-medium text-navy/70 transition hover:text-navy" href={link.href}>{link.label}</a>)}
        </div>
        <div className="flex items-center gap-2">
          <button className="relative rounded-full border border-navy/10 bg-white p-3 text-navy shadow-card transition hover:-translate-y-0.5" onClick={onCartOpen} aria-label="Open cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-coral text-xs font-bold text-white">{cartCount}</span>}
          </button>
          <button className="rounded-full border border-navy/10 bg-white p-3 text-navy lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </nav>
      {open && <div className="border-t border-navy/5 bg-cream px-5 py-4 lg:hidden">{navLinks.map((link) => <a key={link.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-navy/75 hover:bg-white" href={link.href}>{link.label}</a>)}</div>}
    </header>
  );
}

function AbstractGutIllustration() {
  return <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-white to-sky/20 p-8 shadow-soft"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky/25 blur-3xl" /><div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-teal/15 blur-3xl" /><svg viewBox="0 0 420 360" className="relative z-10 h-full w-full"><path d="M213 42c-57 4-98 45-100 97-2 42 22 66 57 82 27 13 38 30 31 55-6 23-26 36-53 33" fill="none" stroke="#7bbfd4" strokeWidth="22" strokeLinecap="round"/><path d="M230 68c58 12 88 48 87 96-1 37-24 61-63 72-30 9-43 25-36 50 6 22 27 34 58 32" fill="none" stroke="#6aa58f" strokeWidth="22" strokeLinecap="round"/><path d="M154 133c25-20 77-27 115-2" fill="none" stroke="#e88973" strokeWidth="10" strokeLinecap="round" opacity=".75"/><circle cx="132" cy="80" r="18" fill="#f7d8ce"/><circle cx="309" cy="274" r="24" fill="#d6eef5"/><circle cx="104" cy="282" r="12" fill="#6aa58f" opacity=".35"/></svg><div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/70 bg-white/75 p-5 backdrop-blur"><p className="text-sm font-semibold text-navy">Compassionate education for every gut-health journey.</p></div></div>;
}

function Hero() {
  return <section id="home" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24"><div className="flex flex-col justify-center"><p className="mb-5 w-fit rounded-full bg-sky/20 px-4 py-2 text-sm font-semibold text-teal">IBD • IBS • Digestive health awareness</p><h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-navy sm:text-6xl lg:text-7xl">Don’t Fret The Gut Foundation</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-navy/68">Raising awareness, education, and support for people affected by Crohn’s disease, ulcerative colitis, IBS, and digestive health conditions.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href="#learn">Learn More <ArrowRight size={17} /></Button><Button href="#shop" variant="secondary">Shop Merch</Button><Button href="#get-involved" variant="ghost">Get Involved</Button></div></div><AbstractGutIllustration /></section>;
}

function FeatureCards() {
  const items = [{ icon: BookOpen, title: 'Education', text: 'Accessible information that helps patients, families, and communities understand digestive health.' }, { icon: Megaphone, title: 'Awareness', text: 'Campaigns that make invisible gut conditions easier to talk about with empathy and accuracy.' }, { icon: HeartHandshake, title: 'Community Support', text: 'Encouraging connection, advocacy, and hope for people navigating chronic symptoms.' }];
  return <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 md:grid-cols-3 lg:px-8">{items.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[1.75rem] border border-navy/6 bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-soft"><Icon className="mb-5 text-teal" size={28}/><h3 className="text-xl font-semibold text-navy">{title}</h3><p className="mt-3 leading-7 text-navy/65">{text}</p></article>)}</section>;
}

function MissionSection() { return <section className="bg-white/55 py-16"><div className="mx-auto max-w-4xl px-5 text-center lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.25em] text-teal">Our Mission</p><h2 className="mt-4 text-4xl font-semibold tracking-tight text-navy">Helping people feel less alone.</h2><p className="mt-6 text-lg leading-9 text-navy/70">Don’t Fret The Gut Foundation was created to help people feel less alone in their digestive health journey. Through education, awareness, advocacy, and community-driven support, we hope to make conversations about IBD, IBS, and gut health more open, informed, and compassionate.</p></div></section>; }

function AboutSection() { return <section id="about" className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div><p className="section-kicker">Why This Matters</p><h2 className="section-title">Digestive conditions can be isolating, misunderstood, and deeply personal.</h2><p className="section-copy">IBD, IBS, and other gut-related conditions can affect school, work, relationships, energy, nutrition, mental health, and daily confidence. Many people live with symptoms that others cannot see, making awareness and compassionate education essential.</p></div><div className="rounded-[2rem] border border-navy/6 bg-white p-6 shadow-soft sm:p-8"><div className="grid gap-6 sm:grid-cols-[180px_1fr]"><div className="grid aspect-square place-items-center rounded-[1.5rem] bg-gradient-to-br from-sky/25 to-teal/20 text-navy/50"><Users size={54}/></div><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-coral-dark">Founder Story</p><h3 className="mt-3 text-2xl font-semibold text-navy">Brian Katiraie</h3><p className="mt-4 leading-7 text-navy/68">Founded by a student and patient advocate passionate about digestive health awareness, patient education, and creating support for individuals living with gut-related conditions.</p></div></div></div></section>; }

function EducationCards() { return <section id="learn" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="max-w-3xl"><p className="section-kicker">Learn</p><h2 className="section-title">Clear, approachable education for digestive health awareness.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{educationTopics.map((topic) => <article key={topic.title} className="flex min-h-[310px] flex-col rounded-[1.5rem] border border-navy/6 bg-white p-6 shadow-card"><h3 className="text-xl font-semibold text-navy">{topic.title}</h3><p className="mt-4 flex-1 leading-7 text-navy/65">{topic.description}</p><Button variant="secondary" className="mt-6 w-fit py-2.5" href="#get-involved">Read More</Button><p className="mt-5 text-xs leading-5 text-navy/45">Educational content only, not medical advice.</p></article>)}</div></section>; }

function ProductCard({ product, onAdd }) { return <article className="group rounded-[1.5rem] border border-navy/6 bg-white p-4 shadow-card transition hover:-translate-y-1 hover:shadow-soft"><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-cream to-sky/25"><ShoppingBag className="text-teal/65 transition group-hover:scale-110" size={52}/></div><div className="p-2 pt-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-navy">{product.name}</h3><p className="font-semibold text-teal">${product.price}</p></div><p className="mt-3 min-h-12 text-sm leading-6 text-navy/62">{product.description}</p><Button className="mt-5 w-full" onClick={() => onAdd(product)}>Add to Cart</Button></div></article>; }

function CartDrawer({ open, items, onClose, onAdd, onRemove }) { const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]); return <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}><div className={`absolute inset-0 bg-navy/30 transition ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}/><aside className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream p-6 shadow-2xl transition duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold text-navy">Your Cart</h2><button onClick={onClose} className="rounded-full bg-white p-3 text-navy"><X size={18}/></button></div><div className="mt-8 flex-1 space-y-4 overflow-y-auto">{items.length === 0 ? <p className="rounded-3xl bg-white p-6 text-navy/60">Your cart is empty. Add merch to support awareness work.</p> : items.map((item) => <div key={item.id} className="rounded-3xl bg-white p-4 shadow-card"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-navy">{item.name}</h3><p className="text-sm text-navy/55">${item.price} each</p></div><p className="font-semibold text-teal">${item.price * item.quantity}</p></div><div className="mt-4 flex items-center gap-3"><button className="rounded-full border border-navy/10 p-2" onClick={() => onRemove(item.id)}><Minus size={14}/></button><span className="font-semibold text-navy">{item.quantity}</span><button className="rounded-full border border-navy/10 p-2" onClick={() => onAdd(item)}><Plus size={14}/></button></div></div>)}</div><div className="border-t border-navy/10 pt-5"><div className="mb-4 flex justify-between text-lg font-semibold text-navy"><span>Subtotal</span><span>${subtotal}</span></div><Button className="w-full">Checkout Coming Soon</Button></div></aside></div>; }

function ShopSection({ onAdd }) { return <section id="shop" className="bg-white/55 py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="section-kicker">Shop Merch</p><h2 className="section-title">Wear awareness with purpose.</h2></div><p className="max-w-xl leading-7 text-navy/65">Proceeds from merch help support awareness campaigns, educational resources, and digestive-health-related advocacy efforts.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd}/>)}</div></div></section>; }

function ImpactSection() { const items = ['Awareness campaigns', 'Educational resources', 'Community outreach']; return <section id="impact" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><p className="section-kicker">Where Support Goes</p><h2 className="section-title max-w-3xl">Every contribution helps make digestive health conversations more visible and compassionate.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{items.map((item, index) => <article key={item} className="rounded-[1.75rem] border border-navy/6 bg-white p-8 shadow-card"><span className="text-5xl font-semibold text-sky/70">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold text-navy">{item}</h3><p className="mt-3 leading-7 text-navy/64">Supporting practical, community-centered initiatives that increase awareness and reduce stigma.</p></article>)}</div></section>; }

function ContactForm() { return <form className="rounded-[2rem] border border-navy/6 bg-white p-6 shadow-soft sm:p-8" onSubmit={(e) => e.preventDefault()}><div className="grid gap-4 sm:grid-cols-2"><label className="form-label">Name<input className="form-input" placeholder="Your name" /></label><label className="form-label">Email<input className="form-input" type="email" placeholder="you@example.com" /></label></div><label className="form-label mt-4">Message<textarea className="form-input min-h-36 resize-none" placeholder="How would you like to get involved?" /></label><Button className="mt-6">Submit</Button></form>; }

function GetInvolvedSection() { const ways = ['Volunteer', 'Collaborate', 'Share Your Story', 'Donate / Support']; return <section id="get-involved" className="bg-sky/12 py-20"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div><p className="section-kicker">Get Involved</p><h2 className="section-title">Help build a more informed, supportive gut-health community.</h2><div className="mt-8 grid gap-3 sm:grid-cols-2">{ways.map((way) => <div key={way} className="rounded-2xl bg-white px-5 py-4 font-semibold text-navy shadow-card">{way}</div>)}</div></div><ContactForm /></div></section>; }

function Footer() { return <footer className="bg-navy px-5 py-12 text-white lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1fr]"><div><h2 className="text-2xl font-semibold">Don’t Fret The Gut Foundation</h2><p className="mt-3 text-white/65">Instagram: @dontfretthegut</p><p className="mt-6 max-w-xl text-sm leading-6 text-white/55">This website provides educational information only and does not replace professional medical advice.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">{navLinks.map((link) => <a key={link.href} className="text-sm text-white/70 transition hover:text-white" href={link.href}>{link.label}</a>)}</div></div></footer>; }

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const addToCart = (product) => { setCart((items) => { const existing = items.find((item) => item.id === product.id); if (existing) return items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); return [...items, { ...product, quantity: 1 }]; }); setCartOpen(true); };
  const removeFromCart = (id) => setCart((items) => items.flatMap((item) => item.id === id ? (item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []) : [item]));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <><Navbar cartCount={cartCount} onCartOpen={() => setCartOpen(true)} /><main><Hero /><FeatureCards /><MissionSection /><AboutSection /><EducationCards /><ShopSection onAdd={addToCart} /><ImpactSection /><GetInvolvedSection /></main><Footer /><CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onAdd={addToCart} onRemove={removeFromCart}/></>;
}

createRoot(document.getElementById('root')).render(<App />);
