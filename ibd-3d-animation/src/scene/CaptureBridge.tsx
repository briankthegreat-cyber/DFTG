import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { debugHandles, registerAdvance } from './capture.ts';

/** Lets the capture API step this canvas one frame at a time (frameloop="demand"). */
export function CaptureBridge({ id }: { id: string }) {
  const advance = useThree((s) => s.advance);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    debugHandles[id] = { gl, scene, camera };
    // In demand mode a frame only renders when one has been requested, so request then step.
    return registerAdvance(id, (ts) => {
      invalidate();
      advance(ts, true);
    });
  }, [advance, invalidate, id, gl, scene, camera]);
  return null;
}
