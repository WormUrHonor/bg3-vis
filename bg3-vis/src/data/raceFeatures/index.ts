import type {
  AbilityRole,
  ActionCost,
  BG3Spell,
  DamageType,
  ResourceCost,
} from "../bg3Spells";
import { getSpellById } from "../bg3Spells";
import type { BG3ClassFeature } from "../classFeatures";
import type { RaceName } from "../../types/buildPlannerTypes";

type RaceFeatureDisplayGroup = {
  id: string;
  label: string;
  order: number;
};

type RaceFeatureChoiceGroup = {
  id: string;
  label: string;
  max: number;
};

type RaceFeatureAvailability = {
  race: RaceName;
  subrace?: string;
  minLevel?: number;
  maxLevel?: number;
};

type RaceFeatureOptions = {
  displayGroup?: RaceFeatureDisplayGroup;
  choiceGroup?: RaceFeatureChoiceGroup;
  activeGroup?: RaceFeatureChoiceGroup;
  requires?: string[];
  conflictsWith?: string[];
  isInformational?: boolean;
};

type RaceFeatureDefinition = BG3ClassFeature & {
  raceAvailability: RaceFeatureAvailability[];
};

const self = {
  label: "self",
  meters: 0,
  category: "self",
  shape: "self",
} as const;

const touch = {
  label: "1.5m",
  meters: 1.5,
  category: "melee",
  shape: "single-target",
} as const;

const range18m = {
  label: "18m",
  meters: 18,
  category: "long",
  shape: "single-target",
} as const;

const line5m = {
  label: "5m line",
  meters: 5,
  category: "mid",
  shape: "line",
} as const;

const cone5m = {
  label: "5m cone",
  meters: 5,
  category: "mid",
  shape: "cone",
} as const;

const racialCoreGroup = {
  id: "racial-core",
  label: "Racial Features",
  order: 5,
};

const racialSpellGroup = {
  id: "racial-spells",
  label: "Racial Spells",
  order: 8,
};

const racialCantripGroup = {
  id: "racial-cantrip-choice",
  label: "Racial Cantrip Choice",
  order: 9,
};

const racialBreathGroup = {
  id: "dragonborn-breath-weapons",
  label: "Dragonborn Breath Weapon",
  order: 10,
};

const highElfCantripChoice = {
  id: "racial-high-elf-wizard-cantrip",
  label: "High Elf Wizard Cantrip",
  max: 1,
};

const highHalfElfCantripChoice = {
  id: "racial-high-half-elf-wizard-cantrip",
  label: "High Half-Elf Wizard Cantrip",
  max: 1,
};

const wizardCantripChoiceIds = [
  "acid-splash",
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "bursting-sinew",
  "dancing-lights",
  "fire-bolt",
  "friends",
  "light",
  "mage-hand",
  "minor-illusion",
  "poison-spray",
  "ray-of-frost",
  "shocking-grasp",
  "toll-the-dead",
  "true-strike",
];

function applyOptions(
  base: Omit<RaceFeatureDefinition, "raceAvailability">,
  options: RaceFeatureOptions = {}
): Omit<RaceFeatureDefinition, "raceAvailability"> {
  return {
    ...base,
    isInformational: options.isInformational ?? false,
    requiredFeatureIds: options.requires,
    conflictsWithFeatureIds: options.conflictsWith,

    displayGroupId: options.displayGroup?.id,
    displayGroupLabel: options.displayGroup?.label,
    displayGroupOrder: options.displayGroup?.order,

    choiceGroupId: options.choiceGroup?.id,
    choiceGroupLabel: options.choiceGroup?.label,
    choiceGroupMax: options.choiceGroup?.max,

    activeGroupId: options.activeGroup?.id,
    activeGroupLabel: options.activeGroup?.label,
    activeGroupMax: options.activeGroup?.max,
  };
}

