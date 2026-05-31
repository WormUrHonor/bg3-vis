export type SpellRank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DamageType =
  | "Bludgeoning"
  | "Piercing"
  | "Slashing"
  | "Acid"
  | "Cold"
  | "Fire"
  | "Force"
  | "Lightning"
  | "Necrotic"
  | "Poison"
  | "Psychic"
  | "Radiant"
  | "Thunder"
  | "Physical"
  | "Weapon"
  | "Variable";

export type AbilityRole =
  | "single-target-damage"
  | "area-damage"
  | "control"
  | "support-buff"
  | "defense-protection"
  | "healing"
  | "mobility-positioning"
  | "narrative-interaction"
  | "investigation-world-interaction"
  | "summon";

export type RangeCategory =
  | "self"
  | "melee"
  | "mid"
  | "long"
  | "weapon-range";

export type RangeShape =
  | "self"
  | "melee"
  | "single-target"
  | "radius"
  | "cone"
  | "line"
  | "weapon";

export type ActionCost =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive"
  | "conditional";

export type ResourceCost =
  | "spell-slot"
  | "pact-magic-slot"
  | "cantrip"
  | "short-rest"
  | "long-rest"
  | "class-resource"
  | "none";

export type NumericEffectType =
  | DamageType
  | "Healing"
  | "Temporary Hit Points";

export type DamageDelivery =
  | "instant"
  | "weapon-hit"
  | "weapon-rider"
  | "retaliation"
  | "summon-attack"
  | "surface"
  | "start-turn"
  | "end-turn"
  | "per-turn"
  | "conditional"
  | "delayed"
  | "none";

export type DamageScaling =
  | "none"
  | "cantrip"
  | "spell-slot"
  | "warlock-beam"
  | "weapon"
  | "conditional"
  | "summon"
  | "variable";

export type DamageSaveBehaviour =
  | "none"
  | "half-on-save"
  | "negates-on-save"
  | "attack-roll"
  | "always-hit"
  | "weapon-attack"
  | "saving-throw"
  | "unknown";

export type DamageRoll = {
  diceCount: number;
  diceSize: number;
  flatBonus?: number;
  damageType: NumericEffectType;
  label?: string;
};

export type AbilityDamageProfile = {
  hasDamage: boolean;
  damageKind:
    | "none"
    | "damage"
    | "healing"
    | "temporary-hit-points"
    | "mixed";
  delivery: DamageDelivery;
  scaling: DamageScaling;
  saveBehaviour: DamageSaveBehaviour;
  saveAbility?: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
  attackRoll?: boolean;
  canCrit?: boolean;
  repeats?: boolean;
  repeatDurationTurns?: number;
  targetCount?: number | "variable";
  aoe?: boolean;
  aoeMeters?: number;
  rolls: DamageRoll[];
  notes?: string;
};
export type BG3Spell = {
  id: string;
  name: string;
  sourceType: "spell";
  rank: SpellRank;
  description?: string;
  range: {
    label: string;
    meters: number | null;
    category: RangeCategory;
    shape: RangeShape;
    aoeMeters?: number;
  };
  roles: AbilityRole[];
  damageTypes: DamageType[];
  damage?: AbilityDamageProfile;
  costs: {
    actions: ActionCost[];
    resources: ResourceCost[];
    spellSlotLevel?: SpellRank;
    requiresConcentration: boolean;
  };
  tags?: string[];
};

function spell(
  id: string,
  name: string,
  rank: SpellRank,
  range: BG3Spell["range"],
  roles: AbilityRole[],
  damageTypes: DamageType[],
  actions: ActionCost[],
  requiresConcentration = false,
  tags: string[] = []
): BG3Spell {
  return {
    id,
    name,
    sourceType: "spell",
    rank,
    range,
    roles,
    damageTypes,
    costs: {
      actions,
      resources: ["spell-slot"],
      spellSlotLevel: rank,
      requiresConcentration,
    },
    tags,
  };
}

function invocation(
  id: string,
  name: string,
  rank: SpellRank,
  range: BG3Spell["range"],
  roles: AbilityRole[],
  damageTypes: DamageType[],
  actions: ActionCost[],
  requiresConcentration = false,
  tags: string[] = []
): BG3Spell {
  return {
    id,
    name,
    sourceType: "spell",
    rank,
    range,
    roles,
    damageTypes,
    costs: {
      actions,
      resources: ["none"],
      requiresConcentration,
    },
    tags: ["invocation", ...tags],
  };
}

function cantrip(
  id: string,
  name: string,
  range: BG3Spell["range"],
  roles: AbilityRole[],
  damageTypes: DamageType[],
  actions: ActionCost[],
  requiresConcentration = false,
  tags: string[] = []
): BG3Spell {
  return {
    id,
    name,
    sourceType: "spell",
    rank: 0,
    range,
    roles,
    damageTypes,
    costs: {
      actions,
      resources: ["cantrip"],
      requiresConcentration,
    },
    tags: ["cantrip", ...tags],
  };
}

const self = { label: "self", meters: 0, category: "self", shape: "self" } as const;
const melee = { label: "1.5m", meters: 1.5, category: "melee", shape: "melee" } as const;
const touch = { label: "1.5m", meters: 1.5, category: "melee", shape: "single-target" } as const;
const weaponRange = { label: "weapon range", meters: 18, category: "long", shape: "weapon" } as const;


