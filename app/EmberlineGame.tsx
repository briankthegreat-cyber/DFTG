"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  advanceCombat,
  CHARACTERS,
  combatAttackCues,
  createCombatWave,
  contractGrade,
  ENEMIES,
  forceResolveCombat,
  guaranteeRemaining,
  HEARTH_PACK_ODDS,
  laneCoverage,
  mergeCostForStar,
  MISSIONS,
  RARITY_META,
  RELIC_CATALOG,
  rollHearthPack,
  roundDawnTokens,
  workRate,
  type CombatWave,
  type Difficulty,
  type ExpeditionPhase,
  type PackCounters,
  type PackRelic,
  type Rarity,
} from "./game-core";
import { BattlefieldMiniatures3D } from "./BattlefieldMiniatures3D";

type AppScreen =
  | "title"
  | "campaign"
  | "crew"
  | "workshop"
  | "collection"
  | "expedition";

interface EmberlineSaveV4 {
  version: 4;
  campaign: {
    unlockedMissionIds: number[];
    completedMissionIds: number[];
    medalsByMission: Record<number, number>;
  };
  economy: {
    dawnTokens: number;
    blueprintInk: number;
    emberdust: number;
  };
  collection: {
    ownedCosmeticIds: string[];
    equippedCosmeticBySlot: Record<string, string>;
  };
  packs: PackCounters;
  activeExpedition: ExpeditionState | null;
  tutorialFlags: Record<string, boolean>;
  claimedRewardTransactionIds: string[];
  settings: {
    reducedMotion: boolean;
    highContrast: boolean;
    haptics: boolean;
    gameSpeed: 1 | 2 | 4;
  };
}

interface ExpeditionState {
  missionId: number;
  difficulty: Difficulty;
  round: number;
  phase: ExpeditionPhase;
  phaseRemaining: number;
  hearts: number;
  dusk: number;
  bolts: number;
  sigils: number;
  speed: 1 | 2 | 4;
  paused: boolean;
  board: Record<number, string>;
  selectedCharacterId: string | null;
  cardCounts: Record<string, number>;
  starByCharacter: Record<string, number>;
  shop: string[];
  rerollCost: number;
  workProgress: number;
  combat: CombatWave | null;
  heartsAtRoundStart: number;
  lastRoundTokens: number;
  lastBoltReward: number;
  lastBeaconDamage: number;
  lastKills: number;
  lastGrade: "missed" | "bronze" | "silver" | "gold";
  defeatReason: string;
}

interface PackReveal {
  reward: PackRelic;
  rarity: Rarity;
  guarantee: "rare" | "epic" | "legendary" | null;
  duplicate: boolean;
  emberdust: number;
}

const SAVE_KEY = "emberline-save-v4";
const TUTORIAL_TARGET = 11;
const ATTACK_SYMBOLS: Record<string, string> = {
  mira: "ϟ",
  bram: "✦",
  pip: "◆",
  orla: "●",
  nox: "◈",
  tavi: "✹",
  juniper: "➶",
  kodo: "»",
};

function boardFigurePosition(cellIndex: number) {
  const row = Math.floor(cellIndex / 7);
  const column = cellIndex % 7;
  const stagger = row === 1 || row === 3 ? 0.55 : 0;
  return {
    x: 2 + ((column + 0.5) / 7) * 96 + stagger,
    y: 21 + ((row + 0.5) / 5) * 44,
  };
}

function createDefaultSave(): EmberlineSaveV4 {
  return {
    version: 4,
    campaign: {
      unlockedMissionIds: [1],
      completedMissionIds: [],
      medalsByMission: {},
    },
    economy: {
      dawnTokens: 1320,
      blueprintInk: 40,
      emberdust: 0,
    },
    collection: {
      ownedCosmeticIds: ["emberline-seal"],
      equippedCosmeticBySlot: {},
    },
    packs: {
      totalOpened: 0,
      sinceRarePlus: 2,
      sinceEpicPlus: 12,
      sinceLegendaryPlus: 47,
      pendingTransactionId: null,
      pendingRewardId: null,
    },
    activeExpedition: null,
    tutorialFlags: {},
    claimedRewardTransactionIds: [],
    settings: {
      reducedMotion: false,
      highContrast: false,
      haptics: true,
      gameSpeed: 1,
    },
  };
}

function createExpedition(missionId: number, difficulty: Difficulty): ExpeditionState {
  return {
    missionId,
    difficulty,
    round: 1,
    phase: missionId === 1 ? "forge" : "forecast",
    phaseRemaining: 18,
    hearts: 5,
    dusk: 0,
    bolts: 7,
    sigils: 0,
    speed: 1,
    paused: false,
    board: {},
    selectedCharacterId: missionId === 1 ? "mira" : null,
    cardCounts: { mira: 2, bram: 0, pip: 0 },
    starByCharacter: { mira: 1 },
    shop: ["mira", "bram", "pip"],
    rerollCost: 1,
    workProgress: 0,
    combat: null,
    heartsAtRoundStart: 5,
    lastRoundTokens: 0,
    lastBoltReward: 0,
    lastBeaconDamage: 0,
    lastKills: 0,
    lastGrade: "gold",
    defeatReason: "",
  };
}

function safeLoadSave() {
  if (typeof window === "undefined") return createDefaultSave();
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (parsed?.version === 4) {
      return {
        ...createDefaultSave(),
        ...parsed,
        campaign: { ...createDefaultSave().campaign, ...parsed.campaign },
        economy: { ...createDefaultSave().economy, ...parsed.economy },
        collection: { ...createDefaultSave().collection, ...parsed.collection },
        packs: { ...createDefaultSave().packs, ...parsed.packs },
        settings: { ...createDefaultSave().settings, ...parsed.settings },
      } as EmberlineSaveV4;
    }
  } catch {
    // A malformed local save falls back without blocking the first action.
  }
  return createDefaultSave();
}

function event(name: string, detail: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[emberline:event]", name, detail);
  }
}

