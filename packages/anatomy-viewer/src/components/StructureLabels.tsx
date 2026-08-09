import { Html } from '@react-three/drei';

export interface LabelEntry {
  structureId: string;
  text: string;
}

const LABEL_BUDGET = 12;

interface StructureLabelsProps {
  entries: LabelEntry[];
  anchorFor: (structureId: string) => [number, number, number] | null;
  onLabelClick?: (structureId: string) => void;
}

/**
 * Optional label layer anchored to structure bounds. Budgeted so a dense
 * scene cannot flood the screen; label clicks select their structure and the
 * wrapper never intercepts orbit gestures.
 */
export function StructureLabels({ entries, anchorFor, onLabelClick }: StructureLabelsProps) {
  return (
    <>
      {entries.slice(0, LABEL_BUDGET).map((entry) => {
        const anchor = anchorFor(entry.structureId);
        if (!anchor) return null;
        return (
          <Html
            key={entry.structureId}
            position={anchor}
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <button
              type="button"
              className="anat-label"
              style={{ pointerEvents: 'auto' }}
              onClick={() => onLabelClick?.(entry.structureId)}
            >
              {entry.text}
            </button>
          </Html>
        );
      })}
    </>
  );
}
