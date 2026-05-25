import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  lineRange,
  melee,
  radiusRange,
  range18m,
  self,
  touch,
  weaponRange,
} from "./classFeatureHelpers";

const FIGHTER = "Fighter" as const;

const fightingStyleChoice = {
  id: "fighter-fighting-style",
  label: "Fighting Style",
  max: 1,
};

const championAdditionalFightingStyleChoice = {
  id: "fighter-champion-additional-fighting-style",
  label: "Additional Fighting Style",
  max: 1,
};

const battleMasterLevel3ManoeuvreChoice = {
  id: "fighter-battle-master-manoeuvres-level-3",
  label: "Initial Manoeuvres",
  max: 3,
};

const battleMasterLevel7ManoeuvreChoice = {
  id: "fighter-battle-master-manoeuvres-level-7",
  label: "Additional Manoeuvres",
  max: 2,
};

const battleMasterLevel10ManoeuvreChoice = {
  id: "fighter-battle-master-manoeuvres-level-10",
  label: "Advanced Manoeuvres",
  max: 2,
};

const arcaneArcherLevel3ShotChoice = {
  id: "fighter-arcane-archer-shots-level-3",
  label: "Initial Arcane Shots",
  max: 3,
};

const arcaneArcherLevel7ShotChoice = {
  id: "fighter-arcane-archer-shots-level-7",
  label: "Additional Arcane Shot",
  max: 1,
};

const arcaneArcherLevel10ShotChoice = {
  id: "fighter-arcane-archer-shots-level-10",
  label: "Advanced Arcane Shot",
  max: 1,
};

const coreGroup = {
  id: "fighter-core",
  label: "Core Fighter Features",
  order: 10,
};

const fightingStyleGroup = {
  id: "fighter-fighting-styles",
  label: "Fighting Style Choice",
  order: 15,
};

const championGroup = {
  id: "fighter-champion",
  label: "Champion Features",
  order: 20,
};

const championFightingStyleGroup = {
  id: "fighter-champion-fighting-style",
  label: "Champion Additional Fighting Style",
  order: 25,
};

const battleMasterGroup = {
  id: "fighter-battle-master",
  label: "Battle Master Features",
  order: 30,
};

const battleMasterManoeuvreGroup = {
  id: "fighter-battle-master-manoeuvres",
  label: "Battle Master Manoeuvres",
  order: 35,
};

const arcaneArcherGroup = {
  id: "fighter-arcane-archer",
  label: "Arcane Archer Features",
  order: 40,
};

const arcaneShotGroup = {
  id: "fighter-arcane-archer-shots",
  label: "Arcane Shot Choices",
  order: 45,
};

const eldritchKnightGroup = {
  id: "fighter-eldritch-knight",
  label: "Eldritch Knight Features",
  order: 50,
};

const spellcastingInfoGroup = {
  id: "fighter-spellcasting-info",
  label: "Spellcasting Notes",
  order: 55,
};

type FightingStyleDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
};

const fightingStyleDefinitions: FightingStyleDefinition[] = [
  {
    idBase: "archery",
    name: "Archery",
    description: "Gain a +2 bonus to Attack Rolls made with ranged weapons.",
    roles: ["single-target-damage"],
  },
  {
    idBase: "defence",
    name: "Defence",
    description: "Gain a +1 bonus to Armour Class while wearing armour.",
    roles: ["defense-protection"],
  },
  {
    idBase: "duelling",
    name: "Duelling",
    description:
      "When wielding a melee weapon that is not Two-Handed in one hand and no weapon in the other, deal 2 additional damage with that weapon.",
    roles: ["single-target-damage"],
  },
  {
    idBase: "great-weapon-fighting",
    name: "Great Weapon Fighting",
    description:
      "When you roll a 1 or 2 on a damage die for an attack with a Two-Handed melee weapon, that die is rerolled once.",
    roles: ["single-target-damage"],
  },
  {
    idBase: "protection",
    name: "Protection",
    description:
      "When you have a Shield, impose Disadvantage on an enemy who attacks one of your allies while you are within 1.5m and can see the attacker.",
    roles: ["defense-protection", "support-buff"],
  },
  {
    idBase: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description:
      "When you make an offhand attack, you can add your Ability Score Modifier to the damage of the attack.",
    roles: ["single-target-damage"],
  },
];

