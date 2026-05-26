import {
  getSpellById,
  type AbilityRole,
  type ActionCost,
  type BG3Spell,
  type DamageType,
  type ResourceCost,
} from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  feature,
  melee,
  radiusRange,
  range18m,
  self,
  touch,
} from "./classFeatureHelpers";

const WIZARD = "Wizard" as const;

const ABJURATION = "Abjuration School";
const BLADESINGING = "Bladesinging";
const CONJURATION = "Conjuration School";
const DIVINATION = "Divination School";
const ENCHANTMENT = "Enchantment School";
const EVOCATION = "Evocation School";
const ILLUSION = "Illusion School";
const NECROMANCY = "Necromancy School";
const TRANSMUTATION = "Transmutation School";

type FeatureRange = BG3Spell["range"];

const transmuterStoneActiveGroup = {
  id: "wizard-transmutation-active-stone",
  label: "Active Transmuter's Stone",
  max: 1,
};

const coreGroup = {
  id: "wizard-core",
  label: "Core Wizard Features",
  order: 10,
};

const arcaneRecoveryGroup = {
  id: "wizard-arcane-recovery",
  label: "Arcane Recovery",
  order: 12,
};

const abjurationGroup = {
  id: "wizard-abjuration",
  label: "Abjuration Features",
  order: 20,
};

const bladesingingGroup = {
  id: "wizard-bladesinging",
  label: "Bladesinging Features",
  order: 30,
};

const conjurationGroup = {
  id: "wizard-conjuration",
  label: "Conjuration Features",
  order: 40,
};

const divinationGroup = {
  id: "wizard-divination",
  label: "Divination Features",
  order: 50,
};

const enchantmentGroup = {
  id: "wizard-enchantment",
  label: "Enchantment Features",
  order: 60,
};

const evocationGroup = {
  id: "wizard-evocation",
  label: "Evocation Features",
  order: 70,
};

const illusionGroup = {
  id: "wizard-illusion",
  label: "Illusion Features",
  order: 80,
};

const necromancyGroup = {
  id: "wizard-necromancy",
  label: "Necromancy Features",
  order: 90,
};

const transmutationGroup = {
  id: "wizard-transmutation",
  label: "Transmutation Features",
  order: 100,
};

const transmuterStoneGroup = {
  id: "wizard-transmuter-stones",
  label: "Transmuter's Stone Options",
  order: 102,
};

const range9m = {
  label: "9m",
  meters: 9,
  category: "mid",
  shape: "single-target",
} as const;

const range18mSingle = {
  label: "18m",
  meters: 18,
  category: "long",
  shape: "single-target",
} as const;

const self6mRadius = {
  label: "self, 6m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 6,
} as const;

const self9mRadius = {
  label: "self, 9m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 9,
} as const;

function safeSpellMeta(spellId: string) {
  const spell = getSpellById(spellId);

  if (spell) {
    return {
      name: spell.name,
      roles: spell.roles,
      damageTypes: spell.damageTypes,
      actions: spell.costs.actions,
      resources: spell.costs.resources,
      range: spell.range,
      tags: [
        `uses-spell-icon:${spellId}`,
        ...(spell.costs.requiresConcentration ? ["concentration"] : []),
        ...(spell.tags ?? []),
      ],
    };
  }

  return {
    name: spellId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    roles: ["support-buff"] as AbilityRole[],
    damageTypes: [] as DamageType[],
    actions: ["action"] as ActionCost[],
    resources: ["spell-slot"] as ResourceCost[],
    range: range18mSingle as FeatureRange,
    tags: [`uses-spell-icon:${spellId}`],
  };
}

function makeSpellLinkedFeature(args: {
  id: string;
  spellId: string;
  minLevel: number;
  subclass: string;
  displayGroup: { id: string; label: string; order: number };
  description: string;
  requires?: string[];
  actionsOverride?: ActionCost[];
  resourcesOverride?: ResourceCost[];
  tags?: string[];
}) {
  const meta = safeSpellMeta(args.spellId);

  return feature(
    args.id,
    meta.name,
    "subclass-feature",
    [availableTo(WIZARD, args.minLevel, args.subclass)],
    true,
    args.description,
    meta.roles,
    meta.damageTypes,
    args.actionsOverride ?? meta.actions,
    args.resourcesOverride ?? meta.resources,
    meta.range,
    ["wizard", "spell-linked-feature", ...meta.tags, ...(args.tags ?? [])],
    {
      displayGroup: args.displayGroup,
      requires: args.requires,
    }
  );
}

type ArcaneRecoveryDefinition = {
  minLevel: number;
  maxLevel?: number;
  charges: number;
};

