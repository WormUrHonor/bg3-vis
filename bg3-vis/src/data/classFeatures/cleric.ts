import type { ClassFeatureModule } from "./classFeatureTypes";

const clericFeatures = [];

export const clericClassModule: ClassFeatureModule = {
  className: "Cleric",
  defaultTabLabel: "Spells & Divinity",
  subclassTabLabels: {},
  features: clericFeatures,
  iconFileByFeatureId: {},
};
