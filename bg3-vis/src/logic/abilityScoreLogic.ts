import type { AbilityScore } from "../types/buildPlannerTypes";
import { abilityScores, pointBuyCost } from "../data/bg3CharacterData";

export const defaultAbilityScores: Record<AbilityScore, number> = {
  Strength: 8,
  Dexterity: 8,
  Constitution: 8,
  Intelligence: 8,
  Wisdom: 8,
  Charisma: 8,
};

export function calculateUsedPointBuyPoints(
  scores: Record<AbilityScore, number>
) {
  return abilityScores.reduce((sum, score) => sum + pointBuyCost[scores[score]], 0);
}

export function calculateAbilityBonus(
  score: AbilityScore,
  bonusPlusTwo: AbilityScore | "",
  bonusPlusOne: AbilityScore | "",
  featIncreases: Partial<Record<AbilityScore, number>>
) {
  let bonus = 0;

  if (bonusPlusTwo === score) bonus += 2;
  if (bonusPlusOne === score) bonus += 1;
  bonus += featIncreases[score] ?? 0;

  return bonus;
}

export function calculateFinalAbilityScores(
  baseScores: Record<AbilityScore, number>,
  bonusPlusTwo: AbilityScore | "",
  bonusPlusOne: AbilityScore | "",
  featIncreases: Partial<Record<AbilityScore, number>>
): Record<AbilityScore, number> {
  return abilityScores.reduce((result, score) => {
    const total =
      baseScores[score] +
      calculateAbilityBonus(score, bonusPlusTwo, bonusPlusOne, featIncreases);

    result[score] = Math.min(20, total);
    return result;
  }, {} as Record<AbilityScore, number>);
}