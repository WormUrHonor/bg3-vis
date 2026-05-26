import type { AbilityRole, DamageType } from "../bg3Spells";
import type { ClassFeatureModule } from "./classFeatureTypes";
import {
  availableTo,
  coneRange,
  feature,
  melee,
  radiusRange,
  range18m,
  self,
  touch,
  weaponRange,
} from "./classFeatureHelpers";

const PALADIN = "Paladin" as const;

const DEVOTION = "Oath of Devotion";
const ANCIENTS = "Oath of the Ancients";
const CROWN = "Oath of the Crown";
const VENGEANCE = "Oath of Vengeance";
const OATHBREAKER = "Oathbreaker";

const fightingStyleChoice = {
  id: "paladin-fighting-style",
  label: "Fighting Style",
  max: 1,
};

const coreGroup = {
  id: "paladin-core",
  label: "Core Paladin Features",
  order: 10,
};

const fightingStyleGroup = {
  id: "paladin-fighting-styles",
  label: "Fighting Style Choice",
  order: 15,
};

const devotionGroup = {
  id: "paladin-devotion",
  label: "Oath of Devotion Features",
  order: 20,
};

const ancientsGroup = {
  id: "paladin-ancients",
  label: "Oath of the Ancients Features",
  order: 30,
};

const crownGroup = {
  id: "paladin-crown",
  label: "Oath of the Crown Features",
  order: 40,
};

const vengeanceGroup = {
  id: "paladin-vengeance",
  label: "Oath of Vengeance Features",
  order: 50,
};

const oathbreakerGroup = {
  id: "paladin-oathbreaker",
  label: "Oathbreaker Features",
  order: 60,
};

const oathSpellGroup = {
  id: "paladin-oath-spells",
  label: "Always Prepared Oath Spells",
  order: 900,
};

type FightingStyleDefinition = {
  idBase: string;
  name: string;
  description: string;
  roles: AbilityRole[];
};

const fightingStyleDefinitions: FightingStyleDefinition[] = [
  {
    idBase: "defence",
    name: "Defence",
    description: "Gain a +1 bonus to Armour Class while wearing armour.",
    roles: ["defense-protection"],
  },
  {
    idBase: "duelling",
    name: "Duelling",
    description:
      "When wielding a melee weapon that is not Two-Handed in one hand and no weapon in the other, deal 2 additional damage with that weapon.",
    roles: ["single-target-damage"],
  },
  {
    idBase: "great-weapon-fighting",
    name: "Great Weapon Fighting",
    description:
      "When you roll a 1 or 2 on a damage die for an attack with a Two-Handed melee weapon, that die is rerolled once.",
    roles: ["single-target-damage"],
  },
  {
    idBase: "protection",
    name: "Protection",
    description:
      "When you have a Shield, impose Disadvantage on an enemy who attacks one of your allies within 1.5m.",
    roles: ["defense-protection"],
  },
];

function makeFightingStyle(style: FightingStyleDefinition) {
  return feature(
    `paladin-fighting-style-${style.idBase}`,
    style.name,
    "passive",
    [availableTo(PALADIN, 2)],
    false,
    style.description,
    style.roles,
    [],
    ["passive"],
    ["none"],
    self,
    ["paladin", "fighting-style"],
    {
      choiceGroup: fightingStyleChoice,
      displayGroup: fightingStyleGroup,
    }
  );
}

type OathSpellDefinition = {
  idBase: string;
  name: string;
  subclass: string;
  minLevel: number;
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: Parameters<typeof feature>[8];
  resources?: Parameters<typeof feature>[9];
  range: Parameters<typeof feature>[10];
  tags?: string[];
};

function makeOathSpell(spellDef: OathSpellDefinition) {
  return feature(
    `paladin-${spellDef.idBase}`,
    spellDef.name,
    "subclass-feature",
    [availableTo(PALADIN, spellDef.minLevel, spellDef.subclass)],
    true,
    spellDef.description,
    spellDef.roles,
    spellDef.damageTypes,
    spellDef.actions,
    spellDef.resources ?? ["spell-slot"],
    spellDef.range,
    ["paladin", "oath-spell", ...(spellDef.tags ?? [])],
    {
      displayGroup: oathSpellGroup,
    }
  );
}

