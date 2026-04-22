export type DamageType =
  | "Bludgeoning"
  | "Piercing"
  | "Slashing"
  | "Acid"
  | "Cold"
  | "Fire"
  | "Force"
  | "Lightning"
  | "Necrotic"
  | "Poison"
  | "Psychic"
  | "Radiant"
  | "Thunder";

export type RoleCategory = "Damage" | "Utility";
export type DamageSubtype = "Single-target" | "Area";
export type UtilitySubtype =
  | "Control"
  | "Support"
  | "Defense"
  | "Healing"
  | "Mobility"
  | "Narrative"
  | "Investigation";

export type RangeCategory =
  | "Self"
  | "Melee"
  | "Close-range"
  | "Mid-range"
  | "Long-range";

export type ActionCost =
  | "Action"
  | "Bonus Action"
  | "Reaction"
  | "Passive";

export interface Ability {
  id: string;
  name: string;
  damageTypes: DamageType[];
  roleCategory: RoleCategory;
  damageSubtype?: DamageSubtype;
  utilitySubtype?: UtilitySubtype;
  rangeCategory: RangeCategory;
  actionCost: ActionCost;
  requiresConcentration: boolean;
  spellSlotLevel?: number;
  usesPactMagic: boolean;
  restDependency?: "Short-rest" | "Long-rest";
}