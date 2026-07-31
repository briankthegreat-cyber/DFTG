export type Difficulty = "story" | "standard" | "wayfinder" | "eclipse";
export type ExpeditionPhase =
  | "forecast"
  | "forge"
  | "work"
  | "nightfall"
  | "camp"
  | "results"
  | "defeat";
export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export interface CharacterDefinition {
  id: string;
  name: string;
  shortName: string;
  guild: "Forge" | "Grove" | "Veil" | "Hearth";
  role: "Maker" | "Runner" | "Warden" | "Channeler";
  icon: string;
  color: string;
  combat: string;
  work: string;
  order: string;
  formA: string;
  formB: string;
  damage: number;
  attackInterval: number;
  range: number;
  combatTrigger: string;
  specialistTrigger: string;
}

export interface MissionDefinition {
  id: number;
  title: string;
  region: "Mossglass Vale" | "Brasswater Basin" | "Skyglass Crater" | "Finale";
  rounds: number;
  contract: string;
  enemyLesson: string;
  reward: string;
  boss?: "Dusk Stag" | "Ferryman Engine" | "Bell-Eater";
}

export interface PackCounters {
  totalOpened: number;
  sinceRarePlus: number;
  sinceEpicPlus: number;
  sinceLegendaryPlus: number;
  pendingTransactionId: string | null;
  pendingRewardId: string | null;
}

export interface PackRelic {
  id: string;
  name: string;
  rarity: Rarity;
  category: string;
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: "mira",
    name: "Mira Sparkhand",
    shortName: "Mira",
    guild: "Forge",
    role: "Channeler",
    icon: "⚡",
    color: "#5fb9ee",
    combat: "Chain lightning · range 3.5",
    work: "Repairs mechanisms and charges pylons.",
    order: "Circuit First",
    formA: "Stormwright → Tempest Architect",
    formB: "Magnet Crafter → Lodestar Saint",
    damage: 18,
    attackInterval: 0.9,
    range: 3.5,
    combatTrigger: "Chain lightning jumps to a second target.",
    specialistTrigger: "Storm Relay forks lightning into two extra targets.",
  },
  {
    id: "bram",
    name: "Bram Rootwall",
    shortName: "Bram",
    guild: "Grove",
    role: "Warden",
    icon: "🌿",
    color: "#85b85a",
    combat: "Intercepting wall · 420 HP",
    work: "Grows timber and living barricades.",
    order: "Hold Ground",
    formA: "Ironbark → Walking Bastion",
    formB: "Briar Shepherd → Thorn Choir",
    damage: 22,
    attackInterval: 1.6,
    range: 2,
    combatTrigger: "Intercepts and roots the nearest Duskborn.",
    specialistTrigger: "Living Barricade roots two enemies and shares the hit.",
  },
  {
    id: "pip",
    name: "Pip Rattlewing",
    shortName: "Pip",
    guild: "Veil",
    role: "Runner",
    icon: "🪶",
    color: "#d5a452",
    combat: "Ricochet shot · range 4",
    work: "Rushes remote sites and escort routes.",
    order: "Shortest Route",
    formA: "Sky Courier → Comet Postmaster",
    formB: "Relic Thief → Hourglass Jackdaw",
    damage: 14,
    attackInterval: 0.7,
    range: 4,
    combatTrigger: "Ricochets into a wounded second target.",
    specialistTrigger: "Comet Route ricochets twice and hunts wounded targets.",
  },
  {
    id: "orla",
    name: "Orla Bellforge",
    shortName: "Orla",
    guild: "Forge",
    role: "Maker",
    icon: "🔨",
    color: "#e67955",
    combat: "Armor-cracking hammer",
    work: "Accelerates nearby construction.",
    order: "Raise First",
    formA: "Choirsmith → Cathedral Engine",
    formB: "Bellbreaker → Quake Saint",
    damage: 32,
    attackInterval: 1.4,
    range: 1.5,
    combatTrigger: "Cracks armor for the whole crew.",
    specialistTrigger: "Resonant Blow cracks armor and strikes a second monster.",
  },
  {
    id: "nox",
    name: "Nox Inkshade",
    shortName: "Nox",
    guild: "Veil",
    role: "Channeler",
    icon: "✦",
    color: "#9b73d4",
    combat: "Marks targets for follow-up damage.",
    work: "Reveals hidden routes and redraws terrain.",
    order: "Reveal Route",
    formA: "Atlas Witch → Worldfold Scribe",
    formB: "Ink Binder → Leviathan Cartographer",
    damage: 12,
    attackInterval: 1,
    range: 4,
    combatTrigger: "Marks a target to amplify follow-up attacks.",
    specialistTrigger: "Deep Ink marks an entire cluster for focused fire.",
  },
  {
    id: "tavi",
    name: "Tavi Cinderpot",
    shortName: "Tavi",
    guild: "Hearth",
    role: "Maker",
    icon: "🔥",
    color: "#e48c43",
    combat: "Splash flasks · range 3",
    work: "Cooks meals, tonics, and explosives.",
    order: "Feed Crew",
    formA: "Feast Engine → Sun-Kitchen Colossus",
    formB: "Volcanic Brewer → Caldera Chef",
    damage: 20,
    attackInterval: 1.3,
    range: 3,
    combatTrigger: "Flasks splash across a clustered lane.",
    specialistTrigger: "Hot Flask leaves a wider molten burst in the lane.",
  },
  {
    id: "juniper",
    name: "Juniper Glassbow",
    shortName: "Juniper",
    guild: "Grove",
    role: "Runner",
    icon: "❈",
    color: "#71c88b",
    combat: "Prism arrows · range 5",
    work: "Harvests crystal without break penalties.",
    order: "Clean Cut",
    formA: "Prism Sniper → Aurora Needle",
    formB: "Crystal Bloom → Shardgarden Queen",
    damage: 36,
    attackInterval: 1.7,
    range: 5,
    combatTrigger: "Prism arrows pierce a second enemy.",
    specialistTrigger: "Split Prism pierces two extra targets across armor.",
  },
  {
    id: "kodo",
    name: "Kodo Gearback",
    shortName: "Kodo",
    guild: "Hearth",
    role: "Warden",
    icon: "⚙",
    color: "#b69361",
    combat: "Heavy line charge",
    work: "Hauls three heavy parcels and lays rail.",
    order: "Heavy Route",
    formA: "Rail Golem → Horizon Locomotive",
    formB: "Foundry Titan → Walking Workshop",
    damage: 28,
    attackInterval: 1.5,
    range: 1.8,
    combatTrigger: "Charges through an entire lane every sixth beat.",
    specialistTrigger: "Rail Charge fires every fourth beat through the lane.",
  },
];

