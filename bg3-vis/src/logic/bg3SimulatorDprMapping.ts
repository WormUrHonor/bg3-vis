import type {
  BuildEditorSnapshot,
} from "../types/savedBuildTypes";
import type {
  DprContribution,
  DprRound,
} from "../components/DataCircle/dataCircleInteraction";

type UnknownRecord = Record<string, unknown>;

const STANDARD_BUILD_BY_CLASS: Partial<Record<string, string>> = {
  Barbarian: "BG3_Barbarian_Level12_StdEquip (gorKjan.5019)",
  Bard: "BG3_Bard_Level12_StdEquip (gorKjan.5019)",
  Cleric: "BG3_Cleric_Level12_StdEquip (gorKjan.5019)",
  Druid: "BG3_Druid_Level12_StdEquip (gorKjan.5019)",
  Fighter: "BG3_Fighter_Level12_StdEquip (gorKjan.5019)",
  Monk: "BG3_Monk_Level12_StdEquip (gorKjan.5019)",
  Paladin: "BG3_Paladin_Level12_StdEquip (gorKjan.5019)",
  Ranger: "BG3_Ranger_Level12_StdEquip (gorKjan.5019)",
  Rogue: "BG3_Rogue_Level12_StdEquip (gorKjan.5019)",
  Sorcerer: "BG3_Sorcerer_Level12_StdEquip (gorKjan.5019)",
  Warlock: "BG3_Warlock_Level12_StdEquip (gorKjan.5019)",
  Wizard: "BG3_Wizard_Level12_StdEquip (gorKjan.5019)",
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeDamage(value: unknown): number {
  const numeric = asNumber(value);

  if (numeric === undefined) return 0;

  // Johannes' BG3 data often stores damage as 1000-scaled values.
  // The mock DPR layer expects readable BG3 damage values.
  if (Math.abs(numeric) > 1000) return numeric / 1000;

  return numeric;
}

function slugifyAbilityId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRoundNumber(entry: UnknownRecord, fallbackIndex: number): number {
  return (
    asNumber(entry.round) ??
    asNumber(entry.round_index) ??
    asNumber(entry.roundIndex) ??
    asNumber(entry.turn) ??
    asNumber(entry.turn_index) ??
    fallbackIndex + 1
  );
}

function getSkillName(entry: UnknownRecord): string {
  return (
    asString(entry.skill) ??
    asString(entry.skill_key) ??
    asString(entry.skillKey) ??
    asString(entry.name) ??
    asString(entry.action) ??
    asString(entry.action_name) ??
    "Unknown action"
  );
}

function getSkillDamage(entry: UnknownRecord): number {
  return normalizeDamage(
    entry.damage ??
      entry.dmg ??
      entry.dmg_avg ??
      entry.dmg_heuristic ??
      entry.expected_damage ??
      entry.expectedDamage ??
      entry.total_damage ??
      entry.totalDamage
  );
}

function toContribution(entry: UnknownRecord): DprContribution {
  const abilityName = getSkillName(entry);
  const abilityId =
    asString(entry.abilityId) ??
    asString(entry.ability_id) ??
    asString(entry.skillID) ??
    asString(entry.skill_id) ??
    slugifyAbilityId(abilityName);

  return {
    abilityId,
    abilityName,
    damage: getSkillDamage(entry),
  };
}

function mergeContributions(contributions: DprContribution[]): DprContribution[] {
  const merged = new Map<string, DprContribution>();

  contributions.forEach((contribution) => {
    if (contribution.damage <= 0) return;

    const key = contribution.abilityId || contribution.abilityName;

    const previous = merged.get(key);

    if (!previous) {
      merged.set(key, contribution);
      return;
    }

    merged.set(key, {
      ...previous,
      damage: previous.damage + contribution.damage,
    });
  });

  return [...merged.values()]
    .sort((a, b) => b.damage - a.damage)
    .slice(0, 3);
}

function extractCandidateArrays(response: unknown): unknown[][] {
  if (Array.isArray(response)) return [response];

  if (!isRecord(response)) return [];

  const directKeys = [
    "history",
    "rotation",
    "actions",
    "events",
    "steps",
    "log",
    "timeline",
    "rounds",
  ];

  const arrays: unknown[][] = [];

  directKeys.forEach((key) => {
    const value = response[key];

    if (Array.isArray(value)) arrays.push(value);
  });

  Object.values(response).forEach((value) => {
    if (!isRecord(value)) return;

    directKeys.forEach((key) => {
      const nestedValue = value[key];

      if (Array.isArray(nestedValue)) arrays.push(nestedValue);
    });
  });

  return arrays;
}

function looksLikeActionEntry(value: unknown): value is UnknownRecord {
  if (!isRecord(value)) return false;

  return Boolean(
    value.skill ||
      value.skill_key ||
      value.skillKey ||
      value.action ||
      value.action_name ||
      value.damage ||
      value.dmg ||
      value.dmg_avg ||
      value.dmg_heuristic ||
      value.expected_damage ||
      value.expectedDamage
  );
}

function mapRoundObjects(roundObjects: UnknownRecord[]): DprRound[] {
  return roundObjects
    .map((roundObject, index) => {
      const round = getRoundNumber(roundObject, index);

      const nestedContributions =
        Array.isArray(roundObject.contributions)
          ? roundObject.contributions.filter(looksLikeActionEntry)
          : Array.isArray(roundObject.actions)
            ? roundObject.actions.filter(looksLikeActionEntry)
            : Array.isArray(roundObject.skills)
              ? roundObject.skills.filter(looksLikeActionEntry)
              : [];

      const contributions =
        nestedContributions.length > 0
          ? mergeContributions(nestedContributions.map(toContribution))
          : mergeContributions([toContribution(roundObject)]);

      const calculatedDamage = contributions.reduce(
        (sum, contribution) => sum + contribution.damage,
        0
      );

      const explicitDamage = normalizeDamage(
        roundObject.damage ??
          roundObject.total_damage ??
          roundObject.totalDamage ??
          roundObject.dmg ??
          roundObject.dmg_avg
      );

      return {
        round,
        damage: explicitDamage > 0 ? explicitDamage : calculatedDamage,
        contributions,
      };
    })
    .filter((round) => round.round > 0);
}

function mapActionHistory(actionEntries: UnknownRecord[]): DprRound[] {
  const grouped = new Map<number, DprContribution[]>();

  actionEntries.forEach((entry, index) => {
    const round = getRoundNumber(entry, index);

    if (!grouped.has(round)) grouped.set(round, []);

    grouped.get(round)?.push(toContribution(entry));
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, contributions]) => {
      const mergedContributions = mergeContributions(contributions);
      const damage = mergedContributions.reduce(
        (sum, contribution) => sum + contribution.damage,
        0
      );

      return {
        round,
        damage,
        contributions: mergedContributions,
      };
    });
}

