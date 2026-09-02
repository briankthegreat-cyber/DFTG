import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SpotlightCard from '@react-bits/Components/SpotlightCard/SpotlightCard';
import type { Service } from '../data';

export default function ServiceCard({ service, large = false }: { service: Service; large?: boolean }) {
  const Icon = service.icon;
  return (
    <Link to={`/services/${service.slug}`} className="group block h-full">
      <SpotlightCard
        className={`h-full !border-gold/20 !bg-white/85 backdrop-blur transition-transform duration-500 group-hover:-translate-y-1 group-hover:!border-gold/40 ${large ? 'md:p-10' : ''}`}
        spotlightColor="rgba(184, 147, 79, 0.16)"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
              <Icon className="h-5 w-5" />
            </span>
            <ArrowUpRight className="h-5 w-5 text-ink/25 transition group-hover:text-gold" />
          </div>
          <h3 className={`font-display mt-6 font-semibold ${large ? 'text-3xl' : 'text-2xl'}`}>{service.name}</h3>
          <p className="mt-1 text-xs tracking-[0.2em] text-gold/80 uppercase">{service.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-ink/60">{service.short}</p>
        </div>
      </SpotlightCard>
    </Link>
  );
}
