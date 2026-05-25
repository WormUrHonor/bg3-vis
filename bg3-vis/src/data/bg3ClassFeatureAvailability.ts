import type { ClassName } from "../types/buildPlannerTypes";
import type { BG3ClassFeature } from "./bg3ClassFeatures";

function classLevelSubclassMatch(
  feature: BG3ClassFeature,
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): boolean {
  if (!selectedClass) return false;

  return feature.availability.some((source) => {
    const classMatches = source.className === selectedClass;
    const minLevelMatches = selectedLevel >= source.minLevel;
    const maxLevelMatches =
      source.maxLevel === undefined || selectedLevel <= source.maxLevel;
    const levelMatches = minLevelMatches && maxLevelMatches;
    const subclassMatches = !source.subclass || source.subclass === selectedSubclass;

    return classMatches && levelMatches && subclassMatches;
  });
}

function dependencyMatch(
  feature: BG3ClassFeature,
  activeFeatureIds: string[]
): boolean {
  const requiredIds = feature.requiredFeatureIds ?? [];

  if (requiredIds.length === 0) return true;

  const mode = feature.dependencyMode ?? "all";

  if (mode === "any") {
    return requiredIds.some((id) => activeFeatureIds.includes(id));
  }

  return requiredIds.every((id) => activeFeatureIds.includes(id));
}

export function getAvailableClassFeaturesForBuild(
  features: BG3ClassFeature[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  selectedClassFeatureIds: string[] = []
): BG3ClassFeature[] {
  const baseAvailableFeatures = features.filter((feature) =>
    classLevelSubclassMatch(feature, selectedClass, selectedSubclass, selectedLevel)
  );

  const activeFeatureIds = new Set<string>(selectedClassFeatureIds);

  let changed = true;

  while (changed) {
    changed = false;

    for (const feature of baseAvailableFeatures) {
      if (!feature.isFixed) continue;
      if (feature.isInformational) continue;
      if (activeFeatureIds.has(feature.id)) continue;
      if (!dependencyMatch(feature, Array.from(activeFeatureIds))) continue;

      activeFeatureIds.add(feature.id);
      changed = true;
    }
  }

  return baseAvailableFeatures.filter((feature) =>
    dependencyMatch(feature, Array.from(activeFeatureIds))
  );
}

export function isClassFeatureAvailableForBuild(
  feature: BG3ClassFeature,
  features: BG3ClassFeature[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  selectedClassFeatureIds: string[] = []
): boolean {
  return getAvailableClassFeaturesForBuild(
    features,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedClassFeatureIds
  ).some((availableFeature) => availableFeature.id === feature.id);
}