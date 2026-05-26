import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  melee,
  radiusRange,
  range18m,
  range9m,
  self,
  touch,
  weaponRange,
} from "./classFeatureHelpers";

const BARBARIAN = "Barbarian" as const;

const bestialHeartChoice = {
  id: "barbarian-wildheart-bestial-heart",
  label: "Bestial Heart",
  max: 1,
};

const animalAspectLevel6Choice = {
  id: "barbarian-wildheart-animal-aspect-level-6",
  label: "Animal Aspect",
  max: 1,
};

const animalAspectLevel10Choice = {
  id: "barbarian-wildheart-animal-aspect-level-10",
  label: "Additional Animal Aspect",
  max: 1,
};

const coreGroup = {
  id: "barbarian-core",
  label: "Core Barbarian Features",
  order: 10,
};

const berserkerGroup = {
  id: "barbarian-berserker",
  label: "Berserker Features",
  order: 20,
};

const giantGroup = {
  id: "barbarian-giant",
  label: "Giant Features",
  order: 30,
};

const wildMagicGroup = {
  id: "barbarian-wild-magic",
  label: "Wild Magic Features",
  order: 40,
};

const wildMagicEffectsGroup = {
  id: "barbarian-wild-magic-effects",
  label: "Possible Wild Magic Effects",
  order: 45,
};

const wildheartGroup = {
  id: "barbarian-wildheart",
  label: "Wildheart Features",
  order: 50,
};

const bestialHeartGroup = {
  id: "barbarian-wildheart-hearts",
  label: "Bestial Heart Choice",
  order: 55,
};

const animalAspectGroup = {
  id: "barbarian-wildheart-aspects",
  label: "Animal Aspect Choices",
  order: 60,
};

const elementalCleaverActiveGroup = {
  id: "barbarian-giant-active-elemental-cleaver",
  label: "Active Elemental Cleaver Damage",
  max: 1,
};

const makeWildheartAspect = (
  idBase: string,
  name: string,
  description: string,
  roles: AbilityRole[] = ["support-buff"],
  damageTypes: DamageType[] = []
) => [
  feature(
    `barbarian-wildheart-aspect-${idBase}-level-6`,
    `Aspect of the Beast: ${name}`,
    "subclass-feature",
    [availableTo(BARBARIAN, 6, "Wildheart")],
    false,
    description,
    roles,
    damageTypes,
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "animal-aspect"],
    {
      choiceGroup: animalAspectLevel6Choice,
      displayGroup: animalAspectGroup,
    }
  ),

  feature(
    `barbarian-wildheart-aspect-${idBase}-level-10`,
    `Additional Aspect: ${name}`,
    "subclass-feature",
    [availableTo(BARBARIAN, 10, "Wildheart")],
    false,
    description,
    roles,
    damageTypes,
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "animal-aspect"],
    {
      choiceGroup: animalAspectLevel10Choice,
      displayGroup: animalAspectGroup,
      conflictsWith: [`barbarian-wildheart-aspect-${idBase}-level-6`],
    }
  ),
];

