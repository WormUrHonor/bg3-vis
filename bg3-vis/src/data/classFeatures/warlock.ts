import type {
  AbilityRole,
  ActionCost,
  BG3Spell,
  DamageType,
  ResourceCost,
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

const WARLOCK = "Warlock" as const;

const ARCHFEY = "The Archfey";
const FIEND = "The Fiend";
const GREAT_OLD_ONE = "The Great Old One";
const HEXBLADE = "The Hexblade";

type FeatureRange = BG3Spell["range"];

const pactBoonChoice = {
  id: "warlock-pact-boon",
  label: "Pact Boon",
  max: 1,
};

const eldritchInvocationChoice = {
  id: "warlock-eldritch-invocations",
  label: "Eldritch Invocations",
  max: 6,
};

const coreGroup = {
  id: "warlock-core",
  label: "Core Warlock Features",
  order: 10,
};

const pactMagicGroup = {
  id: "warlock-pact-magic",
  label: "Pact Magic",
  order: 12,
};

const pactBoonGroup = {
  id: "warlock-pact-boons",
  label: "Pact Boons",
  order: 20,
};

const pactGrantedGroup = {
  id: "warlock-pact-granted-actions",
  label: "Pact Granted Actions",
  order: 25,
};

const invocationGroup = {
  id: "warlock-eldritch-invocations",
  label: "Eldritch Invocations",
  order: 30,
};

const invocationGrantedGroup = {
  id: "warlock-invocation-granted-actions",
  label: "Invocation Granted Actions",
  order: 35,
};

const archfeyGroup = {
  id: "warlock-archfey",
  label: "Archfey Features",
  order: 40,
};

const fiendGroup = {
  id: "warlock-fiend",
  label: "Fiend Features",
  order: 50,
};

const greatOldOneGroup = {
  id: "warlock-great-old-one",
  label: "Great Old One Features",
  order: 60,
};

const hexbladeGroup = {
  id: "warlock-hexblade",
  label: "Hexblade Features",
  order: 70,
};

const selfSmallRadius = {
  label: "self, 3m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 3,
} as const;

const selfMidRadius = {
  label: "self, 9m AoE",
  meters: 0,
  category: "self",
  shape: "radius",
  aoeMeters: 9,
} as const;

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

const cone5m = {
  label: "5m cone",
  meters: 5,
  category: "mid",
  shape: "cone",
} as const;

type PactMagicDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  description: string;
  spellSlotLevel: string;
};

const pactMagicDefinitions: PactMagicDefinition[] = [
  {
    idBase: "level-1",
    name: "Pact Magic: Level I Slots",
    minLevel: 1,
    description:
      "You have Warlock spell slots that recharge on Short Rest. At this level, your Pact Magic slots cast spells at Level I.",
    spellSlotLevel: "I",
  },
  {
    idBase: "level-2",
    name: "Pact Magic: Level II Slots",
    minLevel: 3,
    description:
      "Your Warlock spell slots now cast Warlock spells at Level II and recharge on Short Rest.",
    spellSlotLevel: "II",
  },
  {
    idBase: "level-3",
    name: "Pact Magic: Level III Slots",
    minLevel: 5,
    description:
      "Your Warlock spell slots now cast Warlock spells at Level III and recharge on Short Rest.",
    spellSlotLevel: "III",
  },
  {
    idBase: "level-4",
    name: "Pact Magic: Level IV Slots",
    minLevel: 7,
    description:
      "Your Warlock spell slots now cast Warlock spells at Level IV and recharge on Short Rest.",
    spellSlotLevel: "IV",
  },
  {
    idBase: "level-5-two-slots",
    name: "Pact Magic: Level V Slots",
    minLevel: 9,
    description:
      "Your Warlock spell slots now cast Warlock spells at Level V and recharge on Short Rest.",
    spellSlotLevel: "V",
  },
  {
    idBase: "level-5-three-slots",
    name: "Pact Magic: 3 Level V Slots",
    minLevel: 11,
    description:
      "You gain a third Warlock spell slot. Your Warlock spell slots cast spells at Level V and recharge on Short Rest.",
    spellSlotLevel: "V",
  },
];

function makePactMagicFeature(entry: PactMagicDefinition) {
  return feature(
    `warlock-pact-magic-${entry.idBase}`,
    entry.name,
    "resource-feature",
    [availableTo(WARLOCK, entry.minLevel)],
    true,
    entry.description,
    ["support-buff"],
    [],
    ["passive"],
    ["pact-magic-slot", "short-rest"],
    self,
    ["warlock", "pact-magic", `slot-level-${entry.spellSlotLevel}`],
    {
      displayGroup: pactMagicGroup,
    }
  );
}

type InvocationDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: ActionCost[];
  resources: ResourceCost[];
  range: FeatureRange;
  tags?: string[];
};