export const bg3Spells: BG3Spell[] = [
    cantrip(
    "acid-splash",
    "Acid Splash",
    { label: "18m, 2m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 2 },
    ["area-damage"],
    ["Acid"],
    ["action"]
  ),

  cantrip(
    "blade-ward",
    "Blade Ward",
    self,
    ["defense-protection"],
    [],
    ["action"]
  ),

  cantrip(
    "bone-chill",
    "Bone Chill",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage", "control"],
    ["Necrotic"],
    ["action"]
  ),

  cantrip(
    "booming-blade",
    "Booming Blade",
    weaponRange,
    ["single-target-damage", "control"],
    ["Weapon", "Thunder"],
    ["action"]
  ),

  cantrip(
    "bursting-sinew",
    "Bursting Sinew",
    { label: "18m, 3m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 3 },
    ["area-damage"],
    ["Piercing"],
    ["action"]
  ),

  cantrip(
    "dancing-lights",
    "Dancing Lights",
    { label: "18m, 9m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 9 },
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    true
  ),

  cantrip(
    "eldritch-blast",
    "Eldritch Blast",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage"],
    ["Force"],
    ["action"]
  ),

  cantrip(
    "fire-bolt",
    "Fire Bolt",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage"],
    ["Fire"],
    ["action"]
  ),

  cantrip(
    "friends",
    "Friends",
    { label: "9m", meters: 9, category: "mid", shape: "single-target" },
    ["narrative-interaction", "support-buff"],
    [],
    ["action"],
    true
  ),

  cantrip(
    "guidance",
    "Guidance",
    touch,
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"],
    true
  ),

  cantrip(
    "light",
    "Light",
    touch,
    ["support-buff", "investigation-world-interaction"],
    [],
    ["action"]
  ),

  cantrip(
    "mage-hand",
    "Mage Hand",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["summon", "investigation-world-interaction"],
    [],
    ["action"]
  ),

  cantrip(
    "minor-illusion",
    "Minor Illusion",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["control", "investigation-world-interaction"],
    [],
    ["action"]
  ),

  cantrip(
    "poison-spray",
    "Poison Spray",
    { label: "3m", meters: 3, category: "melee", shape: "single-target" },
    ["single-target-damage"],
    ["Poison"],
    ["action"]
  ),

  cantrip(
    "produce-flame",
    "Produce Flame",
    self,
    ["single-target-damage", "support-buff"],
    ["Fire"],
    ["action"]
  ),

  cantrip(
    "ray-of-frost",
    "Ray of Frost",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage", "control"],
    ["Cold"],
    ["action"]
  ),

  cantrip(
    "resistance",
    "Resistance",
    touch,
    ["support-buff", "defense-protection"],
    [],
    ["action"],
    true
  ),

  cantrip(
    "sacred-flame",
    "Sacred Flame",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage"],
    ["Radiant"],
    ["action"]
  ),

  cantrip(
    "shillelagh",
    "Shillelagh",
    self,
    ["support-buff", "single-target-damage"],
    ["Weapon"],
    ["bonus-action"]
  ),

  cantrip(
    "shocking-grasp",
    "Shocking Grasp",
    touch,
    ["single-target-damage", "control"],
    ["Lightning"],
    ["action"]
  ),

  cantrip(
    "thaumaturgy",
    "Thaumaturgy",
    self,
    ["narrative-interaction", "support-buff"],
    [],
    ["action"]
  ),

  cantrip(
    "thorn-whip",
    "Thorn Whip",
    { label: "9m", meters: 9, category: "mid", shape: "single-target" },
    ["single-target-damage", "control"],
    ["Piercing"],
    ["action"]
  ),

  cantrip(
    "toll-the-dead",
    "Toll the Dead",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage"],
    ["Necrotic"],
    ["action"]
  ),

  cantrip(
    "true-strike",
    "True Strike",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["support-buff"],
    [],
    ["action"],
    true
  ),

  cantrip(
    "vicious-mockery",
    "Vicious Mockery",
    { label: "18m", meters: 18, category: "long", shape: "single-target" },
    ["single-target-damage", "control"],
    ["Psychic"],
    ["action"]
  ),
  spell("animal-friendship", "Animal Friendship", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"]),
  spell("armour-of-agathys", "Armour of Agathys", 1, self, ["defense-protection"], ["Cold"], ["action"], false, ["temporary-hit-points", "retaliation"]),
  spell("arms-of-hadar", "Arms of Hadar", 1, { label: "3m", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["area-damage", "control"], ["Necrotic"], ["action"]),
  spell("bane", "Bane", 1, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-bane", "Invocation: Bane", 1, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("bless", "Bless", 1, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["support-buff"], [], ["action"], true),
  spell("burning-hands", "Burning Hands", 1, { label: "5m cone", meters: 5, category: "mid", shape: "cone" }, ["area-damage"], ["Fire"], ["action"]),
  spell("charm-person", "Charm Person", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control", "narrative-interaction"], [], ["action"], true),
  spell("chromatic-orb", "Chromatic Orb", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Thunder", "Acid", "Cold", "Fire", "Lightning", "Poison"], ["action"]),
  invocation("invocation-chromatic-orb", "Invocation: Chromatic Orb", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Thunder", "Acid", "Cold", "Fire", "Lightning", "Poison"], ["action"]),
  spell("colour-spray", "Colour Spray", 1, { label: "5m cone", meters: 5, category: "mid", shape: "cone" }, ["control"], [], ["action"]),
  spell("command", "Command", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"]),
  spell("compelled-duel", "Compelled Duel", 1, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["control", "defense-protection"], [], ["bonus-action"], true),
  spell("create-or-destroy-water", "Create or Destroy Water", 1, { label: "4m", meters: 4, category: "mid", shape: "radius" }, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("cure-wounds", "Cure Wounds", 1, touch, ["healing"], [], ["action"]),
spell("disguise-self", "Disguise Self", 1, self, ["narrative-interaction"], [], ["action"], false, ["ritual"]),
invocation("invocation-disguise-self", "Invocation: Disguise Self", 1, self, ["narrative-interaction"], [], ["action"], false, ["ritual"]),
 spell("dissonant-whispers", "Dissonant Whispers", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic"], ["action"]),
  spell("divine-favour", "Divine Favour", 1, self, ["support-buff", "single-target-damage"], ["Radiant"], ["bonus-action"], true),
 spell("enhance-leap", "Enhance Leap", 1, touch, ["mobility-positioning"], [], ["action"], false, ["ritual"]),
invocation("invocation-enhance-leap", "Invocation: Enhance Leap", 1, touch, ["mobility-positioning"], [], ["action"], false, ["ritual"]),
spell("ensnaring-strike-melee", "Ensnaring Strike (Melee)", 1, melee, ["single-target-damage", "control"], ["Weapon", "Piercing"], ["action", "bonus-action"], true),
  spell("ensnaring-strike-ranged", "Ensnaring Strike (Ranged)", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Weapon", "Piercing"], ["action", "bonus-action"], true),
  spell("entangle", "Entangle", 1, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["control"], [], ["action"], true),
  spell("expeditious-retreat", "Expeditious Retreat", 1, self, ["mobility-positioning"], [], ["bonus-action"]),
  spell("faerie-fire", "Faerie Fire", 1, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["control", "support-buff"], [], ["action"], true),
  spell("false-life", "False Life", 1, self, ["defense-protection"], [], ["action"]),
  invocation("invocation-false-life", "Invocation: False Life", 1, self, ["defense-protection"], [], ["action"]),
  spell("feather-fall", "Feather Fall", 1, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["defense-protection", "mobility-positioning"], [], ["bonus-action"], false, ["ritual"]),
 spell("find-familiar", "Find Familiar", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon", "investigation-world-interaction"], [], ["action"], false, ["ritual"]),
spell("find-familiar-imp", "Find Familiar: Imp", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"], false, ["ritual"]),
spell("find-familiar-quasit", "Find Familiar: Quasit", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"], false, ["ritual"]),
spell("find-familiar-cheeky-quasit", "Find Familiar: Cheeky Quasit", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"], false, ["ritual"]),
spell("fog-cloud", "Fog Cloud", 1, { label: "18m, 5m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 5 }, ["control", "defense-protection"], [], ["action"], true),
  spell("goodberry", "Goodberry", 1, touch, ["healing", "support-buff"], [], ["action"]),
  spell("guiding-bolt", "Guiding Bolt", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "support-buff"], ["Radiant"], ["action"]),
  spell("grease", "Grease", 1, { label: "18m, 5m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 5 }, ["control"], [], ["action"]),
  spell("hail-of-thorns", "Hail of Thorns", 1, { label: "18m, 2m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 2 }, ["area-damage"], ["Weapon", "Piercing"], ["action", "bonus-action"]),
  spell("healing-word", "Healing Word", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["healing"], [], ["bonus-action"]),
  spell("hellish-rebuke", "Hellish Rebuke", 1, { label: "reaction", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Fire"], ["reaction"]),
  spell("heroism", "Heroism", 1, touch, ["support-buff", "defense-protection"], [], ["action"], true),
  spell("hex", "Hex", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Necrotic"], ["bonus-action"], true),
  spell("hunters-mark", "Hunter's Mark", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Physical"], ["bonus-action"], true),
  spell("ice-knife", "Ice Knife", 1, { label: "18m, 2m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 2 }, ["single-target-damage", "area-damage", "control"], ["Piercing", "Cold"], ["action"]),
  spell("inflict-wounds", "Inflict Wounds", 1, touch, ["single-target-damage"], ["Necrotic"], ["action"]),
spell("longstrider", "Longstrider", 1, touch, ["mobility-positioning", "support-buff"], [], ["action"], false, ["ritual"]),
  spell("mage-armour", "Mage Armour", 1, touch, ["defense-protection"], [], ["action"]),
  invocation("invocation-mage-armour", "Invocation: Mage Armour", 1, touch, ["defense-protection"], [], ["action"]),
  spell("magic-missile", "Magic Missile", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"]),
  spell("protection-from-evil-and-good", "Protection from Evil and Good", 1, touch, ["defense-protection"], [], ["action"], true),
  spell("ray-of-sickness", "Ray of Sickness", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Poison"], ["action"]),
  invocation("invocation-ray-of-sickness", "Invocation: Ray of Sickness", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Poison"], ["action"]),
  spell("sanctuary", "Sanctuary", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["defense-protection"], [], ["bonus-action"]),
  spell("searing-smite", "Searing Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Fire"], ["action", "bonus-action"], true),
  spell("shield", "Shield", 1, self, ["defense-protection"], [], ["reaction"]),
  spell("shield-of-faith", "Shield of Faith", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["defense-protection"], [], ["bonus-action"], true),
  spell("sleep", "Sleep", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"]),
  spell("speak-with-animals", "Speak with Animals", 1, self, ["narrative-interaction"], [], ["action"], false, ["ritual"]),
invocation("invocation-speak-with-animals", "Invocation: Speak with Animals", 1, self, ["narrative-interaction"], [], ["action"], false, ["ritual"]),
 spell("tashas-hideous-laughter", "Tasha's Hideous Laughter", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("thunderous-smite", "Thunderous Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Thunder"], ["action", "bonus-action"]),
  spell("thunderwave", "Thunderwave", 1, { label: "1.5m, 5m AoE", meters: 5, category: "mid", shape: "radius", aoeMeters: 5 }, ["area-damage", "control"], ["Thunder"], ["action"]),
  spell("witch-bolt", "Witch Bolt", 1, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Lightning"], ["action"], true),
  spell("wrathful-smite", "Wrathful Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Psychic"], ["action", "bonus-action"], true),

  spell("aid", "Aid", 2, { label: "self, 9m", meters: 9, category: "mid", shape: "radius" }, ["support-buff", "healing"], [], ["action"]),
  spell("arcane-lock", "Arcane Lock", 2, touch, ["investigation-world-interaction"], [], ["action"]),
  spell("barkskin", "Barkskin", 2, touch, ["defense-protection"], [], ["action"], true),
  spell("blindness", "Blindness", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"]),
  spell("blur", "Blur", 2, self, ["defense-protection"], [], ["action"], true),
  spell("branding-smite", "Branding Smite", 2, weaponRange, ["single-target-damage", "control"], ["Weapon", "Radiant"], ["action", "bonus-action"], true),
  spell("calm-emotions", "Calm Emotions", 2, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["defense-protection", "control"], [], ["action"], true),
  spell("cloud-of-daggers", "Cloud of Daggers", 2, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["area-damage"], ["Slashing"], ["action"], true),
  spell("crown-of-madness", "Crown of Madness", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("darkness", "Darkness", 2, { label: "5m", meters: 5, category: "mid", shape: "radius" }, ["control", "defense-protection"], [], ["action"], true),
  spell("darkvision", "Darkvision", 2, touch, ["support-buff", "investigation-world-interaction"], [], ["action"]),
 spell("detect-thoughts", "Detect Thoughts", 2, self, ["narrative-interaction", "investigation-world-interaction"], [], ["action"], false, ["ritual"]),
spell("enhance-ability", "Enhance Ability", 2, touch, ["support-buff", "investigation-world-interaction"], [], ["action"], true),
  spell("enlarge-reduce", "Enlarge/Reduce", 2, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["support-buff", "control"], [], ["action"], true),
  spell("enthrall", "Enthrall", 2, { label: "6m", meters: 6, category: "mid", shape: "single-target" }, ["control"], [], ["action"]),
  spell("flame-blade", "Flame Blade", 2, self, ["summon", "single-target-damage"], ["Fire"], ["bonus-action"]),
  spell("flaming-sphere", "Flaming Sphere", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon", "area-damage"], ["Fire"], ["action"], true),
  spell("gust-of-wind", "Gust of Wind", 2, { label: "12m line", meters: 12, category: "mid", shape: "line" }, ["control"], [], ["action"]),
  spell("heat-metal", "Heat Metal", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Fire"], ["action"], true),
  spell("hold-person", "Hold Person", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("invisibility", "Invisibility", 2, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("knock", "Knock", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["investigation-world-interaction"], [], ["action"]),
  spell("lesser-restoration", "Lesser Restoration", 2, touch, ["support-buff", "healing"], [], ["action"]),
  spell("magic-weapon", "Magic Weapon", 2, touch, ["support-buff"], [], ["action"], true),
  spell("melfs-acid-arrow", "Melf's Acid Arrow", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Acid"], ["action"]),
  spell("mirror-image", "Mirror Image", 2, self, ["defense-protection"], [], ["action"]),
  spell("misty-step", "Misty Step", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["mobility-positioning"], [], ["bonus-action"]),
  spell("moonbeam", "Moonbeam", 2, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["area-damage"], ["Radiant"], ["action"], true),
  spell("pass-without-trace", "Pass Without Trace", 2, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["support-buff", "mobility-positioning"], [], ["action"], true),
  spell("phantasmal-force", "Phantasmal Force", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic", "Variable"], ["action"], true),
  spell("prayer-of-healing", "Prayer of Healing", 2, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["healing"], [], ["action"]),
  spell("protection-from-poison", "Protection from Poison", 2, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("ray-of-enfeeblement", "Ray of Enfeeblement", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("scorching-ray", "Scorching Ray", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Fire"], ["action"]),
  spell("see-invisibility", "See Invisibility", 2, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["investigation-world-interaction", "support-buff"], [], ["action"]),
  spell("shatter", "Shatter", 2, { label: "18m, 3m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 3 }, ["area-damage"], ["Thunder"], ["action"]),
  spell("silence", "Silence", 2, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["control", "defense-protection"], [], ["action"], true, ["ritual"]),
invocation("invocation-silence", "Invocation: Silence", 2, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["control", "defense-protection"], [], ["action"], true, ["ritual"]),
spell("shadow-blade", "Shadow Blade", 2, melee, ["summon", "single-target-damage"], ["Psychic"], ["bonus-action"]),
  spell("spike-growth", "Spike Growth", 2, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("spiritual-weapon", "Spiritual Weapon", 2, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon", "single-target-damage"], ["Force"], ["bonus-action"]),
  spell("warding-bond", "Warding Bond", 2, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("web", "Web", 2, { label: "18m, 4m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 4 }, ["control"], [], ["action"], true),

  spell("animate-dead", "Animate Dead", 3, { label: "3m", meters: 3, category: "melee", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("beacon-of-hope", "Beacon of Hope", 3, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["support-buff", "healing"], [], ["action"], true),
  spell("bestow-curse", "Bestow Curse", 3, touch, ["control"], [], ["action"], true),
  invocation("invocation-bestow-curse", "Invocation: Bestow Curse", 3, touch, ["control"], [], ["action"], true),
  spell("blinding-smite", "Blinding Smite", 3, melee, ["single-target-damage", "control"], ["Weapon", "Radiant"], ["action"]),
  spell("blink", "Blink", 3, self, ["defense-protection", "mobility-positioning"], [], ["action"]),
  spell("call-lightning", "Call Lightning", 3, { label: "18m, 2m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 2 }, ["area-damage"], ["Lightning"], ["action"], true),
  spell("conjure-barrage", "Conjure Barrage", 3, { label: "9m", meters: 9, category: "mid", shape: "cone" }, ["area-damage"], ["Weapon"], ["action"]),
  spell("counterspell", "Counterspell", 3, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["defense-protection", "control"], [], ["reaction"]),
  spell("crusaders-mantle", "Crusader's Mantle", 3, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["support-buff", "single-target-damage"], ["Radiant"], ["action"], true),
  spell("daylight", "Daylight", 3, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("elemental-weapon", "Elemental Weapon", 3, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Acid", "Cold", "Fire", "Lightning", "Thunder"], ["action"], true),
  spell("fear", "Fear", 3, { label: "9m", meters: 9, category: "mid", shape: "cone" }, ["control"], [], ["action"], true),
  spell("feign-death", "Feign Death", 3, touch, ["defense-protection"], [], ["action"]),
  spell("fireball", "Fireball", 3, { label: "18m, 4m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 4 }, ["area-damage"], ["Fire"], ["action"]),
  spell("gaseous-form", "Gaseous Form", 3, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("glyph-of-warding", "Glyph of Warding", 3, { label: "9m, 4m AoE", meters: 9, category: "mid", shape: "radius", aoeMeters: 4 }, ["area-damage", "control"], ["Thunder", "Lightning", "Fire", "Cold", "Acid"], ["action"]),
  spell("grant-flight", "Grant Flight", 3, touch, ["mobility-positioning"], [], ["action"], true),
  spell("haste", "Haste", 3, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["support-buff", "mobility-positioning", "defense-protection"], [], ["action"], true),
  spell("hunger-of-hadar", "Hunger of Hadar", 3, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Cold", "Acid"], ["action"], true),
  spell("hypnotic-pattern", "Hypnotic Pattern", 3, { label: "18m, 9m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 9 }, ["control"], [], ["action"], true),
  spell("lightning-arrow", "Lightning Arrow", 3, { label: "18m, 3m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 3 }, ["single-target-damage", "area-damage"], ["Lightning"], ["action"]),
  spell("lightning-bolt", "Lightning Bolt", 3, { label: "30m line", meters: 30, category: "long", shape: "line" }, ["area-damage"], ["Lightning"], ["action"]),
  spell("mass-healing-word", "Mass Healing Word", 3, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["healing"], [], ["bonus-action"]),
  spell("plant-growth", "Plant Growth", 3, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["control"], [], ["action"]),
  spell("protection-from-energy", "Protection from Energy", 3, touch, ["defense-protection"], [], ["action"], true),
  spell("remove-curse", "Remove Curse", 3, touch, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("revivify", "Revivify", 3, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["healing", "support-buff"], [], ["action"]),
  spell("sleet-storm", "Sleet Storm", 3, { label: "18m, 9m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 9 }, ["control"], [], ["action"], true),
  spell("slow", "Slow", 3, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-slow", "Invocation: Slow", 3, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  
spell("speak-with-dead", "Speak with Dead", 3, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["narrative-interaction", "investigation-world-interaction"], [], ["action"], false, ["ritual"]),
invocation("invocation-speak-with-dead", "Invocation: Speak with Dead", 3, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["narrative-interaction", "investigation-world-interaction"], [], ["action"], false, ["ritual"]),
 spell("spirit-guardians", "Spirit Guardians", 3, { label: "3m", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["area-damage", "control"], ["Radiant", "Necrotic"], ["action"], true),
  spell("stinking-cloud", "Stinking Cloud", 3, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  spell("vampiric-touch", "Vampiric Touch", 3, touch, ["single-target-damage", "healing"], ["Necrotic"], ["action"], true),
  spell("warden-of-vitality", "Warden of Vitality", 3, self, ["healing", "support-buff"], [], ["action"]),

  spell("banishment", "Banishment", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("blight", "Blight", 4, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Necrotic"], ["action"]),
  spell("confusion", "Confusion", 4, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  invocation("invocation-confusion", "Invocation: Confusion", 4, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  spell("conjure-minor-elemental", "Conjure Minor Elemental", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("conjure-woodland-being", "Conjure Woodland Being", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("death-ward", "Death Ward", 4, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("dimension-door", "Dimension Door", 4, touch, ["mobility-positioning"], [], ["action"]),
  spell("dominate-beast", "Dominate Beast", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("evards-black-tentacles", "Evard's Black Tentacles", 4, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Bludgeoning"], ["action"], true),
  spell("fire-shield", "Fire Shield", 4, touch, ["defense-protection", "single-target-damage"], ["Fire", "Cold"], ["action"]),
  spell("freedom-of-movement", "Freedom of Movement", 4, touch, ["support-buff", "defense-protection", "mobility-positioning"], [], ["action"]),
  spell("greater-invisibility", "Greater Invisibility", 4, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("guardian-of-faith", "Guardian of Faith", 4, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["summon", "single-target-damage"], ["Radiant"], ["action"]),
  spell("ice-storm", "Ice Storm", 4, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Bludgeoning", "Cold"], ["action"]),
  spell("otilukes-resilient-sphere", "Otiluke's Resilient Sphere", 4, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["defense-protection", "control"], [], ["action"], true),
  spell("phantasmal-killer", "Phantasmal Killer", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic"], ["action"], true),
  spell("polymorph", "Polymorph", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-polymorph", "Invocation: Polymorph", 4, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("stoneskin", "Stoneskin", 4, touch, ["defense-protection"], [], ["action"], true),
  spell("wall-of-fire", "Wall of Fire", 4, { label: "18m, 36m line", meters: 36, category: "long", shape: "line", aoeMeters: 36 }, ["area-damage", "control"], ["Fire"], ["action"], true),

  spell("artistry-of-war", "Artistry of War", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"], false, ["item-only"]),
  spell("banishing-smite", "Banishing Smite", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Force"], ["action", "bonus-action"], true),
  spell("banishing-smite-ranged", "Banishing Smite (Ranged)", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Force"], ["action", "bonus-action"], true),
  spell("cloudkill", "Cloudkill", 5, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Poison"], ["action"], true),
  spell("cone-of-cold", "Cone of Cold", 5, { label: "9m cone", meters: 9, category: "mid", shape: "cone" }, ["area-damage"], ["Cold"], ["action"]),
  spell("conjure-elemental", "Conjure Elemental", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"]),
  invocation("invocation-conjure-elemental", "Invocation: Conjure Elemental", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("contagion", "Contagion", 5, touch, ["control"], [], ["action"]),
  spell("destructive-wave", "Destructive Wave", 5, { label: "6m", meters: 6, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Thunder", "Radiant", "Necrotic"], ["action"]),
  spell("dethrone", "Dethrone", 5, { label: "30m", meters: 30, category: "long", shape: "single-target" }, ["single-target-damage"], ["Necrotic"], ["action"], false, ["item-only"]),
  spell("dispel-evil-and-good", "Dispel Evil and Good", 5, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("dominate-person", "Dominate Person", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("flame-strike", "Flame Strike", 5, { label: "18m, 3m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 3 }, ["area-damage"], ["Fire", "Radiant"], ["action"]),
  spell("grasping-vine", "Grasping Vine", 5, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["summon", "control"], [], ["bonus-action"]),
  spell("greater-restoration", "Greater Restoration", 5, touch, ["support-buff", "healing"], [], ["action"]),
  spell("hold-monster", "Hold Monster", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("insect-plague", "Insect Plague", 5, { label: "18m, 6m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("mass-cure-wounds", "Mass Cure Wounds", 5, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["healing"], [], ["action"]),
  spell("planar-binding", "Planar Binding", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("seeming", "Seeming", 5, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["narrative-interaction"], [], ["action"], true),
  spell("staggering-smite", "Staggering Smite", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Psychic"], ["action", "bonus-action"]),
  spell("telekinesis", "Telekinesis", 5, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control", "mobility-positioning", "single-target-damage"], ["Variable"], ["action"], true),
  spell("wall-of-stone", "Wall of Stone", 5, { label: "18m", meters: 18, category: "long", shape: "line" }, ["summon", "control", "defense-protection"], [], ["action"], true),

  spell("arcane-gate", "Arcane Gate", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["mobility-positioning"], [], ["action"], true),
  spell("blade-barrier", "Blade Barrier", 6, { label: "18m", meters: 18, category: "long", shape: "line" }, ["summon", "area-damage", "control"], ["Slashing"], ["action"], true),
  spell("chain-lightning", "Chain Lightning", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["area-damage"], ["Lightning"], ["action"]),
  spell("circle-of-death", "Circle of Death", 6, { label: "18m, 9m AoE", meters: 18, category: "long", shape: "radius", aoeMeters: 9 }, ["area-damage"], ["Necrotic"], ["action"]),
  spell("create-undead", "Create Undead", 6, { label: "3m", meters: 3, category: "melee", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("disintegrate", "Disintegrate", 6, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"]),
  spell("eyebite", "Eyebite", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("flesh-to-stone", "Flesh to Stone", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("globe-of-invulnerability", "Globe of Invulnerability", 6, { label: "3m", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["defense-protection"], [], ["action"], true),
  spell("harm", "Harm", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["single-target-damage", "control"], ["Necrotic"], ["action"]),
  spell("heal", "Heal", 6, touch, ["healing", "support-buff"], [], ["action"]),
  spell("heroes-feast", "Heroes' Feast", 6, { label: "18m", meters: 18, category: "long", shape: "radius" }, ["support-buff", "defense-protection"], [], ["action"]),
  spell("otilukes-freezing-sphere", "Otiluke's Freezing Sphere", 6, touch, ["area-damage"], ["Cold"], ["action"]),
  spell("ottos-irresistible-dance", "Otto's Irresistible Dance", 6, { label: "9m", meters: 9, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("planar-ally", "Planar Ally", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("sights-of-the-seelie-summon-deva", "Sights of the Seelie: Summon Deva", 6, { label: "18m", meters: 18, category: "long", shape: "single-target" }, ["summon"], [], ["action"], false, ["item-only"]),
  spell("sunbeam", "Sunbeam", 6, { label: "18m line", meters: 18, category: "long", shape: "line" }, ["area-damage", "control"], ["Radiant"], ["action"], true),
  spell("wall-of-ice", "Wall of Ice", 6, { label: "18m, 9m line", meters: 18, category: "long", shape: "line", aoeMeters: 9 }, ["area-damage", "control"], ["Cold"], ["action"], true),
  spell("wall-of-thorns", "Wall of Thorns", 6, { label: "18m", meters: 18, category: "long", shape: "line" }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("wind-walk", "Wind Walk", 6, { label: "9m", meters: 9, category: "mid", shape: "radius" }, ["mobility-positioning", "defense-protection"], [], ["action"], true),
];

const spellDescriptions: Record<string, string> = {
  "acid-splash": "Hurl a bubble of acid that damages creatures in a small area.",
  "blade-ward": "Take only half damage from Bludgeoning, Piercing, and Slashing attacks for a short time.",
  "bone-chill": "Deal Necrotic damage and prevent the target from regaining Hit Points. Undead targets also receive Disadvantage on Attack Rolls.",
  "booming-blade": "Make a weapon attack that deals normal weapon damage and wreathes the target in unstable Thunder energy.",
  "bursting-sinew": "Burst a corpse or target area, dealing Piercing damage in a small radius.",
  "dancing-lights": "Create lights that illuminate an area.",
  "eldritch-blast": "Fire a beam of crackling Force energy.",
  "fire-bolt": "Hurl a mote of fire that deals Fire damage and can ignite flammable surfaces.",
  "friends": "Gain Advantage on Charisma Checks against a non-hostile creature.",
  "guidance": "Grant a creature a 1d4 bonus to Ability Checks.",
  "light": "Infuse an object with an aura of light.",
  "mage-hand": "Create a spectral hand that can manipulate and throw objects.",
  "minor-illusion": "Create an illusion that distracts nearby creatures.",
  "poison-spray": "Project a puff of noxious gas that deals Poison damage.",
  "produce-flame": "Create a flame in your hand that sheds light and can be hurled at enemies.",
  "ray-of-frost": "Reduce a creature's Movement Speed and deal Cold damage.",
  "resistance": "Grant a creature a 1d4 bonus to Saving Throws.",
  "sacred-flame": "Call down radiant flame that ignores cover and forces a Dexterity Saving Throw.",
  "shillelagh": "Imbue your staff or club with nature's power.",
  "shocking-grasp": "Shock a creature with Lightning damage and prevent it from taking reactions.",
  "thaumaturgy": "Gain Advantage on Intimidation and Performance checks.",
  "thorn-whip": "Strike a creature with a thorny vine and pull it closer.",
  "toll-the-dead": "Force a creature to make a Wisdom Saving Throw or take Necrotic damage.",
  "true-strike": "Gain Advantage on your next Attack Roll against the target.",
  "vicious-mockery": "Insult a creature with magical force, dealing Psychic damage and imposing Disadvantage on its next Attack Roll.",
  "animal-friendship": "Convince a beast not to attack you. The creature must have an Intelligence of 3 or less. The condition ends early if you or an ally hurts the target.",
  "armour-of-agathys": "Gain 5 Temporary Hit Points and deal Cold damage to any creature that hits you with a melee attack.",
  "arms-of-hadar": "Prevent nearby targets from using reactions. Targets still take half damage on a successful save.",
  "bane": "Up to 3 creatures receive a 1d4 penalty to Attack Rolls and Saving Throws.",
  "invocation-bane": "Up to 3 creatures receive a 1d4 penalty to Attack Rolls and Saving Throws.",
  "bless": "Bless up to 3 creatures. They gain a 1d4 bonus to Attack Rolls and Saving Throws.",
  "burning-hands": "Hit flammable targets in a cone with Fire damage. Targets still take half damage on a successful save.",
  "charm-person": "Charm a humanoid to prevent it from attacking you and gain Advantage on Charisma Checks in dialogue.",
  "chromatic-orb": "Hurl a sphere of elemental energy. It can deal Thunder, Acid, Cold, Fire, Lightning, or Poison damage and may create a surface.",
  "invocation-chromatic-orb": "Hurl a sphere of elemental energy. It can deal Thunder, Acid, Cold, Fire, Lightning, or Poison damage and may create a surface.",
  "colour-spray": "Blind creatures up to a combined hit point threshold.",
  "command": "Command a creature to flee, approach, freeze, drop prone, or drop its weapon.",
  "compelled-duel": "Compel an enemy to attack only you. The target has Disadvantage on attacks against others.",
  "create-or-destroy-water": "Create rain or destroy a water-based surface.",
  "cure-wounds": "Heal a creature you can touch. Has no effect on undead or constructs.",
  "disguise-self": "Magically change your appearance.",
  "invocation-disguise-self": "Magically change your appearance.",
  "dissonant-whispers": "Frighten a creature and deal Psychic damage. On a successful save, it takes half damage.",
  "divine-favour": "Empower your weapon attacks with additional Radiant damage.",
  "enhance-leap": "Triple a creature's jumping distance.",
  "invocation-enhance-leap": "Triple a creature's jumping distance.",
  "ensnaring-strike-melee": "Make a melee weapon attack that summons thorny vines, potentially Ensnaring the target.",
  "ensnaring-strike-ranged": "Make a ranged weapon attack that summons thorny vines, potentially Ensnaring the target.",
  "entangle": "Create vines that turn the ground into Difficult Terrain and may Entangle creatures.",
  "expeditious-retreat": "Gain Dash immediately and as a bonus action on later turns while the spell lasts.",
  "faerie-fire": "Reveal targets in light and give Attack Rolls against them Advantage.",
  "false-life": "Gain Temporary Hit Points through necromantic magic.",
  "invocation-false-life": "Gain Temporary Hit Points through necromantic magic.",
  "feather-fall": "You and nearby allies gain immunity to Falling damage.",
  "find-familiar": "Summon a familiar in an animal form of your choice.",
  "find-familiar-imp": "Summon an imp familiar that can fly, turn invisible, and sting enemies.",
  "find-familiar-quasit": "Summon a quasit familiar that can turn invisible and scare enemies.",
  "find-familiar-cheeky-quasit": "Summon a cheeky quasit familiar that can turn invisible and scare enemies.",
  "fog-cloud": "Create a dense fog cloud that heavily obscures and blinds creatures within.",
  "goodberry": "Conjure magical berries that restore Hit Points when consumed.",
  "guiding-bolt": "Deal Radiant damage and give the next Attack Roll against the target Advantage.",
  "grease": "Cover the ground in flammable grease, creating Difficult Terrain and possibly knocking creatures Prone.",
  "hail-of-thorns": "Shoot thorns that deal weapon damage and additional Piercing damage to nearby creatures.",
  "healing-word": "Heal a creature you can see. Has no effect on undead or constructs.",
  "hellish-rebuke": "React to an attacker with flames that deal Fire damage. The target takes half damage on a successful save.",
  "heroism": "Make a target immune to Frightened and grant Temporary Hit Points each turn.",
  "hex": "Curse a target so your attacks deal additional Necrotic damage and impose Disadvantage on one ability's checks.",
  "hunters-mark": "Mark a creature as your quarry and deal additional damage whenever you hit it with a weapon attack.",
  "ice-knife": "Throw a shard of ice that deals Piercing damage, explodes for Cold damage, and creates an Ice surface.",
  "inflict-wounds": "Putrefy a creature with Necrotic energy.",
  "longstrider": "Increase a creature's Movement Speed.",
  "mage-armour": "Increase the Armour Class of an unarmoured creature.",
  "invocation-mage-armour": "Increase the Armour Class of an unarmoured creature.",
  "magic-missile": "Create three magical darts of Force damage that always hit.",
  "protection-from-evil-and-good": "Protect a target from Aberrations, Celestials, Elementals, Fey, Fiends, and Undead.",
  "ray-of-sickness": "Deal Poison damage and possibly Poison the target.",
  "invocation-ray-of-sickness": "Deal Poison damage and possibly Poison the target.",
  "sanctuary": "Prevent a target from being targeted by enemy attacks until it attacks or harms a creature.",
  "searing-smite": "Add Fire damage to a weapon attack and mark the target with burning damage over time.",
  "shield": "Use your reaction to increase Armour Class and block Magic Missile until your next turn.",
  "shield-of-faith": "Increase a creature's Armour Class by 2.",
  "sleep": "Put creatures into magical slumber up to a combined hit point threshold.",
  "speak-with-animals": "Gain the ability to understand and communicate with beasts.",
  "invocation-speak-with-animals": "Gain the ability to understand and communicate with beasts.",
  "tashas-hideous-laughter": "Leave a creature Prone with laughter and unable to get up.",
  "thunderous-smite": "Add Thunder damage to a weapon strike and possibly push the target away and knock it Prone.",
  "thunderwave": "Release a wave of thunderous force that deals Thunder damage and pushes creatures away.",
  "witch-bolt": "Link yourself to a target with lightning and repeatedly deal Lightning damage while concentrating.",
  "wrathful-smite": "Add Psychic damage to a weapon strike and possibly Frighten the target.",

  "aid": "Bolster allies by healing them and increasing their maximum Hit Points.",
  "arcane-lock": "Magically lock a door or container so it cannot be opened normally.",
  "barkskin": "Toughen a willing creature's skin and increase its Armour Class.",
  "blindness": "Limit a foe's sight, making it easier to hit and causing its attacks to suffer Disadvantage.",
  "blur": "Blur your body so attackers have Disadvantage on Attack Rolls against you.",
  "branding-smite": "Mark a target with radiant light, dealing additional damage and preventing invisibility.",
  "calm-emotions": "Prevent humanoids from being Charmed, Frightened, or enraged.",
  "cloud-of-daggers": "Create a cloud of spinning daggers that damages creatures inside it.",
  "crown-of-madness": "Force a humanoid enemy to attack the nearest creature other than you.",
  "darkness": "Create magical darkness that heavily obscures and blinds creatures inside.",
  "darkvision": "Grant a creature the ability to see in the dark.",
  "detect-thoughts": "Read the thoughts of certain creatures while speaking with them.",
  "enhance-ability": "Grant Advantage on Ability Checks for a chosen ability.",
  "enlarge-reduce": "Make a creature larger or smaller, affecting weapon damage and Strength checks.",
  "enthrall": "Reduce a creature's peripheral vision and draw its attention to you.",
  "flame-blade": "Conjure a flaming scimitar that deals Fire damage.",
  "flaming-sphere": "Summon a Flaming Sphere that damages nearby enemies and objects.",
  "gust-of-wind": "Summon a strong wind that clears clouds and can push creatures back.",
  "heat-metal": "Heat a metal weapon or armour, dealing Fire damage and imposing penalties.",
  "hold-person": "Paralyse a humanoid. Nearby attacks against it are always critical hits.",
  "invisibility": "Turn a creature Invisible until it attacks, casts a spell, or breaks the condition.",
  "knock": "Unlock a mundane locked object.",
  "lesser-restoration": "Cure Disease, Poison, Paralysis, or Blindness.",
  "magic-weapon": "Make a weapon magical and improve its Attack Rolls and Damage Rolls.",
  "melfs-acid-arrow": "Shoot an acid arrow that deals immediate and delayed Acid damage.",
  "mirror-image": "Create illusory duplicates that increase your Armour Class and disappear when attacks miss.",
  "misty-step": "Teleport to an unoccupied space you can see.",
  "moonbeam": "Call down a beam of light that deals Radiant damage to creatures entering or starting in it.",
  "pass-without-trace": "Give nearby allies a large bonus to Stealth Checks.",
  "phantasmal-force": "Damage a creature each turn with Psychic damage that can adapt to damage types it recently suffered.",
  "prayer-of-healing": "Heal all visible allies within range outside combat.",
  "protection-from-poison": "Neutralize poison and grant protection against Poison effects and Poison damage.",
  "ray-of-enfeeblement": "Weaken a foe so its Strength-based weapon attacks deal reduced damage.",
  "scorching-ray": "Hurl three rays of Fire damage.",
  "see-invisibility": "See Invisible creatures and possibly reveal them.",
  "shatter": "Damage nearby creatures and objects with Thunder damage.",
  "silence": "Create a sound-proof sphere that Silences creatures and grants immunity to Thunder damage inside.",
  "invocation-silence": "Create a sound-proof sphere that Silences creatures and grants immunity to Thunder damage inside.",
  "shadow-blade": "Conjure a shadowy shortsword that deals Psychic damage and gains Advantage in dim light or darkness.",
  "spike-growth": "Create spiked ground that damages creatures moving through it and creates Difficult Terrain.",
  "spiritual-weapon": "Summon a spectral weapon that attacks enemies alongside you.",
  "warding-bond": "Ward an ally, increasing defenses and resistance while sharing damage with the caster.",
  "web": "Cover an area in flammable webbing that can restrain creatures.",

  "animate-dead": "Animate a corpse to create an undead servant outside combat.",
  "beacon-of-hope": "Allies regain maximum possible healing and gain Advantage on Wisdom and Death Saving Throws.",
  "bestow-curse": "Curse a creature with a chosen debilitating effect.",
  "invocation-bestow-curse": "Curse a creature with a chosen debilitating effect.",
  "blinding-smite": "Strike with radiant force and possibly Blind the target.",
  "blink": "At the end of your turn, possibly vanish into the Ethereal Plane and return later.",
  "call-lightning": "Call down Lightning damage in an area and recast it while concentration remains active.",
  "conjure-barrage": "Channel your weapon into a cone attack that deals weapon-based damage.",
  "counterspell": "Use your reaction to nullify another creature's spell.",
  "crusaders-mantle": "Radiate holy power so nearby allies deal additional Radiant damage with weapon attacks.",
  "daylight": "Create or enchant an object with bright sunlight that dispels darkness.",
  "elemental-weapon": "Imbue a weapon with elemental damage and improve its Attack Rolls.",
  "fear": "Frighten targets, making them drop items, become easier to hit, and unable to move.",
  "feign-death": "Put an ally in a protective coma, granting damage resistance except against Psychic damage.",
  "fireball": "Launch a fireball that explodes and deals Fire damage in an area.",
  "gaseous-form": "Transform a target into a gas cloud, making it hard to damage but unable to attack or cast spells.",
  "glyph-of-warding": "Place a magical glyph that triggers a selected effect when stepped on.",
  "grant-flight": "Grant yourself or an ally the ability to Fly.",
  "haste": "Hasten a creature, improving Armour Class, Dexterity Saves, Movement Speed, and actions.",
  "hunger-of-hadar": "Create a dark sphere that blinds, slows, and damages creatures inside.",
  "hypnotic-pattern": "Hypnotise creatures in an area, preventing them from moving or acting.",
  "lightning-arrow": "Transform an arrow into lightning that damages the target and nearby creatures.",
  "lightning-bolt": "Blast creatures in a line with Lightning damage.",
  "mass-healing-word": "Heal up to six creatures with a bonus action.",
  "plant-growth": "Create overgrown terrain that heavily slows movement.",
  "protection-from-energy": "Grant resistance to Acid, Cold, Fire, Lightning, or Thunder damage.",
  "remove-curse": "Remove curses and hexes from a creature or object.",
  "revivify": "Revive a dead companion with 1 Hit Point.",
  "sleet-storm": "Create an ice storm that disrupts concentration, extinguishes fire, and can knock creatures Prone.",
  "slow": "Slow up to six enemies, limiting movement and actions.",
  "invocation-slow": "Slow up to six enemies, limiting movement and actions.",
  "speak-with-dead": "Allow a corpse to answer questions and enable recasting until Long Rest.",
  "invocation-speak-with-dead": "Allow a corpse to answer questions and enable recasting until Long Rest.",
  "spirit-guardians": "Summon spirits around you that damage nearby enemies and reduce their Movement Speed.",
  "stinking-cloud": "Create a nauseating gas cloud that prevents creatures from taking actions.",
  "vampiric-touch": "Drain life from a touched enemy and regain half the damage dealt as Hit Points.",
  "warden-of-vitality": "Create a healing aura that allows repeated bonus-action healing.",

  "banishment": "Temporarily banish a target to another plane of existence.",
  "blight": "Deal Necrotic damage to a target, with especially strong effect against plants.",
  "confusion": "Befuddle creatures in an area, causing erratic movement, random attacks, and skipped turns.",
  "invocation-confusion": "Befuddle creatures in an area, causing erratic movement, random attacks, and skipped turns.",
  "conjure-minor-elemental": "Summon a minor elemental ally.",
  "conjure-woodland-being": "Summon a Dryad ally that can use nature magic and summon a Wood Woad.",
  "death-ward": "Protect a creature so the next lethal damage leaves it conscious with 1 Hit Point.",
  "dimension-door": "Teleport yourself and one adjacent ally to a visible location.",
  "dominate-beast": "Dominate a Beast and make it fight alongside you.",
  "evards-black-tentacles": "Create tentacles that turn an area into Difficult Terrain and damage or Smother creatures.",
  "fire-shield": "Wreathe yourself in flame or frost, gaining resistance and retaliating against melee attackers.",
  "freedom-of-movement": "Free an ally from movement restrictions and protect against difficult terrain and paralysis.",
  "greater-invisibility": "Turn a creature Invisible with repeated stealth checks needed to maintain the effect.",
  "guardian-of-faith": "Summon a divine guardian that attacks nearby enemies.",
  "ice-storm": "Call down hail and ice, dealing Bludgeoning and Cold damage and creating an Ice surface.",
  "otilukes-resilient-sphere": "Enclose a target in a force sphere that blocks incoming and outgoing damage.",
  "phantasmal-killer": "Haunt a creature with fears, dealing Psychic damage and impairing movement.",
  "polymorph": "Transform a creature into a harmless sheep.",
  "invocation-polymorph": "Transform a creature into a harmless sheep.",
  "stoneskin": "Reduce incoming non-magical Bludgeoning, Piercing, and Slashing damage.",
  "wall-of-fire": "Create a wall of fire that damages creatures moving into or starting near it.",

  "artistry-of-war": "Summon apparitions of master strategists that strike chosen targets with Force damage.",
  "banishing-smite": "Strike with Force damage and possibly banish the target.",
  "banishing-smite-ranged": "Strike at weapon range with Force damage and possibly banish the target.",
  "cloudkill": "Create a poisonous cloud that damages creatures and can be repositioned each turn.",
  "cone-of-cold": "Release a cone of freezing air that deals Cold damage.",
  "conjure-elemental": "Summon an elemental ally from the planes.",
  "invocation-conjure-elemental": "Summon an elemental ally from the planes.",
  "contagion": "Poison a target and potentially infect it with a chosen disease.",
  "destructive-wave": "Create a shockwave that deals Thunder and Radiant or Necrotic damage and may knock targets Prone.",
  "dethrone": "Shred a foe with Necrotic force drawn from the Weave.",
  "dispel-evil-and-good": "Protect yourself from extraplanar and undead creatures and break certain enchantments.",
  "dominate-person": "Dominate a humanoid and make it fight alongside you.",
  "flame-strike": "Call down a pillar of divine fire that deals Fire and Radiant damage.",
  "grasping-vine": "Summon a vine that can drag creatures toward itself.",
  "greater-restoration": "Remove Charm, Petrification, Stun, or Curse from a creature.",
  "hold-monster": "Paralyse a creature. Nearby attacks against it are always critical hits.",
  "insect-plague": "Summon locusts that damage creatures, create Difficult Terrain, and impair Perception.",
  "mass-cure-wounds": "Heal yourself and nearby allies.",
  "planar-binding": "Bind an otherworldly creature to fight as your ally.",
  "seeming": "Disguise up to four party members.",
  "staggering-smite": "Strike with Psychic damage and possibly prevent reactions and impair attacks.",
  "telekinesis": "Move or throw a creature or object with your mind, with repeated use while concentrating.",
  "wall-of-stone": "Raise a solid stone wall that blocks movement and line of sight.",

  "arcane-gate": "Create two linked teleportation portals.",
  "blade-barrier": "Summon a wall of blades that damages creatures and creates Difficult Terrain.",
  "chain-lightning": "Strike one enemy with Lightning and arc additional bolts to nearby enemies.",
  "circle-of-death": "Create a sphere of Necrotic energy that damages creatures in an area.",
  "create-undead": "Raise a corpse as a mummy servant.",
  "disintegrate": "Fire a green ray that deals heavy Force damage and disintegrates slain targets.",
  "eyebite": "Use your gaze to inflict panic, sickness, or sleep repeatedly while concentrating.",
  "flesh-to-stone": "Restrain a foe and potentially petrify it over several turns.",
  "globe-of-invulnerability": "Create a barrier that makes creatures and objects inside immune to all damage.",
  "harm": "Deal Necrotic damage and reduce the target's maximum Hit Points.",
  "heal": "Restore a large amount of Hit Points and remove blindness and disease.",
  "heroes-feast": "Grant allies protection from poison, disease, and fear, increase maximum Hit Points, and improve Wisdom Saves.",
  "otilukes-freezing-sphere": "Create a freezing sphere that can be launched or stored for later use.",
  "ottos-irresistible-dance": "Force a creature to dance, preventing actions and movement while weakening its attacks and saves.",
  "planar-ally": "Summon a powerful otherworldly ally.",
  "sights-of-the-seelie-summon-deva": "Summon a Deva through Planar Ally.",
  "sunbeam": "Fire a radiant beam that damages and blinds creatures in its path, with recasts while concentrating.",
  "wall-of-ice": "Raise an ice wall that deals Cold damage and leaves damaging frigid air when broken.",
  "wall-of-thorns": "Create a thorn wall that damages, slows, and may Entangle creatures.",
  "wind-walk": "Transform the party into mist clouds with flight and defensive benefits."
};

const spellDamageProfiles: Record<string, AbilityDamageProfile> = {
  "acid-splash": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 2,
    rolls: [roll(1, 6, "Acid")],
  }),

  "blade-ward": noDamage("Defensive resistance effect."),

  "bone-chill": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Necrotic")],
    notes: "Prevents healing until the next turn.",
  }),

  "booming-blade": damageProfile({
    delivery: "weapon-hit",
    scaling: "cantrip",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Thunder", 0, "conditional movement damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  "bursting-sinew": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 3,
    rolls: [roll(1, 10, "Piercing")],
  }),

  "dancing-lights": noDamage("Light and investigation utility."),

  "eldritch-blast": damageProfile({
    delivery: "instant",
    scaling: "warlock-beam",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 10, "Force")],
    notes: "Shown per beam.",
  }),

  "fire-bolt": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 10, "Fire")],
  }),

  friends: noDamage("Dialogue and social interaction buff."),
  guidance: noDamage("Ability check bonus."),
  light: noDamage("Light utility."),
  "mage-hand": noDamage("Summoned utility hand."),
  "minor-illusion": noDamage("Distraction utility."),

  "poison-spray": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "CON",
    rolls: [roll(1, 12, "Poison")],
  }),

  "produce-flame": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Fire")],
    notes: "The flame can also be used as a light source.",
  }),

  "ray-of-frost": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Cold")],
  }),

  resistance: noDamage("Saving throw bonus."),

  "sacred-flame": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "DEX",
    rolls: [roll(1, 8, "Radiant")],
  }),

  shillelagh: damageProfile({
    delivery: "weapon-hit",
    scaling: "weapon",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Weapon", 2, "empowered staff or club damage")],
  }),

  "shocking-grasp": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Lightning")],
  }),

  thaumaturgy: noDamage("Dialogue and performance utility."),

  "thorn-whip": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 6, "Piercing")],
    notes: "Also pulls the target closer.",
  }),

  "toll-the-dead": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "WIS",
    rolls: [roll(1, 12, "Necrotic")],
    notes: "Uses 1d8 if the target is at full health.",
  }),

  "true-strike": noDamage("Attack advantage setup."),

  "vicious-mockery": damageProfile({
    delivery: "instant",
    scaling: "cantrip",
    saveBehaviour: "negates-on-save",
    saveAbility: "WIS",
    rolls: [roll(1, 4, "Psychic")],
  }),

  "animal-friendship": noDamage("Beast charm/control effect."),

  "armour-of-agathys": mixedProfile({
    delivery: "retaliation",
    scaling: "spell-slot",
    saveBehaviour: "none",
    repeats: true,
    rolls: [
      flat(5, "Temporary Hit Points", "temporary HP"),
      flat(5, "Cold", "retaliation damage"),
    ],
    notes: "Both temporary HP and retaliation damage scale with spell slot level.",
  }),

  "arms-of-hadar": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "STR",
    aoe: true,
    aoeMeters: 3,
    rolls: [roll(2, 6, "Necrotic")],
  }),

  bane: noDamage("Attack roll and saving throw penalty."),
  "invocation-bane": noDamage("Attack roll and saving throw penalty."),
  bless: noDamage("Attack roll and saving throw bonus."),

  "burning-hands": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [roll(3, 6, "Fire")],
  }),

  "charm-person": noDamage("Charm and dialogue control."),

  "chromatic-orb": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(3, 8, "Thunder", 0, "Thunder variant"),
      roll(2, 8, "Variable", 0, "acid/cold/fire/lightning/poison variants"),
    ],
    notes: "Thunder variant deals 3d8. Other elemental variants deal 2d8 and create a surface.",
  }),

  "invocation-chromatic-orb": damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(3, 8, "Thunder", 0, "Thunder variant"),
      roll(2, 8, "Variable", 0, "acid/cold/fire/lightning/poison variants"),
    ],
  }),

  "colour-spray": noDamage("Blindness based on hit point threshold."),
  command: noDamage("Command control effect."),
  "compelled-duel": noDamage("Taunt/control effect."),
  "create-or-destroy-water": noDamage("Surface and environmental utility."),

  "cure-wounds": healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    rolls: [roll(1, 8, "Healing", 2, "healing")],
    notes: "The +2 reflects the pasted wiki value. Replace with spellcasting modifier if your app later tracks ability modifiers.",
  }),

  "disguise-self": noDamage("Appearance and narrative interaction."),
  "invocation-disguise-self": noDamage("Appearance and narrative interaction."),

  "dissonant-whispers": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "WIS",
    rolls: [roll(3, 6, "Psychic")],
  }),

  "divine-favour": damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    repeats: true,
    rolls: [roll(1, 4, "Radiant", 0, "added weapon damage")],
  }),

  "enhance-leap": noDamage("Mobility utility."),
  "invocation-enhance-leap": noDamage("Mobility utility."),

  "ensnaring-strike-melee": damageProfile({
    delivery: "weapon-hit",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 6, "Piercing", 0, "ensnaring vines damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  "ensnaring-strike-ranged": damageProfile({
    delivery: "weapon-hit",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 6, "Piercing", 0, "ensnaring vines damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  entangle: noDamage("Area control and difficult terrain."),
  "expeditious-retreat": noDamage("Mobility utility."),
  "faerie-fire": noDamage("Reveals targets and grants advantage against them."),

  "false-life": temporaryHpProfile(7, "Temporary hit points."),
  "invocation-false-life": temporaryHpProfile(7, "Temporary hit points."),

  "feather-fall": noDamage("Fall damage protection."),
  "find-familiar": noDamage("Summons a familiar. Familiar attack damage is not encoded here."),
  "find-familiar-imp": noDamage("Summons an imp familiar. Familiar attack damage is not encoded here."),
  "find-familiar-quasit": noDamage("Summons a quasit familiar. Familiar attack damage is not encoded here."),
  "find-familiar-cheeky-quasit": noDamage("Summons a quasit familiar. Familiar attack damage is not encoded here."),
  "fog-cloud": noDamage("Obscuring area control."),

  goodberry: healingProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [roll(4, 4, "Healing", 0, "total healing across four berries")],
  }),

  "guiding-bolt": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(4, 6, "Radiant")],
  }),

  grease: noDamage("Surface control. The base spell is non-damaging."),

  "hail-of-thorns": damageProfile({
    delivery: "weapon-hit",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 2,
    rolls: [roll(1, 10, "Piercing", 0, "thorn explosion")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  "healing-word": healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    rolls: [roll(1, 4, "Healing", 0, "healing")],
  }),

  "hellish-rebuke": damageProfile({
    delivery: "retaliation",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    rolls: [roll(2, 10, "Fire")],
  }),

  heroism: temporaryHpProfile(5, "Temporary HP each turn while active."),

  hex: damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    rolls: [roll(1, 6, "Necrotic", 0, "added damage when attacking cursed target")],
  }),

  "hunters-mark": damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    repeats: true,
    rolls: [roll(1, 6, "Slashing", 0, "added weapon damage against marked target")],
  }),

  "ice-knife": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 2,
    rolls: [
      roll(1, 10, "Piercing", 0, "initial hit"),
      roll(2, 6, "Cold", 0, "explosion"),
    ],
  }),

  "inflict-wounds": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(3, 10, "Necrotic")],
  }),

  longstrider: noDamage("Movement speed buff."),
  "mage-armour": noDamage("Armour Class buff."),
  "invocation-mage-armour": noDamage("Armour Class buff."),

  "magic-missile": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "always-hit",
    rolls: [roll(3, 4, "Force", 3, "three darts")],
    notes: "Base spell fires three darts, each dealing 1d4 + 1 Force.",
  }),

  "protection-from-evil-and-good": noDamage("Defensive protection effect."),

  "ray-of-sickness": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(2, 8, "Poison")],
  }),

  "invocation-ray-of-sickness": damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(2, 8, "Poison")],
  }),

  sanctuary: noDamage("Defensive targeting protection."),

  "searing-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [
      roll(1, 6, "Fire", 0, "initial bonus fire damage"),
      roll(1, 6, "Fire", 0, "burning damage per turn"),
    ],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  shield: noDamage("Reaction Armour Class increase."),
  "shield-of-faith": noDamage("Armour Class buff."),
  sleep: noDamage("Sleep based on hit point threshold."),
  "speak-with-animals": noDamage("Narrative interaction utility."),
  "invocation-speak-with-animals": noDamage("Narrative interaction utility."),
  "tashas-hideous-laughter": noDamage("Prone/incapacitating control effect."),

  "thunderous-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(2, 6, "Thunder", 0, "bonus thunder damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  thunderwave: damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    aoe: true,
    aoeMeters: 5,
    rolls: [roll(2, 8, "Thunder")],
  }),

  "witch-bolt": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [roll(1, 12, "Lightning")],
    notes: "Can be reactivated while concentration remains active.",
  }),

  "wrathful-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 6, "Psychic", 0, "bonus psychic damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  aid: healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    aoe: true,
    aoeMeters: 9,
    rolls: [flat(5, "Healing", "healing and max HP increase")],
  }),

  "arcane-lock": noDamage("Locking utility."),
  barkskin: noDamage("Armour Class buff."),
  blindness: noDamage("Blindness control effect."),
  blur: noDamage("Defensive illusion effect."),

  "branding-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(2, 6, "Radiant", 0, "bonus radiant damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  "calm-emotions": noDamage("Charm and frighten suppression."),
  "cloud-of-daggers": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "none",
    aoe: true,
    rolls: [roll(4, 4, "Slashing")],
  }),

  "crown-of-madness": noDamage("Humanoid control effect."),
  darkness: noDamage("Magical darkness control."),
  darkvision: noDamage("Vision buff."),
  "detect-thoughts": noDamage("Dialogue and investigation utility."),
  "enhance-ability": noDamage("Ability check buff."),
  "enlarge-reduce": noDamage("Size and weapon-damage modifier effect."),
  enthrall: noDamage("Attention/peripheral vision control."),

  "flame-blade": damageProfile({
    delivery: "summon-attack",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(3, 6, "Fire", 0, "summoned blade attack")],
  }),

  "flaming-sphere": damageProfile({
    delivery: "summon-attack",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    aoe: true,
    aoeMeters: 2,
    rolls: [roll(2, 6, "Fire")],
  }),

  "gust-of-wind": noDamage("Push and cloud-clearing control."),

  "heat-metal": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "saving-throw",
    saveAbility: "CON",
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [roll(2, 8, "Fire")],
  }),

  "hold-person": noDamage("Paralysis control effect."),
  invisibility: noDamage("Stealth/defensive buff."),
  knock: noDamage("Unlocking utility."),
  "lesser-restoration": noDamage("Condition removal. No hit-point healing."),
  "magic-weapon": damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    repeats: true,
    rolls: [flat(1, "Weapon", "+1 weapon damage bonus")],
  }),

  "melfs-acid-arrow": damageProfile({
    delivery: "delayed",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(4, 4, "Acid", 0, "initial damage"),
      roll(2, 4, "Acid", 0, "delayed damage"),
    ],
  }),

  "mirror-image": noDamage("Defensive illusion effect."),
  "misty-step": noDamage("Teleportation utility."),

  moonbeam: damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    repeats: true,
    repeatDurationTurns: 10,
    aoe: true,
    aoeMeters: 1,
    rolls: [roll(2, 10, "Radiant")],
  }),

  "pass-without-trace": noDamage("Stealth buff."),
  "phantasmal-force": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "negates-on-save",
    saveAbility: "INT",
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [roll(1, 6, "Psychic")],
    notes: "Damage type can change to the last type suffered by the target.",
  }),

  "prayer-of-healing": healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    aoe: true,
    aoeMeters: 9,
    rolls: [roll(2, 8, "Healing")],
  }),

  "protection-from-poison": noDamage("Poison protection and poison condition removal."),
  "ray-of-enfeeblement": noDamage("Weapon damage weakening effect."),

  "scorching-ray": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(6, 6, "Fire", 0, "three rays")],
    notes: "Equivalent to three rays of 2d6 Fire each.",
  }),

  "see-invisibility": noDamage("Detection utility."),

  shatter: damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    aoe: true,
    rolls: [roll(3, 8, "Thunder")],
  }),

  silence: noDamage("Silence and thunder immunity zone."),
  "invocation-silence": noDamage("Silence and thunder immunity zone."),

  "shadow-blade": damageProfile({
    delivery: "weapon-hit",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(2, 8, "Psychic", 0, "shadow blade weapon damage")],
  }),

  "spike-growth": damageProfile({
    delivery: "conditional",
    scaling: "spell-slot",
    saveBehaviour: "none",
    repeats: true,
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(2, 4, "Piercing", 0, "per 1.5m moved")],
  }),

  "spiritual-weapon": damageProfile({
    delivery: "summon-attack",
    scaling: "summon",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 8, "Force", 0, "summoned weapon attack + spellcasting modifier")],
  }),

  "warding-bond": noDamage("Defensive bond effect."),
  web: noDamage("Web control area."),

  "animate-dead": noDamage("Summons an undead servant."),
  "beacon-of-hope": noDamage("Healing maximisation and saving throw buff."),
  "bestow-curse": noDamage("Curse/control effect. Optional extra damage variant is not numerically encoded."),
  "invocation-bestow-curse": noDamage("Curse/control effect. Optional extra damage variant is not numerically encoded."),

  "blinding-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(3, 8, "Radiant", 0, "bonus radiant damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  blink: noDamage("Defensive mobility effect."),

  "call-lightning": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    repeatDurationTurns: 10,
    aoe: true,
    rolls: [roll(3, 10, "Lightning")],
  }),

  "conjure-barrage": damageProfile({
    delivery: "instant",
    scaling: "weapon",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [roll(2, 8, "Weapon")],
  }),

  counterspell: noDamage("Reaction spell cancellation."),
  "crusaders-mantle": damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    repeats: true,
    rolls: [roll(1, 4, "Radiant", 0, "added weapon damage for nearby allies")],
  }),

  daylight: noDamage("Light and darkness removal utility."),

  "elemental-weapon": damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    repeats: true,
    rolls: [roll(1, 4, "Variable", 0, "chosen elemental weapon damage")],
  }),

  fear: noDamage("Fear and disarm control."),
  "feign-death": noDamage("Protective coma/resistance effect."),

  fireball: damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(8, 6, "Fire")],
  }),

  "gaseous-form": noDamage("Defensive transformation utility."),

  "glyph-of-warding": damageProfile({
    delivery: "delayed",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [roll(5, 8, "Variable", 0, "selected glyph damage variant")],
  }),

  "grant-flight": noDamage("Flight mobility buff."),
  haste: noDamage("Action, speed, and Armour Class buff."),

  "hunger-of-hadar": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    repeatDurationTurns: 10,
    aoe: true,
    aoeMeters: 6,
    rolls: [
      roll(2, 6, "Cold", 0, "start-turn damage"),
      roll(2, 6, "Acid", 0, "end-turn damage"),
    ],
  }),

  "hypnotic-pattern": noDamage("Area incapacitation/control effect."),

  "lightning-arrow": damageProfile({
    delivery: "weapon-hit",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [
      roll(4, 8, "Lightning", 0, "primary target"),
      roll(2, 8, "Lightning", 0, "secondary bolts"),
    ],
  }),

  "lightning-bolt": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [roll(8, 6, "Lightning")],
  }),

  "mass-healing-word": healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    targetCount: 6,
    aoe: true,
    rolls: [roll(1, 4, "Healing", 3, "healing to up to 6 creatures")],
  }),

  "plant-growth": noDamage("Movement control terrain."),
  "protection-from-energy": noDamage("Damage resistance buff."),
  "remove-curse": noDamage("Curse removal."),
  revivify: healingProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [flat(1, "Healing", "revived hit points")],
  }),

  "sleet-storm": noDamage("Ice surface and concentration disruption."),
  slow: noDamage("Slow/control effect."),
  "invocation-slow": noDamage("Slow/control effect."),
  "speak-with-dead": noDamage("Narrative interaction utility."),
  "invocation-speak-with-dead": noDamage("Narrative interaction utility."),

  "spirit-guardians": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "WIS",
    repeats: true,
    aoe: true,
    aoeMeters: 3,
    rolls: [roll(3, 8, "Variable", 0, "Radiant or Necrotic per turn")],
  }),

  "stinking-cloud": noDamage("Action-denial cloud."),
  "vampiric-touch": mixedProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [
      roll(3, 6, "Necrotic"),
      roll(3, 6, "Healing", 0, "heals half the necrotic damage dealt"),
    ],
  }),

  "warden-of-vitality": healingProfile({
    delivery: "per-turn",
    scaling: "none",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [roll(2, 6, "Healing", 0, "Restore Vitality bonus action")],
  }),

  banishment: noDamage("Banishment control effect."),

  blight: damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    rolls: [roll(8, 8, "Necrotic")],
  }),

  confusion: noDamage("Confusion/control effect."),
  "invocation-confusion": noDamage("Confusion/control effect."),
  "conjure-minor-elemental": noDamage("Summons a minor elemental. Summon attack damage is not encoded here."),
  "conjure-woodland-being": noDamage("Summons woodland being. Summon attack damage is not encoded here."),
  "death-ward": noDamage("Prevents first drop to 0 HP."),
  "dimension-door": noDamage("Teleportation utility."),
  "dominate-beast": noDamage("Domination control effect."),

  "evards-black-tentacles": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "saving-throw",
    saveAbility: "WIS",
    repeats: true,
    repeatDurationTurns: 10,
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(3, 6, "Bludgeoning")],
  }),

  "fire-shield": damageProfile({
    delivery: "retaliation",
    scaling: "spell-slot",
    saveBehaviour: "none",
    repeats: true,
    rolls: [roll(2, 8, "Variable", 0, "cold or fire retaliation damage")],
  }),

  "freedom-of-movement": noDamage("Movement protection buff."),
  "greater-invisibility": noDamage("Invisibility buff."),
  "guardian-of-faith": damageProfile({
    delivery: "summon-attack",
    scaling: "none",
    saveBehaviour: "negates-on-save",
    saveAbility: "DEX",
    repeats: true,
    rolls: [flat(20, "Radiant", "guardian strike")],
  }),

  "ice-storm": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 6,
    rolls: [
      roll(2, 8, "Bludgeoning"),
      roll(4, 6, "Cold"),
    ],
  }),

  "otilukes-resilient-sphere": noDamage("Protective/control sphere."),
  "phantasmal-killer": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "negates-on-save",
    saveAbility: "WIS",
    repeats: true,
    rolls: [roll(4, 10, "Psychic")],
  }),

  polymorph: noDamage("Transformation control effect."),
  "invocation-polymorph": noDamage("Transformation control effect."),
  stoneskin: noDamage("Physical damage resistance buff."),

  "wall-of-fire": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    aoe: true,
    rolls: [roll(5, 8, "Fire")],
  }),

  "artistry-of-war": damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "always-hit",
    targetCount: 6,
    rolls: [roll(12, 6, "Force", 36, "six apparitions")],
    notes: "Six hits, each 2d6 + 6 Force.",
  }),

  "banishing-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(5, 10, "Force", 0, "bonus force damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  "banishing-smite-ranged": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(5, 10, "Force", 0, "bonus force damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  cloudkill: damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "saving-throw",
    saveAbility: "CON",
    repeats: true,
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(5, 8, "Poison")],
  }),

  "cone-of-cold": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    aoe: true,
    rolls: [roll(8, 8, "Cold")],
    notes: "The pasted wiki text says STR Save, but this should be double-checked.",
  }),

  "conjure-elemental": noDamage("Summons an elemental. Summon attack damage is not encoded here."),
  "invocation-conjure-elemental": noDamage("Summons an elemental. Summon attack damage is not encoded here."),
  contagion: noDamage("Disease/control effect."),

  "destructive-wave": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    aoe: true,
    rolls: [
      roll(5, 6, "Thunder"),
      roll(5, 6, "Radiant", 0, "or Necrotic variant"),
    ],
  }),

  dethrone: damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    rolls: [roll(10, 6, "Necrotic", 20)],
  }),

  "dispel-evil-and-good": noDamage("Condition removal/banishment utility."),
  "dominate-person": noDamage("Domination control effect."),

  "flame-strike": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    rolls: [
      roll(5, 6, "Fire"),
      roll(5, 6, "Radiant"),
    ],
  }),

  "grasping-vine": noDamage("Pull/control summon effect."),
  "greater-restoration": noDamage("Condition, curse, and reduction removal. No hit-point healing."),
  "hold-monster": noDamage("Paralysis control effect."),

  "insect-plague": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    repeats: true,
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(4, 10, "Piercing")],
  }),

  "mass-cure-wounds": healingProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    targetCount: 6,
    aoe: true,
    rolls: [roll(3, 8, "Healing", 0, "healing + spellcasting modifier")],
  }),

  "planar-binding": noDamage("Planar creature control effect."),
  seeming: noDamage("Party disguise utility."),

  "staggering-smite": damageProfile({
    delivery: "weapon-rider",
    scaling: "spell-slot",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(4, 6, "Psychic", 0, "bonus psychic damage")],
    notes: "Normal weapon damage is not numerically encoded here.",
  }),

  telekinesis: noDamage("Can deal variable thrown-object damage, but damage depends on object weight and target context."),

  "wall-of-stone": noDamage("Wall creation/control effect."),
  "arcane-gate": noDamage("Portal mobility utility."),

  "blade-barrier": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    aoe: true,
    rolls: [roll(6, 10, "Slashing")],
  }),

  "chain-lightning": damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    targetCount: 4,
    rolls: [roll(10, 8, "Lightning")],
  }),

  "circle-of-death": damageProfile({
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    aoe: true,
    aoeMeters: 9,
    rolls: [roll(8, 6, "Necrotic")],
  }),

  "create-undead": noDamage("Summons undead. Summon attack damage is not encoded here."),

  disintegrate: damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "negates-on-save",
    saveAbility: "DEX",
    rolls: [roll(10, 6, "Force", 40)],
  }),

  eyebite: noDamage("Sickness, fear, or sleep control effect."),
  "flesh-to-stone": noDamage("Restraining/petrification control effect."),
  "globe-of-invulnerability": noDamage("Damage immunity zone."),

  harm: damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    rolls: [roll(14, 6, "Necrotic")],
    notes: "Reduces maximum HP but cannot reduce target below 1 HP.",
  }),

  heal: healingProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [flat(70, "Healing", "healing")],
  }),

  "heroes-feast": noDamage("Cures disease, grants poison immunity, and increases HP by 2d10."),

  "otilukes-freezing-sphere": damageProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    aoe: true,
    rolls: [roll(10, 6, "Cold")],
  }),

  "ottos-irresistible-dance": noDamage("Dance/incapacitation control effect."),
  "planar-ally": noDamage("Summons an ally. Summon attack damage is not encoded here."),
  "sights-of-the-seelie-summon-deva": noDamage("Summons a deva. Summon attack damage is not encoded here."),

  sunbeam: damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "CON",
    repeats: true,
    repeatDurationTurns: 10,
    aoe: true,
    rolls: [roll(6, 8, "Radiant")],
  }),

  "wall-of-ice": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    repeats: true,
    aoe: true,
    rolls: [
      roll(10, 6, "Cold", 0, "initial wall damage"),
      roll(10, 6, "Cold", 0, "conditional cloud damage"),
    ],
  }),

  "wall-of-thorns": damageProfile({
    delivery: "per-turn",
    scaling: "spell-slot",
    saveBehaviour: "half-on-save",
    aoe: true,
    rolls: [roll(7, 8, "Piercing")],
  }),

  "wind-walk": noDamage("Party movement/defensive transformation."),
};
function roll(
  diceCount: number,
  diceSize: number,
  damageType: NumericEffectType,
  flatBonus = 0,
  label?: string
): DamageRoll {
  return {
    diceCount,
    diceSize,
    damageType,
    ...(flatBonus !== 0 ? { flatBonus } : {}),
    ...(label ? { label } : {}),
  };
}

