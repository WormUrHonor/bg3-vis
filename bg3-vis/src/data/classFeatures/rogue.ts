import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  melee,
  range18m,
  self,
  weaponRange,
} from "./classFeatureHelpers";

const ROGUE = "Rogue" as const;

const ARCANE_TRICKSTER = "Arcane Trickster";
const ASSASSIN = "Assassin";
const SWASHBUCKLER = "Swashbuckler";
const THIEF = "Thief";

const coreGroup = {
  id: "rogue-core",
  label: "Core Rogue Features",
  order: 10,
};

const sneakAttackGroup = {
  id: "rogue-sneak-attack",
  label: "Sneak Attack",
  order: 15,
};

const cunningActionGroup = {
  id: "rogue-cunning-action",
  label: "Cunning Action",
  order: 20,
};

const arcaneTricksterGroup = {
  id: "rogue-arcane-trickster",
  label: "Arcane Trickster Features",
  order: 30,
};

const arcaneTricksterSpellcastingGroup = {
  id: "rogue-arcane-trickster-spellcasting",
  label: "Arcane Trickster Spellcasting",
  order: 35,
};

const assassinGroup = {
  id: "rogue-assassin",
  label: "Assassin Features",
  order: 40,
};

const swashbucklerGroup = {
  id: "rogue-swashbuckler",
  label: "Swashbuckler Features",
  order: 50,
};

const dirtyTrickGroup = {
  id: "rogue-swashbuckler-dirty-tricks",
  label: "Dirty Tricks",
  order: 55,
};

const thiefGroup = {
  id: "rogue-thief",
  label: "Thief Features",
  order: 60,
};

type SneakAttackDiceDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  maxLevel?: number;
  damageDice: string;
};

const sneakAttackDiceDefinitions: SneakAttackDiceDefinition[] = [
  {
    idBase: "1d6",
    name: "Sneak Attack Damage: 1d6",
    minLevel: 1,
    maxLevel: 2,
    damageDice: "1d6",
  },
  {
    idBase: "2d6",
    name: "Sneak Attack Damage: 2d6",
    minLevel: 3,
    maxLevel: 4,
    damageDice: "2d6",
  },
  {
    idBase: "3d6",
    name: "Sneak Attack Damage: 3d6",
    minLevel: 5,
    maxLevel: 6,
    damageDice: "3d6",
  },
  {
    idBase: "4d6",
    name: "Sneak Attack Damage: 4d6",
    minLevel: 7,
    maxLevel: 8,
    damageDice: "4d6",
  },
  {
    idBase: "5d6",
    name: "Sneak Attack Damage: 5d6",
    minLevel: 9,
    maxLevel: 10,
    damageDice: "5d6",
  },
  {
    idBase: "6d6",
    name: "Sneak Attack Damage: 6d6",
    minLevel: 11,
    damageDice: "6d6",
  },
];

function makeSneakAttackDiceFeature(entry: SneakAttackDiceDefinition) {
  return feature(
    `rogue-sneak-attack-damage-${entry.idBase}`,
    entry.name,
    "resource-feature",
    [availableTo(ROGUE, entry.minLevel, entry.maxLevel)],
    true,
    `Your Sneak Attack deals ${entry.damageDice} additional damage once per turn when its conditions are met.`,
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["rogue", "sneak-attack", "damage-scaling"],
    {
      displayGroup: sneakAttackGroup,
    }
  );
}

type DirtyTrickDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
};

const dirtyTrickDefinitions: DirtyTrickDefinition[] = [
  {
    idBase: "flick-o-the-wrist",
    name: "Dirty Trick: Flick o' the Wrist",
    description:
      "Flick your weapon at a target and possibly Disarm them. Uses Charisma as its spellcasting modifier.",
    roles: ["control", "single-target-damage"],
    damageTypes: ["Weapon"],
  },
  {
    idBase: "sand-toss",
    name: "Dirty Trick: Sand Toss",
    description:
      "Toss a handful of sand at your enemy and possibly Blind them. Uses Dexterity.",
    roles: ["control"],
    damageTypes: [],
  },
  {
    idBase: "vicious-mockery",
    name: "Dirty Trick: Vicious Mockery",
    description:
      "Insult a creature, giving it Disadvantage on its next Attack Roll. Uses Charisma as its spellcasting modifier.",
    roles: ["control"],
    damageTypes: [],
  },
];

