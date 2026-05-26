import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  lineRange,
  melee,
  radiusRange,
  range18m,
  range9m,
  self,
  touch,
  weaponRange,
} from "./classFeatureHelpers";

const MONK = "Monk" as const;

const DRUNKEN_MASTER = "Way of the Drunken Master";
const FOUR_ELEMENTS = "Way of the Four Elements";
const OPEN_HAND = "Way of the Open Hand";
const SHADOW = "Way of Shadow";

const fourElementsLevel3Choice = {
  id: "monk-four-elements-disciplines-level-3",
  label: "Initial Elemental Disciplines",
  max: 3,
};

const fourElementsLevel6Choice = {
  id: "monk-four-elements-disciplines-level-6",
  label: "Additional Elemental Discipline",
  max: 1,
};

const fourElementsLevel9Choice = {
  id: "monk-four-elements-disciplines-level-9",
  label: "Advanced Elemental Discipline",
  max: 1,
};

const fourElementsLevel11Choice = {
  id: "monk-four-elements-disciplines-level-11",
  label: "Master Elemental Discipline",
  max: 1,
};

const coreGroup = {
  id: "monk-core",
  label: "Core Monk Features",
  order: 10,
};

const martialArtsGroup = {
  id: "monk-martial-arts",
  label: "Martial Arts",
  order: 15,
};

const kiGroup = {
  id: "monk-ki-actions",
  label: "Ki Actions",
  order: 20,
};

const manifestationActiveGroup = {
  id: "monk-open-hand-active-manifestation",
  label: "Active Manifestation",
  max: 1,
};

const drunkenMasterGroup = {
  id: "monk-drunken-master",
  label: "Drunken Master Features",
  order: 30,
};

const fourElementsGroup = {
  id: "monk-four-elements",
  label: "Four Elements Features",
  order: 40,
};

const elementalDisciplineGroup = {
  id: "monk-four-elements-disciplines",
  label: "Elemental Discipline Choices",
  order: 45,
};

const openHandGroup = {
  id: "monk-open-hand",
  label: "Open Hand Features",
  order: 50,
};

const shadowGroup = {
  id: "monk-shadow",
  label: "Shadow Arts",
  order: 60,
};

const flurryNonDrunkenAvailability = [
  availableTo(MONK, 1, 2),
  availableTo(MONK, 3, FOUR_ELEMENTS),
  availableTo(MONK, 3, OPEN_HAND),
  availableTo(MONK, 3, SHADOW),
];

type ElementalDisciplineDefinition = {
  idBase: string;
  name: string;
  description: string;
  minStage: "level-3" | "level-6" | "level-11";
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: Parameters<typeof feature>[8];
  resources?: Parameters<typeof feature>[9];
  range: Parameters<typeof feature>[10];
  concentration?: boolean;
};

