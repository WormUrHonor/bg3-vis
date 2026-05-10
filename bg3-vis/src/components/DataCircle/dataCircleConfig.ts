import type { AbilityRole } from "../../data/bg3Spells";
import type {
  DamageRingKey,
  RangeBandKey,
  ResourceFamily,
  ResourceSectorKey,
} from "./dataCircleTypes";

export const RANGE_BANDS: {
  key: RangeBandKey;
  label: string;
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
}[] = [
  {
    key: "self",
    label: "Self",
    innerRadius: 106,
    outerRadius: 128,
    labelRadius: 117,
  },
  {
    key: "melee",
    label: "Melee",
    innerRadius: 134,
    outerRadius: 156,
    labelRadius: 145,
  },
  {
    key: "mid",
    label: "Mid-range",
    innerRadius: 162,
    outerRadius: 184,
    labelRadius: 173,
  },
  {
    key: "long",
    label: "Long-range",
    innerRadius: 190,
    outerRadius: 212,
    labelRadius: 201,
  },
];

export const RANGE_LABEL_ARC_START = -36;
export const RANGE_LABEL_ARC_END = 36;

export const DAMAGE_ROLE_KEYS: AbilityRole[] = [
  "single-target-damage",
  "area-damage",
];

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
  {
    key: "Bludgeoning",
    short: "BLD",
    label: "Bludgeoning",
    color: "#8c7863",
    glowColor: "#d3b488",
  },
  {
    key: "Piercing",
    short: "PRC",
    label: "Piercing",
    color: "#a48963",
    glowColor: "#e0bf8b",
  },
  {
    key: "Slashing",
    short: "SLS",
    label: "Slashing",
    color: "#b69568",
    glowColor: "#edc98a",
  },
  {
    key: "Physical",
    short: "PHY",
    label: "Physical",
    color: "#c3aa7c",
    glowColor: "#f0d49a",
  },
  {
    key: "Acid",
    short: "ACD",
    label: "Acid",
    color: "#8abf36",
    glowColor: "#b7f05a",
  },
  {
    key: "Cold",
    short: "CLD",
    label: "Cold",
    color: "#7bc9e8",
    glowColor: "#bdeeff",
  },
  {
    key: "Fire",
    short: "FIR",
    label: "Fire",
    color: "#db5a28",
    glowColor: "#ff9858",
  },
  {
    key: "Force",
    short: "FRC",
    label: "Force",
    color: "#c44b62",
    glowColor: "#ff8190",
  },
  {
    key: "Lightning",
    short: "LGT",
    label: "Lightning",
    color: "#d9c731",
    glowColor: "#fff072",
  },
  {
    key: "Necrotic",
    short: "NEC",
    label: "Necrotic",
    color: "#6e9b45",
    glowColor: "#a9d45d",
  },
  {
    key: "Poison",
    short: "POI",
    label: "Poison",
    color: "#4f8f35",
    glowColor: "#8fd85a",
  },
  {
    key: "Psychic",
    short: "PSY",
    label: "Psychic",
    color: "#b05ac4",
    glowColor: "#eaa4ff",
  },
  {
    key: "Radiant",
    short: "RAD",
    label: "Radiant",
    color: "#e4c956",
    glowColor: "#fff0a0",
  },
  {
    key: "Thunder",
    short: "THN",
    label: "Thunder",
    color: "#7377d0",
    glowColor: "#a9b0ff",
  },
  {
    key: "Variable",
    short: "VAR",
    label: "Variable",
    color: "#8d857a",
    glowColor: "#c8beb0",
  },
];

export const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
  glowColor: string;
  family: ResourceFamily;
}[] = [
  {
    key: "action",
    short: "ACT",
    label: "Action",
    color: "#b47d3b",
    glowColor: "#f0b66d",
    family: "action",
  },
  {
    key: "bonus-action",
    short: "BONUS",
    label: "Bonus Action",
    color: "#c58e4c",
    glowColor: "#ffd08a",
    family: "action",
  },
  {
    key: "reaction",
    short: "REACT",
    label: "Reaction",
    color: "#d0a45a",
    glowColor: "#ffe09a",
    family: "action",
  },
  {
    key: "concentration",
    short: "CONC",
    label: "Concentration",
    color: "#8567ad",
    glowColor: "#c3adff",
    family: "focus",
  },
  {
    key: "cantrip",
    short: "CANTRIP",
    label: "Cantrip Use",
    color: "#6c9fa4",
    glowColor: "#a9e7ee",
    family: "spell-slot",
  },
  {
    key: "slot-1",
    short: "I",
    label: "Spell Slot I",
    color: "#7b4b61",
    glowColor: "#d990b0",
    family: "spell-slot",
  },
  {
    key: "slot-2",
    short: "II",
    label: "Spell Slot II",
    color: "#8b5269",
    glowColor: "#e39abb",
    family: "spell-slot",
  },
  {
    key: "slot-3",
    short: "III",
    label: "Spell Slot III",
    color: "#9c5c72",
    glowColor: "#eea7c6",
    family: "spell-slot",
  },
  {
    key: "slot-4",
    short: "IV",
    label: "Spell Slot IV",
    color: "#ac697d",
    glowColor: "#f2b5ce",
    family: "spell-slot",
  },
  {
    key: "slot-5",
    short: "V",
    label: "Spell Slot V",
    color: "#bc798a",
    glowColor: "#f6c4d6",
    family: "spell-slot",
  },
  {
    key: "slot-6",
    short: "VI",
    label: "Spell Slot VI",
    color: "#cc8b98",
    glowColor: "#ffd1df",
    family: "spell-slot",
  },
  {
    key: "pact",
    short: "PACT",
    label: "Pact Magic Slot",
    color: "#935aa0",
    glowColor: "#dfa9ef",
    family: "pact",
  },
  {
    key: "short-rest",
    short: "SHORT",
    label: "Short-rest Reliance",
    color: "#5aa087",
    glowColor: "#9be8cf",
    family: "rest",
  },
  {
    key: "long-rest",
    short: "LONG",
    label: "Long-rest Reliance",
    color: "#7aa563",
    glowColor: "#c3eba0",
    family: "rest",
  },
  {
    key: "class-resource",
    short: "POOL",
    label: "Class-specific Pool",
    color: "#5a80a0",
    glowColor: "#a6caea",
    family: "class",
  },
  {
    key: "passive-conditional",
    short: "PASSIVE",
    label: "Passive / Conditional",
    color: "#9a774b",
    glowColor: "#dfbd82",
    family: "trigger",
  },
];