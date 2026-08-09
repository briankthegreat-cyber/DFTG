import { useEffect, useSyncExternalStore } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Mesh } from 'three';
import { sceneCache } from '../scene-cache';
import { useSelectionStore } from '../state/selection';
import { publishPerf } from '../perf';
import type { AnatomyUserData } from '../registry';

export interface PickInfo {
  structureId: string;
  geometryId: string;
  bundleId: string;
  point: { x: number; y: number; z: number };
}

interface BundleGroupsProps {
  /** Return true to consume the pick (e.g. quiz mode) and skip default selection. */
  onPick?: (info: PickInfo) => boolean | void;
  hoverEnabled: boolean;
  onHoverInfo?: (info: { structureId: string; clientX: number; clientY: number } | null) => void;
}

function anatomyOf(event: ThreeEvent<PointerEvent | MouseEvent>): AnatomyUserData | null {
  const mesh = event.object as Mesh;
  const data = mesh.userData['anatomy'] as AnatomyUserData | undefined;
  if (!data || !data.selectable || !mesh.visible) return null;
  return data;
}

/** Mounts every loaded bundle's scene graph and wires real mesh picking. */
export function BundleGroups({ onPick, hoverEnabled, onHoverInfo }: BundleGroupsProps) {
  useSyncExternalStore(
    (cb) => sceneCache.subscribe(cb),
    () => sceneCache.getVersion(),
  );
  const select = useSelectionStore((s) => s.select);
  const setHovered = useSelectionStore((s) => s.setHovered);

  // When hover is disabled (touch devices, quiz mode) any stale hover state
  // must clear immediately — a leftover glow could hint a quiz answer.
  useEffect(() => {
    if (!hoverEnabled) {
      setHovered(null);
      onHoverInfo?.(null);
    }
  }, [hoverEnabled, setHovered, onHoverInfo]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // Ignore orbit drags that end on a mesh.
    if (event.delta > 4) return;
    const started = performance.now();
    const data = anatomyOf(event);
    if (!data) return;
    event.stopPropagation();
    const handled = onPick?.({
      structureId: data.structureId,
      geometryId: data.geometryId,
      bundleId: data.bundleId,
      point: { x: event.point.x, y: event.point.y, z: event.point.z },
    });
    if (handled !== true) {
      select(data.structureId, 'canvas');
    }
    publishPerf({ lastPickMs: Math.round((performance.now() - started) * 100) / 100 });
  };

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (!hoverEnabled || event.nativeEvent.pointerType === 'touch') return;
    const data = anatomyOf(event);
    if (!data) return;
    event.stopPropagation();
    setHovered(data.structureId);
    onHoverInfo?.({
      structureId: data.structureId,
      clientX: event.nativeEvent.clientX,
      clientY: event.nativeEvent.clientY,
    });
  };

  const handleOut = () => {
    // Unconditional: hover state must always be clearable even if hover was
    // disabled after the pointer entered a mesh.
    setHovered(null);
    onHoverInfo?.(null);
  };

  return (
    <>
      {sceneCache.all().map((scene) => (
        <primitive
          key={scene.bundleId}
          object={scene.group}
          onClick={handleClick}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
        />
      ))}
    </>
  );
}