const elementalDisciplineDefinitions: ElementalDisciplineDefinition[] = [
  {
    idBase: "blade-of-rime",
    name: "Blade of Rime",
    minStage: "level-3",
    description:
      "Spend Ki to conjure a blade of ice that can damage and affect enemies in its path.",
    roles: ["area-damage", "control"],
    damageTypes: ["Cold"],
    actions: ["action"],
    range: lineRange("9m line", 9, "mid"),
  },
  {
    idBase: "chill-of-the-mountain",
    name: "Chill of the Mountain",
    minStage: "level-3",
    description:
      "Channel elemental ki into a focused cold attack. Improved Elemental Casting increases its damage at level 9.",
    roles: ["single-target-damage"],
    damageTypes: ["Cold"],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "fangs-of-the-fire-snake",
    name: "Fangs of the Fire Snake",
    minStage: "level-3",
    description:
      "Empower an unarmed strike with flame, extending its reach and adding Fire damage.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Bludgeoning", "Fire"],
    actions: ["action"],
    range: melee,
  },
  {
    idBase: "fist-of-four-thunders",
    name: "Fist of Four Thunders",
    minStage: "level-3",
    description:
      "Release a wave of thunderous force. Improved Elemental Casting increases its damage at level 9.",
    roles: ["area-damage", "control"],
    damageTypes: ["Thunder"],
    actions: ["action"],
    range: radiusRange("self, 5m AoE", 5, "mid", 5),
  },
  {
    idBase: "fist-of-unbroken-air",
    name: "Fist of Unbroken Air",
    minStage: "level-3",
    description:
      "Strike with compressed air, damaging and pushing a target. Improved Elemental Casting increases its damage at level 9.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "rush-of-the-gale-spirits",
    name: "Rush of the Gale Spirits",
    minStage: "level-3",
    description:
      "Use elemental wind to push enemies and influence positioning.",
    roles: ["control", "mobility-positioning"],
    damageTypes: [],
    actions: ["action"],
    range: lineRange("12m line", 12, "mid"),
  },
  {
    idBase: "shaping-of-the-ice",
    name: "Shaping of the Ice",
    minStage: "level-3",
    description:
      "Shape ice to create terrain and influence movement through the battlefield.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "sphere-of-elemental-balance",
    name: "Sphere of Elemental Balance",
    minStage: "level-3",
    description:
      "Use elemental ki to create a balanced elemental effect around a target area.",
    roles: ["area-damage", "control"],
    damageTypes: ["Variable"],
    actions: ["action"],
    range: radiusRange("18m, AoE", 18, "long"),
  },
  {
    idBase: "sweeping-cinder-strike",
    name: "Sweeping Cinder Strike",
    minStage: "level-3",
    description:
      "Sweep flames outward in a cone. Improved Elemental Casting increases its damage at level 9.",
    roles: ["area-damage"],
    damageTypes: ["Fire"],
    actions: ["action"],
    range: { label: "cone", meters: 5, category: "mid", shape: "cone" },
  },
  {
    idBase: "touch-of-the-storm",
    name: "Touch of the Storm",
    minStage: "level-3",
    description:
      "Channel lightning through touch. Improved Elemental Casting increases its damage at level 9.",
    roles: ["single-target-damage"],
    damageTypes: ["Lightning"],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "water-whip",
    name: "Water Whip",
    minStage: "level-3",
    description:
      "Strike with a whip of water, damaging and controlling a target. Improved Elemental Casting increases its damage at level 9.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "clench-of-the-north-wind",
    name: "Clench of the North Wind",
    minStage: "level-6",
    description:
      "Hold a creature in place with elemental force. At level 9, Improved Elemental Casting allows it to affect an additional creature.",
    roles: ["control"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
    concentration: true,
  },
  {
    idBase: "embrace-of-the-inferno",
    name: "Embrace of the Inferno",
    minStage: "level-6",
    description:
      "Launch rays of fire. At level 9, Improved Elemental Casting fires an additional ray.",
    roles: ["single-target-damage"],
    damageTypes: ["Fire"],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "gong-of-the-summit",
    name: "Gong of the Summit",
    minStage: "level-6",
    description:
      "Release a thunderous burst. Improved Elemental Casting increases its damage at level 9.",
    roles: ["area-damage"],
    damageTypes: ["Thunder"],
    actions: ["action"],
    range: radiusRange("18m, 3m AoE", 18, "long", 3),
  },
  {
    idBase: "flames-of-the-phoenix",
    name: "Flames of the Phoenix",
    minStage: "level-11",
    description:
      "Unleash a large burst of fire through elemental ki.",
    roles: ["area-damage"],
    damageTypes: ["Fire"],
    actions: ["action"],
    range: radiusRange("18m, 4m AoE", 18, "long", 4),
  },
  {
    idBase: "mist-stance",
    name: "Mist Stance",
    minStage: "level-11",
    description:
      "Assume a mist-like state to improve survivability and movement.",
    roles: ["defense-protection", "mobility-positioning"],
    damageTypes: [],
    actions: ["action"],
    range: self,
    concentration: true,
  },
  {
    idBase: "ride-the-wind",
    name: "Ride the Wind",
    minStage: "level-11",
    description:
      "Use elemental ki to fly.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["action"],
    range: self,
  },
];

function getStageMinLevel(stage: "level-3" | "level-6" | "level-9" | "level-11") {
  if (stage === "level-3") return 3;
  if (stage === "level-6") return 6;
  if (stage === "level-9") return 9;
  return 11;
}

function getChoiceGroupForStage(stage: "level-3" | "level-6" | "level-9" | "level-11") {
  if (stage === "level-3") return fourElementsLevel3Choice;
  if (stage === "level-6") return fourElementsLevel6Choice;
  if (stage === "level-9") return fourElementsLevel9Choice;
  return fourElementsLevel11Choice;
}

function getLabelPrefixForStage(stage: "level-3" | "level-6" | "level-9" | "level-11") {
  if (stage === "level-3") return "";
  if (stage === "level-6") return "Additional Discipline: ";
  if (stage === "level-9") return "Advanced Discipline: ";
  return "Master Discipline: ";
}

function disciplineAvailableAtStage(
  discipline: ElementalDisciplineDefinition,
  stage: "level-3" | "level-6" | "level-9" | "level-11"
): boolean {
  const stageOrder = {
    "level-3": 3,
    "level-6": 6,
    "level-9": 9,
    "level-11": 11,
  };

  return stageOrder[stage] >= stageOrder[discipline.minStage];
}

