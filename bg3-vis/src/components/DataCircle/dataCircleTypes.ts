import type { AbilityRole } from "../../data/bg3Spells";

export type DataCircleProps = {
  buildName: string;
  characterName: string;
  selectedClass: string;
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
};

export type RangeBandKey = "self" | "melee" | "mid" | "long";

export type DamageRingKey =
  | "Bludgeoning"
  | "Piercing"
  | "Slashing"
  | "Physical"
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
  | "passive-conditional"
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
  | "class-resource";

export type RoleData = {
  counts: Record<AbilityRole, number>;
  damageTotal: number;
  utilityTotal: number;
  total: number;
};
