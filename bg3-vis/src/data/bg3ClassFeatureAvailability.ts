import type { BG3ClassFeature } from "./bg3ClassFeatures";
import type { ClassName } from "../types/buildPlannerTypes";

function availabilityMatches(
  feature: BG3ClassFeature,
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): boolean {
  return feature.availability.some((availability) => {
    if (!selectedClass) return false;
    if (availability.className !== selectedClass) return false;
    if (selectedLevel < availability.minLevel) return false;

    if (
      availability.maxLevel !== undefined &&
      selectedLevel > availability.maxLevel
    ) {
      return false;
    }

    if (
      availability.subclass !== undefined &&
      availability.subclass !== selectedSubclass
    ) {
      return false;
    }

    return true;
  });
}

function dependenciesMatch(
  feature: BG3ClassFeature,
  ownedFeatureIds: string[]
): boolean {
  const requiredFeatureIds = feature.requiredFeatureIds ?? [];

  if (requiredFeatureIds.length === 0) return true;

  if (feature.dependencyMode === "any") {
    return requiredFeatureIds.some((featureId) =>
      ownedFeatureIds.includes(featureId)
    );
  }

  return requiredFeatureIds.every((featureId) =>
    ownedFeatureIds.includes(featureId)
  );
}

export function getAvailableClassFeaturesForBuild(
  features: BG3ClassFeature[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  selectedFeatureIds: string[] = []
): BG3ClassFeature[] {
  const availabilityMatchedFeatures = features.filter((feature) =>
    availabilityMatches(feature, selectedClass, selectedSubclass, selectedLevel)
  );

  const fixedFeatureIds = availabilityMatchedFeatures
    .filter((feature) => feature.isFixed && !feature.isInformational)
    .map((feature) => feature.id);

  const ownedFeatureIds = Array.from(
    new Set([...fixedFeatureIds, ...selectedFeatureIds])
  );

  return availabilityMatchedFeatures.filter((feature) =>
    dependenciesMatch(feature, ownedFeatureIds)
  );
}