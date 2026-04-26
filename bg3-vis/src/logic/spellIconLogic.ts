import type { BG3Spell } from "../data/bg3Spells";

// optional fallback
import fallbackIcon from "../assets/Spell Icons/Spell_Evocation_Fireball.png";

// normalize "Animal Friendship" → "AnimalFriendship"
function normalizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

// extract school from filename patterns you downloaded
// if you want strict matching later, you can store this in the data instead
function guessSchool(spell: BG3Spell): string {
  // quick heuristic fallback
  if (spell.damageTypes.includes("Fire")) return "Evocation";
  if (spell.damageTypes.includes("Necrotic")) return "Necromancy";
  if (spell.roles.includes("control")) return "Enchantment";
  return "Evocation"; // safe default
}

export function getSpellIcon(spell: BG3Spell): string {
  const override = iconOverrides[spell.id];

  if (override) {
    return new URL(
      `../assets/Spell Icons/${override}`,
      import.meta.url
    ).href;
  }

  try {
    const normalized = normalizeName(spell.name);
    const school = guessSchool(spell);

    return new URL(
      `../assets/Spell Icons/Spell_${school}_${normalized}.png`,
      import.meta.url
    ).href;
  } catch {
    return fallbackIcon;
  }
}
const iconOverrides: Record<string, string> = {
  "create-or-destroy-water": "Spell_Transmutation_CreateWater.png",
  "command": "Spell_Enchantment_CommandHalt.png",
  "branding-smite": "Spell_Evocation_BrandingSmite_Melee.png",
  "ensnaring-strike-melee": "Spell_Conjuration_EnsnaringStrikeMelee.png",
  "ensnaring-strike-ranged": "Spell_Conjuration_EnsnaringStrikeRanged.png",
};