import { BrandBar } from './BrandBar.tsx';
import { ChapterCard } from './ChapterCard.tsx';
import { Controls } from './Controls.tsx';
import { InsetPanel } from './InsetPanel.tsx';

export function Overlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-3 sm:p-5">
      <BrandBar />
      <div className="flex-1" />
      <div className="flex items-end justify-between gap-4">
        <ChapterCard />
        <InsetPanel />
      </div>
      <Controls />
    </div>
  );
}
