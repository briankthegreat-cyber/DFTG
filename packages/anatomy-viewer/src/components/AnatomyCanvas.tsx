import { Component, useEffect, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { installBvh } from '../bvh';
import { useSelectionStore } from '../state/selection';
import { publishPerf } from '../perf';
import { sceneCache } from '../scene-cache';
import { BundleGroups, type PickInfo } from './BundleGroups';
import { CameraRig } from './CameraRig';
import { EffectsController, type StructureMetaResolver } from './EffectsController';
import { StructureLabels, type LabelEntry } from './StructureLabels';
import type { AnatomyAssetRegistry } from '../registry';

export type ViewerQuality = 'low' | 'medium' | 'high';

const QUALITY: Record<ViewerQuality, { dpr: number | [number, number]; antialias: boolean }> = {
  low: { dpr: 1, antialias: false },
  medium: { dpr: [1, 1.5], antialias: true },
  high: { dpr: [1, 2], antialias: true },
};

export interface AnatomyCanvasProps {
  registry: AnatomyAssetRegistry;
  resolveStructure: StructureMetaResolver;
  quality?: ViewerQuality;
  reducedMotion?: boolean;
  hoverEnabled?: boolean;
  onPick?: (info: PickInfo) => boolean | void;
  /** Return true to keep the current selection on empty-space clicks (quiz mode). */
  onEmptyClick?: () => boolean | void;
  onHoverInfo?: (info: { structureId: string; clientX: number; clientY: number } | null) => void;
  extraHighlightStructureIds?: string[];
  /** Quiz question phase: selection/hover highlights must not hint the answer. */
  suppressSelectionHighlight?: boolean;
  labels?: LabelEntry[];
  labelAnchorFor?: (structureId: string) => [number, number, number] | null;
  onLabelClick?: (structureId: string) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  children?: ReactNode;
}

function PerfProbe(): null {
  const gl = useThree((state) => state.gl);
  useFrame(() => {
    frameCount += 1;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      publishPerf({
        fps: frameCount * 2,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        loadedBundles: sceneCache.all().length,
      });
      frameCount = 0;
    }, 500);
    return () => clearInterval(interval);
  }, [gl]);
  return null;
}
let frameCount = 0;

interface BoundaryState {
  error: Error | null;
}

/** Catches render/runtime failures inside the 3D canvas without killing the app shell. */
export class ViewerErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  BoundaryState
> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override render(): ReactNode {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * The 3D viewport. Renders on demand (no continuous loop), recovers from
 * WebGL context loss, and keeps the orientation gizmo consistent with the
 * canonical coordinate contract (+X patient-left, +Y superior, +Z anterior).
 */
export function AnatomyCanvas({
  registry,
  resolveStructure,
  quality = 'medium',
  reducedMotion = false,
  hoverEnabled = true,
  onPick,
  onEmptyClick,
  onHoverInfo,
  extraHighlightStructureIds,
  suppressSelectionHighlight = false,
  labels = [],
  labelAnchorFor,
  onLabelClick,
  onContextLost,
  onContextRestored,
  children,
}: AnatomyCanvasProps) {
  installBvh();
  const clear = useSelectionStore((s) => s.clear);
  const qualityConfig = QUALITY[quality];

  return (
    <Canvas
      frameloop="demand"
      dpr={qualityConfig.dpr}
      gl={{ antialias: qualityConfig.antialias, powerPreference: 'high-performance' }}
      camera={{ fov: 45, near: 0.05, far: 60, position: [0, 1.4, 2.8] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          onContextLost?.();
        });
        gl.domElement.addEventListener('webglcontextrestored', () => {
          onContextRestored?.();
        });
      }}
      onPointerMissed={() => {
        const handled = onEmptyClick?.();
        if (handled !== true) clear();
      }}
    >
      <color attach="background" args={['#0b0d10']} />
      <hemisphereLight args={['#dfe8f5', '#20242c', 0.9]} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.4} />
      <directionalLight position={[-2.5, 1.5, -2]} intensity={0.35} />
      <BundleGroups onPick={onPick} hoverEnabled={hoverEnabled} onHoverInfo={onHoverInfo} />
      <EffectsController
        resolveStructure={resolveStructure}
        extraHighlightStructureIds={extraHighlightStructureIds}
        suppressSelectionHighlight={suppressSelectionHighlight}
      />
      <CameraRig registry={registry} reducedMotion={reducedMotion} />
      {labelAnchorFor ? (
        <StructureLabels entries={labels} anchorFor={labelAnchorFor} onLabelClick={onLabelClick} />
      ) : null}
      <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
        <GizmoViewport
          axisColors={['#8a5a5a', '#5a8a5f', '#5a6f8a']}
          labels={['L', 'S', 'A']}
          labelColor="#e8eaed"
        />
      </GizmoHelper>
      <PerfProbe />
      {children}
    </Canvas>
  );
}
