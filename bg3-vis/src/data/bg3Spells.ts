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
  | "close"
  | "mid"
  | "long"
  | "weapon-range"
  | "special";

export type RangeShape =
  | "self"
  | "melee"
  | "single-target"
  | "radius"
  | "cone"
  | "line"
  | "weapon"
  | "special";

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

export type BG3Spell = {
  id: string;
  name: string;
  sourceType: "spell";
  rank: SpellRank;
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

const self = { label: "self", meters: 0, category: "self", shape: "self" } as const;
const melee = { label: "melee", meters: 1.5, category: "melee", shape: "melee" } as const;
const touch = { label: "1.5m / 5ft", meters: 1.5, category: "melee", shape: "single-target" } as const;
const weaponRange = { label: "weapon range", meters: null, category: "weapon-range", shape: "weapon" } as const;

export const bg3Spells: BG3Spell[] = [
  spell("animal-friendship", "Animal Friendship", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"]),
  spell("armour-of-agathys", "Armour of Agathys", 1, self, ["defense-protection"], ["Cold"], ["action"], false, ["temporary-hit-points", "retaliation"]),
  spell("arms-of-hadar", "Arms of Hadar", 1, { label: "3m / 10ft", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["area-damage", "control"], ["Necrotic"], ["action"]),
  spell("bane", "Bane", 1, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-bane", "Invocation: Bane", 1, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("bless", "Bless", 1, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["support-buff"], [], ["action"], true),
  spell("burning-hands", "Burning Hands", 1, { label: "5m / 17ft cone", meters: 5, category: "close", shape: "cone" }, ["area-damage"], ["Fire"], ["action"]),
  spell("charm-person", "Charm Person", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control", "narrative-interaction"], [], ["action"], true),
  spell("chromatic-orb", "Chromatic Orb", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Thunder", "Acid", "Cold", "Fire", "Lightning", "Poison"], ["action"]),
  invocation("invocation-chromatic-orb", "Invocation: Chromatic Orb", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Thunder", "Acid", "Cold", "Fire", "Lightning", "Poison"], ["action"]),
  spell("colour-spray", "Colour Spray", 1, { label: "5m / 15ft cone", meters: 5, category: "close", shape: "cone" }, ["control"], [], ["action"]),
  spell("command", "Command", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"]),
  spell("compelled-duel", "Compelled Duel", 1, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["control", "defense-protection"], [], ["bonus-action"], true),
  spell("create-or-destroy-water", "Create or Destroy Water", 1, { label: "4m / 13ft", meters: 4, category: "close", shape: "radius" }, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("cure-wounds", "Cure Wounds", 1, touch, ["healing"], [], ["action"]),
  spell("disguise-self", "Disguise Self", 1, self, ["narrative-interaction"], [], ["action"]),
  invocation("invocation-disguise-self", "Invocation: Disguise Self", 1, self, ["narrative-interaction"], [], ["action"]),
  spell("dissonant-whispers", "Dissonant Whispers", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic"], ["action"]),
  spell("divine-favour", "Divine Favour", 1, self, ["support-buff", "single-target-damage"], ["Radiant"], ["bonus-action"], true),
  spell("enhance-leap", "Enhance Leap", 1, touch, ["mobility-positioning"], [], ["action"]),
  invocation("invocation-enhance-leap", "Invocation: Enhance Leap", 1, touch, ["mobility-positioning"], [], ["action"]),
  spell("ensnaring-strike-melee", "Ensnaring Strike (Melee)", 1, melee, ["single-target-damage", "control"], ["Weapon", "Piercing"], ["action", "bonus-action"], true),
  spell("ensnaring-strike-ranged", "Ensnaring Strike (Ranged)", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Weapon", "Piercing"], ["action", "bonus-action"], true),
  spell("entangle", "Entangle", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["control"], [], ["action"], true),
  spell("expeditious-retreat", "Expeditious Retreat", 1, self, ["mobility-positioning"], [], ["bonus-action"]),
  spell("faerie-fire", "Faerie Fire", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["control", "support-buff"], [], ["action"], true),
  spell("false-life", "False Life", 1, self, ["defense-protection"], [], ["action"]),
  invocation("invocation-false-life", "Invocation: False Life", 1, self, ["defense-protection"], [], ["action"]),
  spell("feather-fall", "Feather Fall", 1, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["defense-protection", "mobility-positioning"], [], ["bonus-action"]),
  spell("find-familiar", "Find Familiar", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon", "investigation-world-interaction"], [], ["action"]),
  spell("find-familiar-imp", "Find Familiar: Imp", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("find-familiar-quasit", "Find Familiar: Quasit", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("find-familiar-cheeky-quasit", "Find Familiar: Cheeky Quasit", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("fog-cloud", "Fog Cloud", 1, { label: "18m / 60ft, 5m / 15ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 5 }, ["control", "defense-protection"], [], ["action"], true),
  spell("goodberry", "Goodberry", 1, touch, ["healing", "support-buff"], [], ["action"]),
  spell("guiding-bolt", "Guiding Bolt", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "support-buff"], ["Radiant"], ["action"]),
  spell("grease", "Grease", 1, { label: "18m / 60ft, 5m / 15ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 5 }, ["control"], [], ["action"]),
  spell("hail-of-thorns", "Hail of Thorns", 1, { label: "18m / 60ft, 2m / 7ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 2 }, ["area-damage"], ["Weapon", "Piercing"], ["action", "bonus-action"]),
  spell("healing-word", "Healing Word", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["healing"], [], ["bonus-action"]),
  spell("hellish-rebuke", "Hellish Rebuke", 1, { label: "reaction", meters: null, category: "special", shape: "special" }, ["single-target-damage"], ["Fire"], ["reaction"]),
  spell("heroism", "Heroism", 1, touch, ["support-buff", "defense-protection"], [], ["action"], true),
  spell("hex", "Hex", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Necrotic"], ["bonus-action"], true),
  spell("hunters-mark", "Hunter's Mark", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Physical"], ["bonus-action"], true),
  spell("ice-knife", "Ice Knife", 1, { label: "18m / 60ft, 2m / 7ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 2 }, ["single-target-damage", "area-damage", "control"], ["Piercing", "Cold"], ["action"]),
  spell("inflict-wounds", "Inflict Wounds", 1, touch, ["single-target-damage"], ["Necrotic"], ["action"]),
  spell("longstrider", "Longstrider", 1, touch, ["mobility-positioning", "support-buff"], [], ["action"]),
  spell("mage-armour", "Mage Armour", 1, touch, ["defense-protection"], [], ["action"]),
  invocation("invocation-mage-armour", "Invocation: Mage Armour", 1, touch, ["defense-protection"], [], ["action"]),
  spell("magic-missile", "Magic Missile", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"]),
  spell("protection-from-evil-and-good", "Protection from Evil and Good", 1, touch, ["defense-protection"], [], ["action"], true),
  spell("ray-of-sickness", "Ray of Sickness", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Poison"], ["action"]),
  invocation("invocation-ray-of-sickness", "Invocation: Ray of Sickness", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Poison"], ["action"]),
  spell("sanctuary", "Sanctuary", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["defense-protection"], [], ["bonus-action"]),
  spell("searing-smite", "Searing Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Fire"], ["action", "bonus-action"], true),
  spell("shield", "Shield", 1, self, ["defense-protection"], [], ["reaction"]),
  spell("shield-of-faith", "Shield of Faith", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["defense-protection"], [], ["bonus-action"], true),
  spell("sleep", "Sleep", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"]),
  spell("speak-with-animals", "Speak with Animals", 1, self, ["narrative-interaction"], [], ["action"]),
  invocation("invocation-speak-with-animals", "Invocation: Speak with Animals", 1, self, ["narrative-interaction"], [], ["action"]),
  spell("tashas-hideous-laughter", "Tasha's Hideous Laughter", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("thunderous-smite", "Thunderous Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Thunder"], ["action", "bonus-action"]),
  spell("thunderwave", "Thunderwave", 1, { label: "1.5m / 5ft, 5m / 17ft AoE", meters: 1.5, category: "melee", shape: "radius", aoeMeters: 5 }, ["area-damage", "control"], ["Thunder"], ["action"]),
  spell("witch-bolt", "Witch Bolt", 1, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Lightning"], ["action"], true),
  spell("wrathful-smite", "Wrathful Smite", 1, melee, ["single-target-damage", "control"], ["Weapon", "Psychic"], ["action", "bonus-action"], true),

  spell("aid", "Aid", 2, { label: "self, 9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["support-buff", "healing"], [], ["action"]),
  spell("arcane-lock", "Arcane Lock", 2, touch, ["investigation-world-interaction"], [], ["action"]),
  spell("barkskin", "Barkskin", 2, touch, ["defense-protection"], [], ["action"], true),
  spell("blindness", "Blindness", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"]),
  spell("blur", "Blur", 2, self, ["defense-protection"], [], ["action"], true),
  spell("branding-smite", "Branding Smite", 2, weaponRange, ["single-target-damage", "control"], ["Weapon", "Radiant"], ["action", "bonus-action"], true),
  spell("calm-emotions", "Calm Emotions", 2, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["defense-protection", "control"], [], ["action"], true),
  spell("cloud-of-daggers", "Cloud of Daggers", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["area-damage"], ["Slashing"], ["action"], true),
  spell("crown-of-madness", "Crown of Madness", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("darkness", "Darkness", 2, { label: "5m / 17ft", meters: 5, category: "close", shape: "radius" }, ["control", "defense-protection"], [], ["action"], true),
  spell("darkvision", "Darkvision", 2, touch, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("detect-thoughts", "Detect Thoughts", 2, self, ["narrative-interaction", "investigation-world-interaction"], [], ["action"]),
  spell("enhance-ability", "Enhance Ability", 2, touch, ["support-buff", "investigation-world-interaction"], [], ["action"], true),
  spell("enlarge-reduce", "Enlarge/Reduce", 2, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["support-buff", "control"], [], ["action"], true),
  spell("enthrall", "Enthrall", 2, { label: "6m / 20ft", meters: 6, category: "close", shape: "single-target" }, ["control"], [], ["action"]),
  spell("flame-blade", "Flame Blade", 2, self, ["summon", "single-target-damage"], ["Fire"], ["bonus-action"]),
  spell("flaming-sphere", "Flaming Sphere", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon", "area-damage"], ["Fire"], ["action"], true),
  spell("gust-of-wind", "Gust of Wind", 2, { label: "12m / 40ft line", meters: 12, category: "mid", shape: "line" }, ["control"], [], ["action"]),
  spell("heat-metal", "Heat Metal", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Fire"], ["action"], true),
  spell("hold-person", "Hold Person", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("invisibility", "Invisibility", 2, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("knock", "Knock", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["investigation-world-interaction"], [], ["action"]),
  spell("lesser-restoration", "Lesser Restoration", 2, touch, ["support-buff", "healing"], [], ["action"]),
  spell("magic-weapon", "Magic Weapon", 2, touch, ["support-buff"], [], ["action"], true),
  spell("melfs-acid-arrow", "Melf's Acid Arrow", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Acid"], ["action"]),
  spell("mirror-image", "Mirror Image", 2, self, ["defense-protection"], [], ["action"]),
  spell("misty-step", "Misty Step", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["mobility-positioning"], [], ["bonus-action"]),
  spell("moonbeam", "Moonbeam", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["area-damage"], ["Radiant"], ["action"], true),
  spell("pass-without-trace", "Pass Without Trace", 2, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["support-buff", "mobility-positioning"], [], ["action"], true),
  spell("phantasmal-force", "Phantasmal Force", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic", "Variable"], ["action"], true),
  spell("prayer-of-healing", "Prayer of Healing", 2, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["healing"], [], ["action"]),
  spell("protection-from-poison", "Protection from Poison", 2, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("ray-of-enfeeblement", "Ray of Enfeeblement", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("scorching-ray", "Scorching Ray", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Fire"], ["action"]),
  spell("see-invisibility", "See Invisibility", 2, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["investigation-world-interaction", "support-buff"], [], ["action"]),
  spell("shatter", "Shatter", 2, { label: "18m / 60ft, 3m / 10ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 3 }, ["area-damage"], ["Thunder"], ["action"]),
  spell("silence", "Silence", 2, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["control", "defense-protection"], [], ["action"], true),
  invocation("invocation-silence", "Invocation: Silence", 2, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["control", "defense-protection"], [], ["action"], true),
  spell("shadow-blade", "Shadow Blade", 2, melee, ["summon", "single-target-damage"], ["Psychic"], ["bonus-action"]),
  spell("spike-growth", "Spike Growth", 2, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("spiritual-weapon", "Spiritual Weapon", 2, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon", "single-target-damage"], ["Force"], ["bonus-action"]),
  spell("warding-bond", "Warding Bond", 2, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("web", "Web", 2, { label: "18m / 60ft, 4m / 13ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 4 }, ["control"], [], ["action"], true),

  spell("animate-dead", "Animate Dead", 3, { label: "3m / 10ft", meters: 3, category: "melee", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("beacon-of-hope", "Beacon of Hope", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["support-buff", "healing"], [], ["action"], true),
  spell("bestow-curse", "Bestow Curse", 3, touch, ["control"], [], ["action"], true),
  invocation("invocation-bestow-curse", "Invocation: Bestow Curse", 3, touch, ["control"], [], ["action"], true),
  spell("blinding-smite", "Blinding Smite", 3, melee, ["single-target-damage", "control"], ["Weapon", "Radiant"], ["action"]),
  spell("blink", "Blink", 3, self, ["defense-protection", "mobility-positioning"], [], ["action"]),
  spell("call-lightning", "Call Lightning", 3, { label: "18m / 60ft, 2m / 7ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 2 }, ["area-damage"], ["Lightning"], ["action"], true),
  spell("conjure-barrage", "Conjure Barrage", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "cone" }, ["area-damage"], ["Weapon"], ["action"]),
  spell("counterspell", "Counterspell", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["defense-protection", "control"], [], ["reaction"]),
  spell("crusaders-mantle", "Crusader's Mantle", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["support-buff", "single-target-damage"], ["Radiant"], ["action"], true),
  spell("daylight", "Daylight", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("elemental-weapon", "Elemental Weapon", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["support-buff", "single-target-damage"], ["Acid", "Cold", "Fire", "Lightning", "Thunder"], ["action"], true),
  spell("fear", "Fear", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "cone" }, ["control"], [], ["action"], true),
  spell("feign-death", "Feign Death", 3, touch, ["defense-protection"], [], ["action"]),
  spell("fireball", "Fireball", 3, { label: "18m / 60ft, 4m / 13ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 4 }, ["area-damage"], ["Fire"], ["action"]),
  spell("gaseous-form", "Gaseous Form", 3, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("glyph-of-warding", "Glyph of Warding", 3, { label: "9m / 30ft, 4m / 13ft AoE", meters: 9, category: "close", shape: "radius", aoeMeters: 4 }, ["area-damage", "control"], ["Thunder", "Lightning", "Fire", "Cold", "Acid"], ["action"]),
  spell("grant-flight", "Grant Flight", 3, touch, ["mobility-positioning"], [], ["action"], true),
  spell("haste", "Haste", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["support-buff", "mobility-positioning", "defense-protection"], [], ["action"], true),
  spell("hunger-of-hadar", "Hunger of Hadar", 3, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Cold", "Acid"], ["action"], true),
  spell("hypnotic-pattern", "Hypnotic Pattern", 3, { label: "18m / 60ft, 9m / 30ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 9 }, ["control"], [], ["action"], true),
  spell("lightning-arrow", "Lightning Arrow", 3, { label: "18m / 60ft, 3m / 10ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 3 }, ["single-target-damage", "area-damage"], ["Lightning"], ["action"]),
  spell("lightning-bolt", "Lightning Bolt", 3, { label: "30m / 100ft line", meters: 30, category: "long", shape: "line" }, ["area-damage"], ["Lightning"], ["action"]),
  spell("mass-healing-word", "Mass Healing Word", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["healing"], [], ["bonus-action"]),
  spell("plant-growth", "Plant Growth", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["control"], [], ["action"]),
  spell("protection-from-energy", "Protection from Energy", 3, touch, ["defense-protection"], [], ["action"], true),
  spell("remove-curse", "Remove Curse", 3, touch, ["support-buff", "investigation-world-interaction"], [], ["action"]),
  spell("revivify", "Revivify", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["healing", "support-buff"], [], ["action"]),
  spell("sleet-storm", "Sleet Storm", 3, { label: "18m / 60ft, 9m / 30ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 9 }, ["control"], [], ["action"], true),
  spell("slow", "Slow", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-slow", "Invocation: Slow", 3, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("speak-with-dead", "Speak with Dead", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["narrative-interaction", "investigation-world-interaction"], [], ["action"]),
  invocation("invocation-speak-with-dead", "Invocation: Speak with Dead", 3, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["narrative-interaction", "investigation-world-interaction"], [], ["action"]),
  spell("spirit-guardians", "Spirit Guardians", 3, { label: "3m / 10ft", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["area-damage", "control"], ["Radiant", "Necrotic"], ["action"], true),
  spell("stinking-cloud", "Stinking Cloud", 3, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  spell("vampiric-touch", "Vampiric Touch", 3, touch, ["single-target-damage", "healing"], ["Necrotic"], ["action"], true),
  spell("warden-of-vitality", "Warden of Vitality", 3, self, ["healing", "support-buff"], [], ["action"]),

  spell("banishment", "Banishment", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("blight", "Blight", 4, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["single-target-damage"], ["Necrotic"], ["action"]),
  spell("confusion", "Confusion", 4, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  invocation("invocation-confusion", "Invocation: Confusion", 4, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["control"], [], ["action"], true),
  spell("conjure-minor-elemental", "Conjure Minor Elemental", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("conjure-woodland-being", "Conjure Woodland Being", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("death-ward", "Death Ward", 4, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("dimension-door", "Dimension Door", 4, touch, ["mobility-positioning"], [], ["action"]),
  spell("dominate-beast", "Dominate Beast", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("evards-black-tentacles", "Evard's Black Tentacles", 4, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Bludgeoning"], ["action"], true),
  spell("fire-shield", "Fire Shield", 4, touch, ["defense-protection", "single-target-damage"], ["Fire", "Cold"], ["action"]),
  spell("freedom-of-movement", "Freedom of Movement", 4, touch, ["support-buff", "defense-protection", "mobility-positioning"], [], ["action"]),
  spell("greater-invisibility", "Greater Invisibility", 4, touch, ["defense-protection", "mobility-positioning"], [], ["action"], true),
  spell("guardian-of-faith", "Guardian of Faith", 4, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["summon", "single-target-damage"], ["Radiant"], ["action"]),
  spell("ice-storm", "Ice Storm", 4, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Bludgeoning", "Cold"], ["action"]),
  spell("otilukes-resilient-sphere", "Otiluke's Resilient Sphere", 4, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["defense-protection", "control"], [], ["action"], true),
  spell("phantasmal-killer", "Phantasmal Killer", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Psychic"], ["action"], true),
  spell("polymorph", "Polymorph", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  invocation("invocation-polymorph", "Invocation: Polymorph", 4, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("stoneskin", "Stoneskin", 4, touch, ["defense-protection"], [], ["action"], true),
  spell("wall-of-fire", "Wall of Fire", 4, { label: "18m / 60ft, 36m / 120ft line", meters: 18, category: "mid", shape: "line", aoeMeters: 36 }, ["area-damage", "control"], ["Fire"], ["action"], true),

  spell("artistry-of-war", "Artistry of War", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"], false, ["item-only"]),
  spell("banishing-smite", "Banishing Smite", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Force"], ["action", "bonus-action"], true),
  spell("banishing-smite-ranged", "Banishing Smite (Ranged)", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Force"], ["action", "bonus-action"], true),
  spell("cloudkill", "Cloudkill", 5, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Poison"], ["action"], true),
  spell("cone-of-cold", "Cone of Cold", 5, { label: "9m / 30ft cone", meters: 9, category: "close", shape: "cone" }, ["area-damage"], ["Cold"], ["action"]),
  spell("conjure-elemental", "Conjure Elemental", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  invocation("invocation-conjure-elemental", "Invocation: Conjure Elemental", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("contagion", "Contagion", 5, touch, ["control"], [], ["action"]),
  spell("destructive-wave", "Destructive Wave", 5, { label: "6m / 30ft", meters: 6, category: "close", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Thunder", "Radiant", "Necrotic"], ["action"]),
  spell("dethrone", "Dethrone", 5, { label: "30m / 90ft", meters: 30, category: "long", shape: "single-target" }, ["single-target-damage"], ["Necrotic"], ["action"], false, ["item-only"]),
  spell("dispel-evil-and-good", "Dispel Evil and Good", 5, touch, ["defense-protection", "support-buff"], [], ["action"]),
  spell("dominate-person", "Dominate Person", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("flame-strike", "Flame Strike", 5, { label: "18m / 60ft, 3m / 10ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 3 }, ["area-damage"], ["Fire", "Radiant"], ["action"]),
  spell("grasping-vine", "Grasping Vine", 5, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["summon", "control"], [], ["bonus-action"]),
  spell("greater-restoration", "Greater Restoration", 5, touch, ["support-buff", "healing"], [], ["action"]),
  spell("hold-monster", "Hold Monster", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("insect-plague", "Insect Plague", 5, { label: "18m / 60ft, 6m / 20ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 6 }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("mass-cure-wounds", "Mass Cure Wounds", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["healing"], [], ["action"]),
  spell("planar-binding", "Planar Binding", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("seeming", "Seeming", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["narrative-interaction"], [], ["action"], true),
  spell("staggering-smite", "Staggering Smite", 5, weaponRange, ["single-target-damage", "control"], ["Weapon", "Psychic"], ["action", "bonus-action"]),
  spell("telekinesis", "Telekinesis", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control", "mobility-positioning", "single-target-damage"], ["Variable"], ["action"], true),
  spell("wall-of-stone", "Wall of Stone", 5, { label: "18m / 60ft", meters: 18, category: "mid", shape: "line" }, ["summon", "control", "defense-protection"], [], ["action"], true),

  spell("arcane-gate", "Arcane Gate", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["mobility-positioning"], [], ["action"], true),
  spell("blade-barrier", "Blade Barrier", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "line" }, ["summon", "area-damage", "control"], ["Slashing"], ["action"], true),
  spell("chain-lightning", "Chain Lightning", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["area-damage"], ["Lightning"], ["action"]),
  spell("circle-of-death", "Circle of Death", 6, { label: "18m / 60ft, 9m / 30ft AoE", meters: 18, category: "mid", shape: "radius", aoeMeters: 9 }, ["area-damage"], ["Necrotic"], ["action"]),
  spell("create-undead", "Create Undead", 6, { label: "3m / 10ft", meters: 3, category: "melee", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("disintegrate", "Disintegrate", 6, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["single-target-damage"], ["Force"], ["action"]),
  spell("eyebite", "Eyebite", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("flesh-to-stone", "Flesh to Stone", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("globe-of-invulnerability", "Globe of Invulnerability", 6, { label: "3m / 10ft", meters: 3, category: "melee", shape: "radius", aoeMeters: 3 }, ["defense-protection"], [], ["action"], true),
  spell("harm", "Harm", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["single-target-damage", "control"], ["Necrotic"], ["action"]),
  spell("heal", "Heal", 6, touch, ["healing", "support-buff"], [], ["action"]),
  spell("heroes-feast", "Heroes' Feast", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "radius" }, ["support-buff", "defense-protection"], [], ["action"]),
  spell("otilukes-freezing-sphere", "Otiluke's Freezing Sphere", 6, touch, ["area-damage"], ["Cold"], ["action"]),
  spell("ottos-irresistible-dance", "Otto's Irresistible Dance", 6, { label: "9m / 30ft", meters: 9, category: "close", shape: "single-target" }, ["control"], [], ["action"], true),
  spell("planar-ally", "Planar Ally", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"]),
  spell("sights-of-the-seelie-summon-deva", "Sights of the Seelie: Summon Deva", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "single-target" }, ["summon"], [], ["action"], false, ["item-only"]),
  spell("sunbeam", "Sunbeam", 6, { label: "18m / 60ft line", meters: 18, category: "mid", shape: "line" }, ["area-damage", "control"], ["Radiant"], ["action"], true),
  spell("wall-of-ice", "Wall of Ice", 6, { label: "18m / 60ft, 9m / 30ft line", meters: 18, category: "mid", shape: "line", aoeMeters: 9 }, ["area-damage", "control"], ["Cold"], ["action"], true),
  spell("wall-of-thorns", "Wall of Thorns", 6, { label: "18m / 60ft", meters: 18, category: "mid", shape: "line" }, ["area-damage", "control"], ["Piercing"], ["action"], true),
  spell("wind-walk", "Wind Walk", 6, { label: "9m / 30ft", meters: 9, category: "close", shape: "radius" }, ["mobility-positioning", "defense-protection"], [], ["action"], true),
];

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