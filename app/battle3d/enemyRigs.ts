import * as THREE from "three";
import {
  addEyes,
  boxMesh,
  collectStandardMaterials,
  coneZ,
  createBase,
  createLimb,
  cylinderZ,
  material,
  primitive,
  seedFromId,
  sphereMesh,
} from "./core";

export interface EnemyRig {
  group: THREE.Group;
  model: THREE.Group;
  base: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  id: string;
  kind: string;
  seed: number;
  /** Per-kind locomotion. `moving` ramps 0..1 with actual travel speed. */
  animate: (elapsed: number, delta: number, motion: number, moving: number) => void;
}

const ENEMY_SCALE: Record<string, number> = {
  mote: 0.72,
  glarewing: 0.88,
  "hollow-knight": 1.2,
  whisperer: 0.95,
  "mimic-mask": 0.92,
  "gloom-mason": 1.12,
  "parcel-leech": 0.85,
  "bell-husk": 1.1,
};

const DUSK_BODY = "#2a1645";
const DUSK_LIMB = "#211435";
const DUSK_GLOW = "#c46dff";

function duskMaterialOptions(intensity = 0.5) {
  return { emissive: "#30104f", emissiveIntensity: intensity };
}

/** Mote: a floating spiked orb with one huge eye. Hovers and pulses. */
function buildMote(model: THREE.Group) {
  const body = primitive(new THREE.IcosahedronGeometry(3, 0), DUSK_BODY, duskMaterialOptions(0.6));
  body.position.z = 6.4;
  model.add(body);
  const spikes: THREE.Mesh[] = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const spike = coneZ(0.55, 1.9, "#452a68", 6, duskMaterialOptions(0.4));
    spike.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, 6.4);
    spike.rotation.y = Math.PI / 2;
    spike.rotation.z = angle - Math.PI / 2;
    model.add(spike);
    spikes.push(spike);
  }
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 12, 9),
    material("#efe1ff", { emissive: DUSK_GLOW, emissiveIntensity: 2.6, roughness: 0.2 }),
  );
  eye.position.set(0, -2.6, 6.6);
  model.add(eye);
  return (elapsed: number, _delta: number, motion: number) => {
    model.position.z = 1 + (Math.sin(elapsed * 3.1) * 0.9 + 0.9) * motion;
    body.rotation.z = elapsed * 0.8 * motion;
    const pulse = 1 + Math.sin(elapsed * 5.4) * 0.08 * motion;
    body.scale.setScalar(pulse);
    spikes.forEach((spike, index) => {
      spike.scale.setScalar(1 + Math.sin(elapsed * 5.4 + index) * 0.18 * motion);
    });
  };
}

/** Glarewing: a bat-moth with broad membrane wings. Swoops while flapping. */
function buildGlarewing(model: THREE.Group) {
  const body = primitive(new THREE.DodecahedronGeometry(2.1, 0), DUSK_BODY, duskMaterialOptions(0.5));
  body.scale.set(1, 0.85, 1.35);
  body.position.z = 8;
  model.add(body);
  const head = sphereMesh(1.5, "#24113e", duskMaterialOptions(0.6));
  head.position.set(0, -1.6, 9.6);
  model.add(head);
  addEyes(model, DUSK_GLOW, 9.8, 0.62, 0.26, -2.7);
  for (const x of [-0.7, 0.7]) {
    const ear = coneZ(0.42, 1.6, "#452a68", 5);
    ear.position.set(x, -1.2, 11);
    model.add(ear);
  }
  const wings: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * 1.6, 0.4, 8.6);
    const membrane = primitive(new THREE.ConeGeometry(2.6, 6.2, 4), "#56317c", {
      emissive: "#411463",
      emissiveIntensity: 0.55,
    });
    membrane.scale.y = 0.35;
    membrane.rotation.z = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    membrane.position.x = side * 3;
    wing.add(membrane);
    model.add(wing);
    wings.push(wing);
  }
  return (elapsed: number, _delta: number, motion: number) => {
    const flap = Math.sin(elapsed * 11) * 0.75 * motion;
    wings[0].rotation.y = -flap;
    wings[1].rotation.y = flap;
    model.position.z = 3 + Math.sin(elapsed * 4.2) * 1.3 * motion;
    model.rotation.x = Math.sin(elapsed * 4.2 + Math.PI / 2) * 0.12 * motion;
  };
}

