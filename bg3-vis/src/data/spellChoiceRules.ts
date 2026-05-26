import type { ClassName } from "../types/buildPlannerTypes";
import type { BG3Spell } from "./bg3Spells";
import {
  ARCANE_TRICKSTER_ANY_SCHOOL_SPELL_IDS,
  ARCANE_TRICKSTER_CANTRIP_IDS,
  ARCANE_TRICKSTER_ENCHANTMENT_ILLUSION_SPELL_IDS,
  ROGUE_ARCANE_TRICKSTER_ANY_SPELL_TAG,
  ROGUE_ARCANE_TRICKSTER_CANTRIP_TAG,
  ROGUE_ARCANE_TRICKSTER_RESTRICTED_SPELL_TAG,
} from "./rogueArcaneTricksterSpells";
import {
  BARD_MAGICAL_SECRET_TAG,
  MAGICAL_SECRET_SPELL_IDS,
} from "./bardMagicalSecrets";

export type SpellChoiceRuleDefinition = {
  id: string;
  label: string;
  className: ClassName;
  subclass?: string;
  minLevel: number;
  maxLevel?: number;
  spellIds?: string[];
  ranks?: number[];
  includeTags?: string[];
  excludeTags?: string[];
  maxByLevel: {
    minLevel: number;
    max: number;
  }[];
  displayGroupLabel?: string;
  displayGroupOrder?: number;
};

export type ActiveSpellChoiceRule = {
  id: string;
  label: string;
  max: number;
  spellIds: string[];
  displayGroupLabel: string;
  displayGroupOrder: number;
};

const eldritchKnightCantripIds = [
  "acid-splash",
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "bursting-sinew",
  "dancing-lights",
  "fire-bolt",
  "friends",
  "light",
  "mage-hand",
  "minor-illusion",
  "poison-spray",
  "ray-of-frost",
  "shocking-grasp",
  "toll-the-dead",
  "true-strike",
];

const DRUID_CANTRIP_IDS = [
  "guidance",
  "poison-spray",
  "produce-flame",
  "resistance",
  "shillelagh",
  "thorn-whip",
];

const DRUID_SPELL_IDS = [
  "animal-friendship",
  "charm-person",
  "create-or-destroy-water",
  "cure-wounds",
  "enhance-leap",
  "entangle",
  "faerie-fire",
  "fog-cloud",
  "goodberry",
  "healing-word",
  "ice-knife",
  "longstrider",
  "speak-with-animals",
  "thunderwave",

  "barkskin",
  "darkvision",
  "enhance-ability",
  "flame-blade",
  "flaming-sphere",
  "gust-of-wind",
  "heat-metal",
  "hold-person",
  "lesser-restoration",
  "moonbeam",
  "pass-without-trace",
  "protection-from-poison",
  "spike-growth",

  "call-lightning",
  "daylight",
  "feign-death",
  "plant-growth",
  "protection-from-energy",
  "sleet-storm",

  "blight",
  "confusion",
  "conjure-minor-elemental",
  "conjure-woodland-being",
  "dominate-beast",
  "freedom-of-movement",
  "grasping-vine",
  "ice-storm",
  "polymorph",
  "stoneskin",
  "wall-of-fire",

  "conjure-elemental",
  "contagion",
  "greater-restoration",
  "insect-plague",
  "mass-cure-wounds",
  "planar-binding",
  "wall-of-stone",

  "heal",
  "heroes-feast",
  "sunbeam",
  "wall-of-thorns",
  "wind-walk",
];

const WARLOCK_CANTRIP_IDS = [
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "eldritch-blast",
  "friends",
  "mage-hand",
  "minor-illusion",
  "poison-spray",
  "toll-the-dead",
  "true-strike",
];

const WARLOCK_SPELL_IDS = [
  "armour-of-agathys",
  "arms-of-hadar",
  "charm-person",
  "expeditious-retreat",
  "hellish-rebuke",
  "hex",
  "protection-from-evil-and-good",
  "witch-bolt",

  "cloud-of-daggers",
  "crown-of-madness",
  "darkness",
  "enthrall",
  "hold-person",
  "invisibility",
  "mirror-image",
  "misty-step",
  "ray-of-enfeeblement",
  "shadow-blade",
  "shatter",

  "counterspell",
  "fear",
  "gaseous-form",
  "grant-flight",
  "hunger-of-hadar",
  "hypnotic-pattern",
  "remove-curse",
  "vampiric-touch",

  "banishment",
  "blight",
  "dimension-door",

  "hold-monster",

  "faerie-fire",
  "sleep",
  "calm-emotions",
  "phantasmal-force",
  "blink",
  "plant-growth",
  "dominate-beast",
  "greater-invisibility",
  "dominate-person",
  "seeming",

  "burning-hands",
  "command",
  "blindness",
  "scorching-ray",
  "fireball",
  "stinking-cloud",
  "wall-of-fire",
  "fire-shield",
  "cone-of-cold",
  "flame-strike",

  "dissonant-whispers",
  "tashas-hideous-laughter",
  "detect-thoughts",
  "bestow-curse",
  "slow",
  "evards-black-tentacles",
  "telekinesis",

  "shield",
  "wrathful-smite",
  "blur",
  "branding-smite",
  "elemental-weapon",
  "phantasmal-killer",
  "staggering-smite",
  "banishing-smite",
];

