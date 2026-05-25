import type { ClassName } from "../types/buildPlannerTypes";
import type {
  AbilityRole,
  ActionCost,
  DamageType,
  RangeCategory,
  RangeShape,
  ResourceCost,
} from "./bg3Spells";

export type ClassFeatureKind =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "toggle"
  | "manoeuvre"
  | "subclass-feature"
  | "resource-feature";

export type ClassFeatureAvailability = {
  className: ClassName;
  minLevel: number;
  subclass?: string;
};

export type BG3ClassFeature = {
  id: string;
  name: string;
  sourceType: "class-feature";
  kind: ClassFeatureKind;
  description?: string;
  availability: ClassFeatureAvailability[];
  isFixed: boolean;
  choiceGroupId?: string;
  choiceGroupLabel?: string;
  choiceGroupMax?: number;
  range: {
    label: string;
    meters: number | null;
    category: RangeCategory;
    shape: RangeShape;
    aoeMeters?: number;
  };
  roles: AbilityRole[];
  damageTypes: DamageType[];
  costs: {
    actions: ActionCost[];
    resources: ResourceCost[];
    requiresConcentration: boolean;
  };
  tags?: string[];
};

const self = {
  label: "self",
  meters: 0,
  category: "self",
  shape: "self",
} as const;

const melee = {
  label: "1.5m",
  meters: 1.5,
  category: "melee",
  shape: "melee",
} as const;

const weaponRange = {
  label: "weapon range",
  meters: 18,
  category: "long",
  shape: "weapon",
} as const;

function availableTo(
  className: ClassName,
  minLevel: number,
  subclass?: string
): ClassFeatureAvailability {
  return { className, minLevel, subclass };
}

function feature(
  id: string,
  name: string,
  kind: ClassFeatureKind,
  availability: ClassFeatureAvailability[],
  isFixed: boolean,
  description: string,
  roles: AbilityRole[] = [],
  damageTypes: DamageType[] = [],
  actions: ActionCost[] = ["passive"],
  resources: ResourceCost[] = ["none"],
  range: BG3ClassFeature["range"] = self,
  tags: string[] = [],
  choiceGroup?: {
    id: string;
    label: string;
    max: number;
  }
): BG3ClassFeature {
  return {
    id,
    name,
    sourceType: "class-feature",
    kind,
    description,
    availability,
    isFixed,
    choiceGroupId: choiceGroup?.id,
    choiceGroupLabel: choiceGroup?.label,
    choiceGroupMax: choiceGroup?.max,
    range,
    roles,
    damageTypes,
    costs: {
      actions,
      resources,
      requiresConcentration: false,
    },
    tags,
  };
}

