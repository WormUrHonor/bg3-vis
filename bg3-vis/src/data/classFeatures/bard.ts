import type { AbilityRole } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  melee,
  radiusRange,
  range18m,
  self,
  weaponRange,
} from "./classFeatureHelpers";

const BARD = "Bard" as const;

const GLAMOUR = "College of Glamour";
const LORE = "College of Lore";
const SWORDS = "College of Swords";
const VALOUR = "College of Valour";

const swordsFightingStyleChoice = {
  id: "bard-swords-fighting-style",
  label: "College of Swords Fighting Style",
  max: 1,
};

const coreGroup = {
  id: "bard-core",
  label: "Core Bard Features",
  order: 10,
};

const inspirationGroup = {
  id: "bard-inspiration",
  label: "Bardic Inspiration",
  order: 15,
};

const magicalSecretsGroup = {
  id: "bard-magical-secrets",
  label: "Magical Secrets",
  order: 20,
};

const glamourGroup = {
  id: "bard-glamour",
  label: "College of Glamour Features",
  order: 30,
};

const loreGroup = {
  id: "bard-lore",
  label: "College of Lore Features",
  order: 40,
};

const swordsGroup = {
  id: "bard-swords",
  label: "College of Swords Features",
  order: 50,
};

const swordsStyleGroup = {
  id: "bard-swords-fighting-style-group",
  label: "College of Swords Fighting Style",
  order: 55,
};

const valourGroup = {
  id: "bard-valour",
  label: "College of Valour Features",
  order: 60,
};

type SwordsFightingStyleDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
};

const swordsFightingStyleDefinitions: SwordsFightingStyleDefinition[] = [
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

function makeSwordsFightingStyle(style: SwordsFightingStyleDefinition) {
  return feature(
    `bard-swords-fighting-style-${style.idBase}`,
    style.name,
    "passive",
    [availableTo(BARD, 3, SWORDS)],
    false,
    style.description,
    style.roles,
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "swords", "fighting-style"],
    {
      choiceGroup: swordsFightingStyleChoice,
      displayGroup: swordsStyleGroup,
    }
  );
}

