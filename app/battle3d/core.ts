import * as THREE from "three";

/**
 * Shared building blocks for the miniature battlefield. The world is Z-up:
 * the ground plane sits at z = 0, models are authored facing -Y (toward the
 * camera / caravan side), and enemies advance along -Y toward the caravan.
 */

export function material(
  color: THREE.ColorRepresentation,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.08,
    ...options,
  });
}

export function primitive(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  const mesh = new THREE.Mesh(geometry, material(color, options));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinderZ(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: THREE.ColorRepresentation,
  segments = 12,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  const mesh = primitive(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    color,
    options,
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function coneZ(
  radius: number,
  height: number,
  color: THREE.ColorRepresentation,
  segments = 10,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  const mesh = primitive(
    new THREE.ConeGeometry(radius, height, segments),
    color,
    options,
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function sphereMesh(
  radius: number,
  color: THREE.ColorRepresentation,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
  widthSegments = 12,
  heightSegments = 9,
) {
  return primitive(
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
    color,
    options,
  );
}

export function boxMesh(
  width: number,
  depth: number,
  height: number,
  color: THREE.ColorRepresentation,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  return primitive(new THREE.BoxGeometry(width, depth, height), color, options);
}

export function addEyes(
  parent: THREE.Object3D,
  color = "#8be4ff",
  z = 10.3,
  spread = 0.82,
  radius = 0.29,
  y = -2.05,
) {
  const eyeMaterial = material(color, {
    emissive: color,
    emissiveIntensity: 2.4,
    roughness: 0.25,
  });
  for (const x of [-spread, spread]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), eyeMaterial);
    eye.position.set(x, y, z);
    parent.add(eye);
  }
}

export function createBase(rimColor: string, glow = false) {
  const group = new THREE.Group();
  const lower = cylinderZ(4.9, 5.45, 0.85, "#15171d", 18, { metalness: 0.35 });
  lower.position.z = 0.45;
  group.add(lower);
  const rim = cylinderZ(4.55, 4.8, 0.36, rimColor, 18, {
    metalness: 0.55,
    roughness: 0.34,
    ...(glow ? { emissive: rimColor, emissiveIntensity: 0.75 } : {}),
  });
  rim.position.z = 0.92;
  group.add(rim);
  const top = cylinderZ(4.12, 4.25, 0.28, "#30343a", 18);
  top.position.z = 1.15;
  group.add(top);
  return group;
}

export function createLimb(
  parent: THREE.Object3D,
  x: number,
  z: number,
  color: string,
  length: number,
  radius: number,
) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, z);
  const limb = cylinderZ(radius * 0.84, radius, length, color, 9);
  limb.position.z = -length / 2;
  pivot.add(limb);
  parent.add(pivot);
  return pivot;
}

export function seedFromId(id: string) {
  return id.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Points) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      return;
    }
    if (child instanceof THREE.Line) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      return;
    }
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((item) => item.dispose());
  });
}

/**
 * Collects every MeshStandardMaterial so hit flashes can pulse emissive.
 * Each material remembers its authored emissive intensity in userData so the
 * flash can restore it exactly.
 */
export function collectStandardMaterials(object: THREE.Object3D) {
  const materials: THREE.MeshStandardMaterial[] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    for (const item of list) {
      if (item instanceof THREE.MeshStandardMaterial) {
        if (item.userData.baseEmissiveIntensity === undefined) {
          item.userData.baseEmissiveIntensity = item.emissiveIntensity;
        }
        materials.push(item);
      }
    }
  });
  return materials;
}

/** Enable transparency on every material so a rig can dissolve out. */
export function setRigOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    for (const item of list) {
      item.transparent = true;
      item.opacity = opacity;
      item.depthWrite = opacity > 0.55;
    }
  });
}

/**
 * Rotation about Z that makes a -Y-facing model look along direction (dx, dy).
 */
export function facingAngle(dx: number, dy: number) {
  return Math.atan2(dx, -dy);
}

export function dampAngle(current: number, target: number, lambda: number, delta: number) {
  let difference = target - current;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return current + difference * (1 - Math.exp(-lambda * delta));
}