const MISSION_ROWS: Array<
  [string, MissionDefinition["region"], number, string, string, string, MissionDefinition["boss"]?]
> = [
  ["First Spark", "Mossglass Vale", 5, "Beacon calibration", "Motes teach lane reading.", "Mira + 250 Dawn Tokens"],
  ["The Seed Archive", "Mossglass Vale", 5, "Seed-cart escort", "Placement persists into Nightfall.", "Bram + Route Deck"],
  ["The Broken Mile", "Mossglass Vale", 7, "Rail restoration", "Glarewings teach ranged coverage.", "Lantern Workshop"],
  ["Lanterns in Moss", "Mossglass Vale", 9, "Lantern rescue", "Two-lane forecasting.", "Daily reward track"],
  ["Courier Through Fog", "Mossglass Vale", 9, "Seed-cart escort", "Fast route control.", "Pip + Runner trait"],
  ["Glassroot Crossing", "Mossglass Vale", 9, "Bridge assembly", "Hollow Knights punish weak structures.", "Pip Blueprints"],
  ["Orchard Without Noon", "Mossglass Vale", 9, "Seed-cart escort", "First Dusk Clock pressure.", "Grove banner"],
  ["The Crystal Archer", "Mossglass Vale", 9, "Sun-crystal extraction", "Mimics attack harvesters.", "Juniper"],
  ["Rootsong Reservoir", "Mossglass Vale", 9, "Weather-engine repair", "Wind changes projectile lanes.", "Juniper Blueprints"],
  ["Antler Roads", "Mossglass Vale", 9, "Beacon calibration", "Antler paths reroute enemies.", "Ember Sigils"],
  ["The Dusk Stag", "Mossglass Vale", 9, "Hearth Shard extraction", "Three-phase Vale guardian.", "Ascension access", "Dusk Stag"],
  ["Brass on the Water", "Brasswater Basin", 9, "Canal-lock repair", "Gloom Masons build shortcuts.", "Orla"],
  ["The Sunken Foundry", "Brasswater Basin", 9, "Weather-engine repair", "Parcel Leeches steal work.", "Orla Blueprints"],
  ["Gearback’s Burden", "Brasswater Basin", 9, "Rail restoration", "Multi-capacity hauling.", "Kodo"],
  ["The Ferryman’s Toll", "Brasswater Basin", 9, "Cargo rescue", "An informed tradeoff.", "Brasswater frame"],
  ["Ink Below the Lock", "Brasswater Basin", 9, "Hidden-route survey", "Whisperers punish clustering.", "Nox"],
  ["Caldera Kitchen", "Brasswater Basin", 9, "Field kitchen", "Recipe order shapes Nightfall.", "Tavi"],
  ["The Last Command", "Brasswater Basin", 9, "Relay disconnection", "Mixed elite wave.", "Tavi Blueprints"],
  ["The Ferryman Engine", "Brasswater Basin", 9, "Parcel interception", "Missed work becomes armor.", "Daily Contract", "Ferryman Engine"],
  ["Craterfall", "Skyglass Crater", 9, "Platform anchoring", "Bell Husks disrupt merges.", "Skyglass music"],
  ["City of Floating Bells", "Skyglass Crater", 9, "Lantern rescue", "Silence pulses cross the board.", "Nox Blueprints"],
  ["The Silent Caravan", "Skyglass Crater", 9, "Base-form trial", "Win without Form abilities.", "Merge effect"],
  ["Twelve Shards", "Skyglass Crater", 9, "Living relic delivery", "Choose a regional bonus.", "Hearth Shard banner"],
  ["The Keeper’s Bargain", "Skyglass Crater", 9, "Seal balancing", "Safe but lifeless twilight.", "Bellkeeper frame"],
  ["Echo Fracture", "Skyglass Crater", 9, "Loom-anchor repair", "Forms split into projections.", "Legendary meter"],
  ["Loom Under Siege", "Skyglass Crater", 9, "Overlapping Work/Night", "All contract systems combine.", "Hearthweave key"],
  ["The Bell-Eater", "Skyglass Crater", 9, "Silence-bell assault", "Three linked boss phases.", "Final route", "Bell-Eater"],
  ["The Hearthweave", "Finale", 12, "Build the new Loom", "Renewable lights restore the cycle.", "1,000 Dawn Tokens"],
];