const arcaneRecoveryDefinitions: ArcaneRecoveryDefinition[] = [
  { minLevel: 1, maxLevel: 2, charges: 1 },
  { minLevel: 3, maxLevel: 4, charges: 2 },
  { minLevel: 5, maxLevel: 6, charges: 3 },
  { minLevel: 7, maxLevel: 8, charges: 4 },
  { minLevel: 9, maxLevel: 10, charges: 5 },
  { minLevel: 11, charges: 6 },
];

function makeArcaneRecoveryCharges(entry: ArcaneRecoveryDefinition) {
  return feature(
    `wizard-arcane-recovery-charges-${entry.charges}`,
    `Arcane Recovery Charges: ${entry.charges}`,
    "resource-feature",
    [availableTo(WIZARD, entry.minLevel, undefined, entry.maxLevel)],
    true,
    `The combined number and level of Spell Slots the Arcane Recovery action can restore is ${entry.charges}. Arcane Recovery cannot restore spell slots above 5th level.`,
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["wizard", "arcane-recovery", "resource"],
    {
      displayGroup: arcaneRecoveryGroup,
    }
  );
}

type SchoolSavantDefinition = {
  school: string;
  idBase: string;
  name: string;
  displayGroup: { id: string; label: string; order: number };
};

const schoolSavantDefinitions: SchoolSavantDefinition[] = [
  {
    school: ABJURATION,
    idBase: "abjuration",
    name: "Abjuration Savant",
    displayGroup: abjurationGroup,
  },
  {
    school: CONJURATION,
    idBase: "conjuration",
    name: "Conjuration Savant",
    displayGroup: conjurationGroup,
  },
  {
    school: DIVINATION,
    idBase: "divination",
    name: "Divination Savant",
    displayGroup: divinationGroup,
  },
  {
    school: ENCHANTMENT,
    idBase: "enchantment",
    name: "Enchantment Savant",
    displayGroup: enchantmentGroup,
  },
  {
    school: EVOCATION,
    idBase: "evocation",
    name: "Evocation Savant",
    displayGroup: evocationGroup,
  },
  {
    school: ILLUSION,
    idBase: "illusion",
    name: "Illusion Savant",
    displayGroup: illusionGroup,
  },
  {
    school: NECROMANCY,
    idBase: "necromancy",
    name: "Necromancy Savant",
    displayGroup: necromancyGroup,
  },
  {
    school: TRANSMUTATION,
    idBase: "transmutation",
    name: "Transmutation Savant",
    displayGroup: transmutationGroup,
  },
];

