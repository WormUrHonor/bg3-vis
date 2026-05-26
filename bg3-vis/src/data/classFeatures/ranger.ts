import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  melee,
  radiusRange,
  range18m,
  self,
  touch,
  weaponRange,
} from "./classFeatureHelpers";

const RANGER = "Ranger" as const;

const BEAST_MASTER = "Beast Master";
const GLOOM_STALKER = "Gloom Stalker";
const HUNTER = "Hunter";
const SWARMKEEPER = "Swarmkeeper";

const fightingStyleChoice = {
  id: "ranger-fighting-style",
  label: "Fighting Style",
  max: 1,
};

const hunterPreyChoice = {
  id: "ranger-hunter-hunters-prey",
  label: "Hunter's Prey",
  max: 1,
};

const defensiveTacticsChoice = {
  id: "ranger-hunter-defensive-tactics",
  label: "Defensive Tactics",
  max: 1,
};

const beastCompanionActiveGroup = {
  id: "ranger-beast-master-active-companion",
  label: "Active Companion",
  max: 1,
};

const gatheredSwarmChoice = {
  id: "ranger-swarmkeeper-gathered-swarm",
  label: "Gathered Swarm",
  max: 1,
};

const swarmEffectActiveGroup = {
  id: "ranger-swarmkeeper-active-swarm-effect",
  label: "Active Swarm Effect",
  max: 1,
};

const coreGroup = {
  id: "ranger-core",
  label: "Core Ranger Features",
  order: 10,
};

const fightingStyleGroup = {
  id: "ranger-fighting-styles",
  label: "Fighting Style Choice",
  order: 15,
};

const beastMasterGroup = {
  id: "ranger-beast-master",
  label: "Beast Master Features",
  order: 20,
};

const beastCompanionGroup = {
  id: "ranger-beast-master-companions",
  label: "Companion Assumption",
  order: 25,
};

const gloomStalkerGroup = {
  id: "ranger-gloom-stalker",
  label: "Gloom Stalker Features",
  order: 30,
};

const hunterGroup = {
  id: "ranger-hunter",
  label: "Hunter Features",
  order: 40,
};

const hunterChoiceGroup = {
  id: "ranger-hunter-choices",
  label: "Hunter Choices",
  order: 45,
};

const swarmkeeperGroup = {
  id: "ranger-swarmkeeper",
  label: "Swarmkeeper Features",
  order: 50,
};

const swarmChoiceGroup = {
  id: "ranger-swarmkeeper-swarm-choice",
  label: "Gathered Swarm Choice",
  order: 55,
};

const swarmEffectGroup = {
  id: "ranger-swarmkeeper-swarm-effects",
  label: "Swarm Effect Assumption",
  order: 60,
};

const subclassSpellGroup = {
  id: "ranger-subclass-spells",
  label: "Always Prepared Subclass Spells",
  order: 900,
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
    idBase: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    description:
      "When you make an offhand attack, you can add your Ability Score Modifier to the damage of the attack.",
    roles: ["single-target-damage"],
  },
];

function makeFightingStyle(style: FightingStyleDefinition) {
  return feature(
    `ranger-fighting-style-${style.idBase}`,
    style.name,
    "passive",
    [availableTo(RANGER, 2)],
    false,
    style.description,
    style.roles,
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "fighting-style"],
    {
      choiceGroup: fightingStyleChoice,
      displayGroup: fightingStyleGroup,
    }
  );
}

type BeastCompanionDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
};

