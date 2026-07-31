import * as THREE from "three";
import { disposeObject } from "./core";

const PARTICLE_CAPACITY = 720;

/** Soft round sprite so gl points render as glows instead of squares. */
function createGlowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface EmitOptions {
  position: THREE.Vector3;
  count: number;
  color: THREE.ColorRepresentation | THREE.ColorRepresentation[];
  speed?: number;
  /** Upward bias added to the random velocity, world units/second. */
  lift?: number;
  gravity?: number;
  drag?: number;
  life?: number;
  spread?: number;
}

/**
 * Single pooled additive point cloud used for every spark, ember, and puff.
 * Particles fade by darkening toward black, which additive blending renders
 * as transparent — no per-particle alpha needed.
 */
class ParticlePool {
  points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private velocities: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private gravity: Float32Array;
  private drag: Float32Array;
  private baseColor: Float32Array;
  private cursor = 0;
  private geometry: THREE.BufferGeometry;
  private texture!: THREE.CanvasTexture;

  constructor() {
    this.positions = new Float32Array(PARTICLE_CAPACITY * 3);
    this.colors = new Float32Array(PARTICLE_CAPACITY * 3);
    this.velocities = new Float32Array(PARTICLE_CAPACITY * 3);
    this.life = new Float32Array(PARTICLE_CAPACITY);
    this.maxLife = new Float32Array(PARTICLE_CAPACITY);
    this.gravity = new Float32Array(PARTICLE_CAPACITY);
    this.drag = new Float32Array(PARTICLE_CAPACITY);
    this.baseColor = new Float32Array(PARTICLE_CAPACITY * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.texture = createGlowTexture();
    const materialInstance = new THREE.PointsMaterial({
      size: 7,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this.texture,
    });
    this.points = new THREE.Points(this.geometry, materialInstance);
    this.points.frustumCulled = false;
  }

  emit(options: EmitOptions) {
    const {
      position,
      count,
      color,
      speed = 12,
      lift = 6,
      gravity = 26,
      drag = 2.4,
      life = 0.7,
      spread = 1,
    } = options;
    const palette = Array.isArray(color) ? color : [color];
    const swatch = new THREE.Color();
    for (let index = 0; index < count; index += 1) {
      const slot = this.cursor;
      this.cursor = (this.cursor + 1) % PARTICLE_CAPACITY;
      const offset = slot * 3;
      this.positions[offset] = position.x + (Math.random() - 0.5) * spread;
      this.positions[offset + 1] = position.y + (Math.random() - 0.5) * spread;
      this.positions[offset + 2] = position.z + (Math.random() - 0.5) * spread;
      const theta = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.35 + Math.random() * 0.65);
      const zBias = Math.random();
      this.velocities[offset] = Math.cos(theta) * magnitude * (1 - zBias * 0.5);
      this.velocities[offset + 1] = Math.sin(theta) * magnitude * (1 - zBias * 0.5);
      this.velocities[offset + 2] = lift + zBias * speed * 0.8;
      const duration = life * (0.55 + Math.random() * 0.75);
      this.life[slot] = duration;
      this.maxLife[slot] = duration;
      this.gravity[slot] = gravity;
      this.drag[slot] = drag;
      swatch.set(palette[Math.floor(Math.random() * palette.length)]);
      this.baseColor[offset] = swatch.r;
      this.baseColor[offset + 1] = swatch.g;
      this.baseColor[offset + 2] = swatch.b;
    }
  }

  update(delta: number) {
    for (let slot = 0; slot < PARTICLE_CAPACITY; slot += 1) {
      if (this.life[slot] <= 0) continue;
      this.life[slot] -= delta;
      const offset = slot * 3;
      if (this.life[slot] <= 0) {
        this.colors[offset] = 0;
        this.colors[offset + 1] = 0;
        this.colors[offset + 2] = 0;
        continue;
      }
      const damp = Math.max(0, 1 - this.drag[slot] * delta);
      this.velocities[offset] *= damp;
      this.velocities[offset + 1] *= damp;
      this.velocities[offset + 2] =
        this.velocities[offset + 2] * damp - this.gravity[slot] * delta;
      this.positions[offset] += this.velocities[offset] * delta;
      this.positions[offset + 1] += this.velocities[offset + 1] * delta;
      this.positions[offset + 2] += this.velocities[offset + 2] * delta;
      if (this.positions[offset + 2] < 0.2) {
        this.positions[offset + 2] = 0.2;
        this.velocities[offset + 2] *= -0.35;
      }
      const fade = this.life[slot] / this.maxLife[slot];
      const brightness = fade * fade;
      this.colors[offset] = this.baseColor[offset] * brightness;
      this.colors[offset + 1] = this.baseColor[offset + 1] * brightness;
      this.colors[offset + 2] = this.baseColor[offset + 2] * brightness;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.texture.dispose();
  }
}

interface Transient {
  object: THREE.Object3D;
  born: number;
  duration: number;
  update?: (progress: number, elapsed: number) => void;
  onComplete?: () => void;
}

export interface ProjectileOptions {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: THREE.ColorRepresentation;
  geometry?: THREE.BufferGeometry;
  duration?: number;
  arcHeight?: number;
  spin?: number;
  trailColor?: THREE.ColorRepresentation | THREE.ColorRepresentation[];
  trailRate?: number;
  onHit?: (position: THREE.Vector3) => void;
}

function jaggedPath(
  from: THREE.Vector3,
  to: THREE.Vector3,
  segments: number,
  jitter: number,
  target: Float32Array,
) {
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const wobble = index === 0 || index === segments ? 0 : jitter;
    target[index * 3] = THREE.MathUtils.lerp(from.x, to.x, t) + (Math.random() - 0.5) * wobble;
    target[index * 3 + 1] = THREE.MathUtils.lerp(from.y, to.y, t) + (Math.random() - 0.5) * wobble;
    target[index * 3 + 2] = THREE.MathUtils.lerp(from.z, to.z, t) + (Math.random() - 0.5) * wobble;
  }
}