/** Hollow Knight: towering armored husk with a greatsword. Heavy stomp. */
function buildHollowKnight(model: THREE.Group) {
  const leftLeg = createLimb(model, -1.5, 4.6, "#1d1330", 3.9, 0.95);
  const rightLeg = createLimb(model, 1.5, 4.6, "#1d1330", 3.9, 0.95);
  const cuirass = primitive(new THREE.DodecahedronGeometry(3.4, 0), "#342743", {
    metalness: 0.45,
    roughness: 0.4,
    emissive: "#30104f",
    emissiveIntensity: 0.35,
  });
  cuirass.scale.set(1.05, 0.85, 1.4);
  cuirass.position.z = 8;
  model.add(cuirass);
  for (const x of [-3.3, 3.3]) {
    const pauldron = primitive(new THREE.SphereGeometry(1.6, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), "#241a38", {
      metalness: 0.5,
    });
    pauldron.position.set(x, 0, 10.8);
    model.add(pauldron);
  }
  const leftArm = createLimb(model, -3.2, 9.4, "#241a38", 4.6, 0.95);
  const rightArm = createLimb(model, 3.2, 9.4, "#241a38", 4.6, 0.95);
  const sword = new THREE.Group();
  sword.position.set(0, -0.4, -4.4);
  rightArm.add(sword);
  const blade = boxMesh(0.5, 1.4, 7.4, "#4a3a68", { metalness: 0.6, roughness: 0.3 });
  blade.position.z = -2.4;
  sword.add(blade);
  const helm = coneZ(2.3, 3.6, "#241a38", 8, { metalness: 0.5 });
  helm.position.z = 13.2;
  model.add(helm);
  const visor = boxMesh(2.6, 0.6, 0.5, "#0d0618", {
    emissive: DUSK_GLOW,
    emissiveIntensity: 2.4,
  });
  visor.position.set(0, -1.7, 12.3);
  model.add(visor);
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    const stomp = Math.sin(elapsed * 4.6) * 0.5 * motion * moving;
    leftLeg.rotation.x = stomp;
    rightLeg.rotation.x = -stomp;
    leftArm.rotation.x = -stomp * 0.4;
    rightArm.rotation.x = 0.25 + stomp * 0.3;
    model.position.z = 1 + Math.abs(stomp) * 0.55;
    model.rotation.y = Math.sin(elapsed * 4.6) * 0.05 * motion * moving;
    model.rotation.x = 0.06 * moving;
  };
}

/** Whisperer: a legless shroud with drifting tendrils. Sways as it glides. */
function buildWhisperer(model: THREE.Group) {
  const shroud = coneZ(2.9, 8.4, "#3a2359", 10, { emissive: "#2a0f4a", emissiveIntensity: 0.6 });
  shroud.position.z = 6.4;
  model.add(shroud);
  const head = sphereMesh(1.9, "#24113e", duskMaterialOptions(0.7));
  head.position.z = 11;
  model.add(head);
  addEyes(model, "#9fd7ff", 11.3, 0.7, 0.24, -1.6);
  const tendrils: THREE.Mesh[] = [];
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const tendril = coneZ(0.4, 3.1, "#2a1645", 6);
    tendril.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 2.4);
    tendril.rotation.x = Math.PI;
    model.add(tendril);
    tendrils.push(tendril);
  }
  return (elapsed: number, _delta: number, motion: number) => {
    model.position.z = 2 + Math.sin(elapsed * 2.6) * 0.8 * motion;
    model.rotation.z = Math.sin(elapsed * 1.9) * 0.14 * motion;
    tendrils.forEach((tendril, index) => {
      tendril.rotation.y = Math.sin(elapsed * 3.4 + index * 1.7) * 0.4 * motion;
    });
  };
}

