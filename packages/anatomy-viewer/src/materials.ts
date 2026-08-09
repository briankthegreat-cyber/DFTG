import { Color, type Material, type Mesh, MeshStandardMaterial } from 'three';

/**
 * Reversible material effects. Original materials are never mutated: the first
 * time a mesh needs a non-pristine look we lazily clone its material(s) into a
 * working set; reverting swaps the original back exactly. Clones are created
 * per-mesh (not per shared material) so per-structure fade/highlight works.
 */

export interface EffectState {
  hidden: boolean;
  highlighted: boolean;
  hovered: boolean;
  /** Opacity override for "fade others"; null = no fade. */
  fade: number | null;
  xray: boolean;
}

export const PRISTINE_EFFECT: EffectState = {
  hidden: false,
  highlighted: false,
  hovered: false,
  fade: null,
  xray: false,
};

const originals = new WeakMap<Mesh, Material | Material[]>();
const workings = new WeakMap<Mesh, Material | Material[]>();
const activeRaycast = new WeakMap<Mesh, Mesh['raycast']>();

const NOOP_RAYCAST: Mesh['raycast'] = () => undefined;

const HIGHLIGHT_EMISSIVE = new Color('#2e5fd7');
const HOVER_EMISSIVE = new Color('#1d3a6e');

/** Register a mesh once at load time, capturing its authored material + raycast. */
export function registerMesh(mesh: Mesh): void {
  if (!originals.has(mesh)) originals.set(mesh, mesh.material);
  if (!activeRaycast.has(mesh)) activeRaycast.set(mesh, mesh.raycast);
}

/** Make a mesh invisible to picking (non-selectable or hidden meshes). */
export function setPickable(mesh: Mesh, pickable: boolean): void {
  const original = activeRaycast.get(mesh);
  mesh.raycast = pickable && original ? original : NOOP_RAYCAST;
}

function asArray(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material];
}

function ensureWorking(mesh: Mesh): Material[] {
  let working = workings.get(mesh);
  if (!working) {
    const original = originals.get(mesh) ?? mesh.material;
    working = asArray(original).map((m) => m.clone());
    workings.set(mesh, Array.isArray(original) ? working : (working[0] ?? working));
  }
  return asArray(working);
}

function isPristine(state: EffectState): boolean {
  return !state.highlighted && !state.hovered && state.fade === null && !state.xray;
}

export function applyEffectState(mesh: Mesh, state: EffectState): void {
  registerMesh(mesh);
  mesh.visible = !state.hidden;
  const selectable = mesh.userData['anatomy']?.selectable !== false;
  setPickable(mesh, !state.hidden && selectable);

  if (isPristine(state)) {
    const original = originals.get(mesh);
    if (original) mesh.material = original;
    return;
  }

  const original = asArray(originals.get(mesh) ?? mesh.material);
  const working = ensureWorking(mesh);
  for (let i = 0; i < working.length; i++) {
    const mat = working[i];
    const source = original[i];
    if (!mat || !source) continue;
    mat.copy(source);

    if (state.xray) {
      mat.transparent = true;
      mat.opacity = 0.14;
      mat.depthWrite = false;
    }
    if (state.fade !== null) {
      mat.transparent = true;
      mat.opacity = state.fade;
      mat.depthWrite = state.fade > 0.5;
    }
    if (mat instanceof MeshStandardMaterial) {
      if (state.highlighted) {
        mat.emissive.copy(HIGHLIGHT_EMISSIVE);
        mat.emissiveIntensity = 0.55;
        // A highlighted structure stays clearly readable even in fade/x-ray context.
        if (state.xray || state.fade !== null) {
          mat.opacity = Math.max(mat.opacity, 0.95);
          mat.depthWrite = true;
        }
      } else if (state.hovered) {
        mat.emissive.copy(HOVER_EMISSIVE);
        mat.emissiveIntensity = 0.45;
      }
    }
    mat.needsUpdate = true;
  }
  mesh.material =
    working.length === 1 && !Array.isArray(originals.get(mesh))
      ? (working[0] as Material)
      : working;
}

/** Restore the authored material and drop any clone (used before disposal). */
export function disposeEffects(mesh: Mesh): void {
  const original = originals.get(mesh);
  if (original) mesh.material = original;
  const working = workings.get(mesh);
  if (working) {
    for (const mat of asArray(working)) mat.dispose();
    workings.delete(mesh);
  }
}