function makeElementalDisciplineFeature(
  discipline: ElementalDisciplineDefinition,
  stage: "level-3" | "level-6" | "level-9" | "level-11"
) {
  const allStageIds = ["level-3", "level-6", "level-9", "level-11"].map(
    (item) => `monk-four-elements-${item}-${discipline.idBase}`
  );

  const id = `monk-four-elements-${stage}-${discipline.idBase}`;

  return feature(
    id,
    `${getLabelPrefixForStage(stage)}${discipline.name}`,
    "subclass-feature",
    [availableTo(MONK, getStageMinLevel(stage), FOUR_ELEMENTS)],
    false,
    discipline.description,
    discipline.roles,
    discipline.damageTypes,
    discipline.actions,
    discipline.resources ?? ["class-resource"],
    discipline.range,
    ["monk", "four-elements", "elemental-discipline"],
    {
      choiceGroup: getChoiceGroupForStage(stage),
      displayGroup: elementalDisciplineGroup,
      conflictsWith: allStageIds.filter((item) => item !== id),
    }
  );
}

const elementalDisciplineFeatures = elementalDisciplineDefinitions.flatMap((discipline) =>
  (["level-3", "level-6", "level-9", "level-11"] as const)
    .filter((stage) => disciplineAvailableAtStage(discipline, stage))
    .map((stage) => makeElementalDisciplineFeature(discipline, stage))
);

