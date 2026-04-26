import type { BG3Spell } from "../data/bg3Spells";
import type { ClassName, WarlockInvocation } from "../types/buildPlannerTypes";
import { getAvailableSpellsForBuild } from "../data/bg3SpellAvailability";

export function getAvailableSpellIdsForBuild(
  spells: BG3Spell[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  selectedWarlockInvocations: WarlockInvocation[]
): string[] {
  return getAvailableSpellsForBuild(
    spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  ).map((spell) => spell.id);
}

export function cleanSelectedSpellIds(
  selectedSpellIds: string[],
  availableSpellIds: string[]
): string[] {
  return selectedSpellIds.filter((spellId) => availableSpellIds.includes(spellId));
}

export function toggleSpellSelection(
  spellId: string,
  selectedSpellIds: string[],
  availableSpellIds: string[]
): string[] {
  if (!availableSpellIds.includes(spellId)) {
    return selectedSpellIds;
  }

  if (selectedSpellIds.includes(spellId)) {
    return selectedSpellIds.filter((id) => id !== spellId);
  }

  return [...selectedSpellIds, spellId];
}