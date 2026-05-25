import type {
  AbilityScore,
  ClassName,
  FeatName,
  FeatSelection,
  Skill,
} from "../types/buildPlannerTypes";
import { getFeatDefinition } from "../data/bg3Feats";
import { unique } from "./proficiencyLogic";

export function createEmptyFeatSelection(slotLevel: number): FeatSelection {
  return {
    slotLevel,
    featName: "",
    selectedAbility: "",
    secondaryAbility: "",
    selectedSkills: [],
    selectedDamageType: "",
    selectedCantrips: [],
    selectedSpells: [],
    selectedWeaponTypes: [],
    selectedManoeuvres: [],
  };
}

export function getFeatLevelsForClass(
  selectedClass: ClassName | "",
  selectedLevel: number
): number[] {
  if (!selectedClass) return [];

  const featLevels = [4, 8, 12];

  if (selectedClass === "Fighter") {
    featLevels.push(6);
  }

  if (selectedClass === "Rogue") {
    featLevels.push(10);
  }

  return featLevels
    .filter((level) => level <= selectedLevel)
    .sort((a, b) => a - b);
}

export function cleanFeatSelections(
  currentSelections: FeatSelection[],
  featLevels: number[]
): FeatSelection[] {
  return featLevels.map((slotLevel) => {
    const existing = currentSelections.find((selection) => selection.slotLevel === slotLevel);
    return existing ?? createEmptyFeatSelection(slotLevel);
  });
}

export function resetFeatSelection(
  slotLevel: number,
  featName: FeatName | ""
): FeatSelection {
  return {
    ...createEmptyFeatSelection(slotLevel),
    featName,
  };
}

function addAbilityIncrease(
  result: Partial<Record<AbilityScore, number>>,
  ability: AbilityScore | "",
  amount: number
) {
  if (!ability) return;
  result[ability] = (result[ability] ?? 0) + amount;
}

export function getFeatAbilityIncreases(
  featSelections: FeatSelection[]
): Partial<Record<AbilityScore, number>> {
  const result: Partial<Record<AbilityScore, number>> = {};

  featSelections.forEach((selection) => {
    if (!selection.featName) return;

    const feat = getFeatDefinition(selection.featName);
    if (!feat) return;

    if (feat.fixedAbilityIncrease) {
      Object.entries(feat.fixedAbilityIncrease).forEach(([ability, amount]) => {
        if (!amount) return;
        addAbilityIncrease(result, ability as AbilityScore, amount);
      });
    }

    if (feat.choiceKind === "ability-improvement") {
      addAbilityIncrease(result, selection.selectedAbility, 1);
      addAbilityIncrease(result, selection.secondaryAbility, 1);
    }

    if (
      feat.choiceKind === "single-ability" ||
      feat.choiceKind === "resilient" ||
      feat.choiceKind === "weapon-master"
    ) {
      addAbilityIncrease(result, selection.selectedAbility, 1);
    }
  });

  return result;
}

export function getFeatSkillProficiencies(
  featSelections: FeatSelection[]
): Skill[] {
  const result: Skill[] = [];

  featSelections.forEach((selection) => {
    if (!selection.featName) return;

    const feat = getFeatDefinition(selection.featName);
    if (!feat) return;

    if (feat.grantsSkillProficiencies) {
      result.push(...feat.grantsSkillProficiencies);
    }

    if (feat.choiceKind === "skill-proficiencies") {
      result.push(...selection.selectedSkills);
    }
  });

  return unique(result);
}

export function getFeatExpertise(featSelections: FeatSelection[]): Skill[] {
  const result: Skill[] = [];

  featSelections.forEach((selection) => {
    if (!selection.featName) return;

    const feat = getFeatDefinition(selection.featName);
    if (!feat?.grantsSkillExpertise) return;

    result.push(...feat.grantsSkillExpertise);
  });

  return unique(result);
}

export function getFeatSavingThrowProficiencies(
  featSelections: FeatSelection[]
): AbilityScore[] {
  const result: AbilityScore[] = [];

  featSelections.forEach((selection) => {
    if (selection.featName !== "Resilient") return;
    if (!selection.selectedAbility) return;

    result.push(selection.selectedAbility);
  });

  return unique(result);
}

export function describeFeatSelection(selection: FeatSelection): string {
  if (!selection.featName) return "Not selected";

  const details: string[] = [];

  if (selection.selectedAbility) {
    details.push(selection.selectedAbility);
  }

  if (selection.secondaryAbility) {
    details.push(selection.secondaryAbility);
  }

  if (selection.selectedDamageType) {
    details.push(selection.selectedDamageType);
  }

  if (selection.selectedSkills.length > 0) {
    details.push(selection.selectedSkills.join(", "));
  }

  if (selection.selectedSpells.length > 0) {
    details.push(selection.selectedSpells.join(", "));
  }

  if (selection.selectedCantrips.length > 0) {
    details.push(selection.selectedCantrips.join(", "));
  }

  if (selection.selectedWeaponTypes.length > 0) {
    details.push(selection.selectedWeaponTypes.join(", "));
  }

  if (selection.selectedManoeuvres.length > 0) {
    details.push(selection.selectedManoeuvres.join(", "));
  }

  if (details.length === 0) return selection.featName;

  return `${selection.featName}: ${details.join(" · ")}`;
}