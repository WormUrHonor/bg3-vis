import type { BG3ClassFeature } from "../data/bg3ClassFeatures";

const featureIconModules = import.meta.glob("../assets/Feature Icons/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const featureIconFileById: Record<string, string> = {
  "fighter-second-wind": "Action_Fighter_SecondWind.png",
  "fighter-action-surge": "Action_Fighter_ActionSurge.png",
  "fighter-battle-master-superiority-dice": "Passive_Fighter_SuperiorityDice.png",
  "fighter-manoeuvre-disarming-attack": "Action_BattleMaster_DisarmingAttack.png",
  "fighter-manoeuvre-pushing-attack": "Action_BattleMaster_PushingAttack.png",
  "fighter-manoeuvre-riposte": "Action_BattleMaster_Riposte.png",
  "barbarian-rage": "Action_Barbarian_Rage.png",
"barbarian-unarmoured-defence": "Passive_Barbarian_UnarmouredDefence.png",
"barbarian-reckless-attack": "Action_Barbarian_RecklessAttack.png",
"barbarian-danger-sense": "Passive_Barbarian_DangerSense.png",
"barbarian-extra-attack": "Passive_ExtraAttack.png",
"barbarian-fast-movement": "Passive_Barbarian_FastMovement.png",
"barbarian-feral-instinct": "Passive_Barbarian_FeralInstinct.png",
"barbarian-brutal-critical": "Passive_Barbarian_BrutalCritical.png",
"barbarian-relentless-rage": "Passive_Barbarian_RelentlessRage.png",

"berserker-frenzy": "Action_Berserker_Frenzy.png",
"berserker-frenzied-strike": "Action_Berserker_FrenziedStrike.png",
"berserker-enraged-throw": "Action_Berserker_EnragedThrow.png",
"berserker-mindless-rage": "Passive_Berserker_MindlessRage.png",
"berserker-intimidating-presence": "Action_Berserker_IntimidatingPresence.png",

"giant-giants-rage": "Action_Giant_GiantsRage.png",
"giant-vapraks-greed": "Passive_Giant_VapraksGreed.png",
"giant-boot-of-the-giants": "Passive_Giant_BootOfTheGiants.png",
"giant-elemental-cleaver": "Action_Giant_ElementalCleaver.png",
"giant-mighty-impel": "Action_Giant_MightyImpel.png",

"wild-magic-rage": "Action_WildMagic_Rage.png",
"wild-magic-magic-awareness": "Action_WildMagic_MagicAwareness.png",
"wild-magic-bolstering-magic-boon": "Action_WildMagic_BolsteringMagicBoon.png",
"wild-magic-bolstering-magic-level-1": "Action_WildMagic_BolsteringMagicLevel1.png",
"wild-magic-bolstering-magic-level-2": "Action_WildMagic_BolsteringMagicLevel2.png",
"wild-magic-bolstering-magic-level-3": "Action_WildMagic_BolsteringMagicLevel3.png",
"wild-magic-unstable-backlash": "Reaction_WildMagic_UnstableBacklash.png",

"wildheart-speak-with-animals": "Spell_Divination_SpeakWithAnimals.png",
"wildheart-bear-heart": "Action_Wildheart_BearHeart.png",
"wildheart-eagle-heart": "Action_Wildheart_EagleHeart.png",
"wildheart-elk-heart": "Action_Wildheart_ElkHeart.png",
"wildheart-tiger-heart": "Action_Wildheart_TigerHeart.png",
"wildheart-wolf-heart": "Action_Wildheart_WolfHeart.png",
"wildheart-land-stride-difficult-terrain": "Passive_Wildheart_LandsStrideDifficultTerrain.png",
"wildheart-aspect-bear-level-6": "Passive_Wildheart_AspectBear.png",
"wildheart-aspect-bear-level-10": "Passive_Wildheart_AspectBear.png",
"wildheart-aspect-chimpanzee-level-6": "Passive_Wildheart_AspectChimpanzee.png",
"wildheart-aspect-chimpanzee-level-10": "Passive_Wildheart_AspectChimpanzee.png",
"wildheart-aspect-crocodile-level-6": "Passive_Wildheart_AspectCrocodile.png",
"wildheart-aspect-crocodile-level-10": "Passive_Wildheart_AspectCrocodile.png",
"wildheart-aspect-eagle-level-6": "Passive_Wildheart_AspectEagle.png",
"wildheart-aspect-eagle-level-10": "Passive_Wildheart_AspectEagle.png",
"wildheart-aspect-elk-level-6": "Passive_Wildheart_AspectElk.png",
"wildheart-aspect-elk-level-10": "Passive_Wildheart_AspectElk.png",
"wildheart-aspect-honey-badger-level-6": "Passive_Wildheart_AspectHoneyBadger.png",
"wildheart-aspect-honey-badger-level-10": "Passive_Wildheart_AspectHoneyBadger.png",
"wildheart-aspect-stallion-level-6": "Passive_Wildheart_AspectStallion.png",
"wildheart-aspect-stallion-level-10": "Passive_Wildheart_AspectStallion.png",
"wildheart-aspect-tiger-level-6": "Passive_Wildheart_AspectTiger.png",
"wildheart-aspect-tiger-level-10": "Passive_Wildheart_AspectTiger.png",
"wildheart-aspect-wolf-level-6": "Passive_Wildheart_AspectWolf.png",
"wildheart-aspect-wolf-level-10": "Passive_Wildheart_AspectWolf.png",
"wildheart-aspect-wolverine-level-6": "Passive_Wildheart_AspectWolverine.png",
"wildheart-aspect-wolverine-level-10": "Passive_Wildheart_AspectWolverine.png",
};

const fallbackIcon =
  featureIconModules["../assets/Feature Icons/Action_Fighter_ActionSurge.png"];

export function getClassFeatureIcon(feature: BG3ClassFeature): string {
  const fileName = featureIconFileById[feature.id];

  if (!fileName) {
    console.warn(`Missing feature icon mapping for: ${feature.id} (${feature.name})`);
    return fallbackIcon;
  }

  const moduleKey = `../assets/Feature Icons/${fileName}`;
  const icon = featureIconModules[moduleKey];

  if (!icon) {
    console.warn(`Mapped feature icon file not found: ${fileName} for ${feature.id}`);
    return fallbackIcon;
  }

  return icon;
}