const WARLOCK_MYSTIC_ARCANUM_IDS = [
  "arcane-gate",
  "circle-of-death",
  "create-undead",
  "eyebite",
  "flesh-to-stone",
];

const SORCERER_CANTRIP_IDS = [
  "acid-splash",
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "bursting-sinew",
  "dancing-lights",
  "fire-bolt",
  "friends",
  "light",
  "mage-hand",
  "minor-illusion",
  "poison-spray",
  "ray-of-frost",
  "shocking-grasp",
  "true-strike",
];

const SORCERER_SPELL_IDS = [
  "burning-hands",
  "charm-person",
  "chromatic-orb",
  "colour-spray",
  "disguise-self",
  "enhance-leap",
  "expeditious-retreat",
  "false-life",
  "feather-fall",
  "fog-cloud",
  "ice-knife",
  "mage-armour",
  "magic-missile",
  "ray-of-sickness",
  "shield",
  "sleep",
  "thunderwave",
  "witch-bolt",

  "blindness",
  "blur",
  "cloud-of-daggers",
  "crown-of-madness",
  "darkness",
  "darkvision",
  "detect-thoughts",
  "enhance-ability",
  "enlarge-reduce",
  "gust-of-wind",
  "hold-person",
  "invisibility",
  "knock",
  "mirror-image",
  "misty-step",
  "phantasmal-force",
  "scorching-ray",
  "see-invisibility",
  "shadow-blade",
  "shatter",
  "web",

  "blink",
  "counterspell",
  "daylight",
  "fear",
  "fireball",
  "gaseous-form",
  "grant-flight",
  "haste",
  "hypnotic-pattern",
  "lightning-bolt",
  "protection-from-energy",
  "sleet-storm",
  "slow",
  "stinking-cloud",

  "banishment",
  "blight",
  "confusion",
  "dimension-door",
  "dominate-beast",
  "greater-invisibility",
  "ice-storm",
  "polymorph",
  "stoneskin",
  "wall-of-fire",

  "cloudkill",
  "cone-of-cold",
  "dominate-person",
  "hold-monster",
  "insect-plague",
  "seeming",
  "telekinesis",
  "wall-of-stone",

  "arcane-gate",
  "chain-lightning",
  "circle-of-death",
  "disintegrate",
  "eyebite",
  "globe-of-invulnerability",
  "sunbeam",
];

