import type { AbilityRole } from "../../data/bg3Spells";
import { DAMAGE_ROLE_KEYS, UTILITY_ROLE_KEYS } from "./dataCircleConfig";
import type {
  DamageRingKey,
  RangeBandKey,
  ResourceSectorKey,
  RoleData,
  VisualizedBuildItem,
} from "./dataCircleTypes";

export type DataCircleLayerKey =
  | "range"
  | "role"
  | "damageType"
  | "resource";

export type DataCircleDistributionSummary = {
  itemCount: number;
  activeItemCount: number;
  passiveOrConditionalItemCount: number;

  rangeCounts: Record<RangeBandKey, number>;
  roleData: RoleData;
  damageTypeCounts: Record<DamageRingKey, number>;
  resourceCounts: Record<ResourceSectorKey, number>;

  nonEmptyRangeBands: RangeBandKey[];
  nonEmptyRoles: AbilityRole[];
  nonEmptyDamageTypes: DamageRingKey[];
  nonEmptyResources: ResourceSectorKey[];

  damageRoleShare: number;
  utilityRoleShare: number;
  rangeDiversity: number;
  roleDiversity: number;
  damageTypeDiversity: number;
  resourceDiversity: number;

  dominantRangeBand: RangeBandKey | null;
  dominantRole: AbilityRole | null;
  dominantDamageType: DamageRingKey | null;
  dominantResource: ResourceSectorKey | null;

  rangeEntropy: number;
  roleEntropy: number;
  damageTypeEntropy: number;
  resourceEntropy: number;
};

export type DataCircleMatchingItemSummary = {
  id: string;
  name: string;
  roles: AbilityRole[];
  damageTypes: string[];
  rangeCategory: string | null;
  resources: string[];
  actions: string[];
  requiresConcentration: boolean;
  isPassiveOrConditional: boolean;
};

export type DataCircleFocusMatchSummary = {
  focusLayer: DataCircleLayerKey;
  focusKey: string;
  matchingItemCount: number;
  matchingItemIds: string[];
  matchingItems: DataCircleMatchingItemSummary[];
};

function isRecordKey<T extends string>(
  value: string,
  record: Record<T, number>
): value is T {
  return value in record;
}

function getItemId(item: VisualizedBuildItem): string {
  const record = item as unknown as Record<string, unknown>;

  const possibleId =
    record.id ??
    record.itemId ??
    record.abilityId ??
    record.spellId ??
    record.featureId ??
    record.key;

  return typeof possibleId === "string" && possibleId.length > 0
    ? possibleId
    : getItemName(item);
}

function getItemName(item: VisualizedBuildItem): string {
  const record = item as unknown as Record<string, unknown>;

  const possibleName =
    record.name ??
    record.itemName ??
    record.abilityName ??
    record.spellName ??
    record.featureName ??
    record.label;

  return typeof possibleName === "string" && possibleName.length > 0
    ? possibleName
    : "Unknown item";
}

export function isPassiveOrConditionalItem(item: VisualizedBuildItem): boolean {
  const actions = item.costs?.actions ?? [];

  return actions.includes("passive") || actions.includes("conditional");
}

export function getActiveVisualizedItems(
  items: VisualizedBuildItem[]
): VisualizedBuildItem[] {
  return items.filter((item) => !isPassiveOrConditionalItem(item));
}

export function getRangeCounts(items: VisualizedBuildItem[]) {
  const counts: Record<RangeBandKey, number> = {
    self: 0,
    melee: 0,
    mid: 0,
    long: 0,
  };

  items.forEach((item) => {
    if (!item.range) return;

    switch (item.range.category) {
      case "self":
        counts.self += 1;
        break;
      case "melee":
      case "weapon-range":
        counts.melee += 1;
        break;
      case "mid":
        counts.mid += 1;
        break;
      case "long":
        counts.long += 1;
        break;
    }
  });

  return counts;
}

export function getRoleData(items: VisualizedBuildItem[]): RoleData {
  const counts: Record<AbilityRole, number> = {
    "single-target-damage": 0,
    "area-damage": 0,
    control: 0,
    "support-buff": 0,
    "defense-protection": 0,
    healing: 0,
    "mobility-positioning": 0,
    "narrative-interaction": 0,
    "investigation-world-interaction": 0,
    summon: 0,
  };

  items.forEach((item) => {
    item.roles.forEach((role) => {
      counts[role] += 1;
    });
  });

  const damageTotal = DAMAGE_ROLE_KEYS.reduce(
    (sum, key) => sum + counts[key],
    0
  );

  const utilityTotal = UTILITY_ROLE_KEYS.reduce(
    (sum, key) => sum + counts[key],
    0
  );

  return {
    counts,
    damageTotal,
    utilityTotal,
    total: damageTotal + utilityTotal,
  };
}

