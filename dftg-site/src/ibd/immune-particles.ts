// Soft glowing "immune cell" motes that gather around inflamed bowel.

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, Points,
  ShaderMaterial, Vector3,
} from 'three';
import { inflammation } from './conditions.ts';
import type { TubeKey } from './conditions.ts';
import { radiusProfile } from './anatomy-paths.ts';
import type { Curves } from './anatomy-paths.ts';
import { mulberry32 } from './math-utils.ts';
import { TISSUE_COLORS } from './config.ts';
import type { SceneState } from './timeline.ts';

function createSpriteTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export interface ImmuneParticles {
  object: Points;
  update(state: SceneState, time: number, enabled: boolean): void;
  setViewportHeight(heightPx: number): void;
  dispose(): void;
}

export function createImmuneParticles({ curves, count }: { curves: Curves; count: number }): ImmuneParticles {
  const rng = mulberry32(1337);
  const tubes: TubeKey[] = ['smallIntestine', 'colon'];
  const anchors: { tube: TubeKey; u: number }[] = [];
  const base = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const alphas = new Float32Array(count);
  const sizes = new Float32Array(count);
  const point = new Vector3();

  for (let i = 0; i < count; i++) {
    const tube = tubes[rng() < 0.55 ? 0 : 1];
    const u = rng();
    const curve = curves[tube];
    curve.getPointAt(u, point);
    const tangent = curve.getTangentAt(u);
    const helper = Math.abs(tangent.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    const n = new Vector3().crossVectors(tangent, helper).normalize();
    const b = new Vector3().crossVectors(tangent, n).normalize();
    const angle = rng() * Math.PI * 2;
    const dist = radiusProfile(tube, u) * (1.35 + rng() * 1.1);
    const offset = n.multiplyScalar(Math.cos(angle) * dist).add(b.multiplyScalar(Math.sin(angle) * dist));
    base[i * 3 + 0] = point.x + offset.x;
    base[i * 3 + 1] = point.y + offset.y;
    base[i * 3 + 2] = point.z + offset.z + 0.15;
    anchors.push({ tube, u });
    seeds[i] = rng() * 100;
    sizes[i] = 0.12 + rng() * 0.16;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(base, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  geometry.setAttribute('aAlpha', new BufferAttribute(alphas, 1));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: createSpriteTexture() },
      uColor: { value: new Color(TISSUE_COLORS.particle) },
      uScale: { value: 600 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed; attribute float aAlpha; attribute float aSize;
      uniform float uTime; uniform float uScale;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.7 + aSeed) * 0.12;
        p.y += cos(uTime * 0.55 + aSeed * 1.3) * 0.12;
        p.z += sin(uTime * 0.9 + aSeed * 0.7) * 0.08;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aSeed * 3.1);
        vAlpha = aAlpha * twinkle;
        gl_PointSize = min(aSize * uScale / -mv.z, 26.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor * a * 1.9, a);
      }
    `,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute;
  const alphaArray = alphaAttr.array as Float32Array;

  return {
    object: points,
    update(state, time, enabled) {
      material.uniforms.uTime.value = time;
      const ambient = state.immune * 0.6;
      for (let i = 0; i < count; i++) {
        const { tube, u } = anchors[i];
        const inf = inflammation(tube, u, state).total;
        alphaArray[i] = enabled ? Math.min(1, ambient + state.immune * inf * 1.1 + inf * 0.35) : 0;
      }
      alphaAttr.needsUpdate = true;
      points.visible = enabled && (state.immune > 0.001 || state.crohns > 0.001 || state.uc > 0.001);
    },
    setViewportHeight(heightPx) {
      material.uniforms.uScale.value = heightPx * 0.9;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
