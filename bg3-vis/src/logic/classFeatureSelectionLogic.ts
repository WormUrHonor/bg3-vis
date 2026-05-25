import type { BG3ClassFeature } from "../data/bg3ClassFeatures";

export function getFixedClassFeatureIds(
  availableFeatures: BG3ClassFeature[]
): string[] {
  return availableFeatures
    .filter((feature) => feature.isFixed)
    .map((feature) => feature.id);
}

export function cleanSelectedClassFeatureIds(
  selectedFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const availableSelectableIds = availableFeatures
    .filter((feature) => !feature.isFixed)
    .map((feature) => feature.id);

  return selectedFeatureIds.filter((featureId) =>
    availableSelectableIds.includes(featureId)
  );
}

export function toggleClassFeatureSelection(
  featureId: string,
  selectedFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const feature = availableFeatures.find((item) => item.id === featureId);

  if (!feature || feature.isFixed) {
    return selectedFeatureIds;
  }

  if (selectedFeatureIds.includes(featureId)) {
    return selectedFeatureIds.filter((id) => id !== featureId);
  }

  if (feature.choiceGroupId) {
    const max = feature.choiceGroupMax ?? 1;

    const selectedInSameGroup = selectedFeatureIds.filter((selectedId) => {
      const selectedFeature = availableFeatures.find((item) => item.id === selectedId);
      return selectedFeature?.choiceGroupId === feature.choiceGroupId;
    });

    if (selectedInSameGroup.length >= max) {
      return selectedFeatureIds;
    }
  }

  return [...selectedFeatureIds, featureId];
}