"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CHARACTERS,
  combatAttackCues,
  type CombatWave,
  type ExpeditionPhase,
} from "./game-core";

interface BattlefieldMiniatures3DProps {
  board: Record<number, string>;
  starByCharacter: Record<string, number>;
  combat: CombatWave | null;
  phase: ExpeditionPhase;
  paused: boolean;
  selectedCharacterId: string | null;
  onReady?: () => void;
}

interface MiniatureRig {
  group: THREE.Group;
  model: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  base: THREE.Group;
  id: string;
  seed: number;
}

interface FlyingProjectile {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  born: number;
  duration: number;
  color: THREE.Color;
}

interface ImpactFlash {
  mesh: THREE.Mesh;
  born: number;
  duration: number;
}

const HERO_PALETTES: Record<
  string,
  { primary: string; secondary: string; skin: string; hair: string }
> = {
  mira: { primary: "#246da2", secondary: "#d49a48", skin: "#e9b586", hair: "#241d28" },
  bram: { primary: "#9b5b2d", secondary: "#d29a48", skin: "#dca77c", hair: "#e6ddd0" },
  pip: { primary: "#e1cfad", secondary: "#b94f35", skin: "#dfaa7d", hair: "#8a3d2d" },
  orla: { primary: "#a94439", secondary: "#dda04d", skin: "#c98562", hair: "#4c241e" },
  nox: { primary: "#563a85", secondary: "#a477dd", skin: "#c79584", hair: "#17182b" },
  tavi: { primary: "#d27336", secondary: "#f0bd62", skin: "#d99b72", hair: "#7a3022" },
  juniper: { primary: "#4e8b46", secondary: "#b2d56e", skin: "#d9a779", hair: "#8a542b" },
  kodo: { primary: "#2f6d8e", secondary: "#bd8b42", skin: "#9b6d4a", hair: "#193044" },
};

const ENEMY_SCALE: Record<string, number> = {
  mote: 0.78,
  glarewing: 0.88,
  "hollow-knight": 1.18,
  whisperer: 0.92,
  "mimic-mask": 0.94,
  "gloom-mason": 1.1,
  "parcel-leech": 0.82,
  "bell-husk": 1.08,
};

function material(
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

function primitive(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  options?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  const mesh = new THREE.Mesh(geometry, material(color, options));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinderZ(
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

function coneZ(
  radius: number,
  height: number,
  color: THREE.ColorRepresentation,
  segments = 10,
) {
  const mesh = primitive(
    new THREE.ConeGeometry(radius, height, segments),
    color,
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addEyes(parent: THREE.Object3D, color = "#8be4ff", z = 10.3) {
  const eyeMaterial = material(color, {
    emissive: color,
    emissiveIntensity: 2.4,
    roughness: 0.25,
  });
  for (const x of [-0.82, 0.82]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 8, 6),
      eyeMaterial,
    );
    eye.position.set(x, -2.05, z);
    parent.add(eye);
  }
}

function createBase(rimColor: string) {
  const group = new THREE.Group();
  const lower = cylinderZ(4.9, 5.45, 0.85, "#15171d", 18, {
    metalness: 0.35,
  });
  lower.position.z = 0.45;
  group.add(lower);
  const rim = cylinderZ(4.55, 4.8, 0.36, rimColor, 18, {
    metalness: 0.55,
    roughness: 0.34,
  });
  rim.position.z = 0.92;
  group.add(rim);
  const top = cylinderZ(4.12, 4.25, 0.28, "#30343a", 18);
  top.position.z = 1.15;
  group.add(top);
  return group;
}

function createLimb(
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

function addWeapon(
  arm: THREE.Group,
  id: string,
  secondary: string,
) {
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.35, -3.1);
  arm.add(weapon);

  if (id === "mira") {
    const staff = cylinderZ(0.23, 0.28, 7.2, "#7b5128", 8);
    staff.position.z = -1;
    weapon.add(staff);
    for (const z of [1.2, 2.05, 2.9]) {
      const coil = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.18, 6, 14),
        material("#59d9ff", {
          emissive: "#1faee9",
          emissiveIntensity: 2,
          metalness: 0.3,
        }),
      );
      coil.position.z = z;
      weapon.add(coil);
    }
    return;
  }

  if (id === "juniper") {
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.2, 7, 20, Math.PI * 1.48),
      material("#83bd55"),
    );
    bow.rotation.y = Math.PI / 2;
    bow.position.z = -1;
    weapon.add(bow);
    return;
  }

  if (id === "nox") {
    const book = primitive(
      new THREE.BoxGeometry(2.6, 0.8, 3.1),
      "#523878",
      { metalness: 0.18 },
    );
    book.position.set(0, -0.3, -1);
    weapon.add(book);
    const rune = primitive(
      new THREE.OctahedronGeometry(0.72, 0),
      "#c37cff",
      { emissive: "#8c42cf", emissiveIntensity: 2 },
    );
    rune.position.set(0, -1.3, 0.8);
    weapon.add(rune);
    return;
  }

  if (id === "pip") {
    const parcel = primitive(
      new THREE.BoxGeometry(2.1, 2.1, 2.1),
      "#d28d43",
    );
    parcel.rotation.z = Math.PI / 4;
    parcel.position.z = -1.1;
    weapon.add(parcel);
    return;
  }

  const handle = cylinderZ(0.24, 0.28, 5.6, "#704926", 8);
  handle.position.z = -1.25;
  weapon.add(handle);
  const headColor = id === "tavi" ? "#b8632e" : secondary;
  const head = primitive(
    new THREE.BoxGeometry(id === "orla" ? 4.1 : 3.2, 2.1, 1.9),
    headColor,
    { metalness: 0.42, roughness: 0.4 },
  );
  head.position.z = 1.45;
  weapon.add(head);
}

