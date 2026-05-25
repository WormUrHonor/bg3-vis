import type { ClassName } from "../../types/buildPlannerTypes";
import type { BG3ClassFeature, ClassFeatureModule } from "./classFeatureTypes";

import { barbarianClassModule } from "./barbarian";
import { fighterClassModule } from "./fighter";

export type {
  BG3ClassFeature,
  ClassFeatureAvailability,
  ClassFeatureChoiceGroup,
  ClassFeatureDependencyMode,
  ClassFeatureDisplayGroup,
  ClassFeatureKind,
  ClassFeatureModule,
  ClassFeatureRange,
} from "./classFeatureTypes";

export const classFeatureModules: ClassFeatureModule[] = [
  barbarianClassModule,
  fighterClassModule,
];

export const bg3ClassFeatures: BG3ClassFeature[] = classFeatureModules.flatMap(
  (module) => module.features
);

export const classFeatureIconFileById: Record<string, string> = Object.assign(
  {},
  ...classFeatureModules.map((module) => module.iconFileByFeatureId)
);

export function getClassFeatureById(id: string): BG3ClassFeature | undefined {
  return bg3ClassFeatures.find((featureEntry) => featureEntry.id === id);
}

export function getClassFeatureTabLabel(
  selectedClass: ClassName | "",
  selectedSubclass: string
): string {
  if (!selectedClass) return "Spells & Abilities";

  const module = classFeatureModules.find(
    (item) => item.className === selectedClass
  );

  if (!module) return "Spells & Abilities";

  return (
    module.subclassTabLabels?.[selectedSubclass] ??
    module.defaultTabLabel ??
    "Spells & Abilities"
  );
}