export type TabId = "character" | "classScores" | "spellsAbilities";

export type Skill =
  | "Acrobatics"
  | "Animal Handling"
  | "Arcana"
  | "Athletics"
  | "Deception"
  | "History"
  | "Insight"
  | "Intimidation"
  | "Investigation"
  | "Medicine"
  | "Nature"
  | "Perception"
  | "Performance"
  | "Persuasion"
  | "Religion"
  | "Sleight of Hand"
  | "Stealth"
  | "Survival";

export type AbilityScore =
  | "Strength"
  | "Dexterity"
  | "Constitution"
  | "Intelligence"
  | "Wisdom"
  | "Charisma";

export type RaceName =
  | "Human"
  | "Elf"
  | "Half-Elf"
  | "Drow"
  | "Tiefling"
  | "Githyanki"
  | "Dwarf"
  | "Halfling"
  | "Gnome"
  | "Half-Orc"
  | "Dragonborn";

export type ClassName =
  | "Barbarian"
  | "Bard"
  | "Cleric"
  | "Druid"
  | "Fighter"
  | "Monk"
  | "Paladin"
  | "Ranger"
  | "Rogue"
  | "Sorcerer"
  | "Warlock"
  | "Wizard";

export type Background =
  | "Acolyte"
  | "Charlatan"
  | "Criminal"
  | "Entertainer"
  | "Folk Hero"
  | "Guild Artisan"
  | "Haunted One"
  | "Noble"
  | "Outlander"
  | "Sage"
  | "Soldier"
  | "Urchin";

export type RangerFavouredEnemy =
  | "Bounty Hunter"
  | "Keeper of the Veil"
  | "Mage Breaker"
  | "Ranger Knight"
  | "Sanctified Stalker";

export type RangerNaturalExplorer =
  | "Beast Tamer"
  | "Urban Tracker"
  | "Wasteland Wanderer: Cold"
  | "Wasteland Wanderer: Fire"
  | "Wasteland Wanderer: Poison";

export type WarlockInvocation =
  | "Beguiling Influence"
  | "Agonising Blast"
  | "Armour of Shadows"
  | "Beast Speech"
  | "Devil's Sight"
  | "Repelling Blast";

export type FeatName =
  | "Ability Improvement"
  | "Actor"
  | "Alert"
  | "Athlete"
  | "Charger"
  | "Crossbow Expert"
  | "Defensive Duellist"
  | "Dual Wielder"
  | "Dungeon Delver"
  | "Durable"
  | "Elemental Adept"
  | "Great Weapon Master"
  | "Heavily Armoured"
  | "Heavy Armour Master"
  | "Lightly Armoured"
  | "Lucky"
  | "Mage Slayer"
  | "Magic Initiate: Bard"
  | "Magic Initiate: Cleric"
  | "Magic Initiate: Druid"
  | "Magic Initiate: Sorcerer"
  | "Magic Initiate: Warlock"
  | "Magic Initiate: Wizard"
  | "Martial Adept"
  | "Medium Armour Master"
  | "Mobile"
  | "Moderately Armoured"
  | "Performer"
  | "Polearm Master"
  | "Resilient"
  | "Ritual Caster"
  | "Savage Attacker"
  | "Sentinel"
  | "Sharpshooter"
  | "Shield Master"
  | "Skilled"
  | "Spell Sniper"
  | "Tavern Brawler"
  | "Tough"
  | "War Caster"
  | "Weapon Master";

export type FeatChoiceKind =
  | "none"
  | "ability-improvement"
  | "single-ability"
  | "skill-proficiencies"
  | "resilient"
  | "elemental-adept"
  | "ritual-caster"
  | "spell-sniper"
  | "weapon-master"
  | "martial-adept"
  | "magic-initiate";

export type ElementalAdeptDamageType =
  | "Acid"
  | "Cold"
  | "Fire"
  | "Lightning"
  | "Thunder";

export type FeatSelection = {
  slotLevel: number;
  featName: FeatName | "";
  selectedAbility: AbilityScore | "";
  secondaryAbility: AbilityScore | "";
  selectedSkills: Skill[];
  selectedDamageType: ElementalAdeptDamageType | "";
  selectedCantrips: string[];
  selectedSpells: string[];
  selectedWeaponTypes: string[];
  selectedManoeuvres: string[];
};

export type FeatDefinition = {
  name: FeatName;
  choiceKind: FeatChoiceKind;
  description: string;
  fixedAbilityIncrease?: Partial<Record<AbilityScore, number>>;
  abilityOptions?: AbilityScore[];
  grantsSkillProficiencies?: Skill[];
  grantsSkillExpertise?: Skill[];
  chooseSkillCount?: number;
  chooseCantripCount?: number;
  chooseSpellCount?: number;
  chooseWeaponCount?: number;
  chooseManoeuvreCount?: number;
  requirements?: string;
};