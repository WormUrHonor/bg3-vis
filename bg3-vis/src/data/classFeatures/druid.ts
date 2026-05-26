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

const DRUID = "Druid" as const;

const LAND = "Circle of the Land";
const MOON = "Circle of the Moon";
const SPORES = "Circle of the Spores";
const STARS = "Circle of the Stars";

type FeatureRange = BG3Spell["range"];

const wildShapeActiveGroup = {
  id: "druid-active-wild-shape",
  label: "Active Wild Shape",
  max: 1,
};

const starryFormActiveGroup = {
  id: "druid-active-starry-form",
  label: "Active Starry Form",
  max: 1,
};

const landLevel2Choice = {
  id: "druid-land-level-2-circle-spells",
  label: "2nd-level Land Choice",
  max: 1,
};

const landLevel3Choice = {
  id: "druid-land-level-3-circle-spells",
  label: "3rd-level Land Choice",
  max: 1,
};

const landLevel4Choice = {
  id: "druid-land-level-4-circle-spells",
  label: "4th-level Land Choice",
  max: 1,
};

const landLevel5Choice = {
  id: "druid-land-level-5-circle-spells",
  label: "5th-level Land Choice",
  max: 1,
};

const coreGroup = {
  id: "druid-core",
  label: "Core Druid Features",
  order: 10,
};

const wildShapeGroup = {
  id: "druid-wild-shapes",
  label: "Wild Shape Forms",
  order: 20,
};

const wildShapeActionGroup = {
  id: "druid-wild-shape-actions",
  label: "Wild Shape Granted Actions",
  order: 22,
};

const landGroup = {
  id: "druid-land",
  label: "Circle of the Land Features",
  order: 30,
};

const landChoiceGroup = {
  id: "druid-land-choices",
  label: "Circle of the Land Choices",
  order: 32,
};

const landSpellGroup = {
  id: "druid-land-spells",
  label: "Circle of the Land Granted Spells",
  order: 34,
};

const moonGroup = {
  id: "druid-moon",
  label: "Circle of the Moon Features",
  order: 40,
};

const sporesGroup = {
  id: "druid-spores",
  label: "Circle of the Spores Features",
  order: 50,
};

const sporesSpellGroup = {
  id: "druid-spores-spells",
  label: "Circle of the Spores Granted Spells",
  order: 52,
};

const starsGroup = {
  id: "druid-stars",
  label: "Circle of the Stars Features",
  order: 60,
};