const beastCompanionDefinitions: BeastCompanionDefinition[] = [
  {
    idBase: "bear",
    name: "Bear Companion",
    description:
      "Active companion assumption for the visualisation. The bear companion provides frontline control and physical damage, including Goading Roar and Claws, with later upgrades such as Honeyed Paws and Ursine Reinforcements.",
    roles: ["single-target-damage", "control", "defense-protection"],
    damageTypes: ["Slashing", "Bludgeoning"],
  },
  {
    idBase: "boar",
    name: "Boar Companion",
    description:
      "Active companion assumption for the visualisation. The boar companion provides physical damage and charge-based control, including Tusk Attack and Boar Charge, with later upgrades such as Rage, Frenzied Strike, and Kick Up Muck.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Piercing", "Bludgeoning"],
  },
  {
    idBase: "dire-raven",
    name: "Dire Raven Companion",
    description:
      "Active companion assumption for the visualisation. The dire raven provides mobility, vision disruption, and physical damage, including Beak Attack, Rend Vision, Fly, Bad Omen, On Black Wings, and Raven Sight.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Piercing"],
  },
  {
    idBase: "wolf",
    name: "Wolf Companion",
    description:
      "Active companion assumption for the visualisation. The wolf companion provides melee pressure and pack-based damage, including Bite, Lunging Bite, Pack Tactics, Infectious Bite, and Lupine Slash.",
    roles: ["single-target-damage", "support-buff", "control"],
    damageTypes: ["Piercing", "Slashing"],
  },
  {
    idBase: "wolf-spider",
    name: "Wolf Spider Companion",
    description:
      "Active companion assumption for the visualisation. The wolf spider provides poison, web control, and mobility, including Venomous Bite, Web, Web Walker, Darkvision, Cocoon, Bursting Brood, and Eight Legged Waltz.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Poison", "Piercing"],
  },
];

function makeBeastCompanion(companion: BeastCompanionDefinition) {
  return feature(
    `ranger-beast-master-companion-${companion.idBase}`,
    companion.name,
    "toggle",
    [availableTo(RANGER, 3, BEAST_MASTER)],
    true,
    companion.description,
    companion.roles,
    companion.damageTypes,
    ["passive"],
    ["none"],
    melee,
    ["ranger", "beast-master", "companion-assumption"],
    {
      displayGroup: beastCompanionGroup,
      activeGroup: beastCompanionActiveGroup,
      requires: ["ranger-beast-master-rangers-companion"],
    }
  );
}

type SwarmDefinition = {
  idBase: string;
  name: string;
  damageType: DamageType;
  utilityName: string;
  utilityDescription: string;
  mightyUtilityName: string;
  mightyUtilityDescription: string;
};

const swarmDefinitions: SwarmDefinition[] = [
  {
    idBase: "cloud-of-jellyfish",
    name: "Cloud of Jellyfish",
    damageType: "Lightning",
    utilityName: "Shocking Sting",
    utilityDescription:
      "Shock the target of your attack on a failed Constitution Saving Throw.",
    mightyUtilityName: "Mighty Shocking Sting",
    mightyUtilityDescription:
      "Shock and Disarm the target of your attack on a failed Constitution Saving Throw.",
  },
  {
    idBase: "flurry-of-moths",
    name: "Flurry of Moths",
    damageType: "Psychic",
    utilityName: "Blinding Swarm",
    utilityDescription:
      "Blind the target of your attack on a failed Constitution Saving Throw.",
    mightyUtilityName: "Mighty Blinding Swarm",
    mightyUtilityDescription:
      "Blind and Slow the target of your attack on a failed Constitution Saving Throw.",
  },
  {
    idBase: "legion-of-bees",
    name: "Legion of Bees",
    damageType: "Piercing",
    utilityName: "Knockback",
    utilityDescription:
      "Push the target of your attack back 5m on a failed Strength Saving Throw.",
    mightyUtilityName: "Mighty Knockback",
    mightyUtilityDescription:
      "Push the target of your attack back 5m and knock it Prone on a failed Strength Saving Throw.",
  },
];

function makeGatheredSwarmChoice(swarm: SwarmDefinition) {
  return feature(
    `ranger-swarmkeeper-${swarm.idBase}`,
    swarm.name,
    "subclass-feature",
    [availableTo(RANGER, 3, SWARMKEEPER)],
    false,
    `Choose ${swarm.name} as your gathered swarm. Once per round after landing an attack, this swarm can damage the target, apply its utility effect, or teleport you away.`,
    ["single-target-damage", "control", "mobility-positioning"],
    [swarm.damageType],
    ["passive"],
    ["none"],
    self,
    ["ranger", "swarmkeeper", "gathered-swarm"],
    {
      choiceGroup: gatheredSwarmChoice,
      displayGroup: swarmChoiceGroup,
    }
  );
}

