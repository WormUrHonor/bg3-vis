import type { BG3ClassFeature } from "../data/bg3ClassFeatures";
import { classFeatureIconFileById } from "../data/bg3ClassFeatures";
import { getSpellById } from "../data/bg3Spells";
import { getSpellIcon } from "./spellIconLogic";

const featureIconModules = import.meta.glob(
  "../assets/Feature Icons/*.{png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
) as Record<string, string>;

const spellIconModules = import.meta.glob(
  "../assets/Spell Icons/*.{png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
) as Record<string, string>;

const fallbackFeatureIcon =
  featureIconModules["../assets/Feature Icons/Action_Fighter_ActionSurge.png"] ??
  featureIconModules["../assets/Feature Icons/Action_Fighter_ActionSurge.webp"] ??
  Object.values(featureIconModules)[0];

const fallbackSpellIcon =
  spellIconModules["../assets/Spell Icons/Spell_Evocation_MagicMissile.png"] ??
  spellIconModules["../assets/Spell Icons/Spell_Evocation_MagicMissile.webp"] ??
  Object.values(spellIconModules)[0];

function normalizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/(\.png|\.webp|\.jpg|\.jpeg)+$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getFileNameFromModuleKey(moduleKey: string): string {
  return moduleKey.split("/").at(-1) ?? moduleKey;
}

function findIconByFileName(
  fileName: string,
  modules: Record<string, string>
): string | undefined {
  const exactKey = Object.keys(modules).find((moduleKey) =>
    moduleKey.endsWith(`/${fileName}`)
  );

  if (exactKey) return modules[exactKey];

  const wanted = normalizeFileName(fileName);

  const fuzzyKey = Object.keys(modules).find((moduleKey) => {
    const availableFileName = getFileNameFromModuleKey(moduleKey);
    return normalizeFileName(availableFileName) === wanted;
  });

  return fuzzyKey ? modules[fuzzyKey] : undefined;
}

function findIconByFeatureName(
  feature: BG3ClassFeature,
  modules: Record<string, string>
): string | undefined {
  const wanted = normalizeFileName(feature.name);

  const fuzzyKey = Object.keys(modules).find((moduleKey) => {
    const availableFileName = getFileNameFromModuleKey(moduleKey);
    return normalizeFileName(availableFileName).includes(wanted);
  });

  return fuzzyKey ? modules[fuzzyKey] : undefined;
}

function getDynamicSpellIcon(feature: BG3ClassFeature): string | undefined {
  const spellIconTag = feature.tags?.find((tag) =>
    tag.startsWith("uses-spell-icon:")
  );

  if (!spellIconTag) return undefined;

  const spellId = spellIconTag.replace("uses-spell-icon:", "");
  const spell = getSpellById(spellId);

  if (!spell) {
    console.warn(
      `Missing spell for dynamic class feature icon: ${spellId} on ${feature.id} (${feature.name})`
    );
    return undefined;
  }

  return getSpellIcon(spell);
}

export function getClassFeatureIcon(feature: BG3ClassFeature): string {
  const dynamicSpellIcon = getDynamicSpellIcon(feature);

  if (dynamicSpellIcon) {
    return dynamicSpellIcon;
  }

  const mappedFileName = classFeatureIconFileById[feature.id];

  if (mappedFileName) {
    const featureIcon = findIconByFileName(mappedFileName, featureIconModules);
    if (featureIcon) return featureIcon;

    const spellIcon = findIconByFileName(mappedFileName, spellIconModules);
    if (spellIcon) return spellIcon;

    console.warn(
      `Mapped class feature icon file not found: ${mappedFileName} for ${feature.id} (${feature.name})`
    );
  } else {
    console.warn(
      `Missing class feature icon mapping for: ${feature.id} (${feature.name})`
    );
  }

  const featureNameFallback = findIconByFeatureName(feature, featureIconModules);
  if (featureNameFallback) return featureNameFallback;

  const spellNameFallback = findIconByFeatureName(feature, spellIconModules);
  if (spellNameFallback) return spellNameFallback;

  return fallbackFeatureIcon ?? fallbackSpellIcon;
}