export function getDamageTypeCounts(items: VisualizedBuildItem[]) {
  const counts: Record<DamageRingKey, number> = {
    Bludgeoning: 0,
    Piercing: 0,
    Slashing: 0,
    Weapon: 0,
    Acid: 0,
    Cold: 0,
    Fire: 0,
    Force: 0,
    Lightning: 0,
    Necrotic: 0,
    Poison: 0,
    Psychic: 0,
    Radiant: 0,
    Thunder: 0,
    Variable: 0,
  };

  items.forEach((item) => {
    item.damageTypes.forEach((type) => {
      if (type === "Weapon" || type === "Physical") {
        counts.Weapon += 1;
      } else if (isRecordKey(type, counts)) {
        counts[type] += 1;
      }
    });
  });

  return counts;
}

export function getResourceCounts(items: VisualizedBuildItem[]) {
  const counts: Record<ResourceSectorKey, number> = {
    action: 0,
    "bonus-action": 0,
    reaction: 0,
    concentration: 0,
    cantrip: 0,
    "slot-1": 0,
    "slot-2": 0,
    "slot-3": 0,
    "slot-4": 0,
    "slot-5": 0,
    "slot-6": 0,
    pact: 0,
    "short-rest": 0,
    "long-rest": 0,
    "class-resource": 0,
    "passive-conditional": 0,
  };

  items.forEach((item) => {
    const actions = item.costs.actions;
    const resources = item.costs.resources;

    if (actions.includes("action")) {
      counts.action += 1;
    }

    if (actions.includes("bonus-action")) {
      counts["bonus-action"] += 1;
    }

    if (actions.includes("reaction")) {
      counts.reaction += 1;
    }

    if (actions.includes("passive") || actions.includes("conditional")) {
      counts["passive-conditional"] += 1;
    }

    if (item.costs.requiresConcentration) {
      counts.concentration += 1;
    }

    if (item.rank === 0 || resources.includes("cantrip")) {
      counts.cantrip += 1;
    }

    if (
      resources.includes("spell-slot") &&
      item.costs.spellSlotLevel &&
      item.costs.spellSlotLevel >= 1 &&
      item.costs.spellSlotLevel <= 6
    ) {
      counts[`slot-${item.costs.spellSlotLevel}` as ResourceSectorKey] += 1;
    }

    if (resources.includes("pact-magic-slot")) {
      counts.pact += 1;
    }

    if (resources.includes("short-rest")) {
      counts["short-rest"] += 1;
    }

    if (resources.includes("long-rest")) {
      counts["long-rest"] += 1;
    }

    if (resources.includes("class-resource")) {
      counts["class-resource"] += 1;
    }
  });

  return counts;
}

function getNonEmptyKeys<T extends string>(counts: Record<T, number>): T[] {
  return Object.entries(counts)
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([key]) => key as T);
}

function getDominantKey<T extends string>(counts: Record<T, number>): T | null {
  let dominantKey: T | null = null;
  let dominantValue = 0;

  for (const [key, value] of Object.entries(counts) as Array<[T, number]>) {
    if (value > dominantValue) {
      dominantKey = key;
      dominantValue = value;
    }
  }

  return dominantValue > 0 ? dominantKey : null;
}

function getDiversity<T extends string>(counts: Record<T, number>): number {
  return getNonEmptyKeys(counts).length;
}

function getEntropy<T extends string>(counts: Record<T, number>): number {
  const values = Object.values(counts).filter(
    (value): value is number => typeof value === "number" && value > 0
  );

  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0 || values.length <= 1) return 0;

  const entropy = values.reduce((sum, value) => {
    const probability = value / total;
    return sum - probability * Math.log2(probability);
  }, 0);

  const maxEntropy = Math.log2(values.length);

  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