function flat(
  amount: number,
  damageType: NumericEffectType,
  label?: string
): DamageRoll {
  return {
    diceCount: 0,
    diceSize: 0,
    flatBonus: amount,
    damageType,
    ...(label ? { label } : {}),
  };
}

function noDamage(notes?: string): AbilityDamageProfile {
  return {
    hasDamage: false,
    damageKind: "none",
    delivery: "none",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [],
    notes,
  };
}

function effectProfile(
  damageKind: Exclude<AbilityDamageProfile["damageKind"], "none">,
  args: Omit<AbilityDamageProfile, "hasDamage" | "damageKind">
): AbilityDamageProfile {
  return {
    hasDamage: true,
    damageKind,
    ...args,
  };
}

function damageProfile(
  args: Omit<AbilityDamageProfile, "hasDamage" | "damageKind">
): AbilityDamageProfile {
  return effectProfile("damage", args);
}

function healingProfile(
  args: Omit<AbilityDamageProfile, "hasDamage" | "damageKind">
): AbilityDamageProfile {
  return effectProfile("healing", args);
}

function temporaryHpProfile(
  amount: number,
  notes?: string
): AbilityDamageProfile {
  return effectProfile("temporary-hit-points", {
    delivery: "instant",
    scaling: "spell-slot",
    saveBehaviour: "none",
    rolls: [flat(amount, "Temporary Hit Points", `${amount} temporary HP`)],
    notes,
  });
}