function raceFeature(
  id: string,
  name: string,
  kind: BG3ClassFeature["kind"],
  raceAvailability: RaceFeatureAvailability[],
  isFixed: boolean,
  description: string,
  roles: AbilityRole[],
  damageTypes: DamageType[],
  actions: ActionCost[],
  resources: ResourceCost[],
  range: BG3Spell["range"],
  tags: string[],
  options: RaceFeatureOptions = {}
): RaceFeatureDefinition {
  const base = applyOptions(
    {
      id,
      name,
      sourceType: "class-feature",
      kind,
      availability: [],
      isFixed,
      description,
      roles,
      damageTypes,
      costs: {
        actions,
        resources,
        requiresConcentration: tags.includes("concentration"),
      },
      range,
      tags: ["racial-feature", ...tags],
    } as Omit<RaceFeatureDefinition, "raceAvailability">,
    options
  );

  return {
    ...base,
    raceAvailability,
  };
}

function safeSpellMeta(spellId: string) {
  const spell = getSpellById(spellId);

  if (spell) {
    return {
      name: spell.name,
      roles: spell.roles,
      damageTypes: spell.damageTypes,
      actions: spell.costs.actions,
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
    range: range18m,
    tags: [`uses-spell-icon:${spellId}`],
  };
}

function racialSpell(args: {
  id: string;
  spellId: string;
  raceAvailability: RaceFeatureAvailability[];
  description: string;
  resource: ResourceCost;
  choiceGroup?: RaceFeatureChoiceGroup;
  displayGroup?: RaceFeatureDisplayGroup;
  isFixed?: boolean;
  tags?: string[];
}) {
  const meta = safeSpellMeta(args.spellId);

  return raceFeature(
    args.id,
    meta.name,
    "subclass-feature",
    args.raceAvailability,
    args.choiceGroup ? false : args.isFixed ?? true,
    args.description,
    meta.roles,
    meta.damageTypes,
    meta.actions,
    [args.resource],
    meta.range,
    ["racial-spell", ...meta.tags, ...(args.tags ?? [])],
    {
      displayGroup: args.displayGroup ?? racialSpellGroup,
      choiceGroup: args.choiceGroup,
    }
  );
}

function racialPassive(args: {
  id: string;
  name: string;
  raceAvailability: RaceFeatureAvailability[];
  description: string;
  roles: AbilityRole[];
  damageTypes?: DamageType[];
  range?: BG3Spell["range"];
  tags?: string[];
  displayGroup?: RaceFeatureDisplayGroup;
}) {
  return raceFeature(
    args.id,
    args.name,
    "passive",
    args.raceAvailability,
    true,
    args.description,
    args.roles,
    args.damageTypes ?? [],
    ["passive"],
    ["none"],
    args.range ?? self,
    ["racial-passive", ...(args.tags ?? [])],
    {
      displayGroup: args.displayGroup ?? racialCoreGroup,
    }
  );
}

function dragonbornBreath(args: {
  subrace: string;
  idBase: string;
  name: string;
  damageType: DamageType;
  shape: "line" | "cone";
}) {
  return [
    racialPassive({
      id: `race-dragonborn-${args.idBase}-ancestry`,
      name: `${args.name} Ancestry`,
      raceAvailability: [{ race: "Dragonborn", subrace: args.subrace }],
      description: `Gain Resistance to ${args.damageType} damage.`,
      roles: ["defense-protection"],
      damageTypes: [args.damageType],
      tags: ["dragonborn", "draconic-ancestry"],
    }),

    raceFeature(
      `race-dragonborn-${args.idBase}-breath`,
      args.name,
      "action",
      [{ race: "Dragonborn", subrace: args.subrace }],
      true,
      `Exhale a 5m ${args.shape} of ${args.damageType} damage. Recharges on Short Rest.`,
      ["area-damage"],
      [args.damageType],
      ["action"],
      ["short-rest"],
      args.shape === "line" ? line5m : cone5m,
      ["dragonborn", "breath-weapon", args.damageType.toLowerCase()],
      {
        displayGroup: racialBreathGroup,
      }
    ),
  ];
}

const highElfCantrips = wizardCantripChoiceIds.map((spellId) =>
  racialSpell({
    id: `race-high-elf-cantrip-${spellId}`,
    spellId,
    raceAvailability: [{ race: "Elf", subrace: "High Elf" }],
    description: "High Elf racial Wizard cantrip choice.",
    resource: "cantrip",
    choiceGroup: highElfCantripChoice,
    displayGroup: racialCantripGroup,
    isFixed: false,
    tags: ["high-elf", "wizard-cantrip"],
  })
);

const highHalfElfCantrips = wizardCantripChoiceIds.map((spellId) =>
  racialSpell({
    id: `race-high-half-elf-cantrip-${spellId}`,
    spellId,
    raceAvailability: [{ race: "Half-Elf", subrace: "High Half-Elf" }],
    description: "High Half-Elf racial Wizard cantrip choice.",
    resource: "cantrip",
    choiceGroup: highHalfElfCantripChoice,
    displayGroup: racialCantripGroup,
    isFixed: false,
    tags: ["high-half-elf", "wizard-cantrip"],
  })
);

export const bg3RaceFeatures: RaceFeatureDefinition[] = [
  racialPassive({
    id: "race-human-versatility",
    name: "Human Versatility",
    raceAvailability: [{ race: "Human" }],
    description:
      "Gain one additional skill proficiency, Light Armour proficiency, Shield proficiency, polearm weapon proficiencies, and 25% increased carrying capacity.",
    roles: ["support-buff", "defense-protection"],
    tags: ["human"],
  }),

  racialPassive({
    id: "race-fey-ancestry-elf",
    name: "Fey Ancestry",
    raceAvailability: [
      { race: "Elf" },
      { race: "Drow" },
      { race: "Half-Elf" },
    ],
    description:
      "Gain Advantage against being Charmed and immunity to magical Sleep.",
    roles: ["defense-protection"],
    tags: ["fey-ancestry"],
  }),

  racialPassive({
    id: "race-darkvision",
    name: "Darkvision",
    raceAvailability: [
      { race: "Elf" },
      { race: "Half-Elf" },
      { race: "Half-Orc" },
      { race: "Dwarf", subrace: "Gold Dwarf" },
      { race: "Dwarf", subrace: "Shield Dwarf" },
      { race: "Gnome", subrace: "Forest Gnome" },
      { race: "Gnome", subrace: "Rock Gnome" },
      { race: "Tiefling" },
    ],
    description: "Can see in the dark up to 12m.",
    roles: ["investigation-world-interaction"],
    tags: ["darkvision"],
  }),

  racialPassive({
    id: "race-superior-darkvision",
    name: "Superior Darkvision",
    raceAvailability: [
      { race: "Drow" },
      { race: "Dwarf", subrace: "Duergar" },
      { race: "Gnome", subrace: "Deep Gnome" },
    ],
    description: "Can see in the dark up to 24m.",
    roles: ["investigation-world-interaction"],
    tags: ["superior-darkvision"],
  }),

  racialPassive({
    id: "race-wood-elf-fleet-of-foot",
    name: "Fleet of Foot",
    raceAvailability: [
      { race: "Elf", subrace: "Wood Elf" },
      { race: "Half-Elf", subrace: "Wood Half-Elf" },
    ],
    description: "Base movement speed increases by 1.5m.",
    roles: ["mobility-positioning"],
    tags: ["wood-elf", "movement"],
  }),

  ...highElfCantrips,
  ...highHalfElfCantrips,

  racialSpell({
    id: "race-drow-dancing-lights",
    spellId: "dancing-lights",
    raceAvailability: [
      { race: "Drow", minLevel: 1 },
      { race: "Half-Elf", subrace: "Drow Half-Elf", minLevel: 1 },
    ],
    description: "Drow Magic racial spell.",
    resource: "long-rest",
    tags: ["drow-magic"],
  }),

  racialSpell({
    id: "race-drow-faerie-fire",
    spellId: "faerie-fire",
    raceAvailability: [
      { race: "Drow", minLevel: 3 },
      { race: "Half-Elf", subrace: "Drow Half-Elf", minLevel: 3 },
    ],
    description: "Drow Magic racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["drow-magic"],
  }),

  racialSpell({
    id: "race-drow-darkness",
    spellId: "darkness",
    raceAvailability: [
      { race: "Drow", minLevel: 5 },
      { race: "Half-Elf", subrace: "Drow Half-Elf", minLevel: 5 },
    ],
    description: "Drow Magic racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["drow-magic"],
  }),

  racialPassive({
    id: "race-half-orc-savage-attacks",
    name: "Savage Attacks",
    raceAvailability: [{ race: "Half-Orc" }],
    description:
      "When scoring a Critical Hit with a melee weapon attack, roll one additional damage die.",
    roles: ["single-target-damage"],
    damageTypes: ["Weapon"],
    range: touch,
    tags: ["half-orc", "critical-hit"],
  }),

  racialPassive({
    id: "race-half-orc-relentless-endurance",
    name: "Relentless Endurance",
    raceAvailability: [{ race: "Half-Orc" }],
    description:
      "When you would be downed, drop to 1 Hit Point instead. Recharges on Long Rest.",
    roles: ["defense-protection"],
    tags: ["half-orc", "long-rest"],
  }),

  racialPassive({
    id: "race-halfling-luck",
    name: "Halfling Luck",
    raceAvailability: [{ race: "Halfling" }],
    description:
      "When you roll a 1 on an Attack Roll, Ability Check, or Saving Throw, reroll it.",
    roles: ["support-buff", "defense-protection"],
    tags: ["halfling"],
  }),

  racialPassive({
    id: "race-halfling-brave",
    name: "Brave",
    raceAvailability: [{ race: "Halfling" }],
    description: "Gain Advantage on Saving Throws against being Frightened.",
    roles: ["defense-protection"],
    tags: ["halfling"],
  }),

  racialPassive({
    id: "race-lightfoot-naturally-stealthy",
    name: "Naturally Stealthy",
    raceAvailability: [{ race: "Halfling", subrace: "Lightfoot Halfling" }],
    description: "Gain Advantage on Stealth Checks.",
    roles: ["mobility-positioning", "support-buff"],
    tags: ["lightfoot-halfling", "stealth"],
  }),

  racialPassive({
    id: "race-strongheart-resilience",
    name: "Strongheart Resilience",
    raceAvailability: [{ race: "Halfling", subrace: "Strongheart Halfling" }],
    description:
      "Gain Advantage against being Poisoned and Resistance to Poison damage.",
    roles: ["defense-protection"],
    damageTypes: ["Poison"],
    tags: ["strongheart-halfling", "poison-resistance"],
  }),

  racialPassive({
    id: "race-dwarven-resilience",
    name: "Dwarven Resilience",
    raceAvailability: [
      { race: "Dwarf", subrace: "Gold Dwarf" },
      { race: "Dwarf", subrace: "Shield Dwarf" },
    ],
    description:
      "Gain Advantage against being Poisoned and Resistance to Poison damage.",
    roles: ["defense-protection"],
    damageTypes: ["Poison"],
    tags: ["dwarf", "poison-resistance"],
  }),

  racialPassive({
    id: "race-gold-dwarf-toughness",
    name: "Dwarven Toughness",
    raceAvailability: [{ race: "Dwarf", subrace: "Gold Dwarf" }],
    description: "Maximum Hit Points increase by 1 per level.",
    roles: ["defense-protection"],
    tags: ["gold-dwarf"],
  }),

  racialPassive({
    id: "race-shield-dwarf-armour-training",
    name: "Dwarven Armour Training",
    raceAvailability: [{ race: "Dwarf", subrace: "Shield Dwarf" }],
    description: "Gain Light Armour and Medium Armour proficiency.",
    roles: ["defense-protection"],
    tags: ["shield-dwarf", "armour-proficiency"],
  }),

  racialPassive({
    id: "race-duergar-resilience",
    name: "Duergar Resilience",
    raceAvailability: [{ race: "Dwarf", subrace: "Duergar" }],
    description:
      "Gain Advantage on Saving Throws against Illusions and against being Charmed or Paralysed.",
    roles: ["defense-protection"],
    tags: ["duergar"],
  }),

  racialSpell({
    id: "race-duergar-enlarge",
    spellId: "enlarge-reduce",
    raceAvailability: [{ race: "Dwarf", subrace: "Duergar", minLevel: 3 }],
    description: "Duergar Magic racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["duergar-magic"],
  }),

  racialSpell({
    id: "race-duergar-invisibility",
    spellId: "invisibility",
    raceAvailability: [{ race: "Dwarf", subrace: "Duergar", minLevel: 5 }],
    description: "Duergar Magic racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["duergar-magic"],
  }),

  racialPassive({
    id: "race-gnome-cunning",
    name: "Gnome Cunning",
    raceAvailability: [{ race: "Gnome" }],
    description:
      "Gain Advantage on Intelligence, Wisdom, and Charisma Saving Throws.",
    roles: ["defense-protection"],
    tags: ["gnome"],
  }),

  racialSpell({
    id: "race-forest-gnome-speak-with-animals",
    spellId: "speak-with-animals",
    raceAvailability: [{ race: "Gnome", subrace: "Forest Gnome" }],
    description: "Forest Gnome racial spell. Can be cast at will.",
    resource: "none",
    tags: ["forest-gnome", "at-will", "ritual"],
  }),

  racialPassive({
    id: "race-deep-gnome-stone-camouflage",
    name: "Stone Camouflage",
    raceAvailability: [{ race: "Gnome", subrace: "Deep Gnome" }],
    description: "Gain Advantage on Stealth Checks.",
    roles: ["mobility-positioning", "support-buff"],
    tags: ["deep-gnome", "stealth"],
  }),

  racialPassive({
    id: "race-rock-gnome-artificers-lore",
    name: "Artificer's Lore",
    raceAvailability: [{ race: "Gnome", subrace: "Rock Gnome" }],
    description: "Gain Expertise in History.",
    roles: ["investigation-world-interaction", "support-buff"],
    tags: ["rock-gnome", "history-expertise"],
  }),

  racialPassive({
    id: "race-tiefling-hellish-resistance",
    name: "Hellish Resistance",
    raceAvailability: [{ race: "Tiefling" }],
    description: "Gain Resistance to Fire damage.",
    roles: ["defense-protection"],
    damageTypes: ["Fire"],
    tags: ["tiefling", "fire-resistance"],
  }),

  racialSpell({
    id: "race-asmodeus-produce-flame",
    spellId: "produce-flame",
    raceAvailability: [{ race: "Tiefling", subrace: "Asmodeus Tiefling" }],
    description: "Asmodeus Tiefling Infernal Legacy cantrip.",
    resource: "cantrip",
    tags: ["tiefling", "asmodeus"],
  }),

  racialSpell({
    id: "race-asmodeus-hellish-rebuke",
    spellId: "hellish-rebuke",
    raceAvailability: [
      { race: "Tiefling", subrace: "Asmodeus Tiefling", minLevel: 3 },
    ],
    description: "Asmodeus Tiefling Infernal Legacy spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "asmodeus"],
  }),

  racialSpell({
    id: "race-asmodeus-darkness",
    spellId: "darkness",
    raceAvailability: [
      { race: "Tiefling", subrace: "Asmodeus Tiefling", minLevel: 5 },
    ],
    description: "Asmodeus Tiefling Infernal Legacy spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "asmodeus"],
  }),

  racialSpell({
    id: "race-mephistopheles-mage-hand",
    spellId: "mage-hand",
    raceAvailability: [
      { race: "Tiefling", subrace: "Mephistopheles Tiefling" },
    ],
    description: "Mephistopheles Tiefling Legacy of Cania cantrip.",
    resource: "cantrip",
    tags: ["tiefling", "mephistopheles"],
  }),

  racialSpell({
    id: "race-mephistopheles-burning-hands",
    spellId: "burning-hands",
    raceAvailability: [
      { race: "Tiefling", subrace: "Mephistopheles Tiefling", minLevel: 3 },
    ],
    description: "Mephistopheles Tiefling Legacy of Cania spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "mephistopheles"],
  }),

  racialSpell({
    id: "race-mephistopheles-flame-blade",
    spellId: "flame-blade",
    raceAvailability: [
      { race: "Tiefling", subrace: "Mephistopheles Tiefling", minLevel: 5 },
    ],
    description: "Mephistopheles Tiefling Legacy of Cania spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "mephistopheles"],
  }),

  racialSpell({
    id: "race-zariel-thaumaturgy",
    spellId: "thaumaturgy",
    raceAvailability: [{ race: "Tiefling", subrace: "Zariel Tiefling" }],
    description: "Zariel Tiefling Legacy of Avernus cantrip.",
    resource: "cantrip",
    tags: ["tiefling", "zariel"],
  }),

  racialSpell({
    id: "race-zariel-searing-smite",
    spellId: "searing-smite",
    raceAvailability: [
      { race: "Tiefling", subrace: "Zariel Tiefling", minLevel: 3 },
    ],
    description: "Zariel Tiefling Legacy of Avernus spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "zariel"],
  }),

  racialSpell({
    id: "race-zariel-branding-smite",
    spellId: "branding-smite",
    raceAvailability: [
      { race: "Tiefling", subrace: "Zariel Tiefling", minLevel: 5 },
    ],
    description: "Zariel Tiefling Legacy of Avernus spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["tiefling", "zariel"],
  }),

  racialPassive({
    id: "race-githyanki-astral-knowledge",
    name: "Astral Knowledge",
    raceAvailability: [{ race: "Githyanki" }],
    description:
      "Gain Proficiency in all Skills corresponding to one chosen Ability until Long Rest.",
    roles: ["support-buff", "investigation-world-interaction"],
    tags: ["githyanki"],
  }),

  racialSpell({
    id: "race-githyanki-mage-hand",
    spellId: "mage-hand",
    raceAvailability: [{ race: "Githyanki", minLevel: 1 }],
    description: "Githyanki Psionics racial cantrip.",
    resource: "cantrip",
    tags: ["githyanki-psionics"],
  }),

  racialSpell({
    id: "race-githyanki-enhance-leap",
    spellId: "enhance-leap",
    raceAvailability: [{ race: "Githyanki", minLevel: 3 }],
    description: "Githyanki Psionics racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["githyanki-psionics", "ritual"],
  }),

  racialSpell({
    id: "race-githyanki-misty-step",
    spellId: "misty-step",
    raceAvailability: [{ race: "Githyanki", minLevel: 5 }],
    description: "Githyanki Psionics racial spell. Recharges on Long Rest.",
    resource: "long-rest",
    tags: ["githyanki-psionics"],
  }),

  ...dragonbornBreath({
    subrace: "Black Dragonborn",
    idBase: "black",
    name: "Acid Breath",
    damageType: "Acid",
    shape: "line",
  }),

  ...dragonbornBreath({
    subrace: "Blue Dragonborn",
    idBase: "blue",
    name: "Lightning Breath",
    damageType: "Lightning",
    shape: "line",
  }),

  ...dragonbornBreath({
    subrace: "Brass Dragonborn",
    idBase: "brass",
    name: "Fire Breath (Line)",
    damageType: "Fire",
    shape: "line",
  }),

  ...dragonbornBreath({
    subrace: "Bronze Dragonborn",
    idBase: "bronze",
    name: "Lightning Breath",
    damageType: "Lightning",
    shape: "line",
  }),

  ...dragonbornBreath({
    subrace: "Copper Dragonborn",
    idBase: "copper",
    name: "Acid Breath",
    damageType: "Acid",
    shape: "line",
  }),

  ...dragonbornBreath({
    subrace: "Gold Dragonborn",
    idBase: "gold",
    name: "Fire Breath (Cone)",
    damageType: "Fire",
    shape: "cone",
  }),

  ...dragonbornBreath({
    subrace: "Green Dragonborn",
    idBase: "green",
    name: "Poison Breath",
    damageType: "Poison",
    shape: "cone",
  }),

  ...dragonbornBreath({
    subrace: "Red Dragonborn",
    idBase: "red",
    name: "Fire Breath (Cone)",
    damageType: "Fire",
    shape: "cone",
  }),

  ...dragonbornBreath({
    subrace: "Silver Dragonborn",
    idBase: "silver",
    name: "Frost Breath",
    damageType: "Cold",
    shape: "cone",
  }),

  ...dragonbornBreath({
    subrace: "White Dragonborn",
    idBase: "white",
    name: "Frost Breath",
    damageType: "Cold",
    shape: "cone",
  }),
];

export const raceFeatureAvailabilityById: Record<
  string,
  RaceFeatureAvailability[]
> = Object.fromEntries(
  bg3RaceFeatures.map((feature) => [feature.id, feature.raceAvailability])
);

export const raceFeatureIconFileById: Record<string, string> = {
  "race-human-versatility": "Passive_Race_HumanVersatility.png",
  "race-fey-ancestry-elf": "Passive_Race_FeyAncestry.png",
  "race-darkvision": "Passive_Race_Darkvision.png",
  "race-superior-darkvision": "Passive_Race_SuperiorDarkvision.png",
  "race-wood-elf-fleet-of-foot": "Passive_Race_FleetOfFoot.png",

  "race-drow-dancing-lights": "Spell_dancing-lights.png",
  "race-drow-faerie-fire": "Spell_faerie-fire.png",
  "race-drow-darkness": "Spell_darkness.png",

  "race-half-orc-savage-attacks": "Passive_Race_HalfOrc_SavageAttacks.png",
  "race-half-orc-relentless-endurance":
    "Passive_Race_HalfOrc_RelentlessEndurance.png",

  "race-halfling-luck": "Passive_Race_HalflingLuck.png",
  "race-halfling-brave": "Passive_Race_Brave.png",
  "race-lightfoot-naturally-stealthy":
    "Passive_Race_Lightfoot_NaturallyStealthy.png",
  "race-strongheart-resilience":
    "Passive_Race_StrongheartResilience.png",

  "race-dwarven-resilience": "Passive_Race_DwarvenResilience.png",
  "race-gold-dwarf-toughness": "Passive_Race_DwarvenToughness.png",
  "race-shield-dwarf-armour-training":
    "Passive_Race_DwarvenArmourTraining.png",
  "race-duergar-resilience": "Passive_Race_DuergarResilience.png",
  "race-duergar-enlarge": "Spell_enlarge-reduce.png",
  "race-duergar-invisibility": "Spell_invisibility.png",

  "race-gnome-cunning": "Passive_Race_GnomeCunning.png",
  "race-forest-gnome-speak-with-animals":
    "Spell_speak-with-animals.png",
  "race-deep-gnome-stone-camouflage":
    "Passive_Race_StoneCamouflage.png",
  "race-rock-gnome-artificers-lore":
    "Passive_Race_ArtificersLore.png",

  "race-tiefling-hellish-resistance":
    "Passive_Race_HellishResistance.png",
  "race-asmodeus-produce-flame": "Spell_produce-flame.png",
  "race-asmodeus-hellish-rebuke": "Spell_hellish-rebuke.png",
  "race-asmodeus-darkness": "Spell_darkness.png",
  "race-mephistopheles-mage-hand": "Spell_mage-hand.png",
  "race-mephistopheles-burning-hands": "Spell_burning-hands.png",
  "race-mephistopheles-flame-blade": "Spell_flame-blade.png",
  "race-zariel-thaumaturgy": "Spell_thaumaturgy.png",
  "race-zariel-searing-smite": "Spell_searing-smite.png",
  "race-zariel-branding-smite": "Spell_branding-smite.png",

  "race-githyanki-astral-knowledge":
    "Passive_Race_Githyanki_AstralKnowledge.png",
  "race-githyanki-mage-hand": "Spell_mage-hand.png",
  "race-githyanki-enhance-leap": "Spell_enhance-leap.png",
  "race-githyanki-misty-step": "Spell_misty-step.png",

  "race-dragonborn-black-ancestry":
    "Passive_Race_Dragonborn_BlackAncestry.png",
  "race-dragonborn-black-breath":
    "Action_Race_Dragonborn_AcidBreath_Line.png",
  "race-dragonborn-blue-ancestry":
    "Passive_Race_Dragonborn_BlueAncestry.png",
  "race-dragonborn-blue-breath":
    "Action_Race_Dragonborn_LightningBreath_Line.png",
  "race-dragonborn-brass-ancestry":
    "Passive_Race_Dragonborn_BrassAncestry.png",
  "race-dragonborn-brass-breath":
    "Action_Race_Dragonborn_FireBreath_Line.png",
  "race-dragonborn-bronze-ancestry":
    "Passive_Race_Dragonborn_BronzeAncestry.png",
  "race-dragonborn-bronze-breath":
    "Action_Race_Dragonborn_LightningBreath_Line.png",
  "race-dragonborn-copper-ancestry":
    "Passive_Race_Dragonborn_CopperAncestry.png",
  "race-dragonborn-copper-breath":
    "Action_Race_Dragonborn_AcidBreath_Line.png",
  "race-dragonborn-gold-ancestry":
    "Passive_Race_Dragonborn_GoldAncestry.png",
  "race-dragonborn-gold-breath":
    "Action_Race_Dragonborn_FireBreath_Cone.png",
  "race-dragonborn-green-ancestry":
    "Passive_Race_Dragonborn_GreenAncestry.png",
  "race-dragonborn-green-breath":
    "Action_Race_Dragonborn_PoisonBreath_Cone.png",
  "race-dragonborn-red-ancestry":
    "Passive_Race_Dragonborn_RedAncestry.png",
  "race-dragonborn-red-breath":
    "Action_Race_Dragonborn_FireBreath_Cone.png",
  "race-dragonborn-silver-ancestry":
    "Passive_Race_Dragonborn_SilverAncestry.png",
  "race-dragonborn-silver-breath":
    "Action_Race_Dragonborn_FrostBreath_Cone.png",
  "race-dragonborn-white-ancestry":
    "Passive_Race_Dragonborn_WhiteAncestry.png",
  "race-dragonborn-white-breath":
    "Action_Race_Dragonborn_FrostBreath_Cone.png",

  ...Object.fromEntries(
    highElfCantrips.map((feature) => [
      feature.id,
      `Spell_${feature.id.replace("race-high-elf-cantrip-", "")}.png`,
    ])
  ),

  ...Object.fromEntries(
    highHalfElfCantrips.map((feature) => [
      feature.id,
      `Spell_${feature.id.replace("race-high-half-elf-cantrip-", "")}.png`,
    ])
  ),
};

export function getAvailableRaceFeaturesForBuild(
  race: RaceName | "",
  subrace: string,
  level: number
): BG3ClassFeature[] {
  if (!race) return [];

  return bg3RaceFeatures.filter((feature) =>
    feature.raceAvailability.some((availability) => {
      const raceMatches = availability.race === race;
      const subraceMatches =
        availability.subrace === undefined || availability.subrace === subrace;
      const minLevelMatches =
        availability.minLevel === undefined || level >= availability.minLevel;
      const maxLevelMatches =
        availability.maxLevel === undefined || level <= availability.maxLevel;

      return raceMatches && subraceMatches && minLevelMatches && maxLevelMatches;
    })
  );
}