/** Mimic Mask: a glowing mask hauling a shrivelled puppet body. Tilts and lunges. */
function buildMimicMask(model: THREE.Group) {
  const maskGroup = new THREE.Group();
  maskGroup.position.z = 9.6;
  model.add(maskGroup);
  const mask = boxMesh(4.4, 0.7, 5.2, "#8a69ad", { emissive: "#5d327f", emissiveIntensity: 0.8 });
  maskGroup.add(mask);
  const brow = boxMesh(4.6, 0.75, 0.9, "#b48ad4", { emissive: "#7c4ba3", emissiveIntensity: 1 });
  brow.position.z = 2.4;
  maskGroup.add(brow);
  for (const x of [-1.1, 1.1]) {
    const eye = boxMesh(0.9, 0.8, 1.5, "#0d0618", { emissive: "#ffd75e", emissiveIntensity: 2.2 });
    eye.position.set(x, -0.3, 0.6);
    maskGroup.add(eye);
  }
  const grin = boxMesh(2.4, 0.75, 0.5, "#0d0618", { emissive: "#ffb63c", emissiveIntensity: 1.6 });
  grin.position.set(0, -0.3, -1.6);
  maskGroup.add(grin);
  const husk = coneZ(1.9, 6.4, DUSK_LIMB, 8, duskMaterialOptions(0.4));
  husk.position.z = 4.4;
  model.add(husk);
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = createLimb(model, side * 2, 7, DUSK_LIMB, 3.4, 0.6);
    arms.push(arm);
  }
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    maskGroup.rotation.y = Math.sin(elapsed * 2.8) * 0.28 * motion;
    maskGroup.position.z = 9.6 + Math.sin(elapsed * 3.3) * 0.5 * motion;
    const scuttle = Math.sin(elapsed * 10) * 0.5 * motion * moving;
    arms[0].rotation.x = scuttle;
    arms[1].rotation.x = -scuttle;
    model.position.z = 1 + Math.abs(scuttle) * 0.3;
  };
}

/** Gloom Mason: hulking builder hauling brick hods. Slow swinging stomp. */
function buildGloomMason(model: THREE.Group) {
  const leftLeg = createLimb(model, -1.7, 4.2, "#1d1330", 3.5, 1.05);
  const rightLeg = createLimb(model, 1.7, 4.2, "#1d1330", 3.5, 1.05);
  const body = primitive(new THREE.DodecahedronGeometry(3.6, 0), "#342743", duskMaterialOptions(0.45));
  body.scale.set(1.2, 0.9, 1.05);
  body.position.z = 7.4;
  model.add(body);
  const head = sphereMesh(1.9, "#24113e", duskMaterialOptions(0.6));
  head.position.set(0, -0.8, 10.8);
  model.add(head);
  addEyes(model, "#ff9a5e", 11, 0.7, 0.26, -2.4);
  const leftArm = createLimb(model, -3.9, 8.4, "#2b1745", 4.6, 1.15);
  const rightArm = createLimb(model, 3.9, 8.4, "#2b1745", 4.6, 1.15);
  const fist = sphereMesh(1.4, "#1d1330");
  fist.position.z = -4.4;
  leftArm.add(fist);
  rightArm.add(fist.clone());
  const hod = new THREE.Group();
  hod.position.set(0, 2.6, 9.4);
  hod.rotation.x = 0.3;
  model.add(hod);
  for (let index = 0; index < 4; index += 1) {
    const brick = boxMesh(1.7, 1.1, 0.9, index % 2 ? "#4b3963" : "#3c2c52");
    brick.position.set((index % 2) * 1.8 - 0.9, 0, Math.floor(index / 2) * 1 + 0.4);
    hod.add(brick);
  }
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    const stomp = Math.sin(elapsed * 5.2) * 0.55 * motion * moving;
    leftLeg.rotation.x = stomp;
    rightLeg.rotation.x = -stomp;
    leftArm.rotation.x = -stomp * 0.7;
    rightArm.rotation.x = stomp * 0.7;
    model.position.z = 1 + Math.abs(stomp) * 0.5;
    model.rotation.z = Math.sin(elapsed * 5.2) * 0.06 * motion * moving;
  };
}

/** Parcel Leech: segmented cargo worm. Slithers with a traveling wave. */
function buildParcelLeech(model: THREE.Group) {
  const segments: THREE.Mesh[] = [];
  for (let index = 0; index < 6; index += 1) {
    const radius = 1.9 - index * 0.2;
    const segment = sphereMesh(
      radius,
      index === 0 ? "#3a2359" : DUSK_BODY,
      duskMaterialOptions(index === 0 ? 0.7 : 0.45),
    );
    segment.position.set(0, index * 2.1 - 1, 2.6 + radius * 0.4);
    model.add(segment);
    segments.push(segment);
  }
  const maw = coneZ(1.1, 1.9, "#120a22", 8, { emissive: "#ff5e8a", emissiveIntensity: 1.4 });
  maw.rotation.x = Math.PI / 2;
  maw.position.set(0, -2.7, 3.1);
  model.add(maw);
  addEyes(model, "#ff9ad2", 4.3, 0.75, 0.24, -2.2);
  const parcel = boxMesh(1.9, 1.9, 1.9, "#7a5a34");
  parcel.rotation.z = Math.PI / 5;
  parcel.position.set(0, 4.4, 5.2);
  model.add(parcel);
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    segments.forEach((segment, index) => {
      const wave = elapsed * 7 - index * 0.85;
      segment.position.x = Math.sin(wave) * 0.9 * motion * (0.35 + moving * 0.65);
      segment.position.z = 2.6 + (1.9 - index * 0.2) * 0.4 + Math.abs(Math.sin(wave * 0.5)) * 0.4 * motion;
    });
    parcel.rotation.x = Math.sin(elapsed * 3.2) * 0.12 * motion;
  };
}