export const MISSIONS: MissionDefinition[] = MISSION_ROWS.map((row, index) => ({
  id: index + 1,
  title: row[0],
  region: row[1],
  rounds: row[2],
  contract: row[3],
  enemyLesson: row[4],
  reward: row[5],
  boss: row[6],
}));

export type EnemyKind =
  | "mote"
  | "glarewing"
  | "hollow-knight"
  | "whisperer"
  | "mimic-mask"
  | "gloom-mason"
  | "parcel-leech"
  | "bell-husk";

export interface EnemyDefinition {
  id: EnemyKind;
  name: string;
  symbol: string;
  hp: number;
  speed: number;
  armor: number;
  impact: 1 | 2;
  threat: number;
  counter: string;
}

export interface CombatEnemy {
  id: string;
  kind: EnemyKind;
  lane: 0 | 1 | 2;
  progress: number;
  hp: number;
  maxHp: number;
  armor: number;
  marked: boolean;
  slowed: boolean;
}

export interface PendingEnemy {
  id: string;
  kind: EnemyKind;
  lane: 0 | 1 | 2;
  spawnAt: number;
  maxHp: number;
}

export interface CombatWave {
  tick: number;
  totalThreat: number;
  totalEnemies: number;
  kills: number;
  escaped: number;
  damageTaken: number;
  enemies: CombatEnemy[];
  pending: PendingEnemy[];
  lastEvent: string;
}

