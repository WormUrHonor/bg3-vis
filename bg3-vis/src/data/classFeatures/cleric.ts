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
  weaponRange,
} from "./classFeatureHelpers";

const CLERIC = "Cleric" as const;

const DEATH = "Death Domain";
const KNOWLEDGE = "Knowledge Domain";
const LIFE = "Life Domain";
const LIGHT = "Light Domain";
const NATURE = "Nature Domain";
const TEMPEST = "Tempest Domain";
const TRICKERY = "Trickery Domain";
const WAR = "War Domain";

type FeatureRange = BG3Spell["range"];

const deathReaperCantripChoice = {
  id: "cleric-death-reaper-cantrip",
  label: "Reaper Cantrip",
  max: 1,
};

const natureAcolyteCantripChoice = {
  id: "cleric-nature-acolyte-cantrip",
  label: "Acolyte of Nature Cantrip",
  max: 1,
};

const coreGroup = {
  id: "cleric-core",
  label: "Core Cleric Features",
  order: 10,
};

const channelDivinityGroup = {
  id: "cleric-channel-divinity",
  label: "Channel Divinity",
  order: 12,
};

const divineInterventionGroup = {
  id: "cleric-divine-intervention",
  label: "Divine Intervention",
  order: 14,
};

const deathGroup = {
  id: "cleric-death",
  label: "Death Domain Features",
  order: 20,
};

const deathCantripGroup = {
  id: "cleric-death-reaper-cantrips",
  label: "Reaper Cantrip Choice",
  order: 22,
};

const knowledgeGroup = {
  id: "cleric-knowledge",
  label: "Knowledge Domain Features",
  order: 30,
};

const lifeGroup = {
  id: "cleric-life",
  label: "Life Domain Features",
  order: 40,
};

const lightGroup = {
  id: "cleric-light",
  label: "Light Domain Features",
  order: 50,
};

const natureGroup = {
  id: "cleric-nature",
  label: "Nature Domain Features",
  order: 60,
};

const natureCantripGroup = {
  id: "cleric-nature-cantrips",
  label: "Acolyte of Nature Cantrip Choice",
  order: 62,
};

const natureElementalFuryGroup = {
  id: "cleric-nature-elemental-fury",
  label: "Elemental Fury Variants",
  order: 64,
};

const tempestGroup = {
  id: "cleric-tempest",
  label: "Tempest Domain Features",
  order: 70,
};

const trickeryGroup = {
  id: "cleric-trickery",
  label: "Trickery Domain Features",
  order: 80,
};

const warGroup = {
  id: "cleric-war",
  label: "War Domain Features",
  order: 90,
};

const domainSpellGroup = {
  id: "cleric-domain-spells",
  label: "Always Prepared Domain Spells",
  order: 900,
};

const range9m = {
  label: "9m",
  meters: 9,
  category: "mid",
  shape: "single-target",
} as const;

const self9mRadius = {
  label: "self, 9m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 9,
} as const;

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

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
    range: range18m as FeatureRange,
    tags: [`uses-spell-icon:${spellId}`],
  };
}

function makeSpellLinkedFeature(args: {
  id: string;
  spellId: string;
  minLevel: number;
  subclass: string;
  displayGroup?: { id: string; label: string; order: number };
  description: string;
  choiceGroup?: { id: string; label: string; max: number };
  actionsOverride?: ActionCost[];
  resourcesOverride?: ResourceCost[];
  tags?: string[];
}) {
  const meta = safeSpellMeta(args.spellId);

  return feature(
    args.id,
    meta.name,
    "subclass-feature",
    [availableTo(CLERIC, args.minLevel, args.subclass)],
    args.choiceGroup ? false : true,
    args.description,
    meta.roles,
    meta.damageTypes,
    args.actionsOverride ?? meta.actions,
    args.resourcesOverride ?? meta.resources,
    meta.range,
    [
      "cleric",
      "spell-linked-feature",
      "domain-spell",
      ...meta.tags,
      ...(args.tags ?? []),
    ],
    {
      displayGroup: args.displayGroup ?? domainSpellGroup,
      choiceGroup: args.choiceGroup,
    }
  );
}

type DomainSpellDefinition = {
  subclass: string;
  minLevel: number;
  spellIds: string[];
};