const oathSpellDefinitions: OathSpellDefinition[] = [
  {
    idBase: "devotion-protection-from-evil-and-good",
    name: "Protection from Evil and Good",
    subclass: DEVOTION,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Protect a creature against aberrations, celestials, elementals, fey, fiends, and undead.",
    roles: ["defense-protection", "support-buff"],
    damageTypes: [],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "devotion-sanctuary",
    name: "Sanctuary",
    subclass: DEVOTION,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Ward yourself or an ally from enemy attacks until the warded creature attacks or harms another creature.",
    roles: ["defense-protection"],
    damageTypes: [],
    actions: ["bonus-action"],
    range: range18m,
  },
  {
    idBase: "devotion-lesser-restoration",
    name: "Lesser Restoration",
    subclass: DEVOTION,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Cure a creature of disease, poison, paralysis, or blindness.",
    roles: ["healing", "support-buff"],
    damageTypes: [],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "devotion-silence",
    name: "Silence",
    subclass: DEVOTION,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Create a sound-proof sphere that Silences creatures and prevents Thunder damage inside it.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    range: radiusRange("18m, 6m AoE", 18, "long", 6),
    tags: ["concentration", "ritual"],
  },
  {
    idBase: "devotion-remove-curse",
    name: "Remove Curse",
    subclass: DEVOTION,
    minLevel: 9,
    description: "Always Prepared Oath spell. Remove curses from a creature or object.",
    roles: ["support-buff", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "devotion-beacon-of-hope",
    name: "Beacon of Hope",
    subclass: DEVOTION,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Bolster allies with hope, improving healing and mental resilience.",
    roles: ["healing", "support-buff", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    range: radiusRange("self, aura", 0, "self"),
    tags: ["concentration"],
  },

  {
    idBase: "ancients-speak-with-animals",
    name: "Speak with Animals",
    subclass: ANCIENTS,
    minLevel: 3,
    description: "Always Prepared Oath spell. Communicate with beasts.",
    roles: ["narrative-interaction"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: self,
    tags: ["ritual"],
  },
  {
    idBase: "ancients-ensnaring-strike",
    name: "Ensnaring Strike",
    subclass: ANCIENTS,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Entangle a target with vines after a weapon attack.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    range: weaponRange,
    tags: ["concentration"],
  },
  {
    idBase: "ancients-misty-step",
    name: "Misty Step",
    subclass: ANCIENTS,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Teleport to an unoccupied space you can see.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["bonus-action"],
    range: range18m,
  },
  {
    idBase: "ancients-moonbeam",
    name: "Moonbeam",
    subclass: ANCIENTS,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Call down a beam of radiant moonlight that damages creatures in its area.",
    roles: ["area-damage", "control"],
    damageTypes: ["Radiant"],
    actions: ["action"],
    range: radiusRange("18m, 2m AoE", 18, "long", 2),
    tags: ["concentration"],
  },
  {
    idBase: "ancients-protection-from-energy",
    name: "Protection from Energy",
    subclass: ANCIENTS,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Grant Resistance to Acid, Cold, Fire, Lightning, or Thunder damage.",
    roles: ["defense-protection", "support-buff"],
    damageTypes: ["Variable"],
    actions: ["action"],
    range: touch,
    tags: ["concentration"],
  },
  {
    idBase: "ancients-plant-growth",
    name: "Plant Growth",
    subclass: ANCIENTS,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Make plants burst from the ground and slow creatures in the area.",
    roles: ["control"],
    damageTypes: [],
    actions: ["action"],
    range: radiusRange("18m, 6m AoE", 18, "long", 6),
  },

  {
    idBase: "crown-command",
    name: "Command",
    subclass: CROWN,
    minLevel: 3,
    description: "Always Prepared Oath spell. Command a creature to flee, approach, drop, halt, or grovel.",
    roles: ["control"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
  },
  {
    idBase: "crown-compelled-duel",
    name: "Compelled Duel",
    subclass: CROWN,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Compel a creature to focus its attention on you.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["bonus-action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "crown-warding-bond",
    name: "Warding Bond",
    subclass: CROWN,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Ward an ally, increasing their defences while you share their damage.",
    roles: ["defense-protection", "support-buff"],
    damageTypes: [],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "crown-spiritual-weapon",
    name: "Spiritual Weapon",
    subclass: CROWN,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Summon a floating weapon that attacks nearby enemies.",
    roles: ["summon", "single-target-damage"],
    damageTypes: ["Force"],
    actions: ["bonus-action"],
    range: range18m,
  },
  {
    idBase: "crown-spirit-guardians",
    name: "Spirit Guardians",
    subclass: CROWN,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Call forth spirits that damage nearby enemies and slow them.",
    roles: ["area-damage", "control", "defense-protection"],
    damageTypes: ["Radiant", "Necrotic"],
    actions: ["action"],
    range: radiusRange("self, 3m AoE", 3, "melee", 3),
    tags: ["concentration"],
  },
  {
    idBase: "crown-crusaders-mantle",
    name: "Crusader's Mantle",
    subclass: CROWN,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Allies in the aura deal additional Radiant damage with weapon attacks.",
    roles: ["support-buff", "single-target-damage"],
    damageTypes: ["Radiant"],
    actions: ["action"],
    range: radiusRange("self, aura", 0, "self"),
    tags: ["concentration"],
  },

  {
    idBase: "vengeance-bane",
    name: "Bane",
    subclass: VENGEANCE,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Curse enemies so their attacks and saving throws are reduced.",
    roles: ["control", "support-buff"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "vengeance-hunters-mark",
    name: "Hunter's Mark",
    subclass: VENGEANCE,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Mark a creature so your weapon attacks deal additional damage to it.",
    roles: ["single-target-damage", "support-buff"],
    damageTypes: ["Weapon"],
    actions: ["bonus-action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "vengeance-hold-person",
    name: "Hold Person",
    subclass: VENGEANCE,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Paralyse a humanoid target.",
    roles: ["control"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "vengeance-misty-step",
    name: "Misty Step",
    subclass: VENGEANCE,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Teleport to an unoccupied space you can see.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["bonus-action"],
    range: range18m,
  },
  {
    idBase: "vengeance-haste",
    name: "Haste",
    subclass: VENGEANCE,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Grant a creature extra speed, Armour Class, Dexterity Saving Throw bonus, and an additional action.",
    roles: ["support-buff", "mobility-positioning", "single-target-damage"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "vengeance-protection-from-energy",
    name: "Protection from Energy",
    subclass: VENGEANCE,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Grant Resistance to Acid, Cold, Fire, Lightning, or Thunder damage.",
    roles: ["defense-protection", "support-buff"],
    damageTypes: ["Variable"],
    actions: ["action"],
    range: touch,
    tags: ["concentration"],
  },

  {
    idBase: "oathbreaker-hellish-rebuke",
    name: "Hellish Rebuke",
    subclass: OATHBREAKER,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. React to damage by surrounding the attacker in hellish flames.",
    roles: ["single-target-damage"],
    damageTypes: ["Fire"],
    actions: ["reaction"],
    range: range18m,
  },
  {
    idBase: "oathbreaker-inflict-wounds",
    name: "Inflict Wounds",
    subclass: OATHBREAKER,
    minLevel: 3,
    description:
      "Always Prepared Oath spell. Make a melee spell attack that deals Necrotic damage.",
    roles: ["single-target-damage"],
    damageTypes: ["Necrotic"],
    actions: ["action"],
    range: touch,
  },
  {
    idBase: "oathbreaker-crown-of-madness",
    name: "Crown of Madness",
    subclass: OATHBREAKER,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Induce madness in a humanoid and force it to attack nearby creatures.",
    roles: ["control"],
    damageTypes: [],
    actions: ["action"],
    range: range18m,
    tags: ["concentration"],
  },
  {
    idBase: "oathbreaker-darkness",
    name: "Darkness",
    subclass: OATHBREAKER,
    minLevel: 5,
    description:
      "Always Prepared Oath spell. Create magical darkness that Heavily Obscures and Blinds creatures within.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    range: radiusRange("18m, 5m AoE", 18, "long", 5),
    tags: ["concentration"],
  },
  {
    idBase: "oathbreaker-bestow-curse",
    name: "Bestow Curse",
    subclass: OATHBREAKER,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Curse a creature with a harmful magical effect.",
    roles: ["control", "single-target-damage"],
    damageTypes: ["Necrotic"],
    actions: ["action"],
    range: touch,
    tags: ["concentration"],
  },
  {
    idBase: "oathbreaker-animate-dead",
    name: "Animate Dead",
    subclass: OATHBREAKER,
    minLevel: 9,
    description:
      "Always Prepared Oath spell. Animate a corpse as an undead servant.",
    roles: ["summon", "single-target-damage"],
    damageTypes: ["Variable"],
    actions: ["action"],
    range: range18m,
  },
];

const paladinFeatures = [
  feature(
    "paladin-lay-on-hands-charges-3",
    "Lay on Hands Charges: 3",
    "resource-feature",
    [availableTo(PALADIN, 1, 3)],
    true,
    "You have 3 Lay on Hands Charges. They recharge on Long Rest.",
    ["healing"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["paladin", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-lay-on-hands-charges-4",
    "Lay on Hands Charges: 4",
    "resource-feature",
    [availableTo(PALADIN, 4, 9)],
    true,
    "You have 4 Lay on Hands Charges. They recharge on Long Rest.",
    ["healing"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["paladin", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-lay-on-hands-charges-5",
    "Lay on Hands Charges: 5",
    "resource-feature",
    [availableTo(PALADIN, 10)],
    true,
    "You have 5 Lay on Hands Charges. They recharge on Long Rest.",
    ["healing"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["paladin", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-channel-oath-charge",
    "Channel Oath Charge",
    "resource-feature",
    [availableTo(PALADIN, 1)],
    true,
    "Use Channel Oath abilities granted by your Paladin oath. Channel Oath recharges on Short Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["short-rest"],
    self,
    ["paladin", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-divine-sense",
    "Divine Sense",
    "bonus-action",
    [availableTo(PALADIN, 1)],
    true,
    "Gain Advantage on Attack Rolls against celestials, fiends, and undead. Recharges on Short Rest.",
    ["support-buff", "single-target-damage"],
    [],
    ["bonus-action"],
    ["short-rest"],
    self,
    ["paladin", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-lay-on-hands",
    "Lay on Hands",
    "action",
    [availableTo(PALADIN, 1)],
    true,
    "Use your blessed touch to heal a creature or cure diseases and poisons.",
    ["healing", "support-buff"],
    [],
    ["action"],
    ["class-resource"],
    touch,
    ["paladin", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(PALADIN, 2)],
    true,
    "Prepare Paladin spells using Charisma as your spellcasting ability. Prepared spell limits are handled by the spell-choice rule system.",
    ["support-buff"],
    [],
    ["passive"],
    ["none"],
    self,
    ["paladin", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-divine-smite",
    "Divine Smite",
    "action",
    [availableTo(PALADIN, 2)],
    true,
    "Spend a spell slot to deal additional Radiant damage with a weapon attack. Damage increases against fiends and undead.",
    ["single-target-damage"],
    ["Weapon", "Radiant"],
    ["action"],
    ["spell-slot"],
    melee,
    ["paladin", "smite"],
    {
      displayGroup: coreGroup,
    }
  ),

  ...fightingStyleDefinitions.map(makeFightingStyle),

  feature(
    "paladin-divine-health",
    "Divine Health",
    "passive",
    [availableTo(PALADIN, 3)],
    true,
    "Divine magic prevents disease from affecting you.",
    ["defense-protection"],
    [],
    ["passive"],
    ["none"],
    self,
    ["paladin", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-extra-attack",
    "Extra Attack",
    "passive",
    [availableTo(PALADIN, 5)],
    true,
    "Make an additional free attack after making an unarmed or weapon attack.",
    ["single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["paladin", "core"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-aura-of-protection",
    "Aura of Protection",
    "passive",
    [availableTo(PALADIN, 6)],
    true,
    "You and nearby allies gain a bonus to Saving Throws equal to your Charisma modifier while you are conscious.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "aura"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-aura-of-courage",
    "Aura of Courage",
    "passive",
    [availableTo(PALADIN, 10)],
    true,
    "You and nearby allies cannot be Frightened while you are conscious.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "aura"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-improved-divine-smite",
    "Improved Divine Smite",
    "passive",
    [availableTo(PALADIN, 11)],
    true,
    "Your melee weapon attacks deal an additional 1d8 Radiant damage.",
    ["single-target-damage"],
    ["Weapon", "Radiant"],
    ["passive"],
    ["none"],
    melee,
    ["paladin", "smite"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "paladin-devotion-holy-rebuke",
    "Holy Rebuke",
    "action",
    [availableTo(PALADIN, 1, DEVOTION)],
    true,
    "Grant a vengeful aura that deals Radiant damage to creatures that hit the target with a melee attack.",
    ["support-buff", "single-target-damage"],
    ["Radiant"],
    ["action"],
    ["class-resource"],
    touch,
    ["paladin", "devotion", "channel-oath"],
    {
      displayGroup: devotionGroup,
    }
  ),

  feature(
    "paladin-devotion-sacred-weapon",
    "Sacred Weapon",
    "action",
    [availableTo(PALADIN, 3, DEVOTION)],
    true,
    "Turn your weapon into a Sacred Weapon, increasing its chance to hit and causing it to emit bright light.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["action"],
    ["class-resource"],
    self,
    ["paladin", "devotion", "channel-oath"],
    {
      displayGroup: devotionGroup,
    }
  ),

  feature(
    "paladin-devotion-turn-the-unholy",
    "Turn the Unholy",
    "action",
    [availableTo(PALADIN, 3, DEVOTION)],
    true,
    "Turn nearby undead and fiends, forcing them to flee and preventing them from approaching.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "devotion", "channel-oath"],
    {
      displayGroup: devotionGroup,
    }
  ),

  feature(
    "paladin-devotion-aura-of-devotion",
    "Aura of Devotion",
    "passive",
    [availableTo(PALADIN, 7, DEVOTION)],
    true,
    "You and nearby allies cannot be Charmed while you are conscious.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "devotion", "aura"],
    {
      displayGroup: devotionGroup,
    }
  ),

  feature(
    "paladin-ancients-healing-radiance",
    "Healing Radiance",
    "bonus-action",
    [availableTo(PALADIN, 1, ANCIENTS)],
    true,
    "Heal yourself and nearby allies, then heal them again on the next turn.",
    ["healing", "support-buff"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "ancients", "channel-oath"],
    {
      displayGroup: ancientsGroup,
    }
  ),

  feature(
    "paladin-ancients-natures-wrath",
    "Nature's Wrath",
    "action",
    [availableTo(PALADIN, 3, ANCIENTS)],
    true,
    "Invoke primaeval forces to restrain an enemy.",
    ["control"],
    [],
    ["action"],
    ["class-resource"],
    range18m,
    ["paladin", "ancients", "channel-oath"],
    {
      displayGroup: ancientsGroup,
    }
  ),

  feature(
    "paladin-ancients-turn-the-faithless",
    "Turn the Faithless",
    "action",
    [availableTo(PALADIN, 3, ANCIENTS)],
    true,
    "Turn nearby fey and fiends.",
    ["control", "defense-protection"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "ancients", "channel-oath"],
    {
      displayGroup: ancientsGroup,
    }
  ),

  feature(
    "paladin-ancients-aura-of-warding",
    "Aura of Warding",
    "passive",
    [availableTo(PALADIN, 7, ANCIENTS)],
    true,
    "You and nearby allies take half damage from spells while you are conscious.",
    ["defense-protection", "support-buff"],
    [],
    ["passive"],
    ["none"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "ancients", "aura"],
    {
      displayGroup: ancientsGroup,
    }
  ),

  feature(
    "paladin-crown-righteous-clarity",
    "Righteous Clarity",
    "bonus-action",
    [availableTo(PALADIN, 1, CROWN)],
    true,
    "Grant yourself or an ally an additional bonus to Attack Rolls equal to the target's proficiency bonus.",
    ["support-buff", "single-target-damage"],
    [],
    ["bonus-action"],
    ["class-resource"],
    range18m,
    ["paladin", "crown", "channel-oath"],
    {
      displayGroup: crownGroup,
    }
  ),

  feature(
    "paladin-crown-champion-challenge",
    "Champion Challenge",
    "bonus-action",
    [availableTo(PALADIN, 3, CROWN)],
    true,
    "Challenge nearby enemies, compelling them to attack only you and giving their attacks against other targets Disadvantage.",
    ["control", "defense-protection"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "crown", "channel-oath"],
    {
      displayGroup: crownGroup,
    }
  ),

  feature(
    "paladin-crown-turn-the-tide",
    "Turn the Tide",
    "bonus-action",
    [availableTo(PALADIN, 3, CROWN)],
    true,
    "Shout out and heal nearby non-enemy creatures.",
    ["healing", "support-buff"],
    [],
    ["bonus-action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "crown", "channel-oath"],
    {
      displayGroup: crownGroup,
    }
  ),

  feature(
    "paladin-crown-divine-allegiance",
    "Divine Allegiance",
    "reaction",
    [availableTo(PALADIN, 7, CROWN)],
    true,
    "When an ally within 1.5m takes damage, use your Reaction to substitute your own health for theirs.",
    ["defense-protection", "healing"],
    ["Radiant"],
    ["reaction"],
    ["none"],
    melee,
    ["paladin", "crown"],
    {
      displayGroup: crownGroup,
    }
  ),

  feature(
    "paladin-vengeance-inquisitors-might",
    "Inquisitor's Might",
    "bonus-action",
    [availableTo(PALADIN, 1, VENGEANCE)],
    true,
    "You or an ally's weapon attacks deal additional Radiant damage and can Daze enemies.",
    ["support-buff", "single-target-damage", "control"],
    ["Radiant"],
    ["bonus-action"],
    ["class-resource"],
    range18m,
    ["paladin", "vengeance", "channel-oath"],
    {
      displayGroup: vengeanceGroup,
    }
  ),

  feature(
    "paladin-vengeance-abjure-enemy",
    "Abjure Enemy",
    "action",
    [availableTo(PALADIN, 3, VENGEANCE)],
    true,
    "Frighten an enemy. They have Disadvantage on ability checks and Attack Rolls, and cannot move.",
    ["control"],
    [],
    ["action"],
    ["class-resource"],
    range18m,
    ["paladin", "vengeance", "channel-oath"],
    {
      displayGroup: vengeanceGroup,
    }
  ),

  feature(
    "paladin-vengeance-vow-of-enmity",
    "Vow of Enmity",
    "bonus-action",
    [availableTo(PALADIN, 3, VENGEANCE)],
    true,
    "Gain Advantage on Attack Rolls against an enemy.",
    ["support-buff", "single-target-damage"],
    [],
    ["bonus-action"],
    ["class-resource"],
    range18m,
    ["paladin", "vengeance", "channel-oath"],
    {
      displayGroup: vengeanceGroup,
    }
  ),

  feature(
    "paladin-vengeance-relentless-avenger",
    "Relentless Avenger",
    "passive",
    [availableTo(PALADIN, 7, VENGEANCE)],
    true,
    "If you hit an enemy with an Opportunity Attack, your movement speed increases on your next turn.",
    ["mobility-positioning", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["paladin", "vengeance"],
    {
      displayGroup: vengeanceGroup,
    }
  ),

  feature(
    "paladin-oathbreaker-spiteful-suffering",
    "Spiteful Suffering",
    "action",
    [availableTo(PALADIN, 1, OATHBREAKER)],
    true,
    "Steep an enemy in darkness. The target takes Necrotic damage each turn and Attack Rolls against it have Advantage.",
    ["single-target-damage", "support-buff", "control"],
    ["Necrotic"],
    ["action"],
    ["class-resource"],
    range18m,
    ["paladin", "oathbreaker", "channel-oath"],
    {
      displayGroup: oathbreakerGroup,
    }
  ),

  feature(
    "paladin-oathbreaker-control-undead",
    "Control Undead",
    "action",
    [availableTo(PALADIN, 3, OATHBREAKER)],
    true,
    "Gain control over an undead creature. It follows you and attacks your enemies.",
    ["control", "summon"],
    [],
    ["action"],
    ["class-resource"],
    range18m,
    ["paladin", "oathbreaker", "channel-oath"],
    {
      displayGroup: oathbreakerGroup,
    }
  ),

  feature(
    "paladin-oathbreaker-dreadful-aspect",
    "Dreadful Aspect",
    "action",
    [availableTo(PALADIN, 3, OATHBREAKER)],
    true,
    "Let your darkest emotions burst forth as a menacing pulse to Frighten nearby enemies.",
    ["control"],
    [],
    ["action"],
    ["class-resource"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "oathbreaker", "channel-oath"],
    {
      displayGroup: oathbreakerGroup,
    }
  ),

  feature(
    "paladin-oathbreaker-aura-of-hate",
    "Aura of Hate",
    "passive",
    [availableTo(PALADIN, 7, OATHBREAKER)],
    true,
    "You and nearby fiends and undead gain additional melee weapon damage equal to your Charisma modifier.",
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["passive"],
    ["none"],
    radiusRange("self, aura", 0, "self"),
    ["paladin", "oathbreaker", "aura"],
    {
      displayGroup: oathbreakerGroup,
    }
  ),

  ...oathSpellDefinitions.map(makeOathSpell),
];

const fightingStyleIconEntries = Object.fromEntries(
  fightingStyleDefinitions.map((style) => [
    `paladin-fighting-style-${style.idBase}`,
    `Passive_Paladin_FightingStyle_${style.idBase}.png`,
  ])
);

const oathSpellIconEntries: Record<string, string> = {
  "paladin-devotion-protection-from-evil-and-good":
    "Spell_Abjuration_ProtectionFromEvilAndGood.png",
  "paladin-devotion-sanctuary": "Spell_Abjuration_Sanctuary.png",
  "paladin-devotion-lesser-restoration":
    "Spell_Abjuration_LesserRestoration.png",
  "paladin-devotion-silence": "Spell_Illusion_Silence.png",
  "paladin-devotion-remove-curse": "Spell_Abjuration_RemoveCurse.png",
  "paladin-devotion-beacon-of-hope": "Spell_Abjuration_BeaconOfHope.png",

  "paladin-ancients-speak-with-animals":
    "Spell_Divination_SpeakWithAnimals.png",
  "paladin-ancients-ensnaring-strike": "Spell_Conjuration_EnsnaringStrike.png",
  "paladin-ancients-misty-step": "Spell_Conjuration_MistyStep.png",
  "paladin-ancients-moonbeam": "Spell_Evocation_Moonbeam.png",
  "paladin-ancients-protection-from-energy":
    "Spell_Abjuration_ProtectionFromEnergy.png",
  "paladin-ancients-plant-growth": "Spell_Transmutation_PlantGrowth.png",

  "paladin-crown-command": "Spell_Enchantment_Command.png",
  "paladin-crown-compelled-duel": "Spell_Enchantment_CompelledDuel.png",
  "paladin-crown-warding-bond": "Spell_Abjuration_WardingBond.png",
  "paladin-crown-spiritual-weapon": "Spell_Evocation_SpiritualWeapon.png",
  "paladin-crown-spirit-guardians": "Spell_Conjuration_SpiritGuardians.png",
  "paladin-crown-crusaders-mantle": "Spell_Evocation_CrusadersMantle.png",

  "paladin-vengeance-bane": "Spell_Enchantment_Bane.png",
  "paladin-vengeance-hunters-mark": "Spell_Divination_HuntersMark.png",
  "paladin-vengeance-hold-person": "Spell_Enchantment_HoldPerson.png",
  "paladin-vengeance-misty-step": "Spell_Conjuration_MistyStep.png",
  "paladin-vengeance-haste": "Spell_Transmutation_Haste.png",
  "paladin-vengeance-protection-from-energy":
    "Spell_Abjuration_ProtectionFromEnergy.png",

  "paladin-oathbreaker-hellish-rebuke": "Spell_Evocation_HellishRebuke.png",
  "paladin-oathbreaker-inflict-wounds": "Spell_Necromancy_InflictWounds.png",
  "paladin-oathbreaker-crown-of-madness":
    "Spell_Enchantment_CrownOfMadness.png",
  "paladin-oathbreaker-darkness": "Spell_Evocation_Darkness.png",
  "paladin-oathbreaker-bestow-curse": "Spell_Necromancy_BestowCurse.png",
  "paladin-oathbreaker-animate-dead": "Spell_Necromancy_AnimateDead.png",
};

export const paladinClassModule: ClassFeatureModule = {
  className: "Paladin",
  defaultTabLabel: "Paladin Features",
  subclassTabLabels: {
    [DEVOTION]: "Devotion Features",
    [ANCIENTS]: "Ancients Features",
    [CROWN]: "Crown Features",
    [VENGEANCE]: "Vengeance Features",
    [OATHBREAKER]: "Oathbreaker Features",
  },
  features: paladinFeatures,
  iconFileByFeatureId: {
    "paladin-lay-on-hands-charges-3": "Passive_Paladin_LayOnHandsCharges.png",
    "paladin-lay-on-hands-charges-4": "Passive_Paladin_LayOnHandsCharges.png",
    "paladin-lay-on-hands-charges-5": "Passive_Paladin_LayOnHandsCharges.png",
    "paladin-channel-oath-charge": "Passive_Paladin_ChannelOathCharge.png",
    "paladin-divine-sense": "Action_Paladin_DivineSense.png",
    "paladin-lay-on-hands": "Action_Paladin_LayOnHands.png",
    "paladin-spellcasting": "Passive_Paladin_Spellcasting.png",
    "paladin-divine-smite": "Action_Paladin_DivineSmite.png",
    "paladin-divine-health": "Passive_Paladin_DivineHealth.png",
    "paladin-extra-attack": "Passive_ExtraAttack.png",
    "paladin-aura-of-protection": "Passive_Paladin_AuraOfProtection.png",
    "paladin-aura-of-courage": "Passive_Paladin_AuraOfCourage.png",
    "paladin-improved-divine-smite": "Passive_Paladin_ImprovedDivineSmite.png",

    "paladin-devotion-holy-rebuke": "Action_Paladin_Devotion_HolyRebuke.png",
    "paladin-devotion-sacred-weapon": "Action_Paladin_Devotion_SacredWeapon.png",
    "paladin-devotion-turn-the-unholy":
      "Action_Paladin_Devotion_TurnTheUnholy.png",
    "paladin-devotion-aura-of-devotion":
      "Passive_Paladin_Devotion_AuraOfDevotion.png",

    "paladin-ancients-healing-radiance":
      "Action_Paladin_Ancients_HealingRadiance.png",
    "paladin-ancients-natures-wrath":
      "Action_Paladin_Ancients_NaturesWrath.png",
    "paladin-ancients-turn-the-faithless":
      "Action_Paladin_Ancients_TurnTheFaithless.png",
    "paladin-ancients-aura-of-warding":
      "Passive_Paladin_Ancients_AuraOfWarding.png",

    "paladin-crown-righteous-clarity":
      "Action_Paladin_Crown_RighteousClarity.png",
    "paladin-crown-champion-challenge":
      "Action_Paladin_Crown_ChampionChallenge.png",
    "paladin-crown-turn-the-tide": "Action_Paladin_Crown_TurnTheTide.png",
    "paladin-crown-divine-allegiance":
      "Reaction_Paladin_Crown_DivineAllegiance.png",

    "paladin-vengeance-inquisitors-might":
      "Action_Paladin_Vengeance_InquisitorsMight.png",
    "paladin-vengeance-abjure-enemy":
      "Action_Paladin_Vengeance_AbjureEnemy.png",
    "paladin-vengeance-vow-of-enmity":
      "Action_Paladin_Vengeance_VowOfEnmity.png",
    "paladin-vengeance-relentless-avenger":
      "Passive_Paladin_Vengeance_RelentlessAvenger.png",

    "paladin-oathbreaker-spiteful-suffering":
      "Action_Paladin_Oathbreaker_SpitefulSuffering.png",
    "paladin-oathbreaker-control-undead":
      "Action_Paladin_Oathbreaker_ControlUndead.png",
    "paladin-oathbreaker-dreadful-aspect":
      "Action_Paladin_Oathbreaker_DreadfulAspect.png",
    "paladin-oathbreaker-aura-of-hate":
      "Passive_Paladin_Oathbreaker_AuraOfHate.png",

    ...fightingStyleIconEntries,
    ...oathSpellIconEntries,
  },
};