const invocationDefinitions: InvocationDefinition[] = [
  {
    idBase: "agonising-blast",
    name: "Agonising Blast",
    minLevel: 2,
    description:
      "When you cast Eldritch Blast, add your Charisma Modifier to the damage it deals, unless it is negative.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Force"],
    actions: ["passive"],
    resources: ["none"],
    range: range18mSingle,
    tags: ["modifies-spell:eldritch-blast"],
  },
  {
    idBase: "armour-of-shadows",
    name: "Armour of Shadows",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to cast Mage Armour on yourself at will, without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "beast-speech",
    name: "Beast Speech",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to cast Speak with Animals on yourself at will, without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "beguiling-influence",
    name: "Beguiling Influence",
    minLevel: 2,
    description: "Gain Proficiency in Deception and Persuasion.",
    roles: ["narrative-interaction", "support-buff"],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "devils-sight",
    name: "Devil's Sight",
    minLevel: 2,
    description:
      "You can see normally in magical and non-magical darkness up to 24m.",
    roles: ["investigation-world-interaction", "support-buff"],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "fiendish-vigour",
    name: "Fiendish Vigour",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to cast False Life on yourself at will, without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "mask-of-many-faces",
    name: "Mask of Many Faces",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to cast Disguise Self on yourself at will, without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "one-with-shadows",
    name: "One with Shadows",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to become Invisible while obscured.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "repelling-blast",
    name: "Repelling Blast",
    minLevel: 2,
    description:
      "When you hit a creature with Eldritch Blast, you can push it up to 4.5m away.",
    roles: ["control", "single-target-damage"],
    damageTypes: ["Force"],
    actions: ["passive"],
    resources: ["none"],
    range: range18mSingle,
    tags: ["modifies-spell:eldritch-blast"],
  },
  {
    idBase: "thief-of-five-fates",
    name: "Thief of Five Fates",
    minLevel: 2,
    description:
      "Choose this invocation to gain the ability to cast Bane once per Long Rest using a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: range9m,
  },
  {
    idBase: "sign-of-ill-omen",
    name: "Sign of Ill Omen",
    minLevel: 5,
    description:
      "Choose this invocation to gain the ability to cast Bestow Curse with a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: touch,
  },
  {
    idBase: "mire-the-mind",
    name: "Mire the Mind",
    minLevel: 5,
    description:
      "Choose this invocation to gain the ability to cast Slow with a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: radiusRange("18m, 6m AoE", 18, "long", 6),
  },
  {
    idBase: "book-of-ancient-secrets",
    name: "Book of Ancient Secrets",
    minLevel: 7,
    description:
      "Choose this invocation to gain Ray of Sickness, Chromatic Orb, and Silence. Each can be cast once per Long Rest without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "dreadful-word",
    name: "Dreadful Word",
    minLevel: 7,
    description:
      "Choose this invocation to gain the ability to cast Confusion with a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: radiusRange("18m, 6m AoE", 18, "long", 6),
  },
  {
    idBase: "sculptor-of-flesh",
    name: "Sculptor of Flesh",
    minLevel: 7,
    description:
      "Choose this invocation to gain the ability to cast Polymorph with a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "minions-of-chaos",
    name: "Minions of Chaos",
    minLevel: 9,
    description:
      "Choose this invocation to gain the ability to cast Conjure Elemental with a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    idBase: "otherworldly-leap",
    name: "Otherworldly Leap",
    minLevel: 9,
    description:
      "Choose this invocation to gain the ability to cast Enhance Leap without expending a Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: touch,
  },
  {
    idBase: "whispers-of-the-grave",
    name: "Whispers of the Grave",
    minLevel: 9,
    description:
      "Choose this invocation to gain the ability to cast Speak with Dead without expending a Warlock Spell Slot.",
    roles: [],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: self,
  },
  {
    idBase: "lifedrinker",
    name: "Lifedrinker",
    minLevel: 12,
    description:
      "Attacks made with your melee weapon deal additional Necrotic damage equal to your Charisma Modifier.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Weapon", "Necrotic"],
    actions: ["passive"],
    resources: ["none"],
    range: melee,
  },
];

function makeInvocationFeature(entry: InvocationDefinition) {
  return feature(
    `warlock-invocation-${entry.idBase}`,
    entry.name,
    "subclass-feature",
    [availableTo(WARLOCK, entry.minLevel)],
    false,
    entry.description,
    entry.roles,
    entry.damageTypes,
    entry.actions,
    entry.resources,
    entry.range,
    ["warlock", "eldritch-invocation", ...(entry.tags ?? [])],
    {
      choiceGroup: eldritchInvocationChoice,
      displayGroup: invocationGroup,
    }
  );
}

