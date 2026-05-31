import type {
  AbilityDamageProfile,
  AbilityRole,
  DamageRoll,
  DamageType,
  NumericEffectType,
} from "../bg3Spells";
import type { BG3ClassFeature } from "./classFeatureTypes";

type SaveAbility = NonNullable<AbilityDamageProfile["saveAbility"]>;

const KNOWN_DAMAGE_TYPES: DamageType[] = [
  "Bludgeoning",
  "Piercing",
  "Slashing",
  "Acid",
  "Cold",
  "Fire",
  "Force",
  "Lightning",
  "Necrotic",
  "Poison",
  "Psychic",
  "Radiant",
  "Thunder",
  "Physical",
  "Weapon",
  "Variable",
];

const knownDamageTypeSet = new Set<string>(KNOWN_DAMAGE_TYPES);

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export function noClassFeatureDamage(notes?: string): AbilityDamageProfile {
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
    scaling: "none",
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

function weaponDamage(notes?: string): AbilityDamageProfile {
  return damageProfile({
    delivery: "weapon-hit",
    scaling: "weapon",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [],
    notes:
      notes ??
      "Weapon damage depends on the equipped weapon and is not numerically encoded here.",
  });
}

function unarmedDamage(notes?: string): AbilityDamageProfile {
  return damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [roll(1, 6, "Bludgeoning", 3, "unarmed damage placeholder")],
    notes:
      notes ??
      "Unarmed damage depends on level, ability modifier, and Monk scaling. A representative 1d6+3 placeholder is used.",
  });
}

function weaponRider(
  damageRolls: DamageRoll[],
  notes?: string
): AbilityDamageProfile {
  return damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    repeats: true,
    rolls: damageRolls,
    notes:
      notes ??
      "Base weapon damage depends on the equipped weapon and is not numerically encoded here.",
  });
}

function damageSetup(notes: string): AbilityDamageProfile {
  return damageProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    rolls: [],
    notes,
  });
}

function battleMasterGenericAttack(notes: string): AbilityDamageProfile {
  return weaponRider(
    [roll(1, 8, "Weapon", 0, "superiority die")],
    `Weapon damage depends on the equipped weapon. Adds 1d8 superiority die damage. ${notes}`
  );
}

function battleMasterMeleeAttack(notes: string): AbilityDamageProfile {
  return weaponRider(
    [roll(1, 8, "Weapon", 0, "superiority die")],
    `Melee weapon damage depends on the equipped weapon. Adds 1d8 superiority die damage. ${notes}`
  );
}

function battleMasterRangedAttack(notes: string): AbilityDamageProfile {
  return weaponRider(
    [roll(1, 8, "Piercing", 0, "superiority die")],
    `Ranged weapon damage depends on the equipped weapon. Adds 1d8 superiority die damage. ${notes}`
  );
}

function bardicFlourish(notes: string): AbilityDamageProfile {
  return weaponRider(
    [roll(1, 6, "Slashing", 0, "Bardic Inspiration die")],
    `Base weapon damage depends on the equipped weapon. Bardic Inspiration starts at 1d6 and later scales to 1d8 and 1d10. ${notes}`
  );
}

function monkUnarmedPair(notes: string): AbilityDamageProfile {
  return damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(1, 6, "Bludgeoning", 3, "first unarmed hit"),
      roll(1, 6, "Bludgeoning", 3, "second unarmed hit"),
    ],
    notes:
      "Each hit uses unarmed damage. The exact die and ability modifier can scale with Monk level and build. " +
      notes,
  });
}

function savingThrowDamage(
  damageRolls: DamageRoll[],
  saveAbility: SaveAbility,
  notes?: string,
  aoe = false,
  aoeMeters?: number
): AbilityDamageProfile {
  return damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "half-on-save",
    saveAbility,
    aoe,
    ...(aoeMeters !== undefined ? { aoeMeters } : {}),
    rolls: damageRolls,
    notes,
  });
}

function byName(
  name: string,
  profile: AbilityDamageProfile
): [string, AbilityDamageProfile] {
  return [normalizeKey(name), profile];
}

const classFeatureDamageProfileEntries: Array<
  [string, AbilityDamageProfile]