export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  mote: {
    id: "mote",
    name: "Mote",
    symbol: "●",
    hp: 60,
    speed: 1.3,
    armor: 0,
    impact: 1,
    threat: 1,
    counter: "Splash, roots, and covered lanes",
  },
  glarewing: {
    id: "glarewing",
    name: "Glarewing",
    symbol: "◆",
    hp: 85,
    speed: 1.05,
    armor: 0,
    impact: 1,
    threat: 2,
    counter: "Long range and prism arrows",
  },
  "hollow-knight": {
    id: "hollow-knight",
    name: "Hollow Knight",
    symbol: "♜",
    hp: 340,
    speed: 0.55,
    armor: 0.45,
    impact: 2,
    threat: 5,
    counter: "Armor crack and sustained focus",
  },
  whisperer: {
    id: "whisperer",
    name: "Whisperer",
    symbol: "◖",
    hp: 130,
    speed: 0.85,
    armor: 0,
    impact: 1,
    threat: 3,
    counter: "Spread Channelers",
  },
  "mimic-mask": {
    id: "mimic-mask",
    name: "Mimic Mask",
    symbol: "◈",
    hp: 160,
    speed: 0.9,
    armor: 0.08,
    impact: 1,
    threat: 4,
    counter: "Marks and terrain damage",
  },
  "gloom-mason": {
    id: "gloom-mason",
    name: "Gloom Mason",
    symbol: "▰",
    hp: 200,
    speed: 0.7,
    armor: 0.15,
    impact: 2,
    threat: 4,
    counter: "Runners and long range",
  },
  "parcel-leech": {
    id: "parcel-leech",
    name: "Parcel Leech",
    symbol: "≈",
    hp: 100,
    speed: 1,
    armor: 0.1,
    impact: 1,
    threat: 3,
    counter: "Efficient routes and interceptors",
  },
  "bell-husk": {
    id: "bell-husk",
    name: "Bell Husk",
    symbol: "♢",
    hp: 240,
    speed: 0.65,
    armor: 0.2,
    impact: 2,
    threat: 6,
    counter: "Split positioning and fast elimination",
  },
};

const THREAT_BUDGETS = [8, 11, 15, 18, 22, 27, 32, 38];
const STAR_COMBAT_MULTIPLIER = [0, 1, 1.8, 3.8, 6.2];
const STAR_WORK_MULTIPLIER = [0, 1, 1.6, 3, 4.6];
const LANE_COLUMNS = [1, 3, 5] as const;

function enemyPoolForMission(missionId: number): EnemyKind[] {
  const pool: EnemyKind[] = ["mote"];
  if (missionId >= 3) pool.push("glarewing");
  if (missionId >= 6) pool.push("hollow-knight");
  if (missionId >= 8) pool.push("mimic-mask");
  if (missionId >= 12) pool.push("gloom-mason");
  if (missionId >= 13) pool.push("parcel-leech");
  if (missionId >= 16) pool.push("whisperer");
  if (missionId >= 20) pool.push("bell-husk");
  return pool;
}

function enemyHealthMultiplier(
  missionId: number,
  difficulty: Difficulty,
) {
  const difficultyMultiplier = {
    story: 0.85,
    standard: 1,
    wayfinder: 1.25,
    eclipse: 1.45,
  }[difficulty];
  const campaignMultiplier = 1 + Math.floor((missionId - 1) / 5) * 0.08;
  return difficultyMultiplier * campaignMultiplier;
}

export function threatBudget(round: number, missionId = 1) {
  const base =
    THREAT_BUDGETS[Math.min(round - 1, THREAT_BUDGETS.length - 1)] ??
    THREAT_BUDGETS[0];
  return Math.round(base * (1 + Math.floor((missionId - 1) / 7) * 0.08));
}