const monkFeatures = [
  feature(
    "monk-ki-points",
    "Ki Points",
    "resource-feature",
    [availableTo(MONK, 1)],
    true,
    "Spend Ki Points to fuel Monk abilities. Ki Points recharge on Short Rest. Monk gains 2 Ki Points at level 1 and one additional Ki Point at each later Monk level.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["monk", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-unarmoured-defence",
    "Unarmoured Defence",
    "passive",
    [availableTo(MONK, 1)],
    true,
    "While not wearing armour, add your Wisdom Modifier to your Armour Class.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-martial-arts-dextrous-attacks",
    "Martial Arts: Dextrous Attacks",
    "passive",
    [availableTo(MONK, 1)],
    true,
    "Attacks with Monk weapons and unarmed attacks scale with Dexterity instead of Strength if Dexterity is higher.",
    ["single-target-damage"],
    ["Weapon", "Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "martial-arts"],
    {
      displayGroup: martialArtsGroup,
    }
  ),

  feature(
    "monk-martial-arts-deft-strikes",
    "Martial Arts: Deft Strikes",
    "passive",
    [availableTo(MONK, 1, 2)],
    true,
    "Attacks with Monk weapons and unarmed attacks deal 1d4 Bludgeoning damage unless their normal damage is higher.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "martial-arts"],
    {
      displayGroup: martialArtsGroup,
    }
  ),

  feature(
    "monk-martial-arts-deft-strikes-d6",
    "Martial Arts: Deft Strikes 1d6",
    "passive",
    [availableTo(MONK, 3, 8)],
    true,
    "Attacks with Monk weapons and unarmed attacks deal 1d6 Bludgeoning damage unless their normal damage is higher.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "martial-arts"],
    {
      displayGroup: martialArtsGroup,
    }
  ),

  feature(
    "monk-martial-arts-deft-strikes-d8",
    "Martial Arts: Deft Strikes 1d8",
    "passive",
    [availableTo(MONK, 9)],
    true,
    "Attacks with Monk weapons and unarmed attacks deal 1d8 Bludgeoning damage unless their normal damage is higher.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "martial-arts"],
    {
      displayGroup: martialArtsGroup,
    }
  ),

  feature(
    "monk-martial-arts-bonus-unarmed-strike",
    "Martial Arts: Bonus Unarmed Strike",
    "bonus-action",
    [availableTo(MONK, 1)],
    true,
    "After making an attack with a melee Monk weapon or while unarmed, make another unarmed attack as a Bonus Action.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    melee,
    ["monk", "martial-arts"],
    {
      displayGroup: martialArtsGroup,
    }
  ),

  feature(
    "monk-flurry-of-blows",
    "Flurry of Blows",
    "bonus-action",
    flurryNonDrunkenAvailability,
    true,
    "Spend a Ki Point to punch twice in quick succession.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["class-resource"],
    melee,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-unarmoured-movement",
    "Unarmoured Movement",
    "passive",
    [availableTo(MONK, 2, 5)],
    true,
    "Movement Speed increases by 3m while not wearing armour or using a shield.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-improved-unarmoured-movement-4-5m",
    "Improved Unarmoured Movement",
    "passive",
    [availableTo(MONK, 6, 9)],
    true,
    "Movement Speed increases by 4.5m while not wearing armour or using a shield.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-improved-unarmoured-movement-6m",
    "Improved Unarmoured Movement 6m",
    "passive",
    [availableTo(MONK, 10)],
    true,
    "Movement Speed increases by 6m while not wearing armour or using a shield.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-patient-defence",
    "Patient Defence",
    "bonus-action",
    [availableTo(MONK, 2)],
    true,
    "Spend a Ki Point. Attack Rolls against you have Disadvantage, and you gain Advantage on Dexterity Saving Throws.",
    ["defense-protection"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-step-of-the-wind-dash",
    "Step of the Wind: Dash",
    "bonus-action",
    [availableTo(MONK, 2)],
    true,
    "Spend a Ki Point to double your Movement Speed. Jump no longer requires a Bonus Action.",
    ["mobility-positioning"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-step-of-the-wind-disengage",
    "Step of the Wind: Disengage",
    "bonus-action",
    [availableTo(MONK, 2)],
    true,
    "Spend a Ki Point to move without triggering Opportunity Attacks. Jump no longer requires a Bonus Action.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-deflect-missiles",
    "Deflect Missiles",
    "reaction",
    [availableTo(MONK, 3)],
    true,
    "Use your Reaction to reduce damage from a ranged weapon attack. If the damage is reduced to 0, you can spend a Ki Point to return the missile.",
    ["defense-protection", "single-target-damage"],
    ["Weapon"],
    ["reaction"],
    ["class-resource"],
    range18m,
    ["monk", "reaction"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-slow-fall",
    "Slow Fall",
    "reaction",
    [availableTo(MONK, 4)],
    true,
    "When you fall, use your Reaction to gain Resistance to Falling damage.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["reaction"],
    ["none"],
    self,
    ["monk", "reaction"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(MONK, 5)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon", "Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-stunning-strike-melee",
    "Stunning Strike: Melee",
    "action",
    [availableTo(MONK, 5)],
    true,
    "Spend a Ki Point to deal normal weapon damage and possibly Stun the target.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    melee,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-stunning-strike-unarmed",
    "Stunning Strike: Unarmed",
    "action",
    [availableTo(MONK, 5)],
    true,
    "Spend a Ki Point to deal normal unarmed damage and possibly Stun the target.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["action"],
    ["class-resource"],
    melee,
    ["monk", "ki-action"],
    {
      displayGroup: kiGroup,
    }
  ),

  feature(
    "monk-ki-empowered-strikes",
    "Ki-Empowered Strikes",
    "passive",
    [availableTo(MONK, 6)],
    true,
    "Your unarmed attacks count as magical for overcoming Resistance and Immunity to non-magical damage.",
    ["single-target-damage"],
    ["Bludgeoning"],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-evasion",
    "Evasion",
    "passive",
    [availableTo(MONK, 7)],
    true,
    "When a spell or effect would deal half damage on a successful Dexterity Saving Throw, it deals no damage if you succeed and only half damage if you fail.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-stillness-of-mind",
    "Stillness of Mind",
    "passive",
    [availableTo(MONK, 7)],
    true,
    "If Charmed or Frightened, automatically remove the condition.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-advanced-unarmoured-movement",
    "Advanced Unarmoured Movement",
    "passive",
    [availableTo(MONK, 9)],
    true,
    "Difficult Terrain no longer slows you down, and you can Jump an additional 6m while not wearing armour or using a shield.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-purity-of-body",
    "Purity of Body",
    "passive",
    [availableTo(MONK, 10)],
    true,
    "You are Immune to Poison damage and cannot be Poisoned or affected by disease.",
    ["defense-protection"],
    ["Poison"],
    ["passive"],
    ["none"],
    self,
    ["monk", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "monk-drunken-master-cheeky-tipple",
    "Cheeky Tipple",
    "passive",
    [availableTo(MONK, 3, DRUNKEN_MASTER)],
    true,
    "You are immune to the negative effects of being Drunk. Once per day, drinking alcohol restores half your Ki Points, rounded down.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["monk", "drunken-master"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-drunken-performance",
    "Drunken Performance",
    "passive",
    [availableTo(MONK, 3, DRUNKEN_MASTER)],
    true,
    "Gain Proficiency in Performance.",
    ["narrative-interaction", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "drunken-master"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-drunken-technique",
    "Drunken Technique",
    "bonus-action",
    [availableTo(MONK, 3, DRUNKEN_MASTER)],
    true,
    "Replaces Flurry of Blows. Spend a Ki Point to punch twice, gain 3m Movement Speed, and gain the benefits of Disengage.",
    ["single-target-damage", "mobility-positioning", "defense-protection"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["class-resource"],
    melee,
    ["monk", "drunken-master", "ki-action"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-intoxicating-strike",
    "Intoxicating Strike",
    "action",
    [availableTo(MONK, 4, DRUNKEN_MASTER)],
    true,
    "Spend a Ki Point to hit a creature with bare fists and possibly make it Drunk.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["action"],
    ["class-resource"],
    melee,
    ["monk", "drunken-master", "ki-action"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-life-of-the-party",
    "Life of the Party",
    "passive",
    [availableTo(MONK, 4, DRUNKEN_MASTER)],
    true,
    "Every time Intoxicating Strike hits, gain Life of the Party, increasing Armour Class and Attack Rolls against Drunk targets.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "drunken-master"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-leap-to-your-feet",
    "Leap to Your Feet",
    "passive",
    [availableTo(MONK, 6, DRUNKEN_MASTER)],
    true,
    "When Prone, standing up uses only 1.5m of Movement Speed.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "drunken-master"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-redirect-attack",
    "Redirect Attack",
    "reaction",
    [availableTo(MONK, 6, DRUNKEN_MASTER)],
    true,
    "When a creature misses you with a melee attack, spend 1 Ki Point as a Reaction to make an unarmed attack against the attacker.",
    ["single-target-damage", "defense-protection"],
    ["Bludgeoning"],
    ["reaction"],
    ["class-resource"],
    melee,
    ["monk", "drunken-master", "ki-action"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-sobering-realisation",
    "Sobering Realisation",
    "action",
    [availableTo(MONK, 9, DRUNKEN_MASTER)],
    true,
    "Spend a Ki Point to hit a Drunk target, sober them up, and deal bonus Psychic damage. On hit, you lose Life of the Party.",
    ["single-target-damage", "control"],
    ["Bludgeoning", "Psychic"],
    ["action"],
    ["class-resource"],
    melee,
    ["monk", "drunken-master", "ki-action"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-drunken-master-drunkards-luck",
    "Drunkard's Luck",
    "reaction",
    [availableTo(MONK, 11, DRUNKEN_MASTER)],
    true,
    "Spend 2 Ki Points to negate Disadvantage on an Ability Check, Attack Roll, or Saving Throw.",
    ["support-buff", "defense-protection"],
    [],
    ["reaction"],
    ["class-resource"],
    self,
    ["monk", "drunken-master", "ki-action"],
    {
      displayGroup: drunkenMasterGroup,
    }
  ),

  feature(
    "monk-four-elements-disciple-of-the-elements",
    "Disciple of the Elements",
    "passive",
    [availableTo(MONK, 3, FOUR_ELEMENTS)],
    true,
    "Use Ki to power magical Elemental Disciplines. Their DC is 8 + Proficiency Bonus + Wisdom modifier.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "four-elements"],
    {
      displayGroup: fourElementsGroup,
    }
  ),

  feature(
    "monk-four-elements-harmony-of-fire-and-water",
    "Harmony of Fire and Water",
    "action",
    [availableTo(MONK, 3, FOUR_ELEMENTS)],
    true,
    "While not in combat, regain half your Ki Points, rounded down. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    self,
    ["monk", "four-elements"],
    {
      displayGroup: fourElementsGroup,
    }
  ),

  ...elementalDisciplineFeatures,

  feature(
    "monk-four-elements-improved-elemental-casting",
    "Improved Elemental Casting",
    "passive",
    [availableTo(MONK, 9, FOUR_ELEMENTS)],
    true,
    "Several offensive Four Elements features gain additional damage dice. Clench of the North Wind can affect an additional creature, and Embrace of the Inferno fires an extra ray.",
    ["support-buff", "single-target-damage", "area-damage"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["monk", "four-elements"],
    {
      displayGroup: fourElementsGroup,
    }
  ),

  feature(
    "monk-open-hand-flurry-topple",
    "Flurry of Blows: Topple",
    "bonus-action",
    [availableTo(MONK, 3, OPEN_HAND)],
    true,
    "Spend a Ki Point to punch twice and potentially knock the target Prone.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["class-resource"],
    melee,
    ["monk", "open-hand", "ki-action"],
    {
      displayGroup: openHandGroup,
    activeGroup: manifestationActiveGroup,
}
  ),

  feature(
    "monk-open-hand-flurry-stagger",
    "Flurry of Blows: Stagger",
    "bonus-action",
    [availableTo(MONK, 3, OPEN_HAND)],
    true,
    "Spend a Ki Point to punch twice and Stagger the target, preventing Reactions.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["class-resource"],
    melee,
    ["monk", "open-hand", "ki-action"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-open-hand-flurry-push",
    "Flurry of Blows: Push",
    "bonus-action",
    [availableTo(MONK, 3, OPEN_HAND)],
    true,
    "Spend a Ki Point to punch twice and potentially push the target 5m away.",
    ["single-target-damage", "control", "mobility-positioning"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["class-resource"],
    melee,
    ["monk", "open-hand", "ki-action"],
    {
      displayGroup: openHandGroup,
    }
  ),

feature(
  "monk-open-hand-manifestation-of-body",
  "Manifestation of Body",
  "toggle",
  [availableTo(MONK, 6, OPEN_HAND)],
  true,
  "Toggleable passive. Your unarmed attacks deal additional Necrotic damage. Only one Manifestation can be active at once in-game.",
  ["single-target-damage"],
  ["Necrotic"],
  ["passive"],
  ["none"],
  self,
  ["monk", "open-hand", "toggle"],
  {
    displayGroup: openHandGroup,
    activeGroup: manifestationActiveGroup,
  }
),

feature(
  "monk-open-hand-manifestation-of-mind",
  "Manifestation of Mind",
  "toggle",
  [availableTo(MONK, 6, OPEN_HAND)],
  true,
  "Toggleable passive. Your unarmed attacks deal additional Psychic damage. Only one Manifestation can be active at once in-game.",
  ["single-target-damage"],
  ["Psychic"],
  ["passive"],
  ["none"],
  self,
  ["monk", "open-hand", "toggle"],
  {
    displayGroup: openHandGroup,
    activeGroup: manifestationActiveGroup,
  }
),

feature(
  "monk-open-hand-manifestation-of-soul",
  "Manifestation of Soul",
  "toggle",
  [availableTo(MONK, 6, OPEN_HAND)],
  true,
  "Toggleable passive. Your unarmed attacks deal additional Radiant damage. Only one Manifestation can be active at once in-game.",
  ["single-target-damage"],
  ["Radiant"],
  ["passive"],
  ["none"],
  self,
  ["monk", "open-hand", "toggle"],
  {
    displayGroup: openHandGroup,
    activeGroup: manifestationActiveGroup,
  }
),

  feature(
    "monk-open-hand-wholeness-of-body",
    "Wholeness of Body",
    "action",
    [availableTo(MONK, 6, OPEN_HAND)],
    true,
    "Regain half your Ki Points and enter a temporary state where you regain Ki Points and have an extra Bonus Action. Recharges on Long Rest.",
    ["healing", "support-buff"],
    [],
    ["action"],
    ["long-rest"],
    self,
    ["monk", "open-hand"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-open-hand-ki-resonation-punch",
    "Ki Resonation: Punch",
    "action",
    [availableTo(MONK, 9, OPEN_HAND)],
    true,
    "Hit a creature with bare fists, making the ki in its body Resonate with yours.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["action"],
    ["none"],
    melee,
    ["monk", "open-hand"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-open-hand-ki-resonation-punch-bonus-action",
    "Ki Resonation: Punch (Bonus Action)",
    "bonus-action",
    [availableTo(MONK, 9, OPEN_HAND)],
    true,
    "Hit a creature with bare fists as a Bonus Action, making the ki in its body Resonate with yours.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    melee,
    ["monk", "open-hand"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-open-hand-ki-resonation-blast",
    "Ki Resonation: Blast",
    "action",
    [availableTo(MONK, 9, OPEN_HAND)],
    true,
    "Spend a Ki Point to detonate the ki of a Resonating creature, hitting it and nearby non-party, non-summoned creatures within 5m.",
    ["area-damage"],
    ["Force"],
    ["action"],
    ["class-resource"],
    radiusRange("target, 5m AoE", 5, "mid", 5),
    ["monk", "open-hand", "ki-action"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-open-hand-tranquillity",
    "Tranquillity",
    "passive",
    [availableTo(MONK, 11, OPEN_HAND)],
    true,
    "Long Rests surround you with an aura of peace, granting Sanctuary permanently until you attack.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["monk", "open-hand"],
    {
      displayGroup: openHandGroup,
    }
  ),

  feature(
    "monk-shadow-minor-illusion",
    "Minor Illusion",
    "subclass-feature",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Create an illusion that compels nearby creatures to investigate. This cantrip is granted automatically by Way of Shadow and is not a selectable cantrip choice.",
    ["control", "investigation-world-interaction"],
    [],
    ["action"],
    ["cantrip"],
    range18m,
    ["monk", "shadow", "fixed-cantrip"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-arts-hide",
    "Shadow Arts: Hide",
    "bonus-action",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Hide from enemies by succeeding at Stealth checks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    self,
    ["monk", "shadow"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-arts-pass-without-trace",
    "Shadow Arts: Pass Without Trace",
    "action",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Spend 2 Ki Points to give yourself and nearby allies a +10 bonus to Stealth checks.",
    ["support-buff", "mobility-positioning"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("self, 9m AoE", 9, "mid", 9),
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-arts-darkness",
    "Shadow Arts: Darkness",
    "action",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Spend 2 Ki Points to create magical darkness that Heavily Obscures and Blinds creatures within.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("18m, 5m AoE", 18, "long", 5),
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-arts-darkvision",
    "Shadow Arts: Darkvision",
    "action",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Spend 2 Ki Points to grant a creature the ability to see in the dark up to 12m.",
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    ["class-resource"],
    touch,
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-arts-silence",
    "Shadow Arts: Silence",
    "action",
    [availableTo(MONK, 3, SHADOW)],
    true,
    "Spend 2 Ki Points to create a sound-proof sphere. Creatures within are Silenced and immune to Thunder damage.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("18m, 6m AoE", 18, "long", 6),
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-cloak-of-shadows",
    "Cloak of Shadows",
    "action",
    [availableTo(MONK, 5, SHADOW)],
    true,
    "Wrap yourself in shadows to become Invisible if obscured.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["action"],
    ["none"],
    self,
    ["monk", "shadow"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-shadow-step",
    "Shadow Step",
    "bonus-action",
    [availableTo(MONK, 6, SHADOW)],
    true,
    "Teleport from shadow to shadow. Afterwards, you have Advantage on your next melee Attack Roll.",
    ["mobility-positioning", "support-buff"],
    [],
    ["bonus-action"],
    ["none"],
    range18m,
    ["monk", "shadow"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-shadow-strike",
    "Shadow Strike",
    "action",
    [availableTo(MONK, 11, SHADOW)],
    true,
    "Spend 3 Ki Points to teleport to a foe from a hidden position and strike them with psychic shadow force.",
    ["single-target-damage", "mobility-positioning"],
    ["Weapon", "Psychic"],
    ["action"],
    ["class-resource"],
    range18m,
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "monk-shadow-shadow-strike-unarmed",
    "Shadow Strike: Unarmed",
    "action",
    [availableTo(MONK, 11, SHADOW)],
    true,
    "Spend 3 Ki Points to teleport to a foe from a hidden position and strike them unarmed with psychic shadow force.",
    ["single-target-damage", "mobility-positioning"],
    ["Bludgeoning", "Psychic"],
    ["action"],
    ["class-resource"],
    range18m,
    ["monk", "shadow", "ki-action"],
    {
      displayGroup: shadowGroup,
    }
  ),
];

const elementalDisciplineIconEntries = Object.fromEntries(
  elementalDisciplineDefinitions.flatMap((discipline) =>
    ["level-3", "level-6", "level-9", "level-11"].map((stage) => [
      `monk-four-elements-${stage}-${discipline.idBase}`,
      `Action_Monk_FourElements_${discipline.idBase}.png`,
    ])
  )
);

export const monkClassModule: ClassFeatureModule = {
  className: "Monk",
  defaultTabLabel: "Ki Actions",
  subclassTabLabels: {
    [DRUNKEN_MASTER]: "Drunken Master",
    [FOUR_ELEMENTS]: "Elemental Disciplines",
    [OPEN_HAND]: "Open Hand Techniques",
    [SHADOW]: "Shadow Arts",
  },
  features: monkFeatures,
  iconFileByFeatureId: {
    "monk-ki-points": "Passive_Monk_KiPoints.png",
    "monk-unarmoured-defence": "Passive_Monk_UnarmouredDefence.png",
    "monk-martial-arts-dextrous-attacks":
      "Passive_Monk_MartialArts_DextrousAttacks.png",
    "monk-martial-arts-deft-strikes":
      "Passive_Monk_MartialArts_DeftStrikes.png",
    "monk-martial-arts-deft-strikes-d6":
      "Passive_Monk_MartialArts_DeftStrikes.png",
    "monk-martial-arts-deft-strikes-d8":
      "Passive_Monk_MartialArts_DeftStrikes.png",
    "monk-martial-arts-bonus-unarmed-strike":
      "Action_Monk_MartialArts_BonusUnarmedStrike.png",
    "monk-flurry-of-blows": "Action_Monk_FlurryOfBlows.png",
    "monk-unarmoured-movement": "Passive_Monk_UnarmouredMovement.png",
    "monk-improved-unarmoured-movement-4-5m":
      "Passive_Monk_ImprovedUnarmouredMovement.png",
    "monk-improved-unarmoured-movement-6m":
      "Passive_Monk_ImprovedUnarmouredMovement.png",
    "monk-patient-defence": "Action_Monk_PatientDefence.png",
    "monk-step-of-the-wind-dash": "Action_Monk_StepOfTheWind_Dash.png",
    "monk-step-of-the-wind-disengage":
      "Action_Monk_StepOfTheWind_Disengage.png",
    "monk-deflect-missiles": "Reaction_Monk_DeflectMissiles.png",
    "monk-slow-fall": "Reaction_Monk_SlowFall.png",
    "monk-extra-attack": "Passive_ExtraAttack.png",
    "monk-stunning-strike-melee": "Action_Monk_StunningStrike_Melee.png",
    "monk-stunning-strike-unarmed": "Action_Monk_StunningStrike_Unarmed.png",
    "monk-ki-empowered-strikes": "Passive_Monk_KiEmpoweredStrikes.png",
    "monk-evasion": "Passive_Monk_Evasion.png",
    "monk-stillness-of-mind": "Passive_Monk_StillnessOfMind.png",
    "monk-advanced-unarmoured-movement":
      "Passive_Monk_AdvancedUnarmouredMovement.png",
    "monk-purity-of-body": "Passive_Monk_PurityOfBody.png",

    "monk-drunken-master-cheeky-tipple":
      "Passive_Monk_DrunkenMaster_CheekyTipple.png",
    "monk-drunken-master-drunken-performance":
      "Passive_Monk_DrunkenMaster_DrunkenPerformance.png",
    "monk-drunken-master-drunken-technique":
      "Action_Monk_DrunkenMaster_DrunkenTechnique.png",
    "monk-drunken-master-intoxicating-strike":
      "Action_Monk_DrunkenMaster_IntoxicatingStrike.png",
    "monk-drunken-master-life-of-the-party":
      "Passive_Monk_DrunkenMaster_LifeOfTheParty.png",
    "monk-drunken-master-leap-to-your-feet":
      "Passive_Monk_DrunkenMaster_LeapToYourFeet.png",
    "monk-drunken-master-redirect-attack":
      "Reaction_Monk_DrunkenMaster_RedirectAttack.png",
    "monk-drunken-master-sobering-realisation":
      "Action_Monk_DrunkenMaster_SoberingRealisation.png",
    "monk-drunken-master-drunkards-luck":
      "Passive_Monk_DrunkenMaster_DrunkardsLuck.png",

    "monk-four-elements-disciple-of-the-elements":
      "Passive_Monk_FourElements_DiscipleOfTheElements.png",
    "monk-four-elements-harmony-of-fire-and-water":
      "Action_Monk_FourElements_HarmonyOfFireAndWater.png",
    "monk-four-elements-improved-elemental-casting":
      "Passive_Monk_FourElements_ImprovedElementalCasting.png",
    ...elementalDisciplineIconEntries,

    "monk-open-hand-flurry-topple": "Action_Monk_OpenHand_FlurryTopple.png",
    "monk-open-hand-flurry-stagger": "Action_Monk_OpenHand_FlurryStagger.png",
    "monk-open-hand-flurry-push": "Action_Monk_OpenHand_FlurryPush.png",
    "monk-open-hand-manifestation-of-body":
      "Passive_Monk_OpenHand_ManifestationOfBody.png",
    "monk-open-hand-manifestation-of-mind":
      "Passive_Monk_OpenHand_ManifestationOfMind.png",
    "monk-open-hand-manifestation-of-soul":
      "Passive_Monk_OpenHand_ManifestationOfSoul.png",
    "monk-open-hand-wholeness-of-body":
      "Action_Monk_OpenHand_WholenessOfBody.png",
    "monk-open-hand-ki-resonation-punch":
      "Action_Monk_OpenHand_KiResonationPunch.png",
    "monk-open-hand-ki-resonation-punch-bonus-action":
      "Action_Monk_OpenHand_KiResonationPunchBonusAction.png",
    "monk-open-hand-ki-resonation-blast":
      "Action_Monk_OpenHand_KiResonationBlast.png",
    "monk-open-hand-tranquillity": "Passive_Monk_OpenHand_Tranquillity.png",

    "monk-shadow-minor-illusion": "Spell_Illusion_MinorIllusion.png",
    "monk-shadow-arts-hide": "Action_Monk_ShadowArts_Hide.png",
    "monk-shadow-arts-pass-without-trace":
      "Action_Monk_ShadowArts_PassWithoutTrace.png",
    "monk-shadow-arts-darkness": "Action_Monk_ShadowArts_Darkness.png",
    "monk-shadow-arts-darkvision": "Action_Monk_ShadowArts_Darkvision.png",
    "monk-shadow-arts-silence": "Action_Monk_ShadowArts_Silence.png",
    "monk-shadow-cloak-of-shadows": "Action_Monk_Shadow_CloakOfShadows.png",
    "monk-shadow-shadow-step": "Action_Monk_Shadow_ShadowStep.png",
    "monk-shadow-shadow-strike": "Action_Monk_Shadow_ShadowStrike.png",
    "monk-shadow-shadow-strike-unarmed":
      "Action_Monk_Shadow_ShadowStrikeUnarmed.png",
  },
};