import type { ClassName } from "../types/buildPlannerTypes";
import type {
  AbilityRole,
  ActionCost,
  DamageType,
  RangeCategory,
  RangeShape,
  ResourceCost,
} from "./bg3Spells";

export type ClassFeatureKind =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "toggle"
  | "manoeuvre"
  | "subclass-feature"
  | "resource-feature";

export type ClassFeatureAvailability = {
  className: ClassName;
  minLevel: number;
  subclass?: string;
};

export type BG3ClassFeature = {
  id: string;
  name: string;
  sourceType: "class-feature";
  kind: ClassFeatureKind;
  description?: string;
  availability: ClassFeatureAvailability[];
  isFixed: boolean;
  choiceGroupId?: string;
  choiceGroupLabel?: string;
  choiceGroupMax?: number;
  range: {
    label: string;
    meters: number | null;
    category: RangeCategory;
    shape: RangeShape;
    aoeMeters?: number;
  };
  roles: AbilityRole[];
  damageTypes: DamageType[];
  costs: {
    actions: ActionCost[];
    resources: ResourceCost[];
    requiresConcentration: boolean;
  };
  tags?: string[];
};

const self = {
  label: "self",
  meters: 0,
  category: "self",
  shape: "self",
} as const;

function availableTo(
  className: ClassName,
  minLevel: number,
  subclass?: string
): ClassFeatureAvailability {
  return { className, minLevel, subclass };
}

function feature(
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
  range: BG3ClassFeature["range"] = self,
  tags: string[] = [],
  choiceGroup?: {
    id: string;
    label: string;
    max: number;
  }
): BG3ClassFeature {
  return {
    id,
    name,
    sourceType: "class-feature",
    kind,
    description,
    availability,
    isFixed,
    choiceGroupId: choiceGroup?.id,
    choiceGroupLabel: choiceGroup?.label,
    choiceGroupMax: choiceGroup?.max,
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

/**
 * This file is intentionally small for now.
 * Add class/subclass features here as we go through each wiki page.
 *
 * isFixed: true
 *   The feature is automatically granted and cannot be toggled off.
 *
 * isFixed: false + choiceGroupId
 *   The feature is a player choice, such as Battle Master Manoeuvres.
 *
 * isFixed: false without choiceGroupId
 *   The feature is optional/toggleable, but not part of a limited choice group.
 */
export const bg3ClassFeatures: BG3ClassFeature[] = [
  feature(
    "fighter-second-wind",
    "Second Wind",
    "bonus-action",
    [availableTo("Fighter", 1)],
    true,
    "Regain Hit Points using a Bonus Action.",
    ["healing", "defense-protection"],
    [],
    ["bonus-action"],
    ["short-rest"],
    self,
    ["fighter", "class-action"]
  ),

  feature(
    "fighter-action-surge",
    "Action Surge",
    "resource-feature",
    [availableTo("Fighter", 2)],
    true,
    "Immediately gain an additional Action.",
    ["support-buff"],
    [],
    ["conditional"],
    ["short-rest"],
    self,
    ["fighter", "class-action"]
  ),

  feature(
    "fighter-battle-master-superiority-dice",
    "Superiority Dice",
    "resource-feature",
    [availableTo("Fighter", 3, "Battle Master")],
    true,
    "Battle Masters use Superiority Dice to fuel Manoeuvres.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource"],
    self,
    ["fighter", "battle-master", "resource"]
  ),

  feature(
    "fighter-manoeuvre-disarming-attack",
    "Disarming Attack",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to make an attack that can force the target to drop its weapon.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    { label: "weapon range", meters: 18, category: "long", shape: "weapon" },
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),

  feature(
    "fighter-manoeuvre-pushing-attack",
    "Pushing Attack",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to make an attack that can push the target away.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    { label: "weapon range", meters: 18, category: "long", shape: "weapon" },
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),

  feature(
    "fighter-manoeuvre-riposte",
    "Riposte",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to retaliate when a hostile creature misses you with a melee attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["reaction"],
    ["class-resource"],
    { label: "melee", meters: 1.5, category: "melee", shape: "melee" },
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),
];

export function getClassFeatureById(id: string): BG3ClassFeature | undefined {
  return bg3ClassFeatures.find((featureEntry) => featureEntry.id === id);
}