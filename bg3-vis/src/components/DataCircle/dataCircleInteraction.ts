import type { AbilityRole } from "../../data/bg3Spells";
import {
  DAMAGE_ROLE_KEYS,
  DAMAGE_TYPES,
  RANGE_BANDS,
  UTILITY_ROLE_KEYS,
} from "./dataCircleConfig";
import type {
  DamageRingKey,
  RangeBandKey,
  VisualizedBuildItem,
} from "./dataCircleTypes";

export type RoleGroupKey = "damage" | "utility";

export type DataCircleFocusItem =
  | { type: "ability"; abilityId: string }
  | { type: "role"; role: AbilityRole }
  | { type: "roleGroup"; roleGroup: RoleGroupKey }
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
  roleGroupToAbilities: Record<RoleGroupKey, string[]>;
  damageTypeToAbilities: Record<DamageRingKey, string[]>;
  rangeToAbilities: Record<RangeBandKey, string[]>;
  roundToAbilities: Record<number, string[]>;

  allAbilityIds: string[];
};

const ALL_ROLE_KEYS = [...DAMAGE_ROLE_KEYS, ...UTILITY_ROLE_KEYS] as AbilityRole[];

const ALL_DAMAGE_TYPE_KEYS = DAMAGE_TYPES.map((type) => type.key);
const ALL_RANGE_KEYS = RANGE_BANDS.map((band) => band.key);

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function getFocusItems(focus: DataCircleFocus): DataCircleFocusItem[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
}

function getItemId(item: VisualizedBuildItem) {
  return item.id;
}

function getItemName(item: VisualizedBuildItem) {
  return item.name;
}

function isDamageRingKey(value: string): value is DamageRingKey {
  return ALL_DAMAGE_TYPE_KEYS.includes(value as DamageRingKey);
}

function getItemRoles(item: VisualizedBuildItem): AbilityRole[] {
  return unique(
    item.roles.filter((role): role is AbilityRole => ALL_ROLE_KEYS.includes(role))
  );
}

function getItemDamageTypes(item: VisualizedBuildItem): DamageRingKey[] {
  return unique(
    item.damageTypes.flatMap((type) => {
      if (type === "Weapon" || type === "Physical") {
        return ["Weapon"];
      }

      if (isDamageRingKey(type)) {
        return [type];
      }

      return [];
    })
  );
}