export const bg3ClassFeatures: BG3ClassFeature[] = [
  feature(
    "barbarian-rage",
    "Rage",
    "bonus-action",
    [availableTo("Barbarian", 1)],
    true,
    "Enter a rage. You deal extra damage with melee, improvised, and thrown weapon attacks, gain Resistance to physical damage, and gain Advantage on Strength Checks and Saving Throws.",
    ["support-buff", "defense-protection", "single-target-damage"],
    ["Physical"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "rage", "class-action"]
  ),

  feature(
    "barbarian-unarmoured-defence",
    "Unarmoured Defence",
    "passive",
    [availableTo("Barbarian", 1)],
    true,
    "While not wearing armour, you add your Constitution Modifier to your Armour Class.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-reckless-attack",
    "Reckless Attack",
    "action",
    [availableTo("Barbarian", 2)],
    true,
    "Gain Advantage on your melee Attack Roll. Until your next turn, enemies also have Advantage on Attack Rolls against you.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["barbarian", "class-action"]
  ),

  feature(
    "barbarian-danger-sense",
    "Danger Sense",
    "passive",
    [availableTo("Barbarian", 2)],
    true,
    "You have Advantage on Dexterity Saving Throws against traps, spells, and surfaces, unless Blinded or Incapacitated.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo("Barbarian", 5)],
    true,
    "You can make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-fast-movement",
    "Fast Movement",
    "passive",
    [availableTo("Barbarian", 5)],
    true,
    "Your Movement Speed increases by 3m while not wearing Heavy Armour.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-feral-instinct",
    "Feral Instinct",
    "passive",
    [availableTo("Barbarian", 7)],
    true,
    "Gain +3 Initiative and immunity to being Surprised.",
    ["support-buff", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-brutal-critical",
    "Brutal Critical",
    "passive",
    [availableTo("Barbarian", 9)],
    true,
    "When you land a Critical Hit, you roll an extra damage die in addition to the normal critical damage.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "barbarian-relentless-rage",
    "Relentless Rage",
    "passive",
    [availableTo("Barbarian", 11)],
    true,
    "Once per Short Rest, if you drop to 0 Hit Points while Enraged, you regain 1 Hit Point instead of being Downed.",
    ["defense-protection", "healing"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["barbarian", "passive"]
  ),

  feature(
    "berserker-frenzy",
    "Frenzy",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Berserker")],
    true,
    "Your Rage becomes Frenzy, unlocking Frenzied Strike and Enraged Throw while raging.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "berserker", "rage"]
  ),

  feature(
    "berserker-frenzied-strike",
    "Frenzied Strike",
    "bonus-action",
    [availableTo("Barbarian", 3, "Berserker")],
    true,
    "Make a melee weapon attack as a Bonus Action while Frenzied.",
    ["single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["none"],
    melee,
    ["barbarian", "berserker", "rage-action"]
  ),

  feature(
    "berserker-enraged-throw",
    "Enraged Throw",
    "bonus-action",
    [availableTo("Barbarian", 3, "Berserker")],
    true,
    "Pick up an item or creature and throw it at a target as a Bonus Action while Frenzied.",
    ["single-target-damage", "control"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["barbarian", "berserker", "rage-action"]
  ),

  feature(
    "berserker-mindless-rage",
    "Mindless Rage",
    "passive",
    [availableTo("Barbarian", 6, "Berserker")],
    true,
    "While Frenzied, you cannot be Charmed or Frightened, and Calm Emotions no longer ends your Rage.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "berserker", "passive"]
  ),

  feature(
    "berserker-intimidating-presence",
    "Intimidating Presence",
    "action",
    [availableTo("Barbarian", 10, "Berserker")],
    true,
    "Menace a nearby enemy and potentially Frighten it.",
    ["control"],
    [],
    ["action"],
    ["none"],
    { label: "9m", meters: 9, category: "mid", shape: "single-target" },
    ["barbarian", "berserker", "class-action"]
  ),

  feature(
    "giant-giants-rage",
    "Giant's Rage",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Giant")],
    true,
    "Your Rage becomes Giant's Rage, increasing your size and empowering thrown attacks.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "giant", "rage"]
  ),

  feature(
    "giant-vapraks-greed",
    "Vaprak's Greed",
    "passive",
    [availableTo("Barbarian", 3, "Giant")],
    true,
    "A Giant Barbarian subclass feature gained together with Giant's Rage.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "giant", "passive"]
  ),

  feature(
    "giant-boot-of-the-giants",
    "Boot of the Giants",
    "passive",
    [availableTo("Barbarian", 5, "Giant")],
    true,
    "A Giant Barbarian subclass feature gained at level 5.",
    ["mobility-positioning", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "giant", "passive"]
  ),

  feature(
    "giant-elemental-cleaver",
    "Elemental Cleaver",
    "bonus-action",
    [availableTo("Barbarian", 6, "Giant")],
    true,
    "Imbue a weapon with elemental power while raging.",
    ["support-buff", "single-target-damage"],
    ["Acid", "Cold", "Fire", "Lightning", "Thunder"],
    ["bonus-action"],
    ["none"],
    self,
    ["barbarian", "giant", "class-action"]
  ),

  feature(
    "giant-mighty-impel",
    "Mighty Impel",
    "bonus-action",
    [availableTo("Barbarian", 10, "Giant")],
    true,
    "Throw nearby creatures or objects with increased force.",
    ["single-target-damage", "control", "mobility-positioning"],
    ["Bludgeoning"],
    ["bonus-action"],
    ["none"],
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["barbarian", "giant", "class-action"]
  ),

  feature(
    "wild-magic-rage",
    "Rage: Wild Magic",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wild Magic")],
    true,
    "Your Rage becomes Rage: Wild Magic, producing a random magical effect when activated.",
    ["support-buff", "area-damage", "control"],
    ["Variable"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wild-magic", "rage"]
  ),

  feature(
    "wild-magic-magic-awareness",
    "Magic Awareness",
    "action",
    [availableTo("Barbarian", 3, "Wild Magic")],
    true,
    "Sense nearby magic and grant nearby allies a bonus against spells.",
    ["support-buff", "defense-protection", "investigation-world-interaction"],
    [],
    ["action"],
    ["none"],
    { label: "3m", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 },
    ["barbarian", "wild-magic", "class-action"]
  ),

  feature(
    "wild-magic-bolstering-magic-boon",
    "Bolstering Magic: Boon",
    "action",
    [availableTo("Barbarian", 6, "Wild Magic")],
    true,
    "Bolster an ally with wild magic.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    { label: "1.5m", meters: 1.5, category: "melee", shape: "single-target" },
    ["barbarian", "wild-magic", "class-action"]
  ),

  feature(
    "wild-magic-bolstering-magic-level-1",
    "Bolstering Magic: Level 1 Spell Slot",
    "action",
    [availableTo("Barbarian", 6, "Wild Magic")],
    true,
    "Restore a Level 1 Spell Slot to an ally.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    { label: "1.5m", meters: 1.5, category: "melee", shape: "single-target" },
    ["barbarian", "wild-magic", "class-action"]
  ),

  feature(
    "wild-magic-bolstering-magic-level-2",
    "Bolstering Magic: Level 2 Spell Slot",
    "action",
    [availableTo("Barbarian", 6, "Wild Magic")],
    true,
    "Restore a Level 2 Spell Slot to an ally.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    { label: "1.5m", meters: 1.5, category: "melee", shape: "single-target" },
    ["barbarian", "wild-magic", "class-action"]
  ),

  feature(
    "wild-magic-bolstering-magic-level-3",
    "Bolstering Magic: Level 3 Spell Slot",
    "action",
    [availableTo("Barbarian", 9, "Wild Magic")],
    true,
    "Restore a Level 3 Spell Slot to an ally.",
    ["support-buff"],
    [],
    ["action"],
    ["long-rest"],
    { label: "1.5m", meters: 1.5, category: "melee", shape: "single-target" },
    ["barbarian", "wild-magic", "class-action"]
  ),

  feature(
    "wild-magic-unstable-backlash",
    "Unstable Backlash",
    "reaction",
    [availableTo("Barbarian", 10, "Wild Magic")],
    true,
    "Trigger another Wild Magic effect as a reaction under the right conditions.",
    ["support-buff", "area-damage", "control"],
    ["Variable"],
    ["reaction"],
    ["none"],
    self,
    ["barbarian", "wild-magic", "reaction"]
  ),

  feature(
    "wildheart-speak-with-animals",
    "Speak with Animals",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    true,
    "Gain Speak with Animals as a Wildheart Barbarian feature.",
    ["narrative-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    ["barbarian", "wildheart", "spell-feature"]
  ),

  feature(
    "wildheart-bear-heart",
    "Bear Heart",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    false,
    "Rage with the endurance of a bear. This represents the selected Bestial Heart.",
    ["defense-protection", "support-buff"],
    [],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      id: "wildheart-bestial-heart",
      label: "Bestial Heart",
      max: 1,
    }
  ),

  feature(
    "wildheart-eagle-heart",
    "Eagle Heart",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    false,
    "Rage with the mobility of an eagle. This represents the selected Bestial Heart.",
    ["mobility-positioning", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      id: "wildheart-bestial-heart",
      label: "Bestial Heart",
      max: 1,
    }
  ),

  feature(
    "wildheart-elk-heart",
    "Elk Heart",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    false,
    "Rage with the speed of an elk. This represents the selected Bestial Heart.",
    ["mobility-positioning", "support-buff"],
    [],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      id: "wildheart-bestial-heart",
      label: "Bestial Heart",
      max: 1,
    }
  ),

  feature(
    "wildheart-tiger-heart",
    "Tiger Heart",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    false,
    "Rage with the ferocity of a tiger. This represents the selected Bestial Heart.",
    ["single-target-damage", "area-damage"],
    ["Weapon", "Slashing"],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      id: "wildheart-bestial-heart",
      label: "Bestial Heart",
      max: 1,
    }
  ),

  feature(
    "wildheart-wolf-heart",
    "Wolf Heart",
    "subclass-feature",
    [availableTo("Barbarian", 3, "Wildheart")],
    false,
    "Rage with the pack tactics of a wolf. This represents the selected Bestial Heart.",
    ["support-buff", "control"],
    [],
    ["bonus-action"],
    ["long-rest"],
    self,
    ["barbarian", "wildheart", "bestial-heart"],
    {
      id: "wildheart-bestial-heart",
      label: "Bestial Heart",
      max: 1,
    }
  ),

  feature(
    "wildheart-land-stride-difficult-terrain",
    "Land's Stride: Difficult Terrain",
    "passive",
    [availableTo("Barbarian", 8, "Wildheart")],
    true,
    "Difficult Terrain no longer slows you down.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["barbarian", "wildheart", "passive"]
  ),

  ...[
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

    return [
      feature(
        `wildheart-aspect-${idBase}-level-6`,
        `Aspect of the Beast: ${aspectName}`,
        "subclass-feature",
        [availableTo("Barbarian", 6, "Wildheart")],
        false,
        `Choose the ${aspectName} Animal Aspect.`,
        ["support-buff"],
        [],
        ["passive"],
        ["none"],
        self,
        ["barbarian", "wildheart", "animal-aspect"],
        {
          id: "wildheart-animal-aspect-level-6",
          label: "Animal Aspect",
          max: 1,
        }
      ),
      feature(
        `wildheart-aspect-${idBase}-level-10`,
        `Additional Aspect: ${aspectName}`,
        "subclass-feature",
        [availableTo("Barbarian", 10, "Wildheart")],
        false,
        `Choose ${aspectName} as an additional Animal Aspect.`,
        ["support-buff"],
        [],
        ["passive"],
        ["none"],
        self,
        ["barbarian", "wildheart", "animal-aspect"],
        {
          id: "wildheart-animal-aspect-level-10",
          label: "Additional Animal Aspect",
          max: 1,
        }
      ),
    ];
  }),

  feature(
    "fighter-second-wind",
    "Second Wind",
    "bonus-action",
    [availableTo("Fighter", 1)],
    true,
    "Regain Hit Points using a Bonus Action.",
    ["healing", "defense-protection"],
    [],
    ["bonus-action"],
    ["short-rest"],
    self,
    ["fighter", "class-action"]
  ),

  feature(
    "fighter-action-surge",
    "Action Surge",
    "resource-feature",
    [availableTo("Fighter", 2)],
    true,
    "Immediately gain an additional Action.",
    ["support-buff"],
    [],
    ["conditional"],
    ["short-rest"],
    self,
    ["fighter", "class-action"]
  ),

  feature(
    "fighter-battle-master-superiority-dice",
    "Superiority Dice",
    "resource-feature",
    [availableTo("Fighter", 3, "Battle Master")],
    true,
    "Battle Masters use Superiority Dice to fuel Manoeuvres.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource"],
    self,
    ["fighter", "battle-master", "resource"]
  ),

  feature(
    "fighter-manoeuvre-disarming-attack",
    "Disarming Attack",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to make an attack that can force the target to drop its weapon.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    weaponRange,
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),

  feature(
    "fighter-manoeuvre-pushing-attack",
    "Pushing Attack",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to make an attack that can push the target away.",
    ["single-target-damage", "control"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    weaponRange,
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),

  feature(
    "fighter-manoeuvre-riposte",
    "Riposte",
    "manoeuvre",
    [availableTo("Fighter", 3, "Battle Master")],
    false,
    "Spend a Superiority Die to retaliate when a hostile creature misses you with a melee attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["reaction"],
    ["class-resource"],
    melee,
    ["fighter", "battle-master", "manoeuvre"],
    {
      id: "battle-master-manoeuvres",
      label: "Battle Master Manoeuvres",
      max: 3,
    }
  ),
];

export function getClassFeatureById(id: string): BG3ClassFeature | undefined {
  return bg3ClassFeatures.find((featureEntry) => featureEntry.id === id);
}