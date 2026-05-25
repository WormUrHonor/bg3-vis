import type {
  AbilityScore,
  ElementalAdeptDamageType,
  FeatDefinition,
  FeatName,
  Skill,
} from "../types/buildPlannerTypes";

export const featNames: FeatName[] = [
  "Ability Improvement",
  "Actor",
  "Alert",
  "Athlete",
  "Charger",
  "Crossbow Expert",
  "Defensive Duellist",
  "Dual Wielder",
  "Dungeon Delver",
  "Durable",
  "Elemental Adept",
  "Great Weapon Master",
  "Heavily Armoured",
  "Heavy Armour Master",
  "Lightly Armoured",
  "Lucky",
  "Mage Slayer",
  "Magic Initiate: Bard",
  "Magic Initiate: Cleric",
  "Magic Initiate: Druid",
  "Magic Initiate: Sorcerer",
  "Magic Initiate: Warlock",
  "Magic Initiate: Wizard",
  "Martial Adept",
  "Medium Armour Master",
  "Mobile",
  "Moderately Armoured",
  "Performer",
  "Polearm Master",
  "Resilient",
  "Ritual Caster",
  "Savage Attacker",
  "Sentinel",
  "Sharpshooter",
  "Shield Master",
  "Skilled",
  "Spell Sniper",
  "Tavern Brawler",
  "Tough",
  "War Caster",
  "Weapon Master",
];

export const elementalAdeptDamageTypes: ElementalAdeptDamageType[] = [
  "Acid",
  "Cold",
  "Fire",
  "Lightning",
  "Thunder",
];

export const ritualCasterSpells = [
  "Speak with Dead",
  "Find Familiar",
  "Longstrider",
  "Enhance Leap",
  "Disguise Self",
  "Speak with Animals",
];

export const spellSniperCantrips = [
  "Bone Chill",
  "Eldritch Blast",
  "Fire Bolt",
  "Ray of Frost",
  "Shocking Grasp",
  "Thorn Whip",
];

export const weaponMasterWeaponTypes = [
  "Battleaxes",
  "Clubs",
  "Daggers",
  "Flails",
  "Glaives",
  "Greataxes",
  "Greatclubs",
  "Greatswords",
  "Halberds",
  "Hand Crossbows",
  "Handaxes",
  "Heavy Crossbows",
  "Javelins",
  "Light Crossbows",
  "Light Hammers",
  "Longbows",
  "Longswords",
  "Maces",
  "Mauls",
  "Morningstars",
  "Pikes",
  "Quarterstaves",
  "Rapiers",
  "Scimitars",
  "Shortbows",
  "Shortswords",
  "Sickles",
  "Slings",
  "Spears",
  "Tridents",
  "War Picks",
  "Warhammers",
];

export const battleMasterManoeuvres = [
  "Commander's Strike",
  "Disarming Attack",
  "Distracting Strike",
  "Evasive Footwork",
  "Feinting Attack",
  "Goading Attack",
  "Menacing Attack",
  "Precision Attack",
  "Pushing Attack",
  "Rally",
  "Riposte",
  "Sweeping Attack",
  "Trip Attack",
];

const strengthDexterity: AbilityScore[] = ["Strength", "Dexterity"];
const strengthConstitution: AbilityScore[] = ["Strength", "Constitution"];
const allAbilities: AbilityScore[] = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

const actorSkills: Skill[] = ["Deception", "Performance"];