function makeFightingStyle(style: FightingStyleDefinition) {
  return feature(
    `fighter-fighting-style-${style.idBase}`,
    style.name,
    "passive",
    [availableTo(FIGHTER, 1)],
    false,
    style.description,
    style.roles,
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "fighting-style"],
    {
      choiceGroup: fightingStyleChoice,
      displayGroup: fightingStyleGroup,
    }
  );
}

function makeChampionAdditionalFightingStyle(style: FightingStyleDefinition) {
  return feature(
    `fighter-champion-additional-fighting-style-${style.idBase}`,
    `Additional Fighting Style: ${style.name}`,
    "passive",
    [availableTo(FIGHTER, 10, "Champion")],
    false,
    style.description,
    style.roles,
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "champion", "fighting-style"],
    {
      choiceGroup: championAdditionalFightingStyleChoice,
      displayGroup: championFightingStyleGroup,
      conflictsWith: [`fighter-fighting-style-${style.idBase}`],
    }
  );
}

type ManoeuvreDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: Parameters<typeof feature>[8];
  range: Parameters<typeof feature>[10];
};

const manoeuvreDefinitions: ManoeuvreDefinition[] = [
  {
    idBase: "commanders-strike",
    name: "Commander's Strike",
    description:
      "Expend one attack from your Attack Action and a Bonus Action to direct an ally to strike a foe. The ally uses their Reaction to make a weapon attack.",
    roles: ["support-buff", "single-target-damage"],
    damageTypes: ["Weapon"],
    actions: ["action", "bonus-action"],
    range: range18m,
  },
  {
    idBase: "disarming-attack",
    name: "Disarming Attack",
    description:
      "Spend a Superiority Die to make an attack that deals additional damage and can force the target to drop the weapons they are holding.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "distracting-strike",
    name: "Distracting Strike",
    description:
      "Distract your target, giving allies Advantage on their next Attack Roll against that target.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "evasive-footwork",
    name: "Evasive Footwork",
    description:
      "Expend a Superiority Die to evade attacks, imposing Disadvantage on melee attacks against you for a round.",
    roles: ["defense-protection", "mobility-positioning"],
    damageTypes: [],
    actions: ["passive"],
    range: self,
  },
  {
    idBase: "feinting-attack",
    name: "Feinting Attack",
    description:
      "Use both your Action and Bonus Action to attack a target with Advantage and deal additional damage.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Weapon"],
    actions: ["action", "bonus-action"],
    range: melee,
  },
  {
    idBase: "goading-attack",
    name: "Goading Attack",
    description:
      "Deal additional damage and attempt to goad the target into attacking you. The target has Disadvantage when attacking any other creature.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "manoeuvring-attack",
    name: "Manoeuvring Attack",
    description:
      "Spend a Superiority Die to attack and let a friendly creature gain half its Movement Speed without provoking Opportunity Attacks.",
    roles: ["single-target-damage", "support-buff", "mobility-positioning"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "menacing-attack",
    name: "Menacing Attack",
    description:
      "Spend a Superiority Die to make an attack that deals additional damage and can Frighten the target.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "precision-attack",
    name: "Precision Attack",
    description:
      "Spend a Superiority Die and add its result to an Attack Roll.",
    roles: ["support-buff", "single-target-damage"],
    damageTypes: [],
    actions: ["passive"],
    range: self,
  },
  {
    idBase: "pushing-attack",
    name: "Pushing Attack",
    description:
      "Spend a Superiority Die to make an attack that deals additional damage and can push the target back 4.5m.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
  {
    idBase: "rally",
    name: "Rally",
    description:
      "Expend a Superiority Die to grant an ally temporary Hit Points.",
    roles: ["support-buff", "defense-protection"],
    damageTypes: [],
    actions: ["bonus-action"],
    range: range18m,
  },
  {
    idBase: "riposte",
    name: "Riposte",
    description:
      "When a hostile creature misses you with a melee attack, expend a Superiority Die to retaliate with a powerful attack.",
    roles: ["single-target-damage"],
    damageTypes: ["Weapon"],
    actions: ["reaction"],
    range: melee,
  },
  {
    idBase: "sweeping-attack",
    name: "Sweeping Attack",
    description:
      "Swing your weapon in a rapid, sweeping arc to attack multiple nearby enemies at once.",
    roles: ["area-damage"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: radiusRange("melee cleave", 1.5, "melee", 1.5),
  },
  {
    idBase: "trip-attack",
    name: "Trip Attack",
    description:
      "Spend a Superiority Die to make an attack that deals additional damage and can knock a Large or smaller target Prone.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
  },
];

function makeManoeuvreFeature(
  manoeuvre: ManoeuvreDefinition,
  stage: "level-3" | "level-7" | "level-10"
) {
  const choiceGroupByStage = {
    "level-3": battleMasterLevel3ManoeuvreChoice,
    "level-7": battleMasterLevel7ManoeuvreChoice,
    "level-10": battleMasterLevel10ManoeuvreChoice,
  };

  const minLevelByStage = {
    "level-3": 3,
    "level-7": 7,
    "level-10": 10,
  };

  const labelPrefixByStage = {
    "level-3": "",
    "level-7": "Additional Manoeuvre: ",
    "level-10": "Advanced Manoeuvre: ",
  };

  const allStageIds = ["level-3", "level-7", "level-10"].map(
    (item) => `fighter-battle-master-${item}-${manoeuvre.idBase}`
  );

  const id = `fighter-battle-master-${stage}-${manoeuvre.idBase}`;

  return feature(
    id,
    `${labelPrefixByStage[stage]}${manoeuvre.name}`,
    "manoeuvre",
    [availableTo(FIGHTER, minLevelByStage[stage], "Battle Master")],
    false,
    manoeuvre.description,
    manoeuvre.roles,
    manoeuvre.damageTypes,
    manoeuvre.actions,
    ["short-rest"],
    manoeuvre.range,
    ["fighter", "battle-master", "manoeuvre"],
    {
      choiceGroup: choiceGroupByStage[stage],
      displayGroup: battleMasterManoeuvreGroup,
      conflictsWith: allStageIds.filter((item) => item !== id),
    }
  );
}

type ArcaneShotDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  range: Parameters<typeof feature>[10];
};

const arcaneShotDefinitions: ArcaneShotDefinition[] = [
  {
    idBase: "banishing-arrow",
    name: "Banishing Arrow",
    description:
      "Fire an Arcane Shot that deals normal weapon damage and can Banish the target.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    range: weaponRange,
  },
  {
    idBase: "beguiling-arrow",
    name: "Beguiling Arrow",
    description:
      "Fire an Arcane Shot that deals normal weapon damage plus Psychic damage and can Charm the target.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon", "Psychic"],
    range: weaponRange,
  },
  {
    idBase: "bursting-arrow",
    name: "Bursting Arrow",
    description:
      "Fire an Arcane Shot that bursts in a 5m radius, dealing normal weapon damage plus Force damage.",
    roles: ["area-damage"],
    damageTypes: ["Weapon", "Force"],
    range: radiusRange("18m, 5m AoE", 18, "long", 5),
  },
  {
    idBase: "enfeebling-arrow",
    name: "Enfeebling Arrow",
    description:
      "Fire an Arcane Shot that deals normal weapon damage plus Necrotic damage and can make the target Feeble.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon", "Necrotic"],
    range: weaponRange,
  },
  {
    idBase: "grasping-arrow",
    name: "Grasping Arrow",
    description:
      "Fire an Arcane Shot that deals normal weapon damage plus Poison damage, then can deal Slashing damage when the target moves.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon", "Poison", "Slashing"],
    range: weaponRange,
  },
  {
    idBase: "piercing-arrow",
    name: "Piercing Arrow",
    description:
      "Fire an Arcane Shot in a 10m line, dealing normal weapon damage plus additional Weapon damage.",
    roles: ["area-damage", "single-target-damage"],
    damageTypes: ["Weapon"],
    range: lineRange("10m line", 10, "mid"),
  },
  {
    idBase: "seeking-arrow",
    name: "Seeking Arrow",
    description:
      "Fire an Arcane Shot that seeks the target, dealing normal weapon damage plus Force damage and applying Faerie Fire.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon", "Force"],
    range: weaponRange,
  },
  {
    idBase: "shadow-arrow",
    name: "Shadow Arrow",
    description:
      "Fire an Arcane Shot that deals normal weapon damage plus Psychic damage and can Blind the target.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon", "Psychic"],
    range: weaponRange,
  },
];

