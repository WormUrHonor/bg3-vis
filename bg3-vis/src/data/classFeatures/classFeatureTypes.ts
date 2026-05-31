import type { AbilityDamageProfile } from "../bg3Spells";
import type {
  ClassName,
  RangerFavouredEnemy,
  RangerNaturalExplorer,
} from "../../types/buildPlannerTypes";
import type {
  AbilityRole,
  ActionCost,
  BG3Spell,
  DamageType,
  ResourceCost,
} from "../bg3Spells";

export type ClassFeatureKind =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "toggle"
  | "manoeuvre"
  | "subclass-feature"
  | "resource-feature";

export type ClassFeatureDependencyMode = "all" | "any";

export type ClassFeatureAvailability = {
  className: ClassName;
  minLevel: number;
  maxLevel?: number;
  subclass?: string;
  rangerFavouredEnemy?: RangerFavouredEnemy;
  rangerNaturalExplorer?: RangerNaturalExplorer;
};

export type ClassFeatureRange = BG3Spell["range"];

export type ClassFeatureChoiceGroup = {
  id: string;
  label: string;
  max: number;
};

export type ClassFeatureActiveGroup = {
  id: string;
  label: string;
  max: number;
};

export type ClassFeatureDisplayGroup = {
  id: string;
  label: string;
  order?: number;
};

export type BG3ClassFeature = {
  id: string;
  name: string;
  sourceType: "class-feature";
  kind: ClassFeatureKind;
  description?: string;
  damage?: AbilityDamageProfile;
  availability: ClassFeatureAvailability[];
  isFixed: boolean;
  isInformational?: boolean;

  choiceGroupId?: string;
  choiceGroupLabel?: string;
  choiceGroupMax?: number;

  activeGroupId?: string;
  activeGroupLabel?: string;
  activeGroupMax?: number;

  displayGroupId?: string;
  displayGroupLabel?: string;
  displayGroupOrder?: number;

  requiredFeatureIds?: string[];
  dependencyMode?: ClassFeatureDependencyMode;
  conflictsWithFeatureIds?: string[];

  range: BG3Spell["range"];
  roles: AbilityRole[];
  damageTypes: DamageType[];

  costs: {
    actions: ActionCost[];
    resources: ResourceCost[];
    requiresConcentration: boolean;
  };

  tags?: string[];
};

export type ClassFeatureModule = {
  className: ClassName;
  defaultTabLabel: string;
  subclassTabLabels?: Partial<Record<string, string>>;
  features: BG3ClassFeature[];
  iconFileByFeatureId: Record<string, string>;
};