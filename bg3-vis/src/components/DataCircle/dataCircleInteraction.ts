import type { AbilityRole, BG3Spell } from "../../data/bg3Spells";
import { DAMAGE_ROLE_KEYS, DAMAGE_TYPES, RANGE_BANDS } from "./dataCircleConfig";
import type { DamageRingKey, RangeBandKey } from "./dataCircleTypes";

export type DataCircleFocus =
  | { type: "ability"; abilityId: string }
  | { type: "role"; role: AbilityRole }
  | { type: "damageType"; damageType: DamageRingKey }
  | { type: "range"; range: RangeBandKey }
  | { type: "round"; round: number }
  | null;

export type DprContribution = {
  abilityId: string;
  abilityName: string;
  damage: number;
};

export type DprRound = {
  round: number;
  damage: number;
  contributions?: DprContribution[];
};

export type LayerRelationshipIndex = {
  abilityNames: Record<string, string>;

  abilityToRoles: Record<string, AbilityRole[]>;
  abilityToDamageTypes: Record<string, DamageRingKey[]>;
  abilityToRanges: Record<string, RangeBandKey[]>;
  abilityToRounds: Record<string, number[]>;

  roleToAbilities: Record<AbilityRole, string[]>;
  damageTypeToAbilities: Record<DamageRingKey, string[]>;
  rangeToAbilities: Record<RangeBandKey, string[]>;
  roundToAbilities: Record<number, string[]>;

  allAbilityIds: string[];
};

const ALL_ROLE_KEYS = [
  ...DAMAGE_ROLE_KEYS,
  "control",
  "support-buff",
  "defense-protection",
  "healing",
  "mobility-positioning",
  "narrative-interaction",
  "investigation-world-interaction",
  "summon",
] as AbilityRole[];

const ALL_DAMAGE_TYPE_KEYS = DAMAGE_TYPES.map((type) => type.key);
const ALL_RANGE_KEYS = RANGE_BANDS.map((band) => band.key);

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function getSpellId(spell: BG3Spell) {
  return spell.id;
}

function getSpellName(spell: BG3Spell) {
  return spell.name;
}

function isDamageRingKey(value: string): value is DamageRingKey {
  return ALL_DAMAGE_TYPE_KEYS.includes(value as DamageRingKey);
}

function getSpellRoles(spell: BG3Spell): AbilityRole[] {
  return unique(
    spell.roles.filter((role): role is AbilityRole =>
      ALL_ROLE_KEYS.includes(role)
    )
  );
}

function getSpellDamageTypes(spell: BG3Spell): DamageRingKey[] {
  return unique(
    spell.damageTypes.flatMap((type) => {
      if (type === "Weapon" || type === "Physical") {
        return ["Physical"];
      }

      if (isDamageRingKey(type)) {
        return [type];
      }

      return [];
    })
  );
}

function getSpellRanges(spell: BG3Spell): RangeBandKey[] {
  switch (spell.range.category) {
    case "self":
      return ["self"];

    case "melee":
    case "weapon-range":
      return ["melee"];

    case "mid":
      return ["mid"];

    case "long":
      return ["long"];

    default:
      return [];
  }
}

function emptyRoleMap(): Record<AbilityRole, string[]> {
  const result = {} as Record<AbilityRole, string[]>;

  ALL_ROLE_KEYS.forEach((key) => {
    result[key] = [];
  });

  return result;
}

function emptyDamageTypeMap(): Record<DamageRingKey, string[]> {
  const result = {} as Record<DamageRingKey, string[]>;

  ALL_DAMAGE_TYPE_KEYS.forEach((key) => {
    result[key] = [];
  });

  return result;
}

function emptyRangeMap(): Record<RangeBandKey, string[]> {
  const result = {} as Record<RangeBandKey, string[]>;

  ALL_RANGE_KEYS.forEach((key) => {
    result[key] = [];
  });

  return result;
}

export function buildLayerRelationshipIndex(
  selectedSpells: BG3Spell[],
  rounds: DprRound[]
): LayerRelationshipIndex {
  const abilityNames: Record<string, string> = {};

  const abilityToRoles: Record<string, AbilityRole[]> = {};
  const abilityToDamageTypes: Record<string, DamageRingKey[]> = {};
  const abilityToRanges: Record<string, RangeBandKey[]> = {};
  const abilityToRounds: Record<string, number[]> = {};

  const roleToAbilities = emptyRoleMap();
  const damageTypeToAbilities = emptyDamageTypeMap();
  const rangeToAbilities = emptyRangeMap();
  const roundToAbilities: Record<number, string[]> = {};

  selectedSpells.forEach((spell) => {
    const abilityId = getSpellId(spell);
    const roles = getSpellRoles(spell);
    const damageTypes = getSpellDamageTypes(spell);
    const ranges = getSpellRanges(spell);

    abilityNames[abilityId] = getSpellName(spell);
    abilityToRoles[abilityId] = roles;
    abilityToDamageTypes[abilityId] = damageTypes;
    abilityToRanges[abilityId] = ranges;
    abilityToRounds[abilityId] = [];

    roles.forEach((role) => {
      roleToAbilities[role].push(abilityId);
    });

    damageTypes.forEach((damageType) => {
      damageTypeToAbilities[damageType].push(abilityId);
    });

    ranges.forEach((range) => {
      rangeToAbilities[range].push(abilityId);
    });
  });

  rounds.forEach((round) => {
    const roundAbilities =
      round.contributions?.map((contribution) => contribution.abilityId) ?? [];

    roundToAbilities[round.round] = unique(roundAbilities);

    round.contributions?.forEach((contribution) => {
      abilityNames[contribution.abilityId] =
        abilityNames[contribution.abilityId] || contribution.abilityName;

      abilityToRounds[contribution.abilityId] = unique([
        ...(abilityToRounds[contribution.abilityId] ?? []),
        round.round,
      ]);
    });
  });

  const allAbilityIds = unique([
    ...Object.keys(abilityNames),
    ...selectedSpells.map(getSpellId),
  ]);

  return {
    abilityNames,

    abilityToRoles,
    abilityToDamageTypes,
    abilityToRanges,
    abilityToRounds,

    roleToAbilities,
    damageTypeToAbilities,
    rangeToAbilities,
    roundToAbilities,

    allAbilityIds,
  };
}

