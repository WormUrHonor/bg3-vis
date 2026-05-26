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

const SORCERER = "Sorcerer" as const;

const DRACONIC = "Draconic Bloodline";
const SHADOW = "Shadow Magic";
const STORM = "Storm Sorcery";
const WILD = "Wild Magic";

type FeatureRange = BG3Spell["range"];

const metamagicChoice = {
  id: "sorcerer-metamagic",
  label: "Metamagic",
  max: 4,
};

const draconicAncestryChoice = {
  id: "sorcerer-draconic-ancestry",
  label: "Draconic Ancestry",
  max: 1,
};

const wildMagicSurgeActiveGroup = {
  id: "sorcerer-wild-magic-surge-assumption",
  label: "Wild Magic Surge Assumption",
  max: 1,
};

const coreGroup = {
  id: "sorcerer-core",
  label: "Core Sorcerer Features",
  order: 10,
};

const sorceryPointGroup = {
  id: "sorcerer-sorcery-points",
  label: "Sorcery Points",
  order: 12,
};

const metamagicGroup = {
  id: "sorcerer-metamagic",
  label: "Metamagic Choices",
  order: 20,
};

const draconicGroup = {
  id: "sorcerer-draconic",
  label: "Draconic Bloodline Features",
  order: 30,
};

const draconicChoiceGroup = {
  id: "sorcerer-draconic-ancestry",
  label: "Draconic Ancestry Choice",
  order: 32,
};

const draconicSpellGroup = {
  id: "sorcerer-draconic-granted-spells",
  label: "Draconic Ancestry Granted Spells",
  order: 34,
};

const draconicAffinityGroup = {
  id: "sorcerer-draconic-affinity",
  label: "Elemental Affinity",
  order: 36,
};

const shadowGroup = {
  id: "sorcerer-shadow",
  label: "Shadow Magic Features",
  order: 40,
};

const stormGroup = {
  id: "sorcerer-storm",
  label: "Storm Sorcery Features",
  order: 50,
};

const stormSpellGroup = {
  id: "sorcerer-storm-spells",
  label: "Storm Spells",
  order: 52,
};

const wildGroup = {
  id: "sorcerer-wild",
  label: "Wild Magic Features",
  order: 60,
};

