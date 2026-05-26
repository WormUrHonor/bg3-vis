import { getSpellById, type BG3Spell } from "./bg3Spells";
import type { ClassName } from "../types/buildPlannerTypes";

export const ROGUE_ARCANE_TRICKSTER_CANTRIP_TAG =
  "rogue-arcane-trickster-cantrip-option";

export const ROGUE_ARCANE_TRICKSTER_RESTRICTED_SPELL_TAG =
  "rogue-arcane-trickster-enchantment-illusion-option";

export const ROGUE_ARCANE_TRICKSTER_ANY_SPELL_TAG =
  "rogue-arcane-trickster-any-school-option";

export const ARCANE_TRICKSTER_CANTRIP_IDS = [
  "acid-splash",
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "bursting-sinew",
  "dancing-lights",
  "fire-bolt",
  "friends",
  "light",
  "minor-illusion",
  "poison-spray",
  "ray-of-frost",
  "shocking-grasp",
  "toll-the-dead",
  "true-strike",
];

export const ARCANE_TRICKSTER_ENCHANTMENT_ILLUSION_SPELL_IDS = [
  "charm-person",
  "colour-spray",
  "disguise-self",
  "sleep",
  "tashas-hideous-laughter",

  "blur",
  "crown-of-madness",
  "hold-person",
  "invisibility",
  "mirror-image",
  "phantasmal-force",
];

export const ARCANE_TRICKSTER_ANY_SCHOOL_SPELL_IDS = [
  "burning-hands",
  "chromatic-orb",
  "enhance-leap",
  "expeditious-retreat",
  "false-life",
  "feather-fall",
  "find-familiar",
  "fog-cloud",
  "grease",
  "ice-knife",
  "longstrider",
  "mage-armour",
  "magic-missile",
  "protection-from-evil-and-good",
  "ray-of-sickness",
  "shield",
  "thunderwave",
  "witch-bolt",

  "arcane-lock",
  "blindness",
  "cloud-of-daggers",
  "darkness",
  "darkvision",
  "detect-thoughts",
  "enlarge-reduce",
  "flaming-sphere",
  "gust-of-wind",
  "knock",
  "magic-weapon",
  "melfs-acid-arrow",
  "misty-step",
  "ray-of-enfeeblement",
  "scorching-ray",
  "see-invisibility",
  "shadow-blade",
  "shatter",
  "web",
];

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function withTag(spell: BG3Spell, tag: string): BG3Spell {
  return {
    ...spell,
    tags: Array.from(new Set([...(spell.tags ?? []), tag])),
  };
}

function getTaggedSpells(spellIds: string[], tag: string, maxRank: number): BG3Spell[] {
  return spellIds
    .map((spellId) => getSpellById(spellId))
    .filter(isDefined)
    .filter((spell) => spell.rank <= maxRank)
    .map((spell) => withTag(spell, tag));
}

export function getAvailableRogueArcaneTricksterSpells(
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): BG3Spell[] {
  if (selectedClass !== "Rogue") return [];
  if (selectedSubclass !== "Arcane Trickster") return [];
  if (selectedLevel < 3) return [];

  const maxRank = selectedLevel >= 7 ? 2 : 1;

  return [
    ...getTaggedSpells(
      ARCANE_TRICKSTER_CANTRIP_IDS,
      ROGUE_ARCANE_TRICKSTER_CANTRIP_TAG,
      0
    ),
    ...getTaggedSpells(
      ARCANE_TRICKSTER_ENCHANTMENT_ILLUSION_SPELL_IDS,
      ROGUE_ARCANE_TRICKSTER_RESTRICTED_SPELL_TAG,
      maxRank
    ),
    ...getTaggedSpells(
      ARCANE_TRICKSTER_ANY_SCHOOL_SPELL_IDS,
      ROGUE_ARCANE_TRICKSTER_ANY_SPELL_TAG,
      maxRank
    ),
  ];
}