const domainSpellDefinitions: DomainSpellDefinition[] = [
  { subclass: DEATH, minLevel: 1, spellIds: ["false-life", "ray-of-sickness"] },
  { subclass: DEATH, minLevel: 3, spellIds: ["blindness", "ray-of-enfeeblement"] },
  { subclass: DEATH, minLevel: 5, spellIds: ["animate-dead", "vampiric-touch"] },
  { subclass: DEATH, minLevel: 7, spellIds: ["blight", "death-ward"] },
  { subclass: DEATH, minLevel: 9, spellIds: ["cloudkill", "contagion"] },

  { subclass: KNOWLEDGE, minLevel: 1, spellIds: ["command", "sleep"] },
  { subclass: KNOWLEDGE, minLevel: 3, spellIds: ["calm-emotions", "hold-person"] },
  { subclass: KNOWLEDGE, minLevel: 5, spellIds: ["slow", "speak-with-dead"] },
  {
    subclass: KNOWLEDGE,
    minLevel: 7,
    spellIds: ["confusion", "otilukes-resilient-sphere"],
  },
  { subclass: KNOWLEDGE, minLevel: 9, spellIds: ["dominate-person", "telekinesis"] },

  { subclass: LIFE, minLevel: 1, spellIds: ["bless", "cure-wounds"] },
  { subclass: LIFE, minLevel: 3, spellIds: ["aid", "lesser-restoration"] },
  { subclass: LIFE, minLevel: 5, spellIds: ["revivify", "beacon-of-hope"] },
  { subclass: LIFE, minLevel: 7, spellIds: ["guardian-of-faith", "death-ward"] },
  {
    subclass: LIFE,
    minLevel: 9,
    spellIds: ["greater-restoration", "mass-cure-wounds"],
  },

  { subclass: LIGHT, minLevel: 1, spellIds: ["light", "burning-hands", "faerie-fire"] },
  { subclass: LIGHT, minLevel: 3, spellIds: ["flaming-sphere", "scorching-ray"] },
  { subclass: LIGHT, minLevel: 5, spellIds: ["daylight", "fireball"] },
  { subclass: LIGHT, minLevel: 7, spellIds: ["guardian-of-faith", "wall-of-fire"] },
  { subclass: LIGHT, minLevel: 9, spellIds: ["destructive-wave", "flame-strike"] },

  {
    subclass: NATURE,
    minLevel: 1,
    spellIds: ["speak-with-animals", "animal-friendship"],
  },
  { subclass: NATURE, minLevel: 3, spellIds: ["barkskin", "spike-growth"] },
  { subclass: NATURE, minLevel: 5, spellIds: ["plant-growth", "sleet-storm"] },
  { subclass: NATURE, minLevel: 7, spellIds: ["dominate-beast", "grasping-vine"] },
  { subclass: NATURE, minLevel: 9, spellIds: ["insect-plague", "wall-of-stone"] },

  { subclass: TEMPEST, minLevel: 1, spellIds: ["thunderwave", "fog-cloud"] },
  { subclass: TEMPEST, minLevel: 3, spellIds: ["gust-of-wind", "shatter"] },
  { subclass: TEMPEST, minLevel: 5, spellIds: ["call-lightning", "sleet-storm"] },
  { subclass: TEMPEST, minLevel: 7, spellIds: ["freedom-of-movement", "ice-storm"] },
  { subclass: TEMPEST, minLevel: 9, spellIds: ["destructive-wave", "insect-plague"] },

  { subclass: TRICKERY, minLevel: 1, spellIds: ["charm-person", "disguise-self"] },
  { subclass: TRICKERY, minLevel: 3, spellIds: ["mirror-image", "pass-without-trace"] },
  { subclass: TRICKERY, minLevel: 5, spellIds: ["bestow-curse", "fear"] },
  { subclass: TRICKERY, minLevel: 7, spellIds: ["dimension-door", "polymorph"] },
  { subclass: TRICKERY, minLevel: 9, spellIds: ["dominate-person", "seeming"] },

  { subclass: WAR, minLevel: 1, spellIds: ["divine-favour", "shield-of-faith"] },
  { subclass: WAR, minLevel: 3, spellIds: ["magic-weapon", "spiritual-weapon"] },
  { subclass: WAR, minLevel: 5, spellIds: ["spirit-guardians", "crusaders-mantle"] },
  { subclass: WAR, minLevel: 7, spellIds: ["freedom-of-movement", "stoneskin"] },
  { subclass: WAR, minLevel: 9, spellIds: ["flame-strike", "hold-monster"] },
];

function makeDomainSpellFeatures() {
  return domainSpellDefinitions.flatMap((entry) =>
    entry.spellIds.map((spellId) =>
      makeSpellLinkedFeature({
        id: `cleric-${slug(entry.subclass)}-domain-spell-${spellId}`,
        spellId,
        minLevel: entry.minLevel,
        subclass: entry.subclass,
        description:
          "Always prepared Cleric domain spell. It does not count against prepared Cleric spells.",
        tags: ["always-prepared", slug(entry.subclass)],
      })
    )
  );
}

const deathReaperCantripIds = ["bone-chill", "bursting-sinew", "toll-the-dead"];

const deathReaperCantripFeatures = deathReaperCantripIds.map((spellId) =>
  makeSpellLinkedFeature({
    id: `cleric-death-reaper-cantrip-${spellId}`,
    spellId,
    minLevel: 1,
    subclass: DEATH,
    displayGroup: deathCantripGroup,
    description:
      "Death Domain Reaper cantrip choice. Reaper lets single-target Necromancy cantrips target one additional creature.",
    choiceGroup: deathReaperCantripChoice,
    resourcesOverride: ["cantrip"],
    tags: ["reaper-cantrip"],
  })
);

const natureAcolyteCantripIds = [
  "poison-spray",
  "produce-flame",
  "shillelagh",
  "thorn-whip",
];

const natureAcolyteCantripFeatures = natureAcolyteCantripIds.map((spellId) =>
  makeSpellLinkedFeature({
    id: `cleric-nature-acolyte-cantrip-${spellId}`,
    spellId,
    minLevel: 1,
    subclass: NATURE,
    displayGroup: natureCantripGroup,
    description:
      "Nature Domain Acolyte of Nature cantrip choice. This grants one Druid cantrip.",
    choiceGroup: natureAcolyteCantripChoice,
    resourcesOverride: ["cantrip"],
    tags: ["acolyte-of-nature-cantrip"],
  })
);

type ChannelDivinityChargeDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  maxLevel?: number;
  charges: number;
};

