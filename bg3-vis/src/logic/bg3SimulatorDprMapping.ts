import type { DprRound } from "../components/DataCircle/dataCircleInteraction";

type BuildLike = {
  selectedClass?: string;
  selectedLevel?: number;
};

type UnknownRecord = Record<string, unknown>;

type NormalizedRound = DprRound & {
  round: number;
  label: string;
  damage: number;
  actions?: Array<{
    name: string;
    damage: number;
    raw?: unknown;
  }>;
  raw?: unknown;
};

const DEFAULT_BUILD_SUFFIX = "Level12_StdEquip (gorKjan.5019)";

const STANDARD_BUILD_NAME_BY_CLASS: Record<string, string> = {
  Barbarian: `BG3_Barbarian_${DEFAULT_BUILD_SUFFIX}`,
  Bard: `BG3_Bard_${DEFAULT_BUILD_SUFFIX}`,
  Cleric: `BG3_Cleric_${DEFAULT_BUILD_SUFFIX}`,
  Druid: `BG3_Druid_${DEFAULT_BUILD_SUFFIX}`,
  Fighter: `BG3_Fighter_${DEFAULT_BUILD_SUFFIX}`,
  Monk: `BG3_Monk_${DEFAULT_BUILD_SUFFIX}`,
  Paladin: `BG3_Paladin_${DEFAULT_BUILD_SUFFIX}`,
  Ranger: `BG3_Ranger_${DEFAULT_BUILD_SUFFIX}`,
  Rogue: `BG3_Rogue_${DEFAULT_BUILD_SUFFIX}`,
  Sorcerer: `BG3_Sorcerer_${DEFAULT_BUILD_SUFFIX}`,
  Warlock: `BG3_Warlock_${DEFAULT_BUILD_SUFFIX}`,
  Wizard: `BG3_Wizard_${DEFAULT_BUILD_SUFFIX}`,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function roundNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getFirstNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = readNumber(record[key]);
    if (value !== null) return value;
  }

  return null;
}

function getFirstString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) return value;
  }

  return null;
}

function getRoundNumber(record: UnknownRecord, fallback: number): number {
  const direct = getFirstNumber(record, [
    "round",
    "roundNumber",
    "round_number",
    "turn",
    "turnNumber",
    "turn_number",
  ]);

  if (direct !== null) return Math.max(1, Math.round(direct));

  return fallback;
}

function getDamageValue(record: UnknownRecord): number {
  const direct = getFirstNumber(record, [
    "damage",
    "totalDamage",
    "total_damage",
    "expectedDamage",
    "expected_damage",
    "damageDone",
    "damage_done",
    "amount",
    "value",
    "mean",
    "avg",
    "average",
  ]);

  if (direct !== null) return Math.max(0, direct);

  const distribution = record.distribution;

  if (isRecord(distribution)) {
    const expected = getFirstNumber(distribution, [
      "mean",
      "avg",
      "average",
      "expected",
      "expectedValue",
      "expected_value",
    ]);

    if (expected !== null) return Math.max(0, expected);
  }

  return 0;
}

function getActionName(record: UnknownRecord, fallback: string): string {
  return (
    getFirstString(record, [
      "skill",
      "skillName",
      "skill_name",
      "action",
      "actionName",
      "action_name",
      "name",
      "source",
      "sourceSkill",
      "source_skill",
    ]) ?? fallback
  );
}

function getArray(record: UnknownRecord, keys: string[]): unknown[] | null {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) return value;
  }

  return null;
}

function collectNestedArrays(
  value: unknown,
  candidateKeys: string[],
  depth = 0
): unknown[] {
  if (depth > 5) return [];

  if (Array.isArray(value)) return value;

  if (!isRecord(value)) return [];

  for (const key of candidateKeys) {
    const nested = value[key];

    if (Array.isArray(nested)) return nested;

    const nestedResult = collectNestedArrays(nested, candidateKeys, depth + 1);
    if (nestedResult.length > 0) return nestedResult;
  }

  return [];
}

function normalizeRoundObject(
  value: unknown,
  fallbackRound: number
): NormalizedRound | null {
  if (!isRecord(value)) return null;

  const actions =
    getArray(value, ["actions", "skills", "events", "history", "rotation"]) ??
    [];

  const normalizedActions: Array<{
    name: string;
    damage: number;
    raw: UnknownRecord;
  }> = [];

  actions.forEach((action, index) => {
    if (!isRecord(action)) return;

    normalizedActions.push({
      name: getActionName(action, `Action ${index + 1}`),
      damage: roundNumber(getDamageValue(action)),
      raw: action,
    });
  });

  const directDamage = getDamageValue(value);
  const actionDamage = normalizedActions.reduce(
    (sum, action) => sum + action.damage,
    0
  );

  const round = getRoundNumber(value, fallbackRound);
  const damage = roundNumber(directDamage > 0 ? directDamage : actionDamage);

  return {
    round,
    label: `Round ${round}`,
    damage,
    actions: normalizedActions,
    raw: value,
  } as NormalizedRound;
}

