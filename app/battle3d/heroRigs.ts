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

export interface HeroRig {
  group: THREE.Group;
  model: THREE.Group;
  base: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  muzzle: THREE.Object3D;
  starGems: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  id: string;
  seed: number;
  animateExtras: (elapsed: number, delta: number, motion: number) => void;
}

const HERO_PALETTES: Record<
  string,
  { primary: string; secondary: string; skin: string; hair: string }
> = {
  mira: { primary: "#246da2", secondary: "#d49a48", skin: "#e9b586", hair: "#241d28" },
  bram: { primary: "#4c6b35", secondary: "#c9a24a", skin: "#8a6a45", hair: "#3c5227" },
  pip: { primary: "#3a4e72", secondary: "#d5a452", skin: "#8892b8", hair: "#2c3a58" },
  orla: { primary: "#a94439", secondary: "#dda04d", skin: "#c98562", hair: "#7d2f22" },
  nox: { primary: "#563a85", secondary: "#a477dd", skin: "#c79584", hair: "#17182b" },
  tavi: { primary: "#d27336", secondary: "#f0bd62", skin: "#d99b72", hair: "#7a3022" },
  juniper: { primary: "#4e8b46", secondary: "#b2d56e", skin: "#d9a779", hair: "#8a542b" },
  kodo: { primary: "#6f4f31", secondary: "#bd8b42", skin: "#9b6d4a", hair: "#193044" },
};

const STAR_GEM_COLORS: Record<number, string> = {
  2: "#cfd8e6",
  3: "#ffd75e",
  4: "#c5f3ff",
};

function createStarGems(star: number) {
  const gems = new THREE.Group();
  const count = Math.max(0, Math.min(4, star) - 1);
  const color = STAR_GEM_COLORS[Math.min(4, star)] ?? "#cfd8e6";
  for (let index = 0; index < count; index += 1) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.62, 0),
      material(color, { emissive: color, emissiveIntensity: 1.6, roughness: 0.2 }),
    );
    gem.userData.phase = (index / Math.max(1, count)) * Math.PI * 2;
    gems.add(gem);
  }
  gems.position.z = 15.4;
  return gems;
}

interface BodyOptions {
  torsoColor: string;
  torsoScale?: [number, number, number];
  limbColor?: string;
  legColor?: string;
  headRadius?: number;
  skin: string;
  hair?: string;
  beltColor?: string;
}

function buildHumanoid(model: THREE.Group, options: BodyOptions) {
  const limbColor = options.limbColor ?? options.torsoColor;
  const legColor = options.legColor ?? "#24303a";
  const leftLeg = createLimb(model, -1.25, 4.15, legColor, 3.45, 0.82);
  const rightLeg = createLimb(model, 1.25, 4.15, legColor, 3.45, 0.82);
  const foot = boxMesh(1.75, 2.2, 0.85, "#252322");
  foot.position.set(0, -0.5, -3.5);
  leftLeg.add(foot);
  rightLeg.add(foot.clone());

  const torso = primitive(
    new THREE.DodecahedronGeometry(3.15, 0),
    options.torsoColor,
  );
  const [sx, sy, sz] = options.torsoScale ?? [1, 0.72, 1.12];
  torso.scale.set(sx, sy, sz);
  torso.position.z = 7;
  model.add(torso);

  if (options.beltColor) {
    const belt = cylinderZ(3.05, 3.05, 0.58, options.beltColor, 12, {
      metalness: 0.38,
    });
    belt.position.z = 5.8;
    model.add(belt);
  }

  const leftArm = createLimb(model, -3.15, 8.25, limbColor, 4.35, 0.9);
  const rightArm = createLimb(model, 3.15, 8.25, limbColor, 4.35, 0.9);
  const hand = sphereMesh(0.86, options.skin, undefined, 10, 7);
  hand.position.z = -4.15;
  leftArm.add(hand);
  rightArm.add(hand.clone());

  const head = new THREE.Group();
  head.position.z = 11.4;
  model.add(head);
  const skull = sphereMesh(options.headRadius ?? 2.35, options.skin, undefined, 14, 10);
  skull.scale.y = 0.92;
  head.add(skull);
  if (options.hair) {
    const hair = sphereMesh(2.42, options.hair, undefined, 12, 8);
    hair.scale.set(1.03, 0.88, 0.66);
    hair.position.set(0, 0.52, 0.85);
    head.add(hair);
  }
  addEyes(head, "#d9f4ff", 0.15);

  return { leftLeg, rightLeg, leftArm, rightArm, head, torso };
}

function noop() {}

