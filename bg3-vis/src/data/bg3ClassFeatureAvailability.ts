import type { ClassName } from "../types/buildPlannerTypes";
import type { BG3ClassFeature } from "./bg3ClassFeatures";

export function isClassFeatureAvailableForBuild(
  feature: BG3ClassFeature,
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): boolean {
  if (!selectedClass) return false;

  return feature.availability.some((source) => {
    const classMatches = source.className === selectedClass;
    const levelMatches = selectedLevel >= source.minLevel;
    const subclassMatches = !source.subclass || source.subclass === selectedSubclass;

    return classMatches && levelMatches && subclassMatches;
  });
}

export function getAvailableClassFeaturesForBuild(
  features: BG3ClassFeature[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): BG3ClassFeature[] {
  return features.filter((feature) =>
    isClassFeatureAvailableForBuild(
      feature,
      selectedClass,
      selectedSubclass,
      selectedLevel
    )
  );
}