const channelDivinityChargeDefinitions: ChannelDivinityChargeDefinition[] = [
  {
    idBase: "1",
    name: "Channel Divinity Charges: 1",
    minLevel: 2,
    maxLevel: 5,
    charges: 1,
  },
  {
    idBase: "2",
    name: "Channel Divinity Charges: 2",
    minLevel: 6,
    charges: 2,
  },
];

function makeChannelDivinityChargeFeature(entry: ChannelDivinityChargeDefinition) {
  return feature(
    `cleric-channel-divinity-charges-${entry.idBase}`,
    entry.name,
    "resource-feature",
    [availableTo(CLERIC, entry.minLevel, undefined, entry.maxLevel)],
    true,
    `You have ${entry.charges} Channel Divinity Charge${
      entry.charges > 1 ? "s" : ""
    }. Channel Divinity Charges replenish on Short or Long Rest.`,
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "short-rest"],
    self,
    ["cleric", "channel-divinity", "resource"],
    {
      displayGroup: channelDivinityGroup,
    }
  );
}

type WarPriestChargeDefinition = {
  minLevel: number;
  maxLevel?: number;
  charges: number;
};

const warPriestChargeDefinitions: WarPriestChargeDefinition[] = [
  { minLevel: 1, maxLevel: 4, charges: 3 },
  { minLevel: 5, maxLevel: 7, charges: 4 },
  { minLevel: 8, maxLevel: 10, charges: 5 },
  { minLevel: 11, charges: 6 },
];

function makeWarPriestChargeFeature(entry: WarPriestChargeDefinition) {
  return feature(
    `cleric-war-priest-charges-${entry.charges}`,
    `War Priest Charges: ${entry.charges}`,
    "resource-feature",
    [availableTo(CLERIC, entry.minLevel, WAR, entry.maxLevel)],
    true,
    `You have ${entry.charges} War Priest Charges. They replenish on Long Rest and allow bonus-action weapon or unarmed attacks after attacking.`,
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["cleric", "war-domain", "war-priest", "resource"],
    {
      displayGroup: warGroup,
    }
  );
}

type Level8StrikeDefinition = {
  idBase: string;
  name: string;
  subclass: string;
  description: string;
  damageTypes: DamageType[];
  displayGroup: { id: string; label: string; order: number };
  tags: string[];
};

const divineStrikeDefinitions: Level8StrikeDefinition[] = [
  {
    idBase: "death-necrotic",
    name: "Divine Strike: Necrotic",
    subclass: DEATH,
    description:
      "Once per turn, deal additional Necrotic damage together with a weapon attack.",
    damageTypes: ["Weapon", "Necrotic"],
    displayGroup: deathGroup,
    tags: ["death-domain", "divine-strike"],
  },
  {
    idBase: "life-radiant",
    name: "Divine Strike: Radiant",
    subclass: LIFE,
    description:
      "Once per turn, deal additional Radiant damage together with a weapon attack.",
    damageTypes: ["Weapon", "Radiant"],
    displayGroup: lifeGroup,
    tags: ["life-domain", "divine-strike"],
  },
  {
    idBase: "tempest-thunder",
    name: "Divine Strike: Thunder",
    subclass: TEMPEST,
    description:
      "Once per turn, deal additional Thunder damage together with a weapon attack.",
    damageTypes: ["Weapon", "Thunder"],
    displayGroup: tempestGroup,
    tags: ["tempest-domain", "divine-strike"],
  },
  {
    idBase: "trickery-poison",
    name: "Divine Strike: Poison",
    subclass: TRICKERY,
    description:
      "Once per turn, deal additional Poison damage together with a weapon attack.",
    damageTypes: ["Weapon", "Poison"],
    displayGroup: trickeryGroup,
    tags: ["trickery-domain", "divine-strike"],
  },
  {
    idBase: "war-weapon",
    name: "Divine Strike: Weapon",
    subclass: WAR,
    description:
      "Once per turn, deal additional weapon damage together with a weapon attack.",
    damageTypes: ["Weapon"],
    displayGroup: warGroup,
    tags: ["war-domain", "divine-strike"],
  },
];

const elementalFuryDefinitions: Level8StrikeDefinition[] = [
  {
    idBase: "nature-cold",
    name: "Elemental Fury: Cold",
    subclass: NATURE,
    description:
      "Once per turn, deal additional Cold damage together with a weapon attack.",
    damageTypes: ["Weapon", "Cold"],
    displayGroup: natureElementalFuryGroup,
    tags: ["nature-domain", "elemental-fury", "elemental-fury-cold"],
  },
  {
    idBase: "nature-fire",
    name: "Elemental Fury: Fire",
    subclass: NATURE,
    description:
      "Once per turn, deal additional Fire damage together with a weapon attack.",
    damageTypes: ["Weapon", "Fire"],
    displayGroup: natureElementalFuryGroup,
    tags: ["nature-domain", "elemental-fury", "elemental-fury-fire"],
  },
  {
    idBase: "nature-lightning",
    name: "Elemental Fury: Lightning",
    subclass: NATURE,
    description:
      "Once per turn, deal additional Lightning damage together with a weapon attack.",
    damageTypes: ["Weapon", "Lightning"],
    displayGroup: natureElementalFuryGroup,
    tags: ["nature-domain", "elemental-fury", "elemental-fury-lightning"],
  },
];

