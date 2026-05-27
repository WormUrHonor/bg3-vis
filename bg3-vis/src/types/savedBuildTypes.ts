import type {
  AbilityScore,
  Background,
  ClassName,
  FeatSelection,
  RaceName,
  RangerFavouredEnemy,
  RangerNaturalExplorer,
  Skill,
  WarlockInvocation,
} from "./buildPlannerTypes";

export type BuildEditorSnapshot = {
  buildName: string;
  characterName: string;

  selectedRace: RaceName | "";
  selectedSubrace: string;
  selectedBackground: Background | "";

  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;

  baseAbilityScores: Record<AbilityScore, number>;
  bonusPlusTwo: AbilityScore | "";
  bonusPlusOne: AbilityScore | "";
  featSelections: FeatSelection[];

  selectedClassSkills: Skill[];
  bardExpertise: Skill[];
  rogueExpertise: Skill[];
  loreBardSkills: Skill[];
  knowledgeClericExpertise: Skill[];

  rangerFavouredEnemy: RangerFavouredEnemy | "";
  rangerNaturalExplorer: RangerNaturalExplorer | "";
  selectedWarlockInvocations: WarlockInvocation[];

  selectedSpellIds: string[];
  selectedClassFeatureIds: string[];
  activeClassFeatureIds: string[];
};

export type SavedBuild = {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  snapshot: BuildEditorSnapshot;
};