export const spellChoiceRuleDefinitions: SpellChoiceRuleDefinition[] = [
  {
  id: "sorcerer-cantrips",
  label: "Sorcerer Cantrips",
  className: "Sorcerer",
  minLevel: 1,
  ranks: [0],
  spellIds: SORCERER_CANTRIP_IDS,
  maxByLevel: [
    { minLevel: 1, max: 4 },
    { minLevel: 4, max: 5 },
    { minLevel: 10, max: 6 },
  ],
  displayGroupLabel: "Sorcerer Cantrip Choices",
  displayGroupOrder: 10,
},

{
  id: "sorcerer-known-spells",
  label: "Sorcerer Known Spells",
  className: "Sorcerer",
  minLevel: 1,
  ranks: [1, 2, 3, 4, 5, 6],
  spellIds: SORCERER_SPELL_IDS,
  maxByLevel: [
    { minLevel: 1, max: 2 },
    { minLevel: 2, max: 3 },
    { minLevel: 3, max: 4 },
    { minLevel: 4, max: 5 },
    { minLevel: 5, max: 6 },
    { minLevel: 6, max: 7 },
    { minLevel: 7, max: 8 },
    { minLevel: 8, max: 9 },
    { minLevel: 9, max: 10 },
    { minLevel: 10, max: 11 },
    { minLevel: 11, max: 12 },
    { minLevel: 12, max: 13 },
  ],
  displayGroupLabel: "Sorcerer Spell Choices",
  displayGroupOrder: 20,
},
  {
    id: "bard-cantrips",
    label: "Bard Cantrips",
    className: "Bard",
    minLevel: 1,
    ranks: [0],
    excludeTags: [BARD_MAGICAL_SECRET_TAG],
    maxByLevel: [
      { minLevel: 1, max: 2 },
      { minLevel: 4, max: 3 },
      { minLevel: 10, max: 4 },
    ],
    displayGroupLabel: "Bard Cantrip Choices",
    displayGroupOrder: 10,
  },

  {
    id: "bard-known-spells",
    label: "Bard Known Spells",
    className: "Bard",
    minLevel: 1,
    ranks: [1, 2, 3, 4, 5, 6],
    excludeTags: [BARD_MAGICAL_SECRET_TAG],
    maxByLevel: [
      { minLevel: 1, max: 4 },
      { minLevel: 2, max: 5 },
      { minLevel: 3, max: 6 },
      { minLevel: 4, max: 7 },
      { minLevel: 5, max: 8 },
      { minLevel: 6, max: 9 },
      { minLevel: 7, max: 10 },
      { minLevel: 8, max: 11 },
      { minLevel: 9, max: 12 },
      { minLevel: 10, max: 13 },
      { minLevel: 11, max: 14 },
      { minLevel: 12, max: 15 },
    ],
    displayGroupLabel: "Bard Spell Choices",
    displayGroupOrder: 20,
  },

  {
    id: "bard-lore-magical-secrets-level-6",
    label: "Lore Magical Secrets",
    className: "Bard",
    subclass: "College of Lore",
    minLevel: 6,
    ranks: [0, 1, 2, 3],
    spellIds: MAGICAL_SECRET_SPELL_IDS,
    includeTags: [BARD_MAGICAL_SECRET_TAG],
    maxByLevel: [{ minLevel: 6, max: 2 }],
    displayGroupLabel: "Lore Magical Secrets",
    displayGroupOrder: 30,
  },

  {
    id: "bard-magical-secrets-level-10",
    label: "Magical Secrets",
    className: "Bard",
    minLevel: 10,
    ranks: [0, 1, 2, 3, 4, 5],
    spellIds: MAGICAL_SECRET_SPELL_IDS,
    includeTags: [BARD_MAGICAL_SECRET_TAG],
    maxByLevel: [{ minLevel: 10, max: 2 }],
    displayGroupLabel: "Magical Secrets",
    displayGroupOrder: 40,
  },

  {
    id: "druid-cantrips",
    label: "Druid Cantrips",
    className: "Druid",
    minLevel: 1,
    ranks: [0],
    spellIds: DRUID_CANTRIP_IDS,
    maxByLevel: [
      { minLevel: 1, max: 2 },
      { minLevel: 4, max: 3 },
      { minLevel: 10, max: 4 },
    ],
    displayGroupLabel: "Druid Cantrip Choices",
    displayGroupOrder: 10,
  },

  {
    id: "druid-prepared-spells",
    label: "Druid Prepared Spells",
    className: "Druid",
    minLevel: 1,
    ranks: [1, 2, 3, 4, 5, 6],
    spellIds: DRUID_SPELL_IDS,
    maxByLevel: [
      { minLevel: 1, max: 4 },
      { minLevel: 2, max: 5 },
      { minLevel: 3, max: 6 },
      { minLevel: 4, max: 7 },
      { minLevel: 5, max: 8 },
      { minLevel: 6, max: 9 },
      { minLevel: 7, max: 10 },
      { minLevel: 8, max: 11 },
      { minLevel: 9, max: 12 },
      { minLevel: 10, max: 13 },
      { minLevel: 11, max: 14 },
      { minLevel: 12, max: 15 },
    ],
    displayGroupLabel: "Druid Prepared Spells",
    displayGroupOrder: 20,
  },

  {
    id: "fighter-arcane-archer-cantrip",
    label: "Arcane Archer Cantrip",
    className: "Fighter",
    subclass: "Arcane Archer",
    minLevel: 3,
    spellIds: ["guidance", "light", "true-strike"],
    maxByLevel: [{ minLevel: 3, max: 1 }],
    displayGroupLabel: "Arcane Archer Cantrip Choice",
    displayGroupOrder: 10,
  },

  {
    id: "fighter-eldritch-knight-cantrips",
    label: "Eldritch Knight Cantrips",
    className: "Fighter",
    subclass: "Eldritch Knight",
    minLevel: 3,
    spellIds: eldritchKnightCantripIds,
    maxByLevel: [
      { minLevel: 3, max: 2 },
      { minLevel: 10, max: 3 },
    ],
    displayGroupLabel: "Eldritch Knight Cantrip Choices",
    displayGroupOrder: 10,
  },

  {
    id: "fighter-eldritch-knight-spells",
    label: "Eldritch Knight Spells",
    className: "Fighter",
    subclass: "Eldritch Knight",
    minLevel: 3,
    ranks: [1, 2],
    maxByLevel: [
      { minLevel: 3, max: 3 },
      { minLevel: 4, max: 4 },
      { minLevel: 7, max: 5 },
      { minLevel: 8, max: 6 },
      { minLevel: 10, max: 7 },
      { minLevel: 11, max: 8 },
    ],
    displayGroupLabel: "Eldritch Knight Spell Choices",
    displayGroupOrder: 20,
  },

  {
    id: "paladin-prepared-spells",
    label: "Paladin Prepared Spells",
    className: "Paladin",
    minLevel: 2,
    ranks: [1, 2, 3],
    maxByLevel: [{ minLevel: 2, max: 2 }],
    displayGroupLabel: "Paladin Prepared Spell Choices",
    displayGroupOrder: 20,
  },

  {
    id: "ranger-known-spells",
    label: "Ranger Known Spells",
    className: "Ranger",
    minLevel: 2,
    ranks: [1, 2, 3],
    maxByLevel: [
      { minLevel: 2, max: 2 },
      { minLevel: 3, max: 3 },
      { minLevel: 5, max: 4 },
      { minLevel: 7, max: 5 },
      { minLevel: 9, max: 6 },
      { minLevel: 11, max: 7 },
    ],
    displayGroupLabel: "Ranger Spell Choices",
    displayGroupOrder: 20,
  },

  {
    id: "rogue-arcane-trickster-cantrips",
    label: "Arcane Trickster Cantrips",
    className: "Rogue",
    subclass: "Arcane Trickster",
    minLevel: 3,
    ranks: [0],
    spellIds: ARCANE_TRICKSTER_CANTRIP_IDS,
    includeTags: [ROGUE_ARCANE_TRICKSTER_CANTRIP_TAG],
    maxByLevel: [
      { minLevel: 3, max: 2 },
      { minLevel: 10, max: 3 },
    ],
    displayGroupLabel: "Arcane Trickster Cantrip Choices",
    displayGroupOrder: 10,
  },

  {
    id: "rogue-arcane-trickster-enchantment-illusion-spells",
    label: "Arcane Trickster Enchantment / Illusion Spells",
    className: "Rogue",
    subclass: "Arcane Trickster",
    minLevel: 3,
    ranks: [1, 2],
    spellIds: ARCANE_TRICKSTER_ENCHANTMENT_ILLUSION_SPELL_IDS,
    includeTags: [ROGUE_ARCANE_TRICKSTER_RESTRICTED_SPELL_TAG],
    maxByLevel: [
      { minLevel: 3, max: 2 },
      { minLevel: 4, max: 3 },
      { minLevel: 7, max: 4 },
      { minLevel: 10, max: 5 },
      { minLevel: 11, max: 6 },
    ],
    displayGroupLabel: "Arcane Trickster Enchantment / Illusion Choices",
    displayGroupOrder: 20,
  },

  {
    id: "rogue-arcane-trickster-any-school-spells",
    label: "Arcane Trickster Any-School Spells",
    className: "Rogue",
    subclass: "Arcane Trickster",
    minLevel: 3,
    ranks: [1, 2],
    spellIds: ARCANE_TRICKSTER_ANY_SCHOOL_SPELL_IDS,
    includeTags: [ROGUE_ARCANE_TRICKSTER_ANY_SPELL_TAG],
    maxByLevel: [
      { minLevel: 3, max: 1 },
      { minLevel: 8, max: 2 },
    ],
    displayGroupLabel: "Arcane Trickster Any-School Choices",
    displayGroupOrder: 30,
  },

  {
    id: "warlock-cantrips",
    label: "Warlock Cantrips",
    className: "Warlock",
    minLevel: 1,
    ranks: [0],
    spellIds: WARLOCK_CANTRIP_IDS,
    maxByLevel: [
      { minLevel: 1, max: 2 },
      { minLevel: 4, max: 3 },
      { minLevel: 10, max: 4 },
    ],
    displayGroupLabel: "Warlock Cantrip Choices",
    displayGroupOrder: 10,
  },

  {
    id: "warlock-spells-known",
    label: "Warlock Spells Known",
    className: "Warlock",
    minLevel: 1,
    ranks: [1, 2, 3, 4, 5],
    spellIds: WARLOCK_SPELL_IDS,
    maxByLevel: [
      { minLevel: 1, max: 2 },
      { minLevel: 2, max: 3 },
      { minLevel: 3, max: 4 },
      { minLevel: 4, max: 5 },
      { minLevel: 5, max: 6 },
      { minLevel: 6, max: 7 },
      { minLevel: 7, max: 8 },
      { minLevel: 8, max: 9 },
      { minLevel: 9, max: 10 },
      { minLevel: 10, max: 11 },
      { minLevel: 11, max: 12 },
      { minLevel: 12, max: 13 },
    ],
    displayGroupLabel: "Warlock Spell Choices",
    displayGroupOrder: 20,
  },

  {
    id: "warlock-mystic-arcanum",
    label: "Mystic Arcanum",
    className: "Warlock",
    minLevel: 11,
    ranks: [6],
    spellIds: WARLOCK_MYSTIC_ARCANUM_IDS,
    maxByLevel: [{ minLevel: 11, max: 1 }],
    displayGroupLabel: "Mystic Arcanum Choice",
    displayGroupOrder: 30,
  },
];