function mixedProfile(
  args: Omit<AbilityDamageProfile, "hasDamage" | "damageKind">
): AbilityDamageProfile {
  return effectProfile("mixed", args);
}

export function getDamageRollAverage(damageRoll: DamageRoll): number {
  const diceAverage =
    damageRoll.diceCount > 0 && damageRoll.diceSize > 0
      ? damageRoll.diceCount * ((damageRoll.diceSize + 1) / 2)
      : 0;

  return diceAverage + (damageRoll.flatBonus ?? 0);
}

export function getDamageProfileAverage(
  profile?: AbilityDamageProfile
): number {
  if (!profile || !profile.hasDamage) return 0;

  return profile.rolls.reduce(
    (sum, damageRoll) => sum + getDamageRollAverage(damageRoll),
    0
  );
}

export function getDamageProfileMin(profile?: AbilityDamageProfile): number {
  if (!profile || !profile.hasDamage) return 0;

  return profile.rolls.reduce((sum, damageRoll) => {
    const diceMin =
      damageRoll.diceCount > 0 && damageRoll.diceSize > 0
        ? damageRoll.diceCount
        : 0;

    return sum + diceMin + (damageRoll.flatBonus ?? 0);
  }, 0);
}

export function getDamageProfileMax(profile?: AbilityDamageProfile): number {
  if (!profile || !profile.hasDamage) return 0;

  return profile.rolls.reduce((sum, damageRoll) => {
    const diceMax =
      damageRoll.diceCount > 0 && damageRoll.diceSize > 0
        ? damageRoll.diceCount * damageRoll.diceSize
        : 0;

    return sum + diceMax + (damageRoll.flatBonus ?? 0);
  }, 0);
}

