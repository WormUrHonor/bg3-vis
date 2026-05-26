import type {
  AbilityRole,
  ActionCost,
  DamageType,
  RangeCategory,
  RangeShape,
  ResourceCost,
  SpellRank,
} from "../../data/bg3Spells";

export type DataCircleProps = {
  buildName: string;
  characterName: string;
  selectedClass: string;
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
};

export type VisualizedBuildItem = {
  id: string;
  name: string;
  range?: {
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
    spellSlotLevel?: SpellRank;
    requiresConcentration?: boolean;
  };
  rank?: SpellRank;
};

export type RangeBandKey = "self" | "melee" | "mid" | "long";

export type DamageRingKey =
  | "Bludgeoning"
  | "Piercing"
  | "Slashing"
  | "Weapon"
  | "Acid"
  | "Cold"
  | "Fire"
  | "Force"
  | "Lightning"
  | "Necrotic"
  | "Poison"
  | "Psychic"
  | "Radiant"
  | "Thunder"
  | "Variable";

export type ResourceSectorKey =
  | "action"
  | "bonus-action"
  | "reaction"
  | "concentration"
  | "cantrip"
  | "slot-1"
  | "slot-2"
  | "slot-3"
  | "slot-4"
  | "slot-5"
  | "slot-6"
  | "pact"
  | "short-rest"
  | "long-rest"
  | "class-resource"
  | "passive-conditional";

export type ResourceFamily =
  | "action"
  | "focus"
  | "spell-slot"
  | "pact"
  | "rest"
  | "class"
  | "trigger";

export type RoleData = {
  counts: Record<AbilityRole, number>;
  damageTotal: number;
  utilityTotal: number;
  total: number;
};