/** Bell Husk: a possessed bell that hops and tolls. */
function buildBellHusk(model: THREE.Group) {
  const bell = new THREE.Group();
  bell.position.z = 7;
  model.add(bell);
  const shell = coneZ(4.3, 7.2, "#513a6d", 14, {
    metalness: 0.45,
    roughness: 0.4,
    emissive: "#2a0f4a",
    emissiveIntensity: 0.5,
  });
  bell.add(shell);
  const lip = cylinderZ(4.4, 4.55, 0.8, "#6a4f8a", 14, { metalness: 0.55 });
  lip.position.z = -3.2;
  bell.add(lip);
  const crown = sphereMesh(1.1, "#3a2a52", { metalness: 0.5 });
  crown.position.z = 4.1;
  bell.add(crown);
  const clapper = new THREE.Group();
  clapper.position.z = 1.4;
  bell.add(clapper);
  const clapperBall = sphereMesh(1, "#ffd75e", { emissive: "#e8a63c", emissiveIntensity: 1.8 });
  clapperBall.position.z = -4.6;
  clapper.add(clapperBall);
  addEyes(bell, DUSK_GLOW, 0.6, 1.35, 0.34, -3.6);
  const feet: THREE.Mesh[] = [];
  for (const x of [-1.7, 1.7]) {
    const foot = boxMesh(1.5, 2, 0.9, "#1d1330");
    foot.position.set(x, 0, 0.6);
    model.add(foot);
    feet.push(foot);
  }
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    const hop = Math.max(0, Math.sin(elapsed * 5.6)) * motion * (0.3 + moving * 0.7);
    model.position.z = 1 + hop * 1.7;
    bell.rotation.y = Math.sin(elapsed * 5.6 + 1.2) * 0.16 * motion;
    clapper.rotation.y = Math.sin(elapsed * 5.6 + 2) * 0.5 * motion;
    feet[0].position.z = 0.6 + hop * 0.5;
    feet[1].position.z = 0.6 + hop * 0.5;
  };
}

/** Fallback biped for unknown kinds. */
function buildShade(model: THREE.Group) {
  const leftLeg = createLimb(model, -1.35, 4.1, DUSK_LIMB, 3.4, 0.78);
  const rightLeg = createLimb(model, 1.35, 4.1, DUSK_LIMB, 3.4, 0.78);
  const body = primitive(new THREE.DodecahedronGeometry(3.25, 0), DUSK_BODY, duskMaterialOptions(0.42));
  body.scale.set(1, 0.82, 1.05);
  body.position.z = 7;
  model.add(body);
  const head = sphereMesh(2.45, "#24113e", duskMaterialOptions(0.55));
  head.position.z = 11.15;
  model.add(head);
  addEyes(model, DUSK_GLOW, 11.4);
  return (elapsed: number, _delta: number, motion: number, moving: number) => {
    const walk = Math.sin(elapsed * 9) * 0.65 * motion * moving;
    leftLeg.rotation.x = walk;
    rightLeg.rotation.x = -walk;
    model.position.z = 1 + Math.abs(walk) * 0.32;
  };
}

const BUILDERS: Record<string, (model: THREE.Group) => EnemyRig["animate"]> = {
  mote: buildMote,
  glarewing: buildGlarewing,
  "hollow-knight": buildHollowKnight,
  whisperer: buildWhisperer,
  "mimic-mask": buildMimicMask,
  "gloom-mason": buildGloomMason,
  "parcel-leech": buildParcelLeech,
  "bell-husk": buildBellHusk,
};

export function createEnemyRig(id: string, kind: string): EnemyRig {
  const group = new THREE.Group();
  const base = createBase("#824ac3");
  base.scale.setScalar(0.86);
  group.add(base);
  const model = new THREE.Group();
  model.position.z = 1;
  group.add(model);

  const build = BUILDERS[kind] ?? buildShade;
  const animate = build(model);

  group.scale.setScalar(ENEMY_SCALE[kind] ?? 0.9);
  return {
    group,
    model,
    base,
    materials: collectStandardMaterials(group),
    id,
    kind,
    seed: seedFromId(id),
    animate,
  };
}
