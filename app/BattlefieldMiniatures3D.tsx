"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CHARACTERS,
  combatAttackCues,
  type CombatWave,
  type ExpeditionPhase,
} from "./game-core";
import {
  dampAngle,
  disposeObject,
  facingAngle,
  material,
  setRigOpacity,
} from "./battle3d/core";
import { createHeroRig, type HeroRig } from "./battle3d/heroRigs";
import { createEnemyRig, type EnemyRig } from "./battle3d/enemyRigs";
import { EffectsManager, Fireflies } from "./battle3d/effects";

interface BattlefieldMiniatures3DProps {
  board: Record<number, string>;
  starByCharacter: Record<string, number>;
  combat: CombatWave | null;
  phase: ExpeditionPhase;
  paused: boolean;
  selectedCharacterId: string | null;
  onReady?: () => void;
}

interface HeroActor {
  rig: HeroRig;
  star: number;
  spawnAt: number;
  attackUntil: number;
  attackTargetId: string | null;
  facing: number;
  lastWorkSpark: number;
  lastFlourish: number;
}

type EnemyLifecycle = "spawning" | "active" | "dying" | "escaping";

interface EnemyActor {
  rig: EnemyRig;
  state: EnemyLifecycle;
  stateStart: number;
  lastHp: number;
  lastProgress: number;
  flash: number;
  moving: number;
  finalScale: number;
  markRune: THREE.Mesh | null;
  slowRing: THREE.Mesh | null;
  lastSnare: number;
}

const ENEMY_HEAD_HEIGHT: Record<string, number> = {
  mote: 6.5,
  glarewing: 9,
  "hollow-knight": 11,
  whisperer: 10,
  "mimic-mask": 9.5,
  "gloom-mason": 9,
  "parcel-leech": 4,
  "bell-husk": 8,
};

const HERO_BURST_COLORS: Record<string, string[]> = {
  mira: ["#7ad8ff", "#bdefff", "#4fa8e8"],
  bram: ["#85b85a", "#c9e29a", "#5c7a36"],
  pip: ["#ffd98c", "#d5a452", "#fff3d6"],
  orla: ["#ffcf7d", "#ff9a3c", "#ffe9c4"],
  nox: ["#b98aff", "#8c42cf", "#e3ccff"],
  tavi: ["#ffb26b", "#ff7a3c", "#ffe28f"],
  juniper: ["#b2f2c8", "#71c88b", "#eafff1"],
  kodo: ["#e8c48a", "#bd8b42", "#fff0cf"],
};

const HERO_BODY_SCALE: Record<string, number> = {
  pip: 0.88,
  tavi: 0.88,
  bram: 1.05,
  kodo: 1.05,
};

function cellScreenPosition(cellIndex: number) {
  const row = Math.floor(cellIndex / 7);
  const column = cellIndex % 7;
  const stagger = row === 1 || row === 3 ? 0.55 : 0;
  return {
    x: 2 + ((column + 0.5) / 7) * 96 + stagger,
    y: 21 + ((row + 0.5) / 5) * 44,
  };
}

function createMarkRune() {
  return new THREE.Mesh(
    new THREE.OctahedronGeometry(0.9, 0),
    material("#c37cff", {
      emissive: "#8c42cf",
      emissiveIntensity: 2.4,
      roughness: 0.2,
    }),
  );
}