> = [
  byName("Abjure Enemy", noClassFeatureDamage("Frighten/slow control action. No direct damage.")),
  byName("Action Surge", noClassFeatureDamage("Grants one additional action. No direct damage.")),
  byName("Arcane Recovery", noClassFeatureDamage("Restores spell slots out of combat. No direct damage.")),
  byName("Aura of Courage", noClassFeatureDamage("Support aura. No direct damage.")),
  byName("Aura of Devotion", noClassFeatureDamage("Support aura. No direct damage.")),
  byName("Aura of Protection", noClassFeatureDamage("Saving throw support aura. No direct damage.")),
  byName("Aura of Warding", noClassFeatureDamage("Defensive aura. No direct damage.")),
  byName("Benign Transposition: Teleport", noClassFeatureDamage("Teleport/swap utility action. No direct damage.")),
  byName("Blessing of the Trickster", noClassFeatureDamage("Stealth support action. No direct damage.")),
  byName("Bolstering Magic: Boon", noClassFeatureDamage("Adds 1d4 to Attack Rolls and Ability Checks. No direct damage.")),
  byName("Bolstering Magic: Level 1 Spell Slot", noClassFeatureDamage("Resource recovery. No direct damage.")),
  byName("Bolstering Magic: Level 2 Spell Slot", noClassFeatureDamage("Resource recovery. No direct damage.")),
  byName("Bolstering Magic: Level 3 Spell Slot", noClassFeatureDamage("Resource recovery. No direct damage.")),
  byName("Champion Challenge", noClassFeatureDamage("Taunt/control action. No direct damage.")),
  byName("Charger: Shove", noClassFeatureDamage("Charge and shove control action. No direct damage.")),
  byName("Charm (Illithid Power)", noClassFeatureDamage("Charm reaction/control power. No direct damage.")),
  byName("Charm Animals and Plants", noClassFeatureDamage("Charm/control action. No direct damage.")),
  byName("Clench of the North Wind", noClassFeatureDamage("Hold/control action. No direct damage.")),
  byName("Click Heels", noClassFeatureDamage("Mobility support action. No direct damage.")),
  byName("Control Undead", noClassFeatureDamage("Control action. No direct damage.")),
  byName("Countercharm", noClassFeatureDamage("Defensive reaction/support feature. No direct damage.")),
  byName("Create Sorcery Points", noClassFeatureDamage("Resource conversion. No direct damage.")),
  byName("Create Spell Slot", noClassFeatureDamage("Resource conversion. No direct damage.")),
  byName("Cunning Action: Dash", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Cunning Action: Disengage", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Cunning Action: Hide", noClassFeatureDamage("Stealth action. No direct damage.")),
  byName("Cutting Words", noClassFeatureDamage("Reaction penalty to attacks, checks, and damage dealt. No direct damage.")),
  byName("Dash", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Dirty Trick: Sand Toss", noClassFeatureDamage("Blind/control action. No direct damage.")),
  byName("Dirty Trick: Vicious Mockery", noClassFeatureDamage("Control action that imposes Disadvantage. No direct damage in this action version.")),
  byName("Disengage", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Dismiss Summons", noClassFeatureDamage("Dismisses summons. No direct damage.")),
  byName("Displacer Beast Shape", noClassFeatureDamage("Transformation action. Beast-form attacks are not encoded here.")),
  byName("Divine Sense", noClassFeatureDamage("Gain Advantage on attacks against celestials, fiends, and undead. No direct damage.")),
  byName("Dread Ambusher: Hide", noClassFeatureDamage("Stealth action. No direct damage.")),
  byName("Dreadful Aspect", noClassFeatureDamage("Area frighten control action. No direct damage.")),
  byName("End Rage", noClassFeatureDamage("Ends Rage. No direct damage.")),
  byName("Entropic Ward", noClassFeatureDamage("Defensive reaction. No direct damage.")),
  byName("Fey Presence", noClassFeatureDamage("Charm/frighten control action. No direct damage.")),
  byName("Fiendish Resilience", noClassFeatureDamage("Resistance selection. No direct damage.")),
  byName("Fly", noClassFeatureDamage("Movement action. No direct damage.")),
  byName("Force Tunnel", noClassFeatureDamage("Movement/push utility. No direct damage listed.")),
  byName("Forced Manoeuvre", noClassFeatureDamage("Movement support action. No direct damage.")),
  byName("Fracture Psyche", noClassFeatureDamage("Debuff/control power. No direct damage.")),
  byName("Ability Drain", noClassFeatureDamage("Illithid passive that reduces the relevant Ability score on attack. No direct damage.")),
  byName("Favourable Beginnings", noClassFeatureDamage("Illithid passive that adds Proficiency Bonus to the first Attack Roll or Ability Check against a target. No direct damage.")),
  byName("Guided Strike", noClassFeatureDamage("Adds +10 to an Attack Roll. No direct damage.")),
  byName("Harmony of Fire and Water", noClassFeatureDamage("Ki recovery action. No direct damage.")),
  byName("Help", noClassFeatureDamage("Condition removal/help action. No direct healing amount.")),
  byName("Hide", noClassFeatureDamage("Stealth action. No direct damage.")),
  byName("Hide in Plain Sight", noClassFeatureDamage("Stealth/invisibility utility. No direct damage.")),
  byName("Hound of Ill Omen", noClassFeatureDamage("Summons a creature. The summon’s later attacks are not encoded here.")),
  byName("Hypnotic Gaze", noClassFeatureDamage("Charm/incapacitate control action. No direct damage.")),
  byName("Inciting Howl", noClassFeatureDamage("Party mobility support while Raging. No direct damage.")),
  byName("Inkblot", noClassFeatureDamage("Darkness and Hide utility action. No direct damage.")),
  byName("Intimidating Presence", noClassFeatureDamage("Frighten control action. No direct damage.")),
  byName("Invoke Duplicity", noClassFeatureDamage("Illusion support action that grants Advantage. No direct damage.")),
  byName("Jump", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Knowledge of the Ages", noClassFeatureDamage("Skill proficiency support. No direct damage.")),
  byName("Lay on Hands: Cure", noClassFeatureDamage("Cures disease and poison. No healing amount is listed for this version.")),
  byName("Magic Awareness", noClassFeatureDamage("Saving throw support aura. No direct damage.")),
  byName("Mantle of Majesty: Command", noClassFeatureDamage("Command/control action. No direct damage.")),
  byName("Mind Sanctuary", noClassFeatureDamage("Action economy support area. No direct damage.")),
  byName("Minor Conjuration: Create Water", noClassFeatureDamage("Creates water surface. No direct damage.")),
  byName("Nature's Wrath", noClassFeatureDamage("Restraining control action. No direct damage.")),
  byName("Natural Recovery", noClassFeatureDamage("Restores spell slots out of combat. No direct damage.")),
  byName("One With Shadows", noClassFeatureDamage("Invisibility utility action. No direct damage.")),
  byName("Panache", noClassFeatureDamage("Social/control action. No direct damage.")),
  byName("Patient Defence", noClassFeatureDamage("Defensive Ki action. No direct damage.")),
  byName("Patient Defense", noClassFeatureDamage("Defensive Ki action. No direct damage.")),
  byName("Perform", noClassFeatureDamage("Performance/social action. No direct damage.")),
  byName("Ranger's Companion", noClassFeatureDamage("Summons a beast companion. Companion attacks are not encoded here.")),
  byName("Restore Bardic Inspiration", noClassFeatureDamage("Restores Bardic Inspiration. No direct damage.")),
  byName("Righteous Clarity", noClassFeatureDamage("Adds Proficiency Bonus to Attack Rolls. No direct damage.")),
  byName("Rush of the Gale Spirits", noClassFeatureDamage("Area push/control action. No direct damage listed.")),
  byName("See Invisibility", noClassFeatureDamage("Reveal utility action. No direct damage.")),
  byName("Shadow Arts: Darkness", noClassFeatureDamage("Darkness/control spell-like action. No direct damage.")),
  byName("Shadow Arts: Darkvision", noClassFeatureDamage("Darkvision support action. No direct damage.")),
  byName("Shadow Arts: Hide", noClassFeatureDamage("Stealth action. No direct damage.")),
  byName("Shadow Arts: Pass Without Trace", noClassFeatureDamage("Stealth support spell-like action. No direct damage.")),
  byName("Shadow Arts: Silence", noClassFeatureDamage("Silence/control spell-like action. No direct damage.")),
  byName("Shadow Walk", noClassFeatureDamage("Teleport/support action. No direct damage.")),
  byName("Shapechanger", noClassFeatureDamage("Transformation/control utility. No direct damage.")),
  byName("Shaping of the Ice", noClassFeatureDamage("Creates a climbable ice cube. No direct damage.")),
  byName("Shove", noClassFeatureDamage("Control action. No direct damage.")),
  byName("Shrouded in Shadow", noClassFeatureDamage("Invisibility utility action. No direct damage.")),
  byName("Song of Rest", noClassFeatureDamage("Short-rest support action. No direct damage.")),
  byName("Sprint", noClassFeatureDamage("Mobility action. No direct damage.")),
  byName("Starry Form: Archer", noClassFeatureDamage("Form/setup action that grants Luminous Arrow. No direct damage on activation.")),
  byName("Starry Form: Chalice", noClassFeatureDamage("Form/setup action that grants Chalice Healing after healing spells. No direct healing on activation.")),
  byName("Starry Form: Dragon", noClassFeatureDamage("Form/setup action that grants Dazzling Breath access and concentration support. No direct damage on activation.")),
  byName("Step of the Wind: Dash", noClassFeatureDamage("Mobility Ki action. No direct damage.")),
  byName("Step of the Wind: Disengage", noClassFeatureDamage("Mobility Ki action. No direct damage.")),
  byName("Summon Companion", noClassFeatureDamage("Summons a companion. Companion attacks are not encoded here.")),
  byName("Third Eye: Darkvision", noClassFeatureDamage("Darkvision utility action. No direct damage.")),
  byName("Third Eye: See Invisibility", noClassFeatureDamage("Reveal utility action. No direct damage.")),
  byName("Toggle Non-Lethal Attacks", noClassFeatureDamage("Changes melee and unarmed attacks to non-lethal. No direct damage.")),
  byName("Transmuter's Stone", noClassFeatureDamage("Creates a support stone. No direct damage.")),
  byName("Turn the Faithless", noClassFeatureDamage("Turning/frighten control action. No direct damage.")),
  byName("Turn the Unholy", noClassFeatureDamage("Turning/frighten control action. No direct damage.")),
  byName("Turn Undead", noClassFeatureDamage("Turning control action. No direct damage.")),
  byName("Umbral Shroud", noClassFeatureDamage("Invisibility utility. No direct damage.")),
  byName("Voice of the Circle", noClassFeatureDamage("Persuasion support action. No direct damage.")),
  byName("Vow of Enmity", noClassFeatureDamage("Gain Advantage on Attack Rolls against a target. No direct damage.")),
  byName("Wild Shape Action", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Badger", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Bear", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Cat", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Deep Rothé", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Deep Rothe", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Dire Raven", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Owlbear", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Panther", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Sabre-Toothed Tiger", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Spider", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Wild Shape: Wolf", noClassFeatureDamage("Transform action. Beast-form attacks are not encoded here.")),
  byName("Writhing Tide", noClassFeatureDamage("Mobility action that grants flying speed and surface immunity. No direct damage.")),

  byName("Attack of Opportunity", weaponDamage("Reaction melee weapon attack.")),
  byName("Backbreaker", weaponDamage("Weapon action with a Prone control rider.")),
  byName("Banishing Arrow", weaponDamage("Ranged weapon attack with banishment control. No additional damage die listed.")),
  byName("Bite", weaponDamage("Natural melee attack. Exact damage depends on the source.")),
  byName("Boot of the Giants", weaponDamage("Kick/shove action. Exact damage is not reliably encoded.")),
  byName("Charger: Weapon Attack", weaponDamage("Weapon charge attack with increased damage. Exact weapon damage is not encoded.")),
  byName("Claws", weaponDamage("Natural Slashing attack. Exact die is source-dependent.")),
  byName("Cleave", weaponDamage("Weapon attack that can hit multiple nearby targets.")),
  byName("Commander's Strike", weaponDamage("Directs an ally to make a weapon attack using their reaction. Damage depends on the ally and weapon.")),
  byName("Concussive Smash", weaponDamage("Weapon action with a Daze control rider.")),
  byName("Crippling Strike", weaponDamage("Weapon action with a Cripple control rider.")),
  byName("Dirty Trick: Flick o' the Wrist", weaponDamage("Weapon/control action that can disarm and grants Advantage on the next attack.")),
  byName("Diving Strike", weaponDamage("Weapon attack from elevation. Exact weapon damage is not encoded.")),
  byName("Dueller's Enthusiasm", weaponDamage("Bonus-action melee attack with The Dueller.")),
  byName("Edge of Darkness", weaponDamage("Weapon attack that also attacks creatures in the darkness radius. Exact weapon damage is not encoded.")),
  byName("Enraged Throw", weaponDamage("Throw damage depends on the thrown object, weapon, creature weight, and Strength.")),
  byName("Flourish", weaponDamage("Weapon action with an Off Balance-style control rider.")),
  byName("Frenzied Strike", weaponDamage("Bonus-action melee weapon attack while Frenzied.")),
  byName("Gargantuan Cleave", weaponDamage("Multi-target weapon attack. Exact weapon damage depends on the equipped weapon.")),
  byName("Hamstring Shot", weaponDamage("Ranged weapon action with movement reduction.")),
  byName("Heartstopper", weaponDamage("Weapon action with a Chest Trauma control rider.")),
  byName("Horde Breaker (Melee)", weaponDamage("Melee weapon attack that opens a nearby second target for follow-up.")),
  byName("Horde Breaker (Ranged)", weaponDamage("Ranged weapon attack that opens a nearby second target for follow-up.")),
  byName("Improvised Melee Weapon", weaponDamage("Damage depends on improvised object or creature weight and Strength.")),
  byName("Intoxicating Strike", unarmedDamage("Unarmed attack that can make the target Drunk.")),
  byName("Lacerate", weaponDamage("Weapon action that may inflict Bleeding.")),
  byName("Maiming Strike", weaponDamage("Weapon action that can Maim.")),
  byName("Main Hand Attack", weaponDamage("Basic main-hand melee weapon attack.")),
  byName("Mighty Impel", weaponDamage("Throw damage depends on object or creature weight.")),
  byName("Mobile Shot", weaponDamage("Bonus-action ranged weapon attack while moving.")),
  byName("Piercing Shot", weaponDamage("Ranged weapon action that can inflict Gaping Wounds.")),
  byName("Piercing Strike", weaponDamage("Melee weapon action that can inflict Gaping Wounds.")),
  byName("Pin Down", weaponDamage("Ranged weapon action that can reduce movement.")),
  byName("Pommel Strike", weaponDamage("Non-lethal weapon action that can Daze.")),
  byName("Ranged Attack", weaponDamage("Basic ranged weapon attack dealing Piercing damage.")),
  byName("Razor Gale", weaponDamage("Weapon AoE action. Exact weapon damage depends on the weapon.")),
  byName("Reckless Attack", weaponDamage("Melee weapon attack with Advantage and defensive drawback.")),
  byName("Rush Attack", weaponDamage("Weapon charge attack that can push or Off Balance.")),
  byName("Stunning Strike (Melee)", weaponDamage("Melee weapon attack that can Stun.")),
  byName("Stunning Strike (Unarmed)", unarmedDamage("Unarmed attack that can Stun.")),
  byName("Throw", weaponDamage("Generic throw action. Damage depends on the thrown object, weapon, creature weight, and Strength.")),
  byName("Tiger's Bloodlust", weaponDamage("Attacks up to 3 enemies and inflicts Bleeding. Exact weapon damage is not encoded.")),
  byName("Topple", weaponDamage("Weapon action that can knock the target Prone.")),
  byName("Volley", weaponDamage("Ranged AoE weapon action. Exact weapon damage depends on the equipped weapon.")),
  byName("Weakening Strike", weaponDamage("Weapon action with a Weak Grip control rider.")),
  byName("Whirlwind Attack", weaponDamage("Melee AoE weapon action. Exact weapon damage depends on the equipped weapon.")),

  byName("Bardic Inspiration", damageSetup("Support die. Can increase a later Attack Roll. No direct damage when applied.")),
  byName("Bind Hexed Weapon", damageSetup("Weapon-binding setup. Later attacks with this weapon can apply Hexblade's Curse.")),
  byName("Bind Pact Weapon", damageSetup("Weapon-binding setup. The weapon becomes magical and uses the relevant pact weapon rules.")),
  byName("Brace (Melee)", damageSetup("For the rest of the turn, melee damage rolls are rolled twice and the highest result is used.")),
  byName("Brace (Ranged)", damageSetup("For the rest of the turn, ranged weapon damage rolls have Advantage, but movement is restricted.")),
  byName("Dip", damageSetup("Dips a weapon into a surface. Later weapon damage depends on the surface used.")),
  byName("Elemental Cleaver", weaponRider([roll(1, 6, "Variable", 0, "selected elemental damage")], "Weapon buff that adds Acid, Cold, Fire, Lightning, or Thunder damage until Rage ends.")),
  byName("Giant's Rage", damageSetup("Rage setup. Doubles Rage damage bonus on Throw attacks.")),
  byName("Giant's Rage (Action)", damageSetup("Rage setup. Doubles Rage damage bonus on Throw attacks.")),
  byName("Lightning Blast", damageSetup("The next Lightning spell or cantrip deals additional Lightning damage equal to remaining Lightning Charges.")),
  byName("Luck of the Far Realms", damageSetup("Reaction/passive setup that changes a successful Attack Roll into a Critical Hit once per Long Rest. The extra damage depends on the triggering attack.")),
  byName("Moonmote", damageSetup("Area support effect that bolsters allies' damage. Exact added damage is not numerically encoded.")),
  byName("Prepare", damageSetup("Spend movement to deal additional melee weapon damage for the rest of the turn.")),
  byName("Rage", damageSetup("While Raging, melee, improvised, and thrown attacks deal extra Rage damage.")),
  byName("Frenzy", damageSetup("Berserker Rage variant. Grants Frenzied Strike, Enraged Throw, bonus-action Improvised Weapon Attack, and keeps Rage damage active.")),
  byName("Rage: Bear Heart", damageSetup("Rage variant. Grants access to Unrelenting Ferocity and keeps Rage damage active.")),
  byName("Rage: Eagle Heart", damageSetup("Rage variant. Grants access to Diving Strike and keeps Rage damage active.")),
  byName("Rage: Elk Heart", damageSetup("Rage variant. Grants access to Primal Stampede and keeps Rage damage active.")),
  byName("Rage: Tiger Heart", damageSetup("Rage variant. Grants access to Tiger's Bloodlust and keeps Rage damage active.")),
  byName("Rage: Wild Magic", damageSetup("Rage variant. Keeps Rage damage active and triggers a random Wild Magic effect.")),
  byName("Rage: Wolf Heart", damageSetup("Rage variant. Keeps Rage damage active and supports nearby allies.")),
  byName("Sacred Weapon", damageSetup("Weapon buff. Turns the main-hand weapon into a Sacred Weapon.")),
  byName("Shadow Step", damageSetup("Teleport action that grants Advantage on the first melee attack before the end of the turn.")),
  byName("Viconia's Walking Fortress", damageSetup("Reflects targeted projectiles back to their point of origin. Reflected damage is projectile-dependent.")),

  byName("Disarming Attack", battleMasterGenericAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack (Melee)", battleMasterMeleeAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack: Melee", battleMasterMeleeAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack Melee", battleMasterMeleeAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack (Ranged)", battleMasterRangedAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack: Ranged", battleMasterRangedAttack("Can force the target to drop its weapon.")),
  byName("Disarming Attack Ranged", battleMasterRangedAttack("Can force the target to drop its weapon.")),

  byName("Distracting Strike", battleMasterGenericAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike (Melee)", battleMasterMeleeAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike: Melee", battleMasterMeleeAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike Melee", battleMasterMeleeAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike (Ranged)", battleMasterRangedAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike: Ranged", battleMasterRangedAttack("Grants allies Advantage on their next Attack Roll against the target.")),
  byName("Distracting Strike Ranged", battleMasterRangedAttack("Grants allies Advantage on their next Attack Roll against the target.")),

  byName("Feinting Attack", battleMasterGenericAttack("Uses both Action and Bonus Action, attacks with Advantage.")),

  byName("Goading Attack", battleMasterGenericAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack (Melee)", battleMasterMeleeAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack: Melee", battleMasterMeleeAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack Melee", battleMasterMeleeAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack (Ranged)", battleMasterRangedAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack: Ranged", battleMasterRangedAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),
  byName("Goading Attack Ranged", battleMasterRangedAttack("Can goad the target, giving it Disadvantage when attacking anyone else.")),

  byName("Manoeuvring Attack", battleMasterGenericAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),
  byName("Maneuvering Attack", battleMasterGenericAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),
  byName("Manoeuvring Attack (Melee)", battleMasterMeleeAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),
  byName("Maneuvering Attack (Melee)", battleMasterMeleeAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),
  byName("Manoeuvring Attack (Ranged)", battleMasterRangedAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),
  byName("Maneuvering Attack (Ranged)", battleMasterRangedAttack("Lets a friendly creature move up to half its movement speed without provoking Opportunity Attacks.")),

  byName("Menacing Attack", battleMasterGenericAttack("Can Frighten the target.")),
  byName("Menacing Attack (Melee)", battleMasterMeleeAttack("Can Frighten the target.")),
  byName("Menacing Attack: Melee", battleMasterMeleeAttack("Can Frighten the target.")),
  byName("Menacing Attack Melee", battleMasterMeleeAttack("Can Frighten the target.")),
  byName("Menacing Attack (Ranged)", battleMasterRangedAttack("Can Frighten the target.")),
  byName("Menacing Attack: Ranged", battleMasterRangedAttack("Can Frighten the target.")),
  byName("Menacing Attack Ranged", battleMasterRangedAttack("Can Frighten the target.")),

  byName("Pushing Attack", battleMasterGenericAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack (Melee)", battleMasterMeleeAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack: Melee", battleMasterMeleeAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack Melee", battleMasterMeleeAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack (Ranged)", battleMasterRangedAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack: Ranged", battleMasterRangedAttack("Can push the target back 4.5m.")),
  byName("Pushing Attack Ranged", battleMasterRangedAttack("Can push the target back 4.5m.")),

  byName("Trip Attack", battleMasterGenericAttack("Can knock the target Prone.")),
  byName("Trip Attack (Melee)", battleMasterMeleeAttack("Can knock the target Prone.")),
  byName("Trip Attack: Melee", battleMasterMeleeAttack("Can knock the target Prone.")),
  byName("Trip Attack Melee", battleMasterMeleeAttack("Can knock the target Prone.")),
  byName("Trip Attack (Ranged)", battleMasterRangedAttack("Can knock the target Prone.")),
  byName("Trip Attack: Ranged", battleMasterRangedAttack("Can knock the target Prone.")),
  byName("Trip Attack Ranged", battleMasterRangedAttack("Can knock the target Prone.")),

  byName("Rally", temporaryHpProfile(8, "Expend a superiority die to grant 8 temporary hit points.")),

  byName("Combat Inspiration", weaponRider([roll(1, 6, "Weapon", 0, "Combat Inspiration damage die")], "Can add Bardic Inspiration to weapon damage. Die starts at 1d6 and later scales to 1d8 and 1d10.")),
  byName("Slashing Flourish (Melee)", bardicFlourish("Attacks up to 2 enemies.")),
  byName("Slashing Flourish (Ranged)", bardicFlourish("Attacks up to 2 enemies.")),
  byName("Defensive Flourish (Melee)", bardicFlourish("Increases AC by 4 on hit.")),
  byName("Defensive Flourish (Ranged)", bardicFlourish("Increases AC by 4 on hit.")),
  byName("Mobile Flourish (Melee)", bardicFlourish("Pushes target and allows teleport follow-up.")),
  byName("Mobile Flourish (Ranged)", bardicFlourish("Pushes target and allows teleport follow-up.")),

  byName("Absolute Power", weaponRider([roll(1, 6, "Force", 0, "additional Force damage")], "Base melee weapon damage is not encoded. Also can push the target.")),
  byName("Aura of Hate", weaponRider([flat(3, "Weapon", "Charisma modifier damage placeholder")], "Adds Charisma modifier to melee weapon damage for affected fiends and undead. Stored as a flat placeholder because Charisma modifier depends on build.")),
  byName("Blood Money", weaponRider([flat(4, "Piercing", "additional Piercing damage per 300 gold")], "Base weapon damage is not encoded. The additional 4 Piercing damage repeats per 300 gold the target carries.")),
  byName("Corrosive Strike", weaponRider([flat(3, "Acid", "Proficiency Bonus Acid placeholder")], "Base weapon damage is not encoded. Additional Acid damage equals Proficiency Bonus, represented here as a placeholder.")),
  byName("Crusader's Mantle", weaponRider([roll(1, 4, "Radiant", 0, "added weapon damage")], "Nearby allies add Radiant damage to weapon attacks.")),
  byName("Divine Strike", weaponRider([roll(1, 8, "Variable", 0, "domain Divine Strike damage")], "Base weapon damage is not encoded. Damage type depends on the selected Cleric domain.")),
  byName("Divine Strike: Necrotic", weaponRider([roll(1, 8, "Necrotic", 0, "Divine Strike: Necrotic")], "Base weapon damage is not encoded.")),
  byName("Elemental Cleaver: Acid", weaponRider([roll(1, 6, "Acid", 0, "Elemental Cleaver rider")])),
  byName("Elemental Cleaver: Cold", weaponRider([roll(1, 6, "Cold", 0, "Elemental Cleaver rider")])),
  byName("Elemental Cleaver: Fire", weaponRider([roll(1, 6, "Fire", 0, "Elemental Cleaver rider")])),
  byName("Elemental Cleaver: Lightning", weaponRider([roll(1, 6, "Lightning", 0, "Elemental Cleaver rider")])),
  byName("Elemental Cleaver: Thunder", weaponRider([roll(1, 6, "Thunder", 0, "Elemental Cleaver rider")])),
  byName("Hunter's Mark", weaponRider([roll(1, 6, "Physical", 0, "marked target damage")])),
  byName("Inquisitor's Might", weaponRider([flat(2, "Radiant", "additional Radiant damage")])),
  byName("Magic Weapon", weaponRider([flat(1, "Weapon", "+1 weapon damage bonus")])),
  byName("Moonlight Butterflies", weaponRider([flat(3, "Psychic", "Proficiency Bonus Psychic placeholder"), roll(1, 6, "Psychic", 0, "movement-triggered Psychic damage")], "Initial bonus damage equals Proficiency Bonus. Movement away from the illusion triggers 1d6 Psychic damage.")),
  byName("Shadowsoaked Blow", weaponRider([flat(3, "Weapon", "Proficiency Bonus damage placeholder"), roll(1, 6, "Psychic", 0, "additional Psychic damage")], "Base weapon damage is not encoded. Proficiency Bonus damage is represented as a placeholder.")),
  byName("Shillelagh", weaponRider([roll(1, 8, "Weapon", 2, "empowered staff or club damage")])),
  byName("Sobering Realisation", weaponRider([roll(1, 8, "Psychic", 0, "bonus Psychic damage against Drunk target")], "Base unarmed damage is not encoded. Also adds Wisdom modifier in-game.")),
  byName("Soulbreaker", weaponRider([flat(4, "Psychic", "additional Psychic damage")], "Base weapon damage is not encoded. Also can Stun the target.")),

  byName("Divine Smite", weaponRider([roll(2, 8, "Radiant", 0, "level 1 Divine Smite")], "Base melee weapon damage is not encoded. Divine Smite scales with spell slot level and gains extra damage against fiends and undead.")),
  byName("Divine Smite Weapon Damage", weaponRider([roll(2, 8, "Radiant", 0, "level 1 Divine Smite")], "Base melee weapon damage is not encoded. Divine Smite scales with spell slot level and gains extra damage against fiends and undead.")),
  byName("Divine Smite: Reaction Weapon Damage", weaponRider([roll(2, 8, "Radiant", 0, "level 1 Divine Smite")], "Reaction Divine Smite. Base melee weapon damage is not encoded.")),
  byName("Divine Smite Critical: Reaction Weapon Damage", weaponRider([roll(2, 8, "Radiant", 0, "level 1 Divine Smite")], "Critical Divine Smite reaction. Crit doubling is not precomputed.")),

  byName("Sneak Attack (Melee)", weaponRider([roll(1, 6, "Weapon", 0, "Sneak Attack die")], "Base finesse weapon damage is not encoded. Sneak Attack scales with Rogue level.")),
  byName("Sneak Attack (Ranged)", weaponRider([roll(1, 6, "Piercing", 0, "Sneak Attack die")], "Base ranged or finesse weapon damage is not encoded. Sneak Attack scales with Rogue level.")),

  byName("Colossal Onslaught", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    aoe: true,
    rolls: [roll(1, 8, "Bludgeoning", 0, "plus Strength modifier")],
    notes: "Deals 1d8 Bludgeoning plus Strength modifier in a line.",
  })),
  byName("Grand Slam", mixedProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    aoe: true,
    rolls: [
      roll(1, 8, "Bludgeoning", 0, "Bludgeoning slam"),
      flat(4, "Thunder", "Thunder impact"),
    ],
    notes: "Slam attack with 1d8 Bludgeoning plus 4 Thunder damage.",
  })),
  byName("Poison Mist", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    aoe: true,
    rolls: [roll(1, 4, "Poison", 0, "Poison Mist cloud damage")],
  })),
  byName("Primal Stampede", savingThrowDamage([roll(1, 4, "Bludgeoning", 2, "Primal Stampede damage")], "DEX", "Knocks targets Prone on failed save.", true)),
  byName("Spiteful Suffering", damageProfile({
    delivery: "per-turn",
    scaling: "conditional",
    saveBehaviour: "negates-on-save",
    saveAbility: "CHA",
    repeats: true,
    repeatDurationTurns: 3,
    rolls: [roll(1, 4, "Necrotic", 3, "Necrotic damage per turn")],
    notes: "Attack Rolls against the affected target have Advantage.",
  })),
  byName("Stage Fright", damageProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "negates-on-save",
    saveAbility: "WIS",
    repeats: true,
    repeatDurationTurns: 3,
    rolls: [roll(2, 6, "Psychic", 0, "conditional Psychic damage")],
    notes: "Target takes Psychic damage when it misses an Attack Roll. The condition can end early when the target succeeds an Attack Roll.",
  })),
  byName("Holy Rebuke", damageProfile({
    delivery: "retaliation",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 2,
    rolls: [roll(1, 4, "Radiant", 0, "melee retaliation damage")],
  })),
  byName("Lightning Aura", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "negates-on-save",
    aoe: true,
    aoeMeters: 6,
    rolls: [roll(1, 6, "Lightning")],
    notes: "Consumes Lightning Charges and may Jolt nearby enemies.",
  })),
  byName("Blood Sacrifice", mixedProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [roll(1, 4, "Slashing", 0, "self-inflicted Slashing damage")],
    notes: "Self-damage grants a +1d4 bonus to Attack Rolls and Saving Throws.",
  })),
  byName("Searing Blood", mixedProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [
      flat(3, "Fire", "Proficiency Bonus Fire placeholder"),
      roll(1, 6, "Fire", 0, "additional Fire damage"),
      roll(1, 6, "Slashing", 0, "self-inflicted Slashing damage"),
    ],
    notes: "Base weapon damage is not encoded. Proficiency Bonus Fire damage is represented as a placeholder.",
  })),
  byName("Vampire Bite", mixedProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(2, 4, "Piercing", 0, "bite damage"),
      roll(2, 4, "Healing", 0, "self healing"),
    ],
  })),
  byName("Symbiotic Entity", mixedProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    rolls: [
      flat(8, "Temporary Hit Points", "temporary hit points"),
      roll(1, 6, "Necrotic", 0, "additional weapon damage while active"),
    ],
    notes: "Temporary HP scales with Druid level in-game. Halo of Spores also deals double damage while active.",
  })),
  byName("Hexblade's Curse", mixedProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [
      flat(3, "Weapon", "Proficiency Bonus damage placeholder"),
      flat(4, "Healing", "healing when cursed target dies"),
    ],
    notes: "Damage rolls against the cursed target gain Proficiency Bonus, represented here as a placeholder. If the target dies, the user regains 4 HP.",
  })),
  byName("Psionic Overload", mixedProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 10,
    rolls: [
      roll(1, 4, "Psychic", 0, "additional attack damage"),
      roll(1, 4, "Psychic", 0, "self-damage each turn"),
    ],
    notes: "Your attacks deal additional Psychic damage, but you also take Psychic damage each turn.",
  })),
  byName("Concentrated Blast", mixedProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [
      roll(3, 6, "Psychic", 0, "Psychic damage"),
      roll(3, 6, "Healing", 0, "conditional healing"),
    ],
    notes: "Requires concentration on another spell. If the target was concentrating, the caster heals for the damage dealt.",
  })),
  byName("Bladesong Climax", mixedProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "half-on-save",
    saveAbility: "INT",
    aoe: true,
    aoeMeters: 3,
    rolls: [
      roll(1, 6, "Force", 0, "additional Bladesong damage charge"),
      roll(1, 6, "Healing", 0, "additional Bladesong healing charge"),
    ],
    notes: "Unleashes Bladesong damage and healing charges, then ends Bladesong. The actual number of charges depends on current Bladesong state.",
  })),

  byName("Blade of Rime", mixedProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "half-on-save",
    saveAbility: "DEX",
    aoe: true,
    aoeMeters: 2,
    rolls: [
      roll(1, 10, "Piercing", 0, "ice shard impact"),
      roll(2, 6, "Cold", 0, "explosion damage"),
    ],
    notes: "Leaves an ice surface.",
  })),
  byName("Chill of the Mountain", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [roll(1, 10, "Cold", 0, "Cold damage")],
    notes: "Also reduces target movement speed.",
  })),
  byName("Fangs of the Fire Snake", mixedProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(1, 6, "Bludgeoning", 3, "unarmed hit placeholder"),
      roll(1, 10, "Fire", 0, "Fire Snake damage"),
      roll(1, 4, "Fire", 0, "later melee attack Fire rider"),
    ],
    notes: "Unarmed base damage and ability modifiers are build-dependent. Later melee attacks gain extra Fire damage this turn.",
  })),
  byName("Fist of Four Thunders", savingThrowDamage([roll(2, 8, "Thunder")], "CON", "Pushes creatures and objects away.", true, 5)),
  byName("Fist of Unbroken Air", savingThrowDamage([roll(3, 10, "Bludgeoning")], "STR", "Pushes the target back and can knock it Prone.")),
  byName("Gong of the Summit", savingThrowDamage([roll(3, 8, "Thunder")], "CON", "Damages nearby creatures and objects. Inorganic creatures have Disadvantage on the save.", true)),
  byName("Sphere of Elemental Balance", savingThrowDamage([roll(3, 8, "Thunder")], "DEX", "May create a surface on impact.")),
  byName("Sweeping Cinder Strike", savingThrowDamage([roll(3, 6, "Fire")], "DEX", "Ignites flammable objects and surfaces.", true, 5)),
  byName("Water Whip", savingThrowDamage([roll(3, 10, "Bludgeoning")], "DEX", "Can pull the target or knock it Prone.")),
  byName("Embrace of the Inferno", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "attack-roll",
    attackRoll: true,
    canCrit: true,
    targetCount: 3,
    rolls: [
      roll(2, 6, "Fire", 0, "ray 1"),
      roll(2, 6, "Fire", 0, "ray 2"),
      roll(2, 6, "Fire", 0, "ray 3"),
    ],
    notes: "Three flaming rays, each dealing 2d6 Fire damage.",
  })),

  byName("Bursting Arrow", damageProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    aoe: true,
    aoeMeters: 3,
    rolls: [roll(2, 6, "Force", 0, "Bursting Arrow explosion")],
    notes: "Base ranged weapon damage is not encoded.",
  })),
  byName("Enfeebling Arrow", weaponRider([roll(2, 6, "Necrotic", 0, "additional Necrotic damage")], "Base ranged weapon damage is not encoded.")),
  byName("Beguiling Arrow", weaponRider([roll(2, 6, "Psychic", 0, "additional Psychic damage")], "Base ranged weapon damage is not encoded.")),
  byName("Seeking Arrow", weaponRider([roll(1, 6, "Force", 0, "additional Force damage")], "Base ranged weapon damage is not encoded.")),
  byName("Shadow Arrow", weaponRider([roll(2, 6, "Psychic", 0, "additional Psychic damage")], "Base ranged weapon damage is not encoded.")),
  byName("Grasping Arrow", mixedProfile({
    delivery: "weapon-rider",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    repeats: true,
    rolls: [
      roll(2, 6, "Poison", 0, "initial Poison damage"),
      roll(2, 6, "Slashing", 0, "movement-triggered Slashing damage"),
    ],
    notes: "Base ranged weapon damage is not encoded.",
  })),
  byName("Piercing Arrow", weaponRider([roll(1, 6, "Piercing", 0, "additional Piercing damage")], "Base ranged weapon damage is not encoded. Attacks targets in a line.")),

  byName("Flurry of Blows", monkUnarmedPair("Basic Flurry of Blows.")),
  byName("Flurry of Blows: Push", monkUnarmedPair("Can push the target away.")),
  byName("Flurry of Blows: Stagger", monkUnarmedPair("Can Stagger the target.")),
  byName("Flurry of Blows: Topple", monkUnarmedPair("Can knock the target Prone.")),
  byName("Drunken Technique", damageProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "weapon-attack",
    attackRoll: true,
    canCrit: true,
    rolls: [
      roll(1, 4, "Bludgeoning", 3, "first unarmed hit"),
      roll(1, 4, "Bludgeoning", 3, "second unarmed hit"),
    ],
    notes: "Each hit also adds Strength or Dexterity modifier. Grants movement and Disengage benefits.",
  })),

  byName("Mind Blast", savingThrowDamage([roll(4, 8, "Psychic", 5, "Psychic cone damage")], "INT", "Can Stun targets.", true, 14)),
  byName("Repulsor", savingThrowDamage([roll(2, 6, "Force")], "STR", "Pushes targets back.", true, 6)),
  byName("Radiance of the Dawn", savingThrowDamage(
    [roll(2, 10, "Radiant", 0, "Radiance of the Dawn")],
    "CON",
    "Channel Divinity action. Adds Cleric/character level as Radiant damage in-game; the level-based modifier is described in notes rather than hard-coded.",
    true,
    9
  )),
  byName("Psionic Backlash", damageProfile({
    delivery: "retaliation",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    rolls: [roll(1, 4, "Psychic", 0, "Psychic damage per triggering spell level")],
    notes: "Reaction when a nearby enemy casts a spell. The 1d4 Psychic damage repeats once per spell level.",
  })),
  byName("Psionic Backlash (Passive Feature)", damageProfile({
    delivery: "retaliation",
    scaling: "conditional",
    saveBehaviour: "none",
    repeats: true,
    rolls: [roll(1, 4, "Psychic", 0, "Psychic damage per triggering spell level")],
    notes: "Passive-feature alias for Psionic Backlash. The 1d4 Psychic damage repeats once per spell level.",
  })),
  byName("Cull the Weak", damageProfile({
    delivery: "conditional",
    scaling: "conditional",
    saveBehaviour: "none",
    aoe: true,
    repeats: true,
    rolls: [roll(1, 4, "Psychic", 0, "nearby enemy Psychic damage")],
    notes: "Toggleable Illithid passive. Executes a creature below the evolved-power threshold and deals 1d4 Psychic damage to nearby enemies.",
  })),

  byName("Lay on Hands", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [flat(4, "Healing", "Lay on Hands base healing")],
    notes: "Uses Lay on Hands charge(s). No effect on undead and constructs.",
  })),
  byName("Lay on Hands: Lesser Healing", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [flat(10, "Healing", "Lesser Healing")],
    notes: "No effect on undead and constructs.",
  })),
  byName("Lay on Hands: Greater Healing", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [flat(20, "Healing", "Greater Healing")],
    notes: "No effect on undead and constructs.",
  })),
  byName("Second Wind", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    rolls: [roll(1, 10, "Healing", 0, "Second Wind base healing")],
    notes: "Also adds Fighter level in-game.",
  })),
  byName("Healing Radiance", healingProfile({
    delivery: "per-turn",
    scaling: "none",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 2,
    aoe: true,
    aoeMeters: 3,
    rolls: [
      flat(5, "Healing", "initial healing"),
      flat(5, "Healing", "healing next turn"),
    ],
    notes: "No effect on undead and constructs.",
  })),
  byName("Turn the Tide", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    aoe: true,
    rolls: [roll(1, 6, "Healing", 0, "healing plus Charisma modifier")],
  })),
  byName("Unrelenting Ferocity", healingProfile({
    delivery: "instant",
    scaling: "none",
    saveBehaviour: "none",
    rolls: [roll(1, 8, "Healing", 2, "Unrelenting Ferocity healing")],
  })),
  byName("Preserve Life", healingProfile({
    delivery: "instant",
    scaling: "conditional",
    saveBehaviour: "none",
    aoe: true,
    aoeMeters: 9,
    rolls: [],
    notes: "Restores 3 × Cleric level hit points. No effect on undead and constructs.",
  })),
  byName("Transfuse Health", healingProfile({
    delivery: "instant",
    scaling: "variable",
    saveBehaviour: "none",
    rolls: [],
    notes: "Sacrifice half remaining HP to heal the target for the same amount.",
  })),
  byName("Absorb Intellect", healingProfile({
    delivery: "per-turn",
    scaling: "none",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 5,
    rolls: [roll(1, 8, "Healing", 0, "healing per turn")],
  })),
  byName("Healing Incense Aura", healingProfile({
    delivery: "per-turn",
    scaling: "none",
    saveBehaviour: "none",
    repeats: true,
    rolls: [roll(1, 4, "Healing", 0, "healing at start of turn")],
  })),
  byName("Perilous Stakes", healingProfile({
    delivery: "conditional",
    scaling: "none",
    saveBehaviour: "none",
    repeats: true,
    repeatDurationTurns: 3,
    rolls: [roll(2, 8, "Healing", 0, "healing when target attacks")],
    notes: "Also makes the target Vulnerable to all damage.",
  })),

  byName("False Life", temporaryHpProfile(7, "Temporary hit points.")),
  byName("Mantle of Inspiration", temporaryHpProfile(5, "Grants 5 temporary HP to 2 allies.")),
  byName("Shield of Thralls", temporaryHpProfile(10, "Temporary HP shield. Bursts when lost and may Stun nearby foes.")),
];