export function formatDamageRoll(damageRoll: DamageRoll): string {
  const dice =
    damageRoll.diceCount > 0 && damageRoll.diceSize > 0
      ? `${damageRoll.diceCount}d${damageRoll.diceSize}`
      : "";

  const flatBonus =
    damageRoll.flatBonus && damageRoll.flatBonus !== 0
      ? `${damageRoll.flatBonus > 0 && dice ? "+" : ""}${damageRoll.flatBonus}`
      : "";

  const amount = `${dice}${flatBonus}` || "0";

  return damageRoll.label
    ? `${amount} ${damageRoll.damageType} (${damageRoll.label})`
    : `${amount} ${damageRoll.damageType}`;
}

export function formatDamageProfile(
  profile?: AbilityDamageProfile
): string | null {
  if (!profile || !profile.hasDamage || profile.rolls.length === 0) return null;

  return profile.rolls.map(formatDamageRoll).join(" + ");
}
for (const spellEntry of bg3Spells) {
  spellEntry.description = spellDescriptions[spellEntry.id];
  spellEntry.damage = spellDamageProfiles[spellEntry.id] ?? noDamage();
}
export function getSpellById(id: string): BG3Spell | undefined {
  return bg3Spells.find((spellEntry) => spellEntry.id === id);
}

export function getSpellsByRank(rank: SpellRank): BG3Spell[] {
  return bg3Spells.filter((spellEntry) => spellEntry.rank === rank);
}

export function getDamagingSpells(): BG3Spell[] {
  return bg3Spells.filter((spellEntry) => spellEntry.damageTypes.length > 0);
}

export function getSpellsByRole(role: AbilityRole): BG3Spell[] {
  return bg3Spells.filter((spellEntry) => spellEntry.roles.includes(role));
}

export function getSpellsByDamageType(damageType: DamageType): BG3Spell[] {
  return bg3Spells.filter((spellEntry) => spellEntry.damageTypes.includes(damageType));
}

