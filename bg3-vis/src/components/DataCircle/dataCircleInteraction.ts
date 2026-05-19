import type { AbilityRole, BG3Spell } from "../../data/bg3Spells";
import { DAMAGE_ROLE_KEYS, DAMAGE_TYPES, RANGE_BANDS } from "./dataCircleConfig";
import type { DamageRingKey, RangeBandKey } from "./dataCircleTypes";

export type DataCircleFocusItem =
  | { type: "ability"; abilityId: string }
  | { type: "role"; role: AbilityRole }
  | { type: "damageType"; damageType: DamageRingKey }
  | { type: "range"; range: RangeBandKey }
  | { type: "round"; round: number };

export type DataCircleFocus = DataCircleFocusItem | DataCircleFocusItem[] | null;

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

function getFocusItems(focus: DataCircleFocus): DataCircleFocusItem[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
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

export function isSameFocusItem(
  a: DataCircleFocusItem,
  b: DataCircleFocusItem
) {
  if (a.type !== b.type) return false;

  if (a.type === "ability" && b.type === "ability") {
    return a.abilityId === b.abilityId;
  }

  if (a.type === "role" && b.type === "role") {
    return a.role === b.role;
  }

  if (a.type === "damageType" && b.type === "damageType") {
    return a.damageType === b.damageType;
  }

  if (a.type === "range" && b.type === "range") {
    return a.range === b.range;
  }

  if (a.type === "round" && b.type === "round") {
    return a.round === b.round;
  }

  return false;
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
  const abilityIds = new Set<string>();

  getFocusItems(focus).forEach((focusItem) => {
    if (focusItem.type === "ability") {
      abilityIds.add(focusItem.abilityId);
    }

    if (focusItem.type === "role") {
      index.roleToAbilities[focusItem.role]?.forEach((abilityId) =>
        abilityIds.add(abilityId)
      );
    }

    if (focusItem.type === "damageType") {
      index.damageTypeToAbilities[focusItem.damageType]?.forEach((abilityId) =>
        abilityIds.add(abilityId)
      );
    }

    if (focusItem.type === "range") {
      index.rangeToAbilities[focusItem.range]?.forEach((abilityId) =>
        abilityIds.add(abilityId)
      );
    }

    if (focusItem.type === "round") {
      index.roundToAbilities[focusItem.round]?.forEach((abilityId) =>
        abilityIds.add(abilityId)
      );
    }
  });

  return [...abilityIds];
}

export function hasActiveFocus(focus: DataCircleFocus) {
  return getFocusItems(focus).length > 0;
}

export function isAbilityRelatedToFocus(
  abilityId: string,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!hasActiveFocus(focus)) return true;

  return getFocusedAbilityIds(focus, index).includes(abilityId);
}

export function isRoleRelatedToFocus(
  role: AbilityRole,
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  if (!hasActiveFocus(focus)) return true;

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
  if (!hasActiveFocus(focus)) return true;

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
  if (!hasActiveFocus(focus)) return true;

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
  if (!hasActiveFocus(focus)) return true;

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
  if (!focus || getFocusItems(focus).length <= 0) {
    return {
      title: "Cross-layer trace",
      body: "Hover or select a role, damage type, range band, round, or ability to reveal connections across the circle.",
    };
  }

  const focusItems = getFocusItems(focus);
  const abilityIds = getFocusedAbilityIds(focus, index);
  const abilityNames = abilityIds
    .map((abilityId) => index.abilityNames[abilityId] ?? abilityId)
    .slice(0, 3);

  const suffix =
    abilityIds.length > 3 ? ` +${abilityIds.length - 3} more` : "";

  if (focusItems.length > 1) {
    return {
      title: `${focusItems.length} selected filters`,
      body:
        abilityIds.length > 0
          ? `Combined selection links ${abilityNames.join(", ")}${suffix}.`
          : "The combined selection has no linked ability-level evidence yet.",
    };
  }

  const focusItem = focusItems[0];

  if (focusItem.type === "ability") {
    return {
      title: index.abilityNames[focusItem.abilityId] ?? "Ability",
      body: "Connecting this ability across role, damage type, range, and DPR timing.",
    };
  }

  if (focusItem.type === "role") {
    return {
      title: `Role: ${focusItem.role}`,
      body:
        abilityIds.length > 0
          ? `Linked abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this role yet.",
    };
  }

  if (focusItem.type === "damageType") {
    return {
      title: `Damage: ${focusItem.damageType}`,
      body:
        abilityIds.length > 0
          ? `This damage type is from ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this damage type yet.",
    };
  }

  if (focusItem.type === "range") {
    return {
      title: `Range: ${focusItem.range}`,
      body:
        abilityIds.length > 0
          ? `This range profile is made of ${abilityNames.join(", ")}${suffix}.`
          : "No linked ability-level evidence is available for this range band yet.",
    };
  }

  return {
    title: `Round ${focusItem.round}`,
    body:
      abilityIds.length > 0
        ? `This round contains ${abilityNames.join(", ")}${suffix}.`
        : "No ability-level contribution data is available for this round.",
  };
}