function createHeroRig(id: string, star: number) {
  const palette = HERO_PALETTES[id] ?? HERO_PALETTES.mira;
  const group = new THREE.Group();
  const base = createBase(star >= 3 ? "#ffe27a" : palette.secondary);
  group.add(base);

  const model = new THREE.Group();
  model.position.z = 1.15;
  group.add(model);

  const leftLeg = createLimb(model, -1.25, 4.15, "#24303a", 3.45, 0.82);
  const rightLeg = createLimb(model, 1.25, 4.15, "#24303a", 3.45, 0.82);
  const leftFoot = primitive(
    new THREE.BoxGeometry(1.75, 2.2, 0.85),
    "#252322",
  );
  leftFoot.position.set(0, -0.5, -3.5);
  leftLeg.add(leftFoot);
  const rightFoot = leftFoot.clone();
  rightLeg.add(rightFoot);

  const torso = primitive(
    new THREE.DodecahedronGeometry(3.15, 0),
    palette.primary,
  );
  torso.scale.set(id === "bram" || id === "orla" ? 1.13 : 1, 0.72, 1.12);
  torso.position.z = 7;
  model.add(torso);

  const belt = cylinderZ(3.05, 3.05, 0.58, palette.secondary, 12, {
    metalness: 0.38,
  });
  belt.position.z = 5.8;
  model.add(belt);

  const leftArm = createLimb(model, -3.15, 8.25, palette.primary, 4.35, 0.9);
  const rightArm = createLimb(model, 3.15, 8.25, palette.primary, 4.35, 0.9);
  const leftHand = primitive(
    new THREE.SphereGeometry(0.86, 10, 7),
    palette.skin,
  );
  leftHand.position.z = -4.15;
  leftArm.add(leftHand);
  const rightHand = leftHand.clone();
  rightArm.add(rightHand);

  const head = primitive(
    new THREE.SphereGeometry(id === "pip" ? 2.15 : 2.35, 14, 10),
    palette.skin,
  );
  head.scale.y = 0.92;
  head.position.z = 11.4;
  model.add(head);

  const hair = primitive(
    new THREE.SphereGeometry(2.42, 12, 8),
    palette.hair,
  );
  hair.scale.set(1.03, 0.88, 0.66);
  hair.position.set(0, 0.52, 12.25);
  model.add(hair);
  addEyes(model, "#d9f4ff", 11.55);

  if (id === "bram") {
    const beard = primitive(
      new THREE.DodecahedronGeometry(2.1, 0),
      "#e6ddd0",
    );
    beard.scale.set(0.9, 0.45, 1.1);
    beard.position.set(0, -1.75, 9.65);
    model.add(beard);
  }

  if (id === "pip") {
    const cap = coneZ(2.75, 2.1, "#b94f35", 12);
    cap.position.z = 13.3;
    model.add(cap);
    for (const x of [-0.9, 0.9]) {
      const goggle = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.17, 6, 12),
        material("#d79a46", { metalness: 0.55 }),
      );
      goggle.rotation.x = Math.PI / 2;
      goggle.position.set(x, -2.15, 11.65);
      model.add(goggle);
    }
    const pack = primitive(
      new THREE.BoxGeometry(4.3, 2.4, 5.2),
      "#5b3929",
    );
    pack.position.set(0, 2.1, 7.3);
    model.add(pack);
  }

  if (id === "nox") {
    const hood = coneZ(3.15, 3.25, "#382657", 12);
    hood.position.z = 13.4;
    model.add(hood);
  }

  if (id === "juniper") {
    const hat = coneZ(3.35, 2.25, "#668d44", 12);
    hat.position.z = 13.45;
    hat.rotation.y = -0.22;
    model.add(hat);
  }

  if (id === "tavi") {
    const pot = cylinderZ(2.2, 2.55, 2.25, "#c8b486", 12);
    pot.position.z = 13.5;
    model.add(pot);
  }

  if (id === "kodo") {
    head.scale.set(0.72, 1.25, 0.78);
    const beak = coneZ(1.05, 2.4, "#d79b45", 8);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -3.05, 11.4);
    model.add(beak);
    for (const x of [-3.8, 3.8]) {
      const wing = primitive(
        new THREE.BoxGeometry(3.6, 0.65, 5.2),
        "#315d7b",
      );
      wing.position.set(x, 0.3, 7.2);
      wing.rotation.y = x < 0 ? -0.32 : 0.32;
      model.add(wing);
    }
  }

  addWeapon(rightArm, id, palette.secondary);
  leftArm.rotation.x = -0.1;
  rightArm.rotation.x = 0.18;

  group.scale.setScalar(id === "pip" ? 0.88 : id === "bram" ? 1.02 : 0.94);
  group.userData.star = star;
  return {
    group,
    model,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    base,
    id,
    seed: id.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0),
  } satisfies MiniatureRig;
}