function makeWeaponDamageVariantFeatures(entry: Level8StrikeDefinition) {
  return [
    feature(
      `cleric-${entry.idBase}-melee`,
      `${entry.name} (Melee)`,
      "action",
      [availableTo(CLERIC, 8, entry.subclass)],
      true,
      `${entry.description} This visualizes the melee variant.`,
      ["single-target-damage"],
      entry.damageTypes,
      ["action"],
      ["none"],
      melee,
      ["cleric", "level-8-weapon-damage", "melee", ...entry.tags],
      {
        displayGroup: entry.displayGroup,
      }
    ),
    feature(
      `cleric-${entry.idBase}-ranged`,
      `${entry.name} (Ranged)`,
      "action",
      [availableTo(CLERIC, 8, entry.subclass)],
      true,
      `${entry.description} This visualizes the ranged variant.`,
      ["single-target-damage"],
      entry.damageTypes,
      ["action"],
      ["none"],
      weaponRange,
      ["cleric", "level-8-weapon-damage", "ranged", ...entry.tags],
      {
        displayGroup: entry.displayGroup,
      }
    ),
  ];
}

const clericFeatures = [
  feature(
    "cleric-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(CLERIC, 1)],
    true,
    "Clerics are Wisdom-based prepared spellcasters. Prepared spell count is Cleric level + Wisdom modifier. Cantrip and prepared-spell limits are handled by spell choice rules.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["cleric", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "cleric-turn-undead",
    "Turn Undead",
    "action",
    [availableTo(CLERIC, 2)],
    true,
    "Present your holy symbol and cause undead creatures to flee. Uses a Channel Divinity Charge.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    self9mRadius,
    ["cleric", "channel-divinity"],
    {
      displayGroup: channelDivinityGroup,
    }
  ),

  ...channelDivinityChargeDefinitions.map(makeChannelDivinityChargeFeature),

  feature(
    "cleric-destroy-undead",
    "Destroy Undead",
    "passive",
    [availableTo(CLERIC, 5)],
    true,
    "When you successfully Turn an Undead creature, it also takes Radiant damage.",
    ["area-damage", "control"],
    ["Radiant"],
    ["passive"],
    ["none"],
    self9mRadius,
    ["cleric", "channel-divinity", "turn-undead"],
    {
      displayGroup: channelDivinityGroup,
      requires: ["cleric-turn-undead"],
    }
  ),

  feature(
    "cleric-divine-intervention",
    "Divine Intervention",
    "resource-feature",
    [availableTo(CLERIC, 10)],
    true,
    "Call upon your deity in your moment of greatest need. Once used, Divine Intervention can never be used again by that character.",
    ["support-buff"],
    ["Variable"],
    ["action"],
    ["long-rest"],
    self,
    ["cleric", "divine-intervention"],
    {
      displayGroup: divineInterventionGroup,
    }
  ),

  feature(
    "cleric-divine-intervention-sunder-the-heretical",
    "Divine Intervention: Sunder the Heretical",
    "action",
    [availableTo(CLERIC, 10)],
    true,
    "Call upon your deity to bring forth a radiant cataclysm upon all nearby enemies.",
    ["area-damage"],
    ["Radiant"],
    ["action"],
    ["long-rest"],
    self9mRadius,
    ["cleric", "divine-intervention"],
    {
      displayGroup: divineInterventionGroup,
      requires: ["cleric-divine-intervention"],
    }
  ),

  feature(
    "cleric-divine-intervention-arm-thy-servant",
    "Divine Intervention: Arm Thy Servant",
    "action",
    [availableTo(CLERIC, 10)],
    true,
    "Call upon your deity to grant a legendary weapon forged in the fires of your holy bond.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["long-rest"],
    self,
    ["cleric", "divine-intervention"],
    {
      displayGroup: divineInterventionGroup,
      requires: ["cleric-divine-intervention"],
    }
  ),

  feature(
    "cleric-divine-intervention-opulent-revival",
    "Divine Intervention: Opulent Revival",
    "action",
    [availableTo(CLERIC, 10)],
    true,
    "Resurrect fallen companions with half their hit points and restore nearby allies as if they had Long Rested.",
    ["healing", "support-buff"],
    [],
    ["action"],
    ["long-rest"],
    self9mRadius,
    ["cleric", "divine-intervention"],
    {
      displayGroup: divineInterventionGroup,
      requires: ["cleric-divine-intervention"],
    }
  ),

  feature(
    "cleric-divine-intervention-golden-generosity",
    "Divine Intervention: Golden Generosity",
    "action",
    [availableTo(CLERIC, 10)],
    true,
    "Call upon your deity to provide potions and Camp Supplies.",
    ["support-buff", "healing", "narrative-interaction"],
    [],
    ["action"],
    ["long-rest"],
    self,
    ["cleric", "divine-intervention"],
    {
      displayGroup: divineInterventionGroup,
      requires: ["cleric-divine-intervention"],
    }
  ),

  feature(
    "cleric-death-reaper",
    "Reaper",
    "passive",
    [availableTo(CLERIC, 1, DEATH)],
    true,
    "Necromancy cantrips that only target one creature can target an additional creature.",
    ["single-target-damage", "support-buff"],
    ["Necrotic"],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "death-domain", "reaper"],
    {
      displayGroup: deathGroup,
    }
  ),

  ...deathReaperCantripFeatures,

  feature(
    "cleric-death-touch-of-death",
    "Touch of Death",
    "subclass-feature",
    [availableTo(CLERIC, 2, DEATH)],
    true,
    "When hitting a creature with a melee attack, spend a Channel Divinity Charge to deal extra Necrotic damage.",
    ["single-target-damage"],
    ["Necrotic", "Weapon"],
    ["conditional"],
    ["class-resource"],
    melee,
    ["cleric", "death-domain", "channel-divinity"],
    {
      displayGroup: deathGroup,
    }
  ),

  feature(
    "cleric-death-inescapable-destruction",
    "Inescapable Destruction",
    "passive",
    [availableTo(CLERIC, 6, DEATH)],
    true,
    "Damage you deal ignores Resistance to Necrotic damage.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Necrotic"],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "death-domain"],
    {
      displayGroup: deathGroup,
    }
  ),

  feature(
    "cleric-knowledge-blessings-of-knowledge",
    "Blessings of Knowledge",
    "passive",
    [availableTo(CLERIC, 1, KNOWLEDGE)],
    true,
    "Gain Expertise in two of Arcana, History, Nature, or Religion.",
    ["investigation-world-interaction", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["cleric", "knowledge-domain"],
    {
      displayGroup: knowledgeGroup,
    }
  ),

  feature(
    "cleric-knowledge-knowledge-of-the-ages",
    "Knowledge of the Ages",
    "action",
    [availableTo(CLERIC, 2, KNOWLEDGE)],
    true,
    "Spend a Channel Divinity Charge to gain Proficiency in all Skills of a chosen Ability.",
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    ["class-resource"],
    self,
    ["cleric", "knowledge-domain", "channel-divinity"],
    {
      displayGroup: knowledgeGroup,
    }
  ),

  feature(
    "cleric-knowledge-read-thoughts",
    "Read Thoughts",
    "action",
    [availableTo(CLERIC, 6, KNOWLEDGE)],
    true,
    "Spend a Channel Divinity Charge to read the thoughts of certain creatures while talking to them.",
    ["narrative-interaction", "investigation-world-interaction"],
    [],
    ["action"],
    ["class-resource"],
    range9m,
    ["cleric", "knowledge-domain", "channel-divinity"],
    {
      displayGroup: knowledgeGroup,
    }
  ),

  feature(
    "cleric-knowledge-speak-with-animals",
    "Speak with Animals",
    "action",
    [availableTo(CLERIC, 6, KNOWLEDGE)],
    true,
    "Spend a Channel Divinity Charge to comprehend and communicate with beasts.",
    ["narrative-interaction", "investigation-world-interaction"],
    [],
    ["action"],
    ["class-resource"],
    self,
    ["cleric", "knowledge-domain", "uses-spell-icon:speak-with-animals"],
    {
      displayGroup: knowledgeGroup,
    }
  ),

  feature(
    "cleric-knowledge-potent-spellcasting",
    "Potent Spellcasting",
    "passive",
    [availableTo(CLERIC, 8, KNOWLEDGE)],
    true,
    "Add your Wisdom Modifier to the damage you deal with Cleric cantrips.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "knowledge-domain"],
    {
      displayGroup: knowledgeGroup,
    }
  ),

  feature(
    "cleric-life-disciple-of-life",
    "Disciple of Life",
    "passive",
    [availableTo(CLERIC, 1, LIFE)],
    true,
    "Healing spells restore additional hit points equal to 2 + the spell's level.",
    ["healing", "support-buff"],
    [],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "life-domain"],
    {
      displayGroup: lifeGroup,
    }
  ),

  feature(
    "cleric-life-preserve-life",
    "Preserve Life",
    "action",
    [availableTo(CLERIC, 2, LIFE)],
    true,
    "Spend a Channel Divinity Charge to restore hit points to allied creatures.",
    ["healing"],
    [],
    ["action"],
    ["class-resource"],
    self9mRadius,
    ["cleric", "life-domain", "channel-divinity"],
    {
      displayGroup: lifeGroup,
    }
  ),

  feature(
    "cleric-life-blessed-healer",
    "Blessed Healer",
    "passive",
    [availableTo(CLERIC, 6, LIFE)],
    true,
    "When you cast a healing spell of Level 1 or higher on another creature, you regain hit points.",
    ["healing", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["cleric", "life-domain"],
    {
      displayGroup: lifeGroup,
    }
  ),

  feature(
    "cleric-light-warding-flare",
    "Warding Flare",
    "reaction",
    [availableTo(CLERIC, 1, LIGHT)],
    true,
    "Use your reaction to impose Disadvantage on an attacker, possibly causing their attack to miss.",
    ["defense-protection", "control"],
    [],
    ["reaction"],
    ["none"],
    range18m,
    ["cleric", "light-domain"],
    {
      displayGroup: lightGroup,
    }
  ),

  feature(
    "cleric-light-radiance-of-the-dawn",
    "Radiance of the Dawn",
    "action",
    [availableTo(CLERIC, 2, LIGHT)],
    true,
    "Spend a Channel Divinity Charge to dispel magical darkness and deal Radiant damage to enemies.",
    ["area-damage", "control"],
    ["Radiant"],
    ["action"],
    ["class-resource"],
    self9mRadius,
    ["cleric", "light-domain", "channel-divinity"],
    {
      displayGroup: lightGroup,
    }
  ),

  feature(
    "cleric-light-improved-warding-flare",
    "Improved Warding Flare",
    "reaction",
    [availableTo(CLERIC, 6, LIGHT)],
    true,
    "When an enemy attacks an ally, impose Disadvantage on the Attack Roll.",
    ["defense-protection", "support-buff", "control"],
    [],
    ["reaction"],
    ["none"],
    range18m,
    ["cleric", "light-domain"],
    {
      displayGroup: lightGroup,
      requires: ["cleric-light-warding-flare"],
    }
  ),

  feature(
    "cleric-light-potent-spellcasting",
    "Potent Spellcasting",
    "passive",
    [availableTo(CLERIC, 8, LIGHT)],
    true,
    "Add your Wisdom Modifier to the damage you deal with Cleric cantrips.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "light-domain"],
    {
      displayGroup: lightGroup,
    }
  ),

  feature(
    "cleric-nature-acolyte-of-nature",
    "Acolyte of Nature",
    "passive",
    [availableTo(CLERIC, 1, NATURE)],
    true,
    "Learn one Druid cantrip and gain one Nature-related skill proficiency.",
    ["support-buff", "investigation-world-interaction"],
    [],
    ["passive"],
    ["none"],
    self,
    ["cleric", "nature-domain"],
    {
      displayGroup: natureGroup,
    }
  ),

  ...natureAcolyteCantripFeatures,

  feature(
    "cleric-nature-charm-animals-and-plants",
    "Charm Animals and Plants",
    "action",
    [availableTo(CLERIC, 2, NATURE)],
    true,
    "Spend a Channel Divinity Charge to Charm nearby beasts and plants.",
    ["control", "narrative-interaction"],
    [],
    ["action"],
    ["class-resource"],
    self9mRadius,
    ["cleric", "nature-domain", "channel-divinity"],
    {
      displayGroup: natureGroup,
    }
  ),

  feature(
    "cleric-nature-dampen-elements",
    "Dampen Elements",
    "reaction",
    [availableTo(CLERIC, 6, NATURE)],
    true,
    "When you or an ally is hit with Acid, Cold, Fire, Lightning, or Thunder damage, use your reaction to halve the attack's damage.",
    ["defense-protection", "support-buff"],
    ["Acid", "Cold", "Fire", "Lightning", "Thunder"],
    ["reaction"],
    ["none"],
    range18m,
    ["cleric", "nature-domain"],
    {
      displayGroup: natureGroup,
    }
  ),

  feature(
    "cleric-tempest-wrath-of-the-storm",
    "Wrath of the Storm",
    "reaction",
    [availableTo(CLERIC, 1, TEMPEST)],
    true,
    "When a nearby enemy attacks you, retaliate with Lightning or Thunder damage.",
    ["single-target-damage", "defense-protection"],
    ["Lightning", "Thunder"],
    ["reaction"],
    ["none"],
    range9m,
    ["cleric", "tempest-domain"],
    {
      displayGroup: tempestGroup,
    }
  ),

  feature(
    "cleric-tempest-wrath-of-the-storm-lightning",
    "Wrath of the Storm: Lightning",
    "reaction",
    [availableTo(CLERIC, 1, TEMPEST)],
    true,
    "Retaliate against a nearby attacker with Lightning damage.",
    ["single-target-damage", "defense-protection"],
    ["Lightning"],
    ["reaction"],
    ["none"],
    range9m,
    ["cleric", "tempest-domain"],
    {
      displayGroup: tempestGroup,
      requires: ["cleric-tempest-wrath-of-the-storm"],
    }
  ),

  feature(
    "cleric-tempest-wrath-of-the-storm-thunder",
    "Wrath of the Storm: Thunder",
    "reaction",
    [availableTo(CLERIC, 1, TEMPEST)],
    true,
    "Retaliate against a nearby attacker with Thunder damage.",
    ["single-target-damage", "defense-protection"],
    ["Thunder"],
    ["reaction"],
    ["none"],
    range9m,
    ["cleric", "tempest-domain"],
    {
      displayGroup: tempestGroup,
      requires: ["cleric-tempest-wrath-of-the-storm"],
    }
  ),

  feature(
    "cleric-tempest-destructive-wrath",
    "Destructive Wrath",
    "subclass-feature",
    [availableTo(CLERIC, 2, TEMPEST)],
    true,
    "When you roll Thunder or Lightning damage, spend Channel Divinity to deal maximum damage instead.",
    ["single-target-damage", "area-damage", "support-buff"],
    ["Lightning", "Thunder"],
    ["conditional"],
    ["class-resource"],
    range18m,
    ["cleric", "tempest-domain", "channel-divinity"],
    {
      displayGroup: tempestGroup,
    }
  ),

  feature(
    "cleric-tempest-thunderbolt-strike",
    "Thunderbolt Strike",
    "passive",
    [availableTo(CLERIC, 6, TEMPEST)],
    true,
    "When you deal Thunder or Lightning damage to a Large or smaller creature, you can push it up to 3m.",
    ["control", "single-target-damage"],
    ["Lightning", "Thunder"],
    ["passive"],
    ["none"],
    range18m,
    ["cleric", "tempest-domain"],
    {
      displayGroup: tempestGroup,
    }
  ),

  feature(
    "cleric-trickery-blessing-of-the-trickster",
    "Blessing of the Trickster",
    "action",
    [availableTo(CLERIC, 1, TRICKERY)],
    true,
    "Grant another creature Advantage on Stealth Checks.",
    ["support-buff", "mobility-positioning"],
    [],
    ["action"],
    ["none"],
    touch,
    ["cleric", "trickery-domain"],
    {
      displayGroup: trickeryGroup,
    }
  ),

  feature(
    "cleric-trickery-invoke-duplicity",
    "Invoke Duplicity",
    "action",
    [availableTo(CLERIC, 2, TRICKERY)],
    true,
    "Spend a Channel Divinity Charge to create an illusion that distracts enemies. Attack Rolls have Advantage within 3m of it.",
    ["support-buff", "control", "summon"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("18m, 3m aura", 18, "long", 3),
    ["cleric", "trickery-domain", "channel-divinity"],
    {
      displayGroup: trickeryGroup,
    }
  ),

  feature(
    "cleric-trickery-cloak-of-shadows",
    "Cloak of Shadows",
    "action",
    [availableTo(CLERIC, 6, TRICKERY)],
    true,
    "Spend a Channel Divinity Charge to wrap yourself in shadows and become Invisible if obscured.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["action"],
    ["class-resource"],
    self,
    ["cleric", "trickery-domain", "channel-divinity"],
    {
      displayGroup: trickeryGroup,
    }
  ),

  ...warPriestChargeDefinitions.map(makeWarPriestChargeFeature),

  feature(
    "cleric-war-war-priest",
    "War Priest",
    "passive",
    [availableTo(CLERIC, 1, WAR)],
    true,
    "When you make an unarmed or weapon attack, spend a War Priest Charge to make an additional attack as a Bonus Action.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["class-resource"],
    weaponRange,
    ["cleric", "war-domain", "war-priest"],
    {
      displayGroup: warGroup,
    }
  ),

  feature(
    "cleric-war-war-priest-bonus-attack",
    "War Priest: Bonus Attack",
    "bonus-action",
    [availableTo(CLERIC, 1, WAR)],
    true,
    "Spend a War Priest Charge to make an additional weapon or unarmed attack as a Bonus Action.",
    ["single-target-damage"],
    ["Weapon"],
    ["bonus-action"],
    ["class-resource"],
    weaponRange,
    ["cleric", "war-domain", "war-priest"],
    {
      displayGroup: warGroup,
      requires: ["cleric-war-war-priest"],
    }
  ),

  feature(
    "cleric-war-guided-strike",
    "Guided Strike",
    "subclass-feature",
    [availableTo(CLERIC, 2, WAR)],
    true,
    "Spend a Channel Divinity Charge to gain a +10 bonus to your Attack Roll.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["conditional"],
    ["class-resource"],
    weaponRange,
    ["cleric", "war-domain", "channel-divinity"],
    {
      displayGroup: warGroup,
    }
  ),

  feature(
    "cleric-war-war-gods-blessing",
    "War God's Blessing",
    "reaction",
    [availableTo(CLERIC, 6, WAR)],
    true,
    "Spend a Channel Divinity Charge to grant a nearby ally a +10 bonus to their Attack Roll.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["reaction"],
    ["class-resource"],
    range18m,
    ["cleric", "war-domain", "channel-divinity"],
    {
      displayGroup: warGroup,
    }
  ),

  ...makeDomainSpellFeatures(),

  ...divineStrikeDefinitions.flatMap(makeWeaponDamageVariantFeatures),
  ...elementalFuryDefinitions.flatMap(makeWeaponDamageVariantFeatures),
];

const domainSpellIconEntries = Object.fromEntries(
  domainSpellDefinitions.flatMap((entry) =>
    entry.spellIds.map((spellId) => [
      `cleric-${slug(entry.subclass)}-domain-spell-${spellId}`,
      `Spell_${spellId}.png`,
    ])
  )
);

const deathReaperCantripIconEntries = Object.fromEntries(
  deathReaperCantripIds.map((spellId) => [
    `cleric-death-reaper-cantrip-${spellId}`,
    `Spell_${spellId}.png`,
  ])
);

const natureAcolyteCantripIconEntries = Object.fromEntries(
  natureAcolyteCantripIds.map((spellId) => [
    `cleric-nature-acolyte-cantrip-${spellId}`,
    `Spell_${spellId}.png`,
  ])
);

const channelDivinityChargeIconEntries = Object.fromEntries(
  channelDivinityChargeDefinitions.map((entry) => [
    `cleric-channel-divinity-charges-${entry.idBase}`,
    "Passive_Cleric_ChannelDivinityCharges.png",
  ])
);

const warPriestChargeIconEntries = Object.fromEntries(
  warPriestChargeDefinitions.map((entry) => [
    `cleric-war-priest-charges-${entry.charges}`,
    "Passive_Cleric_War_WarPriestCharges.png",
  ])
);

const divineStrikeIconEntries = Object.fromEntries(
  divineStrikeDefinitions.flatMap((entry) => [
    [
      `cleric-${entry.idBase}-melee`,
      `Action_Cleric_DivineStrike_${entry.idBase}_melee.png`,
    ],
    [
      `cleric-${entry.idBase}-ranged`,
      `Action_Cleric_DivineStrike_${entry.idBase}_ranged.png`,
    ],
  ])
);

const elementalFuryIconEntries = Object.fromEntries(
  elementalFuryDefinitions.flatMap((entry) => [
    [
      `cleric-${entry.idBase}-melee`,
      `Action_Cleric_ElementalFury_${entry.idBase}_melee.png`,
    ],
    [
      `cleric-${entry.idBase}-ranged`,
      `Action_Cleric_ElementalFury_${entry.idBase}_ranged.png`,
    ],
  ])
);

export const clericClassModule: ClassFeatureModule = {
  className: "Cleric",
  defaultTabLabel: "Cleric Features",
  subclassTabLabels: {
    [DEATH]: "Death Domain Features",
    [KNOWLEDGE]: "Knowledge Domain Features",
    [LIFE]: "Life Domain Features",
    [LIGHT]: "Light Domain Features",
    [NATURE]: "Nature Domain Features",
    [TEMPEST]: "Tempest Domain Features",
    [TRICKERY]: "Trickery Domain Features",
    [WAR]: "War Domain Features",
  },
  features: clericFeatures,
  iconFileByFeatureId: {
    "cleric-spellcasting": "Passive_Cleric_Spellcasting.png",
    "cleric-turn-undead": "Action_Cleric_TurnUndead.png",
    "cleric-destroy-undead": "Passive_Cleric_DestroyUndead.png",

    "cleric-divine-intervention": "Action_Cleric_DivineIntervention.png",
    "cleric-divine-intervention-sunder-the-heretical":
      "Action_Cleric_DivineIntervention_SunderTheHeretical.png",
    "cleric-divine-intervention-arm-thy-servant":
      "Action_Cleric_DivineIntervention_ArmThyServant.png",
    "cleric-divine-intervention-opulent-revival":
      "Action_Cleric_DivineIntervention_OpulentRevival.png",
    "cleric-divine-intervention-golden-generosity":
      "Action_Cleric_DivineIntervention_GoldenGenerosity.png",

    "cleric-death-reaper": "Passive_Cleric_Death_Reaper.png",
    "cleric-death-touch-of-death": "Action_Cleric_Death_TouchOfDeath.png",
    "cleric-death-inescapable-destruction":
      "Passive_Cleric_Death_InescapableDestruction.png",

    "cleric-knowledge-blessings-of-knowledge":
      "Passive_Cleric_Knowledge_BlessingsOfKnowledge.png",
    "cleric-knowledge-knowledge-of-the-ages":
      "Action_Cleric_Knowledge_KnowledgeOfTheAges.png",
    "cleric-knowledge-read-thoughts":
      "Action_Cleric_Knowledge_ReadThoughts.png",
    "cleric-knowledge-speak-with-animals":
      "Action_Cleric_Knowledge_SpeakWithAnimals.png",
    "cleric-knowledge-potent-spellcasting":
      "Passive_Cleric_Knowledge_PotentSpellcasting.png",

    "cleric-life-disciple-of-life":
      "Passive_Cleric_Life_DiscipleOfLife.png",
    "cleric-life-preserve-life": "Action_Cleric_Life_PreserveLife.png",
    "cleric-life-blessed-healer": "Passive_Cleric_Life_BlessedHealer.png",

    "cleric-light-warding-flare": "Reaction_Cleric_Light_WardingFlare.png",
    "cleric-light-radiance-of-the-dawn":
      "Action_Cleric_Light_RadianceOfTheDawn.png",
    "cleric-light-improved-warding-flare":
      "Reaction_Cleric_Light_ImprovedWardingFlare.png",
    "cleric-light-potent-spellcasting":
      "Passive_Cleric_Light_PotentSpellcasting.png",

    "cleric-nature-acolyte-of-nature":
      "Passive_Cleric_Nature_AcolyteOfNature.png",
    "cleric-nature-charm-animals-and-plants":
      "Action_Cleric_Nature_CharmAnimalsAndPlants.png",
    "cleric-nature-dampen-elements":
      "Reaction_Cleric_Nature_DampenElements.png",

    "cleric-tempest-wrath-of-the-storm":
      "Reaction_Cleric_Tempest_WrathOfTheStorm.png",
    "cleric-tempest-wrath-of-the-storm-lightning":
      "Reaction_Cleric_Tempest_WrathOfTheStormLightning.png",
    "cleric-tempest-wrath-of-the-storm-thunder":
      "Reaction_Cleric_Tempest_WrathOfTheStormThunder.png",
    "cleric-tempest-destructive-wrath":
      "Action_Cleric_Tempest_DestructiveWrath.png",
    "cleric-tempest-thunderbolt-strike":
      "Passive_Cleric_Tempest_ThunderboltStrike.png",

    "cleric-trickery-blessing-of-the-trickster":
      "Action_Cleric_Trickery_BlessingOfTheTrickster.png",
    "cleric-trickery-invoke-duplicity":
      "Action_Cleric_Trickery_InvokeDuplicity.png",
    "cleric-trickery-cloak-of-shadows":
      "Action_Cleric_Trickery_CloakOfShadows.png",

    "cleric-war-war-priest": "Passive_Cleric_War_WarPriest.png",
    "cleric-war-war-priest-bonus-attack":
      "Action_Cleric_War_WarPriestBonusAttack.png",
    "cleric-war-guided-strike": "Action_Cleric_War_GuidedStrike.png",
    "cleric-war-war-gods-blessing":
      "Reaction_Cleric_War_WarGodsBlessing.png",

    ...channelDivinityChargeIconEntries,
    ...warPriestChargeIconEntries,
    ...domainSpellIconEntries,
    ...deathReaperCantripIconEntries,
    ...natureAcolyteCantripIconEntries,
    ...divineStrikeIconEntries,
    ...elementalFuryIconEntries,
  },
};