export function EmberlineGame() {
  const [screen, setScreen] = useState<AppScreen>("title");
  const [save, setSave] = useState<EmberlineSaveV4>(createDefaultSave);
  const [saveHydrated, setSaveHydrated] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [selectedMission, setSelectedMission] = useState(1);
  const [expedition, setExpedition] = useState<ExpeditionState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [crewFilter, setCrewFilter] = useState("All");
  const [workshopTab, setWorkshopTab] = useState<"cosmetics" | "blueprints">(
    "cosmetics",
  );
  const [packReveal, setPackReveal] = useState<PackReveal | null>(null);
  const [packBusy, setPackBusy] = useState(false);
  const [toast, setToast] = useState("");
  const claimedRoundRef = useRef("");
  const expeditionRef = useRef(expedition);
  const timerPhase = expedition?.phase;
  const timerPaused = expedition?.paused;
  const timerSpeed = expedition?.speed;
  const campMissionId = expedition?.missionId;
  const campRound = expedition?.round;
  const campDamage = expedition?.lastBeaconDamage;
  const campGrade = expedition?.lastGrade;

  useEffect(() => {
    expeditionRef.current = expedition;
  }, [expedition]);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const loaded = safeLoadSave();
      setSave(loaded);
      const pending = RELIC_CATALOG.find(
        (relic) => relic.id === loaded.packs.pendingRewardId,
      );
      if (pending) {
        setPackReveal({
          reward: pending,
          rarity: pending.rarity,
          guarantee: null,
          duplicate: false,
          emberdust: 0,
        });
      }
      setSaveHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!saveHydrated) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save, saveHydrated]);

  useEffect(() => {
    if (!saveHydrated) return;
    const boundaryTimer = window.setTimeout(() => {
      const snapshot = expeditionRef.current;
      setSave((current) => ({
        ...current,
        activeExpedition: screen === "expedition" ? snapshot : null,
      }));
    }, 0);
    return () => window.clearTimeout(boundaryTimer);
  }, [saveHydrated, screen, timerPhase, campMissionId, campRound]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setExpedition((current) =>
          current ? { ...current, paused: true } : current,
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (
      screen !== "expedition" ||
      !timerPhase ||
      timerPaused ||
      !["work", "nightfall"].includes(timerPhase)
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setExpedition((current) => {
        if (!current || current.paused) return current;
        if (current.phase === "work") {
          const progress = Math.min(
            1.25,
            current.workProgress +
              workRate(
                current.board,
                current.starByCharacter,
                current.missionId,
                current.round,
              ),
          );
          const remaining = current.phaseRemaining - 1;
          if (remaining > 0) {
            return {
              ...current,
              phaseRemaining: remaining,
              workProgress: progress,
            };
          }
          const grade = contractGrade(progress);
          const dusk = current.dusk + (grade === "missed" ? 1 : 0);
          event("contract_completed", {
            mission: current.missionId,
            round: current.round,
            grade,
          });
          if (dusk >= 3) {
            return {
              ...current,
              phase: "defeat",
              phaseRemaining: 0,
              workProgress: progress,
              lastGrade: grade,
              dusk,
              defeatReason:
                "Three missed contracts let the Dusk overtake the Caravan.",
            };
          }
          return {
            ...current,
            phase: "nightfall",
            phaseRemaining: 35,
            workProgress: progress,
            lastGrade: grade,
            dusk,
            combat: createCombatWave({
              missionId: current.missionId,
              round: current.round,
              difficulty: current.difficulty,
              dusk,
            }),
          };
        }

        let next = { ...current };
        for (let beat = 0; beat < current.speed; beat += 1) {
          const combat =
            next.combat ??
            createCombatWave({
              missionId: next.missionId,
              round: next.round,
              difficulty: next.difficulty,
              dusk: next.dusk,
            });
          const advanced = advanceCombat(
            combat,
            next.board,
            next.starByCharacter,
          );
          const damageThisBeat = advanced.damageTaken - combat.damageTaken;
          const hearts = Math.max(0, next.hearts - damageThisBeat);
          const remaining = next.phaseRemaining - 1;
          next = {
            ...next,
            combat: advanced,
            hearts,
            phaseRemaining: remaining,
          };

          if (hearts <= 0) {
            return {
              ...next,
              phase: "defeat",
              phaseRemaining: 0,
              lastBeaconDamage: advanced.damageTaken,
              lastKills: advanced.kills,
              defeatReason:
                "The Duskborn reached the Caravan and extinguished every Beacon Heart.",
            };
          }
          if (advanced.pending.length === 0 && advanced.enemies.length === 0) {
            return {
              ...next,
              phase: "camp",
              phaseRemaining: 0,
              lastBeaconDamage: advanced.damageTaken,
              lastKills: advanced.kills,
            };
          }
          if (remaining <= 0) {
            const resolved = forceResolveCombat(advanced);
            const timeoutDamage =
              resolved.damageTaken - advanced.damageTaken;
            const timeoutHearts = Math.max(0, hearts - timeoutDamage);
            return {
              ...next,
              combat: resolved,
              hearts: timeoutHearts,
              phase: timeoutHearts > 0 ? "camp" : "defeat",
              phaseRemaining: 0,
              lastBeaconDamage: resolved.damageTaken,
              lastKills: resolved.kills,
              defeatReason:
                timeoutHearts > 0
                  ? ""
                  : "The final monsters broke through when Nightfall closed.",
            };
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, timerPhase, timerPaused, timerSpeed]);

  useEffect(() => {
    if (
      timerPhase !== "camp" ||
      campMissionId === undefined ||
      campRound === undefined ||
      campDamage === undefined ||
      campGrade === undefined
    ) {
      return;
    }
    const claimKey = `${campMissionId}:${campRound}`;
    if (claimedRoundRef.current === claimKey) return;
    claimedRoundRef.current = claimKey;
    const grade = campGrade;
    const noDamage = campDamage === 0;
    const tokens = roundDawnTokens({
      grade,
      noDamage,
      optional: campRound % 2 === 0,
      elite: campRound === 4,
      boss: campRound === MISSIONS[campMissionId - 1].rounds,
    });
    const boltReward =
      4 +
      ({ missed: 0, bronze: 1, silver: 2, gold: 3 } as const)[grade] +
      (noDamage ? 2 : 0);
    setExpedition((current) =>
      current
        ? {
            ...current,
            lastRoundTokens: tokens,
            lastBoltReward: boltReward,
            bolts: current.bolts + boltReward,
          }
        : current,
    );
    setSave((current) => ({
      ...current,
      economy: {
        ...current.economy,
        dawnTokens: current.economy.dawnTokens + tokens,
      },
    }));
    event("round_completed", { tokens, grade, claimKey });
  }, [timerPhase, campMissionId, campRound, campDamage, campGrade]);

  const mission = expedition
    ? MISSIONS[expedition.missionId - 1]
    : MISSIONS[selectedMission - 1];
  const workshopUnlocked = save.campaign.completedMissionIds.includes(3);
  const guarantees = guaranteeRemaining(save.packs);
  const currentPhaseDuration = expedition?.phase === "work" ? 18 : 35;
  const workProgress = expedition?.workProgress ?? 0;
  const workStep = ["DISCOVER", "GATHER", "CARRY", "CHARGE", "ACTIVATE"][
    Math.min(4, Math.floor(workProgress * 5))
  ];

  const filteredCrew = useMemo(
    () =>
      CHARACTERS.filter(
        (character) =>
          crewFilter === "All" ||
          character.guild === crewFilter ||
          character.role === crewFilter,
      ),
    [crewFilter],
  );

  function startMission(id: number) {
    setSelectedMission(id);
    setExpedition(createExpedition(id, difficulty));
    setScreen("expedition");
    claimedRoundRef.current = "";
    event("mission_started", { missionId: id, difficulty });
  }

  function beginJourney() {
    if (save.activeExpedition) {
      setSelectedMission(save.activeExpedition.missionId);
      setExpedition({ ...save.activeExpedition, paused: false });
      setScreen("expedition");
      return;
    }
    startMission(1);
  }

  function deployCharacter(cellIndex: number, forcedId?: string) {
    if (!expedition || expedition.phase !== "forge") return;
    if (
      expedition.missionId === 1 &&
      expedition.round === 1 &&
      Object.keys(expedition.board).length === 0 &&
      cellIndex !== TUTORIAL_TARGET
    ) {
      setToast("Follow the gold marker beside the pylon.");
      window.setTimeout(() => setToast(""), 1500);
      return;
    }
    const characterId = forcedId || expedition.selectedCharacterId;
    if (!characterId) return;
    if (!expedition.starByCharacter[characterId]) {
      setToast("Buy this Blueprint before deploying its Echo.");
      window.setTimeout(() => setToast(""), 1700);
      return;
    }
    if (
      expedition.board[cellIndex] &&
      expedition.board[cellIndex] !== characterId
    ) {
      setToast("That hex is occupied. Choose another landing point.");
      window.setTimeout(() => setToast(""), 1500);
      return;
    }
    const movedBoard = Object.fromEntries(
      Object.entries(expedition.board).filter(
        ([, deployedId]) => deployedId !== characterId,
      ),
    );
    setExpedition({
      ...expedition,
      board: { ...movedBoard, [cellIndex]: characterId },
      selectedCharacterId: null,
    });
    if (save.settings.haptics) window.navigator.vibrate?.(18);
    if (cellIndex === TUTORIAL_TARGET && expedition.missionId === 1) {
      setSave((current) => ({
        ...current,
        tutorialFlags: { ...current.tutorialFlags, placedMira: true },
      }));
      setToast("Mira is linked. Buy her third Echo and merge.");
      window.setTimeout(() => setToast(""), 1800);
    }
    event("unit_placed", { characterId, cellIndex });
  }

  function buyCard(characterId: string) {
    if (!expedition || expedition.bolts < 2) return;
    setExpedition({
      ...expedition,
      bolts: expedition.bolts - 2,
      cardCounts: {
        ...expedition.cardCounts,
        [characterId]: (expedition.cardCounts[characterId] || 0) + 1,
      },
      starByCharacter: {
        ...expedition.starByCharacter,
        [characterId]: expedition.starByCharacter[characterId] || 1,
      },
    });
    event("blueprint_purchased", { characterId });
  }

  function mergeCharacter(characterId: string) {
    if (!expedition) return;
    const currentStar = expedition.starByCharacter[characterId] || 1;
    const cost = mergeCostForStar(currentStar);
    if ((expedition.cardCounts[characterId] || 0) < cost) return;
    const nextStar = Math.min(3, currentStar + 1);
    setExpedition({
      ...expedition,
      cardCounts: {
        ...expedition.cardCounts,
        [characterId]: expedition.cardCounts[characterId] - cost,
      },
      starByCharacter: {
        ...expedition.starByCharacter,
        [characterId]: nextStar,
      },
    });
    if (save.settings.haptics) window.navigator.vibrate?.([20, 35, 30]);
    setToast(
      nextStar === 2
        ? "2★ SPECIALIST FORGED · Combat power ×1.8"
        : "3★ FORM AWAKENED · Combat power ×3.8",
    );
    window.setTimeout(() => setToast(""), 2200);
    event("echo_merged", { characterId });
  }

  function rerollShop() {
    if (!expedition || expedition.bolts < expedition.rerollCost) return;
    const offset = expedition.round + expedition.rerollCost;
    const nextShop = [0, 1, 2].map(
      (index) => CHARACTERS[(offset + index) % CHARACTERS.length].id,
    );
    setExpedition({
      ...expedition,
      bolts: expedition.bolts - expedition.rerollCost,
      rerollCost: Math.min(3, expedition.rerollCost + 1),
      shop: nextShop,
    });
  }

  function openForge() {
    setExpedition((current) =>
      current
        ? {
            ...current,
            phase: "forge",
            phaseRemaining: 18,
            rerollCost: 1,
            combat: null,
          }
        : current,
    );
  }

  function beginWork() {
    if (!expedition || Object.keys(expedition.board).length === 0) {
      setToast("Place at least one crew Echo first.");
      window.setTimeout(() => setToast(""), 1800);
      return;
    }
    if (
      expedition.missionId === 1 &&
      expedition.round === 1 &&
      (expedition.starByCharacter.mira || 1) < 2
    ) {
      setToast("Merge three Mira Echoes before the first Nightfall.");
      window.setTimeout(() => setToast(""), 1800);
      return;
    }
    setExpedition({
      ...expedition,
      phase: "work",
      phaseRemaining: 18,
      workProgress: 0,
      combat: null,
      heartsAtRoundStart: expedition.hearts,
      lastBeaconDamage: 0,
      lastKills: 0,
      defeatReason: "",
    });
  }

  function finishMission() {
    if (!expedition) return;
    const id = expedition.missionId;
    const completionReward = id === 1 ? 250 : id === 28 ? 1000 : 150;
    const medals =
      1 +
      (expedition.lastGrade === "gold" ? 1 : 0) +
      (expedition.hearts === 5 ? 1 : 0);
    setSave((current) => {
      if (current.campaign.completedMissionIds.includes(id)) return current;
      const completedMissionIds = [...current.campaign.completedMissionIds, id];
      const unlockedMissionIds = Array.from(
        new Set([...current.campaign.unlockedMissionIds, Math.min(28, id + 1)]),
      );
      return {
        ...current,
        campaign: {
          ...current.campaign,
          completedMissionIds,
          unlockedMissionIds,
          medalsByMission: {
            ...current.campaign.medalsByMission,
            [id]: medals,
          },
        },
        economy: {
          ...current.economy,
          dawnTokens: current.economy.dawnTokens + completionReward,
        },
      };
    });
    setExpedition({ ...expedition, phase: "results" });
    event("mission_completed", { missionId: id });
  }

  function nextRound() {
    if (!expedition) return;
    if (expedition.round >= mission.rounds) {
      finishMission();
      return;
    }
    claimedRoundRef.current = "";
    setExpedition({
      ...expedition,
      round: expedition.round + 1,
      phase: "forecast",
      phaseRemaining: 18,
      board: { ...expedition.board },
      rerollCost: 1,
      workProgress: 0,
      combat: null,
      heartsAtRoundStart: expedition.hearts,
      lastRoundTokens: 0,
      lastBoltReward: 0,
      lastBeaconDamage: 0,
      lastKills: 0,
      defeatReason: "",
    });
  }

  function retryMission() {
    if (!expedition) return;
    setExpedition(createExpedition(expedition.missionId, expedition.difficulty));
    claimedRoundRef.current = "";
    event("mission_retried", { missionId: expedition.missionId });
  }

  function purchasePack() {
    if (packBusy || save.economy.dawnTokens < 650) return;
    setPackBusy(true);
    const transactionId = `hearth-${Date.now()}-${save.packs.totalOpened + 1}`;
    const seed =
      (save.packs.totalOpened + 1) * 2654435761 +
      save.campaign.completedMissionIds.length * 97;
    const rolled = rollHearthPack(
      {
        ...save.packs,
        pendingTransactionId: transactionId,
      },
      save.collection.ownedCosmeticIds,
      seed,
    );
    const nextSave: EmberlineSaveV4 = {
      ...save,
      economy: {
        ...save.economy,
        dawnTokens: save.economy.dawnTokens - 650,
        emberdust: save.economy.emberdust + rolled.emberdust,
      },
      collection: {
        ...save.collection,
        ownedCosmeticIds: rolled.duplicate
          ? save.collection.ownedCosmeticIds
          : [...save.collection.ownedCosmeticIds, rolled.reward.id],
      },
      packs: rolled.counters,
      claimedRewardTransactionIds: [
        ...save.claimedRewardTransactionIds,
        transactionId,
      ],
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(nextSave));
    setSave(nextSave);
    setPackReveal({
      reward: rolled.reward,
      rarity: rolled.finalRarity,
      guarantee: rolled.guarantee,
      duplicate: rolled.duplicate,
      emberdust: rolled.emberdust,
    });
    event("pack_purchased", {
      transactionId,
      rarity: rolled.finalRarity,
      guarantee: rolled.guarantee,
    });
    window.setTimeout(
      () => setPackBusy(false),
      save.settings.reducedMotion ? 450 : 1200,
    );
  }

  function equipRelic(relic: PackRelic) {
    setSave((current) => ({
      ...current,
      collection: {
        ...current.collection,
        equippedCosmeticBySlot: {
          ...current.collection.equippedCosmeticBySlot,
          [relic.category]: relic.id,
        },
      },
      packs: { ...current.packs, pendingRewardId: null },
    }));
    setPackReveal(null);
    setToast(`${relic.name} equipped`);
    window.setTimeout(() => setToast(""), 1800);
  }

  function acknowledgePack() {
    setSave((current) => ({
      ...current,
      packs: { ...current.packs, pendingRewardId: null },
    }));
    setPackReveal(null);
  }

  function resetJourney() {
    const fresh = createDefaultSave();
    localStorage.setItem(SAVE_KEY, JSON.stringify(fresh));
    setSave(fresh);
    setExpedition(null);
    setScreen("title");
    setSettingsOpen(false);
  }

  const shellClass = [
    "emberline-shell",
    save.settings.highContrast ? "high-contrast" : "",
    save.settings.reducedMotion ? "reduced-motion" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClass}>
      <div className="app-frame">
        {screen === "title" && (
          <section className="title-screen">
            <div className="title-vignette" />
            <div className="title-content">
              <div className="brand-mark" aria-hidden="true">
                <span />
                <b>✦</b>
                <span />
              </div>
              <p className="eyebrow">A CARAVAN AT THE EDGE OF NIGHT</p>
              <h1>EMBERLINE</h1>
              <p className="title-sub">Caravan of the Last Dawn</p>
              <p className="tagline">Build by day. Hold through night. Carry the sun.</p>
              <button className="primary-button begin-button" onClick={beginJourney}>
                <span>{save.activeExpedition ? "CONTINUE JOURNEY" : "BEGIN JOURNEY"}</span>
                <small>{save.activeExpedition ? `Round ${save.activeExpedition.round} · ${save.activeExpedition.phase}` : "First Spark · one tap to play"}</small>
              </button>
            </div>
            <p className="title-foot">Single-player strategy · No energy · No paid power</p>
          </section>
        )}

        {screen === "campaign" && (
          <CampaignScreen
            save={save}
            selectedMission={selectedMission}
            setSelectedMission={setSelectedMission}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            startMission={startMission}
            openSettings={() => setSettingsOpen(true)}
          />
        )}

        {screen === "crew" && (
          <CrewScreen
            crewFilter={crewFilter}
            setCrewFilter={setCrewFilter}
            filteredCrew={filteredCrew}
            openSettings={() => setSettingsOpen(true)}
          />
        )}

        {screen === "workshop" && (
          <WorkshopScreen
            save={save}
            tab={workshopTab}
            setTab={setWorkshopTab}
            guarantees={guarantees}
            purchasePack={purchasePack}
            packBusy={packBusy}
            openSettings={() => setSettingsOpen(true)}
          />
        )}

        {screen === "collection" && (
          <CollectionScreen save={save} openSettings={() => setSettingsOpen(true)} />
        )}

        {screen === "expedition" && expedition && (
          <ExpeditionScreen
            expedition={expedition}
            mission={mission}
            progress={workProgress}
            workStep={workStep}
            phaseDuration={currentPhaseDuration}
            deployCharacter={deployCharacter}
            buyCard={buyCard}
            mergeCharacter={mergeCharacter}
            rerollShop={rerollShop}
            openForge={openForge}
            beginWork={beginWork}
            nextRound={nextRound}
            retryMission={retryMission}
            setExpedition={setExpedition}
            returnToCampaign={() => {
              setScreen("campaign");
              setExpedition(null);
            }}
            openSettings={() => setSettingsOpen(true)}
          />
        )}

        {screen !== "title" && screen !== "expedition" && (
          <BottomNav
            screen={screen}
            setScreen={setScreen}
            workshopUnlocked={workshopUnlocked}
            onLocked={() => {
              setToast("Lantern Workshop unlocks after mission 3.");
              window.setTimeout(() => setToast(""), 2000);
            }}
          />
        )}

        {settingsOpen && (
          <SettingsPanel
            save={save}
            setSave={setSave}
            close={() => setSettingsOpen(false)}
            resetJourney={resetJourney}
          />
        )}

        {packReveal && (
          <PackRevealModal
            reveal={packReveal}
            reducedMotion={save.settings.reducedMotion}
            close={acknowledgePack}
            equip={() => equipRelic(packReveal.reward)}
          />
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </main>
  );
}

function AppHeader({
  title,
  subtitle,
  openSettings,
  currency,
}: {
  title: string;
  subtitle?: string;
  openSettings: () => void;
  currency?: number;
}) {
  return (
    <header className="app-header">
      <div>
        {subtitle && <span>{subtitle}</span>}
        <h2>{title}</h2>
      </div>
      <div className="header-actions">
        {typeof currency === "number" && (
          <span className="currency-pill" aria-label={`${currency} Dawn Tokens`}>
            ◉ {currency.toLocaleString()}
          </span>
        )}
        <button className="icon-button" onClick={openSettings} aria-label="Open settings">
          ⚙
        </button>
      </div>
    </header>
  );
}

function HeroRender({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <span
      className={`hero-render hero-${id} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

function EnemyRender({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <span
      className={`enemy-render enemy-render-${id} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

function CampaignScreen({
  save,
  selectedMission,
  setSelectedMission,
  difficulty,
  setDifficulty,
  startMission,
  openSettings,
}: {
  save: EmberlineSaveV4;
  selectedMission: number;
  setSelectedMission: (id: number) => void;
  difficulty: Difficulty;
  setDifficulty: (value: Difficulty) => void;
  startMission: (id: number) => void;
  openSettings: () => void;
}) {
  const selected = MISSIONS[selectedMission - 1];
  const unlocked = save.campaign.unlockedMissionIds.includes(selectedMission);
  return (
    <section className="screen campaign-screen">
      <AppHeader
        title="CAMPAIGN"
        subtitle="THE LAST ROAD"
        openSettings={openSettings}
        currency={save.economy.dawnTokens}
      />
      <div className="campaign-art" aria-hidden="true" />
      <div className="region-ribbon">{selected.region}</div>
      <div className="mission-track" aria-label="Campaign missions">
        <div className="rail-line" />
        {MISSIONS.map((item) => {
          const itemUnlocked = save.campaign.unlockedMissionIds.includes(item.id);
          const complete = save.campaign.completedMissionIds.includes(item.id);
          const medals = save.campaign.medalsByMission[item.id] || 0;
          return (
            <button
              key={item.id}
              className={[
                "mission-node",
                item.id % 3 === 0 ? "node-right" : item.id % 3 === 1 ? "node-left" : "",
                item.id === selectedMission ? "selected" : "",
                complete ? "complete" : "",
                item.boss ? "boss" : "",
              ].join(" ")}
              disabled={!itemUnlocked}
              onClick={() => setSelectedMission(item.id)}
              aria-label={`${item.id}. ${item.title}${itemUnlocked ? "" : ", locked"}`}
            >
              <b>{itemUnlocked ? item.id : "⌑"}</b>
              <span>{complete ? "✦".repeat(medals) : item.boss ? "BOSS" : ""}</span>
            </button>
          );
        })}
      </div>
      <article className="mission-sheet">
        <div className="mission-sheet-top">
          <span className="mission-number">{String(selected.id).padStart(2, "0")}</span>
          <div>
            <p>{selected.region}</p>
            <h3>{selected.title}</h3>
          </div>
          <span className="round-chip">{selected.rounds} ROUNDS</span>
        </div>
        <div className="mission-details">
          <div>
            <span>WORK CONTRACT</span>
            <b>{selected.contract}</b>
          </div>
          <div>
            <span>THREAT</span>
            <b>{selected.enemyLesson}</b>
          </div>
          <div>
            <span>FIRST CLEAR</span>
            <b>{selected.reward}</b>
          </div>
        </div>
        <div className="difficulty-row">
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option value="story">Story</option>
            <option value="standard">Standard</option>
            <option value="wayfinder" disabled={!save.campaign.completedMissionIds.includes(selected.id)}>
              Wayfinder
            </option>
          </select>
        </div>
        <button
          className="primary-button"
          disabled={!unlocked}
          onClick={() => startMission(selected.id)}
        >
          {unlocked ? "BEGIN EXPEDITION" : "ROAD LOCKED"}
        </button>
      </article>
    </section>
  );
}

function CrewScreen({
  crewFilter,
  setCrewFilter,
  filteredCrew,
  openSettings,
}: {
  crewFilter: string;
  setCrewFilter: (value: string) => void;
  filteredCrew: typeof CHARACTERS;
  openSettings: () => void;
}) {
  return (
    <section className="screen crew-screen">
      <AppHeader title="CREW" subtitle="ROUTE DECK" openSettings={openSettings} />
      <div className="crew-portrait-strip">
        <div>
          <p>Eight souls. Two lives each.</p>
          <h3>Work in the light.<br />Transform in the dark.</h3>
        </div>
      </div>
      <div className="filter-row" aria-label="Filter crew">
        {["All", "Forge", "Grove", "Veil", "Hearth"].map((filter) => (
          <button
            key={filter}
            className={crewFilter === filter ? "active" : ""}
            onClick={() => setCrewFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="crew-grid">
        {filteredCrew.map((character) => (
          <article
            className="crew-card"
            key={character.id}
            style={{ "--character-color": character.color } as React.CSSProperties}
          >
            <div className="crew-icon">
              <HeroRender id={character.id} />
            </div>
            <div className="crew-card-copy">
              <p>{character.guild} · {character.role}</p>
              <h3>{character.name}</h3>
              <span>{character.work}</span>
              <div className="form-route">
                <b>{character.formA}</b>
                <b>{character.formB}</b>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkshopScreen({
  save,
  tab,
  setTab,
  guarantees,
  purchasePack,
  packBusy,
  openSettings,
}: {
  save: EmberlineSaveV4;
  tab: "cosmetics" | "blueprints";
  setTab: (value: "cosmetics" | "blueprints") => void;
  guarantees: ReturnType<typeof guaranteeRemaining>;
  purchasePack: () => void;
  packBusy: boolean;
  openSettings: () => void;
}) {
  const offers = RELIC_CATALOG.filter((item) =>
    ["uncommon", "rare", "epic"].includes(item.rarity),
  ).slice(0, 3);
  return (
    <section className="screen workshop-screen">
      <AppHeader
        title="LANTERN WORKSHOP"
        subtitle="INSIDE THE CARAVAN"
        openSettings={openSettings}
        currency={save.economy.dawnTokens}
      />
      <div className="workshop-art" aria-hidden="true" />
      <div className="workshop-tabs">
        <button className={tab === "cosmetics" ? "active" : ""} onClick={() => setTab("cosmetics")}>
          COSMETICS
        </button>
        <button className={tab === "blueprints" ? "active" : ""} onClick={() => setTab("blueprints")}>
          BLUEPRINTS
        </button>
      </div>
      {tab === "cosmetics" ? (
        <>
          <article className="hearth-pack-card">
            <div className="pack-object" aria-hidden="true">
              <div className="pack-straps" />
              <span>✦</span>
            </div>
            <div className="pack-copy">
              <p>ONE COSMETIC RELIC</p>
              <h3>HEARTH PACK</h3>
              <span>Earned currency only · no paid combat advantage</span>
              <div className="guarantee-meters">
                <b>RARE+ IN {guarantees.rare}</b>
                <b>EPIC+ IN {guarantees.epic}</b>
                <b>LEGENDARY+ IN {guarantees.legendary}</b>
              </div>
              <button
                className="primary-button pack-buy"
                onClick={purchasePack}
                disabled={packBusy || save.economy.dawnTokens < 650}
              >
                {packBusy ? "SEALING REWARD…" : "OPEN · ◉ 650"}
              </button>
            </div>
          </article>
          <div className="offer-heading">
            <span>DIRECT OFFERS</span>
            <small>Owned items are never charged again</small>
          </div>
          <div className="offer-grid">
            {offers.map((offer, index) => {
              const meta = RARITY_META[offer.rarity];
              const owned = save.collection.ownedCosmeticIds.includes(offer.id);
              return (
                <article key={offer.id} style={{ "--rarity": meta.color } as React.CSSProperties}>
                  <span className="offer-symbol">{meta.symbol}</span>
                  <small>{meta.label}</small>
                  <h4>{offer.name}</h4>
                  <p>{offer.category}</p>
                  <button disabled={owned}>
                    {owned ? "OWNED" : `◉ ${[900, 2800, 9000][index].toLocaleString()}`}
                  </button>
                </article>
              );
            })}
          </div>
          <article className="odds-panel">
            <div>
              <h3>PUBLISHED ODDS</h3>
              <span>Exactly one Relic per Pack</span>
            </div>
            {Object.entries(HEARTH_PACK_ODDS).map(([rarity, odds]) => {
              const meta = RARITY_META[rarity as Rarity];
              return (
                <div className="odds-row" key={rarity}>
                  <span style={{ color: meta.color }}>{meta.symbol} {meta.label}</span>
                  <div><i style={{ width: `${Math.max(2, odds * 100)}%`, background: meta.color }} /></div>
                  <b>{(odds * 100).toFixed(2)}%</b>
                </div>
              );
            })}
            <p>Duplicate protection selects an unowned item when available. A complete tier converts duplicates to exact Emberdust.</p>
          </article>
        </>
      ) : (
        <article className="blueprint-panel">
          <div className="ink-balance">✒ {save.economy.blueprintInk} Blueprint Ink</div>
          <h3>Deterministic crew progression</h3>
          <p>Power cards are direct offers. They never appear in a paid or random pack.</p>
          {CHARACTERS.slice(0, 5).map((character, index) => (
            <div className="blueprint-offer" key={character.id}>
              <span>{character.icon}</span>
              <div><b>{character.name}</b><small>{index + 2} / 5 copies · next: story frame</small></div>
              <button>✒ {6 + index * 2}</button>
            </div>
          ))}
        </article>
      )}
    </section>
  );
}

function CollectionScreen({
  save,
  openSettings,
}: {
  save: EmberlineSaveV4;
  openSettings: () => void;
}) {
  const medals = Object.values(save.campaign.medalsByMission).reduce(
    (sum, value) => sum + value,
    0,
  );
  return (
    <section className="screen collection-screen">
      <AppHeader title="COLLECTION" subtitle="THE LANTERN ARCHIVE" openSettings={openSettings} />
      <article className="mythic-quest">
        <div className="mythic-art" aria-hidden="true" />
        <div className="mythic-copy">
          <p>MYTHIC VISUAL FORM</p>
          <h3>Dawnweaver Mira</h3>
          <span>A difficult path. Never an invisible lottery.</span>
          <div className="quest-line"><b>Campaign medals</b><span>{medals} / 72</span></div>
          <div className="quest-line"><b>Mira character quest</b><span>0 / 1</span></div>
          <div className="quest-line"><b>Elite Sigil objectives</b><span>0 / 3</span></div>
        </div>
      </article>
      <div className="collection-summary">
        <div><b>{save.collection.ownedCosmeticIds.length}</b><span>Relics owned</span></div>
        <div><b>{save.economy.emberdust}</b><span>Emberdust</span></div>
        <div><b>{save.packs.totalOpened}</b><span>Packs opened</span></div>
      </div>
      <h3 className="section-title">RELIC SHELF</h3>
      <div className="relic-grid">
        {RELIC_CATALOG.map((relic) => {
          const meta = RARITY_META[relic.rarity];
          const owned = save.collection.ownedCosmeticIds.includes(relic.id);
          return (
            <article
              key={relic.id}
              className={owned ? "owned" : "unowned"}
              style={{ "--rarity": meta.color } as React.CSSProperties}
            >
              <span>{owned ? meta.symbol : "?"}</span>
              <b>{owned ? relic.name : "Undiscovered"}</b>
              <small>{meta.label} · {relic.category}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ExpeditionScreen({
  expedition,
  mission,
  progress,
  workStep,
  phaseDuration,
  deployCharacter,
  buyCard,
  mergeCharacter,
  rerollShop,
  openForge,
  beginWork,
  nextRound,
  retryMission,
  setExpedition,
  returnToCampaign,
  openSettings,
}: {
  expedition: ExpeditionState;
  mission: (typeof MISSIONS)[number];
  progress: number;
  workStep: string;
  phaseDuration: number;
  deployCharacter: (cell: number, id?: string) => void;
  buyCard: (id: string) => void;
  mergeCharacter: (id: string) => void;
  rerollShop: () => void;
  openForge: () => void;
  beginWork: () => void;
  nextRound: () => void;
  retryMission: () => void;
  setExpedition: React.Dispatch<React.SetStateAction<ExpeditionState | null>>;
  returnToCampaign: () => void;
  openSettings: () => void;
}) {
  const [threeReady, setThreeReady] = useState(false);
  const handleThreeReady = useCallback(() => setThreeReady(true), []);
  const tutorialPlacement =
    expedition.missionId === 1 &&
    expedition.round === 1 &&
    Object.keys(expedition.board).length === 0;
  const tutorialMerge =
    expedition.missionId === 1 &&
    expedition.round === 1 &&
    !tutorialPlacement &&
    (expedition.starByCharacter.mira || 1) < 2;
  const previewWave = createCombatWave({
    missionId: expedition.missionId,
    round: expedition.round,
    difficulty: expedition.difficulty,
    dusk: expedition.dusk,
  });
  const displayedWave = expedition.combat ?? previewWave;
  const waveRoster = [
    ...displayedWave.enemies.map((enemy) => ({
      kind: enemy.kind,
      lane: enemy.lane,
    })),
    ...displayedWave.pending.map((enemy) => ({
      kind: enemy.kind,
      lane: enemy.lane,
    })),
  ];
  const threatCounts = waveRoster.reduce<Partial<Record<keyof typeof ENEMIES, number>>>(
    (counts, enemy) => ({
      ...counts,
      [enemy.kind]: (counts[enemy.kind] || 0) + 1,
    }),
    {},
  );
  const activeLanes = Array.from(
    new Set(waveRoster.map((enemy) => enemy.lane)),
  ).sort();
  const coverage = laneCoverage(
    expedition.board,
    expedition.starByCharacter,
  );
  const uncoveredLane = activeLanes.find((lane) => !coverage[lane]);
  const counterWarning =
    Object.keys(expedition.board).length === 0
      ? "No crew is deployed. Open the Forge and cover the forecast lanes."
      : uncoveredLane !== undefined
        ? `Lane ${uncoveredLane + 1} has no unit in attack range. Reposition before Work.`
        : displayedWave.totalThreat >= 18 &&
            Object.keys(expedition.board).length < 2
          ? "This wave can overwhelm one defender. Add a second Echo or merge."
          : "All forecast lanes are covered. Merges will improve kill speed.";
  const phaseLabel = {
    forecast: "FORECAST",
    forge: "FORGE",
    work: "WORK",
    nightfall: "NIGHTFALL",
    camp: "CAMP",
    results: "RESULTS",
    defeat: "DEFEAT",
  }[expedition.phase];
  const gradeNow = contractGrade(Math.min(1, progress));
  const phasePercent = Math.max(
    0,
    Math.min(100, (1 - expedition.phaseRemaining / phaseDuration) * 100),
  );
  const earnedMedals =
    1 +
    (expedition.lastGrade === "gold" ? 1 : 0) +
    (expedition.hearts === 5 ? 1 : 0);
  const liveAttackCues =
    expedition.phase === "nightfall" && expedition.combat
      ? combatAttackCues(expedition.combat, expedition.board).flatMap((cue) => {
          const target = expedition.combat?.enemies.find(
            (enemy) => enemy.id === cue.targetId,
          );
          const character = CHARACTERS.find(
            (item) => item.id === cue.characterId,
          );
          if (!target || !character) return [];
          const from = boardFigurePosition(cue.cell);
          const to = {
            x: [17, 50, 83][target.lane],
            y: 12 + target.progress * 66,
          };
          return [
            {
              ...cue,
              character,
              target,
              from,
              to,
              angle: Math.atan2(to.y - from.y, to.x - from.x),
            },
          ];
        })
      : [];
  const attackedEnemyIds = new Set(
    liveAttackCues.map((cue) => cue.targetId),
  );

  return (
    <section className={`screen expedition-screen phase-${expedition.phase} ${expedition.paused ? "combat-paused" : ""} ${threeReady ? "three-miniatures-ready" : ""}`}>
      <header className="game-hud">
        <div>
          <small>ROUND {expedition.round} / {mission.rounds}</small>
          <h2>{phaseLabel}</h2>
        </div>
        <div className="hud-status">
          <span aria-label={`${expedition.hearts} Beacon Hearts`}>♥ {expedition.hearts}</span>
          <span aria-label={`${expedition.dusk} Dusk`}>☾ {expedition.dusk}</span>
          {["work", "nightfall"].includes(expedition.phase) && (
            <b>{Math.max(0, expedition.phaseRemaining)}s</b>
          )}
        </div>
        <button className="icon-button" onClick={openSettings} aria-label="Open settings">⚙</button>
      </header>

      <div className="threat-strip">
        <span>THREAT {displayedWave.totalThreat}</span>
        {Object.entries(threatCounts).map(([kind, count]) => {
          const enemy = ENEMIES[kind as keyof typeof ENEMIES];
          return (
            <div key={kind}>
              <EnemyRender id={kind} className="threat-enemy-art" />
              <span>{enemy.name}<small>×{count}</small></span>
            </div>
          );
        })}
        <b>LANES {activeLanes.map((lane) => lane + 1).join(" · ")}</b>
      </div>

      {expedition.phase === "forecast" && (
        <article className="forecast-card">
          <p>NEXT WORK CONTRACT</p>
          <h3>{mission.contract}</h3>
          <div className="forecast-route">
            <span>1</span><i /><span>2</span><i /><span>3</span>
          </div>
          <div className="forecast-columns">
            <div>
              <small>DAY</small>
              <b>{mission.contract}</b>
              <span>18 seconds · Missed contract adds 1 Dusk</span>
            </div>
            <div>
              <small>NIGHT</small>
              <b>{displayedWave.totalEnemies} monsters · threat {displayedWave.totalThreat}</b>
              <span>Every escape removes 1–2 Beacon Hearts</span>
            </div>
          </div>
          <div className="counter-warning">⚠ {counterWarning}</div>
          <button className="primary-button" onClick={openForge}>OPEN THE FORGE</button>
        </article>
      )}

      <div className="board-wrap">
        <div className="lane lane-one"><span>1</span></div>
        <div className="lane lane-two"><span>2</span></div>
        <div className="lane lane-three"><span>3</span></div>
        <BattlefieldMiniatures3D
          board={expedition.board}
          starByCharacter={expedition.starByCharacter}
          combat={expedition.combat}
          phase={expedition.phase}
          paused={expedition.paused}
          selectedCharacterId={expedition.selectedCharacterId}
          onReady={handleThreeReady}
        />
        {expedition.phase === "forge" &&
          Object.keys(expedition.board).length > 0 && (
            <div className="move-hint" role="status">
              ↔ TAP A FIGURE, THEN TAP A HEX · OR DRAG IT
            </div>
          )}
        {expedition.phase === "nightfall" && expedition.combat && (
          <div className="combat-enemies" aria-label="Duskborn monsters advancing across the board">
            {expedition.combat.enemies.map((enemy) => {
              const definition = ENEMIES[enemy.kind];
              const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
              const takingHit = attackedEnemyIds.has(enemy.id);
              return (
              <span
                key={enemy.id}
                className={`combat-enemy enemy-${enemy.kind} ${takingHit ? "targeted" : ""} ${enemy.marked ? "marked" : ""} ${enemy.slowed ? "slowed" : ""}`}
                style={
                  {
                    "--enemy-lane": `${[17, 50, 83][enemy.lane]}%`,
                    "--enemy-top": `${12 + enemy.progress * 66}%`,
                  } as React.CSSProperties
                }
                aria-label={`${definition.name}, ${Math.ceil(enemy.hp)} health, Lane ${enemy.lane + 1}`}
              >
                <EnemyRender
                  key={`${enemy.id}-${takingHit ? expedition.combat?.tick : "idle"}`}
                  id={enemy.kind}
                  className={`combat-enemy-art ${takingHit ? "taking-hit" : ""}`}
                />
                <i><em style={{ width: `${hpPercent}%` }} /></i>
                <small>{definition.name}</small>
              </span>
              );
            })}
            <div className="combat-readout" role="status">
              <b>{expedition.combat.pending.length + expedition.combat.enemies.length} REMAIN</b>
              <span>{expedition.combat.kills} defeated · {expedition.combat.escaped} escaped</span>
              <small>{expedition.combat.lastEvent}</small>
            </div>
          </div>
        )}
        {expedition.phase === "nightfall" && expedition.combat && (
          <div className="combat-effects" aria-hidden="true">
            {liveAttackCues.map((cue, index) => (
              <span
                key={`${expedition.combat?.tick}-${cue.cell}-${cue.targetId}`}
                className={`combat-projectile projectile-${cue.character.id}`}
                style={
                  {
                    "--from-x": `${cue.from.x}%`,
                    "--from-y": `${cue.from.y}%`,
                    "--to-x": `${cue.to.x}%`,
                    "--to-y": `${cue.to.y}%`,
                    "--shot-angle": `${cue.angle}rad`,
                    "--fx-color": cue.character.color,
                    "--shot-delay": `${index * 0.06}s`,
                  } as React.CSSProperties
                }
              >
                <i>{ATTACK_SYMBOLS[cue.character.id] || "✦"}</i>
                <b />
              </span>
            ))}
            {expedition.combat.lastEvent.includes("Heart") && (
              <span
                key={`beacon-${expedition.combat.tick}`}
                className="caravan-impact"
              >
                BEACON HIT
              </span>
            )}
          </div>
        )}
        <div className="hex-board" data-testid="hex-board">
          {Array.from({ length: 35 }, (_, index) => {
            const occupant = expedition.board[index];
            const character = CHARACTERS.find((item) => item.id === occupant);
            const special =
              index === 10 ? "pylon" : index === 17 ? "crystal" : index === 31 ? "caravan" : "";
            const target = tutorialPlacement && index === TUTORIAL_TARGET;
            const selectedUnit =
              Boolean(occupant) &&
              expedition.selectedCharacterId === occupant;
            const moveTarget =
              expedition.phase === "forge" &&
              Boolean(expedition.selectedCharacterId) &&
              !occupant;
            return (
              <button
                key={index}
                className={[
                  "hex-cell",
                  special,
                  target ? "tutorial-target" : "",
                  occupant ? "occupied" : "",
                  selectedUnit ? "selected-hex" : "",
                  moveTarget ? "move-target" : "",
                ].join(" ")}
                onClick={() => {
                  if (character && expedition.phase === "forge") {
                    setExpedition({
                      ...expedition,
                      selectedCharacterId: character.id,
                    });
                    return;
                  }
                  deployCharacter(index);
                }}
                draggable={Boolean(character) && expedition.phase === "forge"}
                onDragStart={(event) => {
                  if (!character || expedition.phase !== "forge") {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/character", character.id);
                  setExpedition({
                    ...expedition,
                    selectedCharacterId: character.id,
                  });
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  deployCharacter(index, event.dataTransfer.getData("text/character"));
                }}
                aria-label={
                  character
                    ? `${character.name} on hex ${index + 1}`
                    : special
                      ? `${special} on hex ${index + 1}`
                      : target
                        ? "Highlighted hex beside the pylon"
                        : `Empty hex ${index + 1}`
                }
              >
                {special === "pylon" && <span className="site-token">⌁<small>PYLON</small></span>}
                {special === "crystal" && <span className="site-token crystal-token">♦</span>}
                {special === "caravan" && <span className="site-token caravan-token">▰<small>CARAVAN</small></span>}
                {character && (
                  <span
                    className={`unit-token fighter-${character.id} ${selectedUnit ? "selected-unit" : ""} ${expedition.phase === "nightfall" ? "unit-fighting" : ""} ${expedition.phase === "work" ? "unit-working" : ""} star-${expedition.starByCharacter[character.id] || 1}`}
                    style={
                      {
                        "--unit-color": character.color,
                        "--idle-delay": `${-index * 0.09}s`,
                      } as React.CSSProperties
                    }
                  >
                    <i className="unit-shadow" />
                    <HeroRender id={character.id} className="unit-hero-art" />
                    {expedition.phase === "work" && <i className="work-sparks">✦</i>}
                    <b className="unit-rank">{expedition.starByCharacter[character.id] || 1}★</b>
                    <small>{character.shortName}</small>
                  </span>
                )}
                {target && <span className="tap-indicator">↓</span>}
              </button>
            );
          })}
        </div>
        {expedition.phase === "work" && (
          <div className="work-route" style={{ "--work-progress": progress } as React.CSSProperties}>
            <span className="parcel">◆</span>
            <div>
              <b>{workStep} · {Math.round(progress * 100)}% · {gradeNow.toUpperCase()}</b>
              <small>Visible work output becomes tonight&apos;s defenses</small>
            </div>
          </div>
        )}
      </div>

      {tutorialPlacement && (
        <div className="tutorial-callout" role="status">
          <span>1 / 6</span>
          <div><b>Place Mira beside the pylon.</b><small>The same placement must survive Nightfall.</small></div>
        </div>
      )}

      {tutorialMerge && expedition.phase === "forge" && (
        <div className="tutorial-callout tutorial-merge" role="status">
          <span>2 / 6</span>
          <div>
            <b>Forge Mira into a 2★ Specialist.</b>
            <small>Buy her third Echo below, then tap MERGE READY. Her lightning gains ×1.8 power.</small>
          </div>
        </div>
      )}

      {expedition.phase === "forge" && !tutorialPlacement && (
        <div className="forge-action-row">
          <button onClick={beginWork} className="primary-button" disabled={tutorialMerge}>
            {tutorialMerge ? "MERGE MIRA TO CONTINUE" : "BEGIN WORK · 18s"}
          </button>
        </div>
      )}

      {["work", "nightfall"].includes(expedition.phase) && (
        <div className={`phase-controls ${expedition.phase === "work" ? "work-controls" : ""}`}>
          <button onClick={() => setExpedition({ ...expedition, paused: !expedition.paused })}>
            {expedition.paused ? "▶ RESUME" : "Ⅱ PAUSE"}
          </button>
          {expedition.phase === "nightfall" && (
            <button
              onClick={() => {
                const next = expedition.speed === 1 ? 2 : expedition.speed === 2 ? 4 : 1;
                setExpedition({ ...expedition, speed: next });
              }}
            >
              {expedition.speed}× SPEED
            </button>
          )}
          <div className="battle-stat">
            {expedition.phase === "work" ? (
              <><b>{Math.round(progress * 100)}%</b><small>{gradeNow} contract</small></>
            ) : (
              <><b>{expedition.combat?.kills || 0}</b><small>monsters defeated</small></>
            )}
          </div>
          <div className="phase-progress"><i style={{ width: `${phasePercent}%` }} /></div>
        </div>
      )}

      {expedition.phase === "forge" && (
        <div className="forge-tray">
          <button className="reroll" onClick={rerollShop} disabled={expedition.bolts < expedition.rerollCost}>
            ↻<small>REROLL · {expedition.rerollCost}</small>
          </button>
          <div className="shop-cards">
            {expedition.shop.map((characterId, index) => {
              const character = CHARACTERS.find((item) => item.id === characterId)!;
              const count = expedition.cardCounts[characterId] || 0;
              const star = expedition.starByCharacter[characterId] || 0;
              const cost = mergeCostForStar(star || 1);
              const mergeReady = Number.isFinite(cost) && count >= cost;
              return (
                <article
                  key={`${characterId}-${index}`}
                  className={expedition.selectedCharacterId === characterId ? "selected" : ""}
                  draggable={star > 0}
                  onDragStart={(event) => {
                    if (!star) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.setData("text/character", characterId);
                  }}
                  style={{ "--unit-color": character.color } as React.CSSProperties}
                >
                  <button
                    className="shop-select"
                    disabled={!star}
                    onClick={() => setExpedition({ ...expedition, selectedCharacterId: characterId })}
                  >
                    <HeroRender id={character.id} className="shop-hero-art" />
                    <b>{character.shortName}</b>
                    <small>
                      {star
                        ? `${star}★ · ${star >= 2 ? character.specialistTrigger : character.combatTrigger}`
                        : "Buy to unlock Echo"}
                    </small>
                  </button>
                  <button
                    className="buy-card"
                    onClick={() => buyCard(characterId)}
                    disabled={expedition.bolts < 2 || star >= 3}
                  >
                    ◉ 2 · {star >= 3 ? "FORM" : `${count}/${cost}`}
                  </button>
                  {mergeReady && (
                    <button className="merge-card" onClick={() => mergeCharacter(characterId)}>MERGE READY</button>
                  )}
                </article>
              );
            })}
          </div>
          <div className="resource-row">
            <span>◉ {expedition.bolts} BOLTS</span>
            <span>✦ {expedition.sigils} SIGILS</span>
          </div>
        </div>
      )}

      {expedition.phase === "camp" && (
        <div className="camp-overlay">
          <article>
            <p>ROUND {expedition.round} SURVIVED</p>
            <h2>{expedition.lastBeaconDamage === 0 ? "PERFECT DEFENSE" : "THE LANTERN STILL HOLDS"}</h2>
            <div className="camp-grade"><span>{expedition.lastGrade.toUpperCase()}</span><b>✦ ✦ ✦</b></div>
            <div className="reward-list">
              <span><b>+{expedition.lastBoltReward}</b> Tactical Bolts</span>
              <span><b>+{expedition.lastRoundTokens}</b> Dawn Tokens</span>
              <span><b>{expedition.lastBeaconDamage}</b> Beacon damage</span>
            </div>
            <div className="battle-summary">
              <span>{expedition.lastKills} monsters defeated</span>
              <span>{expedition.hearts} / 5 Hearts remain</span>
              <span>Dusk {expedition.dusk} / 3</span>
            </div>
            <blockquote>
              {expedition.lastBeaconDamage === 0
                ? "“Every circuit remembers the light.”"
                : "“Patch the breach. The next wave will not wait.”"}{" "}
              <cite>— Mira</cite>
            </blockquote>
            <button className="primary-button" onClick={nextRound}>
              {expedition.round >= mission.rounds ? "COMPLETE EXPEDITION" : "PREPARE NEXT ROUND"}
            </button>
          </article>
        </div>
      )}

      {expedition.phase === "results" && (
        <div className="results-overlay">
          <article>
            <span className="result-sun">✦</span>
            <p>EXPEDITION COMPLETE</p>
            <h2>{mission.title}</h2>
            <div className="medals">
              {[0, 1, 2].map((medal) => (
                <b className={medal < earnedMedals ? "" : "medal-empty"} key={medal}>✦</b>
              ))}
            </div>
            <h3>Clear{earnedMedals > 1 ? " · Master Work" : ""}{earnedMedals > 2 ? " · Wayfinder" : ""}</h3>
            <span>You earned the clear. The next campaign node is now open.</span>
            <button className="primary-button" onClick={returnToCampaign}>RETURN TO CAMPAIGN</button>
          </article>
        </div>
      )}

      {expedition.phase === "defeat" && (
        <div className="defeat-overlay">
          <article>
            <span className="defeat-moon">☾</span>
            <p>EXPEDITION LOST · ROUND {expedition.round}</p>
            <h2>THE EMBERLINE WENT DARK</h2>
            <span>{expedition.defeatReason}</span>
            <div className="defeat-stats">
              <b>♥ {expedition.hearts} Hearts</b>
              <b>☾ {expedition.dusk} Dusk</b>
              <b>{expedition.lastKills} defeated</b>
            </div>
            <button className="primary-button" onClick={retryMission}>RETRY EXPEDITION</button>
            <button className="secondary-button" onClick={returnToCampaign}>RETURN TO CAMPAIGN</button>
          </article>
        </div>
      )}
    </section>
  );
}

function BottomNav({
  screen,
  setScreen,
  workshopUnlocked,
  onLocked,
}: {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  workshopUnlocked: boolean;
  onLocked: () => void;
}) {
  const items: Array<[AppScreen, string, string]> = [
    ["campaign", "⌁", "Campaign"],
    ["crew", "♟", "Crew"],
    ["workshop", "✦", "Workshop"],
    ["collection", "▤", "Collection"],
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(([target, icon, label]) => {
        const locked = target === "workshop" && !workshopUnlocked;
        return (
          <button
            key={target}
            className={screen === target ? "active" : ""}
            onClick={() => (locked ? onLocked() : setScreen(target))}
            aria-label={`${label}${locked ? ", unlocks after mission 3" : ""}`}
          >
            <span>{locked ? "⌑" : icon}</span>
            <b>{label}</b>
          </button>
        );
      })}
    </nav>
  );
}

function SettingsPanel({
  save,
  setSave,
  close,
  resetJourney,
}: {
  save: EmberlineSaveV4;
  setSave: React.Dispatch<React.SetStateAction<EmberlineSaveV4>>;
  close: () => void;
  resetJourney: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
        <button className="modal-close" onClick={close} aria-label="Close settings">×</button>
        <p>CARAVAN OPTIONS</p>
        <h2>SETTINGS</h2>
        <label>
          <span><b>Reduced motion</b><small>Collapses reveals and large movement.</small></span>
          <input
            type="checkbox"
            checked={save.settings.reducedMotion}
            onChange={(event) =>
              setSave({
                ...save,
                settings: { ...save.settings, reducedMotion: event.target.checked },
              })
            }
          />
        </label>
        <label>
          <span><b>High contrast</b><small>Adds stronger borders and patterns.</small></span>
          <input
            type="checkbox"
            checked={save.settings.highContrast}
            onChange={(event) =>
              setSave({
                ...save,
                settings: { ...save.settings, highContrast: event.target.checked },
              })
            }
          />
        </label>
        <label>
          <span><b>Haptics</b><small>Optional feedback for merges and warnings.</small></span>
          <input
            type="checkbox"
            checked={save.settings.haptics}
            onChange={(event) =>
              setSave({
                ...save,
                settings: { ...save.settings, haptics: event.target.checked },
              })
            }
          />
        </label>
        <div className="settings-audio">
          <span>Music</span><input type="range" defaultValue="70" aria-label="Music volume" />
          <span>SFX</span><input type="range" defaultValue="85" aria-label="Sound effects volume" />
        </div>
        <button className="reset-button" onClick={resetJourney}>RESET LOCAL JOURNEY</button>
      </section>
    </div>
  );
}

function PackRevealModal({
  reveal,
  reducedMotion,
  close,
  equip,
}: {
  reveal: PackReveal;
  reducedMotion: boolean;
  close: () => void;
  equip: () => void;
}) {
  const meta = RARITY_META[reveal.rarity];
  return (
    <div className={`modal-backdrop pack-reveal ${reducedMotion ? "reduced" : ""}`}>
      <section
        className="reveal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${meta.label} relic revealed`}
        style={{ "--rarity": meta.color } as React.CSSProperties}
      >
        <div className="reveal-rays" aria-hidden="true" />
        <p>{reveal.guarantee ? `${reveal.guarantee.toUpperCase()}+ GUARANTEE` : "COSMETIC RELIC"}</p>
        <span className="reveal-symbol">{meta.symbol}</span>
        <small>{meta.label.toUpperCase()}</small>
        <h2>{reveal.reward.name}</h2>
        <b>{reveal.reward.category}</b>
        {reveal.duplicate && <div className="duplicate-note">DUPLICATE · +{reveal.emberdust} EMBERDUST</div>}
        <div className="reveal-actions">
          <button onClick={close}>CONTINUE</button>
          <button className="primary-button" onClick={equip}>EQUIP</button>
        </div>
      </section>
    </div>
  );
}
