import type { ClassFeatureModule } from "./classFeatureTypes";

const warlockFeatures = [];

export const warlockClassModule: ClassFeatureModule = {
  className: "Warlock",
  defaultTabLabel: "Spells & Invocations",
  subclassTabLabels: {},
  features: warlockFeatures,
  iconFileByFeatureId: {},
};