function createEnemyRig(kind: string) {
  const group = new THREE.Group();
  const base = createBase("#824ac3");
  base.scale.setScalar(0.86);
  group.add(base);
  const model = new THREE.Group();
  model.position.z = 1;
  group.add(model);

  const leftLeg = createLimb(model, -1.35, 4.1, "#211435", 3.4, 0.78);
  const rightLeg = createLimb(model, 1.35, 4.1, "#211435", 3.4, 0.78);
  const body = primitive(
    new THREE.DodecahedronGeometry(3.25, 0),
    kind === "gloom-mason" ? "#342743" : "#2a1645",
    { emissive: "#30104f", emissiveIntensity: 0.42 },
  );
  body.scale.set(1, 0.82, kind === "hollow-knight" ? 1.35 : 1.05);
  body.position.z = 7;
  model.add(body);

  const leftArm = createLimb(model, -3.1, 8, "#2b1745", 3.9, 0.82);
  const rightArm = createLimb(model, 3.1, 8, "#2b1745", 3.9, 0.82);
  const head = primitive(
    new THREE.SphereGeometry(2.45, 12, 8),
    "#24113e",
    { emissive: "#3a115d", emissiveIntensity: 0.55 },
  );
  head.position.z = 11.15;
  model.add(head);
  addEyes(model, "#c46dff", 11.4);

  for (const x of [-1.55, 1.55]) {
    const horn = coneZ(0.72, 2.6, "#5b357e", 8);
    horn.position.set(x, 0.1, 13.15);
    horn.rotation.y = x < 0 ? -0.32 : 0.32;
    model.add(horn);
  }

  if (["glarewing", "whisperer"].includes(kind)) {
    for (const x of [-3.65, 3.65]) {
      const wing = primitive(
        new THREE.ConeGeometry(2.2, 5.1, 4),
        "#56317c",
        { emissive: "#411463", emissiveIntensity: 0.5 },
      );
      wing.rotation.z = x < 0 ? 0.58 : -0.58;
      wing.position.set(x, 1.15, 7.7);
      model.add(wing);
    }
  }

  if (kind === "mimic-mask") {
    const mask = primitive(
      new THREE.BoxGeometry(4.7, 0.7, 3.9),
      "#8a69ad",
      { emissive: "#5d327f", emissiveIntensity: 0.55 },
    );
    mask.position.set(0, -2.15, 10.85);
    model.add(mask);
  }

  if (kind === "bell-husk") {
    const bell = coneZ(4.1, 5.2, "#654b78", 12);
    bell.position.z = 8.7;
    model.add(bell);
  }

  const scale = ENEMY_SCALE[kind] ?? 0.9;
  group.scale.setScalar(scale);
  return {
    group,
    model,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    base,
    id: kind,
    seed: kind.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0),
  } satisfies MiniatureRig;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((item) => item.dispose());
  });
}