function createSlowRing() {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.4, 0.32, 7, 22),
    material("#85b85a", {
      emissive: "#5c7a36",
      emissiveIntensity: 1.3,
      roughness: 0.5,
    }),
  );
  ring.position.z = 0.5;
  return ring;
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
  }, [board, starByCharacter, combat, phase, paused, selectedCharacterId]);

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

    const effects = new EffectsManager(scene);
    const fireflies = new Fireflies();
    scene.add(fireflies.points);

    const heroes = new Map<string, HeroActor>();
    const enemies = new Map<string, EnemyActor>();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const groundPoint = new THREE.Vector3();
    const worldScratch = new THREE.Vector3();
    const clock = new THREE.Clock();
    let animationFrame = 0;
    let lastCombatTick = combat?.tick ?? -1;

    const screenToGround = (xPercent: number, yPercent: number) => {
      ndc.set(xPercent / 50 - 1, 1 - yPercent / 50);
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, groundPoint);
      return groundPoint.clone();
    };

    const enemyGroundPosition = (lane: number, progress: number) =>
      screenToGround([17, 50, 83][lane], 12 + progress * 66);

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

    const removeHero = (id: string) => {
      const actor = heroes.get(id);
      if (!actor) return;
      scene.remove(actor.rig.group);
      disposeObject(actor.rig.group);
      heroes.delete(id);
    };

    const destroyEnemy = (id: string) => {
      const actor = enemies.get(id);
      if (!actor) return;
      scene.remove(actor.rig.group);
      disposeObject(actor.rig.group);
      enemies.delete(id);
    };

    const enemyHitPoint = (actor: EnemyActor) => {
      const height =
        (ENEMY_HEAD_HEIGHT[actor.rig.kind] ?? 8) * actor.rig.group.scale.x;
      return actor.rig.group.position
        .clone()
        .add(new THREE.Vector3(0, 0, height));
    };

    const nearestOtherEnemy = (excludeId: string, near: THREE.Vector3) => {
      let best: EnemyActor | null = null;
      let bestDistance = 30;
      for (const [id, actor] of enemies) {
        if (
          id === excludeId ||
          actor.state === "dying" ||
          actor.state === "escaping"
        )
          continue;
        const distance = actor.rig.group.position.distanceTo(near);
        if (distance < bestDistance) {
          best = actor;
          bestDistance = distance;
        }
      }
      return best;
    };

    const fireAttack = (
      heroActor: HeroActor,
      targetActor: EnemyActor,
      now: number,
    ) => {
      const heroId = heroActor.rig.id;
      const character = CHARACTERS.find((item) => item.id === heroId);
      const color = character?.color ?? "#7ad8ff";
      const burst = HERO_BURST_COLORS[heroId] ?? [color];
      const muzzle = heroActor.rig.muzzle.getWorldPosition(worldScratch).clone();
      const target = enemyHitPoint(targetActor);

      heroActor.attackUntil = now + 0.55;
      heroActor.attackTargetId = targetActor.rig.id;

      switch (heroId) {
        case "mira": {
          effects.lightning(muzzle, target, "#8fe0ff");
          const chained = nearestOtherEnemy(
            targetActor.rig.id,
            targetActor.rig.group.position,
          );
          if (chained) effects.lightning(target, enemyHitPoint(chained), "#5fb9ee");
          break;
        }
        case "juniper": {
          effects.projectile({
            start: muzzle,
            end: target,
            color: "#d6ffe2",
            geometry: new THREE.ConeGeometry(0.5, 2.6, 6),
            duration: 0.26,
            arcHeight: 3,
            spin: 0,
            trailColor: burst,
            onHit: (position) =>
              effects.sparks({
                position,
                count: 14,
                color: burst,
                speed: 16,
                life: 0.55,
              }),
          });
          break;
        }
        case "pip": {
          effects.projectile({
            start: muzzle,
            end: target,
            color: "#ffe9b8",
            duration: 0.32,
            arcHeight: 6,
            trailColor: "#ffd98c",
            onHit: (position) => {
              effects.sparks({
                position,
                count: 8,
                color: burst,
                speed: 12,
                life: 0.4,
              });
              const ricochet = nearestOtherEnemy(targetActor.rig.id, position);
              if (ricochet) {
                effects.projectile({
                  start: position,
                  end: enemyHitPoint(ricochet),
                  color: "#ffe9b8",
                  duration: 0.3,
                  arcHeight: 7,
                  trailColor: "#ffd98c",
                  onHit: (secondHit) =>
                    effects.sparks({
                      position: secondHit,
                      count: 8,
                      color: burst,
                      speed: 12,
                      life: 0.4,
                    }),
                });
              }
            },
          });
          break;
        }
        case "nox": {
          effects.projectile({
            start: muzzle,
            end: target,
            color: "#c9a2ff",
            geometry: new THREE.OctahedronGeometry(0.85, 0),
            duration: 0.55,
            arcHeight: 11,
            trailColor: ["#b98aff", "#7645b8"],
            onHit: (position) => {
              effects.groundRing(position.clone().setZ(0.4), "#b06cff", {
                endScale: 5,
              });
              effects.sparks({
                position,
                count: 10,
                color: burst,
                speed: 10,
                life: 0.6,
              });
            },
          });
          break;
        }
        case "tavi": {
          effects.projectile({
            start: muzzle,
            end: target,
            color: "#ffb26b",
            geometry: new THREE.BoxGeometry(1.1, 1.1, 1.3),
            duration: 0.6,
            arcHeight: 15,
            spin: 7,
            trailColor: ["#ffb26b", "#ff7a3c"],
            onHit: (position) => {
              effects.groundRing(position.clone().setZ(0.4), "#ff8a3c", {
                duration: 0.55,
                endScale: 6.5,
              });
              effects.sparks({
                position,
                count: 20,
                color: burst,
                speed: 14,
                lift: 14,
                gravity: 18,
                life: 0.75,
                spread: 3,
              });
            },
          });
          break;
        }
        case "orla": {
          effects.groundRing(muzzle.clone().setZ(0.4), "#ffcf7d", {
            duration: 0.3,
            startScale: 0.8,
            endScale: 2.6,
            travelTo: targetActor.rig.group.position.clone().setZ(0.4),
          });
          effects.delayed(0.3, () => {
            const actor = enemies.get(targetActor.rig.id);
            const position = actor ? enemyHitPoint(actor) : target;
            effects.sparks({
              position,
              count: 16,
              color: burst,
              speed: 15,
              life: 0.6,
            });
            effects.groundRing(position.clone().setZ(0.4), "#ff9a3c", {
              endScale: 5,
            });
          });
          break;
        }
        case "bram": {
          effects.rootSnare(targetActor.rig.group.position.clone());
          break;
        }
        case "kodo": {
          effects.groundRing(muzzle.clone().setZ(0.4), "#e8c48a", {
            duration: 0.34,
            startScale: 1,
            endScale: 3,
            travelTo: targetActor.rig.group.position.clone().setZ(0.4),
          });
          effects.delayed(0.34, () => {
            const actor = enemies.get(targetActor.rig.id);
            const position = actor ? enemyHitPoint(actor) : target;
            effects.sparks({
              position,
              count: 14,
              color: burst,
              speed: 13,
              gravity: 24,
              life: 0.55,
              spread: 2.5,
            });
          });
          break;
        }
        default: {
          effects.projectile({
            start: muzzle,
            end: target,
            color,
            duration: 0.45,
            trailColor: color,
            onHit: (position) =>
              effects.sparks({
                position,
                count: 10,
                color: burst,
                speed: 12,
                life: 0.5,
              }),
          });
        }
      }
    };

    const renderFrame = () => {
      animationFrame = window.requestAnimationFrame(renderFrame);
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;
      const state = stateRef.current;
      const motionScale = state.paused ? 0 : 1;

      // ---- Heroes -------------------------------------------------------
      const deployed = Object.entries(state.board);
      const deployedIds = new Set(deployed.map(([, id]) => id));
      for (const id of Array.from(heroes.keys())) {
        if (!deployedIds.has(id)) removeHero(id);
      }
      for (const [cellValue, id] of deployed) {
        const star = state.starByCharacter[id] || 1;
        let actor = heroes.get(id);
        if (actor && actor.star !== star) {
          // Merge upgrade: rebuild at the new rank with a celebratory burst.
          const position = actor.rig.group.position.clone();
          removeHero(id);
          effects.groundRing(position.clone().setZ(0.4), "#ffe27a", {
            duration: 0.7,
            endScale: 6,
          });
          effects.sparks({
            position: position.clone().setZ(6),
            count: 26,
            color: ["#ffe27a", "#fff6d8", "#ffb63c"],
            speed: 15,
            lift: 16,
            gravity: 16,
            life: 0.9,
            spread: 3,
          });
          actor = undefined;
        }
        if (!actor) {
          const rig = createHeroRig(id, star);
          const target = cellScreenPosition(Number(cellValue));
          rig.group.position.copy(screenToGround(target.x, target.y));
          scene.add(rig.group);
          actor = {
            rig,
            star,
            spawnAt: elapsed,
            attackUntil: 0,
            attackTargetId: null,
            facing: 0,
            lastWorkSpark: elapsed + Math.random(),
            lastFlourish: 0,
          };
          heroes.set(id, actor);
          effects.groundRing(rig.group.position.clone().setZ(0.4), "#ffd98c", {
            duration: 0.5,
            endScale: 3.6,
          });
        }
        const rig = actor.rig;
        const target = cellScreenPosition(Number(cellValue));
        const desired = screenToGround(target.x, target.y);
        const distance = rig.group.position.distanceTo(desired);
        rig.group.position.lerp(desired, 1 - Math.exp(-delta * 8));

        // Spawn pop-in with a little overshoot.
        const sinceSpawn = elapsed - actor.spawnAt;
        const spawnScale =
          sinceSpawn < 0.45
            ? 0.4 +
              0.6 * (1 - Math.pow(1 - sinceSpawn / 0.45, 3)) +
              Math.sin((sinceSpawn / 0.45) * Math.PI) * 0.08
            : 1;
        rig.group.scale.setScalar((HERO_BODY_SCALE[rig.id] ?? 0.94) * spawnScale);

        const stride = Math.sin(elapsed * 12 + rig.seed) * 0.55 * motionScale;
        const walking = distance > 0.16;
        const attacking = elapsed < actor.attackUntil && state.phase === "nightfall";
        const work = state.phase === "work";

        // Face the current attack target, otherwise drift back to camera.
        let targetFacing = 0;
        if (attacking && actor.attackTargetId) {
          const targetActor = enemies.get(actor.attackTargetId);
          if (targetActor) {
            const dx = targetActor.rig.group.position.x - rig.group.position.x;
            const dy = targetActor.rig.group.position.y - rig.group.position.y;
            targetFacing = facingAngle(dx, dy);
          }
        }
        actor.facing = dampAngle(actor.facing, targetFacing, 9, delta * motionScale);
        rig.model.rotation.z = actor.facing;

        // Wind-up then strike over the attack window.
        const attackProgress = attacking
          ? 1 - Math.max(0, actor.attackUntil - elapsed) / 0.55
          : 0;
        const swing =
          attackProgress < 0.4
            ? -(attackProgress / 0.4) * 1.15
            : 1.4 * ((attackProgress - 0.4) / 0.6) - 1.15;

        rig.model.position.z =
          1.15 +
          Math.sin(elapsed * 2.4 + rig.seed) * 0.2 * motionScale +
          (walking ? Math.abs(stride) * 0.24 : 0);
        rig.leftLeg.rotation.x = walking ? stride : 0;
        rig.rightLeg.rotation.x = walking ? -stride : 0;
        rig.leftArm.rotation.x = work
          ? Math.sin(elapsed * 8 + rig.seed) * 0.72 * motionScale
          : attacking
            ? swing * 0.35 * motionScale
            : Math.sin(elapsed * 2.1 + rig.seed) * 0.08 * motionScale;
        rig.rightArm.rotation.x = work
          ? -Math.sin(elapsed * 8 + rig.seed) * 0.95 * motionScale
          : attacking
            ? swing * motionScale
            : -0.12 - Math.sin(elapsed * 2.1 + rig.seed) * 0.08 * motionScale;
        rig.model.rotation.x = attacking ? Math.max(0, -swing) * 0.1 : 0;
        rig.head.rotation.z = attacking
          ? 0
          : Math.sin(elapsed * 0.7 + rig.seed * 0.4) * 0.28 * motionScale;

        // Idle flourishes (staff orb, furnace flicker, ink wisp...).
        rig.animateExtras(elapsed, delta, motionScale);

        // Orbiting star gems for merged Echoes.
        rig.starGems.children.forEach((gem, index) => {
          const gemPhase =
            elapsed * 1.7 + (gem.userData.phase as number) + index;
          gem.position.set(
            Math.cos(gemPhase) * 2.7,
            Math.sin(gemPhase) * 2.7,
            Math.sin(gemPhase * 2.3) * 0.5,
          );
          gem.rotation.z = gemPhase;
        });

        // Work-phase hammer sparks.
        if (work && motionScale > 0 && elapsed - actor.lastWorkSpark > 0.55) {
          actor.lastWorkSpark = elapsed + Math.random() * 0.3;
          effects.sparks({
            position: rig.muzzle.getWorldPosition(worldScratch).clone(),
            count: 5,
            color: ["#ffd98c", "#fff3d6"],
            speed: 8,
            lift: 7,
            life: 0.45,
          });
        }
        // Tavi's pots simmer between volleys.
        if (
          rig.id === "tavi" &&
          motionScale > 0 &&
          elapsed - actor.lastFlourish > 0.9
        ) {
          actor.lastFlourish = elapsed;
          effects.sparks({
            position: rig.group.position
              .clone()
              .add(new THREE.Vector3(0, 2, 13)),
            count: 2,
            color: "#5a5a66",
            speed: 1.4,
            lift: 4.5,
            gravity: -2,
            drag: 1.4,
            life: 1.1,
            spread: 1.2,
          });
        }

        const selectedPulse =
          state.selectedCharacterId === rig.id
            ? 1 + Math.sin(elapsed * 5) * 0.045 * motionScale
            : 1;
        rig.base.scale.setScalar(selectedPulse);
      }

      // ---- Enemies ------------------------------------------------------
      const activeEnemies = state.combat?.enemies ?? [];
      const activeIds = new Set(activeEnemies.map((enemy) => enemy.id));

      for (const enemy of activeEnemies) {
        let actor = enemies.get(enemy.id);
        if (!actor) {
          const rig = createEnemyRig(enemy.id, enemy.kind);
          rig.group.position.copy(
            enemyGroundPosition(enemy.lane, enemy.progress),
          );
          scene.add(rig.group);
          actor = {
            rig,
            state: "spawning",
            stateStart: elapsed,
            lastHp: enemy.hp,
            lastProgress: enemy.progress,
            flash: 0,
            moving: 0,
            finalScale: rig.group.scale.x,
            markRune: null,
            slowRing: null,
            lastSnare: 0,
          };
          enemies.set(enemy.id, actor);
          effects.spawnPortal(rig.group.position.clone());
        }

        if (enemy.hp < actor.lastHp - 0.01) actor.flash = 1;
        actor.lastHp = enemy.hp;
        actor.lastProgress = enemy.progress;

        const rig = actor.rig;
        const desired = enemyGroundPosition(enemy.lane, enemy.progress);
        const travel = rig.group.position.distanceTo(desired);
        rig.group.position.lerp(desired, 1 - Math.exp(-delta * 5.3));
        const speedEstimate = Math.min(1, travel * 1.6);
        actor.moving +=
          (speedEstimate - actor.moving) * (1 - Math.exp(-delta * 6));

        rig.model.position.z = 1;
        rig.animate(elapsed, delta, motionScale, actor.moving);

        // Rise out of the rift (applied after animate so it stacks on the
        // per-kind locomotion offset).
        if (actor.state === "spawning") {
          const progress = Math.min(1, (elapsed - actor.stateStart) / 0.55);
          rig.model.position.z -= (1 - progress) * 7;
          rig.group.scale.setScalar(actor.finalScale * (0.25 + 0.75 * progress));
          if (progress >= 1) actor.state = "active";
        }

        // Hit flash + recoil on every damage tick.
        if (actor.flash > 0) {
          actor.flash = Math.max(0, actor.flash - delta * 4.2);
          const boost = actor.flash * 2.2;
          for (const item of rig.materials) {
            item.emissiveIntensity =
              (item.userData.baseEmissiveIntensity as number) + boost;
          }
          rig.model.position.y = actor.flash * 1.3;
        } else {
          rig.model.position.y = 0;
        }

        // Status effects: Nox's mark and Bram's roots.
        if (enemy.marked && !actor.markRune) {
          actor.markRune = createMarkRune();
          rig.group.add(actor.markRune);
        } else if (!enemy.marked && actor.markRune) {
          rig.group.remove(actor.markRune);
          disposeObject(actor.markRune);
          actor.markRune = null;
        }
        if (actor.markRune) {
          const height = (ENEMY_HEAD_HEIGHT[rig.kind] ?? 8) + 4;
          actor.markRune.position.set(
            0,
            0,
            height + Math.sin(elapsed * 4) * 0.5,
          );
          actor.markRune.rotation.z = elapsed * 3;
        }
        if (enemy.slowed) {
          if (!actor.slowRing) {
            actor.slowRing = createSlowRing();
            rig.group.add(actor.slowRing);
          }
          actor.slowRing.rotation.z = elapsed * 0.8;
          if (elapsed - actor.lastSnare > 1.6) {
            actor.lastSnare = elapsed;
            effects.rootSnare(rig.group.position.clone());
          }
        } else if (actor.slowRing) {
          rig.group.remove(actor.slowRing);
          disposeObject(actor.slowRing);
          actor.slowRing = null;
        }
      }

      // Departed enemies: play a death or escape exit, then clean up.
      for (const [id, actor] of Array.from(enemies.entries())) {
        if (activeIds.has(id)) continue;
        if (actor.state === "dying") {
          const progress = (elapsed - actor.stateStart) / 0.55;
          if (progress >= 1) {
            destroyEnemy(id);
            continue;
          }
          const shrink = 1 - progress;
          actor.rig.group.scale.setScalar(
            actor.finalScale * Math.max(0.01, shrink),
          );
          actor.rig.model.rotation.x = progress * 1.1;
          setRigOpacity(actor.rig.group, shrink);
          continue;
        }
        if (actor.state === "escaping") {
          const progress = (elapsed - actor.stateStart) / 0.7;
          if (progress >= 1) {
            destroyEnemy(id);
            continue;
          }
          actor.rig.group.position.y -= delta * 26;
          actor.rig.model.position.z = 1 - progress * 5;
          setRigOpacity(actor.rig.group, 1 - progress);
          continue;
        }
        // First frame after removal: decide how this one leaves the board.
        if (actor.markRune) {
          actor.rig.group.remove(actor.markRune);
          disposeObject(actor.markRune);
          actor.markRune = null;
        }
        if (actor.slowRing) {
          actor.rig.group.remove(actor.slowRing);
          disposeObject(actor.slowRing);
          actor.slowRing = null;
        }
        actor.stateStart = elapsed;
        if (actor.lastProgress > 0.88) {
          actor.state = "escaping";
          effects.sparks({
            position: actor.rig.group.position.clone().setZ(4),
            count: 10,
            color: ["#3a2359", "#824ac3"],
            speed: 7,
            lift: 5,
            gravity: 4,
            life: 0.8,
            spread: 2.5,
          });
        } else {
          actor.state = "dying";
          effects.deathBurst(enemyHitPoint(actor).setZ(4), [
            "#c46dff",
            "#824ac3",
            "#e6d5ff",
          ]);
        }
      }

      // ---- Attack cues (one volley per combat tick) ---------------------
      if (
        state.phase === "nightfall" &&
        state.combat &&
        state.combat.tick !== lastCombatTick &&
        motionScale > 0
      ) {
        lastCombatTick = state.combat.tick;
        for (const cue of combatAttackCues(state.combat, state.board)) {
          const attacker = heroes.get(cue.characterId);
          const target = enemies.get(cue.targetId);
          if (!attacker || !target) continue;
          fireAttack(attacker, target, elapsed);
        }
      } else if (!state.combat) {
        lastCombatTick = -1;
      }

      fireflies.update(elapsed);
      effects.update(delta, state.paused);
      renderer.render(scene, camera);
    };

    onReady?.();
    renderFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      effects.dispose();
      fireflies.dispose();
      scene.remove(fireflies.points);
      disposeObject(scene);
      renderer.dispose();
    };
    // The scene graph is driven imperatively from stateRef each frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady]);

  return (
    <canvas
      ref={canvasRef}
      className="battlefield-miniatures-3d"
      aria-hidden="true"
    />
  );
}