export function createCombatWave({
  missionId,
  round,
  difficulty,
  dusk,
}: {
  missionId: number;
  round: number;
  difficulty: Difficulty;
  dusk: number;
}): CombatWave {
  const pool = enemyPoolForMission(missionId);
  const budget = threatBudget(round, missionId);
  const healthMultiplier = enemyHealthMultiplier(missionId, difficulty);
  const activeLanes: Array<0 | 1 | 2> =
    round <= 1 && dusk < 2 ? [0, 2] : [0, 1, 2];
  const pending: PendingEnemy[] = [];
  let spent = 0;
  let cursor = 0;

  while (spent < budget) {
    const poolIndex = (cursor + round + missionId) % pool.length;
    let kind = pool[poolIndex];
    if (spent + ENEMIES[kind].threat > budget) kind = "mote";
    const definition = ENEMIES[kind];
    const lane = activeLanes[(cursor + round) % activeLanes.length];
    pending.push({
      id: `r${round}-${cursor}-${kind}`,
      kind,
      lane,
      spawnAt: Math.floor(cursor * 1.25),
      maxHp: Math.round(definition.hp * healthMultiplier),
    });
    spent += definition.threat;
    cursor += 1;
  }

  return {
    tick: 0,
    totalThreat: spent,
    totalEnemies: pending.length,
    kills: 0,
    escaped: 0,
    damageTaken: 0,
    enemies: [],
    pending,
    lastEvent: "The forecasted lanes begin to open.",
  };
}

function boardDistance(cellIndex: number, enemy: CombatEnemy) {
  const row = Math.floor(cellIndex / 7);
  const column = cellIndex % 7;
  const enemyRow = enemy.progress * 5;
  const enemyColumn = LANE_COLUMNS[enemy.lane];
  return Math.abs(row - enemyRow) + Math.abs(column - enemyColumn) * 0.72;
}

export interface CombatAttackCue {
  cell: number;
  characterId: string;
  targetId: string;
}

export function combatAttackCues(
  wave: CombatWave,
  board: Record<number, string>,
): CombatAttackCue[] {
  return Object.entries(board).flatMap(([cellValue, characterId]) => {
    const cell = Number(cellValue);
    const character = CHARACTERS.find((item) => item.id === characterId);
    if (!character) return [];
    const target = wave.enemies
      .filter(
        (enemy) =>
          enemy.hp > 0 && boardDistance(cell, enemy) <= character.range,
      )
      .sort((left, right) => right.progress - left.progress)[0];
    return target
      ? [{ cell, characterId: character.id, targetId: target.id }]
      : [];
  });
}

function dealDamage(enemy: CombatEnemy, amount: number) {
  const markedMultiplier = enemy.marked ? 1.15 : 1;
  enemy.hp -= amount * (1 - enemy.armor) * markedMultiplier;
}