export const bg3Feats: FeatDefinition[] = [
  {
    name: "Ability Improvement",
    choiceKind: "ability-improvement",
    description:
      "Increase one ability score by 2, or two ability scores by 1, up to a maximum of 20.",
  },
  {
    name: "Actor",
    choiceKind: "none",
    description:
      "Charisma increases by 1. You gain proficiency and expertise in Deception and Performance.",
    fixedAbilityIncrease: { Charisma: 1 },
    grantsSkillProficiencies: actorSkills,
    grantsSkillExpertise: actorSkills,
  },
  {
    name: "Alert",
    choiceKind: "none",
    description: "Gain +5 initiative and immunity to being Surprised.",
  },
  {
    name: "Athlete",
    choiceKind: "single-ability",
    description:
      "Increase Strength or Dexterity by 1. Standing from Prone costs less movement and jump distance increases by 50%.",
    abilityOptions: strengthDexterity,
  },
  {
    name: "Charger",
    choiceKind: "none",
    description:
      "Gain Charger: Weapon Attack and Charger: Shove, allowing forward movement into an attack or shove without provoking Opportunity Attacks.",
  },
  {
    name: "Crossbow Expert",
    choiceKind: "none",
    description:
      "Crossbow attacks in melee range do not have Disadvantage. Piercing Shot inflicts Gaping Wounds for longer.",
  },
  {
    name: "Defensive Duellist",
    choiceKind: "none",
    description:
      "When attacked in melee while wielding a proficient Finesse weapon, use a Reaction to increase Armour Class by proficiency bonus.",
    requirements: "Requires Dexterity 13.",
  },
  {
    name: "Dual Wielder",
    choiceKind: "none",
    description:
      "Allows Two-Weapon Fighting with non-Light weapons, except Two-Handed weapons. Grants +1 Armour Class while dual-wielding melee weapons.",
  },
  {
    name: "Dungeon Delver",
    choiceKind: "none",
    description:
      "Gain Advantage on Perception checks to detect hidden objects and on Saving Throws against traps. Gain resistance to trap damage.",
  },
  {
    name: "Durable",
    choiceKind: "none",
    description:
      "Constitution increases by 1. Regain full hit points whenever taking a Short Rest.",
    fixedAbilityIncrease: { Constitution: 1 },
  },
  {
    name: "Elemental Adept",
    choiceKind: "elemental-adept",
    description:
      "Choose Acid, Cold, Fire, Lightning, or Thunder. Your spells and attacks ignore resistance to that damage type, and spell damage dice of 1 are treated as 2.",
  },
  {
    name: "Great Weapon Master",
    choiceKind: "none",
    description:
      "Critical hits or kills with melee weapons allow a Bonus Action melee attack. All In gives -5 Attack Roll and +10 damage with proficient Two-Handed or Versatile melee weapons.",
  },
  {
    name: "Heavily Armoured",
    choiceKind: "none",
    description: "Strength increases by 1 and you gain Heavy Armour proficiency.",
    fixedAbilityIncrease: { Strength: 1 },
    requirements: "Requires Medium Armour proficiency.",
  },
  {
    name: "Heavy Armour Master",
    choiceKind: "none",
    description:
      "Strength increases by 1. Non-magical Slashing, Bludgeoning, and Piercing damage is reduced by 3 while wearing Heavy Armour.",
    fixedAbilityIncrease: { Strength: 1 },
    requirements: "Requires Heavy Armour proficiency.",
  },
  {
    name: "Lightly Armoured",
    choiceKind: "single-ability",
    description:
      "Increase Strength or Dexterity by 1 and gain Light Armour proficiency.",
    abilityOptions: strengthDexterity,
  },
  {
    name: "Lucky",
    choiceKind: "none",
    description:
      "Gain 3 Luck Points per Long Rest. These can grant Advantage on Attack Rolls, Ability Checks, or Saving Throws, or force an enemy to reroll an Attack Roll.",
  },
  {
    name: "Mage Slayer",
    choiceKind: "none",
    description:
      "Gain Saving Throw Advantage against spells cast in melee range, Reaction attacks against nearby casters, and impose Disadvantage on Concentration saves after hitting enemies.",
  },
  {
    name: "Magic Initiate: Bard",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Bard cantrips and 1 level-1 Bard spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Charisma.",
  },
  {
    name: "Magic Initiate: Cleric",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Cleric cantrips and 1 level-1 Cleric spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Wisdom.",
  },
  {
    name: "Magic Initiate: Druid",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Druid cantrips and 1 level-1 Druid spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Wisdom.",
  },
  {
    name: "Magic Initiate: Sorcerer",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Sorcerer cantrips and 1 level-1 Sorcerer spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Charisma.",
  },
  {
    name: "Magic Initiate: Warlock",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Warlock cantrips and 1 level-1 Warlock spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Charisma.",
  },
  {
    name: "Magic Initiate: Wizard",
    choiceKind: "magic-initiate",
    description:
      "Learn 2 Wizard cantrips and 1 level-1 Wizard spell. The level-1 spell can be cast once per Long Rest. Spellcasting ability is Intelligence.",
  },
  {
    name: "Martial Adept",
    choiceKind: "martial-adept",
    description:
      "Learn two Battle Master Manoeuvres and gain one additional Superiority Die, recovered on Short or Long Rest.",
    chooseManoeuvreCount: 2,
  },
  {
    name: "Medium Armour Master",
    choiceKind: "none",
    description:
      "Medium Armour no longer imposes Disadvantage on Stealth checks. Dexterity bonus to Armour Class while wearing Medium Armour increases to +3.",
    requirements: "Requires Medium Armour proficiency.",
  },
  {
    name: "Mobile",
    choiceKind: "none",
    description:
      "Movement speed increases by 3m. Dash ignores Difficult Terrain, and moving after a melee attack avoids Opportunity Attacks from that target.",
  },
  {
    name: "Moderately Armoured",
    choiceKind: "single-ability",
    description:
      "Increase Strength or Dexterity by 1. Gain Medium Armour and Shield proficiency.",
    abilityOptions: strengthDexterity,
    requirements: "Requires Light Armour proficiency.",
  },
  {
    name: "Performer",
    choiceKind: "none",
    description:
      "Charisma increases by 1 and you gain Musical Instrument proficiency.",
    fixedAbilityIncrease: { Charisma: 1 },
  },
  {
    name: "Polearm Master",
    choiceKind: "none",
    description:
      "Gain a Bonus Action butt-end attack with polearms and Opportunity Attacks when targets enter range.",
  },
  {
    name: "Resilient",
    choiceKind: "resilient",
    description:
      "Increase one ability by 1 and gain proficiency in that ability's Saving Throw.",
    abilityOptions: allAbilities,
  },
  {
    name: "Ritual Caster",
    choiceKind: "ritual-caster",
    description: "Learn two Ritual spells of your choice.",
    chooseSpellCount: 2,
  },
  {
    name: "Savage Attacker",
    choiceKind: "none",
    description:
      "When making melee weapon attacks, roll damage dice twice and use the higher result.",
  },
  {
    name: "Sentinel",
    choiceKind: "none",
    description:
      "Gain Reaction attacks against enemies who attack nearby allies, stop movement on Opportunity Attack hits, and gain Advantage on Opportunity Attacks.",
  },
  {
    name: "Sharpshooter",
    choiceKind: "none",
    description:
      "Ranged weapon attacks are not penalized by High Ground rules. All In gives -5 Attack Roll and +10 damage with proficient ranged weapons.",
  },
  {
    name: "Shield Master",
    choiceKind: "none",
    description:
      "Gain +2 to Dexterity Saving Throws while wielding a Shield and a Reaction to reduce damage from Dexterity-save spells.",
  },
  {
    name: "Skilled",
    choiceKind: "skill-proficiencies",
    description: "Gain proficiency in three skills of your choice.",
    chooseSkillCount: 3,
  },
  {
    name: "Spell Sniper",
    choiceKind: "spell-sniper",
    description:
      "Learn one spell-attack cantrip. The number needed to roll a Critical Hit with a spell is reduced by 1.",
    chooseCantripCount: 1,
  },
  {
    name: "Tavern Brawler",
    choiceKind: "single-ability",
    description:
      "Increase Strength or Constitution by 1. Strength modifier is added twice to Attack Rolls and damage for unarmed attacks, improvised weapons, and thrown objects.",
    abilityOptions: strengthConstitution,
  },
  {
    name: "Tough",
    choiceKind: "none",
    description: "Hit Point maximum increases by 2 for each level.",
  },
  {
    name: "War Caster",
    choiceKind: "none",
    description:
      "Gain Advantage on Saving Throws to maintain Concentration and can use Shocking Grasp as an Opportunity Attack.",
  },
  {
    name: "Weapon Master",
    choiceKind: "weapon-master",
    description:
      "Increase Strength or Dexterity by 1 and gain proficiency with four weapon types of your choice.",
    abilityOptions: strengthDexterity,
    chooseWeaponCount: 4,
  },
];

export function getFeatDefinition(name: FeatName | "") {
  if (!name) return undefined;
  return bg3Feats.find((feat) => feat.name === name);
}