export const classFeatureDamageProfilesByName: Record<
  string,
  AbilityDamageProfile
> = Object.fromEntries(classFeatureDamageProfileEntries);

const profileKeysByLength = Object.keys(classFeatureDamageProfilesByName).sort(
  (a, b) => b.length - a.length
);

function getProfileByLooseKey(value: string): AbilityDamageProfile | undefined {
  const key = normalizeKey(value);

  if (classFeatureDamageProfilesByName[key]) {
    return classFeatureDamageProfilesByName[key];
  }

  const keyWithoutMode = key
    .replace(
      /-(melee|ranged|weapon-damage|reaction-weapon-damage|illithid-power|passive-feature|toggleable-passive-feature)$/g,
      ""
    )
    .replace(/-(action|feature|passive|power)$/g, "");

  if (classFeatureDamageProfilesByName[keyWithoutMode]) {
    return classFeatureDamageProfilesByName[keyWithoutMode];
  }

  return profileKeysByLength
    .filter((profileKey) => {
      if (key === profileKey || key.endsWith(profileKey)) return true;

      if (
        keyWithoutMode === profileKey ||
        keyWithoutMode.endsWith(profileKey)
      ) {
        return true;
      }

      return false;
    })
    .map((profileKey) => classFeatureDamageProfilesByName[profileKey])
    .find(Boolean);
}

