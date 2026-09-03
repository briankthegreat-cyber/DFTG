// Inset model: a slice of bowel wall showing its layers, and which layers each
// condition involves (UC: inner lining; Crohn's: full thickness, with narrowing).

import {
  BoxGeometry, CanvasTexture, Color, Group, LatheGeometry, Mesh, MeshStandardMaterial,
  RepeatWrapping, SphereGeometry, Vector2,
} from 'three';
import { mulberry32 } from './math-utils.ts';
import type { InsetMode, SceneState } from './timeline.ts';

const HEIGHT = 0.32;

export interface LayerSpec { key: string; healthy: string; uc: string; crohns: string }

export const LAYERS: readonly LayerSpec[] = [
  { key: 'mucosa', healthy: '#e79c90', uc: '#c92f2b', crohns: '#c23a37' },
  { key: 'submucosa', healthy: '#f4dcc8', uc: '#efc0b0', crohns: '#d9655c' },
  { key: 'muscularis', healthy: '#c97a70', uc: '#c97a70', crohns: '#9b2f3b' },
  { key: 'serosa', healthy: '#f7f0e6', uc: '#f7f0e6', crohns: '#d9a3a0' },
];

type Ring = [number, number];
const PROFILES: Record<'healthy' | 'uc' | 'crohns', Ring[]> = {
  healthy: [[0.55, 0.74], [0.74, 0.88], [0.88, 1.18], [1.18, 1.25]],
  uc: [[0.47, 0.74], [0.74, 0.9], [0.9, 1.18], [1.18, 1.25]],
  crohns: [[0.28, 0.6], [0.6, 0.86], [0.86, 1.36], [1.36, 1.44]],
};

function washerProfile([inner, outer]: Ring): Vector2[] {
  return [
    new Vector2(inner, -HEIGHT), new Vector2(outer, -HEIGHT),
    new Vector2(outer, HEIGHT), new Vector2(inner, HEIGHT), new Vector2(inner, -HEIGHT),
  ];
}

function bumpTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rng = mulberry32(7);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + rng() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 2);
  return tex;
}

export interface CrossSectionModel {
  group: Group;
  update(state: SceneState, time: number, dt: number, mode: InsetMode, animate: boolean): void;
  readonly amounts: { uc: number; crohns: number };
  dispose(): void;
}

export function createCrossSectionModel(): CrossSectionModel {
  const group = new Group();
  const bump = bumpTexture();
  const disposables: { dispose(): void }[] = [bump];

  const layers = LAYERS.map((layer, i) => {
    const geometry = new LatheGeometry(washerProfile(PROFILES.healthy[i]), 96);
    const ucGeo = new LatheGeometry(washerProfile(PROFILES.uc[i]), 96);
    const crohnsGeo = new LatheGeometry(washerProfile(PROFILES.crohns[i]), 96);
    geometry.morphAttributes.position = [ucGeo.getAttribute('position'), crohnsGeo.getAttribute('position')];
    const material = new MeshStandardMaterial({
      color: new Color(layer.healthy),
      roughness: layer.key === 'mucosa' ? 0.35 : 0.6,
      metalness: 0,
      bumpMap: layer.key === 'mucosa' ? bump : null,
      bumpScale: 0.6,
    });
    const mesh = new Mesh(geometry, material);
    mesh.morphTargetInfluences = [0, 0];
    group.add(mesh);
    disposables.push(geometry, ucGeo, crohnsGeo, material);
    return { ...layer, mesh, material, ucColor: new Color(layer.uc), crohnsColor: new Color(layer.crohns), healthyColor: new Color(layer.healthy) };
  });

  const rng = mulberry32(21);
  const ulcerMat = new MeshStandardMaterial({ color: new Color('#5a1119'), roughness: 0.4 });
  const ulcerGeo = new SphereGeometry(0.055, 12, 10);
  disposables.push(ulcerMat, ulcerGeo);
  const ulcers: Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const m = new Mesh(ulcerGeo, ulcerMat);
    const a = rng() * Math.PI * 2;
    const y = (rng() - 0.5) * HEIGHT * 1.6;
    m.position.set(Math.cos(a) * 0.48, y, Math.sin(a) * 0.48);
    m.scale.setScalar(0.001);
    group.add(m);
    ulcers.push(m);
  }
  const fissureMat = new MeshStandardMaterial({ color: new Color('#3c0c14'), roughness: 0.5 });
  const fissureGeo = new BoxGeometry(1.2, HEIGHT * 2.02, 0.05);
  disposables.push(fissureMat, fissureGeo);
  const fissure = new Mesh(fissureGeo, fissureMat);
  fissure.position.set(0.72, 0, 0);
  fissure.rotation.y = 0.6;
  fissure.scale.set(0.001, 1, 1);
  group.add(fissure);

  const tmpColor = new Color();
  const amounts = { uc: 0, crohns: 0 };

  return {
    group,
    amounts,
    update(state, time, dt, mode, animate) {
      const targetUc = mode === 'uc' ? state.uc : 0;
      const targetCrohns = mode === 'crohns' ? state.crohns : 0;
      const k = animate ? 1 - Math.exp(-dt * 3.5) : 1;
      amounts.uc += (targetUc - amounts.uc) * k;
      amounts.crohns += (targetCrohns - amounts.crohns) * k;
      const pulse = 1 + state.flare * 0.12 * Math.sin(time * 2.6);

      for (const layer of layers) {
        layer.mesh.morphTargetInfluences![0] = amounts.uc;
        layer.mesh.morphTargetInfluences![1] = amounts.crohns;
        tmpColor.copy(layer.healthyColor).lerp(layer.ucColor, amounts.uc).lerp(layer.crohnsColor, amounts.crohns);
        layer.material.color.copy(tmpColor);
        const glow = Math.max(amounts.uc * (layer.key === 'mucosa' ? 1 : 0), amounts.crohns) * 0.18 * pulse;
        layer.material.emissive.copy(tmpColor).multiplyScalar(glow);
      }
      ulcers.forEach((m, i) => m.scale.setScalar(Math.max(0.001, amounts.uc * (0.8 + 0.2 * Math.sin(time + i)))));
      fissure.scale.x = Math.max(0.001, amounts.crohns);
      if (animate) group.rotation.y = time * 0.18;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