function makeArcaneShotFeature(
  shot: ArcaneShotDefinition,
  stage: "level-3" | "level-7" | "level-10"
) {
  const choiceGroupByStage = {
    "level-3": arcaneArcherLevel3ShotChoice,
    "level-7": arcaneArcherLevel7ShotChoice,
    "level-10": arcaneArcherLevel10ShotChoice,
  };

  const minLevelByStage = {
    "level-3": 3,
    "level-7": 7,
    "level-10": 10,
  };

  const labelPrefixByStage = {
    "level-3": "Arcane Shot: ",
    "level-7": "Additional Arcane Shot: ",
    "level-10": "Advanced Arcane Shot: ",
  };

  const allStageIds = ["level-3", "level-7", "level-10"].map(
    (item) => `fighter-arcane-archer-${item}-${shot.idBase}`
  );

  const id = `fighter-arcane-archer-${stage}-${shot.idBase}`;

  return feature(
    id,
    `${labelPrefixByStage[stage]}${shot.name}`,
    "subclass-feature",
    [availableTo(FIGHTER, minLevelByStage[stage], "Arcane Archer")],
    false,
    shot.description,
    shot.roles,
    shot.damageTypes,
    ["action"],
    ["short-rest"],
    shot.range,
    ["fighter", "arcane-archer", "arcane-shot"],
    {
      choiceGroup: choiceGroupByStage[stage],
      displayGroup: arcaneShotGroup,
      conflictsWith: allStageIds.filter((item) => item !== id),
    }
  );
}

