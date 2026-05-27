import {
  getClassFeatureById,
  type BG3ClassFeature,
} from "../../data/bg3ClassFeatures";
import { getSpellById, type BG3Spell } from "../../data/bg3Spells";
import type { VisualizedBuildItem } from "./dataCircleTypes";

export type BuildVisualSource = {
  selectedSpellIds: string[];
  fixedClassFeatureIds: string[];
  selectedClassFeatureIds: string[];
  activeClassFeatureIds: string[];
};

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function getSelectedSpells(selectedSpellIds: string[]): BG3Spell[] {
  return selectedSpellIds
    .map((id) => getSpellById(id))
    .filter((spell): spell is BG3Spell => Boolean(spell));
}

function getSelectedClassFeatures(featureIds: string[]): BG3ClassFeature[] {
  return featureIds
    .map((id) => getClassFeatureById(id))
    .filter((feature): feature is BG3ClassFeature => Boolean(feature));
}

export function isVisualizableClassFeature(feature: BG3ClassFeature): boolean {
  if (feature.isInformational) return false;

  const hasRoles = feature.roles.length > 0;
  const hasDamageTypes = feature.damageTypes.length > 0;
  const hasRange = Boolean(feature.range);

  const isUsableAction =
    feature.kind === "action" ||
    feature.kind === "bonus-action" ||
    feature.kind === "reaction" ||
    feature.kind === "manoeuvre" ||
    feature.kind === "toggle" ||
    feature.kind === "subclass-feature";

  const isRelevantPassive =
    feature.kind === "passive" &&
    (feature.roles.some((role) =>
      [
        "single-target-damage",
        "area-damage",
        "control",
        "support-buff",
        "defense-protection",
        "healing",
        "mobility-positioning",
        "summon",
      ].includes(role)
    ) ||
      hasDamageTypes);

  return (
    hasRange &&
    (isUsableAction || isRelevantPassive) &&
    (hasRoles || hasDamageTypes)
  );
}

export function getVisualizedBuildItems({
  selectedSpellIds,
  fixedClassFeatureIds,
  selectedClassFeatureIds,
  activeClassFeatureIds,
}: BuildVisualSource): VisualizedBuildItem[] {
  const selectedSpells = getSelectedSpells(selectedSpellIds);

  const selectedClassFeatures = uniqueById(
    getSelectedClassFeatures([
      ...fixedClassFeatureIds,
      ...selectedClassFeatureIds,
      ...activeClassFeatureIds,
    ])
  ).filter(isVisualizableClassFeature);

  return uniqueById([...selectedSpells, ...selectedClassFeatures]);
}