export class EffectsManager {
  private scene: THREE.Scene;
  private pool: ParticlePool;
  private transients: Transient[] = [];
  private elapsed = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pool = new ParticlePool();
    scene.add(this.pool.points);
  }

  sparks(options: EmitOptions) {
    this.pool.emit(options);
  }

  private spawn(transient: Transient) {
    this.scene.add(transient.object);
    this.transients.push(transient);
  }

  private lightningStrand(
    from: THREE.Vector3,
    to: THREE.Vector3,
    color: THREE.ColorRepresentation,
    jitter: number,
    duration: number,
  ) {
    const segments = 14;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segments + 1) * 3);
    jaggedPath(from, to, segments, jitter, positions);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    line.frustumCulled = false;
    this.spawn({
      object: line,
      born: this.elapsed,
      duration,
      update: (progress) => {
        jaggedPath(from, to, segments, jitter * (1 - progress * 0.5), positions);
        geometry.attributes.position.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = 0.95 * (1 - progress);
      },
    });
  }

  /** Crackling bolt that re-jitters every frame while it lives. */
  lightning(from: THREE.Vector3, to: THREE.Vector3, color: THREE.ColorRepresentation) {
    // Three offset strands + a white-hot core read as one thick arc.
    this.lightningStrand(from, to, color, 3.2, 0.26);
    this.lightningStrand(from, to, color, 2.2, 0.22);
    this.lightningStrand(from, to, "#ffffff", 1.2, 0.16);
    this.sparks({ position: to.clone(), count: 9, color, speed: 14, life: 0.4 });
  }

  projectile(options: ProjectileOptions) {
    const {
      start,
      end,
      color,
      geometry = new THREE.SphereGeometry(0.8, 10, 7),
      duration = 0.5,
      arcHeight = 8,
      spin = 10,
      trailColor,
      trailRate = 26,
      onHit,
    } = options;
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.98 }),
    );
    mesh.position.copy(start);
    let trailBudget = 0;
    this.spawn({
      object: mesh,
      born: this.elapsed,
      duration,
      update: (progress, elapsedNow) => {
        const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
        mesh.position.lerpVectors(start, end, eased);
        mesh.position.z += Math.sin(progress * Math.PI) * arcHeight;
        mesh.rotation.x = elapsedNow * spin;
        mesh.rotation.z = elapsedNow * spin * 1.4;
        mesh.scale.setScalar(0.72 + Math.sin(progress * Math.PI) * 0.5);
        if (trailColor) {
          trailBudget += trailRate * (1 / 60);
          const emitCount = Math.floor(trailBudget);
          if (emitCount > 0) {
            trailBudget -= emitCount;
            this.sparks({
              position: mesh.position.clone(),
              count: emitCount,
              color: trailColor,
              speed: 2.5,
              lift: 0.5,
              gravity: 2,
              life: 0.35,
              spread: 0.6,
            });
          }
        }
      },
      onComplete: () => onHit?.(end.clone()),
    });
  }

  /** Expanding flat ring; used for impacts, shockwaves, and spawn portals. */
  groundRing(
    position: THREE.Vector3,
    color: THREE.ColorRepresentation,
    {
      duration = 0.45,
      startScale = 0.6,
      endScale = 4.5,
      travelTo,
      opacity = 0.9,
    }: {
      duration?: number;
      startScale?: number;
      endScale?: number;
      travelTo?: THREE.Vector3;
      opacity?: number;
    } = {},
  ) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.22, 7, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.position.copy(position);
    const from = position.clone();
    this.spawn({
      object: ring,
      born: this.elapsed,
      duration,
      update: (progress) => {
        ring.scale.setScalar(startScale + (endScale - startScale) * progress);
        (ring.material as THREE.MeshBasicMaterial).opacity = opacity * (1 - progress);
        if (travelTo) ring.position.lerpVectors(from, travelTo, progress);
      },
    });
  }

  /** Purple rift the Duskborn climb out of. */
  spawnPortal(position: THREE.Vector3) {
    this.groundRing(position, "#a45eff", {
      duration: 0.8,
      startScale: 0.3,
      endScale: 3.4,
      opacity: 0.85,
    });
    this.sparks({
      position: position.clone().setZ(1.5),
      count: 12,
      color: ["#a45eff", "#6b2fbf", "#d9b0ff"],
      speed: 9,
      lift: 11,
      gravity: 9,
      life: 0.8,
    });
  }

  deathBurst(position: THREE.Vector3, color: THREE.ColorRepresentation | THREE.ColorRepresentation[]) {
    this.groundRing(position.clone().setZ(0.4), "#d9b0ff", {
      duration: 0.5,
      endScale: 4,
    });
    this.sparks({
      position,
      count: 22,
      color,
      speed: 17,
      lift: 12,
      gravity: 22,
      life: 0.8,
      spread: 2.4,
    });
  }

  /** Root spikes bursting out of the ground under a snared enemy. */
  rootSnare(position: THREE.Vector3) {
    const cluster = new THREE.Group();
    const spikes: THREE.Mesh[] = [];
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + Math.random();
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 3.4 + Math.random() * 1.6, 6),
        new THREE.MeshStandardMaterial({ color: "#5c7a36", roughness: 0.8 }),
      );
      spike.rotation.x = Math.PI / 2;
      spike.rotation.z = (Math.random() - 0.5) * 0.8;
      spike.position.set(Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 0);
      cluster.add(spike);
      spikes.push(spike);
    }
    cluster.position.copy(position).setZ(0);
    this.spawn({
      object: cluster,
      born: this.elapsed,
      duration: 1.05,
      update: (progress) => {
        const grow =
          progress < 0.25
            ? progress / 0.25
            : progress > 0.75
              ? 1 - (progress - 0.75) / 0.25
              : 1;
        for (const spike of spikes) {
          spike.scale.set(1, grow, 1);
          spike.position.z = grow * 1.4;
        }
      },
    });
    this.sparks({
      position: position.clone().setZ(1),
      count: 8,
      color: ["#85b85a", "#5c7a36"],
      speed: 8,
      life: 0.5,
    });
  }

  /** Run a callback after an in-world delay (pause-aware). */
  delayed(duration: number, callback: () => void) {
    this.spawn({
      object: new THREE.Object3D(),
      born: this.elapsed,
      duration,
      onComplete: callback,
    });
  }

  update(delta: number, paused: boolean) {
    if (!paused) this.elapsed += delta;
    this.pool.update(paused ? 0 : delta);
    for (let index = this.transients.length - 1; index >= 0; index -= 1) {
      const transient = this.transients[index];
      if (paused) {
        transient.born += delta;
        continue;
      }
      const progress = (this.elapsed - transient.born) / transient.duration;
      if (progress >= 1) {
        this.scene.remove(transient.object);
        disposeObject(transient.object);
        this.transients.splice(index, 1);
        transient.onComplete?.();
        continue;
      }
      transient.update?.(Math.max(0, progress), this.elapsed);
    }
  }

  get time() {
    return this.elapsed;
  }

  dispose() {
    for (const transient of this.transients) {
      this.scene.remove(transient.object);
      disposeObject(transient.object);
    }
    this.transients = [];
    this.scene.remove(this.pool.points);
    this.pool.dispose();
  }
}

