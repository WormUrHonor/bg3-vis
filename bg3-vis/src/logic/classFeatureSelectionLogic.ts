import type { BG3ClassFeature } from "../data/bg3ClassFeatures";

export function getFixedClassFeatureIds(
  availableFeatures: BG3ClassFeature[]
): string[] {
  return availableFeatures
    .filter((feature) => feature.isFixed && !feature.isInformational)
    .map((feature) => feature.id);
}

export function cleanSelectedClassFeatureIds(
  selectedFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const availableSelectableIds = availableFeatures
    .filter((feature) => !feature.isFixed && !feature.isInformational)
    .map((feature) => feature.id);

  return selectedFeatureIds.filter((featureId) =>
    availableSelectableIds.includes(featureId)
  );
}

export function cleanActiveClassFeatureIds(
  activeFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const activeCapableIds = availableFeatures
    .filter((feature) => feature.activeGroupId && !feature.isInformational)
    .map((feature) => feature.id);

  return activeFeatureIds.filter((featureId) =>
    activeCapableIds.includes(featureId)
  );
}

function hasFeatureConflict(
  feature: BG3ClassFeature,
  selectedFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): boolean {
  const directConflicts = feature.conflictsWithFeatureIds ?? [];

  if (directConflicts.some((id) => selectedFeatureIds.includes(id))) {
    return true;
  }

  return selectedFeatureIds.some((selectedId) => {
    const selectedFeature = availableFeatures.find(
      (item) => item.id === selectedId
    );

    return selectedFeature?.conflictsWithFeatureIds?.includes(feature.id) ?? false;
  });
}

export function toggleClassFeatureSelection(
  featureId: string,
  selectedFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const feature = availableFeatures.find((item) => item.id === featureId);

  if (!feature || feature.isFixed || feature.isInformational) {
    return selectedFeatureIds;
  }

  if (selectedFeatureIds.includes(featureId)) {
    return selectedFeatureIds.filter((id) => id !== featureId);
  }

  if (hasFeatureConflict(feature, selectedFeatureIds, availableFeatures)) {
    return selectedFeatureIds;
  }

  if (feature.choiceGroupId) {
    const max = feature.choiceGroupMax ?? 1;

    const selectedInSameGroup = selectedFeatureIds.filter((selectedId) => {
      const selectedFeature = availableFeatures.find(
        (item) => item.id === selectedId
      );

      return selectedFeature?.choiceGroupId === feature.choiceGroupId;
    });

    if (selectedInSameGroup.length >= max) {
      return selectedFeatureIds;
    }
  }

  return [...selectedFeatureIds, featureId];
}

export function toggleActiveClassFeatureSelection(
  featureId: string,
  activeFeatureIds: string[],
  availableFeatures: BG3ClassFeature[]
): string[] {
  const feature = availableFeatures.find((item) => item.id === featureId);

  if (!feature || feature.isInformational || !feature.activeGroupId) {
    return activeFeatureIds;
  }

  if (activeFeatureIds.includes(featureId)) {
    return activeFeatureIds.filter((id) => id !== featureId);
  }

  const max = feature.activeGroupMax ?? 1;

  const activeInSameGroup = activeFeatureIds.filter((activeId) => {
    const activeFeature = availableFeatures.find((item) => item.id === activeId);

    return activeFeature?.activeGroupId === feature.activeGroupId;
  });

  if (activeInSameGroup.length >= max) {
    const activeInDifferentGroups = activeFeatureIds.filter((activeId) => {
      const activeFeature = availableFeatures.find((item) => item.id === activeId);

      return activeFeature?.activeGroupId !== feature.activeGroupId;
    });

    return [...activeInDifferentGroups, featureId];
  }

  return [...activeFeatureIds, featureId];
}