function ruleAppliesToBuild(
  rule: SpellChoiceRuleDefinition,
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): boolean {
  if (!selectedClass) return false;

  const classMatches = rule.className === selectedClass;
  const subclassMatches = !rule.subclass || rule.subclass === selectedSubclass;
  const minLevelMatches = selectedLevel >= rule.minLevel;
  const maxLevelMatches =
    rule.maxLevel === undefined || selectedLevel <= rule.maxLevel;

  return classMatches && subclassMatches && minLevelMatches && maxLevelMatches;
}

function getMaxForLevel(
  rule: SpellChoiceRuleDefinition,
  selectedLevel: number,
  maxOverrides: Record<string, number> = {}
): number {
  const override = maxOverrides[rule.id];

  if (override !== undefined) {
    return override;
  }

  const matchingEntries = rule.maxByLevel
    .filter((entry) => selectedLevel >= entry.minLevel)
    .sort((a, b) => b.minLevel - a.minLevel);

  return matchingEntries[0]?.max ?? 0;
}

function spellHasTag(spell: BG3Spell, tagName: string): boolean {
  return spell.tags?.some((tag) => tag === tagName) ?? false;
}

function getSpellIdsForRule(
  rule: SpellChoiceRuleDefinition,
  availableSpells: BG3Spell[]
): string[] {
  return availableSpells
    .filter((spell) => {
      if (rule.ranks && !rule.ranks.includes(spell.rank)) {
        return false;
      }

      if (rule.spellIds && !rule.spellIds.includes(spell.id)) {
        return false;
      }

      if (
        rule.includeTags &&
        !rule.includeTags.every((tag) => spellHasTag(spell, tag))
      ) {
        return false;
      }

      if (
        rule.excludeTags &&
        rule.excludeTags.some((tag) => spellHasTag(spell, tag))
      ) {
        return false;
      }

      return true;
    })
    .map((spell) => spell.id);
}