const wildSurgeGroup = {
  id: "sorcerer-wild-surge-effects",
  label: "Wild Magic Surge Effects",
  order: 62,
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

const self3mRadius = {
  label: "self, 3m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 3,
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

const line30m = {
  label: "30m line",
  meters: 30,
  category: "long",
  shape: "line",
} as const;

const cone9m = {
  label: "9m cone",
  meters: 9,
  category: "mid",
  shape: "cone",
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

function makeSpellFeatureFromSpellId(args: {
  id: string;
  spellId: string;
  minLevel: number;
  subclass: string;
  displayGroup: { id: string; label: string; order: number };
  description: string;
  requires?: string[];
  resourcesOverride?: ResourceCost[];
  actionsOverride?: ActionCost[];
  tags?: string[];
}) {
  const meta = safeSpellMeta(args.spellId);

  return feature(
    args.id,
    meta.name,
    "subclass-feature",
    [availableTo(SORCERER, args.minLevel, args.subclass)],
    true,
    args.description,
    meta.roles,
    meta.damageTypes,
    args.actionsOverride ?? meta.actions,
    args.resourcesOverride ?? meta.resources,
    meta.range,
    [
      "sorcerer",
      "subclass-granted-spell",
      ...meta.tags,
      ...(args.tags ?? []),
    ],
    {
      displayGroup: args.displayGroup,
      requires: args.requires,
    }
  );
}

type SorceryPointDefinition = {
  level: number;
  amount: number;
};

const sorceryPointDefinitions: SorceryPointDefinition[] = Array.from(
  { length: 11 },
  (_, index) => ({
    level: index + 2,
    amount: index + 2,
  })
);

function makeSorceryPointFeature(entry: SorceryPointDefinition) {
  return feature(
    `sorcerer-sorcery-points-${entry.amount}`,
    `Sorcery Points: ${entry.amount}`,
    "resource-feature",
    [availableTo(SORCERER, entry.level, undefined, entry.level)],
    true,
    `You have ${entry.amount} Sorcery Points. Sorcery Points recharge on Long Rest and can be used for Metamagic or spell-slot conversion.`,
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["sorcerer", "sorcery-points", "resource"],
    {
      displayGroup: sorceryPointGroup,
    }
  );
}

type MetamagicDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  sorceryPointCost: string;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: ActionCost[];
  resources: ResourceCost[];
  range: FeatureRange;
};

const metamagicDefinitions: MetamagicDefinition[] = [
  {
    idBase: "careful-spell",
    name: "Careful Spell",
    minLevel: 2,
    sorceryPointCost: "1 Sorcery Point",
    description:
      "Allies automatically succeed Saving Throws against spells that require them.",
    roles: ["support-buff", "defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "distant-spell",
    name: "Distant Spell",
    minLevel: 2,
    sorceryPointCost: "1 Sorcery Point",
    description:
      "Increase a spell's range by 50%. Melee spells are increased to 9m.",
    roles: ["support-buff", "mobility-positioning"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "extended-spell",
    name: "Extended Spell",
    minLevel: 2,
    sorceryPointCost: "1 Sorcery Point",
    description:
      "Double the duration of conditions, summons, and surfaces caused by spells.",
    roles: ["support-buff", "control", "summon"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "twinned-spell",
    name: "Twinned Spell",
    minLevel: 2,
    sorceryPointCost: "1 Sorcery Point per spell slot level; cantrips cost 1",
    description:
      "Spells that target only one creature can target an additional creature.",
    roles: ["support-buff", "single-target-damage", "control", "healing"],
    damageTypes: ["Variable"],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "heightened-spell",
    name: "Heightened Spell",
    minLevel: 3,
    sorceryPointCost: "3 Sorcery Points",
    description:
      "Targets of spells that require Saving Throws have Disadvantage on their first Saving Throw.",
    roles: ["control", "support-buff"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "quickened-spell",
    name: "Quickened Spell",
    minLevel: 3,
    sorceryPointCost: "3 Sorcery Points",
    description:
      "Spells that normally cost an Action can be cast as a Bonus Action instead.",
    roles: ["support-buff", "single-target-damage", "area-damage"],
    damageTypes: ["Variable"],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: range18m,
  },
  {
    idBase: "subtle-spell",
    name: "Subtle Spell",
    minLevel: 3,
    sorceryPointCost: "1 Sorcery Point",
    description: "You can cast spells while Silenced.",
    roles: ["support-buff", "defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: self,
  },
];

function makeMetamagicFeature(entry: MetamagicDefinition) {
  return feature(
    `sorcerer-metamagic-${entry.idBase}`,
    entry.name,
    "subclass-feature",
    [availableTo(SORCERER, entry.minLevel)],
    false,
    `${entry.description} Cost: ${entry.sorceryPointCost}.`,
    entry.roles,
    entry.damageTypes,
    entry.actions,
    entry.resources,
    entry.range,
    ["sorcerer", "metamagic"],
    {
      choiceGroup: metamagicChoice,
      displayGroup: metamagicGroup,
    }
  );
}

type DraconicAncestryDefinition = {
  idBase: string;
  name: string;
  damageType: DamageType;
  grantedSpellId: string;
};

const draconicAncestryDefinitions: DraconicAncestryDefinition[] = [
  {
    idBase: "red",
    name: "Red Draconic Ancestry",
    damageType: "Fire",
    grantedSpellId: "burning-hands",
  },
  {
    idBase: "black",
    name: "Black Draconic Ancestry",
    damageType: "Acid",
    grantedSpellId: "grease",
  },
  {
    idBase: "blue",
    name: "Blue Draconic Ancestry",
    damageType: "Lightning",
    grantedSpellId: "witch-bolt",
  },
  {
    idBase: "white",
    name: "White Draconic Ancestry",
    damageType: "Cold",
    grantedSpellId: "armour-of-agathys",
  },
  {
    idBase: "green",
    name: "Green Draconic Ancestry",
    damageType: "Poison",
    grantedSpellId: "ray-of-sickness",
  },
  {
    idBase: "gold",
    name: "Gold Draconic Ancestry",
    damageType: "Fire",
    grantedSpellId: "disguise-self",
  },
  {
    idBase: "silver",
    name: "Silver Draconic Ancestry",
    damageType: "Cold",
    grantedSpellId: "feather-fall",
  },
  {
    idBase: "bronze",
    name: "Bronze Draconic Ancestry",
    damageType: "Lightning",
    grantedSpellId: "fog-cloud",
  },
  {
    idBase: "copper",
    name: "Copper Draconic Ancestry",
    damageType: "Acid",
    grantedSpellId: "tashas-hideous-laughter",
  },
  {
    idBase: "brass",
    name: "Brass Draconic Ancestry",
    damageType: "Fire",
    grantedSpellId: "sleep",
  },
];

function makeDraconicAncestryFeature(entry: DraconicAncestryDefinition) {
  return feature(
    `sorcerer-draconic-ancestry-${entry.idBase}`,
    entry.name,
    "subclass-feature",
    [availableTo(SORCERER, 1, DRACONIC)],
    false,
    `Choose ${entry.name}. ${entry.damageType} is the damage type associated with this ancestry, and it grants a bonus spell.`,
    ["support-buff"],
    [entry.damageType],
    ["passive"],
    ["none"],
    self,
    [
      "sorcerer",
      "draconic-bloodline",
      "draconic-ancestry",
      `ancestry-damage:${entry.damageType}`,
    ],
    {
      choiceGroup: draconicAncestryChoice,
      displayGroup: draconicChoiceGroup,
    }
  );
}

function makeDraconicGrantedSpell(entry: DraconicAncestryDefinition) {
  return makeSpellFeatureFromSpellId({
    id: `sorcerer-draconic-ancestry-${entry.idBase}-${entry.grantedSpellId}`,
    spellId: entry.grantedSpellId,
    minLevel: 1,
    subclass: DRACONIC,
    displayGroup: draconicSpellGroup,
    description: `Granted by ${entry.name}. This spell is always known from the chosen Draconic Ancestry.`,
    requires: [`sorcerer-draconic-ancestry-${entry.idBase}`],
    tags: ["draconic-bloodline", `ancestry:${entry.idBase}`],
  });
}

function makeDraconicElementalAffinityDamage(
  entry: DraconicAncestryDefinition
) {
  return feature(
    `sorcerer-draconic-ancestry-${entry.idBase}-elemental-affinity-damage`,
    `Elemental Affinity: Damage (${entry.damageType})`,
    "passive",
    [availableTo(SORCERER, 6, DRACONIC)],
    true,
    `When you cast a spell that deals ${entry.damageType} damage, add your Charisma Modifier to one damage roll.`,
    ["single-target-damage", "area-damage", "support-buff"],
    [entry.damageType],
    ["passive"],
    ["none"],
    range18m,
    [
      "sorcerer",
      "draconic-bloodline",
      "elemental-affinity",
      `damage-type:${entry.damageType}`,
    ],
    {
      displayGroup: draconicAffinityGroup,
      requires: [`sorcerer-draconic-ancestry-${entry.idBase}`],
    }
  );
}

function makeDraconicElementalAffinityResistance(
  entry: DraconicAncestryDefinition
) {
  return feature(
    `sorcerer-draconic-ancestry-${entry.idBase}-elemental-affinity-resistance`,
    `Elemental Affinity: Resistance (${entry.damageType})`,
    "subclass-feature",
    [availableTo(SORCERER, 6, DRACONIC)],
    true,
    `When you cast a spell that deals ${entry.damageType} damage, spend 1 Sorcery Point to gain Resistance to ${entry.damageType} damage.`,
    ["defense-protection", "support-buff"],
    [entry.damageType],
    ["conditional"],
    ["class-resource"],
    self,
    [
      "sorcerer",
      "draconic-bloodline",
      "elemental-affinity",
      `damage-type:${entry.damageType}`,
    ],
    {
      displayGroup: draconicAffinityGroup,
      requires: [`sorcerer-draconic-ancestry-${entry.idBase}`],
    }
  );
}

const stormSpellIds = [
  "thunderwave",
  "create-or-destroy-water",
  "gust-of-wind",
  "sleet-storm",
  "call-lightning",
];

const stormSpellFeatures = stormSpellIds.map((spellId) =>
  makeSpellFeatureFromSpellId({
    id: `sorcerer-storm-spell-${spellId}`,
    spellId,
    minLevel: 6,
    subclass: STORM,
    displayGroup: stormSpellGroup,
    description:
      "Storm Sorcery grants this additional spell from the subclass spell list.",
    tags: ["storm-sorcery", "storm-spell"],
  })
);

type WildSurgeDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  controlledChaos: boolean;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: ActionCost[];
  resources: ResourceCost[];
  range: FeatureRange;
};

const wildSurgeDefinitions: WildSurgeDefinition[] = [
  {
    idBase: "action-surge",
    name: "Wild Magic Surge: Action Surge",
    minLevel: 1,
    controlledChaos: true,
    description: "You gain an additional action this turn.",
    roles: ["support-buff"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "blur",
    name: "Wild Magic Surge: Blur",
    minLevel: 1,
    controlledChaos: false,
    description: "Each creature within 9m becomes Blurred.",
    roles: ["defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self9mRadius,
  },
  {
    idBase: "burning",
    name: "Wild Magic Surge: Burning",
    minLevel: 2,
    controlledChaos: true,
    description:
      "Each creature and item within 6m starts burning and takes Fire damage per turn.",
    roles: ["area-damage", "control"],
    damageTypes: ["Fire"],
    actions: ["conditional"],
    resources: ["none"],
    range: self6mRadius,
  },
  {
    idBase: "cambion",
    name: "Wild Magic Surge: Cambion",
    minLevel: 10,
    controlledChaos: true,
    description:
      "Summon a hostile cambion from the fiery nexus of the Nine Hells.",
    roles: ["summon", "single-target-damage"],
    damageTypes: ["Fire", "Weapon"],
    actions: ["conditional"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "cats-and-dogs",
    name: "Wild Magic Surge: Cats and Dogs",
    minLevel: 2,
    controlledChaos: true,
    description:
      "Each creature within 9m is randomly transformed into either a cat or a dog.",
    roles: ["control"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self9mRadius,
  },
  {
    idBase: "enchant-weapons",
    name: "Wild Magic Surge: Enchant Weapons",
    minLevel: 1,
    controlledChaos: false,
    description:
      "Enchant the weapon of each creature within 6m. Their next attack is a Critical Hit and deals additional Force damage.",
    roles: ["support-buff", "single-target-damage"],
    damageTypes: ["Force", "Weapon"],
    actions: ["conditional"],
    resources: ["none"],
    range: self6mRadius,
  },
  {
    idBase: "enlarge-reduce",
    name: "Wild Magic Surge: Enlarge/Reduce",
    minLevel: 2,
    controlledChaos: false,
    description: "Each creature within 9m is randomly Enlarged or Reduced.",
    roles: ["support-buff", "control"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self9mRadius,
  },
  {
    idBase: "entangle",
    name: "Wild Magic Surge: Entangle",
    minLevel: 2,
    controlledChaos: true,
    description:
      "Create a vine surface around yourself, slowing creatures and possibly Entangling them.",
    roles: ["control", "mobility-positioning"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self6mRadius,
  },
  {
    idBase: "explosive-healing",
    name: "Wild Magic Surge: Explosive Healing",
    minLevel: 1,
    controlledChaos: false,
    description:
      "When you hit a target with a spell, heal all creatures within 3m based on the spell slot level used.",
    roles: ["healing", "support-buff"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self3mRadius,
  },
  {
    idBase: "flight",
    name: "Wild Magic Surge: Flight",
    minLevel: 2,
    controlledChaos: false,
    description: "You can Fly until the end of the turn.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "fog",
    name: "Wild Magic Surge: Fog",
    minLevel: 1,
    controlledChaos: true,
    description:
      "Create a cloud of fog around yourself. Creatures within are Heavily Obscured and Blinded.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self6mRadius,
  },
  {
    idBase: "polymorph",
    name: "Wild Magic Surge: Polymorph",
    minLevel: 2,
    controlledChaos: true,
    description: "You are transformed into a beast.",
    roles: ["control", "mobility-positioning"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "resilient-sphere",
    name: "Wild Magic Surge: Resilient Sphere",
    minLevel: 2,
    controlledChaos: true,
    description:
      "Enclose yourself in an arcane sphere. You cannot be damaged by attacks or effects outside it, nor damage anything outside it. Movement Speed is halved.",
    roles: ["defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "shield",
    name: "Wild Magic Surge: Shield",
    minLevel: 2,
    controlledChaos: false,
    description:
      "Armour Class is increased by 5 and you become immune to Magic Missile.",
    roles: ["defense-protection"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "slow",
    name: "Wild Magic Surge: Slow",
    minLevel: 2,
    controlledChaos: true,
    description: "You are Slowed.",
    roles: ["control"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "sorcery-points",
    name: "Wild Magic Surge: Sorcery Points",
    minLevel: 2,
    controlledChaos: false,
    description:
      "Until the end of your next turn, each spell you cast restores Sorcery Points equal to its Spell Slot level.",
    roles: ["support-buff"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["class-resource"],
    range: self,
  },
  {
    idBase: "speak-with-animals",
    name: "Wild Magic Surge: Speak with Animals",
    minLevel: 2,
    controlledChaos: false,
    description: "Gain the ability to comprehend and communicate with beasts.",
    roles: ["narrative-interaction", "investigation-world-interaction"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "spike-growth",
    name: "Wild Magic Surge: Spike Growth",
    minLevel: 2,
    controlledChaos: true,
    description:
      "Shape ground around yourself into hard spikes. Creatures walking on the spikes take Piercing damage.",
    roles: ["area-damage", "control"],
    damageTypes: ["Piercing"],
    actions: ["conditional"],
    resources: ["none"],
    range: self6mRadius,
  },
  {
    idBase: "summon-mephit",
    name: "Wild Magic Surge: Summon Mephit",
    minLevel: 1,
    controlledChaos: true,
    description: "Summon a hostile mephit.",
    roles: ["summon", "single-target-damage"],
    damageTypes: ["Variable"],
    actions: ["conditional"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "swap",
    name: "Wild Magic Surge: Swap",
    minLevel: 1,
    controlledChaos: false,
    description:
      "Swap positions with a target each time you cast a spell or cantrip.",
    roles: ["mobility-positioning", "control"],
    damageTypes: [],
    actions: ["conditional"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "telekinesis",
    name: "Wild Magic Surge: Telekinesis",
    minLevel: 2,
    controlledChaos: false,
    description:
      "You can lift and throw objects and creatures with your mind until the end of your turn.",
    roles: ["control", "single-target-damage"],
    damageTypes: ["Bludgeoning"],
    actions: ["conditional"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "teleport",
    name: "Wild Magic Surge: Teleport",
    minLevel: 1,
    controlledChaos: false,
    description:
      "Until the end of your next turn, you can use a bonus action to teleport up to 9m.",
    roles: ["mobility-positioning", "defense-protection"],
    damageTypes: [],
    actions: ["conditional", "bonus-action"],
    resources: ["none"],
    range: range9m,
  },
  {
    idBase: "turn-magic",
    name: "Wild Magic Surge: Turn Magic",
    minLevel: 2,
    controlledChaos: false,
    description:
      "At the start of each turn, trigger a new random magical effect.",
    roles: ["support-buff", "control"],
    damageTypes: ["Variable"],
    actions: ["conditional"],
    resources: ["none"],
    range: self,
  },
];

function makeWildSurgeFeature(entry: WildSurgeDefinition) {
  return feature(
    `sorcerer-wild-surge-${entry.idBase}`,
    entry.name,
    "toggle",
    [availableTo(SORCERER, entry.minLevel, WILD)],
    true,
    `${entry.description}${
      entry.controlledChaos ? " This effect can appear through Controlled Chaos." : ""
    }`,
    entry.roles,
    entry.damageTypes,
    entry.actions,
    entry.resources,
    entry.range,
    [
      "sorcerer",
      "wild-magic",
      "wild-magic-surge",
      entry.controlledChaos ? "controlled-chaos-option" : "random-surge-only",
    ],
    {
      displayGroup: wildSurgeGroup,
      activeGroup: wildMagicSurgeActiveGroup,
      requires: ["sorcerer-wild-magic"],
    }
  );
}

const sorcererFeatures = [
  feature(
    "sorcerer-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(SORCERER, 1)],
    true,
    "Sorcerers are Charisma-based spellcasters. Their spells are Always Prepared, but they know fewer spells than Wizards.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["sorcerer", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  ...sorceryPointDefinitions.map(makeSorceryPointFeature),

  feature(
    "sorcerer-create-spell-slot",
    "Create Spell Slot",
    "bonus-action",
    [availableTo(SORCERER, 2)],
    true,
    "Spend Sorcery Points to unlock a Spell Slot.",
    ["support-buff"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["sorcerer", "sorcery-points", "class-action"],
    {
      displayGroup: sorceryPointGroup,
    }
  ),

  feature(
    "sorcerer-create-sorcery-points",
    "Create Sorcery Points",
    "bonus-action",
    [availableTo(SORCERER, 2)],
    true,
    "Spend Spell Slots to gain Sorcery Points. The level of spell slot spent creates the equivalent number of Sorcery Points.",
    ["support-buff"],
    [],
    ["bonus-action"],
    ["spell-slot"],
    self,
    ["sorcerer", "sorcery-points", "class-action"],
    {
      displayGroup: sorceryPointGroup,
    }
  ),

  ...metamagicDefinitions.map(makeMetamagicFeature),

  feature(
    "sorcerer-draconic-resilience",
    "Draconic Resilience",
    "passive",
    [availableTo(SORCERER, 1, DRACONIC)],
    true,
    "Dragon-like scales cover parts of your skin. When you are not wearing armour, your base Armour Class is 13. This does not stack with Mage Armour.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "draconic-bloodline"],
    {
      displayGroup: draconicGroup,
    }
  ),

  feature(
    "sorcerer-draconic-resilience-hit-points",
    "Draconic Resilience: Hit Points",
    "passive",
    [availableTo(SORCERER, 1, DRACONIC)],
    true,
    "Your Hit Point maximum increases by 1 for each Sorcerer level.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "draconic-bloodline"],
    {
      displayGroup: draconicGroup,
    }
  ),

  ...draconicAncestryDefinitions.map(makeDraconicAncestryFeature),
  ...draconicAncestryDefinitions.map(makeDraconicGrantedSpell),
  ...draconicAncestryDefinitions.map(makeDraconicElementalAffinityDamage),
  ...draconicAncestryDefinitions.map(makeDraconicElementalAffinityResistance),

  feature(
    "sorcerer-draconic-fly",
    "Fly",
    "subclass-feature",
    [availableTo(SORCERER, 11, DRACONIC)],
    true,
    "Fly to a target position. Movement uses half cost.",
    ["mobility-positioning"],
    [],
    ["conditional"],
    ["none"],
    range18mSingle,
    ["sorcerer", "draconic-bloodline", "fly"],
    {
      displayGroup: draconicGroup,
    }
  ),

  feature(
    "sorcerer-shadow-eyes-of-the-dark",
    "Eyes of the Dark",
    "passive",
    [availableTo(SORCERER, 1, SHADOW)],
    true,
    "You can see in the dark up to 24m.",
    ["investigation-world-interaction", "support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "shadow-magic"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "sorcerer-shadow-strength-of-the-grave",
    "Strength of the Grave",
    "passive",
    [availableTo(SORCERER, 1, SHADOW)],
    true,
    "After reaching 0 Hit Points, you regain 1 instead of becoming downed.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "shadow-magic"],
    {
      displayGroup: shadowGroup,
    }
  ),

  makeSpellFeatureFromSpellId({
    id: "sorcerer-shadow-darkness",
    spellId: "darkness",
    minLevel: 3,
    subclass: SHADOW,
    displayGroup: shadowGroup,
    description:
      "Shadow Magic grants Darkness. Create a cloud of magical darkness that Heavily Obscures and Blinds creatures within.",
    tags: ["shadow-magic"],
  }),

  feature(
    "sorcerer-shadow-eyes-of-the-dark-darkness",
    "Eyes of the Dark: Darkness",
    "action",
    [availableTo(SORCERER, 3, SHADOW)],
    true,
    "Create magical darkness by spending 2 Sorcery Points instead of a Level 2 Spell Slot.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("18m, 5m AoE", 18, "long", 5),
    ["sorcerer", "shadow-magic", "uses-spell-icon:darkness"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "sorcerer-shadow-hound-of-ill-omen",
    "Hound of Ill Omen",
    "bonus-action",
    [availableTo(SORCERER, 6, SHADOW)],
    true,
    "Spend 3 Sorcery Points to summon a creature of darkness. Recharges on Short Rest.",
    ["summon", "single-target-damage", "control"],
    ["Necrotic", "Weapon"],
    ["bonus-action"],
    ["class-resource", "short-rest"],
    range18mSingle,
    ["sorcerer", "shadow-magic"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "sorcerer-shadow-shadow-walk",
    "Shadow Walk",
    "bonus-action",
    [availableTo(SORCERER, 11, SHADOW)],
    true,
    "Teleport into the shadows. The next spell you cast that turn benefits from Distant Spell without costing Sorcery Points.",
    ["mobility-positioning", "support-buff", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    range18mSingle,
    ["sorcerer", "shadow-magic"],
    {
      displayGroup: shadowGroup,
    }
  ),

  feature(
    "sorcerer-storm-tempestuous-magic",
    "Tempestuous Magic",
    "passive",
    [availableTo(SORCERER, 1, STORM)],
    true,
    "After you cast a Level 1 spell or higher, you can Fly as a Bonus Action up to 9m until the end of your turn without receiving Opportunity Attacks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["passive"],
    ["none"],
    range9m,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
    }
  ),

  feature(
    "sorcerer-storm-tempestuous-magic-fly",
    "Tempestuous Magic: Fly",
    "bonus-action",
    [availableTo(SORCERER, 1, STORM)],
    true,
    "Fly up to 9m after casting a Level 1 spell or higher without provoking Opportunity Attacks.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["none"],
    range9m,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
      requires: ["sorcerer-storm-tempestuous-magic"],
    }
  ),

  feature(
    "sorcerer-storm-heart-of-the-storm",
    "Heart of the Storm",
    "passive",
    [availableTo(SORCERER, 6, STORM)],
    true,
    "When you cast a Level 1 spell or higher that deals Lightning or Thunder damage, you cause a small local storm.",
    ["area-damage", "support-buff"],
    ["Lightning", "Thunder"],
    ["passive"],
    ["none"],
    self6mRadius,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
    }
  ),

  feature(
    "sorcerer-storm-heart-of-the-storm-lightning",
    "Heart of the Storm: Lightning",
    "passive",
    [availableTo(SORCERER, 6, STORM)],
    true,
    "When you cast a spell that deals Lightning damage, all enemies within 6m take Lightning damage equal to half your Sorcerer level.",
    ["area-damage"],
    ["Lightning"],
    ["conditional"],
    ["none"],
    self6mRadius,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
      requires: ["sorcerer-storm-heart-of-the-storm"],
    }
  ),

  feature(
    "sorcerer-storm-heart-of-the-storm-thunder",
    "Heart of the Storm: Thunder",
    "passive",
    [availableTo(SORCERER, 6, STORM)],
    true,
    "When you cast a spell that deals Thunder damage, all enemies within 6m take Thunder damage equal to half your Sorcerer level.",
    ["area-damage"],
    ["Thunder"],
    ["conditional"],
    ["none"],
    self6mRadius,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
      requires: ["sorcerer-storm-heart-of-the-storm"],
    }
  ),

  feature(
    "sorcerer-storm-heart-of-the-storm-resistance",
    "Heart of the Storm: Resistance",
    "passive",
    [availableTo(SORCERER, 6, STORM)],
    true,
    "You are Resistant to Lightning and Thunder damage.",
    ["defense-protection"],
    ["Lightning", "Thunder"],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
    }
  ),

  ...stormSpellFeatures,

  feature(
    "sorcerer-storm-storms-fury",
    "Storm's Fury",
    "reaction",
    [availableTo(SORCERER, 11, STORM)],
    true,
    "When struck by a melee attack, deal Lightning damage to the attacker and possibly push them back 6m.",
    ["single-target-damage", "control", "defense-protection"],
    ["Lightning"],
    ["reaction"],
    ["none"],
    melee,
    ["sorcerer", "storm-sorcery"],
    {
      displayGroup: stormGroup,
    }
  ),

  feature(
    "sorcerer-wild-magic",
    "Wild Magic",
    "passive",
    [availableTo(SORCERER, 1, WILD)],
    true,
    "Each time you cast a spell of Level 1 or higher, your magic might surge and trigger a random magical effect.",
    ["support-buff", "control"],
    ["Variable"],
    ["passive"],
    ["none"],
    self,
    ["sorcerer", "wild-magic"],
    {
      displayGroup: wildGroup,
    }
  ),

  feature(
    "sorcerer-wild-tides-of-chaos",
    "Tides of Chaos",
    "subclass-feature",
    [availableTo(SORCERER, 1, WILD)],
    true,
    "Activate to gain Advantage on your next Attack Roll, Ability Check, or Saving Throw. The chance of a Wild Magic Surge increases afterwards.",
    ["support-buff"],
    [],
    ["conditional"],
    ["short-rest"],
    self,
    ["sorcerer", "wild-magic"],
    {
      displayGroup: wildGroup,
    }
  ),

  feature(
    "sorcerer-wild-bend-luck",
    "Bend Luck",
    "subclass-feature",
    [availableTo(SORCERER, 6, WILD)],
    true,
    "Spend 2 Sorcery Points to give a target a 1d4 bonus or penalty to Ability Checks. It can also affect Attack Rolls or Saving Throws as a Reaction.",
    ["support-buff", "control"],
    [],
    ["reaction", "conditional"],
    ["class-resource"],
    range18mSingle,
    ["sorcerer", "wild-magic"],
    {
      displayGroup: wildGroup,
    }
  ),

  feature(
    "sorcerer-wild-controlled-chaos",
    "Controlled Chaos",
    "reaction",
    [availableTo(SORCERER, 11, WILD)],
    true,
    "Foes may suffer a Wild Magic Surge while casting spells near your fluctuating magic.",
    ["control", "support-buff"],
    ["Variable"],
    ["reaction"],
    ["none"],
    range18mSingle,
    ["sorcerer", "wild-magic"],
    {
      displayGroup: wildGroup,
    }
  ),

  ...wildSurgeDefinitions.map(makeWildSurgeFeature),
];

const metamagicIconEntries = Object.fromEntries(
  metamagicDefinitions.map((entry) => [
    `sorcerer-metamagic-${entry.idBase}`,
    `Passive_Sorcerer_Metamagic_${entry.idBase}.png`,
  ])
);

const draconicAncestryIconEntries = Object.fromEntries(
  draconicAncestryDefinitions.map((entry) => [
    `sorcerer-draconic-ancestry-${entry.idBase}`,
    `Passive_Sorcerer_DraconicAncestry_${entry.idBase}.png`,
  ])
);

const draconicSpellIconEntries = Object.fromEntries(
  draconicAncestryDefinitions.map((entry) => [
    `sorcerer-draconic-ancestry-${entry.idBase}-${entry.grantedSpellId}`,
    `Spell_${entry.grantedSpellId}.png`,
  ])
);

const draconicAffinityIconEntries = Object.fromEntries(
  draconicAncestryDefinitions.flatMap((entry) => [
    [
      `sorcerer-draconic-ancestry-${entry.idBase}-elemental-affinity-damage`,
      `Passive_Sorcerer_ElementalAffinityDamage_${entry.damageType}.png`,
    ],
    [
      `sorcerer-draconic-ancestry-${entry.idBase}-elemental-affinity-resistance`,
      `Action_Sorcerer_ElementalAffinityResistance_${entry.damageType}.png`,
    ],
  ])
);

const stormSpellIconEntries = Object.fromEntries(
  stormSpellIds.map((spellId) => [
    `sorcerer-storm-spell-${spellId}`,
    `Spell_${spellId}.png`,
  ])
);

const wildSurgeIconEntries = Object.fromEntries(
  wildSurgeDefinitions.map((entry) => [
    `sorcerer-wild-surge-${entry.idBase}`,
    `Passive_Sorcerer_WildSurge_${entry.idBase}.png`,
  ])
);

export const sorcererClassModule: ClassFeatureModule = {
  className: "Sorcerer",
  defaultTabLabel: "Sorcerer Features",
  subclassTabLabels: {
    [DRACONIC]: "Draconic Features",
    [SHADOW]: "Shadow Features",
    [STORM]: "Storm Features",
    [WILD]: "Wild Magic Features",
  },
  features: sorcererFeatures,
  iconFileByFeatureId: {
    "sorcerer-spellcasting": "Passive_Sorcerer_Spellcasting.png",

    "sorcerer-create-spell-slot": "Action_Sorcerer_CreateSpellSlot.png",
    "sorcerer-create-sorcery-points":
      "Action_Sorcerer_CreateSorceryPoints.png",

    "sorcerer-draconic-resilience":
      "Passive_Sorcerer_DraconicResilience.png",
    "sorcerer-draconic-resilience-hit-points":
      "Passive_Sorcerer_DraconicResilienceHitPoints.png",
    "sorcerer-draconic-fly": "Action_Sorcerer_Draconic_Fly.png",

    "sorcerer-shadow-eyes-of-the-dark":
      "Passive_Sorcerer_Shadow_EyesOfTheDark.png",
    "sorcerer-shadow-strength-of-the-grave":
      "Passive_Sorcerer_Shadow_StrengthOfTheGrave.png",
    "sorcerer-shadow-darkness": "Spell_Evocation_Darkness.png",
    "sorcerer-shadow-eyes-of-the-dark-darkness":
      "Action_Sorcerer_Shadow_EyesOfTheDarkDarkness.png",
    "sorcerer-shadow-hound-of-ill-omen":
      "Action_Sorcerer_Shadow_HoundOfIllOmen.png",
    "sorcerer-shadow-shadow-walk":
      "Action_Sorcerer_Shadow_ShadowWalk.png",

    "sorcerer-storm-tempestuous-magic":
      "Passive_Sorcerer_Storm_TempestuousMagic.png",
    "sorcerer-storm-tempestuous-magic-fly":
      "Action_Sorcerer_Storm_TempestuousMagicFly.png",
    "sorcerer-storm-heart-of-the-storm":
      "Passive_Sorcerer_Storm_HeartOfTheStorm.png",
    "sorcerer-storm-heart-of-the-storm-lightning":
      "Passive_Sorcerer_Storm_HeartOfTheStormLightning.png",
    "sorcerer-storm-heart-of-the-storm-thunder":
      "Passive_Sorcerer_Storm_HeartOfTheStormThunder.png",
    "sorcerer-storm-heart-of-the-storm-resistance":
      "Passive_Sorcerer_Storm_HeartOfTheStormResistance.png",
    "sorcerer-storm-storms-fury":
      "Reaction_Sorcerer_Storm_StormsFury.png",

    "sorcerer-wild-magic": "Passive_Sorcerer_WildMagic.png",
    "sorcerer-wild-tides-of-chaos":
      "Action_Sorcerer_Wild_TidesOfChaos.png",
    "sorcerer-wild-bend-luck": "Reaction_Sorcerer_Wild_BendLuck.png",
    "sorcerer-wild-controlled-chaos":
      "Reaction_Sorcerer_Wild_ControlledChaos.png",

    ...Object.fromEntries(
      sorceryPointDefinitions.map((entry) => [
        `sorcerer-sorcery-points-${entry.amount}`,
        "Passive_Sorcerer_SorceryPoints.png",
      ])
    ),

    ...metamagicIconEntries,
    ...draconicAncestryIconEntries,
    ...draconicSpellIconEntries,
    ...draconicAffinityIconEntries,
    ...stormSpellIconEntries,
    ...wildSurgeIconEntries,
  },
};