export function getFocusedAbilityIds(
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return [];

  if (focus.type === "ability") return [focus.abilityId];

  if (focus.type === "role") {
    return index.roleToAbilities[focus.role] ?? [];
  }

  if (focus.type === "damageType") {
    return index.damageTypeToAbilities[focus.damageType] ?? [];
  }

  if (focus.type === "range") {
    return index.rangeToAbilities[focus.range] ?? [];
  }

  if (focus.type === "round") {
    return index.roundToAbilities[focus.round] ?? [];
  }

  return [];
}

export function hasActiveFocus(focus: DataCircleFocus) {
  return focus !== null;
}

export function isAbilityRelatedToFocus(
  abilityId: string,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return true;

  return getFocusedAbilityIds(focus, index).includes(abilityId);
}

export function isRoleRelatedToFocus(
  role: AbilityRole,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return true;
  if (focus.type === "role") return focus.role === role;

  const focusedAbilityIds = getFocusedAbilityIds(focus, index);
  const roleAbilityIds = index.roleToAbilities[role] ?? [];

  return roleAbilityIds.some((abilityId) =>
    focusedAbilityIds.includes(abilityId)
  );
}

export function isDamageTypeRelatedToFocus(
  damageType: DamageRingKey,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return true;
  if (focus.type === "damageType") return focus.damageType === damageType;

  const focusedAbilityIds = getFocusedAbilityIds(focus, index);
  const damageAbilityIds = index.damageTypeToAbilities[damageType] ?? [];

  return damageAbilityIds.some((abilityId) =>
    focusedAbilityIds.includes(abilityId)
  );
}

export function isRangeRelatedToFocus(
  range: RangeBandKey,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return true;
  if (focus.type === "range") return focus.range === range;

  const focusedAbilityIds = getFocusedAbilityIds(focus, index);
  const rangeAbilityIds = index.rangeToAbilities[range] ?? [];

  return rangeAbilityIds.some((abilityId) =>
    focusedAbilityIds.includes(abilityId)
  );
}

export function isRoundRelatedToFocus(
  round: number,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) return true;
  if (focus.type === "round") return focus.round === round;

  const focusedAbilityIds = getFocusedAbilityIds(focus, index);
  const roundAbilityIds = index.roundToAbilities[round] ?? [];

  return roundAbilityIds.some((abilityId) =>
    focusedAbilityIds.includes(abilityId)
  );
}

export function getFocusSummary(
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!focus) {
    return {
      title: "Cross-layer trace",
      body: "Hover a role, damage type, range band, round, or ability contribution to reveal linked evidence across the circle.",
    };
  }

  const abilityIds = getFocusedAbilityIds(focus, index);
  const abilityNames = abilityIds
    .map((abilityId) => index.abilityNames[abilityId] ?? abilityId)
    .slice(0, 3);

  const suffix =
    abilityIds.length > 3 ? ` +${abilityIds.length - 3} more` : "";

  if (focus.type === "ability") {
    return {
      title: index.abilityNames[focus.abilityId] ?? "Ability",
      body: "Tracing this ability across role, damage type, range, and DPR timing.",
    };
  }

  if (focus.type === "role") {
    return {
      title: `Role: ${focus.role}`,
      body:
        abilityIds.length > 0
          ? `Linked abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this role yet.",
    };
  }

  if (focus.type === "damageType") {
    return {
      title: `Damage: ${focus.damageType}`,
      body:
        abilityIds.length > 0
          ? `This damage type is produced by ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this damage type yet.",
    };
  }

  if (focus.type === "range") {
    return {
      title: `Range: ${focus.range}`,
      body:
        abilityIds.length > 0
          ? `This range profile is supported by ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this range band yet.",
    };
  }

  return {
    title: `Round ${focus.round}`,
    body:
      abilityIds.length > 0
        ? `This round is driven by ${abilityNames.join(", ")}${suffix}.`
        : "No ability-level contribution data is available for this round.",
  };
}