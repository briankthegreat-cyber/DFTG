"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEVELS,
  POWER_DURATIONS,
  TIERS,
  calculateAbsorbScore,
  circlesOverlap,
  classifySize,
  comboAfterEat,
  decayCombo,
  distanceToBoundary,
  isSpawnSafe,
  levelForScore,
  levelProgressForScore,
  resolveControlKey,
  stepMomentum,
  tierForMass,
  ufoReward,
} from "@/lib/game-logic";

type Screen = "title" | "tutorial" | "playing" | "paused" | "gameover" | "victory";
type Panel = "none" | "howto" | "settings";
type Behavior = "drifter" | "weaver" | "orbiter" | "comet" | "hunter" | "coward" | "gravity" | "splitter" | "pulsar";
type PickupKind = "Stardust Chain" | "Mass Crystal" | "Navigation Core" | "Repairing Light";
type EntityKind = "body" | "prism" | "pickup" | "ufo";

interface Settings {
  muted: boolean;
  reducedMotion: boolean;
  screenShake: boolean;
  highContrast: boolean;
}

interface Stats {
  bestScore: number;
  fastestRun: number | null;
  highestTier: number;
  prismCaught: number;
}

interface Entity {
  id: number;
  kind: EntityKind;
  pickup?: PickupKind;
  behavior: Behavior;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  accent: string;
  age: number;
  seed: number;
  angle: number;
  orbitRadius: number;
  nearMissed: boolean;
  absorbing: number;
  dead: boolean;
  label: string;
  hp: number;
  maxHp: number;
  attackTimer: number;
}

interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  dead: boolean;
  targetId?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  ring?: boolean;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface UISnapshot {
  score: number;
  mass: number;
  tier: number;
  combo: number;
  comboTimer: number;
  power: string | null;
  powerTimer: number;
  shield: boolean;
  elapsed: number;
  cause: string;
  announcement: string;
  prismWarning: boolean;
  navCore: number;
  newRecord: boolean;
  speed: number;
  ufoAlert: boolean;
  ufoHp: number;
  ufoMaxHp: number;
  ufoKills: number;
  fireReady: boolean;
  level: number;
  levelProgress: number;
  boundaryDistance: number;
  boundaryWarning: boolean;
  arenaX: number;
  arenaY: number;
}

interface GameActions {
  start: () => void;
  restart: () => void;
  resume: () => void;
  pause: () => void;
  title: () => void;
  endless: () => void;
  joystick: (x: number, y: number) => void;
  fire: () => void;
  debugTier: (delta: number) => void;
  debugPrism: () => void;
  debugPower: () => void;
  debugImpact: () => void;
  debugUfo: () => void;
  debugLevel: () => void;
  debugBoundary: () => void;
}

const SETTINGS_KEY = "cosmic-drift-settings-v1";
const STATS_KEY = "cosmic-drift-stats-v1";
const TUTORIAL_KEY = "cosmic-drift-tutorial-v1";
const FIXED_DT = 1 / 120;
const WORLD = { width: 4200, height: 3200 };
const BODY_COLORS = [
  ["#77e8ff", "#bfa3ff"],
  ["#ffb66e", "#ff6f91"],
  ["#b5c7dc", "#6e7b9a"],
  ["#f3cf91", "#996dc9"],
  ["#79dfc9", "#53a6ff"],
  ["#ffbe63", "#ff6b74"],
  ["#f7e08a", "#ff825c"],
  ["#c898ff", "#76edff"],
] as const;
const POWERUPS = ["Gravity Feast", "Phase Shift", "Solar Pulse", "Hyperdrive", "Time Fold", "Event Horizon Shield"] as const;
const PICKUPS: PickupKind[] = ["Stardust Chain", "Mass Crystal", "Navigation Core", "Repairing Light"];

const initialSettings: Settings = {
  muted: false,
  reducedMotion: false,
  screenShake: true,
  highContrast: false,
};

const initialStats: Stats = {
  bestScore: 0,
  fastestRun: null,
  highestTier: 0,
  prismCaught: 0,
};

const initialUI: UISnapshot = {
  score: 0,
  mass: 0,
  tier: 0,
  combo: 1,
  comboTimer: 0,
  power: null,
  powerTimer: 0,
  shield: false,
  elapsed: 0,
  cause: "",
  announcement: "",
  prismWarning: false,
  navCore: 0,
  newRecord: false,
  speed: 0,
  ufoAlert: false,
  ufoHp: 0,
  ufoMaxHp: 0,
  ufoKills: 0,
  fireReady: true,
  level: 0,
  levelProgress: 0,
  boundaryDistance: WORLD.height / 2,
  boundaryWarning: false,
  arenaX: 50,
  arenaY: 50,
};

