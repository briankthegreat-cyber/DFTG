import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SpotlightCard from '@react-bits/Components/SpotlightCard/SpotlightCard';
import type { Service } from '../data';

export default function ServiceCard({ service, large = false }: { service: Service; large?: boolean }) {
  const Icon = service.icon;
  return (
    <Link to={`/services/${service.slug}`} className="group block h-full">
      <SpotlightCard
        className={`h-full !border-white/10 !bg-[#0c1020]/80 backdrop-blur transition-transform duration-500 group-hover:-translate-y-1 group-hover:!border-gold/40 ${large ? 'md:p-10' : ''}`}
        spotlightColor="rgba(216, 180, 106, 0.22)"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
              <Icon className="h-5 w-5" />
            </span>
            <ArrowUpRight className="h-5 w-5 text-cream/30 transition group-hover:text-gold" />
          </div>
          <h3 className={`font-display mt-6 font-semibold ${large ? 'text-3xl' : 'text-2xl'}`}>{service.name}</h3>
          <p className="mt-1 text-xs tracking-[0.2em] text-gold/80 uppercase">{service.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-cream/60">{service.short}</p>
        </div>
      </SpotlightCard>
    </Link>
  );
}
