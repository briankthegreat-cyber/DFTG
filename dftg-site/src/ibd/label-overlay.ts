// HTML labels anchored to points on the anatomy, with SVG leader lines and a
// low-frequency occlusion test so labels hide behind loops of bowel.

import { Raycaster, Vector3 } from 'three';
import type { Camera, Object3D } from 'three';
import { ALL_LABELS } from './content.ts';
import type { HotspotLabel } from './content.ts';
import { radiusProfile } from './anatomy-paths.ts';
import type { Curves } from './anatomy-paths.ts';
import { smoothstep } from './math-utils.ts';
import type { SceneState } from './timeline.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const OCCLUSION_INTERVAL = 0.12;

interface Entry {
  label: HotspotLabel;
  el: HTMLDivElement;
  line: SVGLineElement;
  dot: SVGCircleElement;
  anchor: Vector3;
  radius: number;
  occluded: boolean;
  alpha: number;
  width: number;
}

export interface LabelOverlay {
  resize(width: number, height: number): void;
  update(state: SceneState, dt: number, enabled: boolean): void;
  dispose(): void;
}

export function createLabelOverlay({ layer, curves, camera, occluders, avoid }: {
  layer: HTMLElement;
  curves: Curves;
  camera: Camera;
  occluders: () => Object3D[];
  /** Screen rectangles (relative to the layer) that labels must not sit on, e.g. the text card. */
  avoid?: () => DOMRect[];
}): LabelOverlay {
  layer.replaceChildren();
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'ibd-leaders');
  layer.appendChild(svg);

  const raycaster = new Raycaster();
  const world = new Vector3();
  const ndc = new Vector3();
  const toCamera = new Vector3();
  const entries: Entry[] = ALL_LABELS.map((label) => {
    const el = document.createElement('div');
    el.className = 'ibd-label';
    el.textContent = label.text;
    el.style.opacity = '0';
    layer.appendChild(el);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'ibd-leader');
    svg.appendChild(line);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('class', 'ibd-leader-dot');
    svg.appendChild(dot);
    curves[label.tube].getPointAt(label.u, world);
    return { label, el, line, dot, anchor: world.clone(), radius: radiusProfile(label.tube, label.u), occluded: false, alpha: 0, width: 0 };
  });

  let sinceOcclusion = 1;
  let width = 1;
  let height = 1;
  let avoidRects: DOMRect[] = [];
  const layerRect = { left: 0, top: 0 };

  function refreshAvoid(): void {
    const base = layer.getBoundingClientRect();
    layerRect.left = base.left;
    layerRect.top = base.top;
    avoidRects = avoid ? avoid() : [];
  }

  function overlapsAvoid(left: number, top: number, w: number, h: number): boolean {
    const l = left + layerRect.left - 6;
    const t = top + layerRect.top - 6;
    const r = l + w + 12;
    const b = t + h + 12;
    return avoidRects.some((a) => l < a.right && r > a.left && t < a.bottom && b > a.top);
  }

  function measure(entry: Entry): void {
    if (entry.width > 0) return;
    entry.width = entry.el.getBoundingClientRect().width;
  }

  function isOccluded(entry: Entry): boolean {
    toCamera.subVectors(camera.position, entry.anchor);
    const dist = toCamera.length();
    raycaster.set(entry.anchor, toCamera.normalize());
    raycaster.far = dist;
    const hits = raycaster.intersectObjects(occluders(), false);
    return hits.some((h) => h.distance > entry.radius * 1.6);
  }

  function hide(entry: Entry): void {
    if (entry.el.style.opacity !== '0') {
      entry.el.style.opacity = '0';
      entry.line.setAttribute('opacity', '0');
      entry.dot.setAttribute('opacity', '0');
    }
  }

  return {
    resize(w, h) {
      width = w;
      height = h;
      for (const entry of entries) entry.width = 0;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
    },
    update(state, dt, enabled) {
      sinceOcclusion += dt;
      const doOcclusion = sinceOcclusion > OCCLUSION_INTERVAL;
      if (doOcclusion) {
        sinceOcclusion = 0;
        refreshAvoid();
      }
      for (const entry of entries) {
        const { label } = entry;
        let target = 0;
        if (enabled && label.chapter === state.chapterId) {
          const win = smoothstep(label.appear, label.appear + 0.05, state.localT) * (1 - smoothstep(label.vanish - 0.04, label.vanish, state.localT));
          target = win * state.labelsVisible;
        }
        if (target > 0 && doOcclusion) entry.occluded = isOccluded(entry);
        if (entry.occluded) target = 0;
        entry.alpha += (target - entry.alpha) * Math.min(1, dt * 8);
        if (entry.alpha < 0.01 && target === 0) {
          hide(entry);
          continue;
        }
        ndc.copy(entry.anchor).project(camera);
        const behind = ndc.z > 1;
        const ax = (ndc.x * 0.5 + 0.5) * width;
        const ay = (1 - (ndc.y * 0.5 + 0.5)) * height;
        measure(entry);
        const w = entry.width || 120;
        const h = 28;
        const ly = ay - 42;
        // Prefer the authored side; flip if that would run off-screen or over a UI panel.
        const boxLeft = (side: number) => (side > 0 ? ax + 64 : ax - 64 - w);
        const fits = (side: number) => {
          const left = boxLeft(side);
          return left >= 4 && left + w <= width - 4 && !overlapsAvoid(left, ly - 14, w, h);
        };
        let side: number = label.side;
        if (!fits(side) && fits(-side)) side = -side;
        const lx = ax + side * 64;
        const left = boxLeft(side);
        const covered = !fits(side) || overlapsAvoid(ax - 4, ay - 4, 8, 8);
        const alpha = behind || covered ? 0 : entry.alpha;
        entry.el.style.opacity = alpha.toFixed(3);
        entry.el.style.transform = `translate(${left.toFixed(1)}px, ${(ly - 14).toFixed(1)}px) translateY(${((1 - alpha) * 6).toFixed(1)}px)`;
        entry.line.setAttribute('x1', ax.toFixed(1));
        entry.line.setAttribute('y1', ay.toFixed(1));
        entry.line.setAttribute('x2', lx.toFixed(1));
        entry.line.setAttribute('y2', ly.toFixed(1));
        entry.line.setAttribute('opacity', (alpha * 0.9).toFixed(3));
        entry.dot.setAttribute('cx', ax.toFixed(1));
        entry.dot.setAttribute('cy', ay.toFixed(1));
        entry.dot.setAttribute('opacity', alpha.toFixed(3));
      }
    },
    dispose() {
      layer.replaceChildren();
    },
  };
}