const barbarianFeatures = [
  feature(
    "barbarian-rage",
    "Rage",
    "bonus-action",
    [availableTo(BARBARIAN, 1, 2)],
    true,
    "Enter a rage. While raging, melee, improvised, and thrown weapon attacks deal extra damage. You also gain Resistance to physical damage and Advantage on Strength Checks and Strength Saving Throws.",
    ["support-buff", "defense-protection", "single-target-damage"],
    ["Physical"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "rage", "class-action"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-unarmoured-defence",
    "Unarmoured Defence",
    "passive",
    [availableTo(BARBARIAN, 1)],
    true,
    "While not wearing armour, you add your Constitution Modifier to your Armour Class.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-reckless-attack",
    "Reckless Attack",
    "action",
    [availableTo(BARBARIAN, 2)],
    true,
    "Gain Advantage on a melee Attack Roll. Until your next turn, enemies also have Advantage on Attack Rolls against you.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["barbarian", "class-action"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-danger-sense",
    "Danger Sense",
    "passive",
    [availableTo(BARBARIAN, 2)],
    true,
    "Gain Advantage on Dexterity Saving Throws against traps, spells, and surfaces, unless Blinded or Incapacitated.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(BARBARIAN, 5)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-fast-movement",
    "Fast Movement",
    "passive",
    [availableTo(BARBARIAN, 5)],
    true,
    "Movement Speed increases by 3m while not wearing Heavy Armour.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-feral-instinct",
    "Feral Instinct",
    "passive",
    [availableTo(BARBARIAN, 7)],
    true,
    "Gain +3 Initiative and immunity to being Surprised.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-brutal-critical",
    "Brutal Critical",
    "passive",
    [availableTo(BARBARIAN, 9)],
    true,
    "When you land a Critical Hit, roll an extra damage die in addition to the normal extra critical die.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-relentless-rage",
    "Relentless Rage",
    "passive",
    [availableTo(BARBARIAN, 11)],
    true,
    "Once per Short Rest, if you drop to 0 Hit Points while Enraged, regain 1 Hit Point instead of being Downed.",
    ["defense-protection", "healing"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["barbarian", "passive"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "barbarian-berserker-rage-becomes-frenzy",
    "Rage Becomes Frenzy",
    "passive",
    [availableTo(BARBARIAN, 3, "Berserker")],
    true,
    "Your bloodthirst transforms Rage into Frenzy. This is a passive subclass conversion rather than a separate selectable action.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "berserker", "passive"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-frenzy",
    "Frenzy",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Berserker")],
    true,
    "Your Rage becomes Frenzy. While Frenzied, you gain Frenzied Strike, Enraged Throw, and can make an Improvised Melee Weapon attack as a Bonus Action.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "berserker", "rage"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-frenzied-strike",
    "Frenzied Strike",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Berserker")],
    true,
    "Make a melee attack with your equipped weapon as a Bonus Action while Frenzied.",
    ["single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["none"],
    melee,
    ["barbarian", "berserker", "rage-action"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-enraged-throw",
    "Enraged Throw",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Berserker")],
    true,
    "Pick up an item or creature and throw it at a target, dealing additional damage and knocking it Prone.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    range18m,
    ["barbarian", "berserker", "rage-action"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-mindless-rage",
    "Mindless Rage",
    "passive",
    [availableTo(BARBARIAN, 6, "Berserker")],
    true,
    "While Frenzied, you cannot be Charmed or Frightened, and Calm Emotions no longer ends your rage.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "berserker", "passive"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-intimidating-presence",
    "Intimidating Presence",
    "action",
    [availableTo(BARBARIAN, 10, "Berserker")],
    true,
    "Menace an enemy and instil Fear within them. The effect can be prolonged with Maintain Intimidating Presence.",
    ["control"],
    [],
    ["action"],
    ["none"],
    range9m,
    ["barbarian", "berserker", "class-action"],
    {
      displayGroup: berserkerGroup,
    }
  ),

  feature(
    "barbarian-berserker-maintain-intimidating-presence",
    "Maintain Intimidating Presence",
    "action",
    [availableTo(BARBARIAN, 10, "Berserker")],
    true,
    "Prolong the Fear caused by Intimidating Presence.",
    ["control"],
    [],
    ["action"],
    ["none"],
    range9m,
    ["barbarian", "berserker", "class-action"],
    {
      displayGroup: berserkerGroup,
      requires: ["barbarian-berserker-intimidating-presence"],
    }
  ),

  feature(
    "barbarian-giant-giants-rage",
    "Giant's Rage",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Giant")],
    true,
    "Enter a Rage and increase in size. Your Rage damage bonus is doubled on Throw attacks.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "giant", "rage"],
    {
      displayGroup: giantGroup,
    }
  ),

  feature(
    "barbarian-giant-vapraks-greed",
    "Vaprak's Greed",
    "passive",
    [availableTo(BARBARIAN, 3, "Giant")],
    true,
    "Your carrying capacity is increased by a quarter.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "giant", "passive"],
    {
      displayGroup: giantGroup,
    }
  ),

  feature(
    "barbarian-giant-thaumaturgy",
    "Thaumaturgy",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Giant")],
    true,
    "Gain Advantage on Intimidation and Performance Checks. This cantrip is granted automatically by the Giant subclass and is not a selectable cantrip choice.",
    ["narrative-interaction", "support-buff"],
    [],
    ["action"],
    ["cantrip"],
    self,
    ["barbarian", "giant", "fixed-cantrip"],
    {
      displayGroup: giantGroup,
    }
  ),

  feature(
    "barbarian-giant-boot-of-the-giants",
    "Boot of the Giants",
    "bonus-action",
    [availableTo(BARBARIAN, 5, "Giant")],
    true,
    "Try to kick a target away. Your chances depend on Athletics and are higher if you are hidden or invisible.",
    ["control", "mobility-positioning"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    melee,
    ["barbarian", "giant", "class-action"],
    {
      displayGroup: giantGroup,
    }
  ),

feature(
  "barbarian-giant-elemental-cleaver",
  "Elemental Cleaver",
  "subclass-feature",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Channel primordial might into your weapon. Until the end of Rage, it deals additional Acid, Cold, Fire, Lightning, or Thunder damage and gains the Thrown property. If thrown, it immediately reappears in your hand.",
  ["support-buff", "single-target-damage"],
  ["Variable"],
  ["bonus-action"],
  ["none"],
  touch,
  ["barbarian", "giant", "class-action"],
  {
    displayGroup: giantGroup,
  }
),

feature(
  "barbarian-giant-elemental-cleaver-acid",
  "Elemental Cleaver: Acid",
  "toggle",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Active Elemental Cleaver assumption for the visualisation. Your weapon deals additional Acid damage while Elemental Cleaver is active.",
  ["single-target-damage"],
  ["Acid"],
  ["passive"],
  ["none"],
  touch,
  ["barbarian", "giant", "elemental-cleaver-mode"],
  {
    displayGroup: giantGroup,
    activeGroup: elementalCleaverActiveGroup,
    requires: ["barbarian-giant-elemental-cleaver"],
  }
),

feature(
  "barbarian-giant-elemental-cleaver-cold",
  "Elemental Cleaver: Cold",
  "toggle",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Active Elemental Cleaver assumption for the visualisation. Your weapon deals additional Cold damage while Elemental Cleaver is active.",
  ["single-target-damage"],
  ["Cold"],
  ["passive"],
  ["none"],
  touch,
  ["barbarian", "giant", "elemental-cleaver-mode"],
  {
    displayGroup: giantGroup,
    activeGroup: elementalCleaverActiveGroup,
    requires: ["barbarian-giant-elemental-cleaver"],
  }
),

feature(
  "barbarian-giant-elemental-cleaver-fire",
  "Elemental Cleaver: Fire",
  "toggle",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Active Elemental Cleaver assumption for the visualisation. Your weapon deals additional Fire damage while Elemental Cleaver is active.",
  ["single-target-damage"],
  ["Fire"],
  ["passive"],
  ["none"],
  touch,
  ["barbarian", "giant", "elemental-cleaver-mode"],
  {
    displayGroup: giantGroup,
    activeGroup: elementalCleaverActiveGroup,
    requires: ["barbarian-giant-elemental-cleaver"],
  }
),

feature(
  "barbarian-giant-elemental-cleaver-lightning",
  "Elemental Cleaver: Lightning",
  "toggle",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Active Elemental Cleaver assumption for the visualisation. Your weapon deals additional Lightning damage while Elemental Cleaver is active.",
  ["single-target-damage"],
  ["Lightning"],
  ["passive"],
  ["none"],
  touch,
  ["barbarian", "giant", "elemental-cleaver-mode"],
  {
    displayGroup: giantGroup,
    activeGroup: elementalCleaverActiveGroup,
    requires: ["barbarian-giant-elemental-cleaver"],
  }
),

feature(
  "barbarian-giant-elemental-cleaver-thunder",
  "Elemental Cleaver: Thunder",
  "toggle",
  [availableTo(BARBARIAN, 6, "Giant")],
  true,
  "Active Elemental Cleaver assumption for the visualisation. Your weapon deals additional Thunder damage while Elemental Cleaver is active.",
  ["single-target-damage"],
  ["Thunder"],
  ["passive"],
  ["none"],
  touch,
  ["barbarian", "giant", "elemental-cleaver-mode"],
  {
    displayGroup: giantGroup,
    activeGroup: elementalCleaverActiveGroup,
    requires: ["barbarian-giant-elemental-cleaver"],
  }
),

  feature(
    "barbarian-giant-mighty-impel",
    "Mighty Impel",
    "bonus-action",
    [availableTo(BARBARIAN, 10, "Giant")],
    true,
    "Throw a creature or object that is Medium-sized or smaller.",
    ["single-target-damage", "control", "mobility-positioning"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    range18m,
    ["barbarian", "giant", "class-action"],
    {
      displayGroup: giantGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-rage",
    "Rage: Wild Magic",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Enter a Rage that releases the magic roiling inside you, causing one random Wild Magic effect.",
    ["support-buff", "area-damage", "control"],
    ["Variable"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wild-magic", "rage"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-magic-awareness",
    "Magic Awareness",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Anyone within range adds a bonus to Saving Throws. Recharges on Short Rest.",
    ["support-buff", "defense-protection"],
    [],
    ["bonus-action"],
    ["short-rest"],
    radiusRange("self, 3m AoE", 3, "melee", 3),
    ["barbarian", "wild-magic", "class-action"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-bolstering-magic-boon",
    "Bolstering Magic: Boon",
    "action",
    [availableTo(BARBARIAN, 6, "Wild Magic")],
    true,
    "You or an ally receive a bonus to Attack Rolls and Ability Checks for 10 turns. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    touch,
    ["barbarian", "wild-magic", "class-action"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-bolstering-magic-level-1",
    "Bolstering Magic: Level 1 Spell Slot",
    "action",
    [availableTo(BARBARIAN, 6, "Wild Magic")],
    true,
    "You or an ally recover a Level 1 Spell Slot. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    touch,
    ["barbarian", "wild-magic", "class-action"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-bolstering-magic-level-2",
    "Bolstering Magic: Level 2 Spell Slot",
    "action",
    [availableTo(BARBARIAN, 6, "Wild Magic")],
    true,
    "You or an ally recover a Level 2 Spell Slot. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    touch,
    ["barbarian", "wild-magic", "class-action"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-bolstering-magic-level-3",
    "Bolstering Magic: Level 3 Spell Slot",
    "action",
    [availableTo(BARBARIAN, 9, "Wild Magic")],
    true,
    "You or an ally recover a Level 3 Spell Slot. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    touch,
    ["barbarian", "wild-magic", "class-action"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-unstable-backlash",
    "Unstable Backlash",
    "reaction",
    [availableTo(BARBARIAN, 10, "Wild Magic")],
    true,
    "While enraged, when you take damage or fail a Saving Throw, trigger another Wild Magic effect that replaces the current one.",
    ["support-buff", "area-damage", "control"],
    ["Variable"],
    ["reaction"],
    ["none"],
    self,
    ["barbarian", "wild-magic", "reaction"],
    {
      displayGroup: wildMagicGroup,
    }
  ),

  feature(
    "barbarian-wild-magic-weapon-infusion",
    "Wild Magic: Weapon Infusion",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Magic infuses your weapon. It deals additional Force damage and gains the Light and Thrown properties. If thrown, it reappears in your hand at the end of your turn.",
    ["support-buff", "single-target-damage"],
    ["Force", "Weapon"],
    ["passive"],
    ["none"],
    weaponRange,
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-magic-retribution",
    "Wild Magic: Magic Retribution",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Enemies that hit you take Force damage in retaliation.",
    ["single-target-damage", "defense-protection"],
    ["Force"],
    ["reaction"],
    ["none"],
    melee,
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-protective-lights",
    "Wild Magic: Protective Lights",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. You and allies within 3m gain a bonus to Armour Class.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, 3m AoE", 3, "melee", 3),
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-intangible-spirit",
    "Wild Magic: Intangible Spirit",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Each turn, you can summon a spectral flumph within 10m as a Bonus Action. It explodes at the end of your turn, dealing Force damage in a 4.5m area.",
    ["summon", "area-damage"],
    ["Force"],
    ["bonus-action"],
    ["none"],
    radiusRange("10m, 4.5m AoE", 10, "mid", 4.5),
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-bolt-of-light",
    "Wild Magic: Bolt of Light",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Each turn, you can shoot a Bolt of Light at a target within 10m as a Bonus Action, dealing Radiant damage and potentially Blinding it.",
    ["single-target-damage", "control"],
    ["Radiant"],
    ["bonus-action"],
    ["none"],
    { label: "10m", meters: 10, category: "mid", shape: "single-target" },
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-vine-growth",
    "Wild Magic: Vine Growth",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Flowers and vines spread outward from you in a 4.5m radius, creating Difficult Terrain for everyone other than you.",
    ["control"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, 4.5m AoE", 4.5, "melee", 4.5),
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-teleport",
    "Wild Magic: Teleport",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Each turn, you can teleport to an unoccupied space you can see within 18m as a Bonus Action.",
    ["mobility-positioning"],
    [],
    ["bonus-action"],
    ["none"],
    range18m,
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wild-magic-dark-tendrils",
    "Wild Magic: Dark Tendrils",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wild Magic")],
    true,
    "Random Wild Magic effect. Shadowy tendrils lash outwards. Creatures within 9m can take Necrotic damage, and you gain temporary Hit Points.",
    ["area-damage", "defense-protection"],
    ["Necrotic"],
    ["passive"],
    ["none"],
    radiusRange("self, 9m AoE", 9, "mid", 9),
    ["barbarian", "wild-magic", "wild-magic-effect"],
    {
      displayGroup: wildMagicEffectsGroup,
      isInformational: true,
    }
  ),

  feature(
    "barbarian-wildheart-speak-with-animals",
    "Speak with Animals",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Gain the ability to comprehend and communicate with beasts. Recharges on Long Rest.",
    ["narrative-interaction"],
    [],
    ["action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "spell-feature"],
    {
      displayGroup: wildheartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-bear-heart",
    "Bear Heart",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    false,
    "While Raging, gain Resistance to all damage except Psychic damage and gain Unrelenting Ferocity.",
    ["defense-protection", "healing"],
    [],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      choiceGroup: bestialHeartChoice,
      displayGroup: bestialHeartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-eagle-heart",
    "Eagle Heart",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    false,
    "While Raging, gain Diving Strike. Foes have Disadvantage on Opportunity Attacks against you, and you can Dash as a Bonus Action.",
    ["mobility-positioning", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      choiceGroup: bestialHeartChoice,
      displayGroup: bestialHeartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-elk-heart",
    "Elk Heart",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    false,
    "While Raging, gain Primal Stampede and increase Movement Speed by 4.5m.",
    ["mobility-positioning", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      choiceGroup: bestialHeartChoice,
      displayGroup: bestialHeartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-tiger-heart",
    "Tiger Heart",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    false,
    "While Raging, gain Tiger's Bloodlust and increase jump distance by 4.5m.",
    ["area-damage", "single-target-damage"],
    ["Weapon", "Slashing"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      choiceGroup: bestialHeartChoice,
      displayGroup: bestialHeartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-wolf-heart",
    "Wolf Heart",
    "subclass-feature",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    false,
    "While Raging, gain Inciting Howl. Allies have Advantage on melee Attack Rolls against enemies within 2m of you.",
    ["support-buff", "control"],
    [],
    ["bonus-action"],
    ["long-rest"],
    radiusRange("self, 2m AoE", 2, "melee", 2),
    ["barbarian", "wildheart", "bestial-heart"],
    {
      choiceGroup: bestialHeartChoice,
      displayGroup: bestialHeartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-unrelenting-ferocity",
    "Unrelenting Ferocity",
    "action",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Bear Heart rage action. Use rage-fuelled endurance to restore yourself.",
    ["healing", "defense-protection"],
    [],
    ["action"],
    ["none"],
    self,
    ["barbarian", "wildheart", "heart-granted-action"],
    {
      displayGroup: wildheartGroup,
      requires: ["barbarian-wildheart-bear-heart"],
    }
  ),

  feature(
    "barbarian-wildheart-diving-strike",
    "Diving Strike",
    "action",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Eagle Heart rage action. Leap down onto a target with a weapon strike.",
    ["mobility-positioning", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    weaponRange,
    ["barbarian", "wildheart", "heart-granted-action"],
    {
      displayGroup: wildheartGroup,
      requires: ["barbarian-wildheart-eagle-heart"],
    }
  ),

  feature(
    "barbarian-wildheart-primal-stampede",
    "Primal Stampede",
    "action",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Elk Heart rage action. Charge forward and knock enemies in your path Prone.",
    ["mobility-positioning", "area-damage", "control"],
    ["Bludgeoning"],
    ["action"],
    ["none"],
    { label: "9m line", meters: 9, category: "mid", shape: "line" },
    ["barbarian", "wildheart", "heart-granted-action"],
    {
      displayGroup: wildheartGroup,
      requires: ["barbarian-wildheart-elk-heart"],
    }
  ),

  feature(
    "barbarian-wildheart-tigers-bloodlust",
    "Tiger's Bloodlust",
    "action",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Tiger Heart rage action. Lash out at multiple nearby enemies and inflict Bleeding.",
    ["area-damage", "control"],
    ["Weapon", "Slashing"],
    ["action"],
    ["none"],
    radiusRange("melee cleave", 1.5, "melee", 1.5),
    ["barbarian", "wildheart", "heart-granted-action"],
    {
      displayGroup: wildheartGroup,
      requires: ["barbarian-wildheart-tiger-heart"],
    }
  ),

  feature(
    "barbarian-wildheart-inciting-howl",
    "Inciting Howl",
    "bonus-action",
    [availableTo(BARBARIAN, 3, "Wildheart")],
    true,
    "Wolf Heart rage action. Incite allies and improve their pressure against nearby enemies.",
    ["support-buff"],
    [],
    ["bonus-action"],
    ["none"],
    radiusRange("self, 9m AoE", 9, "mid", 9),
    ["barbarian", "wildheart", "heart-granted-action"],
    {
      displayGroup: wildheartGroup,
      requires: ["barbarian-wildheart-wolf-heart"],
    }
  ),

  feature(
    "barbarian-wildheart-land-stride-difficult-terrain",
    "Land's Stride: Difficult Terrain",
    "passive",
    [availableTo(BARBARIAN, 8, "Wildheart")],
    true,
    "Difficult Terrain no longer slows you down.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "passive"],
    {
      displayGroup: wildheartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-land-stride-advantage",
    "Land's Stride: Advantage",
    "passive",
    [availableTo(BARBARIAN, 8, "Wildheart")],
    true,
    "Gain Advantage on Saving Throws against plants that are magically created to impede movement.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "passive"],
    {
      displayGroup: wildheartGroup,
    }
  ),

  feature(
    "barbarian-wildheart-land-stride-plants",
    "Land's Stride: Plants",
    "passive",
    [availableTo(BARBARIAN, 8, "Wildheart")],
    true,
    "Plant-based surfaces with thorns, spines, or similar hazards no longer harm you.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "passive"],
    {
      displayGroup: wildheartGroup,
    }
  ),

  ...makeWildheartAspect(
    "bear",
    "Bear",
    "Carrying capacity is doubled, and you have Advantage on Strength Checks.",
    ["support-buff"]
  ),

  ...makeWildheartAspect(
    "chimpanzee",
    "Chimpanzee",
    "Gain Resistance to fall damage, and throwing Camp Supplies Blinds targets.",
    ["defense-protection", "control"]
  ),

  ...makeWildheartAspect(
    "crocodile",
    "Crocodile",
    "Movement Speed increases by 3m while standing in water-based surfaces. On slippery surfaces, you have Advantage on Saving Throws against being knocked Prone.",
    ["mobility-positioning", "defense-protection"]
  ),

  ...makeWildheartAspect(
    "eagle",
    "Eagle",
    "See in the dark up to 12m and gain Advantage on Perception Checks.",
    ["investigation-world-interaction", "support-buff"]
  ),

  ...makeWildheartAspect(
    "elk",
    "Elk",
    "You and nearby allies within 18m gain permanent additional Movement Speed.",
    ["mobility-positioning", "support-buff"]
  ),

  ...makeWildheartAspect(
    "honey-badger",
    "Honey Badger",
    "If Poisoned, Frightened, or Charmed at the start of your turn, you have a chance to begin Raging without expending a Rage Charge.",
    ["defense-protection", "support-buff"]
  ),

  ...makeWildheartAspect(
    "stallion",
    "Stallion",
    "Dashing grants temporary Hit Points equal to twice your Barbarian level.",
    ["defense-protection", "mobility-positioning"]
  ),

  ...makeWildheartAspect(
    "tiger",
    "Tiger",
    "Add an additional Strength modifier to Attack Rolls against Bleeding or Poisoned targets, and gain proficiency in Survival.",
    ["single-target-damage", "support-buff"],
    ["Weapon"]
  ),

  ...makeWildheartAspect(
    "wolf",
    "Wolf",
    "You and nearby allies within 18m add your Dexterity modifier as a bonus to Stealth Checks.",
    ["support-buff"]
  ),

  ...makeWildheartAspect(
    "wolverine",
    "Wolverine",
    "When you attack a Bleeding or Poisoned target, you inflict Maim on them.",
    ["single-target-damage", "control"],
    ["Weapon"]
  ),
];

const aspectIconEntries = [
  "Bear",
  "Chimpanzee",
  "Crocodile",
  "Eagle",
  "Elk",
  "Honey Badger",
  "Stallion",
  "Tiger",
  "Wolf",
  "Wolverine",
].flatMap((aspectName) => {
  const idBase = aspectName.toLowerCase().replaceAll(" ", "-");
  const fileBase = aspectName.replaceAll(" ", "");

  return [
    [
      `barbarian-wildheart-aspect-${idBase}-level-6`,
      `Passive_Barbarian_Wildheart_Aspect${fileBase}.png`,
    ],
    [
      `barbarian-wildheart-aspect-${idBase}-level-10`,
      `Passive_Barbarian_Wildheart_Aspect${fileBase}.png`,
    ],
  ] as const;
});

export const barbarianClassModule: ClassFeatureModule = {
  className: "Barbarian",
  defaultTabLabel: "Rage Actions",
  subclassTabLabels: {
    Berserker: "Frenzy Actions",
    Giant: "Giant Rage Actions",
    "Wild Magic": "Wild Magic Rage",
    Wildheart: "Bestial Hearts",
  },
  features: barbarianFeatures,
  iconFileByFeatureId: {
    "barbarian-rage": "Action_Barbarian_Rage.png",
    "barbarian-unarmoured-defence": "Passive_Barbarian_UnarmouredDefence.png",
    "barbarian-reckless-attack": "Action_Barbarian_RecklessAttack.png",
    "barbarian-danger-sense": "Passive_Barbarian_DangerSense.png",
    "barbarian-extra-attack": "Passive_ExtraAttack.png",
    "barbarian-fast-movement": "Passive_Barbarian_FastMovement.png",
    "barbarian-feral-instinct": "Passive_Barbarian_FeralInstinct.png",
    "barbarian-brutal-critical": "Passive_Barbarian_BrutalCritical.png",
    "barbarian-relentless-rage": "Passive_Barbarian_RelentlessRage.png",

    "barbarian-berserker-rage-becomes-frenzy":
      "Passive_Barbarian_Berserker_RageBecomesFrenzy.png",
    "barbarian-berserker-frenzy": "Action_Barbarian_Berserker_Frenzy.png",
    "barbarian-berserker-frenzied-strike":
      "Action_Barbarian_Berserker_FrenziedStrike.png",
    "barbarian-berserker-enraged-throw":
      "Action_Barbarian_Berserker_EnragedThrow.png",
    "barbarian-berserker-mindless-rage":
      "Passive_Barbarian_Berserker_MindlessRage.png",
    "barbarian-berserker-intimidating-presence":
      "Action_Barbarian_Berserker_IntimidatingPresence.png",
    "barbarian-berserker-maintain-intimidating-presence":
      "Action_Barbarian_Berserker_MaintainIntimidatingPresence.webp",

    "barbarian-giant-giants-rage": "Action_Barbarian_Giant_GiantsRage.png",
    "barbarian-giant-vapraks-greed": "Passive_Barbarian_Giant_VapraksGreed.png",
    "barbarian-giant-thaumaturgy": "Spell_Transmutation_Thaumaturgy.png",
    "barbarian-giant-boot-of-the-giants":
      "Action_Barbarian_Giant_BootOfTheGiants.png",
    "barbarian-giant-elemental-cleaver":
      "Action_Barbarian_Giant_ElementalCleaver.png",
    "barbarian-giant-mighty-impel": "Action_Barbarian_Giant_MightyImpel.png",
"barbarian-giant-elemental-cleaver-acid":
  "Action_Barbarian_Giant_ElementalCleaver.png",
"barbarian-giant-elemental-cleaver-cold":
  "Action_Barbarian_Giant_ElementalCleaver_C.webp",
"barbarian-giant-elemental-cleaver-fire":
  "Action_Barbarian_Giant_ElementalCleaver_F.webp",
"barbarian-giant-elemental-cleaver-lightning":
  "Action_Barbarian_Giant_ElementalCleaver_L.webp",
"barbarian-giant-elemental-cleaver-thunder":
  "Action_Barbarian_Giant_ElementalCleaver_T.webp",
    "barbarian-wild-magic-rage": "Action_Barbarian_WildMagic_Rage.png",
    "barbarian-wild-magic-magic-awareness":
      "Action_Barbarian_WildMagic_MagicAwareness.png",
    "barbarian-wild-magic-bolstering-magic-boon":
      "Action_Barbarian_WildMagic_BolsteringMagicBoon.png",
    "barbarian-wild-magic-bolstering-magic-level-1":
      "Action_Barbarian_WildMagic_BolsteringMagicLevel1.png",
    "barbarian-wild-magic-bolstering-magic-level-2":
      "Action_Barbarian_WildMagic_BolsteringMagicLevel2.png",
    "barbarian-wild-magic-bolstering-magic-level-3":
      "Action_Barbarian_WildMagic_BolsteringMagicLevel3.png",
    "barbarian-wild-magic-unstable-backlash":
      "Reaction_Barbarian_WildMagic_UnstableBacklash.png",
    "barbarian-wild-magic-weapon-infusion":
      "Passive_Barbarian_WildMagic_WeaponInfusion.png",
    "barbarian-wild-magic-magic-retribution":
      "Passive_Barbarian_WildMagic_MagicRetribution.png",
    "barbarian-wild-magic-protective-lights":
      "Passive_Barbarian_WildMagic_ProtectiveLights.png",
    "barbarian-wild-magic-intangible-spirit":
      "Action_Barbarian_WildMagic_IntangibleSpirit.png",
    "barbarian-wild-magic-bolt-of-light":
      "Action_Barbarian_WildMagic_BoltOfLight.png",
    "barbarian-wild-magic-vine-growth":
      "Passive_Barbarian_WildMagic_VineGrowth.png",
    "barbarian-wild-magic-teleport": "Action_Barbarian_WildMagic_Teleport.png",
    "barbarian-wild-magic-dark-tendrils":
      "Passive_Barbarian_WildMagic_DarkTendrils.png",

    "barbarian-wildheart-speak-with-animals":
      "Spell_Divination_SpeakWithAnimals.png",
    "barbarian-wildheart-bear-heart": "Action_Barbarian_Wildheart_BearHeart.png",
    "barbarian-wildheart-eagle-heart": "Action_Barbarian_Wildheart_EagleHeart.png",
    "barbarian-wildheart-elk-heart": "Action_Barbarian_Wildheart_ElkHeart.png",
    "barbarian-wildheart-tiger-heart": "Action_Barbarian_Wildheart_TigerHeart.png",
    "barbarian-wildheart-wolf-heart": "Action_Barbarian_Wildheart_WolfHeart.png",
    "barbarian-wildheart-unrelenting-ferocity":
      "Action_Barbarian_Wildheart_UnrelentingFerocity.png",
    "barbarian-wildheart-diving-strike":
      "Action_Barbarian_Wildheart_DivingStrike.png",
    "barbarian-wildheart-primal-stampede":
      "Action_Barbarian_Wildheart_PrimalStampede.png",
    "barbarian-wildheart-tigers-bloodlust":
      "Action_Barbarian_Wildheart_TigersBloodlust.png",
    "barbarian-wildheart-inciting-howl":
      "Action_Barbarian_Wildheart_IncitingHowl.png",
    "barbarian-wildheart-land-stride-difficult-terrain":
      "Passive_Barbarian_Wildheart_LandsStrideDifficultTerrain.png",
    "barbarian-wildheart-land-stride-advantage":
      "Passive_Barbarian_Wildheart_LandsStrideAdvantage.png",
    "barbarian-wildheart-land-stride-plants":
      "Passive_Barbarian_Wildheart_LandsStridePlants.png",

    ...Object.fromEntries(aspectIconEntries),
  },
};