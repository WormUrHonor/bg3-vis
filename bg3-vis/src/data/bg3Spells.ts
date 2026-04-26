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

const spellDescriptions: Record<string, string> = {
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
for (const spellEntry of bg3Spells) {
  spellEntry.description = spellDescriptions[spellEntry.id];
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