export function createHeroRig(id: string, star: number): HeroRig {
  const palette = HERO_PALETTES[id] ?? HERO_PALETTES.mira;
  const group = new THREE.Group();
  const base = createBase(star >= 3 ? "#ffe27a" : palette.secondary, star >= 3);
  group.add(base);

  const model = new THREE.Group();
  model.position.z = 1.15;
  group.add(model);

  const body = buildHumanoid(model, {
    torsoColor: palette.primary,
    torsoScale:
      id === "bram" || id === "orla" || id === "kodo"
        ? [1.22, 0.8, 1.16]
        : id === "pip" || id === "tavi"
          ? [0.92, 0.68, 1]
          : [1, 0.72, 1.12],
    skin: palette.skin,
    hair: ["pip", "kodo"].includes(id) ? undefined : palette.hair,
    beltColor: palette.secondary,
  });
  const { leftArm, rightArm, leftLeg, rightLeg, head } = body;

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, -2.4, -3.4);
  rightArm.add(muzzle);

  let animateExtras: HeroRig["animateExtras"] = noop;

  if (id === "mira") {
    // Tesla staff with a crackling storm orb.
    const staff = new THREE.Group();
    staff.position.set(0, -0.35, -3.1);
    rightArm.add(staff);
    const pole = cylinderZ(0.23, 0.28, 8.2, "#7b5128", 8);
    pole.position.z = -0.4;
    staff.add(pole);
    for (const z of [1.6, 2.35, 3.1]) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(1.05 - (z - 1.6) * 0.18, 0.18, 6, 14),
        material("#59d9ff", { emissive: "#1faee9", emissiveIntensity: 2, metalness: 0.3 }),
      );
      coil.position.z = z;
      staff.add(coil);
    }
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85, 0),
      material("#bdefff", { emissive: "#4fd2ff", emissiveIntensity: 2.6, roughness: 0.15 }),
    );
    orb.position.z = 4.1;
    staff.add(orb);
    muzzle.position.set(0, -0.35, -3.1 + 4.1);
    const goggles = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.16, 6, 12),
      material("#d49a48", { metalness: 0.6 }),
    );
    goggles.rotation.x = Math.PI / 2;
    goggles.position.set(0, 0.1, 2.3);
    head.add(goggles);
    const orbMaterial = orb.material as THREE.MeshStandardMaterial;
    animateExtras = (elapsed) => {
      orbMaterial.emissiveIntensity = 2 + Math.sin(elapsed * 11) * 1.1;
      orb.rotation.z = elapsed * 3;
      orb.scale.setScalar(1 + Math.sin(elapsed * 7.3) * 0.12);
    };
  } else if (id === "bram") {
    // Grove warden: bark plates, leaf pauldrons, living lantern-shield.
    const barkPlate = primitive(new THREE.DodecahedronGeometry(1.35, 0), "#5f4526");
    barkPlate.scale.set(1, 0.5, 1.4);
    barkPlate.position.set(0, -2.6, 7.4);
    model.add(barkPlate);
    for (const x of [-2.9, 2.9]) {
      const pauldron = coneZ(1.5, 2.1, "#3c5227", 7);
      pauldron.position.set(x, 0, 10.4);
      pauldron.rotation.y = x < 0 ? 0.45 : -0.45;
      model.add(pauldron);
    }
    for (const [x, z] of [[-1.2, 2.2], [1.4, 2.5]] as const) {
      const sprig = coneZ(0.5, 1.9, "#7fae4c", 6);
      sprig.position.set(x, 0.3, z);
      sprig.rotation.x = Math.PI / 2 - 0.4;
      head.add(sprig);
    }
    const shield = new THREE.Group();
    shield.position.set(0, -1.4, -3.6);
    leftArm.add(shield);
    const disc = cylinderZ(2.7, 2.9, 0.7, "#6a4b28", 14);
    disc.rotation.x = 0;
    shield.add(disc);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 12, 9),
      material("#ffd479", { emissive: "#e8a63c", emissiveIntensity: 1.9 }),
    );
    core.position.y = -0.5;
    shield.add(core);
    const coreMaterial = core.material as THREE.MeshStandardMaterial;
    animateExtras = (elapsed) => {
      coreMaterial.emissiveIntensity = 1.6 + Math.sin(elapsed * 2.2) * 0.5;
    };
  } else if (id === "pip") {
    // Bird courier: beak, goggles, wing packs, parcel satchel.
    const beak = coneZ(0.72, 1.9, "#d79b45", 8);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -2.5, 0);
    head.add(beak);
    const crest = coneZ(0.55, 1.8, "#2c3a58", 6);
    crest.position.set(0, 0.8, 2.4);
    crest.rotation.x = -0.7;
    head.add(crest);
    const goggleBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.17, 6, 12),
      material("#d79a46", { metalness: 0.55 }),
    );
    goggleBand.rotation.x = Math.PI / 2;
    goggleBand.position.set(0, -0.6, 1.9);
    head.add(goggleBand);
    const wings: THREE.Mesh[] = [];
    for (const x of [-3.6, 3.6]) {
      const wing = primitive(new THREE.ConeGeometry(2, 5.4, 4), "#8ea6cf");
      wing.rotation.z = x < 0 ? 0.95 : -0.95;
      wing.position.set(x, 1.4, 8.6);
      model.add(wing);
      wings.push(wing);
    }
    const satchel = boxMesh(2.3, 1.5, 2.8, "#8a5a30");
    satchel.position.set(2.2, 1.9, 5.6);
    satchel.rotation.z = 0.3;
    model.add(satchel);
    animateExtras = (elapsed, _delta, motion) => {
      const flap = Math.sin(elapsed * 9) * 0.35 * motion;
      wings[0].rotation.z = 0.95 + flap;
      wings[1].rotation.z = -0.95 - flap;
    };
  } else if (id === "orla") {
    // Master smith: hair bun, apron, colossal bell-hammer.
    const bun = sphereMesh(1.15, palette.hair);
    bun.position.set(0, 1.2, 2.6);
    head.add(bun);
    const apron = boxMesh(3.6, 0.6, 4.4, "#b03a2e");
    apron.position.set(0, -2.5, 6.2);
    model.add(apron);
    const hammer = new THREE.Group();
    hammer.position.set(0, -0.35, -3.1);
    rightArm.add(hammer);
    const handle = cylinderZ(0.28, 0.34, 6.4, "#704926", 8);
    handle.position.z = -1;
    hammer.add(handle);
    const hammerHead = boxMesh(4.4, 2.4, 2.2, "#dda04d", {
      metalness: 0.5,
      roughness: 0.35,
    });
    hammerHead.position.z = 2.1;
    hammer.add(hammerHead);
    const glow = boxMesh(4.5, 1.1, 1.1, "#ffcf7d", {
      emissive: "#ff9a3c",
      emissiveIntensity: 1.4,
    });
    glow.position.z = 2.1;
    hammer.add(glow);
    muzzle.position.set(0, -0.35, -1);
    const glowMaterial = glow.material as THREE.MeshStandardMaterial;
    animateExtras = (elapsed) => {
      glowMaterial.emissiveIntensity = 1.1 + Math.sin(elapsed * 3.1) * 0.45;
    };
  } else if (id === "nox") {
    // Veil cartographer: deep hood, grimoire, orbiting ink wisp.
    const hood = coneZ(3.15, 3.45, "#382657", 12);
    hood.position.z = 2;
    head.add(hood);
    const cloak = coneZ(3.4, 6.8, "#43306b", 12);
    cloak.position.z = 4.9;
    model.add(cloak);
    const book = boxMesh(2.6, 0.8, 3.1, "#523878", { metalness: 0.18 });
    book.position.set(0, -1.3, -3.4);
    leftArm.add(book);
    const wisp = new THREE.Group();
    model.add(wisp);
    const wispSegments: THREE.Mesh[] = [];
    for (let index = 0; index < 5; index += 1) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.62 - index * 0.09, 8, 6),
        material("#8c5fd1", {
          emissive: "#7b3fd4",
          emissiveIntensity: 1.7 - index * 0.2,
          roughness: 0.3,
        }),
      );
      wisp.add(bead);
      wispSegments.push(bead);
    }
    const rune = primitive(new THREE.OctahedronGeometry(0.72, 0), "#c37cff", {
      emissive: "#8c42cf",
      emissiveIntensity: 2,
    });
    rune.position.set(0, -2.1, -3.6);
    rightArm.add(rune);
    muzzle.position.set(0, -2.1, -3.6);
    animateExtras = (elapsed) => {
      rune.rotation.z = elapsed * 2.4;
      wispSegments.forEach((bead, index) => {
        const trail = elapsed * 2.1 - index * 0.35;
        bead.position.set(
          Math.cos(trail) * 4.4,
          Math.sin(trail) * 4.4,
          9 + Math.sin(trail * 1.7) * 2.2,
        );
      });
    };
  } else if (id === "tavi") {
    // Hearth chef: pot hat, pot-stack backpack, ladle, idle steam handled by FX.
    const potHat = cylinderZ(2.2, 2.55, 2.25, "#c8b486", 12);
    potHat.position.z = 2.4;
    head.add(potHat);
    const potLidKnob = sphereMesh(0.5, "#8c7a55");
    potLidKnob.position.z = 3.6;
    head.add(potLidKnob);
    const pack = new THREE.Group();
    pack.position.set(0, 2.3, 6.6);
    model.add(pack);
    for (const [z, radius, color] of [
      [0, 1.9, "#9a6a3a"],
      [1.7, 1.6, "#b98a4a"],
      [3.1, 1.3, "#8c5a30"],
    ] as const) {
      const pot = cylinderZ(radius, radius * 1.08, 1.5, color, 10, { metalness: 0.4 });
      pot.position.z = z;
      pack.add(pot);
    }
    const ladle = new THREE.Group();
    ladle.position.set(0, -0.35, -3.1);
    rightArm.add(ladle);
    const ladleHandle = cylinderZ(0.2, 0.24, 5.4, "#704926", 8);
    ladleHandle.position.z = -0.7;
    ladle.add(ladleHandle);
    const scoop = sphereMesh(1.05, "#c9a24a", { metalness: 0.5 });
    scoop.scale.z = 0.55;
    scoop.position.z = 2.1;
    ladle.add(scoop);
    muzzle.position.set(0, -0.35, -1);
    animateExtras = (elapsed, _delta, motion) => {
      pack.rotation.z = Math.sin(elapsed * 2.3) * 0.05 * motion;
    };
  } else if (id === "juniper") {
    // Prism archer: leaf hat, crystal bow, quiver of shard arrows.
    const hat = coneZ(3.35, 2.25, "#668d44", 12);
    hat.position.z = 2.15;
    hat.rotation.y = -0.22;
    head.add(hat);
    const bow = new THREE.Group();
    bow.position.set(0, -1.2, -3.6);
    leftArm.add(bow);
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.2, 7, 20, Math.PI * 1.48),
      material("#83bd55"),
    );
    arc.rotation.y = Math.PI / 2;
    bow.add(arc);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      material("#b8f2c8", { emissive: "#71c88b", emissiveIntensity: 2.1 }),
    );
    bow.add(gem);
    const quiver = cylinderZ(0.9, 1, 3.6, "#6a4b28", 8);
    quiver.position.set(1.9, 2.2, 7.4);
    quiver.rotation.z = 0.4;
    model.add(quiver);
    for (const offset of [-0.4, 0.1, 0.6]) {
      const shard = coneZ(0.28, 1.2, "#b2d56e", 5, {
        emissive: "#8fd07a",
        emissiveIntensity: 0.9,
      });
      shard.position.set(1.55 + offset * 0.5, 2.1, 9.4 + offset * 0.3);
      model.add(shard);
    }
    muzzle.position.set(0, -1.2, -3.6);
    const gemMaterial = gem.material as THREE.MeshStandardMaterial;
    animateExtras = (elapsed) => {
      gemMaterial.emissiveIntensity = 1.7 + Math.sin(elapsed * 5.2) * 0.7;
      gem.rotation.z = elapsed * 2.2;
    };
  } else if (id === "kodo") {
    // Rail golem: furnace chest, smokestack shoulders, rail-spike maul.
    const furnace = boxMesh(3, 1.2, 2.4, "#3a2d20");
    furnace.position.set(0, -2.75, 7);
    model.add(furnace);
    const ember = boxMesh(2.2, 0.6, 1.5, "#ff9440", {
      emissive: "#ff6a1f",
      emissiveIntensity: 2,
    });
    ember.position.set(0, -3.1, 7);
    model.add(ember);
    const stack = cylinderZ(0.62, 0.78, 2.6, "#4a4038", 8, { metalness: 0.5 });
    stack.position.set(-2.6, 1.2, 11.6);
    model.add(stack);
    for (const x of [-3.4, 3.4]) {
      const pauldron = boxMesh(2.4, 2.6, 1.7, "#6f4f31", { metalness: 0.3 });
      pauldron.position.set(x, 0, 10.6);
      model.add(pauldron);
    }
    const maul = new THREE.Group();
    maul.position.set(0, -0.35, -3.1);
    rightArm.add(maul);
    const shaft = cylinderZ(0.3, 0.36, 6, "#4a3423", 8);
    shaft.position.z = -1;
    maul.add(shaft);
    const railHead = boxMesh(2.2, 2.2, 3.4, "#8c8377", { metalness: 0.55, roughness: 0.35 });
    railHead.position.z = 2;
    maul.add(railHead);
    const emberMaterial = ember.material as THREE.MeshStandardMaterial;
    animateExtras = (elapsed) => {
      emberMaterial.emissiveIntensity = 1.6 + Math.sin(elapsed * 6.7) * 0.6 + Math.sin(elapsed * 17) * 0.25;
    };
  }

  const starGems = createStarGems(star);
  group.add(starGems);

  leftArm.rotation.x = -0.1;
  rightArm.rotation.x = 0.18;

  group.scale.setScalar(
    id === "pip" || id === "tavi" ? 0.88 : id === "bram" || id === "kodo" ? 1.05 : 0.94,
  );
  group.userData.star = star;

  return {
    group,
    model,
    base,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    head,
    muzzle,
    starGems,
    materials: collectStandardMaterials(group),
    id,
    seed: seedFromId(id),
    animateExtras,
  };
}