export function getActiveSpellChoiceRulesForBuild(
  availableSpells: BG3Spell[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  maxOverrides: Record<string, number> = {}
): ActiveSpellChoiceRule[] {
  return spellChoiceRuleDefinitions
    .filter((rule) =>
      ruleAppliesToBuild(rule, selectedClass, selectedSubclass, selectedLevel)
    )
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      max: getMaxForLevel(rule, selectedLevel, maxOverrides),
      spellIds: getSpellIdsForRule(rule, availableSpells),
      displayGroupLabel: rule.displayGroupLabel ?? rule.label,
      displayGroupOrder: rule.displayGroupOrder ?? 999,
    }))
    .filter((rule) => rule.max > 0 && rule.spellIds.length > 0);
}

export function getSpellChoiceRuleForSpell(
  spellId: string,
  activeRules: ActiveSpellChoiceRule[]
): ActiveSpellChoiceRule | undefined {
  return activeRules.find((rule) => rule.spellIds.includes(spellId));
}

export function getSelectedSpellIdsForRule(
  selectedSpellIds: string[],
  rule: ActiveSpellChoiceRule
): string[] {
  return selectedSpellIds.filter((spellId) => rule.spellIds.includes(spellId));
}

export function isSpellChoiceGroupFull(
  spellId: string,
  selectedSpellIds: string[],
  activeRules: ActiveSpellChoiceRule[]
): boolean {
  const rule = getSpellChoiceRuleForSpell(spellId, activeRules);

  if (!rule) return false;
  if (selectedSpellIds.includes(spellId)) return false;

  return getSelectedSpellIdsForRule(selectedSpellIds, rule).length >= rule.max;
}