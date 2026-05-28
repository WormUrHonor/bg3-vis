import { bg3Spells, type BG3Spell } from "../data/bg3Spells";
import type { ActiveSpellChoiceRule } from "../data/spellChoiceRules";
import {
  ritualCasterSpells,
  spellSniperCantrips,
} from "../data/bg3Feats";
import type { FeatName, FeatSelection } from "../types/buildPlannerTypes";

type MagicInitiateFeatName =
  | "Magic Initiate: Bard"
  | "Magic Initiate: Cleric"
  | "Magic Initiate: Druid"
  | "Magic Initiate: Sorcerer"
  | "Magic Initiate: Warlock"
  | "Magic Initiate: Wizard";

type FeatSpellChoiceData = {
  spells: BG3Spell[];
  rules: ActiveSpellChoiceRule[];
  featSpellIds: string[];
};

const magicInitiateSpellNames: Record<
  MagicInitiateFeatName,
  {
    cantrips: string[];
    spells: string[];
  }
> = {
  "Magic Initiate: Bard": {
    cantrips: [
      "Friends",
      "Light",
      "Mage Hand",
      "Minor Illusion",
      "True Strike",
      "Vicious Mockery",
    ],
    spells: [
      "Animal Friendship",
      "Bane",
      "Charm Person",
      "Disguise Self",
      "Dissonant Whispers",
      "Faerie Fire",
      "Feather Fall",
      "Healing Word",
      "Heroism",
      "Longstrider",
      "Sleep",
      "Speak with Animals",
      "Tasha's Hideous Laughter",
      "Thunderwave",
    ],
  },

  "Magic Initiate: Cleric": {
    cantrips: ["Guidance", "Light", "Resistance", "Sacred Flame", "Thaumaturgy"],
    spells: [
      "Bane",
      "Bless",
      "Command",
      "Create or Destroy Water",
      "Cure Wounds",
      "Guiding Bolt",
      "Healing Word",
      "Inflict Wounds",
      "Protection from Evil and Good",
      "Sanctuary",
      "Shield of Faith",
    ],
  },

  "Magic Initiate: Druid": {
    cantrips: [
      "Guidance",
      "Poison Spray",
      "Produce Flame",
      "Resistance",
      "Shillelagh",
      "Thorn Whip",
    ],
    spells: [
      "Animal Friendship",
      "Create or Destroy Water",
      "Cure Wounds",
      "Enhance Leap",
      "Entangle",
      "Faerie Fire",
      "Fog Cloud",
      "Goodberry",
      "Healing Word",
      "Longstrider",
      "Speak with Animals",
      "Thunderwave",
    ],
  },

  "Magic Initiate: Sorcerer": {
    cantrips: [
      "Acid Splash",
      "Bone Chill",
      "Dancing Lights",
      "Fire Bolt",
      "Friends",
      "Light",
      "Mage Hand",
      "Minor Illusion",
      "Poison Spray",
      "Ray of Frost",
      "Shocking Grasp",
      "True Strike",
    ],
    spells: [
      "Burning Hands",
      "Charm Person",
      "Chromatic Orb",
      "Colour Spray",
      "Disguise Self",
      "Enhance Leap",
      "Expeditious Retreat",
      "False Life",
      "Feather Fall",
      "Fog Cloud",
      "Mage Armour",
      "Magic Missile",
      "Shield",
      "Sleep",
      "Thunderwave",
    ],
  },

  "Magic Initiate: Warlock": {
    cantrips: [
      "Blade Ward",
      "Bone Chill",
      "Eldritch Blast",
      "Friends",
      "Mage Hand",
      "Minor Illusion",
      "Poison Spray",
      "True Strike",
    ],
    spells: [
      "Armour of Agathys",
      "Arms of Hadar",
      "Charm Person",
      "Expeditious Retreat",
      "Hellish Rebuke",
      "Hex",
      "Protection from Evil and Good",
    ],
  },

  "Magic Initiate: Wizard": {
    cantrips: [
      "Acid Splash",
      "Bone Chill",
      "Dancing Lights",
      "Fire Bolt",
      "Friends",
      "Light",
      "Mage Hand",
      "Minor Illusion",
      "Poison Spray",
      "Ray of Frost",
      "Shocking Grasp",
      "True Strike",
    ],
    spells: [
      "Burning Hands",
      "Charm Person",
      "Chromatic Orb",
      "Colour Spray",
      "Disguise Self",
      "Enhance Leap",
      "Expeditious Retreat",
      "False Life",
      "Feather Fall",
      "Find Familiar",
      "Fog Cloud",
      "Grease",
      "Longstrider",
      "Mage Armour",
      "Magic Missile",
      "Shield",
      "Sleep",
      "Thunderwave",
    ],
  },
};