function cellScreenPosition(cellIndex: number) {
  const row = Math.floor(cellIndex / 7);
  const column = cellIndex % 7;
  const stagger = row === 1 || row === 3 ? 0.55 : 0;
  return {
    x: 2 + ((column + 0.5) / 7) * 96 + stagger,
    y: 21 + ((row + 0.5) / 5) * 44,
  };
}

export function BattlefieldMiniatures3D({
  board,
  starByCharacter,
  combat,
  phase,
  paused,
  selectedCharacterId,
  onReady,
}: BattlefieldMiniatures3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    board,
    starByCharacter,
    combat,
    phase,
    paused,
    selectedCharacterId,
  });

  useEffect(() => {
    stateRef.current = {
      board,
      starByCharacter,
      combat,
      phase,
      paused,
      selectedCharacterId,
    };
  }, [
    board,
    starByCharacter,
    combat,
    phase,
    paused,
    selectedCharacterId,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-50, 50, 60, -60, 0.1, 320);
    camera.position.set(58, -108, 96);
    camera.lookAt(0, 10, 0);
    scene.add(new THREE.HemisphereLight(0x9bc8ef, 0x24162d, 2.25));
    const keyLight = new THREE.DirectionalLight(0xffd99b, 3.5);
    keyLight.position.set(-42, -48, 90);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -80;
    keyLight.shadow.camera.right = 80;
    keyLight.shadow.camera.top = 100;
    keyLight.shadow.camera.bottom = -100;
    scene.add(keyLight);
    const violetRim = new THREE.DirectionalLight(0x8f5cff, 2.2);
    violetRim.position.set(55, 28, 56);
    scene.add(violetRim);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(190, 190),
      new THREE.ShadowMaterial({ color: 0x03050a, opacity: 0.34 }),
    );
    shadowPlane.receiveShadow = true;
    shadowPlane.position.z = -0.05;
    scene.add(shadowPlane);

    const heroRigs = new Map<string, MiniatureRig>();
    const enemyRigs = new Map<string, MiniatureRig>();
    const projectiles: FlyingProjectile[] = [];
    const impacts: ImpactFlash[] = [];
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const groundPoint = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animationFrame = 0;
    let lastCombatTick = combat?.tick ?? -1;

    const screenToGround = (xPercent: number, yPercent: number) => {
      ndc.set(xPercent / 50 - 1, 1 - yPercent / 50);
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, groundPoint);
      return groundPoint.clone();
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const viewHeight = 120;
      const viewWidth = viewHeight * (width / height);
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const removeRig = (
      collection: Map<string, MiniatureRig>,
      id: string,
    ) => {
      const rig = collection.get(id);
      if (!rig) return;
      scene.remove(rig.group);
      disposeObject(rig.group);
      collection.delete(id);
    };

    const createProjectile = (
      characterId: string,
      start: THREE.Vector3,
      end: THREE.Vector3,
      now: number,
    ) => {
      const character = CHARACTERS.find((item) => item.id === characterId);
      const color = new THREE.Color(character?.color || "#7ad8ff");
      const geometry =
        characterId === "mira"
          ? new THREE.OctahedronGeometry(0.9, 0)
          : characterId === "juniper"
            ? new THREE.ConeGeometry(0.55, 2.8, 7)
            : new THREE.SphereGeometry(
                characterId === "orla" ? 1.15 : 0.78,
                10,
                7,
              );
      const shot = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.98,
        }),
      );
      shot.position.copy(start);
      shot.scale.setScalar(0.85);
      scene.add(shot);
      projectiles.push({
        mesh: shot,
        start,
        end,
        born: now,
        duration: characterId === "juniper" ? 0.38 : 0.52,
        color,
      });
    };

    const createImpact = (position: THREE.Vector3, color: THREE.Color, now: number) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.35, 0.22, 7, 18),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      ring.position.copy(position);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      impacts.push({ mesh: ring, born: now, duration: 0.42 });
    };

    const renderFrame = () => {
      animationFrame = window.requestAnimationFrame(renderFrame);
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;
      const state = stateRef.current;
      const motionScale = state.paused ? 0 : 1;

      const deployed = Object.entries(state.board);
      const deployedIds = new Set(deployed.map(([, id]) => id));
      for (const id of Array.from(heroRigs.keys())) {
        if (!deployedIds.has(id)) removeRig(heroRigs, id);
      }
      for (const [cellValue, id] of deployed) {
        const star = state.starByCharacter[id] || 1;
        let rig = heroRigs.get(id);
        if (!rig) {
          rig = createHeroRig(id, star);
          const target = cellScreenPosition(Number(cellValue));
          rig.group.position.copy(screenToGround(target.x, target.y));
          scene.add(rig.group);
          heroRigs.set(id, rig);
        }
        const target = cellScreenPosition(Number(cellValue));
        const desired = screenToGround(target.x, target.y);
        const distance = rig.group.position.distanceTo(desired);
        rig.group.position.lerp(desired, 1 - Math.exp(-delta * 8));
        const stride = Math.sin(elapsed * 12 + rig.seed) * 0.55 * motionScale;
        const walking = distance > 0.16;
        const attacking =
          state.phase === "nightfall" &&
          Boolean(
            state.combat &&
              combatAttackCues(state.combat, state.board).some(
                (cue) => cue.characterId === id,
              ),
          );
        const work = state.phase === "work";
        const attackPulse = Math.max(
          0,
          Math.sin(elapsed * 6.4 + rig.seed * 0.03),
        );
        rig.model.position.z =
          1.15 +
          Math.sin(elapsed * 2.4 + rig.seed) * 0.2 * motionScale +
          (walking ? Math.abs(stride) * 0.24 : 0);
        rig.leftLeg.rotation.x = walking ? stride : 0;
        rig.rightLeg.rotation.x = walking ? -stride : 0;
        rig.leftArm.rotation.x = work
          ? Math.sin(elapsed * 8 + rig.seed) * 0.72 * motionScale
          : attacking
            ? -0.28 - attackPulse * 0.75 * motionScale
            : Math.sin(elapsed * 2.1 + rig.seed) * 0.08 * motionScale;
        rig.rightArm.rotation.x = work
          ? -Math.sin(elapsed * 8 + rig.seed) * 0.95 * motionScale
          : attacking
            ? -0.2 + attackPulse * 1.2 * motionScale
            : -0.12 - Math.sin(elapsed * 2.1 + rig.seed) * 0.08 * motionScale;
        const selectedPulse =
          state.selectedCharacterId === id
            ? 1 + Math.sin(elapsed * 5) * 0.045 * motionScale
            : 1;
        rig.base.scale.setScalar(selectedPulse);
        rig.model.rotation.z =
          attacking ? -attackPulse * 0.08 * motionScale : 0;
      }

      const activeEnemies = state.combat?.enemies ?? [];
      const enemyIds = new Set(activeEnemies.map((enemy) => enemy.id));
      for (const id of Array.from(enemyRigs.keys())) {
        if (!enemyIds.has(id)) removeRig(enemyRigs, id);
      }
      for (const enemy of activeEnemies) {
        let rig = enemyRigs.get(enemy.id);
        if (!rig) {
          rig = createEnemyRig(enemy.kind);
          const y = 12 + enemy.progress * 66;
          rig.group.position.copy(
            screenToGround([17, 50, 83][enemy.lane], y),
          );
          scene.add(rig.group);
          enemyRigs.set(enemy.id, rig);
        }
        const desired = screenToGround(
          [17, 50, 83][enemy.lane],
          12 + enemy.progress * 66,
        );
        rig.group.position.lerp(desired, 1 - Math.exp(-delta * 5.3));
        const walk = Math.sin(elapsed * 9 + rig.seed) * 0.65 * motionScale;
        rig.leftLeg.rotation.x = walk;
        rig.rightLeg.rotation.x = -walk;
        rig.leftArm.rotation.x = -walk * 0.55;
        rig.rightArm.rotation.x = walk * 0.55;
        rig.model.position.z =
          1 + Math.abs(walk) * 0.32 + Math.sin(elapsed * 3 + rig.seed) * 0.12;
        rig.model.rotation.z = Math.sin(elapsed * 4 + rig.seed) * 0.035;
      }

      if (
        state.phase === "nightfall" &&
        state.combat &&
        state.combat.tick !== lastCombatTick
      ) {
        lastCombatTick = state.combat.tick;
        for (const cue of combatAttackCues(state.combat, state.board)) {
          const attacker = heroRigs.get(cue.characterId);
          const target = enemyRigs.get(cue.targetId);
          if (!attacker || !target) continue;
          const start = attacker.group.position
            .clone()
            .add(new THREE.Vector3(0, 0, 9.5));
          const end = target.group.position
            .clone()
            .add(new THREE.Vector3(0, 0, 8));
          createProjectile(cue.characterId, start, end, elapsed);
        }
      } else if (!state.combat) {
        lastCombatTick = -1;
      }

      for (let index = projectiles.length - 1; index >= 0; index -= 1) {
        const shot = projectiles[index];
        if (state.paused) shot.born += delta;
        const progress = (elapsed - shot.born) / shot.duration;
        if (progress >= 1) {
          createImpact(shot.end, shot.color, elapsed);
          scene.remove(shot.mesh);
          shot.mesh.geometry.dispose();
          (shot.mesh.material as THREE.Material).dispose();
          projectiles.splice(index, 1);
          continue;
        }
        const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
        shot.mesh.position.lerpVectors(shot.start, shot.end, eased);
        shot.mesh.position.z += Math.sin(progress * Math.PI) * 8;
        shot.mesh.rotation.x += delta * 9 * motionScale;
        shot.mesh.rotation.z += delta * 12 * motionScale;
        shot.mesh.scale.setScalar(0.72 + Math.sin(progress * Math.PI) * 0.65);
      }

      for (let index = impacts.length - 1; index >= 0; index -= 1) {
        const impact = impacts[index];
        if (state.paused) impact.born += delta;
        const progress = (elapsed - impact.born) / impact.duration;
        if (progress >= 1) {
          scene.remove(impact.mesh);
          impact.mesh.geometry.dispose();
          (impact.mesh.material as THREE.Material).dispose();
          impacts.splice(index, 1);
          continue;
        }
        impact.mesh.scale.setScalar(0.5 + progress * 4);
        (impact.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.9 * (1 - progress);
      }

      renderer.render(scene, camera);
    };

    onReady?.();
    renderFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      disposeObject(scene);
      renderer.dispose();
    };
  }, [onReady]);

  return (
    <canvas
      ref={canvasRef}
      className="battlefield-miniatures-3d"
      aria-hidden="true"
    />
  );
}
