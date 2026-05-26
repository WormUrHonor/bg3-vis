import type { BG3ClassFeature } from "../data/bg3ClassFeatures";
import { getSpellById } from "../data/bg3Spells";
import { getSpellIcon } from "./spellIconLogic";

const featureIconModules = import.meta.glob("../assets/Feature Icons/*.{png,webp}", {
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
};

const fallbackIcon =
  featureIconModules["../assets/Feature Icons/Action_Fighter_ActionSurge.png"] ??
  Object.values(featureIconModules)[0];

function getDynamicSpellIcon(feature: BG3ClassFeature): string | undefined {
  const spellIconTag = feature.tags?.find((tag) =>
    tag.startsWith("uses-spell-icon:")
  );

  if (!spellIconTag) return undefined;

  const spellId = spellIconTag.replace("uses-spell-icon:", "");
  const spell = getSpellById(spellId);

  if (!spell) {
    console.warn(`Missing spell for dynamic class feature icon: ${spellId}`);
    return undefined;
  }

  return getSpellIcon(spell);
}

export function getClassFeatureIcon(feature: BG3ClassFeature): string {
  const dynamicSpellIcon = getDynamicSpellIcon(feature);

  if (dynamicSpellIcon) {
    return dynamicSpellIcon;
  }

  const fileName = featureIconFileById[feature.id];

  if (!fileName) {
    console.warn(`Missing feature icon mapping for: ${feature.id} (${feature.name})`);
    return fallbackIcon;
  }

  const pngModuleKey = `../assets/Feature Icons/${fileName}`;
  const webpModuleKey = fileName.endsWith(".webp")
    ? `../assets/Feature Icons/${fileName}`
    : `../assets/Feature Icons/${fileName}.webp`;

  const icon = featureIconModules[pngModuleKey] ?? featureIconModules[webpModuleKey];

  if (!icon) {
    console.warn(`Mapped feature icon file not found: ${fileName} for ${feature.id}`);
    return fallbackIcon;
  }

  return icon;
}