const bardFeatures = [
  feature(
    "bard-bardic-inspiration-charges-3-d6",
    "Bardic Inspiration Charges: 3 d6",
    "resource-feature",
    [availableTo(BARD, 1, 4)],
    true,
    "You have 3 Bardic Inspiration charges. Your Bardic Inspiration die is a d6. Charges recharge on Long Rest until Font of Inspiration is gained.",
    ["support-buff"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["bard", "resource", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-bardic-inspiration-charges-4-d8",
    "Bardic Inspiration Charges: 4 d8",
    "resource-feature",
    [availableTo(BARD, 5, 7)],
    true,
    "You have 4 Bardic Inspiration charges. Your Bardic Inspiration die is a d8, and Font of Inspiration lets charges recharge on Short Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["bard", "resource", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-bardic-inspiration-charges-5-d8",
    "Bardic Inspiration Charges: 5 d8",
    "resource-feature",
    [availableTo(BARD, 8, 9)],
    true,
    "You have 5 Bardic Inspiration charges. Your Bardic Inspiration die is a d8, and charges recharge on Short Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["bard", "resource", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-bardic-inspiration-charges-5-d10",
    "Bardic Inspiration Charges: 5 d10",
    "resource-feature",
    [availableTo(BARD, 10)],
    true,
    "You have 5 Bardic Inspiration charges. Your Bardic Inspiration die is a d10, and charges recharge on Short Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["bard", "resource", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-bardic-inspiration",
    "Bardic Inspiration",
    "bonus-action",
    [availableTo(BARD, 1)],
    true,
    "Inspire an ally to go beyond their capabilities. They can add Bardic Inspiration to their next Attack Roll, Ability Check, or Saving Throw.",
    ["support-buff"],
    [],
    ["bonus-action"],
    ["class-resource"],
    range18m,
    ["bard", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(BARD, 1)],
    true,
    "Bards cast spells using Charisma. Bard spells are Always Prepared, but Bards know a limited number of spells.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-song-of-rest",
    "Song of Rest",
    "action",
    [availableTo(BARD, 2)],
    true,
    "Use your craft to soothe. You and your allies are revitalised as though they had taken a Short Rest. Recharges on Long Rest.",
    ["healing", "support-buff"],
    [],
    ["action"],
    ["long-rest"],
    radiusRange("self, party", 0, "self"),
    ["bard", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-jack-of-all-trades",
    "Jack of All Trades",
    "passive",
    [availableTo(BARD, 2)],
    true,
    "Add half your Proficiency Bonus, rounded down, to Ability Checks you are not Proficient in.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-expertise-level-3",
    "Expertise",
    "passive",
    [availableTo(BARD, 3, 9)],
    true,
    "Gain Expertise in 2 Skills you are Proficient in. The actual skill selection is handled in the class and scores tab.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "expertise"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-expertise-level-10",
    "Additional Expertise",
    "passive",
    [availableTo(BARD, 10)],
    true,
    "Gain Expertise in 2 more Skills you are Proficient in. The actual skill selection is handled in the class and scores tab.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "expertise"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-font-of-inspiration",
    "Font of Inspiration",
    "passive",
    [availableTo(BARD, 5)],
    true,
    "Regain all Bardic Inspiration charges after a Short Rest or Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["bard", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-improved-bardic-inspiration-d8",
    "Improved Bardic Inspiration d8",
    "passive",
    [availableTo(BARD, 5, 9)],
    true,
    "Your Bardic Inspiration die becomes a d8.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-improved-bardic-inspiration-d10",
    "Improved Bardic Inspiration d10",
    "passive",
    [availableTo(BARD, 10)],
    true,
    "Your Bardic Inspiration die becomes a d10.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "bardic-inspiration"],
    {
      displayGroup: inspirationGroup,
    }
  ),

  feature(
    "bard-countercharm",
    "Countercharm",
    "action",
    [availableTo(BARD, 6)],
    true,
    "You and allies within 9m have Advantage on Saving Throws against being Charmed or Frightened.",
    ["defense-protection", "support-buff"],
    [],
    ["action"],
    ["none"],
    radiusRange("self, 9m AoE", 9, "mid", 9),
    ["bard", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "bard-magical-secrets-level-10",
    "Magical Secrets",
    "subclass-feature",
    [availableTo(BARD, 10)],
    true,
    "Learn 2 non-Bard spells from the Magical Secrets list. The actual spell choices are shown in the spell section as a separate Magical Secrets subgroup.",
    ["support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["bard", "magical-secrets"],
    {
      displayGroup: magicalSecretsGroup,
      isInformational: true,
    }
  ),

  feature(
    "bard-glamour-mantle-of-inspiration-5",
    "Mantle of Inspiration",
    "bonus-action",
    [availableTo(BARD, 3, GLAMOUR, 5)],
    true,
    "Spend Bardic Inspiration to imbue 2 allies with vigour and grant 5 temporary hit points. If they are hit with a melee attack, the attacker becomes Charmed.",
    ["support-buff", "defense-protection", "control"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("18m, 2 allies", 18, "long"),
    ["bard", "glamour", "bardic-inspiration"],
    {
      displayGroup: glamourGroup,
    }
  ),

  feature(
    "bard-glamour-mantle-of-inspiration-8",
    "Mantle of Inspiration: Improved",
    "bonus-action",
    [availableTo(BARD, 6, GLAMOUR, 9)],
    true,
    "Spend Bardic Inspiration to imbue 3 allies with vigour and grant 8 temporary hit points. If they are hit with a melee attack, the attacker becomes Charmed.",
    ["support-buff", "defense-protection", "control"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("18m, 3 allies", 18, "long"),
    ["bard", "glamour", "bardic-inspiration"],
    {
      displayGroup: glamourGroup,
    }
  ),

  feature(
    "bard-glamour-mantle-of-inspiration-11",
    "Mantle of Inspiration: Greater",
    "bonus-action",
    [availableTo(BARD, 10, GLAMOUR)],
    true,
    "Spend Bardic Inspiration to imbue 4 allies with vigour and grant 11 temporary hit points. If they are hit with a melee attack, the attacker becomes Charmed.",
    ["support-buff", "defense-protection", "control"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("18m, 4 allies", 18, "long"),
    ["bard", "glamour", "bardic-inspiration"],
    {
      displayGroup: glamourGroup,
    }
  ),

  feature(
    "bard-glamour-mantle-of-majesty-command",
    "Mantle of Majesty: Command",
    "bonus-action",
    [availableTo(BARD, 6, GLAMOUR)],
    true,
    "Command a creature to flee, move closer, freeze, drop to the ground, or drop its weapon. Charmed targets automatically fail their Saving Throw. Recharges on Long Rest.",
    ["control"],
    [],
    ["bonus-action"],
    ["long-rest"],
    range18m,
    ["bard", "glamour"],
    {
      displayGroup: glamourGroup,
    }
  ),

  feature(
    "bard-lore-bonus-proficiencies",
    "Bonus Proficiencies",
    "passive",
    [availableTo(BARD, 3, LORE)],
    true,
    "Gain Proficiency in 3 additional Skills. The actual skill selection is handled in the class and scores tab.",
    ["support-buff", "narrative-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "lore", "skills"],
    {
      displayGroup: loreGroup,
    }
  ),

  feature(
    "bard-lore-cutting-words",
    "Cutting Words",
    "reaction",
    [availableTo(BARD, 3, LORE)],
    true,
    "Use your wit to distract a creature and sap its confidence. It receives a Bardic Inspiration die penalty to an Attack Roll, Ability Check, or Saving Throw.",
    ["control", "defense-protection", "support-buff"],
    [],
    ["reaction"],
    ["class-resource"],
    range18m,
    ["bard", "lore", "bardic-inspiration"],
    {
      displayGroup: loreGroup,
    }
  ),

  feature(
    "bard-lore-magical-secrets-level-6",
    "Additional Magical Secrets",
    "subclass-feature",
    [availableTo(BARD, 6, LORE)],
    true,
    "Learn 2 non-Bard spells from the Magical Secrets list, limited to level 3 or lower. The actual spell choices are shown in the spell section as a separate Lore Magical Secrets subgroup.",
    ["support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["bard", "lore", "magical-secrets"],
    {
      displayGroup: magicalSecretsGroup,
      isInformational: true,
    }
  ),

  feature(
    "bard-swords-medium-armour-and-scimitars",
    "Bonus Proficiencies",
    "passive",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Gain Medium Armour and Scimitar Proficiency.",
    ["defense-protection", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "swords", "proficiency"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-defensive-flourish-melee",
    "Defensive Flourish: Melee",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to attack defensively with a melee weapon, increasing your Armour Class by 4 if you hit.",
    ["single-target-damage", "defense-protection"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    melee,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-defensive-flourish-ranged",
    "Defensive Flourish: Ranged",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to attack defensively with a ranged weapon, increasing your Armour Class by 4 if you hit.",
    ["single-target-damage", "defense-protection"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    weaponRange,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-slashing-flourish-melee",
    "Slashing Flourish: Melee",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to attack up to 2 enemies at once with a melee weapon.",
    ["area-damage", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    melee,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-slashing-flourish-ranged",
    "Slashing Flourish: Ranged",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to attack up to 2 enemies at once with a ranged weapon.",
    ["area-damage", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    weaponRange,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-mobile-flourish-melee",
    "Mobile Flourish: Melee",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to push your target back 6m with a melee weapon. Afterwards, you can teleport to the target.",
    ["single-target-damage", "control", "mobility-positioning"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    melee,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-swords-mobile-flourish-ranged",
    "Mobile Flourish: Ranged",
    "action",
    [availableTo(BARD, 3, SWORDS)],
    true,
    "Spend Bardic Inspiration to push your target back 6m with a ranged weapon. Afterwards, you can teleport to the target.",
    ["single-target-damage", "control", "mobility-positioning"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    weaponRange,
    ["bard", "swords", "blade-flourish"],
    {
      displayGroup: swordsGroup,
    }
  ),

  ...swordsFightingStyleDefinitions.map(makeSwordsFightingStyle),

  feature(
    "bard-swords-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(BARD, 6, SWORDS)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["bard", "swords"],
    {
      displayGroup: swordsGroup,
    }
  ),

  feature(
    "bard-valour-bonus-proficiencies",
    "Bonus Proficiencies",
    "passive",
    [availableTo(BARD, 3, VALOUR)],
    true,
    "Gain Medium Armour, Shield, and Martial Weapon Proficiency.",
    ["defense-protection", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    self,
    ["bard", "valour", "proficiency"],
    {
      displayGroup: valourGroup,
    }
  ),

  feature(
    "bard-valour-combat-inspiration",
    "Combat Inspiration",
    "bonus-action",
    [availableTo(BARD, 3, VALOUR)],
    true,
    "Inspire an ally to add Bardic Inspiration to their next Attack Roll, Ability Check, Saving Throw, weapon damage, or Armour Class.",
    ["support-buff", "defense-protection", "single-target-damage"],
    [],
    ["bonus-action"],
    ["class-resource"],
    range18m,
    ["bard", "valour", "bardic-inspiration"],
    {
      displayGroup: valourGroup,
    }
  ),

  feature(
    "bard-valour-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(BARD, 6, VALOUR)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["bard", "valour"],
    {
      displayGroup: valourGroup,
    }
  ),
];

const swordsFightingStyleIconEntries = Object.fromEntries(
  swordsFightingStyleDefinitions.map((style) => [
    `bard-swords-fighting-style-${style.idBase}`,
    `Passive_Bard_Swords_FightingStyle_${style.idBase}.png`,
  ])
);

export const bardClassModule: ClassFeatureModule = {
  className: "Bard",
  defaultTabLabel: "Bard Features",
  subclassTabLabels: {
    [GLAMOUR]: "Glamour Features",
    [LORE]: "Lore Features",
    [SWORDS]: "Blade Flourishes",
    [VALOUR]: "Valour Features",
  },
  features: bardFeatures,
  iconFileByFeatureId: {
    "bard-bardic-inspiration-charges-3-d6":
      "Passive_Bard_BardicInspirationCharges.png",
    "bard-bardic-inspiration-charges-4-d8":
      "Passive_Bard_BardicInspirationCharges.png",
    "bard-bardic-inspiration-charges-5-d8":
      "Passive_Bard_BardicInspirationCharges.png",
    "bard-bardic-inspiration-charges-5-d10":
      "Passive_Bard_BardicInspirationCharges.png",

    "bard-bardic-inspiration": "Action_Bard_BardicInspiration.png",
    "bard-spellcasting": "Passive_Bard_Spellcasting.png",
    "bard-song-of-rest": "Action_Bard_SongOfRest.png",
    "bard-jack-of-all-trades": "Passive_Bard_JackOfAllTrades.png",
    "bard-expertise-level-3": "Passive_Bard_Expertise.png",
    "bard-expertise-level-10": "Passive_Bard_Expertise.png",
    "bard-font-of-inspiration": "Passive_Bard_FontOfInspiration.png",
    "bard-improved-bardic-inspiration-d8":
      "Passive_Bard_ImprovedBardicInspiration.png",
    "bard-improved-bardic-inspiration-d10":
      "Passive_Bard_ImprovedBardicInspiration.png",
    "bard-countercharm": "Action_Bard_Countercharm.png",

    "bard-magical-secrets-level-10": "Passive_Bard_MagicalSecrets.png",
    "bard-lore-magical-secrets-level-6": "Passive_Bard_MagicalSecrets.png",

    "bard-glamour-mantle-of-inspiration-5":
      "Action_Bard_Glamour_MantleOfInspiration.png",
    "bard-glamour-mantle-of-inspiration-8":
      "Action_Bard_Glamour_MantleOfInspiration.png",
    "bard-glamour-mantle-of-inspiration-11":
      "Action_Bard_Glamour_MantleOfInspiration.png",
    "bard-glamour-mantle-of-majesty-command":
      "Action_Bard_Glamour_MantleOfMajestyCommand.png",

    "bard-lore-bonus-proficiencies":
      "Passive_Bard_Lore_BonusProficiencies.png",
    "bard-lore-cutting-words": "Reaction_Bard_Lore_CuttingWords.png",

    "bard-swords-medium-armour-and-scimitars":
      "Passive_Bard_Swords_BonusProficiencies.png",
    "bard-swords-defensive-flourish-melee":
      "Action_Bard_Swords_DefensiveFlourishMelee.png",
    "bard-swords-defensive-flourish-ranged":
      "Action_Bard_Swords_DefensiveFlourishRanged.png",
    "bard-swords-slashing-flourish-melee":
      "Action_Bard_Swords_SlashingFlourishMelee.png",
    "bard-swords-slashing-flourish-ranged":
      "Action_Bard_Swords_SlashingFlourishRanged.png",
    "bard-swords-mobile-flourish-melee":
      "Action_Bard_Swords_MobileFlourishMelee.png",
    "bard-swords-mobile-flourish-ranged":
      "Action_Bard_Swords_MobileFlourishRanged.png",
    "bard-swords-extra-attack": "Passive_ExtraAttack.png",

    "bard-swords-fighting-style-duelling":
      "Passive_Bard_Swords_FightingStyle_duelling.png",
    "bard-swords-fighting-style-two-weapon-fighting":
      "Passive_Bard_Swords_FightingStyle_two-weapon-fighting.png",

    "bard-valour-bonus-proficiencies":
      "Passive_Bard_Valour_BonusProficiencies.png",
    "bard-valour-combat-inspiration":
      "Action_Bard_Valour_CombatInspiration.png",
    "bard-valour-extra-attack": "Passive_ExtraAttack.png",
  },
};