function groupEventsByRound(events: unknown[]): NormalizedRound[] {
  const grouped = new Map<
    number,
    Array<{
      name: string;
      damage: number;
      raw: unknown;
    }>
  >();

  events.forEach((event, index) => {
    if (!isRecord(event)) return;

    const damage = getDamageValue(event);
    const round = getRoundNumber(event, 1);
    const name = getActionName(event, `Event ${index + 1}`);

    if (!grouped.has(round)) {
      grouped.set(round, []);
    }

    grouped.get(round)?.push({
      name,
      damage: roundNumber(damage),
      raw: event,
    });
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, actions]) => {
      const damage = roundNumber(
        actions.reduce((sum, action) => sum + action.damage, 0)
      );

      return {
        round,
        label: `Round ${round}`,
        damage,
        actions,
        raw: actions.map((action) => action.raw),
      } as NormalizedRound;
    });
}

function getCandidateRoundArrays(response: unknown): unknown[][] {
  const candidates: unknown[][] = [];

  if (Array.isArray(response)) {
    candidates.push(response);
  }

  if (isRecord(response)) {
    const directRounds = getArray(response, [
      "rounds",
      "dprRounds",
      "dpr_rounds",
      "roundResults",
      "round_results",
      "turns",
      "turnResults",
      "turn_results",
    ]);

    if (directRounds) candidates.push(directRounds);

    const resultRounds = collectNestedArrays(response.result, [
      "rounds",
      "dprRounds",
      "roundResults",
      "turns",
    ]);

    if (resultRounds.length > 0) candidates.push(resultRounds);

    const dataRounds = collectNestedArrays(response.data, [
      "rounds",
      "dprRounds",
      "roundResults",
      "turns",
    ]);

    if (dataRounds.length > 0) candidates.push(dataRounds);
  }

  return candidates;
}

function getCandidateHistoryArrays(response: unknown): unknown[][] {
  const candidates: unknown[][] = [];

  if (isRecord(response)) {
    const directHistory = getArray(response, [
      "history",
      "events",
      "combatLog",
      "combat_log",
      "simulationHistory",
      "simulation_history",
    ]);

    if (directHistory) candidates.push(directHistory);

    const resultHistory = collectNestedArrays(response.result, [
      "history",
      "events",
      "combatLog",
      "simulationHistory",
    ]);

    if (resultHistory.length > 0) candidates.push(resultHistory);

    const dataHistory = collectNestedArrays(response.data, [
      "history",
      "events",
      "combatLog",
      "simulationHistory",
    ]);

    if (dataHistory.length > 0) candidates.push(dataHistory);
  }

  return candidates;
}

export function getSimulatorBuildNameForSnapshot(snapshot: BuildLike): string {
  const selectedClass = snapshot.selectedClass?.trim();

  if (!selectedClass) {
    throw new Error("Select a class before evaluating the build.");
  }

  const buildName = STANDARD_BUILD_NAME_BY_CLASS[selectedClass];

  if (!buildName) {
    throw new Error(
      `No standard simulator build is configured for class "${selectedClass}".`
    );
  }

  return buildName;
}

export function mapBg3SimulationToDprRounds(response: unknown): DprRound[] {
  const roundArrays = getCandidateRoundArrays(response);

  for (const candidate of roundArrays) {
    const rounds = candidate
      .map((round, index) => normalizeRoundObject(round, index + 1))
      .filter((round): round is NormalizedRound => round !== null)
      .filter((round) => round.damage > 0 || (round.actions?.length ?? 0) > 0)
      .sort((a, b) => a.round - b.round);

    if (rounds.length > 0) return rounds;
  }

  const historyArrays = getCandidateHistoryArrays(response);

  for (const candidate of historyArrays) {
    const rounds = groupEventsByRound(candidate).filter(
      (round) => round.damage > 0 || (round.actions?.length ?? 0) > 0
    );

    if (rounds.length > 0) return rounds;
  }

  if (isRecord(response)) {
    const totalDamage = getDamageValue(response);

    if (totalDamage > 0) {
      return [
        {
          round: 1,
          label: "Result",
          damage: roundNumber(totalDamage),
          raw: response,
        } as NormalizedRound,
      ];
    }
  }

  console.warn("Could not map BG3 simulator response to DPR rounds:", response);

  return [];
}

export function getAverageDpr(rounds: DprRound[]): number {
  if (rounds.length === 0) return 0;

  const totalDamage = rounds.reduce((sum, round) => {
    const damage =
      typeof round.damage === "number" && Number.isFinite(round.damage)
        ? round.damage
        : 0;

    return sum + damage;
  }, 0);

  return roundNumber(totalDamage / rounds.length);
}