function getItemRanges(item: VisualizedBuildItem): RangeBandKey[] {
  if (!item.range) return [];

  switch (item.range.category) {
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

function emptyRoleGroupMap(): Record<RoleGroupKey, string[]> {
  return {
    damage: [],
    utility: [],
  };
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

  if (a.type === "roleGroup" && b.type === "roleGroup") {
    return a.roleGroup === b.roleGroup;
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
  items: VisualizedBuildItem[],
  rounds: DprRound[]
): LayerRelationshipIndex {
  const abilityNames: Record<string, string> = {};

  const abilityToRoles: Record<string, AbilityRole[]> = {};
  const abilityToDamageTypes: Record<string, DamageRingKey[]> = {};
  const abilityToRanges: Record<string, RangeBandKey[]> = {};
  const abilityToRounds: Record<string, number[]> = {};

  const roleToAbilities = emptyRoleMap();
  const roleGroupToAbilities = emptyRoleGroupMap();
  const damageTypeToAbilities = emptyDamageTypeMap();
  const rangeToAbilities = emptyRangeMap();
  const roundToAbilities: Record<number, string[]> = {};

  items.forEach((item) => {
    const abilityId = getItemId(item);
    const roles = getItemRoles(item);
    const damageTypes = getItemDamageTypes(item);
    const ranges = getItemRanges(item);

    abilityNames[abilityId] = getItemName(item);
    abilityToRoles[abilityId] = roles;
    abilityToDamageTypes[abilityId] = damageTypes;
    abilityToRanges[abilityId] = ranges;
    abilityToRounds[abilityId] = [];

    roles.forEach((role) => {
      roleToAbilities[role].push(abilityId);
    });

    if (roles.some((role) => DAMAGE_ROLE_KEYS.includes(role))) {
      roleGroupToAbilities.damage.push(abilityId);
    }

    if (roles.some((role) => UTILITY_ROLE_KEYS.includes(role))) {
      roleGroupToAbilities.utility.push(abilityId);
    }

    damageTypes.forEach((damageType) => {
      damageTypeToAbilities[damageType].push(abilityId);
    });

    ranges.forEach((range) => {
      rangeToAbilities[range].push(abilityId);
    });
  });

  roleGroupToAbilities.damage = unique(roleGroupToAbilities.damage);
  roleGroupToAbilities.utility = unique(roleGroupToAbilities.utility);

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
    ...items.map(getItemId),
  ]);

  return {
    abilityNames,

    abilityToRoles,
    abilityToDamageTypes,
    abilityToRanges,
    abilityToRounds,

    roleToAbilities,
    roleGroupToAbilities,
    damageTypeToAbilities,
    rangeToAbilities,
    roundToAbilities,

    allAbilityIds,
  };
}

function unionAbilityIds(groups: string[][]) {
  return unique(groups.flat());
}

function intersectAbilityIds(base: string[], filterValues: string[]) {
  const filterSet = new Set(filterValues);
  return base.filter((abilityId) => filterSet.has(abilityId));
}

function getAbilityFacetIds(focusItems: DataCircleFocusItem[]) {
  return unique(
    focusItems
      .filter((item): item is Extract<DataCircleFocusItem, { type: "ability" }> =>
        item.type === "ability"
      )
      .map((item) => item.abilityId)
  );
}

function getRoleFacetIds(
  focusItems: DataCircleFocusItem[],
  index: LayerRelationshipIndex
) {
  const roleItems = focusItems.filter(
    (item): item is Extract<DataCircleFocusItem, { type: "role" }> =>
      item.type === "role"
  );

  const roleGroupItems = focusItems.filter(
    (item): item is Extract<DataCircleFocusItem, { type: "roleGroup" }> =>
      item.type === "roleGroup"
  );

  if (roleItems.length <= 0 && roleGroupItems.length <= 0) return [];

  return unionAbilityIds([
    ...roleItems.map((item) => index.roleToAbilities[item.role] ?? []),
    ...roleGroupItems.map(
      (item) => index.roleGroupToAbilities[item.roleGroup] ?? []
    ),
  ]);
}

function getDamageTypeFacetIds(
  focusItems: DataCircleFocusItem[],
  index: LayerRelationshipIndex
) {
  const damageTypeItems = focusItems.filter(
    (
      item
    ): item is Extract<DataCircleFocusItem, { type: "damageType" }> =>
      item.type === "damageType"
  );

  if (damageTypeItems.length <= 0) return [];

  return unionAbilityIds(
    damageTypeItems.map(
      (item) => index.damageTypeToAbilities[item.damageType] ?? []
    )
  );
}

function getRangeFacetIds(
  focusItems: DataCircleFocusItem[],
  index: LayerRelationshipIndex
) {
  const rangeItems = focusItems.filter(
    (item): item is Extract<DataCircleFocusItem, { type: "range" }> =>
      item.type === "range"
  );

  if (rangeItems.length <= 0) return [];

  return unionAbilityIds(
    rangeItems.map((item) => index.rangeToAbilities[item.range] ?? [])
  );
}

function getRoundFacetIds(
  focusItems: DataCircleFocusItem[],
  index: LayerRelationshipIndex
) {
  const roundItems = focusItems.filter(
    (item): item is Extract<DataCircleFocusItem, { type: "round" }> =>
      item.type === "round"
  );

  if (roundItems.length <= 0) return [];

  return unionAbilityIds(
    roundItems.map((item) => index.roundToAbilities[item.round] ?? [])
  );
}

export function getFocusedAbilityIds(
  focus: DataCircleFocus,
  index: LayerRelationshipIndex
) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length <= 0) {
    return index.allAbilityIds;
  }

  let result = [...index.allAbilityIds];

  const abilityFacetIds = getAbilityFacetIds(focusItems);
  if (abilityFacetIds.length > 0) {
    result = intersectAbilityIds(result, abilityFacetIds);
  }

  const roleFacetIds = getRoleFacetIds(focusItems, index);
  if (roleFacetIds.length > 0) {
    result = intersectAbilityIds(result, roleFacetIds);
  }

  const damageTypeFacetIds = getDamageTypeFacetIds(focusItems, index);
  if (damageTypeFacetIds.length > 0) {
    result = intersectAbilityIds(result, damageTypeFacetIds);
  }

  const rangeFacetIds = getRangeFacetIds(focusItems, index);
  if (rangeFacetIds.length > 0) {
    result = intersectAbilityIds(result, rangeFacetIds);
  }

  const roundFacetIds = getRoundFacetIds(focusItems, index);
  if (roundFacetIds.length > 0) {
    result = intersectAbilityIds(result, roundFacetIds);
  }

  return unique(result);
}

export function hasActiveFocus(focus: DataCircleFocus) {
  return getFocusItems(focus).length > 0;
}

export function focusContainsType(
  focus: DataCircleFocus,
  type: DataCircleFocusItem["type"]
) {
  return getFocusItems(focus).some((item) => item.type === type);
}

export function focusContainsOnlyTypes(
  focus: DataCircleFocus,
  types: DataCircleFocusItem["type"][]
) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length <= 0) return false;

  return focusItems.every((item) => types.includes(item.type));
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
      title: `${abilityIds.length} filtered abilities`,
      body:
        abilityIds.length > 0
          ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No abilities match the current filter combination.",
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
          ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No abilities match this role.",
    };
  }

  if (focusItem.type === "roleGroup") {
    return {
      title:
        focusItem.roleGroup === "damage"
          ? "Role group: Damage"
          : "Role group: Utility",
      body:
        abilityIds.length > 0
          ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No abilities match this role group.",
    };
  }

  if (focusItem.type === "damageType") {
    return {
      title: `Damage: ${focusItem.damageType}`,
      body:
        abilityIds.length > 0
          ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No abilities match this damage type.",
    };
  }

  if (focusItem.type === "range") {
    return {
      title: `Range: ${focusItem.range}`,
      body:
        abilityIds.length > 0
          ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
          : "No abilities match this range band.",
    };
  }

  return {
    title: `Round ${focusItem.round}`,
    body:
      abilityIds.length > 0
        ? `Matching abilities: ${abilityNames.join(", ")}${suffix}.`
        : "No abilities match this round.",
  };
}