export function createDataCircleDistributionSummary(
  items: VisualizedBuildItem[],
  options: {
    excludePassiveOrConditional?: boolean;
  } = {}
): DataCircleDistributionSummary {
  const activeItems = getActiveVisualizedItems(items);
  const countedItems =
    options.excludePassiveOrConditional === false ? items : activeItems;

  const rangeCounts = getRangeCounts(countedItems);
  const roleData = getRoleData(countedItems);
  const damageTypeCounts = getDamageTypeCounts(countedItems);
  const resourceCounts = getResourceCounts(countedItems);

  const damageRoleShare =
    roleData.total > 0 ? roleData.damageTotal / roleData.total : 0;

  const utilityRoleShare =
    roleData.total > 0 ? roleData.utilityTotal / roleData.total : 0;

  return {
    itemCount: items.length,
    activeItemCount: activeItems.length,
    passiveOrConditionalItemCount: items.length - activeItems.length,

    rangeCounts,
    roleData,
    damageTypeCounts,
    resourceCounts,

    nonEmptyRangeBands: getNonEmptyKeys(rangeCounts),
    nonEmptyRoles: getNonEmptyKeys(roleData.counts),
    nonEmptyDamageTypes: getNonEmptyKeys(damageTypeCounts),
    nonEmptyResources: getNonEmptyKeys(resourceCounts),

    damageRoleShare,
    utilityRoleShare,
    rangeDiversity: getDiversity(rangeCounts),
    roleDiversity: getDiversity(roleData.counts),
    damageTypeDiversity: getDiversity(damageTypeCounts),
    resourceDiversity: getDiversity(resourceCounts),

    dominantRangeBand: getDominantKey(rangeCounts),
    dominantRole: getDominantKey(roleData.counts),
    dominantDamageType: getDominantKey(damageTypeCounts),
    dominantResource: getDominantKey(resourceCounts),

    rangeEntropy: getEntropy(rangeCounts),
    roleEntropy: getEntropy(roleData.counts),
    damageTypeEntropy: getEntropy(damageTypeCounts),
    resourceEntropy: getEntropy(resourceCounts),
  };
}

function createMatchingItemSummary(
  item: VisualizedBuildItem
): DataCircleMatchingItemSummary {
  return {
    id: getItemId(item),
    name: getItemName(item),
    roles: item.roles,
    damageTypes: item.damageTypes,
    rangeCategory: item.range?.category ?? null,
    resources: item.costs.resources,
    actions: item.costs.actions,
    requiresConcentration: Boolean(item.costs.requiresConcentration),
    isPassiveOrConditional: isPassiveOrConditionalItem(item),
  };
}

export function getItemsMatchingDataCircleFocus(
  items: VisualizedBuildItem[],
  focusLayer: DataCircleLayerKey,
  focusKey: string,
  options: {
    excludePassiveOrConditional?: boolean;
  } = {}
): VisualizedBuildItem[] {
  const countedItems =
    options.excludePassiveOrConditional === false
      ? items
      : getActiveVisualizedItems(items);

  return countedItems.filter((item) => {
    if (focusLayer === "range") {
      if (!item.range) return false;

      if (focusKey === "melee") {
        return (
          item.range.category === "melee" ||
          item.range.category === "weapon-range"
        );
      }

      return item.range.category === focusKey;
    }

    if (focusLayer === "role") {
      return item.roles.includes(focusKey as AbilityRole);
    }

    if (focusLayer === "damageType") {
      if (focusKey === "Weapon") {
        return item.damageTypes.some(
          (type) => type === "Weapon" || type === "Physical"
        );
      }

      return item.damageTypes.some((type) => type === focusKey);
    }

    if (focusLayer === "resource") {
      const actions = item.costs.actions;
      const resources = item.costs.resources;

      if (focusKey === "action") return actions.includes("action");
      if (focusKey === "bonus-action") return actions.includes("bonus-action");
      if (focusKey === "reaction") return actions.includes("reaction");

      if (focusKey === "passive-conditional") {
        return actions.includes("passive") || actions.includes("conditional");
      }

      if (focusKey === "concentration") {
        return item.costs.requiresConcentration;
      }

      if (focusKey === "cantrip") {
        return item.rank === 0 || resources.includes("cantrip");
      }

      if (focusKey.startsWith("slot-")) {
        const spellSlotLevel = Number(focusKey.replace("slot-", ""));

        return (
          resources.includes("spell-slot") &&
          item.costs.spellSlotLevel === spellSlotLevel
        );
      }

      if (focusKey === "pact") return resources.includes("pact-magic-slot");
      if (focusKey === "short-rest") return resources.includes("short-rest");
      if (focusKey === "long-rest") return resources.includes("long-rest");

      if (focusKey === "class-resource") {
        return resources.includes("class-resource");
      }
    }

    return false;
  });
}

export function createDataCircleFocusMatchSummary(
  items: VisualizedBuildItem[],
  focusLayer: DataCircleLayerKey,
  focusKey: string,
  options: {
    excludePassiveOrConditional?: boolean;
  } = {}
): DataCircleFocusMatchSummary {
  const matchingItems = getItemsMatchingDataCircleFocus(
    items,
    focusLayer,
    focusKey,
    options
  );

  const matchingItemSummaries = matchingItems.map(createMatchingItemSummary);

  return {
    focusLayer,
    focusKey,
    matchingItemCount: matchingItemSummaries.length,
    matchingItemIds: matchingItemSummaries.map((item) => item.id),
    matchingItems: matchingItemSummaries,
  };
}