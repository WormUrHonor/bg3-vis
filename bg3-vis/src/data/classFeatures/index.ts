import type { ClassName } from "../../types/buildPlannerTypes";
import type { BG3ClassFeature, ClassFeatureModule } from "./classFeatureTypes";

import { barbarianClassModule } from "./barbarian";
import { bardClassModule } from "./bard";
import { clericClassModule } from "./cleric";
import { druidClassModule } from "./druid";
import { fighterClassModule } from "./fighter";
import { monkClassModule } from "./monk";
import { paladinClassModule } from "./paladin";
import { rangerClassModule } from "./ranger";
import { rogueClassModule } from "./rogue";
import { sorcererClassModule } from "./sorcerer";
import { warlockClassModule } from "./warlock";
import { wizardClassModule } from "./wizard";

import {
  bg3RaceFeatures,
  raceFeatureIconFileById,
} from "../raceFeatures";

export type {
  BG3ClassFeature,
  ClassFeatureActiveGroup,
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
  bardClassModule,
  clericClassModule,
  druidClassModule,
  fighterClassModule,
  monkClassModule,
  paladinClassModule,
  rangerClassModule,
  rogueClassModule,
  sorcererClassModule,
  warlockClassModule,
  wizardClassModule,
];

const classOnlyFeatures: BG3ClassFeature[] = classFeatureModules.flatMap(
  (module) => module.features
);

export const bg3ClassFeatures: BG3ClassFeature[] = [
  ...classOnlyFeatures,
  ...bg3RaceFeatures,
];

export const classFeatureIconFileById: Record<string, string> = Object.assign(
  {},
  ...classFeatureModules.map((module) => module.iconFileByFeatureId),
  raceFeatureIconFileById
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