function getProfileForFeature(
  featureEntry: BG3ClassFeature
): AbilityDamageProfile {
  return (
    getProfileByLooseKey(featureEntry.name) ??
    getProfileByLooseKey(featureEntry.id) ??
    noClassFeatureDamage()
  );
}

function getDamageTypesFromProfile(profile: AbilityDamageProfile): DamageType[] {
  if (!profile.hasDamage) return [];

  return profile.rolls
    .map((damageRoll) => String(damageRoll.damageType))
    .filter((damageType) => knownDamageTypeSet.has(damageType))
    .map((damageType) => damageType as DamageType);
}

function getRolesFromProfile(profile: AbilityDamageProfile): AbilityRole[] {
  if (!profile.hasDamage) return [];

  if (profile.damageKind === "healing") return ["healing"];

  if (profile.damageKind === "temporary-hit-points") {
    return ["defense-protection"];
  }

  if (profile.damageKind === "mixed") {
    const hasHealing = profile.rolls.some((damageRoll) =>
      ["Healing", "Temporary Hit Points"].includes(String(damageRoll.damageType))
    );

    const hasDamage = profile.rolls.some((damageRoll) =>
      knownDamageTypeSet.has(String(damageRoll.damageType))
    );

    return [
      ...(hasDamage
        ? [profile.aoe ? "area-damage" : "single-target-damage"]
        : []),
      ...(hasHealing ? ["healing"] : []),
    ] as AbilityRole[];
  }

  if (profile.damageKind === "damage") {
    return [profile.aoe ? "area-damage" : "single-target-damage"];
  }

  return [];
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function enrichClassFeature(
  featureEntry: BG3ClassFeature
): BG3ClassFeature {
  const damage = getProfileForFeature(featureEntry);
  const profileRoles = getRolesFromProfile(damage);
  const profileDamageTypes = getDamageTypesFromProfile(damage);

  return {
    ...featureEntry,
    damage,
    roles: uniqueStrings([...featureEntry.roles, ...profileRoles]),
    damageTypes: uniqueStrings([
      ...featureEntry.damageTypes,
      ...profileDamageTypes,
    ]),
    tags: uniqueStrings([
      ...(featureEntry.tags ?? []),
      ...(damage.hasDamage ? [`damage-kind:${damage.damageKind}`] : []),
    ]),
  };
}

export function getUnmatchedClassFeatureDamageNames(
  features: BG3ClassFeature[]
): Array<{ id: string; name: string }> {
  return features
    .filter((featureEntry) => {
      const matchedByName = getProfileByLooseKey(featureEntry.name);
      const matchedById = getProfileByLooseKey(featureEntry.id);
      return !matchedByName && !matchedById;
    })
    .map((featureEntry) => ({
      id: featureEntry.id,
      name: featureEntry.name,
    }));
}

export const extraClassFeatures: BG3ClassFeature[] = [];