export function advanceCombat(
  wave: CombatWave,
  board: Record<number, string>,
  starByCharacter: Record<string, number>,
): CombatWave {
  const nextTick = wave.tick + 1;
  const spawning = wave.pending.filter((enemy) => enemy.spawnAt <= nextTick);
  const pending = wave.pending.filter((enemy) => enemy.spawnAt > nextTick);
  const enemies: CombatEnemy[] = [
    ...wave.enemies.map((enemy) => ({ ...enemy, slowed: false })),
    ...spawning.map((enemy) => ({
      id: enemy.id,
      kind: enemy.kind,
      lane: enemy.lane,
      progress: 0,
      hp: enemy.maxHp,
      maxHp: enemy.maxHp,
      armor: ENEMIES[enemy.kind].armor,
      marked: false,
      slowed: false,
    })),
  ];

  const placements = Object.entries(board)
    .map(([cell, characterId]) => ({
      cell: Number(cell),
      character: CHARACTERS.find((item) => item.id === characterId),
    }))
    .filter(
      (
        placement,
      ): placement is { cell: number; character: CharacterDefinition } =>
        Boolean(placement.character),
    );

  for (const placement of placements) {
    const { character, cell } = placement;
    const star = Math.max(
      1,
      Math.min(4, starByCharacter[character.id] || 1),
    );
    const targets = enemies
      .filter(
        (enemy) =>
          enemy.hp > 0 && boardDistance(cell, enemy) <= character.range,
      )
      .sort((left, right) => right.progress - left.progress);
    const primary = targets[0];
    if (!primary) continue;

    const baseDamage =
      (character.damage / character.attackInterval) *
      STAR_COMBAT_MULTIPLIER[star];
    if (character.id === "orla") {
      primary.armor = Math.max(0, primary.armor - (star >= 2 ? 0.38 : 0.22));
    }
    if (character.id === "nox") {
      for (const markedTarget of targets.slice(0, star >= 2 ? 3 : 1)) {
        markedTarget.marked = true;
      }
    }
    if (character.id === "bram") {
      for (const rootedTarget of targets.slice(0, star >= 2 ? 2 : 1)) {
        rootedTarget.slowed = true;
      }
    }

    const chargeCadence = star >= 2 ? 4 : 6;
    const chargeMultiplier =
      character.id === "kodo" && nextTick % chargeCadence === 0 ? 2.6 : 1;
    dealDamage(primary, baseDamage * chargeMultiplier);

    const secondaryScale = star >= 2 ? 0.7 : 0.5;
    if (["mira", "pip", "juniper"].includes(character.id)) {
      const extraTargets = star >= 3 ? 3 : star >= 2 ? 2 : 1;
      for (const secondary of targets.slice(1, extraTargets + 1)) {
        dealDamage(secondary, baseDamage * secondaryScale);
      }
    }
    if (character.id === "orla" && star >= 2 && targets[1]) {
      targets[1].armor = Math.max(0, targets[1].armor - 0.24);
      dealDamage(targets[1], baseDamage * 0.48);
    }
    if (character.id === "bram" && star >= 2 && targets[1]) {
      dealDamage(targets[1], baseDamage * 0.35);
    }
    if (character.id === "tavi") {
      const splashRadius = star >= 3 ? 0.42 : star >= 2 ? 0.3 : 0.2;
      for (const splash of enemies.filter(
        (enemy) =>
          enemy.hp > 0 &&
          enemy.id !== primary.id &&
          enemy.lane === primary.lane &&
          Math.abs(enemy.progress - primary.progress) <= splashRadius,
      )) {
        dealDamage(splash, baseDamage * secondaryScale);
      }
    }
    if (character.id === "kodo" && nextTick % chargeCadence === 0) {
      for (const linedUp of enemies.filter(
        (enemy) =>
          enemy.hp > 0 &&
          enemy.id !== primary.id &&
          enemy.lane === primary.lane,
      )) {
        dealDamage(linedUp, baseDamage * 0.8);
      }
    }
  }

  const killsThisTick = enemies.filter((enemy) => enemy.hp <= 0).length;
  const survivors = enemies.filter((enemy) => enemy.hp > 0);
  for (const enemy of survivors) {
    const speed = ENEMIES[enemy.kind].speed * (enemy.slowed ? 0.42 : 1);
    enemy.progress += speed * 0.047;
  }
  const impacts = survivors.filter((enemy) => enemy.progress >= 1);
  const impactDamage = impacts.reduce(
    (sum, enemy) => sum + ENEMIES[enemy.kind].impact,
    0,
  );
  const active = survivors.filter((enemy) => enemy.progress < 1);
  const lastEvent =
    impactDamage > 0
      ? `${impactDamage} Beacon Heart${impactDamage === 1 ? "" : "s"} lost.`
      : killsThisTick > 0
        ? `${killsThisTick} Duskborn broken before the Caravan.`
        : spawning.length > 0
          ? `${spawning.length} ${spawning.length === 1 ? "enemy enters" : "enemies enter"} the lanes.`
          : wave.lastEvent;

  return {
    ...wave,
    tick: nextTick,
    pending,
    enemies: active,
    kills: wave.kills + killsThisTick,
    escaped: wave.escaped + impacts.length,
    damageTaken: wave.damageTaken + impactDamage,
    lastEvent,
  };
}

export function forceResolveCombat(wave: CombatWave): CombatWave {
  const unresolved = [
    ...wave.enemies.map((enemy) => ENEMIES[enemy.kind].impact),
    ...wave.pending.map((enemy) => ENEMIES[enemy.kind].impact),
  ];
  const impactDamage = unresolved.reduce((sum, impact) => sum + impact, 0);
  return {
    ...wave,
    pending: [],
    enemies: [],
    escaped: wave.escaped + unresolved.length,
    damageTaken: wave.damageTaken + impactDamage,
    lastEvent: `Nightfall broke through for ${impactDamage} Beacon damage.`,
  };
}

