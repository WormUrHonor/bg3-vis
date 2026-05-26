import type { ClassName } from "../../types/buildPlannerTypes";
import type {
  AbilityRole,
  ActionCost,
  DamageType,
  ResourceCost,
} from "../bg3Spells";
import type {
  BG3ClassFeature,
  ClassFeatureActiveGroup,
  ClassFeatureAvailability,
  ClassFeatureChoiceGroup,
  ClassFeatureDependencyMode,
  ClassFeatureDisplayGroup,
  ClassFeatureKind,
  ClassFeatureRange,
} from "./classFeatureTypes";

export const self = {
  label: "self",
  meters: 0,
  category: "self",
  shape: "self",
} as const satisfies ClassFeatureRange;

export const melee = {
  label: "1.5m",
  meters: 1.5,
  category: "melee",
  shape: "melee",
} as const satisfies ClassFeatureRange;

export const touch = {
  label: "1.5m",
  meters: 1.5,
  category: "melee",
  shape: "single-target",
} as const satisfies ClassFeatureRange;

export const weaponRange = {
  label: "weapon range",
  meters: 18,
  category: "long",
  shape: "weapon",
} as const satisfies ClassFeatureRange;

export const range3m = {
  label: "3m",
  meters: 3,
  category: "melee",
  shape: "single-target",
} as const satisfies ClassFeatureRange;

export const range6m = {
  label: "6m",
  meters: 6,
  category: "mid",
  shape: "single-target",
} as const satisfies ClassFeatureRange;

export const range9m = {
  label: "9m",
  meters: 9,
  category: "mid",
  shape: "single-target",
} as const satisfies ClassFeatureRange;

export const range18m = {
  label: "18m",
  meters: 18,
  category: "long",
  shape: "single-target",
} as const satisfies ClassFeatureRange;

export function radiusRange(
  label: string,
  meters: number,
  category: ClassFeatureRange["category"],
  aoeMeters?: number
): ClassFeatureRange {
  return {
    label,
    meters,
    category,
    shape: "radius",
    ...(aoeMeters !== undefined ? { aoeMeters } : {}),
  };
}

export function coneRange(
  label: string,
  meters: number,
  category: ClassFeatureRange["category"]
): ClassFeatureRange {
  return {
    label,
    meters,
    category,
    shape: "cone",
  };
}

export function lineRange(
  label: string,
  meters: number,
  category: ClassFeatureRange["category"],
  aoeMeters?: number
): ClassFeatureRange {
  return {
    label,
    meters,
    category,
    shape: "line",
    ...(aoeMeters !== undefined ? { aoeMeters } : {}),
  };
}

export function availableTo(
  className: ClassName,
  minLevel: number,
  subclassOrMaxLevel?: string | number,
  maxLevel?: number
): ClassFeatureAvailability {
  if (typeof subclassOrMaxLevel === "number") {
    return {
      className,
      minLevel,
      maxLevel: subclassOrMaxLevel,
    };
  }

  return {
    className,
    minLevel,
    subclass: subclassOrMaxLevel,
    maxLevel,
  };
}

export type FeatureOptions = {
  choiceGroup?: ClassFeatureChoiceGroup;
  activeGroup?: ClassFeatureActiveGroup;
  displayGroup?: ClassFeatureDisplayGroup;
  requires?: string[];
  dependencyMode?: ClassFeatureDependencyMode;
  conflictsWith?: string[];
  isInformational?: boolean;
};

export function feature(
  id: string,
  name: string,
  kind: ClassFeatureKind,
  availability: ClassFeatureAvailability[],
  isFixed: boolean,
  description: string,
  roles: AbilityRole[] = [],
  damageTypes: DamageType[] = [],
  actions: ActionCost[] = ["passive"],
  resources: ResourceCost[] = ["none"],
  range: ClassFeatureRange = self,
  tags: string[] = [],
  options: FeatureOptions = {}
): BG3ClassFeature {
  return {
    id,
    name,
    sourceType: "class-feature",
    kind,
    description,
    availability,
    isFixed,
    isInformational: options.isInformational,

    choiceGroupId: options.choiceGroup?.id,
    choiceGroupLabel: options.choiceGroup?.label,
    choiceGroupMax: options.choiceGroup?.max,

    activeGroupId: options.activeGroup?.id,
    activeGroupLabel: options.activeGroup?.label,
    activeGroupMax: options.activeGroup?.max,

    displayGroupId: options.displayGroup?.id,
    displayGroupLabel: options.displayGroup?.label,
    displayGroupOrder: options.displayGroup?.order,

    requiredFeatureIds: options.requires,
    dependencyMode: options.dependencyMode,
    conflictsWithFeatureIds: options.conflictsWith,

    range,
    roles,
    damageTypes,
    costs: {
      actions,
      resources,
      requiresConcentration: false,
    },
    tags,
  };
}