const warlockFeatures = [
  ...pactMagicDefinitions.map(makePactMagicFeature),

  feature(
    "warlock-spellcasting",
    "Pact Magic Spellcasting",
    "resource-feature",
    [availableTo(WARLOCK, 1)],
    true,
    "Warlocks know a limited number of Always Prepared spells. Their Pact Magic slots recharge on Short Rest and always cast at the highest available Warlock spell level.",
    ["support-buff"],
    [],
    ["passive"],
    ["pact-magic-slot", "short-rest"],
    self,
    ["warlock", "spellcasting", "pact-magic"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "warlock-mystic-arcanum",
    "Mystic Arcanum",
    "resource-feature",
    [availableTo(WARLOCK, 11)],
    true,
    "Choose one 6th-level Warlock spell. It can be cast once per Long Rest without expending a Spell Slot.",
    ["support-buff"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["warlock", "mystic-arcanum"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "warlock-pact-of-the-blade",
    "Pact of the Blade",
    "subclass-feature",
    [availableTo(WARLOCK, 3)],
    false,
    "Choose Pact of the Blade. You can summon or bind a pact weapon, making it magical and using your Spellcasting Ability Modifier for attacks.",
    [],
    [],
    ["passive"],
    ["none"],
    melee,
    ["warlock", "pact-boon", "pact-of-the-blade"],
    {
      choiceGroup: pactBoonChoice,
      displayGroup: pactBoonGroup,
    }
  ),

  feature(
    "warlock-pact-of-the-chain",
    "Pact of the Chain",
    "subclass-feature",
    [availableTo(WARLOCK, 3)],
    false,
    "Choose Pact of the Chain. Gain the service of a familiar, including special familiar options such as Imp and Quasit.",
    [],
    [],
    ["passive"],
    ["none"],
    range18m,
    ["warlock", "pact-boon", "pact-of-the-chain"],
    {
      choiceGroup: pactBoonChoice,
      displayGroup: pactBoonGroup,
    }
  ),

  feature(
    "warlock-pact-of-the-tome",
    "Pact of the Tome",
    "subclass-feature",
    [availableTo(WARLOCK, 3)],
    false,
    "Choose Pact of the Tome. Your Book of Shadows grants Guidance, Vicious Mockery, and Thorn Whip.",
    [],
    [],
    ["passive"],
    ["none"],
    range18m,
    ["warlock", "pact-boon", "pact-of-the-tome"],
    {
      choiceGroup: pactBoonChoice,
      displayGroup: pactBoonGroup,
    }
  ),

  feature(
    "warlock-pact-blade-bind-pact-weapon",
    "Bind Pact Weapon",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Bind your wielded weapon as a Pact Weapon, making it magical and letting it use your Spellcasting Ability Modifier.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["warlock", "pact-of-the-blade", "class-action"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-blade"],
    }
  ),

  feature(
    "warlock-pact-blade-summon-pact-weapon",
    "Summon Pact Weapon",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Summon a magical pact weapon.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["warlock", "pact-of-the-blade", "class-action"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-blade"],
    }
  ),

  feature(
    "warlock-pact-chain-find-familiar",
    "Find Familiar",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Summon a familiar granted by Pact of the Chain.",
    ["summon", "investigation-world-interaction"],
    [],
    ["action"],
    ["none"],
    range18m,
    ["warlock", "pact-of-the-chain", "ritual", "uses-spell-icon:find-familiar"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-chain"],
    }
  ),

  feature(
    "warlock-pact-chain-find-familiar-imp",
    "Find Familiar: Imp",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Summon an Imp familiar through Pact of the Chain.",
    ["summon", "single-target-damage", "control"],
    ["Poison", "Piercing"],
    ["action"],
    ["none"],
    range18m,
    [
      "warlock",
      "pact-of-the-chain",
      "ritual",
      "uses-spell-icon:find-familiar-imp",
    ],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-chain"],
    }
  ),

  feature(
    "warlock-pact-chain-find-familiar-quasit",
    "Find Familiar: Quasit",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Summon a Quasit familiar through Pact of the Chain.",
    ["summon", "single-target-damage", "control"],
    ["Slashing", "Poison"],
    ["action"],
    ["none"],
    range18m,
    [
      "warlock",
      "pact-of-the-chain",
      "ritual",
      "uses-spell-icon:find-familiar-quasit",
    ],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-chain"],
    }
  ),

  feature(
    "warlock-pact-tome-guidance",
    "Guidance",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Pact of the Tome grants Guidance through the Book of Shadows.",
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    ["cantrip"],
    touch,
    ["warlock", "pact-of-the-tome", "uses-spell-icon:guidance"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  feature(
    "warlock-pact-tome-vicious-mockery",
    "Vicious Mockery",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Pact of the Tome grants Vicious Mockery through the Book of Shadows.",
    ["single-target-damage", "control"],
    ["Psychic"],
    ["action"],
    ["cantrip"],
    range18m,
    ["warlock", "pact-of-the-tome", "uses-spell-icon:vicious-mockery"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  feature(
    "warlock-pact-tome-thorn-whip",
    "Thorn Whip",
    "action",
    [availableTo(WARLOCK, 3)],
    true,
    "Pact of the Tome grants Thorn Whip through the Book of Shadows.",
    ["single-target-damage", "control"],
    ["Piercing"],
    ["action"],
    ["cantrip"],
    range9m,
    ["warlock", "pact-of-the-tome", "uses-spell-icon:thorn-whip"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  feature(
    "warlock-deepened-pact-blade-extra-attack",
    "Deepened Pact: Blade",
    "passive",
    [availableTo(WARLOCK, 5)],
    true,
    "Your Pact Weapon gains Extra Attack.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    melee,
    ["warlock", "deepened-pact", "pact-of-the-blade"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-blade"],
    }
  ),

  feature(
    "warlock-deepened-pact-chain-extra-attack",
    "Deepened Pact: Chain",
    "passive",
    [availableTo(WARLOCK, 5)],
    true,
    "Your familiar gains Extra Attack.",
    ["single-target-damage", "support-buff", "summon"],
    ["Variable"],
    ["passive"],
    ["none"],
    range18m,
    ["warlock", "deepened-pact", "pact-of-the-chain"],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-chain"],
    }
  ),

  feature(
    "warlock-deepened-pact-tome-animate-dead",
    "Deepened Pact: Animate Dead",
    "action",
    [availableTo(WARLOCK, 5)],
    true,
    "Pact of the Tome lets you cast Animate Dead once per Long Rest.",
    ["summon", "single-target-damage"],
    ["Necrotic"],
    ["action"],
    ["long-rest"],
    range18m,
    [
      "warlock",
      "deepened-pact",
      "pact-of-the-tome",
      "uses-spell-icon:animate-dead",
    ],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  feature(
    "warlock-deepened-pact-tome-haste",
    "Deepened Pact: Haste",
    "action",
    [availableTo(WARLOCK, 5)],
    true,
    "Pact of the Tome lets you cast Haste once per Long Rest.",
    ["support-buff", "mobility-positioning", "defense-protection"],
    [],
    ["action"],
    ["long-rest"],
    range18m,
    [
      "warlock",
      "deepened-pact",
      "pact-of-the-tome",
      "uses-spell-icon:haste",
    ],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  feature(
    "warlock-deepened-pact-tome-call-lightning",
    "Deepened Pact: Call Lightning",
    "action",
    [availableTo(WARLOCK, 5)],
    true,
    "Pact of the Tome lets you cast Call Lightning once per Long Rest.",
    ["area-damage"],
    ["Lightning"],
    ["action"],
    ["long-rest"],
    radiusRange("18m, 2m AoE", 18, "long", 2),
    [
      "warlock",
      "deepened-pact",
      "pact-of-the-tome",
      "uses-spell-icon:call-lightning",
    ],
    {
      displayGroup: pactGrantedGroup,
      requires: ["warlock-pact-of-the-tome"],
    }
  ),

  ...invocationDefinitions.map(makeInvocationFeature),

  feature(
    "warlock-invocation-armour-of-shadows-mage-armour",
    "Mage Armour",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by Armour of Shadows. Cast Mage Armour on yourself at will, without expending a Spell Slot.",
    ["defense-protection"],
    [],
    ["action"],
    ["none"],
    self,
    ["warlock", "invocation-granted-action", "uses-spell-icon:mage-armour"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-armour-of-shadows"],
    }
  ),

  feature(
    "warlock-invocation-beast-speech-speak-with-animals",
    "Speak with Animals",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by Beast Speech. Cast Speak with Animals on yourself at will, without expending a Spell Slot.",
    ["narrative-interaction", "investigation-world-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    [
      "warlock",
      "invocation-granted-action",
      "ritual",
      "uses-spell-icon:speak-with-animals",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-beast-speech"],
    }
  ),

  feature(
    "warlock-invocation-fiendish-vigour-false-life",
    "False Life",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by Fiendish Vigour. Cast False Life on yourself at will, without expending a Spell Slot.",
    ["defense-protection"],
    [],
    ["action"],
    ["none"],
    self,
    ["warlock", "invocation-granted-action", "uses-spell-icon:false-life"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-fiendish-vigour"],
    }
  ),

  feature(
    "warlock-invocation-mask-of-many-faces-disguise-self",
    "Disguise Self",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by Mask of Many Faces. Cast Disguise Self on yourself at will, without expending a Spell Slot.",
    ["narrative-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    [
      "warlock",
      "invocation-granted-action",
      "ritual",
      "uses-spell-icon:disguise-self",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-mask-of-many-faces"],
    }
  ),

  feature(
    "warlock-invocation-one-with-shadows-action",
    "One with Shadows",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by One with Shadows. Become Invisible while obscured.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["action"],
    ["none"],
    self,
    ["warlock", "invocation-granted-action"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-one-with-shadows"],
    }
  ),

  feature(
    "warlock-invocation-thief-of-five-fates-bane",
    "Bane",
    "action",
    [availableTo(WARLOCK, 2)],
    true,
    "Granted by Thief of Five Fates. Cast Bane once per Long Rest using a Warlock Spell Slot.",
    ["control"],
    [],
    ["action"],
    ["pact-magic-slot", "long-rest"],
    range9m,
    ["warlock", "invocation-granted-action", "uses-spell-icon:bane"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-thief-of-five-fates"],
    }
  ),

  feature(
    "warlock-invocation-sign-of-ill-omen-bestow-curse",
    "Bestow Curse",
    "action",
    [availableTo(WARLOCK, 5)],
    true,
    "Granted by Sign of Ill Omen. Cast Bestow Curse with a Warlock Spell Slot.",
    ["control", "single-target-damage"],
    ["Necrotic"],
    ["action"],
    ["pact-magic-slot"],
    touch,
    ["warlock", "invocation-granted-action", "uses-spell-icon:bestow-curse"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-sign-of-ill-omen"],
    }
  ),

  feature(
    "warlock-invocation-mire-the-mind-slow",
    "Slow",
    "action",
    [availableTo(WARLOCK, 5)],
    true,
    "Granted by Mire the Mind. Cast Slow with a Warlock Spell Slot.",
    ["control"],
    [],
    ["action"],
    ["pact-magic-slot"],
    radiusRange("18m, 6m AoE", 18, "long", 6),
    ["warlock", "invocation-granted-action", "uses-spell-icon:slow"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-mire-the-mind"],
    }
  ),

  feature(
    "warlock-invocation-book-of-ancient-secrets-ray-of-sickness",
    "Ray of Sickness",
    "action",
    [availableTo(WARLOCK, 7)],
    true,
    "Granted by Book of Ancient Secrets. Cast Ray of Sickness once per Long Rest without expending a Spell Slot.",
    ["single-target-damage", "control"],
    ["Poison"],
    ["action"],
    ["long-rest"],
    range18mSingle,
    ["warlock", "invocation-granted-action", "uses-spell-icon:ray-of-sickness"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-book-of-ancient-secrets"],
    }
  ),

  feature(
    "warlock-invocation-book-of-ancient-secrets-chromatic-orb",
    "Chromatic Orb",
    "action",
    [availableTo(WARLOCK, 7)],
    true,
    "Granted by Book of Ancient Secrets. Cast Chromatic Orb once per Long Rest without expending a Spell Slot.",
    ["single-target-damage"],
    ["Thunder", "Acid", "Cold", "Fire", "Lightning", "Poison"],
    ["action"],
    ["long-rest"],
    range18mSingle,
    ["warlock", "invocation-granted-action", "uses-spell-icon:chromatic-orb"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-book-of-ancient-secrets"],
    }
  ),

  feature(
    "warlock-invocation-book-of-ancient-secrets-silence",
    "Silence",
    "action",
    [availableTo(WARLOCK, 7)],
    true,
    "Granted by Book of Ancient Secrets. Cast Silence once per Long Rest without expending a Spell Slot.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["long-rest"],
    radiusRange("18m, 6m AoE", 18, "long", 6),
    [
      "warlock",
      "invocation-granted-action",
      "ritual",
      "uses-spell-icon:silence",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-book-of-ancient-secrets"],
    }
  ),

  feature(
    "warlock-invocation-dreadful-word-confusion",
    "Confusion",
    "action",
    [availableTo(WARLOCK, 7)],
    true,
    "Granted by Dreadful Word. Cast Confusion with a Warlock Spell Slot.",
    ["control"],
    [],
    ["action"],
    ["pact-magic-slot"],
    radiusRange("18m, 6m AoE", 18, "long", 6),
    ["warlock", "invocation-granted-action", "uses-spell-icon:confusion"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-dreadful-word"],
    }
  ),

  feature(
    "warlock-invocation-sculptor-of-flesh-polymorph",
    "Polymorph",
    "action",
    [availableTo(WARLOCK, 7)],
    true,
    "Granted by Sculptor of Flesh. Cast Polymorph with a Warlock Spell Slot.",
    ["control", "support-buff"],
    [],
    ["action"],
    ["pact-magic-slot"],
    range18mSingle,
    ["warlock", "invocation-granted-action", "uses-spell-icon:polymorph"],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-sculptor-of-flesh"],
    }
  ),

  feature(
    "warlock-invocation-minions-of-chaos-conjure-elemental",
    "Conjure Elemental",
    "action",
    [availableTo(WARLOCK, 9)],
    true,
    "Granted by Minions of Chaos. Cast Conjure Elemental with a Warlock Spell Slot.",
    ["summon", "single-target-damage", "control"],
    ["Variable"],
    ["action"],
    ["pact-magic-slot"],
    range18mSingle,
    [
      "warlock",
      "invocation-granted-action",
      "uses-spell-icon:conjure-elemental",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-minions-of-chaos"],
    }
  ),

  feature(
    "warlock-invocation-otherworldly-leap-enhance-leap",
    "Enhance Leap",
    "action",
    [availableTo(WARLOCK, 9)],
    true,
    "Granted by Otherworldly Leap. Cast Enhance Leap without expending a Spell Slot.",
    ["mobility-positioning"],
    [],
    ["action"],
    ["none"],
    touch,
    [
      "warlock",
      "invocation-granted-action",
      "ritual",
      "uses-spell-icon:enhance-leap",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-otherworldly-leap"],
    }
  ),

  feature(
    "warlock-invocation-whispers-of-the-grave-speak-with-dead",
    "Speak with Dead",
    "action",
    [availableTo(WARLOCK, 9)],
    true,
    "Granted by Whispers of the Grave. Cast Speak with Dead without expending a Warlock Spell Slot.",
    ["narrative-interaction", "investigation-world-interaction"],
    [],
    ["action"],
    ["none"],
    self,
    [
      "warlock",
      "invocation-granted-action",
      "ritual",
      "uses-spell-icon:speak-with-dead",
    ],
    {
      displayGroup: invocationGrantedGroup,
      requires: ["warlock-invocation-whispers-of-the-grave"],
    }
  ),

  feature(
    "warlock-archfey-fey-presence",
    "Fey Presence",
    "action",
    [availableTo(WARLOCK, 1, ARCHFEY)],
    true,
    "Charm or Frighten nearby foes with beguiling and disturbing fey magic. Recharges on Short Rest.",
    ["control"],
    [],
    ["action"],
    ["short-rest"],
    selfSmallRadius,
    ["warlock", "archfey"],
    {
      displayGroup: archfeyGroup,
    }
  ),

  feature(
    "warlock-archfey-misty-escape",
    "Misty Escape",
    "passive",
    [availableTo(WARLOCK, 6, ARCHFEY)],
    true,
    "Upon taking damage, you can become Invisible with Cloaking Mist. On your next turn, you can cast Misty Step, which breaks the invisibility.",
    [],
    [],
    ["passive"],
    ["none"],
    self,
    ["warlock", "archfey"],
    {
      displayGroup: archfeyGroup,
    }
  ),

  feature(
    "warlock-archfey-cloaking-mist",
    "Cloaking Mist",
    "reaction",
    [availableTo(WARLOCK, 6, ARCHFEY)],
    true,
    "After taking damage, become Invisible as part of Misty Escape.",
    ["defense-protection"],
    [],
    ["reaction"],
    ["short-rest"],
    self,
    ["warlock", "archfey", "granted-action"],
    {
      displayGroup: archfeyGroup,
      requires: ["warlock-archfey-misty-escape"],
    }
  ),

  feature(
    "warlock-archfey-misty-escape-step",
    "Misty Escape: Misty Step",
    "bonus-action",
    [availableTo(WARLOCK, 6, ARCHFEY)],
    true,
    "On your next turn after Cloaking Mist, teleport to an unoccupied space you can see.",
    ["mobility-positioning", "defense-protection"],
    [],
    ["bonus-action"],
    ["short-rest"],
    range18mSingle,
    ["warlock", "archfey", "granted-action", "uses-spell-icon:misty-step"],
    {
      displayGroup: archfeyGroup,
      requires: ["warlock-archfey-misty-escape"],
    }
  ),

  feature(
    "warlock-archfey-beguiling-defences",
    "Beguiling Defences",
    "passive",
    [availableTo(WARLOCK, 10, ARCHFEY)],
    true,
    "You cannot be Charmed.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["warlock", "archfey"],
    {
      displayGroup: archfeyGroup,
    }
  ),

  feature(
    "warlock-fiend-dark-ones-blessing",
    "Dark One's Blessing",
    "passive",
    [availableTo(WARLOCK, 1, FIEND)],
    true,
    "Whenever you reduce a hostile creature to 0 Hit Points, gain temporary hit points equal to your Charisma Modifier + Warlock level.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["warlock", "fiend"],
    {
      displayGroup: fiendGroup,
    }
  ),

  feature(
    "warlock-fiend-dark-ones-own-luck",
    "Dark One's Own Luck",
    "subclass-feature",
    [availableTo(WARLOCK, 6, FIEND)],
    true,
    "Call on your patron to change your fate and add 1d10 to an Ability Check.",
    ["support-buff", "narrative-interaction"],
    [],
    ["conditional"],
    ["short-rest"],
    self,
    ["warlock", "fiend"],
    {
      displayGroup: fiendGroup,
    }
  ),

  feature(
    "warlock-fiend-fiendish-resilience",
    "Fiendish Resilience",
    "subclass-feature",
    [availableTo(WARLOCK, 10, FIEND)],
    true,
    "Choose a damage type and become Resistant to it. You can pick a new damage type each Short Rest.",
    ["defense-protection"],
    ["Variable"],
    ["conditional"],
    ["short-rest"],
    self,
    ["warlock", "fiend"],
    {
      displayGroup: fiendGroup,
    }
  ),

  feature(
    "warlock-great-old-one-mortal-reminder",
    "Mortal Reminder",
    "passive",
    [availableTo(WARLOCK, 1, GREAT_OLD_ONE)],
    true,
    "When you land a Critical Hit, the target and nearby enemies must succeed a Wisdom Saving Throw or become Frightened.",
    ["control", "single-target-damage"],
    [],
    ["passive"],
    ["none"],
    selfMidRadius,
    ["warlock", "great-old-one"],
    {
      displayGroup: greatOldOneGroup,
    }
  ),

  feature(
    "warlock-great-old-one-entropic-ward",
    "Entropic Ward",
    "reaction",
    [availableTo(WARLOCK, 6, GREAT_OLD_ONE)],
    true,
    "Impose Disadvantage on an Attack Roll against you. If it misses, gain Advantage on your next Attack Roll against the attacker for 1 turn. Recharges on Short Rest.",
    ["defense-protection", "support-buff"],
    [],
    ["reaction"],
    ["short-rest"],
    range18mSingle,
    ["warlock", "great-old-one"],
    {
      displayGroup: greatOldOneGroup,
    }
  ),

  feature(
    "warlock-great-old-one-thought-shield-psychic-resistance",
    "Thought Shield: Psychic Resistance",
    "passive",
    [availableTo(WARLOCK, 10, GREAT_OLD_ONE)],
    true,
    "Gain Resistance to Psychic damage.",
    ["defense-protection"],
    ["Psychic"],
    ["passive"],
    ["none"],
    self,
    ["warlock", "great-old-one"],
    {
      displayGroup: greatOldOneGroup,
    }
  ),

  feature(
    "warlock-great-old-one-thought-shield-psychic-reflection",
    "Thought Shield: Psychic Reflection",
    "passive",
    [availableTo(WARLOCK, 10, GREAT_OLD_ONE)],
    true,
    "When you take Psychic damage, your attacker takes the same damage.",
    ["single-target-damage", "defense-protection"],
    ["Psychic"],
    ["conditional"],
    ["none"],
    range18mSingle,
    ["warlock", "great-old-one"],
    {
      displayGroup: greatOldOneGroup,
    }
  ),

  feature(
    "warlock-hexblade-hex-warrior",
    "Hex Warrior",
    "passive",
    [availableTo(WARLOCK, 1, HEXBLADE)],
    true,
    "Gain proficiency with Medium Armour, Shields, and Martial Weapons. You also gain Bind Hexed Weapon.",
    [],
    [],
    ["passive"],
    ["none"],
    self,
    ["warlock", "hexblade"],
    {
      displayGroup: hexbladeGroup,
    }
  ),

  feature(
    "warlock-hexblade-bind-hexed-weapon",
    "Bind Hexed Weapon",
    "action",
    [availableTo(WARLOCK, 1, HEXBLADE)],
    true,
    "Bind to your main hand weapon. Its damage becomes magical, you cannot drop or throw it, and you become Proficient with it if you were not already.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["none"],
    melee,
    ["warlock", "hexblade", "class-action"],
    {
      displayGroup: hexbladeGroup,
      requires: ["warlock-hexblade-hex-warrior"],
    }
  ),

  feature(
    "warlock-hexblade-hexblades-curse",
    "Hexblade's Curse",
    "bonus-action",
    [availableTo(WARLOCK, 1, HEXBLADE)],
    true,
    "Curse a target. Your damage rolls against it gain a bonus equal to your Proficiency Bonus, your critical threshold is reduced by 1, and you regain hit points if it dies. Recharges on Short Rest.",
    ["single-target-damage", "support-buff", "healing"],
    ["Weapon"],
    ["bonus-action"],
    ["short-rest"],
    range18mSingle,
    ["warlock", "hexblade", "class-action"],
    {
      displayGroup: hexbladeGroup,
    }
  ),

  feature(
    "warlock-hexblade-accursed-spectre",
    "Accursed Spectre",
    "reaction",
    [availableTo(WARLOCK, 6, HEXBLADE)],
    true,
    "Raise an Accursed Spectre from the soul of a fallen cursed target to fight by your side.",
    ["summon", "single-target-damage", "control"],
    ["Necrotic"],
    ["reaction"],
    ["none"],
    range18mSingle,
    ["warlock", "hexblade"],
    {
      displayGroup: hexbladeGroup,
    }
  ),

  feature(
    "warlock-hexblade-armour-of-hexes",
    "Armour of Hexes",
    "reaction",
    [availableTo(WARLOCK, 10, HEXBLADE)],
    true,
    "When a creature cursed by Hexblade's Curse attacks you, potentially nullify the attack as a reaction.",
    ["defense-protection"],
    [],
    ["reaction"],
    ["none"],
    range18mSingle,
    ["warlock", "hexblade"],
    {
      displayGroup: hexbladeGroup,
    }
  ),
];

const invocationIconEntries = Object.fromEntries(
  invocationDefinitions.map((entry) => [
    `warlock-invocation-${entry.idBase}`,
    `Passive_Warlock_Invocation_${entry.idBase}.png`,
  ])
);

export const warlockClassModule: ClassFeatureModule = {
  className: "Warlock",
  defaultTabLabel: "Warlock Features",
  subclassTabLabels: {
    [ARCHFEY]: "Archfey Features",
    [FIEND]: "Fiend Features",
    [GREAT_OLD_ONE]: "Great Old One Features",
    [HEXBLADE]: "Hexblade Features",
  },
  features: warlockFeatures,
  iconFileByFeatureId: {
    "warlock-spellcasting": "Passive_Warlock_PactMagic.png",
    "warlock-mystic-arcanum": "Passive_Warlock_MysticArcanum.png",

    "warlock-pact-magic-level-1": "Passive_Warlock_PactMagic.png",
    "warlock-pact-magic-level-2": "Passive_Warlock_PactMagic.png",
    "warlock-pact-magic-level-3": "Passive_Warlock_PactMagic.png",
    "warlock-pact-magic-level-4": "Passive_Warlock_PactMagic.png",
    "warlock-pact-magic-level-5-two-slots": "Passive_Warlock_PactMagic.png",
    "warlock-pact-magic-level-5-three-slots": "Passive_Warlock_PactMagic.png",

    "warlock-pact-of-the-blade": "Passive_Warlock_PactOfTheBlade.png",
    "warlock-pact-of-the-chain": "Passive_Warlock_PactOfTheChain.png",
    "warlock-pact-of-the-tome": "Passive_Warlock_PactOfTheTome.png",

    "warlock-pact-blade-bind-pact-weapon":
      "Action_Warlock_BindPactWeapon.png",
    "warlock-pact-blade-summon-pact-weapon":
      "Action_Warlock_SummonPactWeapon.png",
    "warlock-pact-chain-find-familiar": "Spell_Conjuration_FindFamiliar.png",
    "warlock-pact-chain-find-familiar-imp":
      "Spell_Conjuration_FindFamiliarImp.png",
    "warlock-pact-chain-find-familiar-quasit":
      "Spell_Conjuration_FindFamiliarQuasit.png",
    "warlock-pact-tome-guidance": "Spell_Divination_Guidance.png",
    "warlock-pact-tome-vicious-mockery":
      "Spell_Enchantment_ViciousMockery.png",
    "warlock-pact-tome-thorn-whip": "Spell_Transmutation_ThornWhip.png",

    "warlock-deepened-pact-blade-extra-attack": "Passive_ExtraAttack.png",
    "warlock-deepened-pact-chain-extra-attack": "Passive_ExtraAttack.png",
    "warlock-deepened-pact-tome-animate-dead":
      "Spell_Necromancy_AnimateDead.png",
    "warlock-deepened-pact-tome-haste": "Spell_Transmutation_Haste.png",
    "warlock-deepened-pact-tome-call-lightning":
      "Spell_Conjuration_CallLightning.png",

    "warlock-invocation-armour-of-shadows-mage-armour":
      "Spell_Abjuration_MageArmour.png",
    "warlock-invocation-beast-speech-speak-with-animals":
      "Spell_Divination_SpeakWithAnimals.png",
    "warlock-invocation-fiendish-vigour-false-life":
      "Spell_Necromancy_FalseLife.png",
    "warlock-invocation-mask-of-many-faces-disguise-self":
      "Spell_Illusion_DisguiseSelf.png",
    "warlock-invocation-one-with-shadows-action":
      "Action_Warlock_Invocation_OneWithShadows.png",
    "warlock-invocation-thief-of-five-fates-bane":
      "Spell_Enchantment_Bane.png",
    "warlock-invocation-sign-of-ill-omen-bestow-curse":
      "Spell_Necromancy_BestowCurse.png",
    "warlock-invocation-mire-the-mind-slow":
      "Spell_Transmutation_Slow.png",
    "warlock-invocation-book-of-ancient-secrets-ray-of-sickness":
      "Spell_Necromancy_RayOfSickness.png",
    "warlock-invocation-book-of-ancient-secrets-chromatic-orb":
      "Spell_Evocation_ChromaticOrb.png",
    "warlock-invocation-book-of-ancient-secrets-silence":
      "Spell_Illusion_Silence.png",
    "warlock-invocation-dreadful-word-confusion":
      "Spell_Enchantment_Confusion.png",
    "warlock-invocation-sculptor-of-flesh-polymorph":
      "Spell_Transmutation_Polymorph.png",
    "warlock-invocation-minions-of-chaos-conjure-elemental":
      "Spell_Conjuration_ConjureElemental.png",
    "warlock-invocation-otherworldly-leap-enhance-leap":
      "Spell_Transmutation_EnhanceLeap.png",
    "warlock-invocation-whispers-of-the-grave-speak-with-dead":
      "Spell_Necromancy_SpeakWithDead.png",

    "warlock-archfey-fey-presence": "Action_Warlock_Archfey_FeyPresence.png",
    "warlock-archfey-misty-escape": "Passive_Warlock_Archfey_MistyEscape.png",
    "warlock-archfey-cloaking-mist": "Reaction_Warlock_Archfey_CloakingMist.png",
    "warlock-archfey-misty-escape-step": "Spell_Conjuration_MistyStep.png",
    "warlock-archfey-beguiling-defences":
      "Passive_Warlock_Archfey_BeguilingDefences.png",

    "warlock-fiend-dark-ones-blessing":
      "Passive_Warlock_Fiend_DarkOnesBlessing.png",
    "warlock-fiend-dark-ones-own-luck":
      "Action_Warlock_Fiend_DarkOnesOwnLuck.png",
    "warlock-fiend-fiendish-resilience":
      "Passive_Warlock_Fiend_FiendishResilience.png",

    "warlock-great-old-one-mortal-reminder":
      "Passive_Warlock_GreatOldOne_MortalReminder.png",
    "warlock-great-old-one-entropic-ward":
      "Reaction_Warlock_GreatOldOne_EntropicWard.png",
    "warlock-great-old-one-thought-shield-psychic-resistance":
      "Passive_Warlock_GreatOldOne_ThoughtShieldPsychicResistance.png",
    "warlock-great-old-one-thought-shield-psychic-reflection":
      "Passive_Warlock_GreatOldOne_ThoughtShieldPsychicReflection.png",

    "warlock-hexblade-hex-warrior": "Passive_Warlock_Hexblade_HexWarrior.png",
    "warlock-hexblade-bind-hexed-weapon":
      "Action_Warlock_Hexblade_BindHexedWeapon.png",
    "warlock-hexblade-hexblades-curse":
      "Action_Warlock_Hexblade_HexbladesCurse.png",
    "warlock-hexblade-accursed-spectre":
      "Reaction_Warlock_Hexblade_AccursedSpectre.png",
    "warlock-hexblade-armour-of-hexes":
      "Reaction_Warlock_Hexblade_ArmourOfHexes.png",

    ...invocationIconEntries,
  },
};