import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceCombat,
  applyDifficulty,
  combatAttackCues,
  contractGrade,
  createCombatWave,
  forceResolveCombat,
  guaranteeRemaining,
  HEARTH_PACK_ODDS,
  laneCoverage,
  mergeCostForStar,
  mergeStar,
  MISSIONS,
  RELIC_CATALOG,
  rollHearthPack,
  roundDawnTokens,
  type PackCounters,
} from "../app/game-core.ts";

function counters(overrides: Partial<PackCounters> = {}): PackCounters {
  return {
    totalOpened: 0,
    sinceRarePlus: 0,
    sinceEpicPlus: 0,
    sinceLegendaryPlus: 0,
    pendingTransactionId: null,
    pendingRewardId: null,
    ...overrides,
  };
}

test("authoritative Hearth Pack odds total exactly 100 percent", () => {
  const total = Object.values(HEARTH_PACK_ODDS).reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs(total - 1) < Number.EPSILON * 10);
});

test("campaign contains 28 sequentially reachable missions", () => {
  assert.equal(MISSIONS.length, 28);
  assert.deepEqual(
    MISSIONS.map((mission) => mission.id),
    Array.from({ length: 28 }, (_, index) => index + 1),
  );
  assert.equal(MISSIONS[27].title, "The Hearthweave");
});

test("contract grades and Dawn Token rewards follow centralized balance", () => {
  assert.equal(contractGrade(0.49), "missed");
  assert.equal(contractGrade(0.5), "bronze");
  assert.equal(contractGrade(0.75), "silver");
  assert.equal(contractGrade(1), "gold");
  assert.equal(
    roundDawnTokens({
      grade: "gold",
      noDamage: true,
      optional: true,
      elite: true,
      boss: false,
    }),
    100,
  );
  assert.equal(applyDifficulty(100, "story"), 85);
  assert.equal(applyDifficulty(100, "wayfinder"), 125);
  assert.equal(applyDifficulty(100, "eclipse"), 140);
});

test("exactly three matching Echo cards create a 2-star Specialist", () => {
  assert.deepEqual(mergeStar(2), { remaining: 2, star: 1, merged: false });
  assert.deepEqual(mergeStar(3), { remaining: 0, star: 2, merged: true });
  assert.deepEqual(mergeStar(4), { remaining: 1, star: 2, merged: true });
  assert.equal(mergeCostForStar(1), 3);
  assert.equal(mergeCostForStar(2), 6);
});

test("forecasted threat becomes individual lane enemies with real health", () => {
  const wave = createCombatWave({
    missionId: 1,
    round: 1,
    difficulty: "standard",
    dusk: 0,
  });
  assert.equal(wave.totalThreat, 8);
  assert.equal(wave.totalEnemies, 8);
  assert.ok(wave.pending.every((enemy) => enemy.maxHp > 0));
  assert.deepEqual(
    Array.from(new Set(wave.pending.map((enemy) => enemy.lane))).sort(),
    [0, 2],
  );
});

test("merging changes a late tutorial wave from a breach into a clean defense", () => {
  function resolve(star: number) {
    let wave = createCombatWave({
      missionId: 1,
      round: 5,
      difficulty: "standard",
      dusk: 0,
    });
    for (
      let tick = 0;
      tick < 35 && (wave.pending.length > 0 || wave.enemies.length > 0);
      tick += 1
    ) {
      wave = advanceCombat(wave, { 11: "mira" }, { mira: star });
    }
    return wave.pending.length || wave.enemies.length
      ? forceResolveCombat(wave)
      : wave;
  }

  const baseEcho = resolve(1);
  const specialist = resolve(2);
  assert.ok(baseEcho.damageTaken > 0);
  assert.equal(specialist.damageTaken, 0);
  assert.equal(specialist.kills, specialist.totalEnemies);
});

test("placement creates readable lane coverage instead of global attacks", () => {
  assert.deepEqual(laneCoverage({}, {}), [false, false, false]);
  const miraCoverage = laneCoverage({ 11: "mira" }, { mira: 1 });
  assert.equal(miraCoverage[2], true);
  const bramCoverage = laneCoverage({ 28: "bram" }, { bram: 1 });
  assert.equal(bramCoverage[2], false);
});

test("live combat exposes real attack cues for projectile animation", () => {
  const initial = createCombatWave({
    missionId: 1,
    round: 1,
    difficulty: "standard",
    dusk: 0,
  });
  const active = advanceCombat(initial, { 11: "mira" }, { mira: 2 });
  const cues = combatAttackCues(active, { 11: "mira" });
  assert.equal(cues.length, 1);
  assert.equal(cues[0].characterId, "mira");
  assert.ok(active.enemies.some((enemy) => enemy.id === cues[0].targetId));
});

test("highest due guarantee wins and every satisfied meter resets", () => {
  const owned: string[] = [];
  const rare = rollHearthPack(counters({ sinceRarePlus: 9 }), owned, 1);
  assert.equal(rare.finalRarity, "rare");
  assert.equal(rare.guarantee, "rare");
  assert.equal(rare.counters.sinceRarePlus, 0);

  const epic = rollHearthPack(
    counters({ sinceRarePlus: 9, sinceEpicPlus: 49 }),
    owned,
    1,
  );
  assert.equal(epic.finalRarity, "epic");
  assert.equal(epic.guarantee, "epic");
  assert.equal(epic.counters.sinceRarePlus, 0);
  assert.equal(epic.counters.sinceEpicPlus, 0);

  const legendary = rollHearthPack(
    counters({
      sinceRarePlus: 9,
      sinceEpicPlus: 49,
      sinceLegendaryPlus: 199,
    }),
    owned,
    1,
  );
  assert.equal(legendary.finalRarity, "legendary");
  assert.equal(legendary.guarantee, "legendary");
  assert.equal(legendary.counters.sinceLegendaryPlus, 0);
});

test("duplicate protection picks unowned items, then converts a complete tier", () => {
  const commonIds = RELIC_CATALOG.filter((item) => item.rarity === "common").map(
    (item) => item.id,
  );
  const oneOwned = rollHearthPack(counters(), [commonIds[0]], 1);
  assert.equal(oneOwned.finalRarity, "common");
  assert.equal(oneOwned.duplicate, false);
  assert.notEqual(oneOwned.reward.id, commonIds[0]);

  const completeTier = rollHearthPack(counters(), commonIds, 1);
  assert.equal(completeTier.duplicate, true);
  assert.equal(completeTier.emberdust, 25);
});

test("guarantee meters expose honest remaining pack counts", () => {
  assert.deepEqual(
    guaranteeRemaining(
      counters({
        sinceRarePlus: 9,
        sinceEpicPlus: 49,
        sinceLegendaryPlus: 199,
      }),
    ),
    { rare: 1, epic: 1, legendary: 1 },
  );
});