export function mapBg3SimulationToDprRounds(response: unknown): DprRound[] {
  const candidateArrays = extractCandidateArrays(response);

  for (const candidate of candidateArrays) {
    const recordItems = candidate.filter(isRecord);

    if (recordItems.length === 0) continue;

    const roundLikeItems = recordItems.filter(
      (item) =>
        Array.isArray(item.contributions) ||
        Array.isArray(item.actions) ||
        Array.isArray(item.skills) ||
        item.round !== undefined ||
        item.round_index !== undefined ||
        item.roundIndex !== undefined
    );

    if (roundLikeItems.length > 0) {
      const rounds = mapRoundObjects(roundLikeItems);

      if (rounds.some((round) => round.damage > 0)) {
        return normalizeTenRounds(rounds);
      }
    }

    const actionEntries = recordItems.filter(looksLikeActionEntry);

    if (actionEntries.length > 0) {
      const rounds = mapActionHistory(actionEntries);

      if (rounds.some((round) => round.damage > 0)) {
        return normalizeTenRounds(rounds);
      }
    }
  }

  return normalizeTenRounds([]);
}
export function normalizeTenRounds(rounds: DprRound[]): DprRound[] {
  const byRound = new Map<number, DprRound>();

  rounds.forEach((round) => {
    const existing = byRound.get(round.round);

    if (!existing) {
      byRound.set(round.round, {
        ...round,
        damage: round.damage ?? 0,
        contributions: round.contributions ?? [],
      });
      return;
    }

    const contributions = mergeContributions([
      ...(existing.contributions ?? []),
      ...(round.contributions ?? []),
    ]);

    byRound.set(round.round, {
      round: round.round,
      damage: (existing.damage ?? 0) + (round.damage ?? 0),
      contributions,
    });
  });

  return Array.from({ length: 10 }, (_, index) => {
    const roundNumber = index + 1;

    return (
      byRound.get(roundNumber) ?? {
        round: roundNumber,
        damage: 0,
        contributions: [],
      }
    );
  });
}

export function getAverageDpr(rounds: DprRound[]): number {
  if (rounds.length === 0) return 0;

  return (
    rounds.reduce((sum, round) => sum + round.damage, 0) / rounds.length
  );
}

export function getTotalDprDamage(rounds: DprRound[]): number {
  return rounds.reduce((sum, round) => sum + round.damage, 0);
}

export function getSimulatorBuildNameForSnapshot(
  snapshot: BuildEditorSnapshot
): string {
  if (snapshot.selectedClass && STANDARD_BUILD_BY_CLASS[snapshot.selectedClass]) {
    return STANDARD_BUILD_BY_CLASS[snapshot.selectedClass]!;
  }

  return "BG3_Monk_Level12_StdEquip (gorKjan.5019)";
}