function makeDirtyTrick(entry: DirtyTrickDefinition) {
  return feature(
    `rogue-swashbuckler-dirty-trick-${entry.idBase}`,
    entry.name,
    "bonus-action",
    [availableTo(ROGUE, 4, SWASHBUCKLER)],
    true,
    entry.description,
    entry.roles,
    entry.damageTypes,
    ["bonus-action"],
    ["none"],
    range18m,
    ["rogue", "swashbuckler", "dirty-trick"],
    {
      displayGroup: dirtyTrickGroup,
    }
  );
}

const rogueFeatures = [
  ...sneakAttackDiceDefinitions.map(makeSneakAttackDiceFeature),

  feature(
    "rogue-expertise-level-1",
    "Expertise",
    "passive",
    [availableTo(ROGUE, 1, 5)],
    true,
    "Gain Expertise in 2 Skills you are Proficient in. The actual skill selection is handled in the class and scores tab.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "expertise"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "rogue-expertise-level-6",
    "Additional Expertise",
    "passive",
    [availableTo(ROGUE, 6)],
    true,
    "Gain Expertise in 2 additional Skills you are Proficient in. The actual skill selection is handled in the class and scores tab.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "expertise"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "rogue-sneak-attack-melee",
    "Sneak Attack: Melee",
    "action",
    [availableTo(ROGUE, 1)],
    true,
    "Deal extra damage to a foe you have Advantage against. Recharges once per turn.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["rogue", "sneak-attack"],
    {
      displayGroup: sneakAttackGroup,
    }
  ),

  feature(
    "rogue-sneak-attack-ranged",
    "Sneak Attack: Ranged",
    "action",
    [availableTo(ROGUE, 1)],
    true,
    "Deal extra damage to a foe you have Advantage against. Recharges once per turn.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    weaponRange,
    ["rogue", "sneak-attack"],
    {
      displayGroup: sneakAttackGroup,
    }
  ),

  feature(
    "rogue-cunning-action-dash",
    "Cunning Action: Dash",
    "bonus-action",
    [availableTo(ROGUE, 2)],
    true,
    "Cover more distance this turn by doubling your movement speed.",
    ["mobility-positioning"],
    [],
    ["bonus-action"],
    ["none"],
    self,
    ["rogue", "cunning-action"],
    {
      displayGroup: cunningActionGroup,
    }
  ),

  feature(
    "rogue-cunning-action-disengage",
    "Cunning Action: Disengage",
    "bonus-action",
    [availableTo(ROGUE, 2)],
    true,
    "Retreat safely. Moving will not provoke Opportunity Attacks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    self,
    ["rogue", "cunning-action"],
    {
      displayGroup: cunningActionGroup,
    }
  ),

  feature(
    "rogue-cunning-action-hide",
    "Cunning Action: Hide",
    "bonus-action",
    [availableTo(ROGUE, 2)],
    true,
    "Hide from enemies by succeeding at Stealth checks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    self,
    ["rogue", "cunning-action"],
    {
      displayGroup: cunningActionGroup,
    }
  ),

  feature(
    "rogue-uncanny-dodge",
    "Uncanny Dodge",
    "reaction",
    [availableTo(ROGUE, 5)],
    true,
    "When an attack hits you, use your lightning-quick reflexes to take only half the usual damage.",
    ["defense-protection"],
    [],
    ["reaction"],
    ["none"],
    self,
    ["rogue", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "rogue-evasion",
    "Evasion",
    "passive",
    [availableTo(ROGUE, 7)],
    true,
    "When a spell or effect would deal half damage on a successful Dexterity Saving Throw, it deals no damage if you succeed and only half damage if you fail.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "rogue-reliable-talent",
    "Reliable Talent",
    "passive",
    [availableTo(ROGUE, 11)],
    true,
    "When you make an Ability Check with a Skill you are Proficient with, the lowest result you can roll on the die is 10.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-mage-hand-legerdemain",
    "Mage Hand Legerdemain",
    "passive",
    [availableTo(ROGUE, 3, ARCANE_TRICKSTER)],
    true,
    "When you cast Mage Hand, the spectral hand is invisible and permanent.",
    ["summon", "investigation-world-interaction"],
    [],
    ["passive"],
    ["none"],
    range18m,
    ["rogue", "arcane-trickster"],
    {
      displayGroup: arcaneTricksterGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-mage-hand",
    "Mage Hand",
    "subclass-feature",
    [availableTo(ROGUE, 3, ARCANE_TRICKSTER)],
    true,
    "Granted by Arcane Trickster. Create a spectral hand that can manipulate and interact with objects.",
    ["summon", "investigation-world-interaction"],
    [],
    ["action"],
    ["cantrip"],
    range18m,
    ["rogue", "arcane-trickster", "fixed-cantrip"],
    {
      displayGroup: arcaneTricksterSpellcastingGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-spellcasting-level-3",
    "Arcane Trickster Spellcasting",
    "resource-feature",
    [availableTo(ROGUE, 3, ARCANE_TRICKSTER, 3)],
    true,
    "You gain two Level 1 Spell Slots. Choose 2 Wizard cantrips, 2 Enchantment or Illusion spells, and 1 spell from any Wizard school.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["rogue", "arcane-trickster", "spellcasting"],
    {
      displayGroup: arcaneTricksterSpellcastingGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-spellcasting-level-4",
    "Arcane Trickster Spellcasting: 3 Level I Slots",
    "resource-feature",
    [availableTo(ROGUE, 4, ARCANE_TRICKSTER, 6)],
    true,
    "You gain three Level 1 Spell Slots and know one additional Enchantment or Illusion spell.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["rogue", "arcane-trickster", "spellcasting"],
    {
      displayGroup: arcaneTricksterSpellcastingGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-spellcasting-level-7",
    "Arcane Trickster Spellcasting: Level II Slots",
    "resource-feature",
    [availableTo(ROGUE, 7, ARCANE_TRICKSTER, 9)],
    true,
    "You gain four Level 1 Spell Slots and two Level 2 Spell Slots. You can learn one additional Enchantment or Illusion spell.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["rogue", "arcane-trickster", "spellcasting"],
    {
      displayGroup: arcaneTricksterSpellcastingGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-spellcasting-level-10",
    "Arcane Trickster Spellcasting: Expanded",
    "resource-feature",
    [availableTo(ROGUE, 10, ARCANE_TRICKSTER)],
    true,
    "You gain six Level 1 Spell Slots and two Level 2 Spell Slots. You also know one additional Wizard cantrip and one additional Enchantment or Illusion spell.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["rogue", "arcane-trickster", "spellcasting"],
    {
      displayGroup: arcaneTricksterSpellcastingGroup,
    }
  ),

  feature(
    "rogue-arcane-trickster-magical-ambush",
    "Magical Ambush",
    "passive",
    [availableTo(ROGUE, 9, ARCANE_TRICKSTER)],
    true,
    "While you are Hiding, targets have Disadvantage on Saving Throws against your spells.",
    ["support-buff", "control"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "arcane-trickster"],
    {
      displayGroup: arcaneTricksterGroup,
    }
  ),

  feature(
    "rogue-assassin-assassins-alacrity",
    "Assassin's Alacrity",
    "passive",
    [availableTo(ROGUE, 3, ASSASSIN)],
    true,
    "Immediately restore your Action and Bonus Action at the start of combat.",
    ["single-target-damage", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "assassin"],
    {
      displayGroup: assassinGroup,
    }
  ),

  feature(
    "rogue-assassin-assassinate-ambush",
    "Assassinate: Ambush",
    "passive",
    [availableTo(ROGUE, 3, ASSASSIN)],
    true,
    "Any successful Attack Roll against a Surprised creature is a Critical Hit.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["rogue", "assassin"],
    {
      displayGroup: assassinGroup,
    }
  ),

  feature(
    "rogue-assassin-assassinate-initiative",
    "Assassinate: Initiative",
    "passive",
    [availableTo(ROGUE, 3, ASSASSIN)],
    true,
    "You have Advantage on Attack Rolls against creatures that have not taken a turn yet.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["rogue", "assassin"],
    {
      displayGroup: assassinGroup,
    }
  ),

  feature(
    "rogue-assassin-infiltration-expertise",
    "Infiltration Expertise",
    "action",
    [availableTo(ROGUE, 9, ASSASSIN)],
    true,
    "Adopt a new identity, changing your appearance.",
    ["narrative-interaction", "investigation-world-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    ["rogue", "assassin"],
    {
      displayGroup: assassinGroup,
    }
  ),

  feature(
    "rogue-swashbuckler-fancy-footwork",
    "Fancy Footwork",
    "passive",
    [availableTo(ROGUE, 3, SWASHBUCKLER)],
    true,
    "If you make a melee attack against a target, that target cannot make Opportunity Attacks against you for the rest of your turn.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    melee,
    ["rogue", "swashbuckler"],
    {
      displayGroup: swashbucklerGroup,
    }
  ),

  feature(
    "rogue-swashbuckler-rakish-audacity",
    "Rakish Audacity",
    "passive",
    [availableTo(ROGUE, 3, SWASHBUCKLER)],
    true,
    "Gain a bonus to Initiative. You no longer need Advantage to trigger Sneak Attack if the target is within melee range and you do not have Disadvantage.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    melee,
    ["rogue", "swashbuckler"],
    {
      displayGroup: swashbucklerGroup,
    }
  ),

  feature(
    "rogue-swashbuckler-rakish-sneak-attack-melee",
    "Rakish Sneak Attack: Melee",
    "action",
    [availableTo(ROGUE, 3, SWASHBUCKLER)],
    true,
    "Deal Sneak Attack damage with a melee weapon. You can use this without Advantage when Rakish Audacity conditions are met. Recharges once per turn.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["rogue", "swashbuckler", "sneak-attack"],
    {
      displayGroup: swashbucklerGroup,
    }
  ),

  feature(
    "rogue-swashbuckler-rakish-sneak-attack-ranged",
    "Rakish Sneak Attack: Ranged",
    "action",
    [availableTo(ROGUE, 3, SWASHBUCKLER)],
    true,
    "Deal Sneak Attack damage with a ranged weapon. You can use this without Advantage when Rakish Audacity conditions are met. Recharges once per turn.",
    ["single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    weaponRange,
    ["rogue", "swashbuckler", "sneak-attack"],
    {
      displayGroup: swashbucklerGroup,
    }
  ),

  ...dirtyTrickDefinitions.map(makeDirtyTrick),

  feature(
    "rogue-swashbuckler-panache",
    "Panache",
    "action",
    [availableTo(ROGUE, 9, SWASHBUCKLER)],
    true,
    "Roll a Persuasion check to beguile a humanoid. Enemies who fail gain Disadvantage; non-enemies who fail become Charmed.",
    ["control", "narrative-interaction"],
    [],
    ["action"],
    ["none"],
    range18m,
    ["rogue", "swashbuckler"],
    {
      displayGroup: swashbucklerGroup,
    }
  ),

  feature(
    "rogue-thief-fast-hands",
    "Fast Hands",
    "passive",
    [availableTo(ROGUE, 3, THIEF)],
    true,
    "Gain an additional Bonus Action.",
    ["mobility-positioning", "support-buff", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "thief"],
    {
      displayGroup: thiefGroup,
    }
  ),

  feature(
    "rogue-thief-second-story-work",
    "Second-Story Work",
    "passive",
    [availableTo(ROGUE, 3, THIEF)],
    true,
    "You have mastered the art of falling and gain Resistance to Falling damage.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["rogue", "thief"],
    {
      displayGroup: thiefGroup,
    }
  ),

  feature(
    "rogue-thief-supreme-sneak",
    "Supreme Sneak",
    "action",
    [availableTo(ROGUE, 9, THIEF)],
    true,
    "Blend into the environment so completely that you become Invisible.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["action"],
    ["none"],
    self,
    ["rogue", "thief"],
    {
      displayGroup: thiefGroup,
    }
  ),
];

const dirtyTrickIconEntries = Object.fromEntries(
  dirtyTrickDefinitions.map((entry) => [
    `rogue-swashbuckler-dirty-trick-${entry.idBase}`,
    `Action_Rogue_Swashbuckler_DirtyTrick_${entry.idBase}.png`,
  ])
);

export const rogueClassModule: ClassFeatureModule = {
  className: "Rogue",
  defaultTabLabel: "Rogue Features",
  subclassTabLabels: {
    [ARCANE_TRICKSTER]: "Arcane Trickster Features",
    [ASSASSIN]: "Assassin Features",
    [SWASHBUCKLER]: "Swashbuckler Features",
    [THIEF]: "Thief Features",
  },
  features: rogueFeatures,
  iconFileByFeatureId: {
    "rogue-sneak-attack-damage-1d6": "Passive_Rogue_SneakAttackDamage.png",
    "rogue-sneak-attack-damage-2d6": "Passive_Rogue_SneakAttackDamage.png",
    "rogue-sneak-attack-damage-3d6": "Passive_Rogue_SneakAttackDamage.png",
    "rogue-sneak-attack-damage-4d6": "Passive_Rogue_SneakAttackDamage.png",
    "rogue-sneak-attack-damage-5d6": "Passive_Rogue_SneakAttackDamage.png",
    "rogue-sneak-attack-damage-6d6": "Passive_Rogue_SneakAttackDamage.png",

    "rogue-expertise-level-1": "Passive_Rogue_Expertise.png",
    "rogue-expertise-level-6": "Passive_Rogue_Expertise.png",
    "rogue-sneak-attack-melee": "Action_Rogue_SneakAttackMelee.png",
    "rogue-sneak-attack-ranged": "Action_Rogue_SneakAttackRanged.png",
    "rogue-cunning-action-dash": "Action_Rogue_CunningActionDash.png",
    "rogue-cunning-action-disengage":
      "Action_Rogue_CunningActionDisengage.png",
    "rogue-cunning-action-hide": "Action_Rogue_CunningActionHide.png",
    "rogue-uncanny-dodge": "Reaction_Rogue_UncannyDodge.png",
    "rogue-evasion": "Passive_Rogue_Evasion.png",
    "rogue-reliable-talent": "Passive_Rogue_ReliableTalent.png",

    "rogue-arcane-trickster-mage-hand-legerdemain":
      "Passive_Rogue_ArcaneTrickster_MageHandLegerdemain.png",
    "rogue-arcane-trickster-mage-hand": "Spell_Conjuration_MageHand.png",
    "rogue-arcane-trickster-spellcasting-level-3":
      "Passive_Rogue_ArcaneTrickster_Spellcasting.png",
    "rogue-arcane-trickster-spellcasting-level-4":
      "Passive_Rogue_ArcaneTrickster_Spellcasting.png",
    "rogue-arcane-trickster-spellcasting-level-7":
      "Passive_Rogue_ArcaneTrickster_Spellcasting.png",
    "rogue-arcane-trickster-spellcasting-level-10":
      "Passive_Rogue_ArcaneTrickster_Spellcasting.png",
    "rogue-arcane-trickster-magical-ambush":
      "Passive_Rogue_ArcaneTrickster_MagicalAmbush.png",

    "rogue-assassin-assassins-alacrity":
      "Passive_Rogue_Assassin_AssassinsAlacrity.png",
    "rogue-assassin-assassinate-ambush":
      "Passive_Rogue_Assassin_AssassinateAmbush.png",
    "rogue-assassin-assassinate-initiative":
      "Passive_Rogue_Assassin_AssassinateInitiative.png",
    "rogue-assassin-infiltration-expertise":
      "Action_Rogue_Assassin_InfiltrationExpertise.png",

    "rogue-swashbuckler-fancy-footwork":
      "Passive_Rogue_Swashbuckler_FancyFootwork.png",
    "rogue-swashbuckler-rakish-audacity":
      "Passive_Rogue_Swashbuckler_RakishAudacity.png",
    "rogue-swashbuckler-rakish-sneak-attack-melee":
      "Action_Rogue_Swashbuckler_RakishSneakAttackMelee.png",
    "rogue-swashbuckler-rakish-sneak-attack-ranged":
      "Action_Rogue_Swashbuckler_RakishSneakAttackRanged.png",
    "rogue-swashbuckler-panache": "Action_Rogue_Swashbuckler_Panache.png",

    "rogue-thief-fast-hands": "Passive_Rogue_Thief_FastHands.png",
    "rogue-thief-second-story-work":
      "Passive_Rogue_Thief_SecondStoryWork.png",
    "rogue-thief-supreme-sneak": "Action_Rogue_Thief_SupremeSneak.png",

    ...dirtyTrickIconEntries,
  },
};