function normalizeSpellName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("’", "'")
    .replaceAll(":", "")
    .replaceAll("  ", " ");
}

function getSpellByName(name: string): BG3Spell | undefined {
  const normalizedName = normalizeSpellName(name);

  return bg3Spells.find(
    (spell) => normalizeSpellName(spell.name) === normalizedName
  );
}

function getSpellIdsByName(names: string[]) {
  return names
    .map((name) => getSpellByName(name)?.id)
    .filter((id): id is string => Boolean(id));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function isMagicInitiateFeat(
  featName: FeatName | ""
): featName is MagicInitiateFeatName {
  return featName.startsWith("Magic Initiate:");
}

function createFeatSpellChoiceRule(args: {
  id: string;
  label: string;
  order: number;
  max: number;
  spellIds: string[];
}): ActiveSpellChoiceRule {
  return {
    id: args.id,
    displayGroupLabel: args.label,
    displayGroupOrder: args.order,
    max: args.max,
    spellIds: args.spellIds,
  } as ActiveSpellChoiceRule;
}

function getFeatRuleOrder(selection: FeatSelection, offset: number) {
  return 700 + selection.slotLevel + offset;
}

export function isFeatSpellChoiceRule(rule: ActiveSpellChoiceRule) {
  return rule.id.startsWith("feat-");
}

export function getFeatSpellChoiceData(
  featSelections: FeatSelection[]
): FeatSpellChoiceData {
  const rules: ActiveSpellChoiceRule[] = [];

  for (const selection of featSelections) {
    if (!selection.featName) continue;

    if (selection.featName === "Ritual Caster") {
      const spellIds = getSpellIdsByName(ritualCasterSpells);

      if (spellIds.length > 0) {
        rules.push(
          createFeatSpellChoiceRule({
            id: `feat-${selection.slotLevel}-ritual-caster-spells`,
            label: `Ritual Caster ${selection.slotLevel}`,
            order: getFeatRuleOrder(selection, 1),
            max: 2,
            spellIds,
          })
        );
      }
    }

    if (selection.featName === "Spell Sniper") {
      const spellIds = getSpellIdsByName(spellSniperCantrips);

      if (spellIds.length > 0) {
        rules.push(
          createFeatSpellChoiceRule({
            id: `feat-${selection.slotLevel}-spell-sniper-cantrip`,
            label: `Spell Sniper ${selection.slotLevel}`,
            order: getFeatRuleOrder(selection, 1),
            max: 1,
            spellIds,
          })
        );
      }
    }

    if (isMagicInitiateFeat(selection.featName)) {
      const magicInitiateData = magicInitiateSpellNames[selection.featName];

      const cantripIds = getSpellIdsByName(magicInitiateData.cantrips);
      const spellIds = getSpellIdsByName(magicInitiateData.spells);

      if (cantripIds.length > 0) {
        rules.push(
          createFeatSpellChoiceRule({
            id: `feat-${selection.slotLevel}-${selection.featName
              .toLowerCase()
              .replaceAll(" ", "-")
              .replaceAll(":", "")}-cantrips`,
            label: `${selection.featName} Cantrips`,
            order: getFeatRuleOrder(selection, 1),
            max: 2,
            spellIds: cantripIds,
          })
        );
      }

      if (spellIds.length > 0) {
        rules.push(
          createFeatSpellChoiceRule({
            id: `feat-${selection.slotLevel}-${selection.featName
              .toLowerCase()
              .replaceAll(" ", "-")
              .replaceAll(":", "")}-spell`,
            label: `${selection.featName} Spell`,
            order: getFeatRuleOrder(selection, 2),
            max: 1,
            spellIds,
          })
        );
      }
    }
  }

  const featSpellIds = unique(rules.flatMap((rule) => rule.spellIds));

  const spells = featSpellIds
    .map((spellId) => bg3Spells.find((spell) => spell.id === spellId))
    .filter((spell): spell is BG3Spell => Boolean(spell));

  return {
    spells,
    rules,
    featSpellIds,
  };
}

export function getFeatAvailableSpellIds(featSelections: FeatSelection[]) {
  return getFeatSpellChoiceData(featSelections).featSpellIds;
}