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