export function mergeCostForStar(star: number) {
  if (star <= 1) return 3;
  if (star === 2) return 6;
  return Number.POSITIVE_INFINITY;
}

export function combatPower(star: number) {
  return STAR_COMBAT_MULTIPLIER[Math.max(1, Math.min(4, star))];
}

export function workPower(star: number) {
  return STAR_WORK_MULTIPLIER[Math.max(1, Math.min(4, star))];
}

export function workRate(
  board: Record<number, string>,
  starByCharacter: Record<string, number>,
  missionId: number,
  round: number,
) {
  const deployedPower = Object.values(board).reduce((sum, characterId) => {
    const character = CHARACTERS.find((item) => item.id === characterId);
    if (!character) return sum;
    const specialistBonus =
      (missionId <= 11 && ["mira", "bram", "juniper"].includes(characterId)) ||
      (missionId >= 12 &&
        missionId <= 19 &&
        ["orla", "pip", "kodo", "tavi"].includes(characterId)) ||
      (missionId >= 20 && ["nox", "mira", "juniper"].includes(characterId))
        ? 1.18
        : 1;
    return (
      sum +
      workPower(starByCharacter[characterId] || 1) * specialistBonus
    );
  }, 0);
  const roundPressure = 1 + Math.max(0, round - 1) * 0.16;
  return (deployedPower * 0.057) / roundPressure;
}

export function laneCoverage(
  board: Record<number, string>,
  starByCharacter: Record<string, number>,
) {
  return ([0, 1, 2] as const).map((lane) => {
    const probe: CombatEnemy = {
      id: "forecast-probe",
      kind: "mote",
      lane,
      progress: 0.12,
      hp: 1,
      maxHp: 1,
      armor: 0,
      marked: false,
      slowed: false,
    };
    return Object.entries(board).some(([cell, characterId]) => {
      const character = CHARACTERS.find((item) => item.id === characterId);
      if (!character) return false;
      const starRangeBonus = (starByCharacter[characterId] || 1) >= 3 ? 0.5 : 0;
      return boardDistance(Number(cell), probe) <= character.range + starRangeBonus;
    });
  });
}

export const HEARTH_PACK_ODDS = {
  common: 0.644,
  uncommon: 0.255,
  rare: 0.089,
  epic: 0.011,
  legendary: 0.0008,
  mythic: 0.0002,
} as const;

const oddsTotal = Object.values(HEARTH_PACK_ODDS).reduce(
  (sum, value) => sum + value,
  0,
);
if (Math.abs(oddsTotal - 1) > Number.EPSILON * 10) {
  throw new Error("Hearth Pack odds must total exactly 1.");
}

export const RARITY_META: Record<
  Rarity,
  { label: string; symbol: string; color: string; dust: number }
> = {
  common: { label: "Common", symbol: "◆", color: "#aeb6bd", dust: 25 },
  uncommon: { label: "Uncommon", symbol: "❧", color: "#85b83d", dust: 60 },
  rare: { label: "Rare", symbol: "✦", color: "#4ba8ea", dust: 180 },
  epic: { label: "Epic", symbol: "◈", color: "#a862cc", dust: 650 },
  legendary: { label: "Legendary", symbol: "☀", color: "#ed9b33", dust: 5000 },
  mythic: { label: "Mythic", symbol: "✧", color: "#e9e3ff", dust: 12000 },
};

export const RELIC_CATALOG: PackRelic[] = [
  { id: "brass-patina", name: "Wayworn Brass", rarity: "common", category: "Projectile finish" },
  { id: "moss-stitch", name: "Moss-Stitched Satchel", rarity: "common", category: "Crew accessory" },
  { id: "paper-sparks", name: "Blueprint Sparks", rarity: "common", category: "Merge effect" },
  { id: "mossbound-lantern", name: "Mossbound Lantern", rarity: "uncommon", category: "Caravan lantern" },
  { id: "seedwake", name: "Seedwake Trail", rarity: "uncommon", category: "Movement trail" },
  { id: "starfall-banner", name: "Starfall Banner", rarity: "rare", category: "Caravan banner" },
  { id: "cobalt-arcs", name: "Cobalt Arcwork", rarity: "rare", category: "Ability VFX" },
  { id: "emberline-seal", name: "Emberline Seal", rarity: "epic", category: "Merge animation" },
  { id: "cathedral-brass", name: "Cathedral Brass Orla", rarity: "legendary", category: "Visual Form" },
  { id: "dawnweaver-mira", name: "Dawnweaver Mira", rarity: "mythic", category: "Mythic Visual Form" },
];