function seeded(seed = 0x92e4ad1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

class CosmicAudio {
  context: AudioContext | null = null;
  muted = false;

  setMuted(value: boolean) {
    this.muted = value;
  }

  unlock() {
    if (this.muted || typeof window === "undefined") return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
  }

  tone(frequency: number, duration: number, gain = 0.04, type: OscillatorType = "sine", slide = 0) {
    if (this.muted) return;
    this.unlock();
    const ctx = this.context;
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), ctx.currentTime + duration);
    volume.gain.setValueAtTime(gain, ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  absorb(ratio = 0.5) {
    this.tone(280 + ratio * 240, 0.12, 0.035, "sine", 90);
  }

  evolve() {
    [190, 285, 430].forEach((tone, index) => window.setTimeout(() => this.tone(tone, 0.7, 0.045, "triangle", 120), index * 90));
  }

  prism() {
    [740, 980, 1320].forEach((tone, index) => window.setTimeout(() => this.tone(tone, 0.35, 0.035, "sine", 80), index * 75));
  }

  graze() {
    this.tone(620, 0.22, 0.025, "sawtooth", -320);
  }

  shield() {
    this.tone(150, 0.5, 0.06, "triangle", -90);
  }

  fire() {
    this.tone(760, 0.09, 0.026, "square", -330);
  }

  hit() {
    this.tone(260, 0.12, 0.032, "triangle", 150);
  }

  ufo() {
    [220, 275, 330].forEach((tone, index) => window.setTimeout(() => this.tone(tone, 0.28, 0.024, "sawtooth", 30), index * 95));
  }

  death() {
    this.tone(135, 0.75, 0.07, "sawtooth", -95);
  }
}

export default function CosmicDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const actionsRef = useRef<GameActions | null>(null);
  const screenRef = useRef<Screen>("title");
  const settingsRef = useRef<Settings>(initialSettings);
  const statsRef = useRef<Stats>(initialStats);
  const storageReadyRef = useRef(false);
  const [screen, setScreen] = useState<Screen>("title");
  const [panel, setPanel] = useState<Panel>("none");
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [ui, setUI] = useState<UISnapshot>(initialUI);
  const [debug, setDebug] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(true);

  useEffect(() => {
    const loadStoredState = window.setTimeout(() => {
      const storedSettings = window.localStorage.getItem(SETTINGS_KEY);
      const storedStats = window.localStorage.getItem(STATS_KEY);
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      try {
        if (storedSettings) setSettings({ ...initialSettings, ...JSON.parse(storedSettings) });
        else if (prefersReduced) setSettings((value) => ({ ...value, reducedMotion: true, screenShake: false }));
        if (storedStats) setStats({ ...initialStats, ...JSON.parse(storedStats) });
      } catch {
        // Ignore malformed local preferences and keep safe defaults.
      }
      storageReadyRef.current = true;
      setTutorialSeen(window.localStorage.getItem(TUTORIAL_KEY) === "seen");
      setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
    }, 0);
    return () => window.clearTimeout(loadStoredState);
  }, []);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    settingsRef.current = settings;
    if (!storageReadyRef.current) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    statsRef.current = stats;
    if (!storageReadyRef.current) return;
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const random = seeded(Number(new URLSearchParams(window.location.search).get("seed")) || 15578855);
    const audio = new CosmicAudio();
    audio.setMuted(settingsRef.current.muted);
    const stars = Array.from({ length: 190 }, (_, index) => ({
      x: random(),
      y: random(),
      size: 0.5 + random() * (index % 13 === 0 ? 2.1 : 1.2),
      alpha: 0.18 + random() * 0.72,
      depth: 0.08 + random() * 0.45,
      hue: random() > 0.74 ? (random() > 0.5 ? "#a9dfff" : "#e1c3ff") : "#ffffff",
    }));
    const keyboard = { left: false, right: false, up: false, down: false, fire: false };
    const entities: Entity[] = [];
    const bolts: Bolt[] = [];
    const particles: Particle[] = [];
    const floats: FloatText[] = [];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let entityId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let lastUISync = 0;
    let animationFrame = 0;
    let joystick = { x: 0, y: 0 };
    let gamepadNeutral = { x: 0, y: 0 };
    let aimAngle = 0;
    let fireRequested = false;
    let fireCooldown = 0;
    let lastPower = "";
    let endless = false;
    let gameOverCommitted = false;
    let victoryCommitted = false;
    let deathTimer = 0;
    let evolutionTimer = 0;
    let victoryTimer = 0;
    let prismCountdown = 40 + random() * 14;
    let prismWarning = false;
    let cometSpawned = false;
    let ufoCountdown = 18 + random() * 16;
    let ufoAlert = false;
    let ufoKills = 0;
    let level = 0;
    let boundaryFlash = 0;
    let boundaryImpactCooldown = 0;
    let screenShake = 0;
    let squash = 0;
    let spawnClock = 0;
    let stardustExtension = 0;
    let navCore = 0;
    let protection = 0;
    let power: string | null = null;
    let powerTimer = 0;
    let shield = false;
    let cause = "";
    let announcement = "";
    let announcementTimer = 0;
    let score = 0;
    let mass = 0;
    let tier = 0;
    let elapsed = 0;
    let comboCount = 0;
    let combo = 1;
    let comboTimer = 0;
    let newRecord = false;
    let player = {
      x: WORLD.width / 2,
      y: WORLD.height / 2,
      vx: 0,
      vy: 0,
      radius: TIERS[0].radius,
    };
    let camera = { x: player.x, y: player.y, zoom: 1 };

    const saveStats = (complete = false) => {
      const current = statsRef.current;
      const bestScore = Math.max(current.bestScore, Math.round(score));
      newRecord = score > current.bestScore;
      const next = {
        bestScore,
        fastestRun: complete && (!current.fastestRun || elapsed < current.fastestRun) ? elapsed : current.fastestRun,
        highestTier: Math.max(current.highestTier, tier),
        prismCaught: current.prismCaught,
      };
      statsRef.current = next;
      setStats(next);
    };

    const updateStatsPrism = () => {
      const next = { ...statsRef.current, prismCaught: statsRef.current.prismCaught + 1 };
      statsRef.current = next;
      setStats(next);
    };

    const addParticles = (x: number, y: number, color: string, count: number, force = 100, ring = false) => {
      const actualCount = settingsRef.current.reducedMotion ? Math.ceil(count * 0.4) : count;
      for (let i = 0; i < actualCount; i += 1) {
        const angle = random() * Math.PI * 2;
        const speed = force * (0.25 + random() * 0.9);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35 + random() * 0.65,
          maxLife: 0.35 + random() * 0.65,
          size: 1.5 + random() * 3.4,
          color,
          ring,
        });
      }
    };

    const labelForRadius = (radius: number) => {
      if (radius < 10) return "mineral fragment";
      if (radius < 16) return "meteor seed";
      if (radius < 25) return "asteroid";
      if (radius < 34) return "planetoid";
      if (radius < 43) return "moon";
      if (radius < 53) return "planet";
      if (radius < 64) return "young star";
      if (radius < 78) return "neutron star";
      return "ancient singularity";
    };

    const spawnAtEdge = (radius: number, dangerous: boolean) => {
      const viewRadius = Math.hypot(width, height) / Math.max(0.45, camera.zoom) * 0.58;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const angle = random() * Math.PI * 2;
        const distance = viewRadius + 130 + random() * 260;
        const candidate = {
          x: clamp(player.x + Math.cos(angle) * distance, 140, WORLD.width - 140),
          y: clamp(player.y + Math.sin(angle) * distance, 140, WORLD.height - 140),
          radius,
        };
        if (isSpawnSafe({ ...player }, candidate, dangerous)) return candidate;
      }
      return { x: clamp(player.x - viewRadius, 140, WORLD.width - 140), y: clamp(player.y - viewRadius, 140, WORLD.height - 140) };
    };

    const spawnBody = (forcedClass?: "edible" | "neutral" | "lethal", forcedBehavior?: Behavior) => {
      const roll = random();
      const edibleCutoff = 0.5 - level * 0.035;
      const neutralCutoff = 0.72 - level * 0.015;
      const category = forcedClass ?? (roll < edibleCutoff ? "edible" : roll < neutralCutoff ? "neutral" : "lethal");
      const ratio = category === "edible"
        ? 0.28 + random() * 0.58
        : category === "neutral"
          ? 0.94 + random() * 0.065
          : 1.1 + random() * (tier < 2 ? 1.25 : 0.85);
      const radius = clamp(player.radius * ratio, 5, 93);
      const position = spawnAtEdge(radius, category === "lethal");
      const angle = Math.atan2(player.y - position.y, player.x - position.x) + (random() - 0.5) * 1.4;
      const speed = 22 + random() * 62 + level * 8 + (forcedBehavior === "comet" ? 260 : 0);
      const palette = BODY_COLORS[Math.min(BODY_COLORS.length - 1, Math.max(0, tier + Math.round((ratio - 1) * 2)))];
      const behaviorRoll = random();
      const behavior = forcedBehavior ?? (
        behaviorRoll < 0.27 ? "drifter"
          : behaviorRoll < 0.43 ? "weaver"
            : behaviorRoll < 0.55 ? "coward"
              : behaviorRoll < 0.66 ? "hunter"
                : behaviorRoll < 0.75 ? "orbiter"
                  : behaviorRoll < 0.84 ? "gravity"
                    : behaviorRoll < 0.92 ? "splitter"
                      : "pulsar"
      );
      const flightAngle = behavior === "hunter" && category === "lethal"
        ? angle
        : angle + (random() > 0.5 ? 1 : -1) * (0.85 + random() * 0.95);
      entities.push({
        id: entityId += 1,
        kind: "body",
        behavior,
        x: position.x,
        y: position.y,
        vx: Math.cos(flightAngle) * speed,
        vy: Math.sin(flightAngle) * speed,
        radius,
        color: palette[0],
        accent: palette[1],
        age: 0,
        seed: random() * 1000,
        angle: flightAngle,
        orbitRadius: 70 + random() * 110,
        nearMissed: false,
        absorbing: 0,
        dead: false,
        label: behavior === "pulsar" ? "pulsar" : labelForRadius(radius),
        hp: 1,
        maxHp: 1,
        attackTimer: 0,
      });
    };

    const spawnPickup = () => {
      const radius = 10;
      const position = spawnAtEdge(radius, false);
      const angle = random() * Math.PI * 2;
      const pickup = PICKUPS[Math.floor(random() * PICKUPS.length)];
      entities.push({
        id: entityId += 1,
        kind: "pickup",
        pickup,
        behavior: "drifter",
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * 34,
        vy: Math.sin(angle) * 34,
        radius,
        color: "#ffe58e",
        accent: "#ffffff",
        age: 0,
        seed: random() * 1000,
        angle,
        orbitRadius: 0,
        nearMissed: false,
        absorbing: 0,
        dead: false,
        label: pickup,
        hp: 1,
        maxHp: 1,
        attackTimer: 0,
      });
    };

    const spawnPrism = () => {
      const angle = Math.atan2(player.vy, player.vx) + (random() - 0.5) * 1.4 + Math.PI;
      const distance = Math.hypot(width, height) / camera.zoom * 0.72 + 220;
      const x = clamp(player.x + Math.cos(angle) * distance, 80, WORLD.width - 80);
      const y = clamp(player.y + Math.sin(angle) * distance, 80, WORLD.height - 80);
      const toward = Math.atan2(player.y - y, player.x - x) + (random() - 0.5) * 0.85;
      entities.push({
        id: entityId += 1,
        kind: "prism",
        behavior: "comet",
        x,
        y,
        vx: Math.cos(toward) * 330,
        vy: Math.sin(toward) * 330,
        radius: 13,
        color: "#ffffff",
        accent: "#d2a8ff",
        age: 0,
        seed: random() * 1000,
        angle: toward,
        orbitRadius: 0,
        nearMissed: false,
        absorbing: 0,
        dead: false,
        label: "Prism Comet",
        hp: 1,
        maxHp: 1,
        attackTimer: 0,
      });
      audio.prism();
    };

    const spawnUfo = (nearPlayer = false) => {
      const radius = 28 + Math.min(10, tier * 1.4);
      const position = nearPlayer
        ? { x: clamp(player.x + 320, 100, WORLD.width - 100), y: player.y - 60 }
        : spawnAtEdge(radius, true);
      const angle = Math.atan2(player.y - position.y, player.x - position.x);
      const maxHp = 3 + Math.floor(tier / 2) + level;
      entities.push({
        id: entityId += 1,
        kind: "ufo",
        behavior: "hunter",
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * 68,
        vy: Math.sin(angle) * 68,
        radius,
        color: "#8bf8e5",
        accent: "#ff6ca8",
        age: 0,
        seed: random() * 1000,
        angle,
        orbitRadius: 190 + random() * 80,
        nearMissed: false,
        absorbing: 0,
        dead: false,
        label: "alien UFO raider",
        hp: maxHp,
        maxHp,
        attackTimer: 1.6,
      });
      ufoAlert = false;
      announcement = "ALIEN SIGNAL BREACH";
      announcementTimer = 2.4;
      audio.ufo();
    };

    const targetPopulation = () => (width < 760 ? 26 : 42) + level * 2;

    const populate = () => {
      while (entities.length < targetPopulation()) {
        if (random() < 0.08) spawnPickup();
        else spawnBody();
      }
    };

    const arrangeInitialField = () => {
      const visibleRadius = Math.min(width, height) / Math.max(0.6, camera.zoom) * 0.72;
      entities.forEach((entity, index) => {
        if (index > targetPopulation() * 0.86) return;
        const dangerous = entity.kind === "body" && classifySize(player.radius, entity.radius) === "lethal";
        const minimum = dangerous ? 360 : 120 + entity.radius;
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const angle = random() * Math.PI * 2;
          const distance = minimum + random() * Math.max(80, visibleRadius - minimum);
          const candidate = {
            x: clamp(player.x + Math.cos(angle) * distance, 120, WORLD.width - 120),
            y: clamp(player.y + Math.sin(angle) * distance, 120, WORLD.height - 120),
            radius: entity.radius,
          };
          if (!isSpawnSafe({ ...player }, candidate, dangerous)) continue;
          entity.x = candidate.x;
          entity.y = candidate.y;
          entity.age = random() * 2;
          break;
        }
      });
    };

    const reset = () => {
      entities.length = 0;
      bolts.length = 0;
      particles.length = 0;
      floats.length = 0;
      player = { x: WORLD.width / 2, y: WORLD.height / 2, vx: 0, vy: 0, radius: TIERS[0].radius };
      camera = { x: player.x, y: player.y, zoom: 1 };
      score = 0;
      mass = 0;
      tier = 0;
      elapsed = 0;
      comboCount = 0;
      combo = 1;
      comboTimer = 0;
      stardustExtension = 0;
      navCore = 0;
      protection = 1.8;
      power = null;
      powerTimer = 0;
      shield = false;
      cause = "";
      announcement = "";
      announcementTimer = 0;
      deathTimer = 0;
      evolutionTimer = 0;
      victoryTimer = 0;
      prismCountdown = 38 + random() * 16;
      prismWarning = false;
      cometSpawned = false;
      ufoCountdown = 18 + random() * 16;
      ufoAlert = false;
      ufoKills = 0;
      level = 0;
      boundaryFlash = 0;
      boundaryImpactCooldown = 0;
      aimAngle = 0;
      fireRequested = false;
      fireCooldown = 0;
      keyboard.left = false;
      keyboard.right = false;
      keyboard.up = false;
      keyboard.down = false;
      keyboard.fire = false;
      const connectedPad = (navigator.getGamepads?.() ?? [])[0];
      gamepadNeutral = {
        x: connectedPad?.axes?.[0] ?? 0,
        y: connectedPad?.axes?.[1] ?? 0,
      };
      screenShake = 0;
      squash = 0;
      endless = false;
      gameOverCommitted = false;
      victoryCommitted = false;
      newRecord = false;
      populate();
      arrangeInitialField();
      syncUI(true);
    };

    const setActivePower = (name: string) => {
      power = name;
      powerTimer = POWER_DURATIONS[name] ?? 5;
      lastPower = name;
      announcement = name.toUpperCase();
      announcementTimer = 2;
      if (name === "Event Horizon Shield") shield = true;
      if (name === "Solar Pulse") {
        addParticles(player.x, player.y, "#8ef8ff", 28, 260, true);
        entities.forEach((entity) => {
          if (entity.kind !== "body") return;
          const dx = entity.x - player.x;
          const dy = entity.y - player.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          if (distance < 520 && classifySize(player.radius, entity.radius) === "lethal") {
            entity.vx += (dx / distance) * 280;
            entity.vy += (dy / distance) * 280;
          }
          if (distance < 400 && entity.behavior === "splitter" && entity.radius < player.radius * 0.9) {
            entity.radius *= 0.62;
            spawnBody("edible", "drifter");
          }
        });
      }
    };

    const choosePower = () => {
      const options = POWERUPS.filter((name) => name !== lastPower);
      return options[Math.floor(random() * options.length)];
    };

    const grantPickup = (entity: Entity) => {
      switch (entity.pickup) {
        case "Stardust Chain":
          stardustExtension = 3.2;
          comboTimer += 3.2;
          announcement = "COMBO WINDOW EXTENDED";
          break;
        case "Mass Crystal":
          mass += 24 + tier * 5;
          score += 260;
          announcement = `+${24 + tier * 5} MASS`;
          break;
        case "Navigation Core":
          navCore = 8;
          announcement = "THREAT VECTORS ONLINE";
          break;
        default:
          if (shield) {
            powerTimer = Math.max(powerTimer, 18);
            announcement = "SHIELD RESTORED";
          } else {
            score += 500;
            announcement = "+500 LIGHT BONUS";
          }
      }
      announcementTimer = 1.5;
      audio.absorb(0.9);
      addParticles(entity.x, entity.y, "#ffe99c", 12, 110);
    };

    const evolveIfNeeded = () => {
      const nextTier = tierForMass(mass);
      if (nextTier <= tier) return;
      tier = nextTier;
      player.radius = TIERS[tier].radius;
      protection = 2;
      evolutionTimer = 1.25;
      announcement = TIERS[tier].name.toUpperCase();
      announcementTimer = 2.4;
      score += 900 * tier;
      addParticles(player.x, player.y, TIERS[tier].accent, 42, 230, true);
      audio.evolve();
      saveStats();
      if (tier === TIERS.length - 1 && !endless) victoryTimer = 1.7;
    };

    const updateLevelIfNeeded = () => {
      const nextLevel = levelForScore(score);
      if (nextLevel <= level) return;
      level = nextLevel;
      protection = Math.max(protection, 1.4);
      screenShake = Math.max(screenShake, 5);
      ufoCountdown = Math.min(ufoCountdown, Math.max(5, 13 - level * 1.5));
      announcement = `LEVEL ${level + 1} · ${LEVELS[level].name}`;
      announcementTimer = 3;
      canvas.dataset.level = String(level + 1);
      addParticles(player.x, player.y, LEVELS[level].accent, 28, 170, true);
      audio.evolve();
      for (let index = 0; index < level; index += 1) spawnBody(index % 2 ? "neutral" : "lethal");
    };

    const absorb = (entity: Entity) => {
      if (entity.dead || entity.absorbing > 0) return;
      entity.absorbing = 0.18;
      const ratio = entity.radius / player.radius;
      const gainedMass = Math.round(5 + entity.radius * 0.66 + tier * 2.6);
      const nextCombo = comboAfterEat(comboCount, comboTimer, 0, stardustExtension);
      comboCount = nextCombo.count;
      combo = nextCombo.multiplier;
      comboTimer = nextCombo.timer;
      score += calculateAbsorbScore(entity.radius, player.radius, combo);
      mass += gainedMass;
      squash = 0.22;
      floats.push({ x: entity.x, y: entity.y, text: `+${gainedMass} mass`, color: "#a8ffe2", life: 0.9 });
      addParticles(entity.x, entity.y, entity.color, 9, 95);
      audio.absorb(ratio);
      evolveIfNeeded();
    };

    const killPlayer = (entity: Entity) => {
      if (protection > 0 || deathTimer > 0 || power === "Phase Shift") return;
      if (shield) {
        shield = false;
        if (power === "Event Horizon Shield") {
          power = null;
          powerTimer = 0;
        }
        protection = 1.1;
        screenShake = 8;
        audio.shield();
        addParticles(player.x, player.y, "#b9fbff", 24, 190, true);
        const dx = entity.x - player.x;
        const dy = entity.y - player.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        entity.vx += (dx / distance) * 220;
        entity.vy += (dy / distance) * 220;
        announcement = "SHIELD FRACTURED";
        announcementTimer = 1.4;
        return;
      }
      cause = `Consumed by ${entity.label}`;
      deathTimer = 0.72;
      screenShake = 13;
      comboTimer = 0;
      audio.death();
      addParticles(player.x, player.y, "#ff6e9b", 46, 250);
    };

    const destroyUfo = (entity: Entity) => {
      entity.dead = true;
      const reward = ufoReward(tier);
      score += reward;
      mass += 18 + tier * 4;
      ufoKills += 1;
      ufoCountdown = Math.max(10, 30 + random() * 20 - level * 4);
      ufoAlert = false;
      screenShake = 7;
      announcement = "UFO NEUTRALIZED";
      announcementTimer = 2;
      floats.push({ x: entity.x, y: entity.y - entity.radius, text: `UFO DOWN +${reward}`, color: "#93ffe7", life: 1.4 });
      addParticles(entity.x, entity.y, "#82ffe3", 30, 230, true);
      addParticles(entity.x, entity.y, "#ff6ea9", 18, 175);
      audio.evolve();
      evolveIfNeeded();
    };

    const shoot = () => {
      if (screenRef.current !== "playing" || fireCooldown > 0 || deathTimer > 0) return;
      const nearbyUfo = entities
        .filter((entity) => entity.kind === "ufo" && !entity.dead)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      const inputMagnitude = Math.hypot(joystick.x, joystick.y)
        + Number(keyboard.left || keyboard.right || keyboard.up || keyboard.down);
      if (nearbyUfo && inputMagnitude === 0 && Math.hypot(nearbyUfo.x - player.x, nearbyUfo.y - player.y) < 900) {
        aimAngle = Math.atan2(nearbyUfo.y - player.y, nearbyUfo.x - player.x);
      }
      const speed = 820;
      const muzzle = player.radius + 9;
      bolts.push({
        x: player.x + Math.cos(aimAngle) * muzzle,
        y: player.y + Math.sin(aimAngle) * muzzle,
        vx: Math.cos(aimAngle) * speed + player.vx * 0.35,
        vy: Math.sin(aimAngle) * speed + player.vy * 0.35,
        radius: 4 + tier * 0.25,
        life: 3.2,
        dead: false,
        targetId: nearbyUfo?.id,
      });
      canvas.dataset.shotsFired = String(Number(canvas.dataset.shotsFired ?? "0") + 1);
      fireCooldown = Math.max(0.13, 0.24 - tier * 0.012);
      fireRequested = false;
      audio.fire();
      addParticles(
        player.x + Math.cos(aimAngle) * muzzle,
        player.y + Math.sin(aimAngle) * muzzle,
        tier >= 6 ? "#ffd87a" : "#88f7ff",
        4,
        80,
      );
    };

    const updateBolts = (dt: number) => {
      for (const bolt of bolts) {
        if (bolt.dead) continue;
        bolt.life -= dt;
        const target = entities.find((entity) => entity.id === bolt.targetId && entity.kind === "ufo" && !entity.dead);
        if (target) {
          const speed = Math.max(1, Math.hypot(bolt.vx, bolt.vy));
          const angle = Math.atan2(target.y - bolt.y, target.x - bolt.x);
          bolt.vx = Math.cos(angle) * speed;
          bolt.vy = Math.sin(angle) * speed;
        }
        bolt.x += bolt.vx * dt;
        bolt.y += bolt.vy * dt;
        if (bolt.life <= 0) {
          bolt.dead = true;
          continue;
        }
        for (const entity of entities) {
          if (entity.kind !== "ufo" || entity.dead) continue;
          if (!circlesOverlap(bolt, { ...entity, radius: entity.radius * 0.85 })) continue;
          bolt.dead = true;
          entity.hp -= 1;
          canvas.dataset.ufoHits = String(Number(canvas.dataset.ufoHits ?? "0") + 1);
          score += 75;
          screenShake = Math.max(screenShake, 2.5);
          addParticles(bolt.x, bolt.y, "#affff0", 10, 115);
          audio.hit();
          if (entity.hp <= 0) destroyUfo(entity);
          break;
        }
      }
      for (let i = bolts.length - 1; i >= 0; i -= 1) if (bolts[i].dead) bolts.splice(i, 1);
    };

    const applyBoundary = (body: { x: number; y: number; vx: number; vy: number }, dt: number, margin = 100) => {
      const strength = 6;
      if (body.x < margin) body.vx += (margin - body.x) * strength * dt;
      if (body.x > WORLD.width - margin) body.vx -= (body.x - WORLD.width + margin) * strength * dt;
      if (body.y < margin) body.vy += (margin - body.y) * strength * dt;
      if (body.y > WORLD.height - margin) body.vy -= (body.y - WORLD.height + margin) * strength * dt;
    };

    const confinePlayerToArena = () => {
      const padding = player.radius + 46;
      let impactX = 0;
      let impactY = 0;
      if (player.x < padding) {
        player.x = padding;
        player.vx = Math.abs(player.vx) * 0.58;
        impactX = 1;
      } else if (player.x > WORLD.width - padding) {
        player.x = WORLD.width - padding;
        player.vx = -Math.abs(player.vx) * 0.58;
        impactX = -1;
      }
      if (player.y < padding) {
        player.y = padding;
        player.vy = Math.abs(player.vy) * 0.58;
        impactY = 1;
      } else if (player.y > WORLD.height - padding) {
        player.y = WORLD.height - padding;
        player.vy = -Math.abs(player.vy) * 0.58;
        impactY = -1;
      }
      if ((impactX || impactY) && boundaryImpactCooldown <= 0) {
        boundaryImpactCooldown = 0.65;
        boundaryFlash = 1;
        screenShake = Math.max(screenShake, 6);
        announcement = "VOID WALL · COURSE CORRECTED";
        announcementTimer = 1.4;
        addParticles(player.x, player.y, "#7df7ff", 16, 145, true);
        audio.hit();
      }
    };

    const updateEntity = (entity: Entity, dt: number) => {
      entity.age += dt;
      if (entity.absorbing > 0) {
        entity.absorbing -= dt;
        const pull = clamp(dt * 12, 0, 1);
        entity.x = lerp(entity.x, player.x, pull);
        entity.y = lerp(entity.y, player.y, pull);
        entity.radius *= Math.pow(0.02, dt);
        if (entity.absorbing <= 0) entity.dead = true;
        return;
      }

      const dx = player.x - entity.x;
      const dy = player.y - entity.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;
      const className = entity.kind === "body" ? classifySize(player.radius, entity.radius) : "edible";

      if (entity.kind === "ufo") {
        const preferred = entity.orbitRadius;
        const radial = clamp((distance - preferred) / preferred, -1, 1);
        const strafe = Math.sin(entity.age * 1.25 + entity.seed) * 0.72;
        entity.vx += (nx * radial - ny * strafe) * 72 * dt;
        entity.vy += (ny * radial + nx * strafe) * 72 * dt;
        entity.angle = Math.atan2(entity.vy, entity.vx);
      } else if (entity.behavior === "weaver") {
        const wave = Math.sin(entity.age * 1.25 + entity.seed) * 24;
        const speed = Math.max(1, Math.hypot(entity.vx, entity.vy));
        entity.vx += (-entity.vy / speed) * wave * dt;
        entity.vy += (entity.vx / speed) * wave * dt;
      } else if (entity.behavior === "hunter" && className === "lethal" && distance < 760) {
        entity.vx += nx * 22 * dt;
        entity.vy += ny * 22 * dt;
      } else if (entity.behavior === "coward" && className === "edible" && distance < 420) {
        entity.vx -= nx * 48 * dt;
        entity.vy -= ny * 48 * dt;
      } else if (entity.behavior === "orbiter") {
        entity.vx += (-ny + nx * Math.sin(entity.age * 0.7) * 0.25) * 28 * dt;
        entity.vy += (nx + ny * Math.sin(entity.age * 0.7) * 0.25) * 28 * dt;
      } else if (entity.behavior === "gravity" && className === "lethal" && distance < 480) {
        entity.vx += -ny * 9 * dt;
        entity.vy += nx * 9 * dt;
      } else if (entity.behavior === "pulsar" && className === "lethal") {
        const pulse = entity.age % 3.6;
        if (pulse > 3.48 && distance < 360) {
          entity.vx -= nx * 24 * dt;
          entity.vy -= ny * 24 * dt;
        }
      } else if (entity.kind === "prism") {
        const curve = Math.sin(entity.age * 1.8 + entity.seed) * 42;
        const speed = Math.max(1, Math.hypot(entity.vx, entity.vy));
        entity.vx += (-entity.vy / speed) * curve * dt;
        entity.vy += (entity.vx / speed) * curve * dt;
      }

      if (power === "Gravity Feast" && className === "edible" && entity.kind === "body" && distance < 640) {
        entity.vx += nx * 185 * dt;
        entity.vy += ny * 185 * dt;
      }

      const entitySpeed = Math.hypot(entity.vx, entity.vy);
      const cap = entity.behavior === "comet"
        ? 390
        : entity.kind === "ufo"
          ? clamp(Math.hypot(player.vx, player.vy) + 90, 200, 440)
          : 130;
      if (entitySpeed > cap) {
        entity.vx = (entity.vx / entitySpeed) * cap;
        entity.vy = (entity.vy / entitySpeed) * cap;
      }
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      applyBoundary(entity, dt, 55);
    };

    const resolveCollisions = () => {
      for (const entity of entities) {
        if (entity.dead || entity.absorbing > 0) continue;
        const dx = entity.x - player.x;
        const dy = entity.y - player.y;
        const distance = Math.max(0.001, Math.hypot(dx, dy));
        const collisionDistance = (player.radius + entity.radius) * 0.86;

        if (entity.kind === "prism" && distance < collisionDistance + 5) {
          entity.dead = true;
          score += 1600;
          updateStatsPrism();
          setActivePower(choosePower());
          addParticles(entity.x, entity.y, "#ffffff", 30, 210);
          audio.prism();
          continue;
        }
        if (entity.kind === "pickup" && distance < collisionDistance + 3) {
          entity.dead = true;
          grantPickup(entity);
          evolveIfNeeded();
          continue;
        }
        if (entity.kind === "ufo") {
          if (distance < collisionDistance) killPlayer(entity);
          continue;
        }
        if (entity.kind !== "body") continue;
        const collisionClass = classifySize(player.radius, entity.radius);
        if (distance < collisionDistance) {
          if (collisionClass === "edible") {
            absorb(entity);
          } else if (collisionClass === "lethal") {
            killPlayer(entity);
          } else {
            const nx = dx / distance;
            const ny = dy / distance;
            const relative = (player.vx - entity.vx) * nx + (player.vy - entity.vy) * ny;
            const overlap = Math.max(0, collisionDistance - distance);
            player.x -= nx * overlap * 0.32;
            player.y -= ny * overlap * 0.32;
            entity.x += nx * overlap * 0.68;
            entity.y += ny * overlap * 0.68;
            if (relative > 0) {
              const impulse = Math.min(76, relative * 0.52);
              player.vx -= nx * impulse * 0.28;
              player.vy -= ny * impulse * 0.28;
              entity.vx += nx * impulse * 0.72;
              entity.vy += ny * impulse * 0.72;
            }
            addParticles((player.x + entity.x) / 2, (player.y + entity.y) / 2, "#ffd68a", 5, 55);
          }
        } else if (collisionClass === "lethal" && !entity.nearMissed && distance < collisionDistance + 34) {
          entity.nearMissed = true;
          score += 280 * combo;
          floats.push({ x: player.x, y: player.y - player.radius - 18, text: "GRAVITY GRAZE", color: "#ffd47d", life: 1.1 });
          audio.graze();
        }
      }
    };

    const syncUI = (force = false) => {
      const now = performance.now();
      if (!force && now - lastUISync < 100) return;
      lastUISync = now;
      const activeUfo = entities.find((entity) => entity.kind === "ufo" && !entity.dead);
      const boundaryDistance = distanceToBoundary(player.x, player.y, WORLD.width, WORLD.height);
      setUI({
        score: Math.round(score),
        mass: Math.round(mass),
        tier,
        combo,
        comboTimer,
        power,
        powerTimer,
        shield,
        elapsed,
        cause,
        announcement: announcementTimer > 0 ? announcement : "",
        prismWarning,
        navCore,
        newRecord,
        speed: Math.round(Math.hypot(player.vx, player.vy)),
        ufoAlert,
        ufoHp: activeUfo?.hp ?? 0,
        ufoMaxHp: activeUfo?.maxHp ?? 0,
        ufoKills,
        fireReady: fireCooldown <= 0,
        level,
        levelProgress: levelProgressForScore(score),
        boundaryDistance: Math.round(boundaryDistance),
        boundaryWarning: boundaryDistance < 430,
        arenaX: clamp(player.x / WORLD.width * 100, 0, 100),
        arenaY: clamp(player.y / WORLD.height * 100, 0, 100),
      });
    };

    const gameInput = () => {
      let x = 0;
      let y = 0;
      let inputSource = "none";
      if (keyboard.left) x -= 1;
      if (keyboard.right) x += 1;
      if (keyboard.up) y -= 1;
      if (keyboard.down) y += 1;
      if (Math.hypot(x, y) > 0.08) inputSource = "keyboard";
      if (Math.hypot(joystick.x, joystick.y) > 0.08) {
        x = joystick.x;
        y = joystick.y;
        inputSource = "touch";
      }
      const pad = (navigator.getGamepads?.() ?? [])[0];
      const padX = (pad?.axes?.[0] ?? 0) - gamepadNeutral.x;
      const padY = (pad?.axes?.[1] ?? 0) - gamepadNeutral.y;
      if (Math.hypot(x, y) <= 0.08 && (Math.abs(padX) > 0.16 || Math.abs(padY) > 0.16)) {
        x = padX;
        y = padY;
        inputSource = "gamepad";
      }
      const magnitude = Math.hypot(x, y);
      if (magnitude > 0.08) aimAngle = Math.atan2(y, x);
      canvas.dataset.inputSource = inputSource;
      canvas.dataset.inputVector = `${x.toFixed(2)},${y.toFixed(2)}`;
      return magnitude > 1 ? { x: x / magnitude, y: y / magnitude } : { x, y };
    };

    const fixedUpdate = (dt: number) => {
      if (screenRef.current !== "playing") return;
      audio.setMuted(settingsRef.current.muted);
      elapsed += dt;
      protection = Math.max(0, protection - dt);
      navCore = Math.max(0, navCore - dt);
      announcementTimer = Math.max(0, announcementTimer - dt);
      evolutionTimer = Math.max(0, evolutionTimer - dt);
      squash = Math.max(0, squash - dt);
      screenShake = Math.max(0, screenShake - dt * 18);
      boundaryFlash = Math.max(0, boundaryFlash - dt * 1.8);
      boundaryImpactCooldown = Math.max(0, boundaryImpactCooldown - dt);
      fireCooldown = Math.max(0, fireCooldown - dt);

      if (deathTimer > 0) {
        deathTimer -= dt;
        if (deathTimer <= 0 && !gameOverCommitted) {
          gameOverCommitted = true;
          saveStats();
          setScreen("gameover");
        }
        syncUI();
        return;
      }

      if (victoryTimer > 0) {
        victoryTimer -= dt;
        score += dt * 400;
        if (victoryTimer <= 0 && !victoryCommitted) {
          victoryCommitted = true;
          saveStats(true);
          setScreen("victory");
        }
      }

      const stageDrag = 1.35 + tier * 0.035;
      const stageAcceleration = 520 * Math.pow(0.96, tier) * (power === "Hyperdrive" ? 1.45 : 1);
      const stageMaxSpeed = lerp(300, 225, tier / 7) * (power === "Hyperdrive" ? 1.45 : 1);
      const input = gameInput();
      const gamepadFire = (navigator.getGamepads?.() ?? [])[0]?.buttons?.[0]?.pressed ?? false;
      if (keyboard.fire || fireRequested || gamepadFire) shoot();
      const nextVelocity = stepMomentum({ x: player.vx, y: player.vy }, input, dt, stageAcceleration, stageMaxSpeed, stageDrag);
      player.vx = nextVelocity.x;
      player.vy = nextVelocity.y;
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      applyBoundary(player, dt, 180);
      confinePlayerToArena();

      const comboState = decayCombo(comboCount, comboTimer, dt);
      comboCount = comboState.count;
      combo = comboState.multiplier;
      comboTimer = comboState.timer;
      if (comboTimer === 0) stardustExtension = 0;

      if (power) {
        powerTimer = Math.max(0, powerTimer - dt);
        if (powerTimer === 0) {
          if (power === "Event Horizon Shield") shield = false;
          power = null;
        }
      }

      prismCountdown -= dt;
      if (prismCountdown < 2.4 && !cometSpawned) prismWarning = true;
      if (prismCountdown <= 0 && !cometSpawned) {
        cometSpawned = true;
        prismWarning = false;
        spawnPrism();
      }
      if (cometSpawned && !entities.some((entity) => entity.kind === "prism")) {
        prismCountdown = 35 + random() * 20;
        cometSpawned = false;
      }

      const hasActiveUfo = entities.some((entity) => entity.kind === "ufo" && !entity.dead);
      if (!hasActiveUfo) {
        ufoCountdown -= dt;
        ufoAlert = ufoCountdown < 2.8;
        if (ufoCountdown <= 0) spawnUfo();
      } else {
        ufoAlert = false;
      }

      const worldTimeScale = power === "Time Fold" ? 0.55 : evolutionTimer > 0 ? 0.42 : 1;
      entities.forEach((entity) => updateEntity(entity, dt * worldTimeScale));
      updateBolts(dt);
      resolveCollisions();
      updateLevelIfNeeded();
      const postCollisionSpeed = Math.hypot(player.vx, player.vy);
      const externalImpulseCap = stageMaxSpeed * 1.18;
      if (postCollisionSpeed > externalImpulseCap) {
        player.vx = (player.vx / postCollisionSpeed) * externalImpulseCap;
        player.vy = (player.vy / postCollisionSpeed) * externalImpulseCap;
      }

      spawnClock -= dt;
      if (spawnClock <= 0 && entities.length < targetPopulation()) {
        if (random() < 0.1) spawnPickup();
        else spawnBody();
        spawnClock = 0.12;
      }

      for (const particle of particles) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.exp(-2.2 * dt);
        particle.vy *= Math.exp(-2.2 * dt);
      }
      for (const float of floats) {
        float.life -= dt;
        float.y -= 28 * dt;
      }

      const maxDistance = Math.hypot(width, height) / Math.max(0.45, camera.zoom) + 700;
      for (let i = entities.length - 1; i >= 0; i -= 1) {
        const entity = entities[i];
        const distance = Math.hypot(entity.x - player.x, entity.y - player.y);
        if (entity.dead || (entity.kind !== "ufo" && distance > maxDistance && entity.age > 3)) {
          entities.splice(i, 1);
        }
      }
      for (let i = bolts.length - 1; i >= 0; i -= 1) if (bolts[i].dead) bolts.splice(i, 1);
      for (let i = particles.length - 1; i >= 0; i -= 1) if (particles[i].life <= 0) particles.splice(i, 1);
      for (let i = floats.length - 1; i >= 0; i -= 1) if (floats[i].life <= 0) floats.splice(i, 1);

      const lookAhead = settingsRef.current.reducedMotion ? 0.08 : 0.18;
      const follow = 1 - Math.exp(-4.5 * dt);
      camera.x = lerp(camera.x, player.x + player.vx * lookAhead, follow);
      camera.y = lerp(camera.y, player.y + player.vy * lookAhead, follow);
      const targetZoom = lerp(1, 0.59, tier / 7);
      camera.zoom = lerp(camera.zoom, targetZoom, 1 - Math.exp(-1.8 * dt));
      populate();
      syncUI();
    };

    const drawGlowCircle = (x: number, y: number, radius: number, color: string, blur = 20) => {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const worldToScreen = (x: number, y: number) => ({
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2,
    });

    const drawBackground = (time: number) => {
      const palettes = [
        ["#06091d", "#14154a", "#20205c"],
        ["#070b1e", "#222244", "#48264f"],
        ["#090c1c", "#202949", "#544059"],
        ["#070f20", "#123a4d", "#32265d"],
        ["#0f0b20", "#4d243f", "#1c4260"],
        ["#090714", "#331339", "#071b2e"],
      ];
      const palette = palettes[Math.min(5, Math.floor(tier * 0.82))];
      const gradient = ctx.createRadialGradient(width * 0.54, height * 0.45, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.85);
      gradient.addColorStop(0, palette[2]);
      gradient.addColorStop(0.42, palette[1]);
      gradient.addColorStop(1, palette[0]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 5; i += 1) {
        const drift = settingsRef.current.reducedMotion ? 0 : time * (1.5 + i * 0.3);
        const x = ((i * 0.27 * width - camera.x * 0.018 + drift) % (width * 1.4)) - width * 0.2;
        const y = ((i * 0.36 * height - camera.y * 0.012) % (height * 1.4)) - height * 0.2;
        const cloud = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * 0.3);
        cloud.addColorStop(0, i % 2 ? "rgba(154,92,212,.1)" : "rgba(60,211,224,.08)");
        cloud.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cloud;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      const speed = Math.hypot(player.vx, player.vy);
      for (const star of stars) {
        const sx = ((star.x * width * 1.3 - camera.x * star.depth * 0.06) % (width + 80) + width + 80) % (width + 80) - 40;
        const sy = ((star.y * height * 1.3 - camera.y * star.depth * 0.06) % (height + 80) + height + 80) % (height + 80) - 40;
        ctx.globalAlpha = star.alpha;
        ctx.strokeStyle = star.hue;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        const stretch = clamp(speed / 230, 0, power === "Hyperdrive" ? 16 : 5) * star.depth;
        const speedMag = Math.max(1, speed);
        ctx.lineTo(sx - (player.vx / speedMag) * stretch, sy - (player.vy / speedMag) * stretch);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawArenaBoundary = (time: number) => {
      const inset = 42;
      const topLeft = worldToScreen(inset, inset);
      const bottomRight = worldToScreen(WORLD.width - inset, WORLD.height - inset);
      const wallWidth = bottomRight.x - topLeft.x;
      const wallHeight = bottomRight.y - topLeft.y;
      ctx.save();
      ctx.globalAlpha = 0.48 + boundaryFlash * 0.42;
      ctx.strokeStyle = boundaryFlash > 0 ? "#ffffff" : LEVELS[level].accent;
      ctx.shadowColor = LEVELS[level].accent;
      ctx.shadowBlur = 14 + boundaryFlash * 22;
      ctx.lineWidth = 2 + boundaryFlash * 2;
      ctx.setLineDash([18, 12, 3, 12]);
      ctx.lineDashOffset = -time * (24 + level * 4);
      ctx.strokeRect(topLeft.x, topLeft.y, wallWidth, wallHeight);
      ctx.globalAlpha *= 0.4;
      ctx.lineWidth = 8;
      ctx.setLineDash([]);
      ctx.strokeRect(topLeft.x, topLeft.y, wallWidth, wallHeight);

      const boundaryDistance = distanceToBoundary(player.x, player.y, WORLD.width, WORLD.height);
      if (boundaryDistance < 620) {
        const distances = [
          { value: player.x, x: inset, y: player.y },
          { value: WORLD.width - player.x, x: WORLD.width - inset, y: player.y },
          { value: player.y, x: player.x, y: inset },
          { value: WORLD.height - player.y, x: player.x, y: WORLD.height - inset },
        ];
        const nearest = distances.reduce((best, item) => item.value < best.value ? item : best);
        const label = worldToScreen(nearest.x, nearest.y);
        ctx.globalAlpha = clamp(1 - boundaryDistance / 620, 0.25, 0.85);
        ctx.fillStyle = "#d9ffff";
        ctx.shadowBlur = 12;
        ctx.font = "800 10px 'Arial Narrow', sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "2px";
        ctx.fillText("VOID WALL // ARENA LIMIT", label.x, label.y - 14);
      }
      ctx.restore();
    };

    const drawRim = (entity: Entity, x: number, y: number, radius: number) => {
      if (entity.kind !== "body") return;
      const distance = Math.hypot(entity.x - player.x, entity.y - player.y);
      if (distance > 440 / camera.zoom) return;
      const status = classifySize(player.radius, entity.radius);
      const color = status === "edible" ? "#73ffd0" : status === "lethal" ? "#ff5c9d" : "#ffd978";
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = settingsRef.current.highContrast ? 3 : 1.25;
      ctx.globalAlpha = settingsRef.current.highContrast ? 0.96 : 0.54;
      ctx.setLineDash(status === "edible" ? [3, 7] : status === "lethal" ? [10, 4] : [2, 2]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      if (status === "lethal") {
        for (let i = 0; i < 3; i += 1) {
          const angle = entity.age * 0.45 + i * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle) * (radius + 2), y + Math.sin(angle) * (radius + 2));
          ctx.lineTo(x + Math.cos(angle) * (radius + 10), y + Math.sin(angle) * (radius + 10));
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawEntity = (entity: Entity, time: number) => {
      const point = worldToScreen(entity.x, entity.y);
      const radius = entity.radius * camera.zoom;
      if (point.x < -radius - 80 || point.x > width + radius + 80 || point.y < -radius - 80 || point.y > height + radius + 80) return;
      const rotation = entity.angle + entity.age * 0.08;

      if (entity.kind === "ufo") {
        const pulse = 0.7 + Math.sin(time * 6 + entity.seed) * 0.18;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(Math.sin(time * 2.2 + entity.seed) * 0.08);
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(102,255,225,${0.06 * pulse})`;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.72, radius * 0.35);
        ctx.lineTo(radius * 0.72, radius * 0.35);
        ctx.lineTo(radius * 1.2, radius * 2.1);
        ctx.lineTo(-radius * 1.2, radius * 2.1);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowColor = "#79ffe2";
        ctx.shadowBlur = 24;
        const dome = ctx.createRadialGradient(-radius * 0.18, -radius * 0.42, 0, 0, -radius * 0.2, radius);
        dome.addColorStop(0, "#f6ffff");
        dome.addColorStop(0.25, "#9df8ff");
        dome.addColorStop(1, "#4a3d97");
        ctx.fillStyle = dome;
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.18, radius * 0.62, radius * 0.52, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        const hull = ctx.createLinearGradient(0, -radius * 0.15, 0, radius * 0.5);
        hull.addColorStop(0, "#d8fff8");
        hull.addColorStop(0.36, "#5eeacb");
        hull.addColorStop(1, "#25325f");
        ctx.fillStyle = hull;
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.08, radius * 1.08, radius * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff73ac";
        ctx.lineWidth = Math.max(1.5, radius * 0.08);
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.11, radius, radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = -2; i <= 2; i += 1) {
          ctx.fillStyle = i % 2 ? "#ff7db3" : "#d6ff79";
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(i * radius * 0.33, radius * 0.25, Math.max(2, radius * 0.075), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        const barWidth = Math.max(54, radius * 2);
        ctx.fillStyle = "rgba(4,8,24,.8)";
        ctx.fillRect(point.x - barWidth / 2, point.y - radius - 18, barWidth, 4);
        ctx.fillStyle = "#75ffe0";
        ctx.fillRect(point.x - barWidth / 2, point.y - radius - 18, barWidth * clamp(entity.hp / entity.maxHp, 0, 1), 4);
        return;
      }

      if (entity.kind === "prism") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const trailSpeed = Math.max(1, Math.hypot(entity.vx, entity.vy));
        const ux = entity.vx / trailSpeed;
        const uy = entity.vy / trailSpeed;
        const trail = ctx.createLinearGradient(point.x, point.y, point.x - ux * 120, point.y - uy * 120);
        trail.addColorStop(0, "rgba(255,255,255,.95)");
        trail.addColorStop(0.35, "rgba(128,235,255,.5)");
        trail.addColorStop(0.7, "rgba(236,116,255,.24)");
        trail.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = trail;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.quadraticCurveTo(point.x - ux * 55 + uy * 20, point.y - uy * 55 - ux * 20, point.x - ux * 135, point.y - uy * 135);
        ctx.stroke();
        ctx.translate(point.x, point.y);
        ctx.rotate(time * 2.8);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#b69cff";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const angle = i * Math.PI / 4;
          const rr = i % 2 === 0 ? radius : radius * 0.45;
          const x = Math.cos(angle) * rr;
          const y = Math.sin(angle) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }

      if (entity.kind === "pickup") {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(time * 0.9 + entity.seed);
        ctx.shadowColor = "#ffe08a";
        ctx.shadowBlur = 16;
        ctx.strokeStyle = "#ffeaa5";
        ctx.fillStyle = "rgba(255,220,120,.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = i * Math.PI / 3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "#fff5c7";
        ctx.fill();
        ctx.restore();
        return;
      }

      if (entity.behavior === "comet") {
        const speed = Math.max(1, Math.hypot(entity.vx, entity.vy));
        ctx.strokeStyle = `${entity.color}88`;
        ctx.lineWidth = Math.max(2, radius * 0.35);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - entity.vx / speed * radius * 4.2, point.y - entity.vy / speed * radius * 4.2);
        ctx.stroke();
      }
      if (entity.behavior === "gravity") {
        ctx.save();
        ctx.strokeStyle = "rgba(182,125,255,.16)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i += 1) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + i * 14 + Math.sin(time + i) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (entity.behavior === "pulsar") {
        const pulse = (entity.age % 3.6) / 3.6;
        ctx.save();
        ctx.strokeStyle = `rgba(121,229,255,${(1 - pulse) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + pulse * 120 * camera.zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawRim(entity, point.x, point.y, radius);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(rotation);
      ctx.shadowColor = entity.color;
      ctx.shadowBlur = clamp(radius * 0.55, 5, 22);
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.05, 0, 0, radius);
      gradient.addColorStop(0, "#f8f6ff");
      gradient.addColorStop(0.2, entity.color);
      gradient.addColorStop(1, entity.accent);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const points = entity.radius < 28 ? 10 : 30;
      for (let i = 0; i < points; i += 1) {
        const angle = i / points * Math.PI * 2;
        const jag = entity.radius < 28 ? 0.84 + Math.sin(entity.seed + i * 2.7) * 0.12 : 1;
        const rr = radius * jag;
        const x = Math.cos(angle) * rr;
        const y = Math.sin(angle) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(0.75, radius * 0.045);
      ctx.beginPath();
      ctx.arc(-radius * 0.16, -radius * 0.12, radius * 0.54, 2.7, 5.3);
      ctx.stroke();
      if (entity.radius > 42 && entity.seed % 1 > 0.42) {
        ctx.globalAlpha = 0.72;
        ctx.strokeStyle = entity.accent;
        ctx.lineWidth = Math.max(2, radius * 0.13);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.45, radius * 0.38, 0.22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawPlayer = (time: number) => {
      const point = worldToScreen(player.x, player.y);
      const radius = player.radius * camera.zoom;
      const speed = Math.hypot(player.vx, player.vy);
      const angle = Math.atan2(player.vy, player.vx);
      if (speed > 8) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let i = 0; i < (settingsRef.current.reducedMotion ? 3 : 7); i += 1) {
          const trail = 14 + i * 10 + speed * 0.1;
          const spread = (i - 3) * 1.8;
          ctx.globalAlpha = (1 - i / 8) * 0.25;
          ctx.strokeStyle = tier >= 6 ? "#ffd683" : "#76f4ff";
          ctx.lineWidth = Math.max(1, radius * 0.13 - i * 0.45);
          ctx.beginPath();
          ctx.moveTo(point.x - Math.cos(angle) * radius * 0.7 - Math.sin(angle) * spread, point.y - Math.sin(angle) * radius * 0.7 + Math.cos(angle) * spread);
          ctx.lineTo(point.x - Math.cos(angle) * trail, point.y - Math.sin(angle) * trail);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (shield) {
        ctx.save();
        ctx.strokeStyle = "rgba(151,248,255,.82)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        ctx.lineDashOffset = -time * 30;
        ctx.shadowColor = "#7ff3ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(speed > 4 ? angle : time * 0.12);
      const squashAmount = squash > 0 ? Math.sin((squash / 0.22) * Math.PI) * 0.24 : 0;
      ctx.scale(1 + squashAmount, 1 - squashAmount * 0.6);
      const accent = TIERS[tier].accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 28;

      if (tier === 7) {
        const halo = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.25);
        halo.addColorStop(0, "#020208");
        halo.addColorStop(0.48, "#06030d");
        halo.addColorStop(0.66, "#d8a4ff");
        halo.addColorStop(0.78, "#8ef4ff");
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#010104";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      } else if (tier === 6) {
        ctx.fillStyle = "#fff1af";
        ctx.beginPath();
        for (let i = 0; i < 24; i += 1) {
          const a = i * Math.PI / 12;
          const rr = i % 2 ? radius * (1.02 + Math.sin(time * 3 + i) * 0.06) : radius * 1.32;
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        drawGlowCircle(0, 0, radius * 0.72, "#ffb35f", radius * 0.7);
      } else {
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, 0, 0, 0, radius);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.26, accent);
        gradient.addColorStop(1, tier < 2 ? "#5b71ff" : BODY_COLORS[tier][1]);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const points = tier < 3 ? 10 : 32;
        for (let i = 0; i < points; i += 1) {
          const a = i / points * Math.PI * 2;
          const rr = radius * (tier < 3 ? 0.88 + Math.sin(i * 3.17 + tier) * 0.12 : 1);
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,.5)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-radius * 0.12, -radius * 0.08, radius * 0.58, 2.6, 5.2);
        ctx.stroke();
        if (tier === 5) {
          ctx.strokeStyle = "rgba(146,245,225,.65)";
          ctx.lineWidth = radius * 0.12;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.45, radius * 0.34, 0.18, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      if (protection > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(time * 10) * 0.1;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawThreatArrows = () => {
      for (const entity of entities) {
        const isUfo = entity.kind === "ufo";
        const isTrackedThreat = navCore > 0 && entity.kind === "body" && classifySize(player.radius, entity.radius) === "lethal";
        if (!isUfo && !isTrackedThreat) continue;
        const point = worldToScreen(entity.x, entity.y);
        if (point.x > 28 && point.x < width - 28 && point.y > 28 && point.y < height - 28) continue;
        const angle = Math.atan2(point.y - height / 2, point.x - width / 2);
        const edgeX = clamp(width / 2 + Math.cos(angle) * width * 0.43, 30, width - 30);
        const edgeY = clamp(height / 2 + Math.sin(angle) * height * 0.38, 30, height - 30);
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        ctx.fillStyle = isUfo ? "#79ffe3" : "#ff76aa";
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    const drawFrame = (timeMs: number) => {
      const time = timeMs / 1000;
      drawBackground(time);
      ctx.save();
      if (screenShake > 0 && settingsRef.current.screenShake && !settingsRef.current.reducedMotion) {
        ctx.translate((random() - 0.5) * screenShake, (random() - 0.5) * screenShake);
      }
      drawArenaBoundary(time);
      entities.sort((a, b) => a.radius - b.radius).forEach((entity) => drawEntity(entity, time));
      bolts.forEach((bolt) => {
        const point = worldToScreen(bolt.x, bolt.y);
        const speed = Math.max(1, Math.hypot(bolt.vx, bolt.vy));
        const tail = 18 + tier * 2;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = tier >= 6 ? "#ffd87a" : "#7df7ff";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 14;
        ctx.lineWidth = Math.max(2, bolt.radius * camera.zoom);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - (bolt.vx / speed) * tail, point.y - (bolt.vy / speed) * tail);
        ctx.stroke();
        ctx.restore();
      });
      particles.forEach((particle) => {
        const point = worldToScreen(particle.x, particle.y);
        const alpha = clamp(particle.life / Math.max(0.01, particle.maxLife), 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        if (particle.ring) {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * (1 + (1 - alpha) * 9) * camera.zoom, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          drawGlowCircle(point.x, point.y, particle.size * camera.zoom, particle.color, 8);
        }
        ctx.restore();
      });
      drawPlayer(time);
      floats.forEach((float) => {
        const point = worldToScreen(float.x, float.y);
        ctx.save();
        ctx.globalAlpha = clamp(float.life * 1.5, 0, 1);
        ctx.fillStyle = float.color;
        ctx.font = "700 12px 'Arial Narrow', sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "1px";
        ctx.fillText(float.text.toUpperCase(), point.x, point.y);
        ctx.restore();
      });
      drawThreatArrows();
      ctx.restore();

      if (evolutionTimer > 0 || victoryTimer > 0) {
        const progress = evolutionTimer > 0 ? 1 - evolutionTimer / 1.25 : 1 - victoryTimer / 1.7;
        const ringRadius = 40 + progress * Math.max(width, height) * 0.55;
        const center = worldToScreen(player.x, player.y);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = (1 - progress) * 0.75;
        ctx.strokeStyle = TIERS[tier].accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (time: number) => {
      const rawDelta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      accumulator += rawDelta;
      let steps = 0;
      while (accumulator >= FIXED_DT && steps < 7) {
        fixedUpdate(FIXED_DT);
        accumulator -= FIXED_DT;
        steps += 1;
      }
      drawFrame(time);
      animationFrame = requestAnimationFrame(frame);
    };

    const clearInput = () => {
      keyboard.left = false;
      keyboard.right = false;
      keyboard.up = false;
      keyboard.down = false;
      keyboard.fire = false;
      joystick = { x: 0, y: 0 };
    };
    const focusGameSurface = () => {
      window.focus();
      canvas.focus({ preventScroll: true });
      canvas.dataset.keyboardFocus = document.hasFocus() ? "active" : "requested";
    };
    const setKeyboardAction = (event: KeyboardEvent, pressed: boolean) => {
      const action = resolveControlKey(event.code, event.key);
      if (!action) return false;
      keyboard[action] = pressed;
      canvas.dataset.lastControl = `${action}:${pressed ? "down" : "up"}`;
      canvas.dataset.controlEvents = String(Number(canvas.dataset.controlEvents ?? "0") + 1);
      if (screenRef.current === "playing") event.preventDefault();
      return true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      setKeyboardAction(event, true);
      if (resolveControlKey(event.code, event.key) === "fire" && !event.repeat) {
        fireRequested = true;
        shoot();
      }
      const pauseKey = event.code === "Escape" || event.code === "KeyP" || event.key.toLowerCase() === "p";
      if (!pauseKey || event.repeat) return;
      event.preventDefault();
      if (screenRef.current === "playing") {
        screenRef.current = "paused";
        clearInput();
        setScreen("paused");
      } else if (screenRef.current === "paused") {
        screenRef.current = "playing";
        focusGameSurface();
        setScreen("playing");
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      setKeyboardAction(event, false);
    };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      if (Math.hypot(x, y) > 10) aimAngle = Math.atan2(y, x);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      if (screenRef.current === "playing") {
        fireRequested = true;
        shoot();
      }
    };
    const onVisibility = () => {
      if (document.hidden && screenRef.current === "playing") {
        screenRef.current = "paused";
        clearInput();
        setScreen("paused");
      }
    };
    const onBlur = () => {
      clearInput();
      canvas.dataset.keyboardFocus = "blurred";
      if (screenRef.current === "playing") {
        screenRef.current = "paused";
        setScreen("paused");
      }
    };
    const onWindowFocus = () => {
      canvas.dataset.keyboardFocus = "active";
      if (screenRef.current === "playing") {
        requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
      }
    };
    const onLoadFocus = () => {
      focusGameSurface();
    };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("load", onLoadFocus);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    resize();
    reset();
    if (document.readyState === "complete") onLoadFocus();
    animationFrame = requestAnimationFrame(frame);

    actionsRef.current = {
      start: () => {
        audio.unlock();
        reset();
        screenRef.current = "playing";
        setScreen("playing");
        focusGameSurface();
        requestAnimationFrame(focusGameSurface);
      },
      restart: () => {
        audio.unlock();
        reset();
        screenRef.current = "playing";
        setScreen("playing");
        focusGameSurface();
        requestAnimationFrame(focusGameSurface);
      },
      pause: () => {
        screenRef.current = "paused";
        clearInput();
        setScreen("paused");
      },
      resume: () => {
        audio.unlock();
        screenRef.current = "playing";
        setScreen("playing");
        focusGameSurface();
        requestAnimationFrame(focusGameSurface);
      },
      title: () => {
        screenRef.current = "title";
        setScreen("title");
        reset();
      },
      endless: () => {
        endless = true;
        protection = 2;
        victoryTimer = 0;
        screenRef.current = "playing";
        setScreen("playing");
        focusGameSurface();
        requestAnimationFrame(focusGameSurface);
      },
      joystick: (x, y) => {
        joystick = { x, y };
      },
      fire: () => {
        fireRequested = true;
        shoot();
      },
      debugTier: (delta) => {
        const desired = clamp(tier + delta, 0, 7);
        mass = TIERS[desired].min;
        tier = desired;
        player.radius = TIERS[tier].radius;
        protection = 2;
        evolutionTimer = 0.8;
        announcement = TIERS[tier].name.toUpperCase();
        announcementTimer = 2;
        if (tier === 7 && !endless) victoryTimer = 1.2;
        syncUI(true);
      },
      debugPrism: () => {
        entities.filter((entity) => entity.kind === "prism").forEach((entity) => { entity.dead = true; });
        cometSpawned = true;
        prismWarning = false;
        spawnPrism();
      },
      debugPower: () => setActivePower(choosePower()),
      debugImpact: () => {
        protection = 0;
        spawnBody("lethal", "drifter");
        const threat = entities[entities.length - 1];
        threat.x = player.x;
        threat.y = player.y;
        threat.vx = 0;
        threat.vy = 0;
        threat.label = "debug neutron star";
      },
      debugUfo: () => {
        entities.filter((entity) => entity.kind === "ufo").forEach((entity) => { entity.dead = true; });
        spawnUfo(true);
        syncUI(true);
      },
      debugLevel: () => {
        const desired = Math.min(LEVELS.length - 1, level + 1);
        score = Math.max(score, LEVELS[desired].minScore);
        updateLevelIfNeeded();
        syncUI(true);
      },
      debugBoundary: () => {
        player.x = player.radius + 30;
        player.vx = -240;
        boundaryImpactCooldown = 0;
        confinePlayerToArena();
        syncUI(true);
      },
    };

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("keyup", onKeyUp, { capture: true });
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("load", onLoadFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      actionsRef.current = null;
      void audio.context?.close();
    };
  }, []);

  const startRequested = useCallback(() => {
    if (!tutorialSeen) {
      setScreen("tutorial");
      return;
    }
    actionsRef.current?.start();
  }, [tutorialSeen]);

  const finishTutorial = useCallback(() => {
    window.localStorage.setItem(TUTORIAL_KEY, "seen");
    setTutorialSeen(true);
    actionsRef.current?.start();
  }, []);

  const updateSetting = (key: keyof Settings) => {
    setSettings((value) => ({ ...value, [key]: !value[key] }));
  };

  const progress = ui.tier === TIERS.length - 1
    ? 1
    : clamp((ui.mass - TIERS[ui.tier].min) / (TIERS[ui.tier].next - TIERS[ui.tier].min), 0, 1);

  return (
    <main className={`game-shell phase-${ui.tier} ${settings.reducedMotion ? "reduced-motion" : ""}`}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        data-testid="game-canvas"
        autoFocus
        tabIndex={0}
        role="application"
        aria-label="Cosmic Drift playable universe. Use WASD or arrow keys to move and Space to fire."
      />
      <div className="vignette" aria-hidden="true" />

      {screen === "title" && (
        <section className="title-screen" aria-labelledby="game-title">
          <div className="eyebrow"><span className="eyebrow-line" /> AN ARCADE ODYSSEY <span className="eyebrow-line" /></div>
          <h1 id="game-title">
            <span>COSMIC</span>
            <span className="title-drift">DRIFT</span>
          </h1>
          <p className="subtitle">EAT THE UNIVERSE</p>
          <p className="title-copy">Begin as stardust. Outmaneuver giants. Become the end of everything.</p>
          <div className="title-actions">
            <button className="primary-button" onClick={startRequested}>
              <span>Begin the drift</span><i aria-hidden="true">→</i>
            </button>
            <div className="secondary-actions">
              <button onClick={() => setPanel("howto")}>How to play</button>
              <button onClick={() => setPanel("settings")}>Settings</button>
            </div>
          </div>
          <div className="best-score">
            <span>BEST RUN</span>
            <strong>{stats.bestScore.toLocaleString()}</strong>
            <small>{TIERS[stats.highestTier].name}</small>
          </div>
          <div className="control-hint"><span className="keycaps">WASD</span><span>or</span><span className="keycaps">ARROWS</span><span>steer</span><span className="keycaps">SPACE</span><span>fires</span></div>
        </section>
      )}

      {(screen === "playing" || screen === "paused") && (
        <>
          <header className="hud-top">
            <div className="score-block">
              <span>Score</span>
              <strong>{ui.score.toLocaleString()}</strong>
            </div>
            <div className="stage-block">
              <div className="level-label">
                <span>LEVEL {ui.level + 1} / {LEVELS.length}</span>
                <b>{LEVELS[ui.level].name}</b>
                <i><em style={{ width: `${ui.levelProgress * 100}%` }} /></i>
              </div>
              <div className="form-label"><span>FORM {ui.tier + 1} / 8</span><strong>{TIERS[ui.tier].name}</strong></div>
              <div className="mass-meta"><span>{ui.mass} MASS</span><span>{Number.isFinite(TIERS[ui.tier].next) ? `${TIERS[ui.tier].next} NEXT` : "∞ ENDLESS"}</span></div>
              <div className="mass-track"><span style={{ width: `${progress * 100}%` }} /></div>
            </div>
            <div className="hud-actions">
              <button aria-label={settings.muted ? "Unmute sound" : "Mute sound"} onClick={() => updateSetting("muted")} className="icon-button">
                {settings.muted ? "SOUND OFF" : "SOUND ON"}
              </button>
              <button aria-label="Pause game" onClick={() => actionsRef.current?.pause()} className="pause-button"><i /><i /></button>
            </div>
          </header>

          <aside className={`combo-display ${ui.comboTimer > 0 ? "visible" : ""}`}>
            <span>{ui.combo.toFixed(1)}×</span>
            <strong>CHAIN {Math.max(1, Math.round(ui.combo * 2))}</strong>
            <i style={{ transform: `scaleX(${clamp(ui.comboTimer / 2.2, 0, 1)})` }} />
          </aside>

          <aside className="arena-radar" aria-label={`Arena boundary ${ui.boundaryDistance} units away`}>
            <div><span>ARENA BOUNDARY</span><small>{ui.boundaryDistance}u CLEAR</small></div>
            <i className="arena-map"><b style={{ left: `${ui.arenaX}%`, top: `${ui.arenaY}%` }} /></i>
          </aside>

          {(ui.power || ui.shield) && (
            <aside className="power-display">
              <span className="power-orbit" aria-hidden="true" />
              <div>
                <small>PRISM POWER</small>
                <strong>{ui.power ?? "Event Horizon Shield"}</strong>
                <span>{ui.shield && ui.power === "Event Horizon Shield" ? "ONE IMPACT" : `${ui.powerTimer.toFixed(1)}s`}</span>
              </div>
            </aside>
          )}

          <div className={`prism-warning ${ui.prismWarning ? "visible" : ""}`} role="status">
            <span className="prism-mark" aria-hidden="true" />
            <div><strong>PRISM COMET</strong><small>RARE SIGNATURE APPROACHING</small></div>
          </div>

          <div className={`ufo-warning ${ui.ufoAlert ? "visible" : ""}`} role="status">
            <span aria-hidden="true">⌁</span>
            <div><strong>ALIEN RAID INBOUND</strong><small>ARM COSMIC CANNON</small></div>
          </div>

          <div className={`boundary-warning ${ui.boundaryWarning ? "visible" : ""}`} role="status">
            <span aria-hidden="true">⌗</span>
            <div><strong>VOID WALL NEAR</strong><small>{ui.boundaryDistance} UNITS · TURN INWARD</small></div>
          </div>

          {ui.ufoMaxHp > 0 && (
            <aside className="ufo-target" aria-live="polite">
              <div><span>ALIEN RAIDER</span><strong>{ui.ufoHp} / {ui.ufoMaxHp}</strong></div>
              <i><b style={{ width: `${clamp(ui.ufoHp / ui.ufoMaxHp, 0, 1) * 100}%` }} /></i>
            </aside>
          )}

          <div className="combat-hint">
            <span><b>{ui.fireReady ? "SPACE / CLICK" : "RECHARGING"}</b> TO FIRE</span>
            <small>THRUST {ui.speed}</small>
          </div>
          <div className="stage-announcement" aria-live="polite">{ui.announcement}</div>
          <TouchJoystick onChange={(x, y) => actionsRef.current?.joystick(x, y)} />
          <FireButton ready={ui.fireReady} onFire={() => actionsRef.current?.fire()} />
        </>
      )}

      {screen === "tutorial" && (
        <OverlayCard eyebrow="FIELD NOTES" title="Survive the scale">
          <div className="tutorial-grid">
            <TutorialItem symbol="◌" title="Absorb" text="Bodies with a broken green orbit are smaller than you." tone="safe" />
            <TutorialItem symbol="▲" title="Evade" text="Spiked magenta signals mark universe-ending threats." tone="danger" />
            <TutorialItem symbol="↝" title="Drift" text="You carry momentum. Counter-steer early to reverse." tone="gold" />
            <TutorialItem symbol="✦" title="Risk it" text="Catch the rare Prism Comet for a major power." tone="prism" />
            <TutorialItem symbol="⌁" title="Defend" text="Fire with Space, click, or the FIRE button. UFOs take several hits." tone="alien" />
            <TutorialItem symbol="⌗" title="Stay inside" text="The glowing Void Wall marks the arena edge and safely rebounds you." tone="boundary" />
            <TutorialItem symbol="Ⅴ" title="Climb levels" text="Score advances five named sectors with faster threats and tougher UFOs." tone="level" />
          </div>
          <button className="primary-button compact" onClick={finishTutorial}><span>Enter the universe</span><i>→</i></button>
          <button className="text-button" onClick={finishTutorial}>Skip briefing</button>
        </OverlayCard>
      )}

      {screen === "paused" && (
        <OverlayCard eyebrow={TIERS[ui.tier].phase} title="Drift suspended">
          <p className="overlay-copy">The universe is holding its breath.</p>
          <div className="menu-stack">
            <button className="primary-button compact" onClick={() => actionsRef.current?.resume()}><span>Resume drift</span><i>→</i></button>
            <button onClick={() => actionsRef.current?.restart()}>Restart universe</button>
            <button onClick={() => setPanel("settings")}>Settings</button>
            <button onClick={() => actionsRef.current?.title()}>Return to title</button>
          </div>
        </OverlayCard>
      )}

      {screen === "gameover" && (
        <OverlayCard eyebrow="THE UNIVERSE WAS HUNGRIER" title="Matter reclaimed" danger>
          <div className="result-score">
            <span>FINAL SCORE</span><strong>{ui.score.toLocaleString()}</strong>
            {ui.newRecord && <em>NEW COSMIC RECORD</em>}
          </div>
          <p className="death-cause">{ui.cause}</p>
          <div className="result-row">
            <div><span>FORM REACHED</span><strong>{TIERS[ui.tier].name}</strong></div>
            <div><span>DRIFT TIME</span><strong>{formatTime(ui.elapsed)}</strong></div>
          </div>
          <div className="menu-stack">
            <button className="primary-button compact" onClick={() => actionsRef.current?.restart()}><span>Drift again</span><i>↻</i></button>
            <button onClick={() => actionsRef.current?.title()}>Return to title</button>
          </div>
        </OverlayCard>
      )}

      {screen === "victory" && (
        <OverlayCard eyebrow="UNIVERSE COLLAPSED" title="You are the horizon">
          <div className="singularity-glyph" aria-hidden="true"><i /><span /></div>
          <p className="overlay-copy">Every orbit ends here. Every light now bends toward you.</p>
          <div className="result-row">
            <div><span>COMPLETION</span><strong>{formatTime(ui.elapsed)}</strong></div>
            <div><span>FINAL SCORE</span><strong>{ui.score.toLocaleString()}</strong></div>
          </div>
          <div className="menu-stack">
            <button className="primary-button compact" onClick={() => actionsRef.current?.endless()}><span>Continue endlessly</span><i>∞</i></button>
            <button onClick={() => actionsRef.current?.restart()}>Start new universe</button>
          </div>
        </OverlayCard>
      )}

      {panel === "howto" && (
        <Modal title="How to drift" onClose={() => setPanel("none")}>
          <div className="howto-list">
            <p><span>01</span><strong>Read the orbit.</strong> Dashed green is prey, gold is a physical deflection, spiked magenta is lethal.</p>
            <p><span>02</span><strong>Steer the mass.</strong> Hold WASD, arrows, a gamepad stick, or the touch joystick. Release to glide.</p>
            <p><span>03</span><strong>Hunt the edge.</strong> Near-maximum prey pays a risk bonus. Chain meals within 2.2 seconds for up to 5×.</p>
            <p><span>04</span><strong>Chase the impossible.</strong> Prism Comets ignore size rules and grant a major power.</p>
            <p><span>05</span><strong>Repel alien raiders.</strong> UFOs breach the field occasionally. Aim with your movement or pointer and fire with Space, click, gamepad A, or the touch button.</p>
            <p><span>06</span><strong>Respect the Void Wall.</strong> The arena is finite. The radar shows your position and the wall rebounds you instead of letting you drift away.</p>
            <p><span>07</span><strong>Clear five levels.</strong> Score opens new sectors, raises the threat mix, and gives UFOs more armor.</p>
          </div>
        </Modal>
      )}

      {panel === "settings" && (
        <Modal title="Signal settings" onClose={() => setPanel("none")}>
          <div className="settings-list">
            <SettingToggle label="Sound" detail="Procedural effects and warnings" active={!settings.muted} onClick={() => updateSetting("muted")} />
            <SettingToggle label="Reduced motion" detail="Fewer particles and softer camera motion" active={settings.reducedMotion} onClick={() => updateSetting("reducedMotion")} />
            <SettingToggle label="Screen shake" detail="Restrained impact feedback" active={settings.screenShake} onClick={() => updateSetting("screenShake")} />
            <SettingToggle label="High contrast" detail="Stronger danger and prey outlines" active={settings.highContrast} onClick={() => updateSetting("highContrast")} />
          </div>
        </Modal>
      )}

      {debug && (
        <aside className="debug-panel">
          <strong>DRIFT LAB</strong>
          <span>Mass {ui.mass} · Tier {ui.tier} · {ui.score} pts</span>
          <span>Speed {ui.speed} · UFO kills {ui.ufoKills}</span>
          <span>Level {ui.level + 1} · Wall {ui.boundaryDistance}u</span>
          <span>Power {ui.power ?? "none"} {ui.powerTimer.toFixed(1)}</span>
          <div>
            <button onClick={() => actionsRef.current?.debugTier(-1)}>Tier −</button>
            <button onClick={() => actionsRef.current?.debugTier(1)}>Tier +</button>
            <button onClick={() => actionsRef.current?.debugPrism()}>Prism</button>
            <button onClick={() => actionsRef.current?.debugPower()}>Power</button>
            <button onClick={() => actionsRef.current?.debugLevel()}>Level</button>
            <button onClick={() => actionsRef.current?.debugBoundary()}>Wall</button>
            <button onClick={() => actionsRef.current?.debugUfo()}>UFO</button>
            <button onClick={() => actionsRef.current?.debugImpact()}>Impact</button>
          </div>
        </aside>
      )}

      <footer className="corner-brand"><span>CD</span><small>{TIERS[ui.tier].phase.toUpperCase()}</small></footer>
    </main>
  );
}

function OverlayCard({ eyebrow, title, children, danger = false }: { eyebrow: string; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="overlay-backdrop">
      <section className={`overlay-card ${danger ? "danger" : ""}`}>
        <div className="overlay-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><span>COSMIC DRIFT</span><h2 id="modal-title">{title}</h2></div><button onClick={onClose} aria-label="Close dialog">×</button></div>
        {children}
      </section>
    </div>
  );
}

function TutorialItem({ symbol, title, text, tone }: { symbol: string; title: string; text: string; tone: string }) {
  return <div className={`tutorial-item ${tone}`}><span className="tutorial-symbol" aria-hidden="true">{symbol}</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function SettingToggle({ label, detail, active, onClick }: { label: string; detail: string; active: boolean; onClick: () => void }) {
  return (
    <button className="setting-row" onClick={onClick} role="switch" aria-checked={active}>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <i className={active ? "active" : ""}><b /></i>
    </button>
  );
}

function FireButton({ ready, onFire }: { ready: boolean; onFire: () => void }) {
  return (
    <button
      className={`fire-button ${ready ? "ready" : ""}`}
      aria-label="Fire cosmic cannon"
      onPointerDown={(event) => {
        event.preventDefault();
        onFire();
      }}
    >
      <i aria-hidden="true">⌁</i>
      <span>FIRE</span>
    </button>
  );
}

function TouchJoystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (clientX: number, clientY: number) => {
    const bounds = baseRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const dx = clientX - (bounds.left + bounds.width / 2);
    const dy = clientY - (bounds.top + bounds.height / 2);
    const max = bounds.width * 0.35;
    const distance = Math.hypot(dx, dy);
    const scale = distance > max ? max / distance : 1;
    const next = { x: dx * scale, y: dy * scale };
    setKnob(next);
    onChange(next.x / max, next.y / max);
  };

  return (
    <div
      ref={baseRef}
      className={`touch-joystick ${active ? "active" : ""}`}
      aria-label="Touch steering joystick"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setActive(true);
        move(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => { if (active) move(event.clientX, event.clientY); }}
      onPointerUp={() => { setActive(false); setKnob({ x: 0, y: 0 }); onChange(0, 0); }}
      onPointerCancel={() => { setActive(false); setKnob({ x: 0, y: 0 }); onChange(0, 0); }}
    >
      <span>DRIFT</span>
      <i style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