function makeSwarmEffectFeatures(swarm: SwarmDefinition) {
  const baseRequirement = [`ranger-swarmkeeper-${swarm.idBase}`];

  return [
    feature(
      `ranger-swarmkeeper-${swarm.idBase}-attack`,
      `${swarm.name}: Attack`,
      "toggle",
      [availableTo(RANGER, 3, SWARMKEEPER, 10)],
      true,
      `Active swarm assumption for the visualisation. After you hit a target, your swarm deals an extra 1d6 ${swarm.damageType} damage.`,
      ["single-target-damage"],
      [swarm.damageType],
      ["passive"],
      ["none"],
      weaponRange,
      ["ranger", "swarmkeeper", "swarm-effect"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),

    feature(
      `ranger-swarmkeeper-${swarm.idBase}-teleport`,
      `${swarm.name}: Teleport`,
      "toggle",
      [availableTo(RANGER, 3, SWARMKEEPER, 10)],
      true,
      "Active swarm assumption for the visualisation. After you hit a target, your swarm teleports you 5m away.",
      ["mobility-positioning", "defense-protection"],
      [],
      ["passive"],
      ["none"],
      range18m,
      ["ranger", "swarmkeeper", "swarm-effect"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),

    feature(
      `ranger-swarmkeeper-${swarm.idBase}-utility`,
      `${swarm.name}: ${swarm.utilityName}`,
      "toggle",
      [availableTo(RANGER, 3, SWARMKEEPER, 10)],
      true,
      `Active swarm assumption for the visualisation. ${swarm.utilityDescription}`,
      ["control"],
      [],
      ["passive"],
      ["none"],
      weaponRange,
      ["ranger", "swarmkeeper", "swarm-effect"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),

    feature(
      `ranger-swarmkeeper-${swarm.idBase}-mighty-attack`,
      `${swarm.name}: Mighty Attack`,
      "toggle",
      [availableTo(RANGER, 11, SWARMKEEPER)],
      true,
      `Active swarm assumption for the visualisation. After you hit a target, your empowered swarm deals an extra 1d8 ${swarm.damageType} damage.`,
      ["single-target-damage"],
      [swarm.damageType],
      ["passive"],
      ["none"],
      weaponRange,
      ["ranger", "swarmkeeper", "swarm-effect", "mighty-swarm"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),

    feature(
      `ranger-swarmkeeper-${swarm.idBase}-mighty-teleport`,
      `${swarm.name}: Mighty Teleport`,
      "toggle",
      [availableTo(RANGER, 11, SWARMKEEPER)],
      true,
      "Active swarm assumption for the visualisation. Your swarm teleports you 5m away and grants +2 Armour Class for one turn.",
      ["mobility-positioning", "defense-protection"],
      [],
      ["passive"],
      ["none"],
      range18m,
      ["ranger", "swarmkeeper", "swarm-effect", "mighty-swarm"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),

    feature(
      `ranger-swarmkeeper-${swarm.idBase}-mighty-utility`,
      `${swarm.name}: ${swarm.mightyUtilityName}`,
      "toggle",
      [availableTo(RANGER, 11, SWARMKEEPER)],
      true,
      `Active swarm assumption for the visualisation. ${swarm.mightyUtilityDescription}`,
      ["control"],
      [],
      ["passive"],
      ["none"],
      weaponRange,
      ["ranger", "swarmkeeper", "swarm-effect", "mighty-swarm"],
      {
        displayGroup: swarmEffectGroup,
        activeGroup: swarmEffectActiveGroup,
        requires: baseRequirement,
      }
    ),
  ];
}

const rangerFeatures = [
  feature(
    "ranger-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(RANGER, 2)],
    true,
    "Rangers know a limited number of Always Prepared spells and use Wisdom as their Spellcasting Ability. Spell choice limits are handled by the generic spell-choice rule system.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),
  feature(
  "ranger-beast-tamer-find-familiar",
  "Find Familiar",
  "subclass-feature",
  [
    {
      className: RANGER,
      minLevel: 1,
      rangerNaturalExplorer: "Beast Tamer",
    },
  ],
  true,
  "Granted by Beast Tamer. Cast Find Familiar as a ritual once per Short Rest.",
  ["summon", "investigation-world-interaction"],
  [],
  ["action"],
  ["short-rest"],
  range18m,
  ["ranger", "natural-explorer", "fixed-ritual"],
  {
    displayGroup: subclassSpellGroup,
  }
),
  
  ...fightingStyleDefinitions.map(makeFightingStyle),

  feature(
    "ranger-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(RANGER, 5)],
    true,
    "Attack twice instead of once whenever you take the Attack action on your turn.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["ranger", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "ranger-lands-stride-difficult-terrain",
    "Land's Stride: Difficult Terrain",
    "passive",
    [availableTo(RANGER, 8)],
    true,
    "Difficult Terrain no longer slows you down.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "ranger-lands-stride-plants",
    "Land's Stride: Plants",
    "passive",
    [availableTo(RANGER, 8)],
    true,
    "Plant-based surfaces with thorns, spines, or similar hazards no longer harm you.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "ranger-hide-in-plain-sight",
    "Hide in Plain Sight",
    "action",
    [availableTo(RANGER, 10)],
    true,
    "Camouflage yourself with your environment to become Invisible and gain +10 to Stealth Checks as long as you stand still.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["action"],
    ["none"],
    self,
    ["ranger", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "ranger-beast-master-rangers-companion",
    "Ranger's Companion",
    "action",
    [availableTo(RANGER, 3, BEAST_MASTER)],
    true,
    "Summon a beast companion that accompanies you and fights alongside you. Recharges on Short Rest.",
    ["summon", "single-target-damage", "control"],
    ["Variable"],
    ["action"],
    ["short-rest"],
    self,
    ["ranger", "beast-master"],
    {
      displayGroup: beastMasterGroup,
    }
  ),

  ...beastCompanionDefinitions.map(makeBeastCompanion),

  feature(
    "ranger-beast-master-companions-bond",
    "Companion's Bond",
    "passive",
    [availableTo(RANGER, 5, BEAST_MASTER)],
    true,
    "Your Ranger's Companion receives a bonus to Armour Class and damage equal to your Proficiency Bonus. Companions also receive upgraded hit points, abilities, and a new visual look.",
    ["support-buff", "defense-protection", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "beast-master"],
    {
      displayGroup: beastMasterGroup,
    }
  ),

  feature(
    "ranger-beast-master-exceptional-training",
    "Exceptional Training",
    "passive",
    [availableTo(RANGER, 7, BEAST_MASTER)],
    true,
    "Your summoned companions can Dash, Disengage, and Help as a Bonus Action.",
    ["support-buff", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "beast-master"],
    {
      displayGroup: beastMasterGroup,
    }
  ),

  feature(
    "ranger-beast-master-companion-upgrade-level-8",
    "Companion Upgrade",
    "passive",
    [availableTo(RANGER, 8, BEAST_MASTER)],
    true,
    "Your Ranger's Companion receives upgraded hit points.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "beast-master"],
    {
      displayGroup: beastMasterGroup,
    }
  ),

  feature(
    "ranger-beast-master-bestial-fury",
    "Bestial Fury",
    "passive",
    [availableTo(RANGER, 11, BEAST_MASTER)],
    true,
    "Your companion gains an extra attack and receives upgraded hit points, abilities, and a new visual look.",
    ["support-buff", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "beast-master"],
    {
      displayGroup: beastMasterGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-disguise-self",
    "Disguise Self",
    "subclass-feature",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "Always Prepared Gloom Stalker spell. Change your appearance through illusion.",
    ["narrative-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    ["ranger", "gloom-stalker", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-umbral-shroud",
    "Umbral Shroud",
    "action",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "Wrap yourself in shadows to become Invisible if you are obscured. Recharges on Short Rest.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["action"],
    ["short-rest"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-superior-darkvision",
    "Superior Darkvision",
    "passive",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "See in the dark up to 24m.",
    ["investigation-world-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-dread-ambusher",
    "Dread Ambusher",
    "passive",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "Gain +3 Initiative. On the first turn of combat, Movement Speed increases by 3m and you can make an extra weapon attack that deals additional damage.",
    ["support-buff", "single-target-damage", "mobility-positioning"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-dread-ambusher-melee",
    "Dread Ambusher: Melee",
    "action",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "On the first turn of each combat, ambush a target with an additional swift melee attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
      requires: ["ranger-gloom-stalker-dread-ambusher"],
    }
  ),

  feature(
    "ranger-gloom-stalker-dread-ambusher-ranged",
    "Dread Ambusher: Ranged",
    "action",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "On the first turn of each combat, ambush a target with an additional swift ranged attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    weaponRange,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
      requires: ["ranger-gloom-stalker-dread-ambusher"],
    }
  ),

  feature(
    "ranger-gloom-stalker-dread-ambusher-hide",
    "Dread Ambusher: Hide",
    "bonus-action",
    [availableTo(RANGER, 3, GLOOM_STALKER)],
    true,
    "Hide from enemies by succeeding at Stealth checks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
      requires: ["ranger-gloom-stalker-dread-ambusher"],
    }
  ),

  feature(
    "ranger-gloom-stalker-misty-step",
    "Misty Step",
    "subclass-feature",
    [availableTo(RANGER, 5, GLOOM_STALKER)],
    true,
    "Always Prepared Gloom Stalker spell. Teleport to an unoccupied space you can see.",
    ["mobility-positioning"],
    [],
    ["bonus-action"],
    ["spell-slot"],
    range18m,
    ["ranger", "gloom-stalker", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-iron-mind",
    "Iron Mind",
    "passive",
    [availableTo(RANGER, 7, GLOOM_STALKER)],
    true,
    "Gain Proficiency in Wisdom and Intelligence Saving Throws.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-fear",
    "Fear",
    "subclass-feature",
    [availableTo(RANGER, 9, GLOOM_STALKER)],
    true,
    "Always Prepared Gloom Stalker spell. Project an image so frightening it makes targets drop their weapons and become Fearful.",
    ["control"],
    [],
    ["action"],
    ["spell-slot"],
    { label: "cone", meters: 9, category: "mid", shape: "cone" },
    ["ranger", "gloom-stalker", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-gloom-stalker-stalkers-flurry",
    "Stalker's Flurry",
    "passive",
    [availableTo(RANGER, 11, GLOOM_STALKER)],
    true,
    "When you miss with a weapon attack, make another one for free.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["ranger", "gloom-stalker"],
    {
      displayGroup: gloomStalkerGroup,
    }
  ),

  feature(
    "ranger-hunter-colossus-slayer",
    "Colossus Slayer",
    "subclass-feature",
    [availableTo(RANGER, 3, HUNTER)],
    false,
    "Once per turn, your weapon attack deals an extra 1d8 damage if the target is below its Hit Point maximum.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["ranger", "hunter", "hunters-prey"],
    {
      choiceGroup: hunterPreyChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-giant-killer",
    "Giant Killer",
    "subclass-feature",
    [availableTo(RANGER, 3, HUNTER)],
    false,
    "If a Large or bigger creature attacks you, you can use your Reaction to make a melee attack.",
    ["single-target-damage", "defense-protection"],
    ["Weapon"],
    ["reaction"],
    ["none"],
    melee,
    ["ranger", "hunter", "hunters-prey"],
    {
      choiceGroup: hunterPreyChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-horde-breaker",
    "Horde Breaker",
    "subclass-feature",
    [availableTo(RANGER, 3, HUNTER)],
    false,
    "Target two creatures standing close to each other, attacking them in quick succession.",
    ["area-damage", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["ranger", "hunter", "hunters-prey"],
    {
      choiceGroup: hunterPreyChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-horde-breaker-melee",
    "Horde Breaker: Melee",
    "action",
    [availableTo(RANGER, 3, HUNTER)],
    true,
    "Attack two nearby creatures in quick succession with a melee weapon.",
    ["area-damage", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["ranger", "hunter"],
    {
      displayGroup: hunterGroup,
      requires: ["ranger-hunter-horde-breaker"],
    }
  ),

  feature(
    "ranger-hunter-horde-breaker-ranged",
    "Horde Breaker: Ranged",
    "action",
    [availableTo(RANGER, 3, HUNTER)],
    true,
    "Attack two nearby creatures in quick succession with a ranged weapon.",
    ["area-damage", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    weaponRange,
    ["ranger", "hunter"],
    {
      displayGroup: hunterGroup,
      requires: ["ranger-hunter-horde-breaker"],
    }
  ),

  feature(
    "ranger-hunter-escape-the-horde",
    "Escape the Horde",
    "subclass-feature",
    [availableTo(RANGER, 7, HUNTER)],
    false,
    "Opportunity Attacks against you have Disadvantage.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "hunter", "defensive-tactics"],
    {
      choiceGroup: defensiveTacticsChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-steel-will",
    "Steel Will",
    "subclass-feature",
    [availableTo(RANGER, 7, HUNTER)],
    false,
    "Gain Advantage on Saving Throws against being Frightened.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "hunter", "defensive-tactics"],
    {
      choiceGroup: defensiveTacticsChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-multiattack-defence",
    "Multiattack Defence",
    "subclass-feature",
    [availableTo(RANGER, 7, HUNTER)],
    false,
    "When an enemy attacks you, they suffer a -4 penalty to additional Attack Rolls against you until the start of their next turn.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["ranger", "hunter", "defensive-tactics"],
    {
      choiceGroup: defensiveTacticsChoice,
      displayGroup: hunterChoiceGroup,
    }
  ),

  feature(
    "ranger-hunter-volley",
    "Volley",
    "action",
    [availableTo(RANGER, 11, HUNTER)],
    true,
    "Fire a cascade of magical broadheads and bodkin arrows upon nearby foes.",
    ["area-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    radiusRange("18m, 3m AoE", 18, "long", 3),
    ["ranger", "hunter"],
    {
      displayGroup: hunterGroup,
    }
  ),

  feature(
    "ranger-hunter-whirlwind-attack",
    "Whirlwind Attack",
    "action",
    [availableTo(RANGER, 11, HUNTER)],
    true,
    "Strike out at all nearby foes, making separate Attack Rolls against each target.",
    ["area-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    radiusRange("self, melee AoE", 1.5, "melee", 1.5),
    ["ranger", "hunter"],
    {
      displayGroup: hunterGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-preys-scent",
    "Prey's Scent",
    "passive",
    [availableTo(RANGER, 3, SWARMKEEPER)],
    true,
    "Your swarm deals additional damage to creatures marked by Hunter's Mark.",
    ["single-target-damage", "support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["ranger", "swarmkeeper"],
    {
      displayGroup: swarmkeeperGroup,
    }
  ),

  ...swarmDefinitions.map(makeGatheredSwarmChoice),

feature(
  "ranger-swarmkeeper-mage-hand",
  "Mage Hand",
  "subclass-feature",
  [availableTo(RANGER, 3, SWARMKEEPER)],
  true,
  "Always Prepared Swarmkeeper cantrip. Create a spectral hand that can manipulate, move, and interact with objects.",
  ["summon", "investigation-world-interaction"],
  [],
  ["action"],
  ["cantrip"],
  range18m,
  ["ranger", "swarmkeeper", "always-prepared-cantrip"],
  {
    displayGroup: subclassSpellGroup,
  }
),

  feature(
    "ranger-swarmkeeper-faerie-fire",
    "Faerie Fire",
    "subclass-feature",
    [availableTo(RANGER, 3, SWARMKEEPER)],
    true,
    "Always Prepared Swarmkeeper spell. Outline targets in light, giving Attack Rolls against them Advantage if they fail their Saving Throw.",
    ["support-buff", "control"],
    [],
    ["action"],
    ["spell-slot"],
    radiusRange("18m, 6m AoE", 18, "long", 6),
    ["ranger", "swarmkeeper", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-web",
    "Web",
    "subclass-feature",
    [availableTo(RANGER, 5, SWARMKEEPER)],
    true,
    "Always Prepared Swarmkeeper spell. Cover an area in thick, flammable webbing that can Enweb creatures and create Difficult Terrain.",
    ["control"],
    [],
    ["action"],
    ["spell-slot"],
    radiusRange("18m, 4m AoE", 18, "long", 4),
    ["ranger", "swarmkeeper", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-writhing-currents-3",
    "Writhing Currents: 3",
    "resource-feature",
    [availableTo(RANGER, 7, SWARMKEEPER, 8)],
    true,
    "You have 3 Writhing Currents, used to cast Writhing Tide. Replenished on a Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["ranger", "swarmkeeper", "resource"],
    {
      displayGroup: swarmkeeperGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-writhing-tide",
    "Writhing Tide",
    "bonus-action",
    [availableTo(RANGER, 7, SWARMKEEPER)],
    true,
    "Spend a Writhing Current. Gain a flying speed of 9m and become unaffected by surface effects.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["ranger", "swarmkeeper"],
    {
      displayGroup: swarmkeeperGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-writhing-currents-4",
    "Writhing Currents: 4",
    "resource-feature",
    [availableTo(RANGER, 9, SWARMKEEPER)],
    true,
    "You have 4 Writhing Currents, used to cast Writhing Tide. Replenished on a Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["ranger", "swarmkeeper", "resource"],
    {
      displayGroup: swarmkeeperGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-gaseous-form",
    "Gaseous Form",
    "subclass-feature",
    [availableTo(RANGER, 9, SWARMKEEPER)],
    true,
    "Always Prepared Swarmkeeper spell. Transform into a cloud of mist, gaining movement and defensive benefits.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["action"],
    ["spell-slot"],
    self,
    ["ranger", "swarmkeeper", "always-prepared-spell"],
    {
      displayGroup: subclassSpellGroup,
    }
  ),

  feature(
    "ranger-swarmkeeper-mighty-swarm",
    "Mighty Swarm",
    "passive",
    [availableTo(RANGER, 11, SWARMKEEPER)],
    true,
    "Your swarm grows stronger. Its regular attack deals 1d8 damage, its special attack gains an additional feature, and swarm teleporting also increases your Armour Class for the rest of the round.",
    ["single-target-damage", "control", "mobility-positioning", "defense-protection"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["ranger", "swarmkeeper"],
    {
      displayGroup: swarmkeeperGroup,
    }
  ),

  ...swarmDefinitions.flatMap(makeSwarmEffectFeatures),
];

const fightingStyleIconEntries = Object.fromEntries(
  fightingStyleDefinitions.map((style) => [
    `ranger-fighting-style-${style.idBase}`,
    `Passive_Ranger_FightingStyle_${style.idBase}.png`,
  ])
);

const beastCompanionIconEntries = Object.fromEntries(
  beastCompanionDefinitions.map((companion) => [
    `ranger-beast-master-companion-${companion.idBase}`,
    `Action_Ranger_BeastMaster_${companion.idBase}.png`,
  ])
);

const swarmChoiceIconEntries = Object.fromEntries(
  swarmDefinitions.map((swarm) => [
    `ranger-swarmkeeper-${swarm.idBase}`,
    `Passive_Ranger_Swarmkeeper_${swarm.idBase}.png`,
  ])
);

const swarmEffectIconEntries = Object.fromEntries(
  swarmDefinitions.flatMap((swarm) => [
    [
      `ranger-swarmkeeper-${swarm.idBase}-attack`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_attack.png`,
    ],
    [
      `ranger-swarmkeeper-${swarm.idBase}-teleport`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_teleport.png`,
    ],
    [
      `ranger-swarmkeeper-${swarm.idBase}-utility`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_utility.png`,
    ],
    [
      `ranger-swarmkeeper-${swarm.idBase}-mighty-attack`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_attack.png`,
    ],
    [
      `ranger-swarmkeeper-${swarm.idBase}-mighty-teleport`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_teleport.png`,
    ],
    [
      `ranger-swarmkeeper-${swarm.idBase}-mighty-utility`,
      `Action_Ranger_Swarmkeeper_${swarm.idBase}_utility.png`,
    ],
  ])
);

export const rangerClassModule: ClassFeatureModule = {
  className: "Ranger",
  defaultTabLabel: "Ranger Features",
  subclassTabLabels: {
    [BEAST_MASTER]: "Companion Features",
    [GLOOM_STALKER]: "Gloom Stalker Features",
    [HUNTER]: "Hunter Features",
    [SWARMKEEPER]: "Swarm Features",
  },
  features: rangerFeatures,
  iconFileByFeatureId: {
    "ranger-beast-tamer-find-familiar": "Spell_Conjuration_FindFamiliar.png",
    "ranger-spellcasting": "Passive_Ranger_Spellcasting.png",
    "ranger-extra-attack": "Passive_ExtraAttack.png",
    "ranger-lands-stride-difficult-terrain":
      "Passive_Ranger_LandsStrideDifficultTerrain.png",
    "ranger-lands-stride-plants": "Passive_Ranger_LandsStridePlants.png",
    "ranger-hide-in-plain-sight": "Action_Ranger_HideInPlainSight.png",

    "ranger-beast-master-rangers-companion":
      "Action_Ranger_BeastMaster_RangersCompanion.png",
    "ranger-beast-master-companions-bond":
      "Passive_Ranger_BeastMaster_CompanionsBond.png",
    "ranger-beast-master-exceptional-training":
      "Passive_Ranger_BeastMaster_ExceptionalTraining.png",
    "ranger-beast-master-companion-upgrade-level-8":
      "Passive_Ranger_BeastMaster_CompanionUpgrade.png",
    "ranger-beast-master-bestial-fury":
      "Passive_Ranger_BeastMaster_BestialFury.png",

    "ranger-gloom-stalker-disguise-self": "Spell_Illusion_DisguiseSelf.png",
    "ranger-gloom-stalker-umbral-shroud":
      "Action_Ranger_GloomStalker_UmbralShroud.png",
    "ranger-gloom-stalker-superior-darkvision":
      "Passive_Ranger_GloomStalker_SuperiorDarkvision.png",
    "ranger-gloom-stalker-dread-ambusher":
      "Passive_Ranger_GloomStalker_DreadAmbusher.png",
    "ranger-gloom-stalker-dread-ambusher-melee":
      "Action_Ranger_GloomStalker_DreadAmbusherMelee.png",
    "ranger-gloom-stalker-dread-ambusher-ranged":
      "Action_Ranger_GloomStalker_DreadAmbusherRanged.png",
    "ranger-gloom-stalker-dread-ambusher-hide":
      "Action_Ranger_GloomStalker_DreadAmbusherHide.png",
    "ranger-gloom-stalker-misty-step": "Spell_Conjuration_MistyStep.png",
    "ranger-gloom-stalker-iron-mind":
      "Passive_Ranger_GloomStalker_IronMind.png",
    "ranger-gloom-stalker-fear": "Spell_Illusion_Fear.png",
    "ranger-gloom-stalker-stalkers-flurry":
      "Passive_Ranger_GloomStalker_StalkersFlurry.png",

    "ranger-hunter-colossus-slayer":
      "Passive_Ranger_Hunter_ColossusSlayer.png",
    "ranger-hunter-giant-killer": "Reaction_Ranger_Hunter_GiantKiller.png",
    "ranger-hunter-horde-breaker": "Passive_Ranger_Hunter_HordeBreaker.png",
    "ranger-hunter-horde-breaker-melee":
      "Action_Ranger_Hunter_HordeBreakerMelee.png",
    "ranger-hunter-horde-breaker-ranged":
      "Action_Ranger_Hunter_HordeBreakerRanged.png",
    "ranger-hunter-escape-the-horde":
      "Passive_Ranger_Hunter_EscapeTheHorde.png",
    "ranger-hunter-steel-will": "Passive_Ranger_Hunter_SteelWill.png",
    "ranger-hunter-multiattack-defence":
      "Passive_Ranger_Hunter_MultiattackDefence.png",
    "ranger-hunter-volley": "Action_Ranger_Hunter_Volley.png",
    "ranger-hunter-whirlwind-attack":
      "Action_Ranger_Hunter_WhirlwindAttack.png",

    "ranger-swarmkeeper-preys-scent":
      "Passive_Ranger_Swarmkeeper_PreysScent.png",
    "ranger-swarmkeeper-mage-hand": "Spell_Conjuration_MageHand.png",
    "ranger-swarmkeeper-faerie-fire": "Spell_Evocation_FaerieFire.png",
    "ranger-swarmkeeper-web": "Spell_Conjuration_Web.png",
    "ranger-swarmkeeper-writhing-currents-3":
      "Passive_Ranger_Swarmkeeper_WrithingCurrents.png",
    "ranger-swarmkeeper-writhing-tide":
      "Action_Ranger_Swarmkeeper_WrithingTide.png",
    "ranger-swarmkeeper-writhing-currents-4":
      "Passive_Ranger_Swarmkeeper_WrithingCurrents.png",
    "ranger-swarmkeeper-gaseous-form": "Spell_Transmutation_GaseousForm.png",
    "ranger-swarmkeeper-mighty-swarm":
      "Passive_Ranger_Swarmkeeper_MightySwarm.png",

    ...fightingStyleIconEntries,
    ...beastCompanionIconEntries,
    ...swarmChoiceIconEntries,
    ...swarmEffectIconEntries,
  },
};