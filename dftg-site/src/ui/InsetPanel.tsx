import { UI_TEXT } from '@/ibd/content.ts';
import { stateAt } from '@/ibd/timeline.ts';
import { InsetCanvas } from '@/scene/InsetCanvas.tsx';
import { useSceneContext } from '@/scene/scene-context.ts';
import { usePlayer } from '@/store/player.ts';

const NOTES = {
  none: '',
  uc: 'Inflammation stays in the inner lining.',
  crohns: 'Inflammation goes through the whole wall, and the channel narrows.',
} as const;

const LAYER_COLORS = ['#e79c90', '#f4dcc8', '#c97a70', '#f7f0e6'];

export function InsetPanel() {
  const mode = usePlayer((s) => stateAt(s.time).insetMode);
  const { options } = useSceneContext();
  if (!options.inset) return null;
  const visible = mode !== 'none';
  const involved = (i: number) => (mode === 'crohns' ? true : mode === 'uc' ? i === 0 : false);
  return (
    <aside
      aria-hidden={!visible}
      data-avoid-labels
      className={`pointer-events-auto absolute top-20 right-3 w-[6.5rem] transition-all duration-500 sm:static sm:w-[15.5rem] ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
    >
      <div className="glass overflow-hidden rounded-2xl">
        <div className="aspect-square w-full sm:h-40 sm:w-full">
          <InsetCanvas />
        </div>
        <div className="p-3">
          <p className="eyebrow !text-[10px]">{UI_TEXT.insetTitle}</p>
          <ul className="mt-1.5 hidden space-y-1 sm:block">
            {UI_TEXT.insetLayers.map((name, i) => (
              <li key={name} className={`flex items-center gap-2 text-[11px] transition-colors ${involved(i) ? 'font-semibold text-(--text)' : 'text-(--muted)'}`}>
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-black/20" style={{ background: involved(i) ? '#c92f2b' : LAYER_COLORS[i] }} />
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 hidden text-[11px] leading-snug text-(--muted) sm:block">{NOTES[mode]}</p>
        </div>
      </div>
    </aside>
  );
}
