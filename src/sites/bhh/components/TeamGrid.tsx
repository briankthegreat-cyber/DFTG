import GlareHover from '@react-bits/Animations/GlareHover/GlareHover';
import { team } from '../data';
import { Reveal } from './ui';

export default function TeamGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((m, i) => (
        <Reveal key={m.name} delay={i * 0.08}>
          <GlareHover
            width="100%"
            height="100%"
            background="rgba(12,16,32,0.8)"
            borderRadius="24px"
            borderColor="rgba(255,255,255,0.1)"
            glareColor="#d8b46a"
            glareOpacity={0.25}
            glareAngle={-35}
            glareSize={260}
            transitionDuration={900}
            className="h-full"
          >
            <div className="flex w-full flex-col items-start gap-5 p-7">
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="h-24 w-24 rounded-2xl object-cover" />
              ) : (
                <span className="font-display grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-[#1a1f36] to-[#0b0e1a] text-3xl text-gold-light ring-1 ring-gold/30">
                  {m.initials}
                </span>
              )}
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  {m.name}
                  {m.credential && <span className="ml-2 text-base text-gold">{m.credential}</span>}
                </h3>
                <p className="mt-1 text-xs tracking-[0.2em] text-gold/80 uppercase">{m.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{m.blurb}</p>
              </div>
            </div>
          </GlareHover>
        </Reveal>
      ))}
    </div>
  );
}