function makeSchoolSavantFeature(entry: SchoolSavantDefinition) {
  return feature(
    `wizard-${entry.idBase}-savant`,
    entry.name,
    "passive",
    [availableTo(WIZARD, 2, entry.school)],
    true,
    `${entry.name} halves the gold cost to learn ${entry.school.replace(
      " School",
      ""
    )} spells from scrolls.`,
    ["investigation-world-interaction", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["wizard", "savant", entry.idBase],
    {
      displayGroup: entry.displayGroup,
    }
  );
}

type BladesongPowerDefinition = {
  minLevel: number;
  maxLevel?: number;
  amount: number;
  bonus: number;
};

const bladesongPowerDefinitions: BladesongPowerDefinition[] = [
  { minLevel: 2, maxLevel: 4, amount: 2, bonus: 2 },
  { minLevel: 5, maxLevel: 8, amount: 3, bonus: 3 },
  { minLevel: 9, amount: 4, bonus: 4 },
];

function makeBladesongPowerFeature(entry: BladesongPowerDefinition) {
  return feature(
    `wizard-bladesinging-bladesong-power-${entry.amount}`,
    `Bladesong Power: ${entry.amount}`,
    "resource-feature",
    [availableTo(WIZARD, entry.minLevel, BLADESINGING, entry.maxLevel)],
    true,
    `You have ${entry.amount} Bladesong Power. Bladesong grants +${entry.bonus} Armour Class and +${entry.bonus} Constitution Saving Throws while active. Replenished on Long Rest.`,
    ["support-buff", "defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["wizard", "bladesinging", "resource"],
    {
      displayGroup: bladesingingGroup,
    }
  );
}

type TransmuterStoneDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
};

const transmuterStoneDefinitions: TransmuterStoneDefinition[] = [
  {
    idBase: "constitution",
    name: "Transmuter's Stone: Constitution",
    description:
      "Create a stone that grants the carrier Proficiency in Constitution Saving Throws.",
    roles: ["defense-protection", "support-buff"],
    damageTypes: [],
  },
  {
    idBase: "darkvision",
    name: "Transmuter's Stone: Darkvision",
    description:
      "Create a stone that lets the carrier see in the dark up to 18m.",
    roles: ["investigation-world-interaction", "support-buff"],
    damageTypes: [],
  },
  {
    idBase: "speed",
    name: "Transmuter's Stone: Speed",
    description:
      "Create a stone that increases the carrier's movement speed by 3m.",
    roles: ["mobility-positioning", "support-buff"],
    damageTypes: [],
  },
  {
    idBase: "acid-resistance",
    name: "Transmuter's Stone: Acid Resistance",
    description: "Create a stone that grants Resistance to Acid damage.",
    roles: ["defense-protection"],
    damageTypes: ["Acid"],
  },
  {
    idBase: "cold-resistance",
    name: "Transmuter's Stone: Cold Resistance",
    description: "Create a stone that grants Resistance to Cold damage.",
    roles: ["defense-protection"],
    damageTypes: ["Cold"],
  },
  {
    idBase: "fire-resistance",
    name: "Transmuter's Stone: Fire Resistance",
    description: "Create a stone that grants Resistance to Fire damage.",
    roles: ["defense-protection"],
    damageTypes: ["Fire"],
  },
  {
    idBase: "lightning-resistance",
    name: "Transmuter's Stone: Lightning Resistance",
    description: "Create a stone that grants Resistance to Lightning damage.",
    roles: ["defense-protection"],
    damageTypes: ["Lightning"],
  },
  {
    idBase: "thunder-resistance",
    name: "Transmuter's Stone: Thunder Resistance",
    description: "Create a stone that grants Resistance to Thunder damage.",
    roles: ["defense-protection"],
    damageTypes: ["Thunder"],
  },
];

function makeTransmuterStoneFeature(entry: TransmuterStoneDefinition) {
  return feature(
    `wizard-transmutation-stone-${entry.idBase}`,
    entry.name,
    "toggle",
    [availableTo(WIZARD, 6, TRANSMUTATION)],
    true,
    `${entry.description} Only one Transmuter's Stone can be active at a time.`,
    entry.roles,
    entry.damageTypes,
    ["action"],
    ["class-resource"],
    touch,
    ["wizard", "transmutation", "transmuters-stone"],
    {
      displayGroup: transmuterStoneGroup,
      activeGroup: transmuterStoneActiveGroup,
      requires: ["wizard-transmutation-transmuters-stone"],
    }
  );
}

const wizardFeatures = [
  feature(
    "wizard-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(WIZARD, 1)],
    true,
    "Wizards are Intelligence-based prepared spellcasters. They learn spells into a spellbook and may prepare Wizard level + Intelligence modifier spells.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["wizard", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "wizard-transcribing-scrolls",
    "Transcribing Scrolls",
    "passive",
    [availableTo(WIZARD, 1)],
    true,
    "A Wizard can permanently copy Wizard spells from scrolls into their spellbook if the spell is on the Wizard class list and of a level they can cast.",
    ["investigation-world-interaction", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["wizard", "spellbook", "scroll-transcription"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "wizard-arcane-recovery",
    "Arcane Recovery",
    "action",
    [availableTo(WIZARD, 1)],
    true,
    "Replenish expended spell slots while out of combat. Arcane Recovery cannot restore spell slots above 5th level.",
    ["support-buff"],
    [],
    ["action"],
    ["class-resource", "long-rest"],
    self,
    ["wizard", "arcane-recovery"],
    {
      displayGroup: arcaneRecoveryGroup,
    }
  ),

  ...arcaneRecoveryDefinitions.map(makeArcaneRecoveryCharges),

  ...schoolSavantDefinitions.map(makeSchoolSavantFeature),

  feature(
    "wizard-abjuration-arcane-ward",
    "Arcane Ward",
    "passive",
    [availableTo(WIZARD, 2, ABJURATION)],
    true,
    "Casting Abjuration spells creates and reinforces a ward that blocks incoming damage. The ward starts at Wizard level after each Long Rest and can build up to twice Wizard level.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["wizard", "abjuration", "arcane-ward"],
    {
      displayGroup: abjurationGroup,
    }
  ),

  feature(
    "wizard-abjuration-projected-ward",
    "Projected Ward",
    "reaction",
    [availableTo(WIZARD, 6, ABJURATION)],
    true,
    "When a nearby ally takes damage and you have an active Arcane Ward, sacrifice part of the ward to reduce the ally's damage.",
    ["defense-protection", "support-buff"],
    [],
    ["reaction"],
    ["none"],
    range18mSingle,
    ["wizard", "abjuration", "arcane-ward"],
    {
      displayGroup: abjurationGroup,
      requires: ["wizard-abjuration-arcane-ward"],
    }
  ),

  feature(
    "wizard-abjuration-improved-abjuration",
    "Improved Abjuration",
    "passive",
    [availableTo(WIZARD, 10, ABJURATION)],
    true,
    "Each time you take a Short Rest, the intensity of your Arcane Ward increases by an amount equal to your Wizard level.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["wizard", "abjuration", "arcane-ward"],
    {
      displayGroup: abjurationGroup,
      requires: ["wizard-abjuration-arcane-ward"],
    }
  ),

  ...bladesongPowerDefinitions.map(makeBladesongPowerFeature),

  feature(
    "wizard-bladesinging-bladesong",
    "Bladesong",
    "subclass-feature",
    [availableTo(WIZARD, 2, BLADESINGING)],
    true,
    "Invoke the Bladesong. You gain a bonus to Armour Class, movement speed increases by 3m, and you gain Advantage in Acrobatics and a bonus to Constitution Saving Throws. The defensive bonus improves at Wizard levels 5 and 9.",
    ["support-buff", "defense-protection", "mobility-positioning"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["wizard", "bladesinging", "bladesong"],
    {
      displayGroup: bladesingingGroup,
    }
  ),

  feature(
    "wizard-bladesinging-training-in-war-and-song",
    "Training in War and Song",
    "passive",
    [availableTo(WIZARD, 2, BLADESINGING)],
    true,
    "Gain proficiency with Light Armour, Performance, and several one-handed weapons used by Bladesingers.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    melee,
    ["wizard", "bladesinging"],
    {
      displayGroup: bladesingingGroup,
    }
  ),

  feature(
    "wizard-bladesinging-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(WIZARD, 6, BLADESINGING)],
    true,
    "You can make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    melee,
    ["wizard", "bladesinging"],
    {
      displayGroup: bladesingingGroup,
    }
  ),

  feature(
    "wizard-bladesinging-song-of-defence",
    "Song of Defence",
    "reaction",
    [availableTo(WIZARD, 10, BLADESINGING)],
    true,
    "When you take damage during Bladesong, expend a spell slot to subtract 5 damage per spell slot level.",
    ["defense-protection"],
    [],
    ["reaction"],
    ["spell-slot"],
    self,
    ["wizard", "bladesinging", "bladesong"],
    {
      displayGroup: bladesingingGroup,
      requires: ["wizard-bladesinging-bladesong"],
    }
  ),

  feature(
    "wizard-conjuration-minor-conjuration-create-water",
    "Minor Conjuration: Create Water",
    "action",
    [availableTo(WIZARD, 2, CONJURATION)],
    true,
    "Call forth rain. It extinguishes exposed flames and forms a Water surface. Recharges on Short Rest.",
    ["control", "support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    ["short-rest"],
    radiusRange("18m, 4m AoE", 18, "long", 4),
    ["wizard", "conjuration", "uses-spell-icon:create-or-destroy-water"],
    {
      displayGroup: conjurationGroup,
    }
  ),

  feature(
    "wizard-conjuration-benign-transposition",
    "Benign Transposition: Teleport",
    "action",
    [availableTo(WIZARD, 6, CONJURATION)],
    true,
    "Teleport to a nearby unoccupied space, or swap places with an ally. Recharges on Long Rest.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["action"],
    ["long-rest"],
    range18mSingle,
    ["wizard", "conjuration"],
    {
      displayGroup: conjurationGroup,
    }
  ),

  feature(
    "wizard-conjuration-focused-conjuration",
    "Focused Conjuration",
    "passive",
    [availableTo(WIZARD, 10, CONJURATION)],
    true,
    "Damage taken while Concentrating on a Conjuration spell will not break your Concentration.",
    ["defense-protection", "summon", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["wizard", "conjuration", "concentration"],
    {
      displayGroup: conjurationGroup,
    }
  ),

  feature(
    "wizard-divination-portent",
    "Portent",
    "reaction",
    [availableTo(WIZARD, 2, DIVINATION)],
    true,
    "After each Long Rest, gain two random Portent Dice. Use a reaction to replace a nearby Attack Roll or Saving Throw with one of those dice.",
    ["support-buff", "control", "defense-protection"],
    [],
    ["reaction"],
    ["long-rest"],
    range18mSingle,
    ["wizard", "divination", "portent"],
    {
      displayGroup: divinationGroup,
    }
  ),

  feature(
    "wizard-divination-portent-dice-2",
    "Portent Dice: 2",
    "resource-feature",
    [availableTo(WIZARD, 2, DIVINATION, 5)],
    true,
    "You gain two Portent Dice after each Long Rest.",
    ["support-buff", "control"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["wizard", "divination", "portent", "resource"],
    {
      displayGroup: divinationGroup,
      requires: ["wizard-divination-portent"],
    }
  ),

  feature(
    "wizard-divination-expert-divination",
    "Expert Divination",
    "passive",
    [availableTo(WIZARD, 6, DIVINATION)],
    true,
    "You gain an additional Portent Die. After Short Rest, receive Prophecies that can restore missing Portent Dice when completed.",
    ["support-buff", "control"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["wizard", "divination", "portent"],
    {
      displayGroup: divinationGroup,
      requires: ["wizard-divination-portent"],
    }
  ),

  feature(
    "wizard-divination-portent-dice-3",
    "Portent Dice: 3",
    "resource-feature",
    [availableTo(WIZARD, 6, DIVINATION)],
    true,
    "You gain three Portent Dice after each Long Rest.",
    ["support-buff", "control"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["wizard", "divination", "portent", "resource"],
    {
      displayGroup: divinationGroup,
      requires: ["wizard-divination-expert-divination"],
    }
  ),

  feature(
    "wizard-divination-third-eye-darkvision",
    "Third Eye: Darkvision",
    "action",
    [availableTo(WIZARD, 10, DIVINATION)],
    true,
    "Gain the ability to see in the dark out to a range of 24m. Recharges on Long Rest.",
    ["investigation-world-interaction", "support-buff"],
    [],
    ["action"],
    ["long-rest"],
    self,
    ["wizard", "divination", "third-eye"],
    {
      displayGroup: divinationGroup,
    }
  ),

  feature(
    "wizard-divination-third-eye-see-invisibility",
    "Third Eye: See Invisibility",
    "action",
    [availableTo(WIZARD, 10, DIVINATION)],
    true,
    "Become able to see Invisible creatures and possibly reveal them to others. Recharges on Long Rest.",
    ["investigation-world-interaction", "control", "support-buff"],
    [],
    ["action"],
    ["long-rest"],
    self9mRadius,
    ["wizard", "divination", "third-eye", "uses-spell-icon:see-invisibility"],
    {
      displayGroup: divinationGroup,
    }
  ),

  feature(
    "wizard-enchantment-hypnotic-gaze",
    "Hypnotic Gaze",
    "action",
    [availableTo(WIZARD, 2, ENCHANTMENT)],
    true,
    "Charm and Incapacitate a creature. It cannot attack or act. Recharges on Long Rest.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["long-rest"],
    range9m,
    ["wizard", "enchantment"],
    {
      displayGroup: enchantmentGroup,
    }
  ),

  feature(
    "wizard-enchantment-maintain-hypnotic-gaze",
    "Maintain Hypnotic Gaze",
    "action",
    [availableTo(WIZARD, 2, ENCHANTMENT)],
    true,
    "Maintain your Hypnotic Gaze each turn to extend its duration.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["none"],
    range9m,
    ["wizard", "enchantment"],
    {
      displayGroup: enchantmentGroup,
      requires: ["wizard-enchantment-hypnotic-gaze"],
    }
  ),

  feature(
    "wizard-enchantment-instinctive-charm",
    "Instinctive Charm",
    "reaction",
    [availableTo(WIZARD, 6, ENCHANTMENT)],
    true,
    "Charm an enemy attacking you. They attack a new target if possible.",
    ["control", "defense-protection"],
    [],
    ["reaction"],
    ["none"],
    range18mSingle,
    ["wizard", "enchantment"],
    {
      displayGroup: enchantmentGroup,
    }
  ),

  feature(
    "wizard-enchantment-split-enchantment",
    "Split Enchantment",
    "passive",
    [availableTo(WIZARD, 10, ENCHANTMENT)],
    true,
    "You can target 2 creatures with Enchantment spells that would normally only target 1 creature.",
    ["control", "support-buff"],
    [],
    ["passive"],
    ["none"],
    range18m,
    ["wizard", "enchantment"],
    {
      displayGroup: enchantmentGroup,
    }
  ),

  feature(
    "wizard-evocation-sculpt-spells",
    "Sculpt Spells",
    "passive",
    [availableTo(WIZARD, 2, EVOCATION)],
    true,
    "Create pockets of safety within Evocation spells. Allies automatically succeed Saving Throws against these spells and take no damage from them.",
    ["support-buff", "defense-protection", "area-damage"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["wizard", "evocation"],
    {
      displayGroup: evocationGroup,
    }
  ),

  feature(
    "wizard-evocation-potent-cantrip",
    "Potent Cantrip",
    "passive",
    [availableTo(WIZARD, 6, EVOCATION)],
    true,
    "When a creature succeeds its Saving Throw against one of your cantrips, it still takes half the cantrip's damage but suffers no additional effects.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["wizard", "evocation"],
    {
      displayGroup: evocationGroup,
    }
  ),

  feature(
    "wizard-evocation-empowered-evocation",
    "Empowered Evocation",
    "passive",
    [availableTo(WIZARD, 10, EVOCATION)],
    true,
    "Add your Intelligence Modifier to damage rolls with Evocation spells.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["wizard", "evocation"],
    {
      displayGroup: evocationGroup,
    }
  ),

  feature(
    "wizard-illusion-improved-minor-illusion",
    "Improved Minor Illusion",
    "passive",
    [availableTo(WIZARD, 2, ILLUSION)],
    true,
    "You can cast Minor Illusion as a Bonus Action.",
    ["control", "investigation-world-interaction"],
    [],
    ["passive"],
    ["none"],
    range18mSingle,
    ["wizard", "illusion", "uses-spell-icon:minor-illusion"],
    {
      displayGroup: illusionGroup,
    }
  ),

  feature(
    "wizard-illusion-minor-illusion-bonus-action",
    "Minor Illusion: Bonus Action",
    "bonus-action",
    [availableTo(WIZARD, 2, ILLUSION)],
    true,
    "Cast Minor Illusion as a Bonus Action.",
    ["control", "investigation-world-interaction"],
    [],
    ["bonus-action"],
    ["cantrip"],
    range18mSingle,
    ["wizard", "illusion", "uses-spell-icon:minor-illusion"],
    {
      displayGroup: illusionGroup,
      requires: ["wizard-illusion-improved-minor-illusion"],
    }
  ),

  makeSpellLinkedFeature({
    id: "wizard-illusion-see-invisibility",
    spellId: "see-invisibility",
    minLevel: 6,
    subclass: ILLUSION,
    displayGroup: illusionGroup,
    description:
      "Glimpse Invisible creatures and possibly reveal them to others. Recharges on Short Rest.",
    resourcesOverride: ["short-rest"],
    tags: ["illusion-school"],
  }),

  feature(
    "wizard-illusion-illusory-self",
    "Illusory Self",
    "reaction",
    [availableTo(WIZARD, 10, ILLUSION)],
    true,
    "Interpose an illusory duplicate of yourself between you and an attacker's strike, making them miss. Recharges on Short Rest.",
    ["defense-protection"],
    [],
    ["reaction"],
    ["short-rest"],
    self,
    ["wizard", "illusion"],
    {
      displayGroup: illusionGroup,
    }
  ),

  feature(
    "wizard-necromancy-grim-harvest",
    "Grim Harvest",
    "passive",
    [availableTo(WIZARD, 2, NECROMANCY)],
    true,
    "Once per turn, if you kill a creature with a spell, regain Hit Points equal to twice the spell slot level used, or three times if it is a Necromancy spell. Undead and Constructs are unaffected.",
    ["healing", "single-target-damage"],
    ["Necrotic", "Variable"],
    ["passive"],
    ["none"],
    self,
    ["wizard", "necromancy"],
    {
      displayGroup: necromancyGroup,
    }
  ),

  makeSpellLinkedFeature({
    id: "wizard-necromancy-undead-thralls-animate-dead",
    spellId: "animate-dead",
    minLevel: 6,
    subclass: NECROMANCY,
    displayGroup: necromancyGroup,
    description:
      "Undead Thralls grants Animate Dead if you did not already know it.",
    tags: ["necromancy-school", "undead-thralls"],
  }),

  feature(
    "wizard-necromancy-undead-thralls-additional-undead",
    "Undead Thralls: Additional Undead",
    "passive",
    [availableTo(WIZARD, 6, NECROMANCY)],
    true,
    "When you use Animate Dead, you can raise an additional corpse.",
    ["summon", "support-buff"],
    ["Necrotic"],
    ["passive"],
    ["none"],
    touch,
    ["wizard", "necromancy", "undead-thralls"],
    {
      displayGroup: necromancyGroup,
      requires: ["wizard-necromancy-undead-thralls-animate-dead"],
    }
  ),

  feature(
    "wizard-necromancy-undead-thralls-better-summons",
    "Undead Thralls: Better Summons",
    "passive",
    [availableTo(WIZARD, 6, NECROMANCY)],
    true,
    "Creatures created with Animate Dead have additional hit points equal to your Wizard level, and your Proficiency Bonus is added to their damage.",
    ["summon", "support-buff", "single-target-damage"],
    ["Necrotic", "Weapon"],
    ["passive"],
    ["none"],
    touch,
    ["wizard", "necromancy", "undead-thralls"],
    {
      displayGroup: necromancyGroup,
      requires: ["wizard-necromancy-undead-thralls-animate-dead"],
    }
  ),

  feature(
    "wizard-necromancy-inured-to-undeath",
    "Inured to Undeath",
    "passive",
    [availableTo(WIZARD, 10, NECROMANCY)],
    true,
    "You are Resistant to Necrotic damage, and your hit point maximum cannot be reduced.",
    ["defense-protection"],
    ["Necrotic"],
    ["passive"],
    ["none"],
    self,
    ["wizard", "necromancy"],
    {
      displayGroup: necromancyGroup,
    }
  ),

  feature(
    "wizard-transmutation-experimental-alchemy",
    "Experimental Alchemy",
    "passive",
    [availableTo(WIZARD, 2, TRANSMUTATION)],
    true,
    "When combining extracts, brew two Alchemical Solutions instead of one if you succeed a DC 15 Medicine Check.",
    ["support-buff", "healing", "defense-protection"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["wizard", "transmutation", "alchemy"],
    {
      displayGroup: transmutationGroup,
    }
  ),

  feature(
    "wizard-transmutation-transmuters-stone",
    "Transmuter's Stone",
    "action",
    [availableTo(WIZARD, 6, TRANSMUTATION)],
    true,
    "Create a Transmuter's Stone. Only one stone can be active at a time. After creating one, you must cast a level 1 or higher Transmutation spell or take a Long Rest before creating another.",
    ["support-buff", "defense-protection", "mobility-positioning"],
    ["Variable"],
    ["action"],
    ["class-resource"],
    touch,
    ["wizard", "transmutation", "transmuters-stone"],
    {
      displayGroup: transmutationGroup,
    }
  ),

  ...transmuterStoneDefinitions.map(makeTransmuterStoneFeature),

  feature(
    "wizard-transmutation-shapechanger",
    "Shapechanger",
    "action",
    [availableTo(WIZARD, 10, TRANSMUTATION)],
    true,
    "Transform into a blue jay, able to Fly. If the blue jay's hit points drop to 0, the target reverts to its original form with its original hit points.",
    ["mobility-positioning", "defense-protection", "support-buff"],
    [],
    ["action"],
    ["none"],
    self,
    ["wizard", "transmutation", "shapechanger"],
    {
      displayGroup: transmutationGroup,
    }
  ),

  feature(
    "wizard-transmutation-shapechanger-fly",
    "Shapechanger: Fly",
    "bonus-action",
    [availableTo(WIZARD, 10, TRANSMUTATION)],
    true,
    "Fly while transformed into a blue jay.",
    ["mobility-positioning"],
    [],
    ["bonus-action"],
    ["none"],
    range18mSingle,
    ["wizard", "transmutation", "shapechanger"],
    {
      displayGroup: transmutationGroup,
      requires: ["wizard-transmutation-shapechanger"],
    }
  ),
];

const arcaneRecoveryIconEntries = Object.fromEntries(
  arcaneRecoveryDefinitions.map((entry) => [
    `wizard-arcane-recovery-charges-${entry.charges}`,
    "Passive_Wizard_ArcaneRecoveryCharges.png",
  ])
);

const savantIconEntries = Object.fromEntries(
  schoolSavantDefinitions.map((entry) => [
    `wizard-${entry.idBase}-savant`,
    `Passive_Wizard_${entry.idBase}_Savant.png`,
  ])
);

const bladesongPowerIconEntries = Object.fromEntries(
  bladesongPowerDefinitions.map((entry) => [
    `wizard-bladesinging-bladesong-power-${entry.amount}`,
    "Passive_Wizard_Bladesinging_BladesongPower.png",
  ])
);

const transmuterStoneIconEntries = Object.fromEntries(
  transmuterStoneDefinitions.map((entry) => [
    `wizard-transmutation-stone-${entry.idBase}`,
    `Action_Wizard_Transmutation_Stone_${entry.idBase}.png`,
  ])
);

export const wizardClassModule: ClassFeatureModule = {
  className: "Wizard",
  defaultTabLabel: "Wizard Features",
  subclassTabLabels: {
    [ABJURATION]: "Abjuration Features",
    [BLADESINGING]: "Bladesinging Features",
    [CONJURATION]: "Conjuration Features",
    [DIVINATION]: "Divination Features",
    [ENCHANTMENT]: "Enchantment Features",
    [EVOCATION]: "Evocation Features",
    [ILLUSION]: "Illusion Features",
    [NECROMANCY]: "Necromancy Features",
    [TRANSMUTATION]: "Transmutation Features",
  },
  features: wizardFeatures,
  iconFileByFeatureId: {
    "wizard-spellcasting": "Passive_Wizard_Spellcasting.png",
    "wizard-transcribing-scrolls": "Passive_Wizard_TranscribingScrolls.png",
    "wizard-arcane-recovery": "Action_Wizard_ArcaneRecovery.png",

    "wizard-abjuration-arcane-ward": "Passive_Wizard_Abjuration_ArcaneWard.png",
    "wizard-abjuration-projected-ward":
      "Reaction_Wizard_Abjuration_ProjectedWard.png",
    "wizard-abjuration-improved-abjuration":
      "Passive_Wizard_Abjuration_ImprovedAbjuration.png",

    "wizard-bladesinging-bladesong":
      "Action_Wizard_Bladesinging_Bladesong.png",
    "wizard-bladesinging-training-in-war-and-song":
      "Passive_Wizard_Bladesinging_TrainingInWarAndSong.png",
    "wizard-bladesinging-extra-attack": "Passive_ExtraAttack.png",
    "wizard-bladesinging-song-of-defence":
      "Reaction_Wizard_Bladesinging_SongOfDefence.png",

    "wizard-conjuration-minor-conjuration-create-water":
      "Action_Wizard_Conjuration_MinorConjurationCreateWater.png",
    "wizard-conjuration-benign-transposition":
      "Action_Wizard_Conjuration_BenignTransposition.png",
    "wizard-conjuration-focused-conjuration":
      "Passive_Wizard_Conjuration_FocusedConjuration.png",

    "wizard-divination-portent": "Reaction_Wizard_Divination_Portent.png",
    "wizard-divination-portent-dice-2":
      "Passive_Wizard_Divination_PortentDice.png",
    "wizard-divination-expert-divination":
      "Passive_Wizard_Divination_ExpertDivination.png",
    "wizard-divination-portent-dice-3":
      "Passive_Wizard_Divination_PortentDice.png",
    "wizard-divination-third-eye-darkvision":
      "Action_Wizard_Divination_ThirdEyeDarkvision.png",
    "wizard-divination-third-eye-see-invisibility":
      "Action_Wizard_Divination_ThirdEyeSeeInvisibility.png",

    "wizard-enchantment-hypnotic-gaze":
      "Action_Wizard_Enchantment_HypnoticGaze.png",
    "wizard-enchantment-maintain-hypnotic-gaze":
      "Action_Wizard_Enchantment_MaintainHypnoticGaze.png",
    "wizard-enchantment-instinctive-charm":
      "Reaction_Wizard_Enchantment_InstinctiveCharm.png",
    "wizard-enchantment-split-enchantment":
      "Passive_Wizard_Enchantment_SplitEnchantment.png",

    "wizard-evocation-sculpt-spells":
      "Passive_Wizard_Evocation_SculptSpells.png",
    "wizard-evocation-potent-cantrip":
      "Passive_Wizard_Evocation_PotentCantrip.png",
    "wizard-evocation-empowered-evocation":
      "Passive_Wizard_Evocation_EmpoweredEvocation.png",

    "wizard-illusion-improved-minor-illusion":
      "Passive_Wizard_Illusion_ImprovedMinorIllusion.png",
    "wizard-illusion-minor-illusion-bonus-action":
      "Spell_Illusion_MinorIllusion.png",
    "wizard-illusion-see-invisibility": "Spell_Divination_SeeInvisibility.png",
    "wizard-illusion-illusory-self":
      "Reaction_Wizard_Illusion_IllusorySelf.png",

    "wizard-necromancy-grim-harvest":
      "Passive_Wizard_Necromancy_GrimHarvest.png",
    "wizard-necromancy-undead-thralls-animate-dead":
      "Spell_Necromancy_AnimateDead.png",
    "wizard-necromancy-undead-thralls-additional-undead":
      "Passive_Wizard_Necromancy_UndeadThrallsAdditionalUndead.png",
    "wizard-necromancy-undead-thralls-better-summons":
      "Passive_Wizard_Necromancy_UndeadThrallsBetterSummons.png",
    "wizard-necromancy-inured-to-undeath":
      "Passive_Wizard_Necromancy_InuredToUndeath.png",

    "wizard-transmutation-experimental-alchemy":
      "Passive_Wizard_Transmutation_ExperimentalAlchemy.png",
    "wizard-transmutation-transmuters-stone":
      "Action_Wizard_Transmutation_TransmutersStone.png",
    "wizard-transmutation-shapechanger":
      "Action_Wizard_Transmutation_Shapechanger.png",
    "wizard-transmutation-shapechanger-fly":
      "Action_Wizard_Transmutation_ShapechangerFly.png",

    ...arcaneRecoveryIconEntries,
    ...savantIconEntries,
    ...bladesongPowerIconEntries,
    ...transmuterStoneIconEntries,
  },
};