const fighterFeatures = [
  feature(
    "fighter-second-wind",
    "Second Wind",
    "bonus-action",
    [availableTo(FIGHTER, 1)],
    true,
    "Draw on your stamina to regain Hit Points.",
    ["healing", "defense-protection"],
    [],
    ["bonus-action"],
    ["short-rest"],
    self,
    ["fighter", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  ...fightingStyleDefinitions.map(makeFightingStyle),

  feature(
    "fighter-action-surge",
    "Action Surge",
    "resource-feature",
    [availableTo(FIGHTER, 2)],
    true,
    "Immediately gain an additional Action. Recharges on Short Rest.",
    ["support-buff"],
    [],
    [],
    ["short-rest"],
    self,
    ["fighter", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "fighter-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(FIGHTER, 5)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "fighter-indomitable",
    "Indomitable",
    "passive",
    [availableTo(FIGHTER, 9)],
    true,
    "Reroll a failed Saving Throw.",
    ["defense-protection"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["fighter", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "fighter-improved-extra-attack",
    "Improved Extra Attack",
    "passive",
    [availableTo(FIGHTER, 11)],
    true,
    "Make two additional free attacks after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "fighter-champion-improved-critical-hit",
    "Improved Critical Hit",
    "passive",
    [availableTo(FIGHTER, 3, "Champion")],
    true,
    "The number you need to roll a Critical Hit while attacking is reduced by 1. This effect can stack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "champion"],
    {
      displayGroup: championGroup,
    }
  ),

  feature(
    "fighter-champion-remarkable-athlete-jump",
    "Remarkable Athlete: Jump",
    "passive",
    [availableTo(FIGHTER, 7, "Champion")],
    true,
    "Your Jump distance is increased by 3m.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "champion"],
    {
      displayGroup: championGroup,
    }
  ),

  feature(
    "fighter-champion-remarkable-athlete-proficiency",
    "Remarkable Athlete: Proficiency",
    "passive",
    [availableTo(FIGHTER, 7, "Champion")],
    true,
    "Add half your Proficiency Bonus to Strength, Dexterity, and Constitution Checks that you are not Proficient in.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "champion"],
    {
      displayGroup: championGroup,
    }
  ),

  ...fightingStyleDefinitions.map(makeChampionAdditionalFightingStyle),

  feature(
    "fighter-battle-master-superiority-dice",
    "Superiority Dice",
    "resource-feature",
    [availableTo(FIGHTER, 3, "Battle Master", 6)],
    true,
    "You have 4 Superiority Dice. They are d8s and fuel your Battle Master Manoeuvres. Expended dice are regained after a Short or Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["fighter", "battle-master", "resource"],
    {
      displayGroup: battleMasterGroup,
    }
  ),

  feature(
    "fighter-battle-master-superiority-dice-level-7",
    "Superiority Dice: 5",
    "resource-feature",
    [availableTo(FIGHTER, 7, "Battle Master", 9)],
    true,
    "You have 5 Superiority Dice.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["fighter", "battle-master", "resource"],
    {
      displayGroup: battleMasterGroup,
    }
  ),

  feature(
    "fighter-battle-master-improved-combat-superiority",
    "Improved Combat Superiority",
    "passive",
    [availableTo(FIGHTER, 10, "Battle Master")],
    true,
    "Your Superiority Die increases to a d10.",
    ["support-buff", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "battle-master"],
    {
      displayGroup: battleMasterGroup,
    }
  ),

  ...manoeuvreDefinitions.flatMap((manoeuvre) => [
    makeManoeuvreFeature(manoeuvre, "level-3"),
    makeManoeuvreFeature(manoeuvre, "level-7"),
    makeManoeuvreFeature(manoeuvre, "level-10"),
  ]),

  feature(
    "fighter-arcane-archer-lore",
    "Arcane Archer Lore",
    "passive",
    [availableTo(FIGHTER, 3, "Arcane Archer")],
    true,
    "Gain Arcana and Nature proficiency.",
    ["investigation-world-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "arcane-archer"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  feature(
    "fighter-arcane-archer-cantrip-choice-info",
    "Arcane Archer Cantrip Choice",
    "subclass-feature",
    [availableTo(FIGHTER, 3, "Arcane Archer")],
    true,
    "Choose 1 cantrip from Guidance, Light, or True Strike. This choice should be handled by the spell selection system, not duplicated as a class feature.",
    ["support-buff"],
    [],
    ["passive"],
    ["cantrip"],
    self,
    ["fighter", "arcane-archer", "spell-choice-info"],
    {
      displayGroup: spellcastingInfoGroup,
      isInformational: true,
    }
  ),

  feature(
    "fighter-arcane-archer-arcane-arrows-level-3",
    "Arcane Arrows: 4",
    "resource-feature",
    [availableTo(FIGHTER, 3, "Arcane Archer", 6)],
    true,
    "You have 4 Arcane Arrows. This resource is used to fire Arcane Shots and is replenished by a Short or Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["fighter", "arcane-archer", "resource"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  feature(
    "fighter-arcane-archer-curving-shot",
    "Curving Shot",
    "bonus-action",
    [availableTo(FIGHTER, 7, "Arcane Archer")],
    true,
    "When you miss with any magical ranged attack, use a Bonus Action to attack the next closest target with the same attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["none"],
    weaponRange,
    ["fighter", "arcane-archer"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  feature(
    "fighter-arcane-archer-magic-arrow",
    "Magic Arrow",
    "passive",
    [availableTo(FIGHTER, 7, "Arcane Archer")],
    true,
    "All of your ranged attacks are considered magical to overcome Resistance.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "arcane-archer"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  feature(
    "fighter-arcane-archer-arcane-arrows-level-7",
    "Arcane Arrows: 7",
    "resource-feature",
    [availableTo(FIGHTER, 7, "Arcane Archer", 9)],
    true,
    "You have 7 Arcane Arrows.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["fighter", "arcane-archer", "resource"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  feature(
    "fighter-arcane-archer-arcane-arrows-level-10",
    "Arcane Arrows: 10",
    "resource-feature",
    [availableTo(FIGHTER, 10, "Arcane Archer")],
    true,
    "You have 10 Arcane Arrows.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["fighter", "arcane-archer", "resource"],
    {
      displayGroup: arcaneArcherGroup,
    }
  ),

  ...arcaneShotDefinitions.flatMap((shot) => [
    makeArcaneShotFeature(shot, "level-3"),
    makeArcaneShotFeature(shot, "level-7"),
    makeArcaneShotFeature(shot, "level-10"),
  ]),

  feature(
    "fighter-eldritch-knight-weapon-bond",
    "Weapon Bond",
    "action",
    [availableTo(FIGHTER, 3, "Eldritch Knight")],
    true,
    "Ritually bind the weapon in your main hand. It cannot be knocked out of your hand and automatically returns when thrown.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    touch,
    ["fighter", "eldritch-knight"],
    {
      displayGroup: eldritchKnightGroup,
    }
  ),

  feature(
    "fighter-eldritch-knight-spellcasting-info",
    "Eldritch Knight Spellcasting",
    "subclass-feature",
    [availableTo(FIGHTER, 3, "Eldritch Knight")],
    true,
    "Eldritch Knight spell and cantrip choices should be handled by the spell selection system. Eldritch Knight uses Intelligence and learns from the Wizard list, favouring Abjuration and Evocation.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["fighter", "eldritch-knight", "spell-choice-info"],
    {
      displayGroup: spellcastingInfoGroup,
      isInformational: true,
    }
  ),

  feature(
    "fighter-eldritch-knight-war-magic",
    "War Magic",
    "passive",
    [availableTo(FIGHTER, 7, "Eldritch Knight")],
    true,
    "After you cast a cantrip, you can make a weapon attack using a Bonus Action.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "eldritch-knight"],
    {
      displayGroup: eldritchKnightGroup,
    }
  ),

  feature(
    "fighter-eldritch-knight-eldritch-strike",
    "Eldritch Strike",
    "passive",
    [availableTo(FIGHTER, 10, "Eldritch Knight")],
    true,
    "When you hit a creature with a weapon attack, it has Disadvantage on its next Saving Throw against a spell you cast before the end of your next turn.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["fighter", "eldritch-knight"],
    {
      displayGroup: eldritchKnightGroup,
    }
  ),
];

const fightingStyleIconEntries = Object.fromEntries([
  ...fightingStyleDefinitions.map((style) => [
    `fighter-fighting-style-${style.idBase}`,
    `Passive_Fighter_FightingStyle_${style.idBase}.png`,
  ]),
  ...fightingStyleDefinitions.map((style) => [
    `fighter-champion-additional-fighting-style-${style.idBase}`,
    `Passive_Fighter_FightingStyle_${style.idBase}.png`,
  ]),
]);

const manoeuvreIconEntries = Object.fromEntries(
  manoeuvreDefinitions.flatMap((manoeuvre) =>
    ["level-3", "level-7", "level-10"].map((stage) => [
      `fighter-battle-master-${stage}-${manoeuvre.idBase}`,
      `Action_Fighter_BattleMaster_${manoeuvre.idBase}.png`,
    ])
  )
);

const arcaneShotIconEntries = Object.fromEntries(
  arcaneShotDefinitions.flatMap((shot) =>
    ["level-3", "level-7", "level-10"].map((stage) => [
      `fighter-arcane-archer-${stage}-${shot.idBase}`,
      `Action_Fighter_ArcaneArcher_${shot.idBase}.png`,
    ])
  )
);

export const fighterClassModule: ClassFeatureModule = {
  className: "Fighter",
  defaultTabLabel: "Fighter Features",
  subclassTabLabels: {
    "Arcane Archer": "Arcane Shots",
    "Battle Master": "Manoeuvres",
    Champion: "Champion Features",
    "Eldritch Knight": "Weapon Bond & War Magic",
  },
  features: fighterFeatures,
  iconFileByFeatureId: {
    "fighter-second-wind": "Action_Fighter_SecondWind.png",
    "fighter-action-surge": "Action_Fighter_ActionSurge.png",
    "fighter-extra-attack": "Passive_ExtraAttack.png",
    "fighter-indomitable": "Passive_Fighter_Indomitable.png",
    "fighter-improved-extra-attack": "Passive_Fighter_ImprovedExtraAttack.png",

    "fighter-champion-improved-critical-hit":
      "Passive_Fighter_Champion_ImprovedCriticalHit.png",
    "fighter-champion-remarkable-athlete-jump":
      "Passive_Fighter_Champion_RemarkableAthleteJump.png",
    "fighter-champion-remarkable-athlete-proficiency":
      "Passive_Fighter_Champion_RemarkableAthleteProficiency.png",

    "fighter-battle-master-superiority-dice":
      "Passive_Fighter_BattleMaster_SuperiorityDice.png",
    "fighter-battle-master-superiority-dice-level-7":
      "Passive_Fighter_BattleMaster_SuperiorityDice.png",
    "fighter-battle-master-improved-combat-superiority":
      "Passive_Fighter_BattleMaster_ImprovedCombatSuperiority.png",

    "fighter-arcane-archer-lore":
      "Passive_Fighter_ArcaneArcher_ArcaneArcherLore.png",
    "fighter-arcane-archer-cantrip-choice-info":
      "Cantrips_Icon.png",
    "fighter-arcane-archer-arcane-arrows-level-3":
      "Passive_Fighter_ArcaneArcher_ArcaneArrows.png",
    "fighter-arcane-archer-arcane-arrows-level-7":
      "Passive_Fighter_ArcaneArcher_ArcaneArrows.png",
    "fighter-arcane-archer-arcane-arrows-level-10":
      "Passive_Fighter_ArcaneArcher_ArcaneArrows.png",
    "fighter-arcane-archer-curving-shot":
      "Action_Fighter_ArcaneArcher_CurvingShot.png",
    "fighter-arcane-archer-magic-arrow":
      "Passive_Fighter_ArcaneArcher_MagicArrow.png",

    "fighter-eldritch-knight-weapon-bond":
      "Action_Fighter_EldritchKnight_WeaponBond.png",
    "fighter-eldritch-knight-spellcasting-info":
      "Spell_School_Evocation_Icon.png",
    "fighter-eldritch-knight-war-magic":
      "Passive_Fighter_EldritchKnight_WarMagic.png",
    "fighter-eldritch-knight-eldritch-strike":
      "Passive_Fighter_EldritchKnight_EldritchStrike.png",

    ...fightingStyleIconEntries,
    ...manoeuvreIconEntries,
    ...arcaneShotIconEntries,
  },
};