import type {
  AbilityScore,
  Background,
  ClassName,
  RaceName,
  RangerFavouredEnemy,
  RangerNaturalExplorer,
  Skill,
  TabId,
  WarlockInvocation,
} from "../types/buildPlannerTypes";

export const tabs: { id: TabId; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "classScores", label: "Class & Scores" },
  { id: "spellsAbilities", label: "Spells & Abilities" },
];

export const skills: Skill[] = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

export const abilityScores: AbilityScore[] = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

export const races: RaceName[] = [
  "Human",
  "Elf",
  "Half-Elf",
  "Drow",
  "Tiefling",
  "Githyanki",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Orc",
  "Dragonborn",
];

export const subracesByRace: Record<RaceName, string[]> = {
  Human: [],
  Elf: ["High Elf", "Wood Elf"],
  "Half-Elf": ["High Half-Elf", "Wood Half-Elf", "Drow Half-Elf"],
  Drow: ["Lolth-Sworn Drow", "Seldarine Drow"],
  Tiefling: ["Asmodeus Tiefling", "Mephistopheles Tiefling", "Zariel Tiefling"],
  Githyanki: [],
  Dwarf: ["Gold Dwarf", "Shield Dwarf", "Duergar"],
  Halfling: ["Lightfoot Halfling", "Strongheart Halfling"],
  Gnome: ["Forest Gnome", "Deep Gnome", "Rock Gnome"],
  "Half-Orc": [],
  Dragonborn: [
    "Black Dragonborn",
    "Blue Dragonborn",
    "Brass Dragonborn",
    "Bronze Dragonborn",
    "Copper Dragonborn",
    "Gold Dragonborn",
    "Green Dragonborn",
    "Red Dragonborn",
    "Silver Dragonborn",
    "White Dragonborn",
  ],
};

export const backgrounds: Background[] = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Haunted One",
  "Noble",
  "Outlander",
  "Sage",
  "Soldier",
  "Urchin",
];

export const backgroundSkills: Record<Background, Skill[]> = {
  Acolyte: ["Insight", "Religion"],
  Charlatan: ["Deception", "Sleight of Hand"],
  Criminal: ["Deception", "Stealth"],
  Entertainer: ["Acrobatics", "Performance"],
  "Folk Hero": ["Animal Handling", "Survival"],
  "Guild Artisan": ["Insight", "Persuasion"],
  "Haunted One": ["Intimidation", "Medicine"],
  Noble: ["History", "Persuasion"],
  Outlander: ["Athletics", "Survival"],
  Sage: ["Arcana", "History"],
  Soldier: ["Athletics", "Intimidation"],
  Urchin: ["Sleight of Hand", "Stealth"],
};

export const classes: ClassName[] = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

export const classSkillRules: Record<ClassName, { choose: number; options: Skill[] }> = {
  Barbarian: {
    choose: 2,
    options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
  },
  Bard: {
    choose: 3,
    options: skills,
  },
  Cleric: {
    choose: 2,
    options: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
  },
  Druid: {
    choose: 2,
    options: ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
  },
  Fighter: {
    choose: 2,
    options: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
  },
  Monk: {
    choose: 2,
    options: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
  },
  Paladin: {
    choose: 2,
    options: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
  },
  Ranger: {
    choose: 3,
    options: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
  },
  Rogue: {
    choose: 4,
    options: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
  },
  Sorcerer: {
    choose: 2,
    options: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
  },
  Warlock: {
    choose: 2,
    options: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Religion"],
  },
  Wizard: {
    choose: 2,
    options: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
  },
};

export const subclassesByClass: Record<ClassName, string[]> = {
  Barbarian: ["Berserker", "Wildheart", "Wild Magic"],
  Bard: ["College of Lore", "College of Valour", "College of Swords"],
  Cleric: ["Life Domain", "Light Domain", "Trickery Domain", "Knowledge Domain", "Nature Domain", "Tempest Domain", "War Domain"],
  Druid: ["Circle of the Land", "Circle of the Moon", "Circle of the Spores"],
  Fighter: ["Battle Master", "Champion", "Eldritch Knight"],
  Monk: ["Way of the Open Hand", "Way of Shadow", "Way of the Four Elements"],
  Paladin: ["Oath of the Ancients", "Oath of Devotion", "Oath of Vengeance", "Oathbreaker"],
  Ranger: ["Hunter", "Beast Master", "Gloom Stalker"],
  Rogue: ["Arcane Trickster", "Assassin", "Thief"],
  Sorcerer: ["Draconic Bloodline", "Wild Magic", "Storm Sorcery"],
  Warlock: ["The Fiend", "The Great Old One", "The Archfey"],
  Wizard: ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School", "Illusion School", "Necromancy School", "Transmutation School"],
};

export const rangerFavouredEnemies: RangerFavouredEnemy[] = [
  "Bounty Hunter",
  "Keeper of the Veil",
  "Mage Breaker",
  "Ranger Knight",
  "Sanctified Stalker",
];

export const rangerFavouredEnemySkills: Partial<Record<RangerFavouredEnemy, Skill>> = {
  "Bounty Hunter": "Investigation",
  "Keeper of the Veil": "Arcana",
  "Ranger Knight": "History",
  "Sanctified Stalker": "Religion",
};

export const rangerNaturalExplorers: RangerNaturalExplorer[] = [
  "Beast Tamer",
  "Urban Tracker",
  "Wasteland Wanderer: Cold",
  "Wasteland Wanderer: Fire",
  "Wasteland Wanderer: Poison",
];

export const warlockInvocations: WarlockInvocation[] = [
  "Beguiling Influence",
  "Agonising Blast",
  "Armour of Shadows",
  "Beast Speech",
  "Devil's Sight",
  "Repelling Blast",
];

export const pointBuyCost: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};