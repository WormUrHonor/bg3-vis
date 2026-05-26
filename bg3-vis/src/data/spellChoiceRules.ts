import type { ClassName } from "../types/buildPlannerTypes";
import type { BG3Spell } from "./bg3Spells";

export type SpellChoiceRuleDefinition = {
  id: string;
  label: string;
  className: ClassName;
  subclass?: string;
  minLevel: number;
  maxLevel?: number;
  spellIds?: string[];
  ranks?: number[];
  maxByLevel: {
    minLevel: number;
    max: number;
  }[];
  displayGroupLabel?: string;
  displayGroupOrder?: number;
};

export type ActiveSpellChoiceRule = {
  id: string;
  label: string;
  max: number;
  spellIds: string[];
  displayGroupLabel: string;
  displayGroupOrder: number;
};

const eldritchKnightCantripIds = [
  "acid-splash",
  "blade-ward",
  "bone-chill",
  "booming-blade",
  "bursting-sinew",
  "dancing-lights",
  "fire-bolt",
  "friends",
  "light",
  "mage-hand",
  "minor-illusion",
  "poison-spray",
  "ray-of-frost",
  "shocking-grasp",
  "toll-the-dead",
  "true-strike",
];

export const spellChoiceRuleDefinitions: SpellChoiceRuleDefinition[] = [
  {
  id: "paladin-prepared-spells",
  label: "Paladin Prepared Spells",
  className: "Paladin",
  minLevel: 2,
  ranks: [1, 2, 3],
  maxByLevel: [
    { minLevel: 2, max: 2 },
  ],
  displayGroupLabel: "Paladin Prepared Spell Choices",
  displayGroupOrder: 20,
},
  {

    id: "fighter-arcane-archer-cantrip",
    label: "Arcane Archer Cantrip",
    className: "Fighter",
    subclass: "Arcane Archer",
    minLevel: 3,
    spellIds: ["guidance", "light", "true-strike"],
    maxByLevel: [
      {
        minLevel: 3,
        max: 1,
      },
    ],
    displayGroupLabel: "Arcane Archer Cantrip Choice",
    displayGroupOrder: 10,
  },

  {
    id: "fighter-eldritch-knight-cantrips",
    label: "Eldritch Knight Cantrips",
    className: "Fighter",
    subclass: "Eldritch Knight",
    minLevel: 3,
    spellIds: eldritchKnightCantripIds,
    maxByLevel: [
      {
        minLevel: 3,
        max: 2,
      },
      {
        minLevel: 10,
        max: 3,
      },
    ],
    displayGroupLabel: "Eldritch Knight Cantrip Choices",
    displayGroupOrder: 10,
  },
{
  id: "ranger-known-spells",
  label: "Ranger Known Spells",
  className: "Ranger",
  minLevel: 2,
  ranks: [1, 2, 3],
  maxByLevel: [
    { minLevel: 2, max: 2 },
    { minLevel: 3, max: 3 },
    { minLevel: 5, max: 4 },
    { minLevel: 7, max: 5 },
    { minLevel: 9, max: 6 },
    { minLevel: 11, max: 7 },
  ],
  displayGroupLabel: "Ranger Spell Choices",
  displayGroupOrder: 20,
},
  {
    id: "fighter-eldritch-knight-spells",
    label: "Eldritch Knight Spells",
    className: "Fighter",
    subclass: "Eldritch Knight",
    minLevel: 3,
    ranks: [1, 2],
    maxByLevel: [
      {
        minLevel: 3,
        max: 3,
      },
      {
        minLevel: 4,
        max: 4,
      },
      {
        minLevel: 7,
        max: 5,
      },
      {
        minLevel: 8,
        max: 6,
      },
      {
        minLevel: 10,
        max: 7,
      },
      {
        minLevel: 11,
        max: 8,
      },
    ],
    displayGroupLabel: "Eldritch Knight Spell Choices",
    displayGroupOrder: 20,
  },
];

function ruleAppliesToBuild(
  rule: SpellChoiceRuleDefinition,
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): boolean {
  if (!selectedClass) return false;

  const classMatches = rule.className === selectedClass;
  const subclassMatches = !rule.subclass || rule.subclass === selectedSubclass;
  const minLevelMatches = selectedLevel >= rule.minLevel;
  const maxLevelMatches =
    rule.maxLevel === undefined || selectedLevel <= rule.maxLevel;

  return classMatches && subclassMatches && minLevelMatches && maxLevelMatches;
}

function getMaxForLevel(
  rule: SpellChoiceRuleDefinition,
  selectedLevel: number,
  maxOverrides: Record<string, number> = {}
): number {
  const override = maxOverrides[rule.id];

  if (override !== undefined) {
    return override;
  }

  const matchingEntries = rule.maxByLevel
    .filter((entry) => selectedLevel >= entry.minLevel)
    .sort((a, b) => b.minLevel - a.minLevel);

  return matchingEntries[0]?.max ?? 0;
}

function getSpellIdsForRule(
  rule: SpellChoiceRuleDefinition,
  availableSpells: BG3Spell[]
): string[] {
  const availableSpellIds = new Set(availableSpells.map((spell) => spell.id));

  if (rule.spellIds) {
    return rule.spellIds.filter((spellId) => availableSpellIds.has(spellId));
  }

  if (rule.ranks) {
    return availableSpells
      .filter((spell) => rule.ranks?.includes(spell.rank))
      .map((spell) => spell.id);
  }

  return [];
}

export function getActiveSpellChoiceRulesForBuild(
  availableSpells: BG3Spell[],
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number,
  maxOverrides: Record<string, number> = {}
): ActiveSpellChoiceRule[] {
  return spellChoiceRuleDefinitions
    .filter((rule) =>
      ruleAppliesToBuild(rule, selectedClass, selectedSubclass, selectedLevel)
    )
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
      max: getMaxForLevel(rule, selectedLevel, maxOverrides),
      spellIds: getSpellIdsForRule(rule, availableSpells),
      displayGroupLabel: rule.displayGroupLabel ?? rule.label,
      displayGroupOrder: rule.displayGroupOrder ?? 999,
    }))
    .filter((rule) => rule.max > 0 && rule.spellIds.length > 0);
}

export function getSpellChoiceRuleForSpell(
  spellId: string,
  activeRules: ActiveSpellChoiceRule[]
): ActiveSpellChoiceRule | undefined {
  return activeRules.find((rule) => rule.spellIds.includes(spellId));
}

export function getSelectedSpellIdsForRule(
  selectedSpellIds: string[],
  rule: ActiveSpellChoiceRule
): string[] {
  return selectedSpellIds.filter((spellId) => rule.spellIds.includes(spellId));
}

export function isSpellChoiceGroupFull(
  spellId: string,
  selectedSpellIds: string[],
  activeRules: ActiveSpellChoiceRule[]
): boolean {
  const rule = getSpellChoiceRuleForSpell(spellId, activeRules);

  if (!rule) return false;
  if (selectedSpellIds.includes(spellId)) return false;

  return getSelectedSpellIdsForRule(selectedSpellIds, rule).length >= rule.max;
}