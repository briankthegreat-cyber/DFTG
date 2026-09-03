import { useMemo } from 'react';
import { BackSide, Color } from 'three';
import { STAGE_THEMES } from '@/ibd/config.ts';
import { useSceneContext } from './scene-context.ts';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uGlow;
  varying vec3 vDir;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    float t = smoothstep(-0.9, 0.9, vDir.y);
    vec3 col = mix(uBottom, uTop, t);
    float glow = pow(max(dot(vDir, normalize(vec3(0.15, 0.15, -1.0))), 0.0), 6.0);
    col = mix(col, uGlow, glow * 0.55);
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Large inverted sphere with a dithered gradient: the "stage" behind the anatomy. */
export function Backdrop() {
  const { theme } = useSceneContext();
  const uniforms = useMemo(() => {
    const t = STAGE_THEMES[theme];
    return {
      uTop: { value: new Color(t.bgTop) },
      uBottom: { value: new Color(t.bgBottom) },
      uGlow: { value: new Color(t.glow) },
    };
  }, [theme]);
  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[80, 32, 16]} />
      <shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