/** Slow ambient drift of fireflies over the battlefield. */
export class Fireflies {
  points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private seeds: Float32Array;
  private texture: THREE.CanvasTexture;

  constructor(count = 36) {
    this.texture = createGlowTexture();
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.seeds = new Float32Array(count * 3);
    const teal = new THREE.Color("#7ad8c8");
    const amber = new THREE.Color("#ffce7a");
    for (let index = 0; index < count; index += 1) {
      this.seeds[index * 3] = (Math.random() - 0.5) * 92;
      this.seeds[index * 3 + 1] = Math.random() * 88 - 24;
      this.seeds[index * 3 + 2] = Math.random() * Math.PI * 2;
      const tint = Math.random() < 0.5 ? teal : amber;
      colors[index * 3] = tint.r * 0.8;
      colors[index * 3 + 1] = tint.g * 0.8;
      colors[index * 3 + 2] = tint.b * 0.8;
    }
    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.points = new THREE.Points(
      this.geometry,
      new THREE.PointsMaterial({
        size: 4.4,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: this.texture,
      }),
    );
    this.points.frustumCulled = false;
  }

  update(elapsed: number) {
    const positions = this.geometry.attributes.position.array as Float32Array;
    for (let index = 0; index < this.seeds.length / 3; index += 1) {
      const phase = this.seeds[index * 3 + 2];
      positions[index * 3] =
        this.seeds[index * 3] + Math.sin(elapsed * 0.35 + phase * 2) * 6;
      positions[index * 3 + 1] =
        this.seeds[index * 3 + 1] + Math.cos(elapsed * 0.28 + phase) * 5;
      positions[index * 3 + 2] =
        6 + Math.sin(elapsed * 0.6 + phase * 3) * 4 + Math.sin(phase * 7) * 3;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.texture.dispose();
  }
}
