import { getSpellById, type BG3Spell } from "./bg3Spells";
import type { ClassName } from "../types/buildPlannerTypes";

export const BARD_MAGICAL_SECRET_TAG = "magical-secret-option";

export const MAGICAL_SECRET_SPELL_IDS = [
  "bone-chill",
  "eldritch-blast",
  "fire-bolt",
  "ray-of-frost",
  "sacred-flame",

  "armour-of-agathys",
  "bless",
  "chromatic-orb",
  "command",
  "entangle",
  "false-life",
  "guiding-bolt",
  "hellish-rebuke",
  "hex",
  "hunters-mark",
  "ice-knife",
  "magic-missile",
  "sanctuary",
  "thunderous-smite",

  "arcane-lock",
  "blur",
  "darkness",
  "darkvision",
  "misty-step",
  "pass-without-trace",
  "ray-of-enfeeblement",
  "scorching-ray",
  "spike-growth",
  "spiritual-weapon",
  "web",

  "animate-dead",
  "call-lightning",
  "counterspell",
  "crusaders-mantle",
  "daylight",
  "fireball",
  "gaseous-form",
  "grant-flight",
  "haste",
  "hunger-of-hadar",
  "lightning-bolt",
  "mass-healing-word",
  "remove-curse",
  "revivify",
  "sleet-storm",
  "slow",
  "spirit-guardians",
  "vampiric-touch",
  "warden-of-vitality",

  "banishment",
  "blight",
  "death-ward",
  "dominate-beast",
  "fire-shield",
  "guardian-of-faith",
  "ice-storm",
  "wall-of-fire",

  "banishing-smite",
  "cone-of-cold",
  "conjure-elemental",
  "contagion",
  "wall-of-stone",
];

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function withMagicalSecretTag(spell: BG3Spell): BG3Spell {
  return {
    ...spell,
    tags: Array.from(new Set([...(spell.tags ?? []), BARD_MAGICAL_SECRET_TAG])),
  };
}

export function getAvailableBardMagicalSecretSpells(
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): BG3Spell[] {
  if (selectedClass !== "Bard") return [];

  const maxRank =
    selectedLevel >= 10
      ? 5
      : selectedSubclass === "College of Lore" && selectedLevel >= 6
        ? 3
        : 0;

  if (maxRank === 0) return [];

  return MAGICAL_SECRET_SPELL_IDS.map((spellId) => getSpellById(spellId))
    .filter(isDefined)
    .filter((spell) => spell.rank <= maxRank)
    .map(withMagicalSecretTag);
}

export function mergeSpellLists(
  baseSpells: BG3Spell[],
  extraSpells: BG3Spell[]
): BG3Spell[] {
  const spellById = new Map<string, BG3Spell>();

  for (const spell of baseSpells) {
    spellById.set(spell.id, spell);
  }

  for (const spell of extraSpells) {
    const existing = spellById.get(spell.id);

    if (!existing) {
      spellById.set(spell.id, spell);
      continue;
    }

    spellById.set(spell.id, {
      ...existing,
      tags: Array.from(new Set([...(existing.tags ?? []), ...(spell.tags ?? [])])),
    });
  }

  return Array.from(spellById.values());
}