const starsActionGroup = {
  id: "druid-stars-actions",
  label: "Starry Form Granted Actions",
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

const cone5m = {
  label: "5m cone",
  meters: 5,
  category: "mid",
  shape: "cone",
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

type WildShapeDefinition = {
  idBase: string;
  name: string;
  minLevel: number;
  subclass?: string;
  description: string;
  action: ActionCost;
  resourceCount?: 1 | 2;
};

const wildShapeDefinitions: WildShapeDefinition[] = [
  {
    idBase: "badger",
    name: "Wild Shape: Badger",
    minLevel: 2,
    description:
      "Assume the shape of a giant badger. The badger can bite, claw, and burrow.",
    action: "action",
  },
  {
    idBase: "cat",
    name: "Wild Shape: Cat",
    minLevel: 2,
    description:
      "Assume the shape of a cat. The cat can avoid attention and meow to distract nearby creatures.",
    action: "action",
  },
  {
    idBase: "spider",
    name: "Wild Shape: Spider",
    minLevel: 2,
    description:
      "Assume the shape of a giant spider. The spider can bite, web enemies, and move with arachnid mobility.",
    action: "action",
  },
  {
    idBase: "wolf",
    name: "Wild Shape: Wolf",
    minLevel: 2,
    description:
      "Assume the shape of a dire wolf. The wolf can bite, incite allies, expose enemies, and benefits from Pack Tactics.",
    action: "action",
  },
  {
    idBase: "deep-rothe",
    name: "Wild Shape: Deep Rothé",
    minLevel: 4,
    description:
      "Assume the shape of a deep rothé. The form can charge enemies and use Dancing Lights.",
    action: "action",
  },
  {
    idBase: "panther",
    name: "Wild Shape: Panther",
    minLevel: 6,
    description:
      "Assume the shape of a panther. The form can prowl invisibly, pounce, and strike vulnerable targets.",
    action: "action",
  },
  {
    idBase: "owlbear",
    name: "Wild Shape: Owlbear",
    minLevel: 6,
    description:
      "Assume the shape of an owlbear. The form can use Claws, Crushing Flight, Enrage, and Rupture.",
    action: "action",
  },
  {
    idBase: "dilophosaurus",
    name: "Wild Shape: Dilophosaurus",
    minLevel: 10,
    description:
      "Assume the shape of a dilophosaurus. The form can bite, pounce, and use Corrosive Spit.",
    action: "action",
  },
  {
    idBase: "bear",
    name: "Wild Shape: Bear",
    minLevel: 2,
    subclass: MOON,
    description:
      "Circle of the Moon Combat Wild Shape. Assume the shape of a polar bear that can goad enemies into attacking it.",
    action: "bonus-action",
  },
  {
    idBase: "dire-raven",
    name: "Wild Shape: Dire Raven",
    minLevel: 4,
    subclass: MOON,
    description:
      "Circle of the Moon Combat Wild Shape. Assume the shape of a dire raven that can blind enemies and fly.",
    action: "bonus-action",
  },
  {
    idBase: "sabre-toothed-tiger",
    name: "Wild Shape: Sabre-Toothed Tiger",
    minLevel: 8,
    subclass: MOON,
    description:
      "Circle of the Moon Combat Wild Shape. Assume the shape of a sabre-toothed tiger that can shred armour and regenerate.",
    action: "bonus-action",
  },
  {
    idBase: "air-myrmidon",
    name: "Wild Shape: Air Myrmidon",
    minLevel: 10,
    subclass: MOON,
    description:
      "Circle of the Moon elemental Combat Wild Shape. This form consumes 2 Wild Shape Charges and can use air and lightning actions.",
    action: "bonus-action",
    resourceCount: 2,
  },
  {
    idBase: "earth-myrmidon",
    name: "Wild Shape: Earth Myrmidon",
    minLevel: 10,
    subclass: MOON,
    description:
      "Circle of the Moon elemental Combat Wild Shape. This form consumes 2 Wild Shape Charges and can use earth actions.",
    action: "bonus-action",
    resourceCount: 2,
  },
  {
    idBase: "fire-myrmidon",
    name: "Wild Shape: Fire Myrmidon",
    minLevel: 10,
    subclass: MOON,
    description:
      "Circle of the Moon elemental Combat Wild Shape. This form consumes 2 Wild Shape Charges and can use fire actions.",
    action: "bonus-action",
    resourceCount: 2,
  },
  {
    idBase: "water-myrmidon",
    name: "Wild Shape: Water Myrmidon",
    minLevel: 10,
    subclass: MOON,
    description:
      "Circle of the Moon elemental Combat Wild Shape. This form consumes 2 Wild Shape Charges and can use water, ice, and healing actions.",
    action: "bonus-action",
    resourceCount: 2,
  },
];

function makeWildShapeFeature(entry: WildShapeDefinition) {
  return feature(
    `druid-wild-shape-${entry.idBase}`,
    entry.name,
    "toggle",
    entry.subclass
      ? [availableTo(DRUID, entry.minLevel, entry.subclass)]
      : [availableTo(DRUID, entry.minLevel)],
    true,
    entry.description,
    ["support-buff", "mobility-positioning"],
    [],
    [entry.action],
    ["class-resource"],
    self,
    [
      "druid",
      "wild-shape",
      "active-assumption",
      `wild-shape-charges:${entry.resourceCount ?? 1}`,
    ],
    {
      displayGroup: wildShapeGroup,
      activeGroup: wildShapeActiveGroup,
    }
  );
}

type WildShapeActionDefinition = {
  shapeIdBase: string;
  idBase: string;
  name: string;
  minLevel: number;
  subclass?: string;
  kind: "action" | "bonus-action" | "reaction" | "passive";
  description: string;
  roles: AbilityRole[];
  damageTypes: DamageType[];
  actions: ActionCost[];
  resources: ResourceCost[];
  range: FeatureRange;
  tags?: string[];
};

const wildShapeActionDefinitions: WildShapeActionDefinition[] = [
  {
    shapeIdBase: "badger",
    idBase: "bite",
    name: "Badger: Bite",
    minLevel: 2,
    kind: "action",
    description: "Bite a target while in Badger form.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "badger",
    idBase: "claws",
    name: "Badger: Claws",
    minLevel: 2,
    kind: "action",
    description: "Lash out with claws while in Badger form.",
    roles: ["single-target-damage"],
    damageTypes: ["Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "badger",
    idBase: "burrow",
    name: "Badger: Burrow",
    minLevel: 2,
    kind: "action",
    description:
      "Burrow into the ground and emerge at the target position, possibly knocking nearby creatures Prone.",
    roles: ["mobility-positioning", "control"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: range9m,
  },
  {
    shapeIdBase: "cat",
    idBase: "claws",
    name: "Cat: Claws",
    minLevel: 2,
    kind: "action",
    description: "Lash out with claws while in Cat form.",
    roles: ["single-target-damage"],
    damageTypes: ["Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "cat",
    idBase: "meow",
    name: "Cat: Meow",
    minLevel: 2,
    kind: "action",
    description: "Attract nearby creatures and draw them closer.",
    roles: ["control", "narrative-interaction"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: selfMidRadius,
  },
  {
    shapeIdBase: "spider",
    idBase: "venomous-bite",
    name: "Spider: Venomous Bite",
    minLevel: 2,
    kind: "action",
    description: "Bite a target and possibly Poison it.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Piercing", "Poison"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "spider",
    idBase: "web",
    name: "Spider: Web",
    minLevel: 2,
    kind: "bonus-action",
    description:
      "Expel thick, flammable webbing that slows creatures and can Enweb them.",
    roles: ["control", "mobility-positioning"],
    damageTypes: [],
    actions: ["bonus-action"],
    resources: ["none"],
    range: radiusRange("18m, 4m AoE", 18, "long", 4),
  },
  {
    shapeIdBase: "spider",
    idBase: "arachnid-jump",
    name: "Spider: Arachnid Jump",
    minLevel: 2,
    kind: "bonus-action",
    description: "Jump across terrain while in Spider form.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["bonus-action"],
    resources: ["none"],
    range: self,
  },
  {
    shapeIdBase: "wolf",
    idBase: "bite",
    name: "Wolf: Bite",
    minLevel: 2,
    kind: "action",
    description: "Bite a target while in Wolf form.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "wolf",
    idBase: "inciting-howl",
    name: "Wolf: Inciting Howl",
    minLevel: 2,
    kind: "action",
    description:
      "Each ally within earshot can move an additional 3m during their next turn.",
    roles: ["support-buff", "mobility-positioning"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: selfMidRadius,
  },
  {
    shapeIdBase: "wolf",
    idBase: "exposing-bite",
    name: "Wolf: Exposing Bite",
    minLevel: 2,
    kind: "action",
    description:
      "Bite and distract a target. If the attack hits, the next nearby attack against that target can critically hit.",
    roles: ["single-target-damage", "support-buff", "control"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["short-rest"],
    range: melee,
  },
  {
    shapeIdBase: "wolf",
    idBase: "pack-tactics",
    name: "Wolf: Pack Tactics",
    minLevel: 2,
    kind: "passive",
    description:
      "Gain Advantage on Attack Rolls when an ally is near the target and not Incapacitated.",
    roles: ["support-buff", "single-target-damage"],
    damageTypes: [],
    actions: ["passive"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "deep-rothe",
    idBase: "gore",
    name: "Deep Rothé: Gore",
    minLevel: 4,
    kind: "action",
    description: "Attack with the deep rothé's horns.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "deep-rothe",
    idBase: "charge",
    name: "Deep Rothé: Charge",
    minLevel: 4,
    kind: "action",
    description: "Charge forward and threaten enemies in the path.",
    roles: ["area-damage", "control", "mobility-positioning"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    resources: ["none"],
    range: {
      label: "9m line",
      meters: 9,
      category: "mid",
      shape: "line",
    },
  },
  {
    shapeIdBase: "deep-rothe",
    idBase: "dancing-lights",
    name: "Deep Rothé: Dancing Lights",
    minLevel: 4,
    kind: "action",
    description: "Cast Dancing Lights while in Deep Rothé form.",
    roles: ["support-buff", "investigation-world-interaction"],
    damageTypes: [],
    actions: ["action"],
    resources: ["cantrip"],
    range: radiusRange("18m, 9m AoE", 18, "long", 9),
    tags: ["concentration", "uses-spell-icon:dancing-lights"],
  },
  {
    shapeIdBase: "panther",
    idBase: "bite",
    name: "Panther: Bite",
    minLevel: 6,
    kind: "action",
    description: "Bite a target while in Panther form.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "panther",
    idBase: "pounce",
    name: "Panther: Pounce",
    minLevel: 6,
    kind: "action",
    description: "Leap at a target and potentially knock it Prone.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "panther",
    idBase: "jugular-strike",
    name: "Panther: Jugular Strike",
    minLevel: 6,
    kind: "action",
    description:
      "Strike at a creature's throat, dealing extra Piercing damage against Prone targets.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "panther",
    idBase: "prowl",
    name: "Panther: Prowl",
    minLevel: 6,
    kind: "action",
    description:
      "Turn Invisible while stalking prey. The first attack from invisibility deals additional damage.",
    roles: ["defense-protection", "mobility-positioning", "single-target-damage"],
    damageTypes: ["Weapon"],
    actions: ["action"],
    resources: ["none"],
    range: self,
  },
  {
    shapeIdBase: "owlbear",
    idBase: "claws",
    name: "Owlbear: Claws",
    minLevel: 6,
    kind: "action",
    description: "Slash a target and push it back.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "owlbear",
    idBase: "crushing-flight",
    name: "Owlbear: Crushing Flight",
    minLevel: 6,
    kind: "bonus-action",
    description: "Leap at a target and knock it Prone.",
    roles: ["area-damage", "control", "mobility-positioning"],
    damageTypes: ["Bludgeoning"],
    actions: ["bonus-action"],
    resources: ["none"],
    range: range9m,
  },
  {
    shapeIdBase: "owlbear",
    idBase: "enrage",
    name: "Owlbear: Enrage",
    minLevel: 6,
    kind: "bonus-action",
    description:
      "Increase Strength and Constitution, gain temporary hit points, and possibly make nearby creatures Fearful.",
    roles: ["support-buff", "defense-protection", "control"],
    damageTypes: [],
    actions: ["bonus-action"],
    resources: ["class-resource"],
    range: selfSmallRadius,
  },
  {
    shapeIdBase: "owlbear",
    idBase: "rupture",
    name: "Owlbear: Rupture",
    minLevel: 6,
    kind: "action",
    description:
      "Rupture the earth, causing debris to tear through nearby objects and creatures.",
    roles: ["area-damage", "control"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    resources: ["none"],
    range: selfSmallRadius,
  },
  {
    shapeIdBase: "sabre-toothed-tiger",
    idBase: "bite",
    name: "Sabre-Toothed Tiger: Bite",
    minLevel: 8,
    subclass: MOON,
    kind: "action",
    description: "Bite a target while in Sabre-Toothed Tiger form.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "sabre-toothed-tiger",
    idBase: "jugular-strike",
    name: "Sabre-Toothed Tiger: Jugular Strike",
    minLevel: 8,
    subclass: MOON,
    kind: "action",
    description:
      "Lunge at a creature's throat, dealing additional Piercing damage if the target is Prone.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "sabre-toothed-tiger",
    idBase: "shred-armour",
    name: "Sabre-Toothed Tiger: Shred Armour",
    minLevel: 8,
    subclass: MOON,
    kind: "action",
    description: "Rip into a target's weaknesses, reducing its Armour Class.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "dilophosaurus",
    idBase: "bite",
    name: "Dilophosaurus: Bite",
    minLevel: 10,
    kind: "action",
    description: "Bite a target while in Dilophosaurus form.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "dilophosaurus",
    idBase: "pounce",
    name: "Dilophosaurus: Pounce",
    minLevel: 10,
    kind: "bonus-action",
    description: "Leap at a target and potentially knock it Prone.",
    roles: ["single-target-damage", "control", "mobility-positioning"],
    damageTypes: ["Piercing"],
    actions: ["bonus-action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "dilophosaurus",
    idBase: "corrosive-spit",
    name: "Dilophosaurus: Corrosive Spit",
    minLevel: 10,
    kind: "action",
    description:
      "Spray a target with corrosive fluids that slowly melt away its Armour Class.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Acid"],
    actions: ["action"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    shapeIdBase: "bear",
    idBase: "claws",
    name: "Bear: Claws",
    minLevel: 2,
    subclass: MOON,
    kind: "action",
    description: "Attack with claws while in Bear form.",
    roles: ["single-target-damage"],
    damageTypes: ["Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "bear",
    idBase: "goading-roar",
    name: "Bear: Goading Roar",
    minLevel: 2,
    subclass: MOON,
    kind: "action",
    description: "Goad nearby enemies into attacking the bear.",
    roles: ["control", "defense-protection"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: selfSmallRadius,
  },
  {
    shapeIdBase: "dire-raven",
    idBase: "beak-attack",
    name: "Dire Raven: Beak Attack",
    minLevel: 4,
    subclass: MOON,
    kind: "action",
    description: "Strike with the raven's beak.",
    roles: ["single-target-damage"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "dire-raven",
    idBase: "rend-vision",
    name: "Dire Raven: Rend Vision",
    minLevel: 4,
    subclass: MOON,
    kind: "action",
    description: "Attack the target's eyes and possibly Blind it.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "dire-raven",
    idBase: "fly",
    name: "Dire Raven: Fly",
    minLevel: 4,
    subclass: MOON,
    kind: "bonus-action",
    description: "Fly to a target position.",
    roles: ["mobility-positioning"],
    damageTypes: [],
    actions: ["bonus-action"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    shapeIdBase: "air-myrmidon",
    idBase: "electrified-flail",
    name: "Air Myrmidon: Electrified Flail",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description:
      "Clout a foe with a lightning-suffused flail and possibly Stun them.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Bludgeoning", "Lightning"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "air-myrmidon",
    idBase: "elemental-warp",
    name: "Air Myrmidon: Elemental Warp",
    minLevel: 10,
    subclass: MOON,
    kind: "bonus-action",
    description: "Teleport to an unoccupied space you can see.",
    roles: ["mobility-positioning", "defense-protection"],
    damageTypes: [],
    actions: ["bonus-action"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    shapeIdBase: "air-myrmidon",
    idBase: "invisibility",
    name: "Air Myrmidon: Invisibility",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Become Invisible. Recharges on Short Rest.",
    roles: ["defense-protection", "mobility-positioning"],
    damageTypes: [],
    actions: ["action"],
    resources: ["short-rest"],
    range: self,
    tags: ["uses-spell-icon:invisibility"],
  },
  {
    shapeIdBase: "air-myrmidon",
    idBase: "raging-vortex",
    name: "Air Myrmidon: Raging Vortex",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description:
      "Create a choking maelstrom that deals Bludgeoning damage per turn and Silences creatures.",
    roles: ["area-damage", "control"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    resources: ["none"],
    range: selfSmallRadius,
  },
  {
    shapeIdBase: "earth-myrmidon",
    idBase: "muck-to-metal",
    name: "Earth Myrmidon: Muck to Metal",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Use earth magic to control and damage enemies.",
    roles: ["control", "single-target-damage"],
    damageTypes: ["Acid"],
    actions: ["action"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    shapeIdBase: "earth-myrmidon",
    idBase: "sludgy-sling",
    name: "Earth Myrmidon: Sludgy Sling",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Hurl sludge at a target.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Bludgeoning", "Acid"],
    actions: ["action"],
    resources: ["none"],
    range: range18mSingle,
  },
  {
    shapeIdBase: "earth-myrmidon",
    idBase: "burrow",
    name: "Earth Myrmidon: Burrow",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Burrow and reposition through the ground.",
    roles: ["mobility-positioning", "control"],
    damageTypes: ["Bludgeoning"],
    actions: ["action"],
    resources: ["none"],
    range: range9m,
  },
  {
    shapeIdBase: "fire-myrmidon",
    idBase: "scorching-strike",
    name: "Fire Myrmidon: Scorching Strike",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Strike with fire.",
    roles: ["single-target-damage"],
    damageTypes: ["Fire", "Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "fire-myrmidon",
    idBase: "myrmidons-immolation",
    name: "Fire Myrmidon: Myrmidon's Immolation",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Ignite yourself or the area with elemental fire.",
    roles: ["area-damage", "support-buff"],
    damageTypes: ["Fire"],
    actions: ["action"],
    resources: ["none"],
    range: selfSmallRadius,
  },
  {
    shapeIdBase: "fire-myrmidon",
    idBase: "cinderous-swipe",
    name: "Fire Myrmidon: Cinderous Swipe",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Swipe through enemies with cinders and flame.",
    roles: ["area-damage"],
    damageTypes: ["Fire", "Slashing"],
    actions: ["action"],
    resources: ["none"],
    range: cone5m,
  },
  {
    shapeIdBase: "water-myrmidon",
    idBase: "hiemal-strike",
    name: "Water Myrmidon: Hiemal Strike",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Strike with cold elemental force.",
    roles: ["single-target-damage", "control"],
    damageTypes: ["Cold", "Bludgeoning"],
    actions: ["action"],
    resources: ["none"],
    range: melee,
  },
  {
    shapeIdBase: "water-myrmidon",
    idBase: "healing-vapours",
    name: "Water Myrmidon: Healing Vapours",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Release healing vapours.",
    roles: ["healing", "support-buff"],
    damageTypes: [],
    actions: ["action"],
    resources: ["none"],
    range: selfMidRadius,
  },
  {
    shapeIdBase: "water-myrmidon",
    idBase: "explosive-icicle",
    name: "Water Myrmidon: Explosive Icicle",
    minLevel: 10,
    subclass: MOON,
    kind: "action",
    description: "Launch an icy projectile that explodes.",
    roles: ["area-damage", "control"],
    damageTypes: ["Cold", "Piercing"],
    actions: ["action"],
    resources: ["none"],
    range: radiusRange("18m, 2m AoE", 18, "long", 2),
  },
];

function makeWildShapeActionFeature(entry: WildShapeActionDefinition) {
  const shapeFeatureId = `druid-wild-shape-${entry.shapeIdBase}`;

  return feature(
    `druid-wild-shape-${entry.shapeIdBase}-${entry.idBase}`,
    entry.name,
    entry.kind,
    entry.subclass
      ? [availableTo(DRUID, entry.minLevel, entry.subclass)]
      : [availableTo(DRUID, entry.minLevel)],
    true,
    entry.description,
    entry.roles,
    entry.damageTypes,
    entry.actions,
    entry.resources,
    entry.range,
    [
      "druid",
      "wild-shape-granted-action",
      `requires-form:${entry.shapeIdBase}`,
      ...(entry.tags ?? []),
    ],
    {
      displayGroup: wildShapeActionGroup,
      requires: [shapeFeatureId],
    }
  );
}

type LandName =
  | "Arctic"
  | "Coast"
  | "Desert"
  | "Forest"
  | "Grassland"
  | "Mountain"
  | "Swamp"
  | "Underdark";

type LandTier = 2 | 3 | 4 | 5;

type LandChoiceDefinition = {
  tier: LandTier;
  minLevel: number;
  spellLevelLabel: string;
  choiceGroup: typeof landLevel2Choice;
  choices: Record<LandName, string[]>;
};

const landChoiceDefinitions: LandChoiceDefinition[] = [
  {
    tier: 2,
    minLevel: 3,
    spellLevelLabel: "2nd",
    choiceGroup: landLevel2Choice,
    choices: {
      Arctic: ["hold-person", "spike-growth"],
      Coast: ["mirror-image", "misty-step"],
      Desert: ["blur", "silence"],
      Forest: ["barkskin", "hold-person"],
      Grassland: ["invisibility", "pass-without-trace"],
      Mountain: ["mirror-image", "spike-growth"],
      Swamp: ["melfs-acid-arrow", "darkness"],
      Underdark: ["web", "misty-step"],
    },
  },
  {
    tier: 3,
    minLevel: 5,
    spellLevelLabel: "3rd",
    choiceGroup: landLevel3Choice,
    choices: {
      Arctic: ["sleet-storm", "haste"],
      Coast: ["sleet-storm", "call-lightning"],
      Desert: ["protection-from-energy", "hypnotic-pattern"],
      Forest: ["call-lightning", "plant-growth"],
      Grassland: ["daylight", "haste"],
      Mountain: ["lightning-bolt", "grant-flight"],
      Swamp: ["stinking-cloud", "vampiric-touch"],
      Underdark: ["gaseous-form", "stinking-cloud"],
    },
  },
  {
    tier: 4,
    minLevel: 7,
    spellLevelLabel: "4th",
    choiceGroup: landLevel4Choice,
    choices: {
      Arctic: ["conjure-minor-elemental", "ice-storm"],
      Coast: ["freedom-of-movement", "confusion"],
      Desert: ["blight", "wall-of-fire"],
      Forest: ["conjure-minor-elemental", "grasping-vine"],
      Grassland: ["freedom-of-movement", "polymorph"],
      Mountain: ["stoneskin", "dominate-beast"],
      Swamp: ["blight", "grasping-vine"],
      Underdark: ["greater-invisibility", "dominate-beast"],
    },
  },
  {
    tier: 5,
    minLevel: 9,
    spellLevelLabel: "5th",
    choiceGroup: landLevel5Choice,
    choices: {
      Arctic: ["cone-of-cold", "contagion"],
      Coast: ["conjure-elemental", "greater-restoration"],
      Desert: ["wall-of-stone", "insect-plague"],
      Forest: ["mass-cure-wounds", "contagion"],
      Grassland: ["greater-restoration", "insect-plague"],
      Mountain: ["wall-of-stone", "conjure-elemental"],
      Swamp: ["insect-plague", "cloudkill"],
      Underdark: ["contagion", "cloudkill"],
    },
  },
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function makeLandChoiceFeatures() {
  return landChoiceDefinitions.flatMap((tier) =>
    Object.keys(tier.choices).map((landName) => {
      const land = landName as LandName;

      return feature(
        `druid-land-tier-${tier.tier}-${slug(land)}`,
        `${land} Land Spells (${tier.spellLevelLabel})`,
        "subclass-feature",
        [availableTo(DRUID, tier.minLevel, LAND)],
        false,
        `Choose ${land} for this Circle of the Land spell tier. These spells are always prepared and do not count against prepared spells.`,
        [],
        [],
        ["passive"],
        ["none"],
        self,
        ["druid", "circle-of-the-land", "land-choice", `land:${slug(land)}`],
        {
          choiceGroup: tier.choiceGroup,
          displayGroup: landChoiceGroup,
        }
      );
    })
  );
}

function makeSpellFeatureFromSpellId(args: {
  id: string;
  spellId: string;
  namePrefix?: string;
  minLevel: number;
  subclass: string;
  displayGroup: { id: string; label: string; order: number };
  description: string;
  requires?: string[];
  resourcesOverride?: ResourceCost[];
  tags?: string[];
}) {
  const meta = safeSpellMeta(args.spellId);

  return feature(
    args.id,
    args.namePrefix ? `${args.namePrefix}: ${meta.name}` : meta.name,
    "subclass-feature",
    [availableTo(DRUID, args.minLevel, args.subclass)],
    true,
    args.description,
    meta.roles,
    meta.damageTypes,
    meta.actions,
    args.resourcesOverride ?? meta.resources,
    meta.range,
    ["druid", "always-prepared-spell", ...meta.tags, ...(args.tags ?? [])],
    {
      displayGroup: args.displayGroup,
      requires: args.requires,
    }
  );
}

function makeLandSpellFeatures() {
  return landChoiceDefinitions.flatMap((tier) =>
    Object.entries(tier.choices).flatMap(([landName, spellIds]) => {
      const land = landName as LandName;
      const choiceId = `druid-land-tier-${tier.tier}-${slug(land)}`;

      return spellIds.map((spellId) =>
        makeSpellFeatureFromSpellId({
          id: `${choiceId}-${spellId}`,
          spellId,
          minLevel: tier.minLevel,
          subclass: LAND,
          displayGroup: landSpellGroup,
          description: `Always prepared Circle of the Land spell granted by choosing ${land} at the ${tier.spellLevelLabel}-level land tier.`,
          requires: [choiceId],
          tags: ["circle-of-the-land", `land:${slug(land)}`],
        })
      );
    })
  );
}

const sporesCircleSpellIds = [
  { spellId: "blindness", minLevel: 3 },
  { spellId: "detect-thoughts", minLevel: 3 },
  { spellId: "animate-dead", minLevel: 5 },
  { spellId: "gaseous-form", minLevel: 5 },
  { spellId: "blight", minLevel: 7 },
  { spellId: "confusion", minLevel: 7 },
  { spellId: "contagion", minLevel: 9 },
  { spellId: "cloudkill", minLevel: 9 },
];

const sporesCircleSpellFeatures = sporesCircleSpellIds.map((entry) =>
  makeSpellFeatureFromSpellId({
    id: `druid-spores-circle-spell-${entry.spellId}`,
    spellId: entry.spellId,
    minLevel: entry.minLevel,
    subclass: SPORES,
    displayGroup: sporesSpellGroup,
    description:
      "Always prepared Circle of the Spores spell. It does not count against prepared spells.",
    tags: ["circle-of-the-spores"],
  })
);

const druidFeatures = [
  feature(
    "druid-spellcasting",
    "Spellcasting",
    "resource-feature",
    [availableTo(DRUID, 1)],
    true,
    "Druids are Wisdom-based prepared spellcasters. Prepared spell count is Druid level + Wisdom modifier. Cantrip and prepared-spell limits are handled by spell choice rules.",
    ["support-buff"],
    [],
    ["passive"],
    ["spell-slot"],
    self,
    ["druid", "spellcasting"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-shape",
    "Wild Shape",
    "resource-feature",
    [availableTo(DRUID, 2)],
    true,
    "Magically assume the shape of a beast. Wild Shape uses Wild Shape Charges and recharges on Short or Long Rest.",
    ["support-buff", "mobility-positioning"],
    [],
    ["action"],
    ["class-resource", "short-rest"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-shape-charges",
    "Wild Shape Charges: 2",
    "resource-feature",
    [availableTo(DRUID, 2)],
    true,
    "You have 2 Wild Shape Charges. They replenish on Short or Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "short-rest"],
    self,
    ["druid", "wild-shape", "resource"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-shape-improvement-level-4",
    "Wild Shape Improvement",
    "passive",
    [availableTo(DRUID, 4, undefined, 7)],
    true,
    "Wild Shape attack damage increases.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-shape-improvement-level-8",
    "Wild Shape Improvement",
    "passive",
    [availableTo(DRUID, 8, undefined, 11)],
    true,
    "Wild Shape attack damage increases again.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-shape-improvement-level-12",
    "Wild Shape Improvement",
    "passive",
    [availableTo(DRUID, 12)],
    true,
    "Wild Shape attack damage receives its final improvement.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-wild-strike",
    "Wild Strike",
    "passive",
    [availableTo(DRUID, 5, undefined, 9)],
    true,
    "You can make an additional attack after making an unarmed or weapon strike while in animal Wild Shape.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  feature(
    "druid-improved-wild-strike",
    "Improved Wild Strike",
    "passive",
    [availableTo(DRUID, 10)],
    true,
    "You can make 2 additional attacks after making an unarmed or weapon strike while in animal Wild Shape.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "wild-shape"],
    {
      displayGroup: coreGroup,
    }
  ),

  ...wildShapeDefinitions.map(makeWildShapeFeature),
  ...wildShapeActionDefinitions.map(makeWildShapeActionFeature),

  feature(
    "druid-land-natural-recovery",
    "Natural Recovery",
    "action",
    [availableTo(DRUID, 2, LAND)],
    true,
    "Replenish expended spell slots while out of combat. Recharges on Long Rest.",
    ["support-buff"],
    [],
    ["action"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-land"],
    {
      displayGroup: landGroup,
    }
  ),

  feature(
    "druid-land-natural-recovery-charges",
    "Natural Recovery Charges",
    "resource-feature",
    [availableTo(DRUID, 2, LAND)],
    true,
    "The combined number and level of spell slots Natural Recovery can restore. This increases with Druid level.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-land", "resource"],
    {
      displayGroup: landGroup,
    }
  ),

  ...makeLandChoiceFeatures(),
  ...makeLandSpellFeatures(),

  feature(
    "druid-land-lands-stride-difficult-terrain",
    "Land's Stride: Difficult Terrain",
    "passive",
    [availableTo(DRUID, 6, LAND)],
    true,
    "Difficult Terrain no longer slows you down.",
    ["mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-land"],
    {
      displayGroup: landGroup,
    }
  ),

  feature(
    "druid-land-lands-stride-advantage",
    "Land's Stride: Advantage",
    "passive",
    [availableTo(DRUID, 6, LAND)],
    true,
    "Gain Advantage on Saving Throws against magically created plants that impede movement.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-land"],
    {
      displayGroup: landGroup,
    }
  ),

  feature(
    "druid-land-lands-stride-plants",
    "Land's Stride: Plants",
    "passive",
    [availableTo(DRUID, 6, LAND)],
    true,
    "Plant-based surfaces with thorns, spines, or similar hazards no longer harm you.",
    ["defense-protection", "mobility-positioning"],
    [],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-land"],
    {
      displayGroup: landGroup,
    }
  ),

  feature(
    "druid-land-natures-ward",
    "Nature's Ward",
    "passive",
    [availableTo(DRUID, 10, LAND)],
    true,
    "You cannot be Charmed or Frightened by elementals and fey. Disease and poison no longer affect you.",
    ["defense-protection"],
    ["Poison"],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-land"],
    {
      displayGroup: landGroup,
    }
  ),

  feature(
    "druid-moon-combat-wild-shape",
    "Combat Wild Shape",
    "bonus-action",
    [availableTo(DRUID, 2, MOON)],
    true,
    "As a bonus action, assume the form of a beast. This otherwise acts as Wild Shape.",
    ["support-buff", "mobility-positioning"],
    [],
    ["bonus-action"],
    ["class-resource", "short-rest"],
    self,
    ["druid", "circle-of-the-moon", "wild-shape"],
    {
      displayGroup: moonGroup,
    }
  ),

  feature(
    "druid-moon-lunar-mend",
    "Lunar Mend",
    "bonus-action",
    [availableTo(DRUID, 2, MOON)],
    true,
    "Expend spell slots to regain hit points while Wild Shaped.",
    ["healing", "defense-protection"],
    [],
    ["bonus-action"],
    ["spell-slot"],
    self,
    ["druid", "circle-of-the-moon"],
    {
      displayGroup: moonGroup,
    }
  ),

  feature(
    "druid-moon-primal-strike",
    "Primal Strike",
    "passive",
    [availableTo(DRUID, 6, MOON)],
    true,
    "While in beast form, your attacks count as magical for overcoming Resistance and Immunity to non-magical damage.",
    ["single-target-damage", "support-buff"],
    ["Weapon"],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-moon"],
    {
      displayGroup: moonGroup,
    }
  ),

  feature(
    "druid-spores-bone-chill",
    "Bone Chill",
    "action",
    [availableTo(DRUID, 2, SPORES)],
    true,
    "Circle of the Spores grants Bone Chill as an additional cantrip.",
    ["single-target-damage", "control"],
    ["Necrotic"],
    ["action"],
    ["cantrip"],
    range18mSingle,
    [
      "druid",
      "circle-of-the-spores",
      "fixed-cantrip",
      "uses-spell-icon:bone-chill",
    ],
    {
      displayGroup: sporesGroup,
    }
  ),

  feature(
    "druid-spores-halo-of-spores",
    "Halo of Spores",
    "reaction",
    [availableTo(DRUID, 2, SPORES)],
    true,
    "Unleash a cloud of necrotic spores upon a target as a reaction. Damage increases at Druid levels 6 and 10.",
    ["single-target-damage"],
    ["Necrotic"],
    ["reaction"],
    ["none"],
    range9m,
    ["druid", "circle-of-the-spores"],
    {
      displayGroup: sporesGroup,
    }
  ),

  feature(
    "druid-spores-symbiotic-entity",
    "Symbiotic Entity",
    "action",
    [availableTo(DRUID, 2, SPORES)],
    true,
    "Expend a Wild Shape Charge to gain temporary hit points, add Necrotic damage to weapon or unarmed attacks, and double Halo of Spores damage.",
    ["support-buff", "defense-protection", "single-target-damage"],
    ["Necrotic", "Weapon"],
    ["action"],
    ["class-resource"],
    self,
    ["druid", "circle-of-the-spores"],
    {
      displayGroup: sporesGroup,
    }
  ),

  ...sporesCircleSpellFeatures,

  feature(
    "druid-spores-fungal-infestation",
    "Fungal Infestation",
    "reaction",
    [availableTo(DRUID, 6, SPORES)],
    true,
    "Raise a Beast or Humanoid corpse as a Fungal Zombie until the next Long Rest. Counts as a reaction.",
    ["summon", "single-target-damage"],
    ["Necrotic"],
    ["reaction"],
    ["class-resource", "long-rest"],
    touch,
    ["druid", "circle-of-the-spores"],
    {
      displayGroup: sporesGroup,
    }
  ),

  feature(
    "druid-spores-fungal-infestation-charges",
    "Fungal Infestation Charges: 4",
    "resource-feature",
    [availableTo(DRUID, 6, SPORES)],
    true,
    "You have 4 Fungal Infestation Charges. They replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-spores", "resource"],
    {
      displayGroup: sporesGroup,
    }
  ),

  feature(
    "druid-spores-spreading-spores",
    "Spreading Spores",
    "bonus-action",
    [availableTo(DRUID, 10, SPORES)],
    true,
    "Seed an area in deadly spores that deal Necrotic damage per turn to creatures that inhale them, except you and your allies.",
    ["area-damage", "control"],
    ["Necrotic"],
    ["bonus-action"],
    ["none"],
    radiusRange("9m, 3m AoE", 9, "mid", 3),
    ["druid", "circle-of-the-spores"],
    {
      displayGroup: sporesGroup,
    }
  ),

  feature(
    "druid-stars-guidance",
    "Guidance",
    "action",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Circle of the Stars grants Guidance as an additional cantrip.",
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    ["cantrip"],
    touch,
    [
      "druid",
      "circle-of-the-stars",
      "fixed-cantrip",
      "uses-spell-icon:guidance",
    ],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-starry-form",
    "Starry Form",
    "resource-feature",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Expend a Wild Shape Charge to take on a Starry Form rather than transforming into a beast.",
    ["support-buff"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["druid", "circle-of-the-stars"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-starry-form-archer",
    "Starry Form: Archer",
    "toggle",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Take on the Archer constellation. While active, you can cast Luminous Arrow as a bonus action.",
    ["support-buff", "single-target-damage"],
    ["Radiant"],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["druid", "circle-of-the-stars", "starry-form"],
    {
      displayGroup: starsGroup,
      activeGroup: starryFormActiveGroup,
    }
  ),

  feature(
    "druid-stars-starry-form-chalice",
    "Starry Form: Chalice",
    "toggle",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Take on the Chalice constellation. Healing spells that consume spell slots can trigger Chalice Healing.",
    ["support-buff", "healing"],
    [],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["druid", "circle-of-the-stars", "starry-form"],
    {
      displayGroup: starsGroup,
      activeGroup: starryFormActiveGroup,
    }
  ),

  feature(
    "druid-stars-starry-form-dragon",
    "Starry Form: Dragon",
    "toggle",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Take on the Dragon constellation. It improves Concentration reliability and enables Dazzling Breath.",
    ["support-buff", "defense-protection", "area-damage"],
    ["Radiant"],
    ["bonus-action"],
    ["class-resource"],
    self,
    ["druid", "circle-of-the-stars", "starry-form"],
    {
      displayGroup: starsGroup,
      activeGroup: starryFormActiveGroup,
    }
  ),

  feature(
    "druid-stars-luminous-arrow",
    "Luminous Arrow",
    "bonus-action",
    [availableTo(DRUID, 2, STARS)],
    true,
    "While in Starry Form: Archer, fire a luminous arrow that deals Radiant damage. Damage improves at level 10.",
    ["single-target-damage"],
    ["Radiant"],
    ["bonus-action"],
    ["none"],
    range18mSingle,
    ["druid", "circle-of-the-stars", "starry-form-action"],
    {
      displayGroup: starsActionGroup,
      requires: ["druid-stars-starry-form-archer"],
    }
  ),

  feature(
    "druid-stars-chalice-healing",
    "Chalice Healing",
    "passive",
    [availableTo(DRUID, 2, STARS)],
    true,
    "While in Starry Form: Chalice, casting a healing spell that consumes a spell slot can trigger additional healing. Healing improves at level 10.",
    ["healing", "support-buff"],
    [],
    ["conditional"],
    ["none"],
    range18mSingle,
    ["druid", "circle-of-the-stars", "starry-form-action"],
    {
      displayGroup: starsActionGroup,
      requires: ["druid-stars-starry-form-chalice"],
    }
  ),

  feature(
    "druid-stars-dazzling-breath",
    "Dazzling Breath",
    "bonus-action",
    [availableTo(DRUID, 2, STARS)],
    true,
    "While in Starry Form: Dragon, breathe radiant starlight in a cone. Damage improves at levels 5 and 10.",
    ["area-damage"],
    ["Radiant"],
    ["bonus-action"],
    ["none"],
    cone5m,
    ["druid", "circle-of-the-stars", "starry-form-action"],
    {
      displayGroup: starsActionGroup,
      requires: ["druid-stars-starry-form-dragon"],
    }
  ),

  makeSpellFeatureFromSpellId({
    id: "druid-stars-guiding-bolt",
    spellId: "guiding-bolt",
    minLevel: 2,
    subclass: STARS,
    displayGroup: starsGroup,
    description:
      "Always prepared Circle of the Stars spell. It does not count against prepared spells.",
    tags: ["circle-of-the-stars"],
  }),

  feature(
    "druid-stars-star-map-guiding-bolt",
    "Star Map: Guiding Bolt",
    "action",
    [availableTo(DRUID, 2, STARS)],
    true,
    "Cast Guiding Bolt using a Star Map instead of a spell slot.",
    ["single-target-damage", "support-buff"],
    ["Radiant"],
    ["action"],
    ["class-resource", "long-rest"],
    range18mSingle,
    ["druid", "circle-of-the-stars", "uses-spell-icon:guiding-bolt"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-star-maps-2",
    "Star Maps: 2",
    "resource-feature",
    [availableTo(DRUID, 2, STARS, 4)],
    true,
    "You have 2 Star Maps. They are used to cast Guiding Bolt without a spell slot and replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-stars", "resource"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-star-maps-3",
    "Star Maps: 3",
    "resource-feature",
    [availableTo(DRUID, 5, STARS, 8)],
    true,
    "You have 3 Star Maps. They replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-stars", "resource"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-star-maps-4",
    "Star Maps: 4",
    "resource-feature",
    [availableTo(DRUID, 9, STARS)],
    true,
    "You have 4 Star Maps. They replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-stars", "resource"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-cosmic-omen",
    "Cosmic Omen",
    "passive",
    [availableTo(DRUID, 6, STARS)],
    true,
    "After a Long Rest, consult the stars for an omen of Weal or Woe.",
    ["support-buff", "control"],
    [],
    ["passive"],
    ["long-rest"],
    self,
    ["druid", "circle-of-the-stars"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-cosmic-omen-weal",
    "Cosmic Omen: Weal",
    "reaction",
    [availableTo(DRUID, 6, STARS)],
    true,
    "Use an omen to increase an ally's Attack Roll, Saving Throw, or Ability Check.",
    ["support-buff"],
    [],
    ["reaction"],
    ["class-resource", "long-rest"],
    range18mSingle,
    ["druid", "circle-of-the-stars", "cosmic-omen"],
    {
      displayGroup: starsActionGroup,
      requires: ["druid-stars-cosmic-omen"],
    }
  ),

  feature(
    "druid-stars-cosmic-omen-woe",
    "Cosmic Omen: Woe",
    "reaction",
    [availableTo(DRUID, 6, STARS)],
    true,
    "Use an omen to decrease an enemy's Attack Roll or Saving Throw.",
    ["control", "defense-protection"],
    [],
    ["reaction"],
    ["class-resource", "long-rest"],
    range18mSingle,
    ["druid", "circle-of-the-stars", "cosmic-omen"],
    {
      displayGroup: starsActionGroup,
      requires: ["druid-stars-cosmic-omen"],
    }
  ),

  feature(
    "druid-stars-cosmic-omens-3",
    "Cosmic Omens: 3",
    "resource-feature",
    [availableTo(DRUID, 6, STARS, 8)],
    true,
    "You have 3 Cosmic Omens. They replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-stars", "resource"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-cosmic-omens-4",
    "Cosmic Omens: 4",
    "resource-feature",
    [availableTo(DRUID, 9, STARS)],
    true,
    "You have 4 Cosmic Omens. They replenish on Long Rest.",
    ["support-buff"],
    [],
    ["passive"],
    ["class-resource", "long-rest"],
    self,
    ["druid", "circle-of-the-stars", "resource"],
    {
      displayGroup: starsGroup,
    }
  ),

  feature(
    "druid-stars-twinkling-constellations",
    "Twinkling Constellations",
    "passive",
    [availableTo(DRUID, 10, STARS)],
    true,
    "Your Starry Forms improve. Once per turn, you can switch to a different Starry Form as a free action. Archer, Chalice, and Dragon effects become stronger.",
    ["support-buff", "single-target-damage", "area-damage", "healing"],
    ["Radiant"],
    ["passive"],
    ["none"],
    self,
    ["druid", "circle-of-the-stars"],
    {
      displayGroup: starsGroup,
    }
  ),
];

const wildShapeIconEntries = Object.fromEntries(
  wildShapeDefinitions.map((entry) => [
    `druid-wild-shape-${entry.idBase}`,
    `Action_Druid_WildShape_${entry.idBase}.png`,
  ])
);

const wildShapeActionIconEntries = Object.fromEntries(
  wildShapeActionDefinitions.map((entry) => [
    `druid-wild-shape-${entry.shapeIdBase}-${entry.idBase}`,
    `Action_Druid_WildShape_${entry.shapeIdBase}_${entry.idBase}.png`,
  ])
);

const landChoiceIconEntries = Object.fromEntries(
  landChoiceDefinitions.flatMap((tier) =>
    Object.keys(tier.choices).map((landName) => [
      `druid-land-tier-${tier.tier}-${slug(landName)}`,
      `Passive_Druid_Land_${slug(landName)}.png`,
    ])
  )
);

const landSpellIconEntries = Object.fromEntries(
  landChoiceDefinitions.flatMap((tier) =>
    Object.entries(tier.choices).flatMap(([landName, spellIds]) =>
      spellIds.map((spellId) => [
        `druid-land-tier-${tier.tier}-${slug(landName)}-${spellId}`,
        `Spell_${spellId}.png`,
      ])
    )
  )
);

const sporesSpellIconEntries = Object.fromEntries(
  sporesCircleSpellIds.map((entry) => [
    `druid-spores-circle-spell-${entry.spellId}`,
    `Spell_${entry.spellId}.png`,
  ])
);

export const druidClassModule: ClassFeatureModule = {
  className: "Druid",
  defaultTabLabel: "Druid Features",
  subclassTabLabels: {
    [LAND]: "Land Features",
    [MOON]: "Moon Features",
    [SPORES]: "Spores Features",
    [STARS]: "Stars Features",
  },
  features: druidFeatures,
  iconFileByFeatureId: {
    "druid-spellcasting": "Passive_Druid_Spellcasting.png",
    "druid-wild-shape": "Action_Druid_WildShape.png",
    "druid-wild-shape-charges": "Passive_Druid_WildShapeCharges.png",
    "druid-wild-shape-improvement-level-4":
      "Passive_Druid_WildShapeImprovement.png",
    "druid-wild-shape-improvement-level-8":
      "Passive_Druid_WildShapeImprovement.png",
    "druid-wild-shape-improvement-level-12":
      "Passive_Druid_WildShapeImprovement.png",
    "druid-wild-strike": "Passive_Druid_WildStrike.png",
    "druid-improved-wild-strike": "Passive_Druid_ImprovedWildStrike.png",

    "druid-land-natural-recovery": "Action_Druid_Land_NaturalRecovery.png",
    "druid-land-natural-recovery-charges":
      "Passive_Druid_Land_NaturalRecoveryCharges.png",
    "druid-land-lands-stride-difficult-terrain":
      "Passive_Druid_Land_LandsStrideDifficultTerrain.png",
    "druid-land-lands-stride-advantage":
      "Passive_Druid_Land_LandsStrideAdvantage.png",
    "druid-land-lands-stride-plants":
      "Passive_Druid_Land_LandsStridePlants.png",
    "druid-land-natures-ward": "Passive_Druid_Land_NaturesWard.png",

    "druid-moon-combat-wild-shape":
      "Action_Druid_Moon_CombatWildShape.png",
    "druid-moon-lunar-mend": "Action_Druid_Moon_LunarMend.png",
    "druid-moon-primal-strike": "Passive_Druid_Moon_PrimalStrike.png",

    "druid-spores-bone-chill": "Spell_Necromancy_BoneChill.png",
    "druid-spores-halo-of-spores":
      "Reaction_Druid_Spores_HaloOfSpores.png",
    "druid-spores-symbiotic-entity":
      "Action_Druid_Spores_SymbioticEntity.png",
    "druid-spores-fungal-infestation":
      "Reaction_Druid_Spores_FungalInfestation.png",
    "druid-spores-fungal-infestation-charges":
      "Passive_Druid_Spores_FungalInfestationCharges.png",
    "druid-spores-spreading-spores":
      "Action_Druid_Spores_SpreadingSpores.png",

    "druid-stars-guidance": "Spell_Divination_Guidance.png",
    "druid-stars-starry-form": "Action_Druid_Stars_StarryForm.png",
    "druid-stars-starry-form-archer":
      "Action_Druid_Stars_StarryFormArcher.png",
    "druid-stars-starry-form-chalice":
      "Action_Druid_Stars_StarryFormChalice.png",
    "druid-stars-starry-form-dragon":
      "Action_Druid_Stars_StarryFormDragon.png",
    "druid-stars-luminous-arrow": "Action_Druid_Stars_LuminousArrow.png",
    "druid-stars-chalice-healing": "Action_Druid_Stars_ChaliceHealing.png",
    "druid-stars-dazzling-breath": "Action_Druid_Stars_DazzlingBreath.png",
    "druid-stars-guiding-bolt": "Spell_Evocation_GuidingBolt.png",
    "druid-stars-star-map-guiding-bolt":
      "Action_Druid_Stars_StarMapGuidingBolt.png",
    "druid-stars-star-maps-2": "Passive_Druid_Stars_StarMaps.png",
    "druid-stars-star-maps-3": "Passive_Druid_Stars_StarMaps.png",
    "druid-stars-star-maps-4": "Passive_Druid_Stars_StarMaps.png",
    "druid-stars-cosmic-omen": "Passive_Druid_Stars_CosmicOmen.png",
    "druid-stars-cosmic-omen-weal": "Reaction_Druid_Stars_CosmicOmenWeal.png",
    "druid-stars-cosmic-omen-woe": "Reaction_Druid_Stars_CosmicOmenWoe.png",
    "druid-stars-cosmic-omens-3": "Passive_Druid_Stars_CosmicOmens.png",
    "druid-stars-cosmic-omens-4": "Passive_Druid_Stars_CosmicOmens.png",
    "druid-stars-twinkling-constellations":
      "Passive_Druid_Stars_TwinklingConstellations.png",

    ...wildShapeIconEntries,
    ...wildShapeActionIconEntries,
    ...landChoiceIconEntries,
    ...landSpellIconEntries,
    ...sporesSpellIconEntries,
  },
};