const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

function seededUnit(seed: number) {
  let value = seed | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function baseRarity(value: number): Rarity {
  let cursor = 0;
  for (const rarity of RARITY_ORDER) {
    cursor += HEARTH_PACK_ODDS[rarity];
    if (value < cursor) return rarity;
  }
  return "mythic";
}

export function rollHearthPack(
  counters: PackCounters,
  ownedIds: string[],
  seed: number,
) {
  const nextRare = counters.sinceRarePlus + 1;
  const nextEpic = counters.sinceEpicPlus + 1;
  const nextLegendary = counters.sinceLegendaryPlus + 1;
  const natural = baseRarity(seededUnit(seed));
  let rarity = natural;
  let guarantee: "rare" | "epic" | "legendary" | null = null;

  if (nextLegendary >= 200) guarantee = "legendary";
  else if (nextEpic >= 50) guarantee = "epic";
  else if (nextRare >= 10) guarantee = "rare";

  if (
    guarantee &&
    RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.indexOf(guarantee)
  ) {
    rarity = guarantee;
  }

  const tier = RELIC_CATALOG.filter((item) => item.rarity === rarity);
  const unowned = tier.filter((item) => !ownedIds.includes(item.id));
  const pool = unowned.length ? unowned : tier;
  const reward =
    pool[Math.min(pool.length - 1, Math.floor(seededUnit(seed ^ 0x9e3779b9) * pool.length))];
  const duplicate = ownedIds.includes(reward.id);
  const rank = RARITY_ORDER.indexOf(rarity);

  const nextCounters: PackCounters = {
    totalOpened: counters.totalOpened + 1,
    sinceRarePlus: rank >= RARITY_ORDER.indexOf("rare") ? 0 : nextRare,
    sinceEpicPlus: rank >= RARITY_ORDER.indexOf("epic") ? 0 : nextEpic,
    sinceLegendaryPlus:
      rank >= RARITY_ORDER.indexOf("legendary") ? 0 : nextLegendary,
    pendingTransactionId: null,
    pendingRewardId: reward.id,
  };

  return {
    reward,
    natural,
    finalRarity: rarity,
    guarantee,
    duplicate,
    emberdust: duplicate ? RARITY_META[rarity].dust : 0,
    counters: nextCounters,
  };
}

export function guaranteeRemaining(counters: PackCounters) {
  return {
    rare: Math.max(1, 10 - counters.sinceRarePlus),
    epic: Math.max(1, 50 - counters.sinceEpicPlus),
    legendary: Math.max(1, 200 - counters.sinceLegendaryPlus),
  };
}

export type ContractGrade = "missed" | "bronze" | "silver" | "gold";

export function contractGrade(progress: number): ContractGrade {
  if (progress >= 1) return "gold";
  if (progress >= 0.75) return "silver";
  if (progress >= 0.5) return "bronze";
  return "missed";
}

export function roundDawnTokens({
  grade,
  noDamage,
  optional,
  elite,
  boss,
}: {
  grade: ContractGrade;
  noDamage: boolean;
  optional: boolean;
  elite: boolean;
  boss: boolean;
}) {
  const gradeReward = { missed: 0, bronze: 10, silver: 20, gold: 30 }[grade];
  return (
    20 +
    gradeReward +
    (noDamage ? 10 : 0) +
    (optional ? 15 : 0) +
    (elite ? 25 : 0) +
    (boss ? 50 : 0)
  );
}

export function applyDifficulty(value: number, difficulty: Difficulty) {
  const multiplier = {
    story: 0.85,
    standard: 1,
    wayfinder: 1.25,
    eclipse: 1.4,
  }[difficulty];
  return Math.round(value * multiplier);
}

export function mergeStar(count: number) {
  if (count < 3) return { remaining: count, star: 1, merged: false };
  return { remaining: count - 3, star: 2, merged: true };
}
