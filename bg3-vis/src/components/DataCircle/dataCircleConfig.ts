import type { AbilityRole } from "../../data/bg3Spells";
import type { DamageRingKey, RangeBandKey, ResourceSectorKey } from "./dataCircleTypes";

export const RANGE_BANDS: {
  key: RangeBandKey;
  label: string;
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
}[] = [
  { key: "self", label: "Self", innerRadius: 106, outerRadius: 128, labelRadius: 117 },
  { key: "melee", label: "Melee", innerRadius: 134, outerRadius: 156, labelRadius: 145 },
  { key: "mid", label: "Mid-range", innerRadius: 162, outerRadius: 184, labelRadius: 173 },
  { key: "long", label: "Long-range", innerRadius: 190, outerRadius: 212, labelRadius: 201 },
];

export const RANGE_LABEL_ARC_START = -36;
export const RANGE_LABEL_ARC_END = 36;

export const DAMAGE_ROLE_KEYS: AbilityRole[] = ["single-target-damage", "area-damage"];

export const UTILITY_ROLE_KEYS: AbilityRole[] = [
  "control",
  "support-buff",
  "defense-protection",
  "healing",
  "mobility-positioning",
  "narrative-interaction",
  "investigation-world-interaction",
  "summon",
];

export const ROLE_VISUALS = {
  damage: {
    label: "Damage",
    shortLabel: "DMG",
    color: "#c66a3d",
    accentColor: "#ffb56f",
    glowColor: "#ff9a4f",
    lineColor: "rgba(255,190,118,0.5)",
  },
  utility: {
    label: "Utility",
    shortLabel: "UTL",
    color: "#3f9f8a",
    accentColor: "#8ae6c8",
    glowColor: "#7fe0c0",
    lineColor: "rgba(153,232,205,0.48)",
  },
};

export const DAMAGE_TYPES: {
  key: DamageRingKey;
  short: string;
  label: string;
  color: string;
  glowColor: string;
}[] = [
  { key: "Bludgeoning", short: "BLD", label: "Bludgeoning", color: "#8c7863", glowColor: "#d3b488" },
  { key: "Piercing", short: "PRC", label: "Piercing", color: "#a48963", glowColor: "#e0bf8b" },
  { key: "Slashing", short: "SLS", label: "Slashing", color: "#b69568", glowColor: "#edc98a" },
  { key: "Physical", short: "PHY", label: "Physical", color: "#c3aa7c", glowColor: "#f0d49a" },
  { key: "Acid", short: "ACD", label: "Acid", color: "#8abf36", glowColor: "#b7f05a" },
  { key: "Cold", short: "CLD", label: "Cold", color: "#7bc9e8", glowColor: "#bdeeff" },
  { key: "Fire", short: "FIR", label: "Fire", color: "#db5a28", glowColor: "#ff9858" },
  { key: "Force", short: "FRC", label: "Force", color: "#c44b62", glowColor: "#ff8190" },
  { key: "Lightning", short: "LGT", label: "Lightning", color: "#d9c731", glowColor: "#fff072" },
  { key: "Necrotic", short: "NEC", label: "Necrotic", color: "#6e9b45", glowColor: "#a9d45d" },
  { key: "Poison", short: "POI", label: "Poison", color: "#4f8f35", glowColor: "#8fd85a" },
  { key: "Psychic", short: "PSY", label: "Psychic", color: "#b05ac4", glowColor: "#eaa4ff" },
  { key: "Radiant", short: "RAD", label: "Radiant", color: "#e4c956", glowColor: "#fff0a0" },
  { key: "Thunder", short: "THN", label: "Thunder", color: "#7377d0", glowColor: "#a9b0ff" },
  { key: "Variable", short: "VAR", label: "Variable", color: "#8d857a", glowColor: "#c8beb0" },
];

export const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "action", short: "A", label: "Action", color: "#b47d3b" },
  { key: "bonus-action", short: "BA", label: "Bonus Action", color: "#c58e4c" },
  { key: "reaction", short: "R", label: "Reaction", color: "#d0a45a" },
  { key: "concentration", short: "CON", label: "Concentration", color: "#8567ad" },
  { key: "cantrip", short: "CAN", label: "Cantrip use", color: "#6c9fa4" },
  { key: "slot-1", short: "I", label: "Spell slot level 1", color: "#8f4d55" },
  { key: "slot-2", short: "II", label: "Spell slot level 2", color: "#a05a61" },
  { key: "slot-3", short: "III", label: "Spell slot level 3", color: "#b1686d" },
  { key: "slot-4", short: "IV", label: "Spell slot level 4", color: "#bf797b" },
  { key: "slot-5", short: "V", label: "Spell slot level 5", color: "#cc8b88" },
  { key: "slot-6", short: "VI", label: "Spell slot level 6", color: "#d89d95" },
  { key: "pact", short: "PACT", label: "Pact Magic slot use", color: "#935aa0" },
  { key: "short-rest", short: "SR", label: "Short-rest reliance", color: "#5aa087" },
  { key: "long-rest", short: "LR", label: "Long-rest reliance", color: "#7aa563" },
  { key: "class-resource", short: "CLS", label: "Class-specific pool reliance", color: "#5a80a0" },
  { key: "passive-conditional", short: "P/C", label: "Passive / conditional", color: "#9a774b" },
];
