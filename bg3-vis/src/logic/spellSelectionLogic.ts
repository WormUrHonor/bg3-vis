import type { BG3Spell } from "../data/bg3Spells";
import type { ActiveSpellChoiceRule } from "../data/spellChoiceRules";
import {
  getSelectedSpellIdsForRule,
  getSpellChoiceRuleForSpell,
} from "../data/spellChoiceRules";
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
  availableSpellIds: string[],
  activeSpellChoiceRules: ActiveSpellChoiceRule[] = []
): string[] {
  const availableSelectedIds = selectedSpellIds.filter((spellId) =>
    availableSpellIds.includes(spellId)
  );

  if (activeSpellChoiceRules.length === 0) {
    return availableSelectedIds;
  }

  const cleanedIds: string[] = [];

  for (const spellId of availableSelectedIds) {
    const rule = getSpellChoiceRuleForSpell(spellId, activeSpellChoiceRules);

    if (!rule) {
      cleanedIds.push(spellId);
      continue;
    }

    const alreadySelectedInRule = getSelectedSpellIdsForRule(cleanedIds, rule);

    if (alreadySelectedInRule.length < rule.max) {
      cleanedIds.push(spellId);
    }
  }

  return cleanedIds;
}

export function toggleSpellSelection(
  spellId: string,
  selectedSpellIds: string[],
  availableSpellIds: string[],
  activeSpellChoiceRules: ActiveSpellChoiceRule[] = []
): string[] {
  if (!availableSpellIds.includes(spellId)) {
    return selectedSpellIds;
  }

  if (selectedSpellIds.includes(spellId)) {
    return selectedSpellIds.filter((id) => id !== spellId);
  }

  const rule = getSpellChoiceRuleForSpell(spellId, activeSpellChoiceRules);

  if (rule) {
    const selectedInRule = getSelectedSpellIdsForRule(selectedSpellIds, rule);

    if (selectedInRule.length >= rule.max) {
      return selectedSpellIds;
    }
  }

  return [...selectedSpellIds, spellId];
}