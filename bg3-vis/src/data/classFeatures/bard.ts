import type { ClassFeatureModule } from "./classFeatureTypes";

const bardFeatures = [];

export const bardClassModule: ClassFeatureModule = {
  className: "Bard",
  defaultTabLabel: "Spells & Inspiration",
  subclassTabLabels: {},
  features: bardFeatures,
  iconFileByFeatureId: {},
};
