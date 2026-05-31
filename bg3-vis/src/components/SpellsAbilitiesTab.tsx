import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  bg3Spells,
  formatDamageProfile,
  getDamageProfileAverage,
  getDamageProfileMax,
  getDamageProfileMin,
  type AbilityRole,
  type BG3Spell,
} from "../data/bg3Spells";
import type { BG3ClassFeature } from "../data/bg3ClassFeatures";
import { getAvailableSpellsForBuild } from "../data/bg3SpellAvailability";
import { toggleSpellSelection } from "../logic/spellSelectionLogic";
import {
  toggleActiveClassFeatureSelection,
  toggleClassFeatureSelection,
} from "../logic/classFeatureSelectionLogic";
import type {
  ClassName,
  FeatSelection,
  WarlockInvocation,
} from "../types/buildPlannerTypes";
import { getSpellIcon } from "../logic/spellIconLogic";
import { getClassFeatureIcon } from "../logic/classFeatureIconLogic";
import concentrationIcon from "../assets/UI Icons/20px-Concentration_Icon.png.webp";
import ritualIcon from "../assets/UI Icons/Ritual_Spell_Icon.png";
import {
  getActiveSpellChoiceRulesForBuild,
  getSelectedSpellIdsForRule,
  getSpellChoiceRuleForSpell,
  isSpellChoiceGroupFull,
  type ActiveSpellChoiceRule,
} from "../data/spellChoiceRules";
import {
  BARD_MAGICAL_SECRET_TAG,
  getAvailableBardMagicalSecretSpells,
  mergeSpellLists,
} from "../data/bardMagicalSecrets";
import { getAvailableRogueArcaneTricksterSpells } from "../data/rogueArcaneTricksterSpells";
import {
  getFeatSpellChoiceData,
  isFeatSpellChoiceRule,
} from "../logic/featSpellChoiceLogic";
import {
  logFrictionEvent,
  logLinkedHighlightExposed,
  logStudyEvent,
} from "../logic/studyLogger";
import {
  getFocusItems,
  type DataCircleFocus,
  type DataCircleFocusItem,
} from "./DataCircle/dataCircleInteraction";
import {
  DAMAGE_ROLE_KEYS,
  DAMAGE_TYPES,
  ROLE_VISUALS,
  UTILITY_ROLE_KEYS,
} from "./DataCircle/dataCircleConfig";

type SpellsAbilitiesTabProps = {
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedWarlockInvocations: WarlockInvocation[];
  selectedSpellIds: string[];
  setSelectedSpellIds: Dispatch<SetStateAction<string[]>>;
  availableClassFeatures: BG3ClassFeature[];
  selectedClassFeatureIds: string[];
  fixedClassFeatureIds: string[];
  setSelectedClassFeatureIds: Dispatch<SetStateAction<string[]>>;
  activeClassFeatureIds: string[];
  setActiveClassFeatureIds: Dispatch<SetStateAction<string[]>>;
  spellChoiceMaxOverrides?: Record<string, number>;
  featSelections: FeatSelection[];
  dataCircleFocus?: DataCircleFocus;

  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

type FeatureDisplayGroup = {
  id: string;
  label: string;
  order: number;
  features: BG3ClassFeature[];
};

type FloatingTooltipState = {
  id: string;
  x: number;
  y: number;
  placement: "top" | "bottom";
  content: ReactNode;
};

type HighlightableAbility = {
  id: string;
  roles: AbilityRole[];
  damageTypes: string[];
  range?: {
    category?: string;
  };
};

type DataCircleHighlightVisual = {
  fillColor: string;
  glowColor: string;
  strokeColor: string;
};

const TOOLTIP_WIDTH = 300;
const TOOLTIP_MARGIN = 14;
const TOOLTIP_VERTICAL_GAP = 12;

const SUBCATEGORY_SHADE_COLORS: Partial<Record<AbilityRole, string>> = {
  "single-target-damage": "rgba(255, 108, 93, 1)",
  "area-damage": "rgba(255, 143, 74, 1)",

  control: "rgba(91, 154, 255, 1)",
  "support-buff": "rgba(86, 199, 255, 1)",
  "defense-protection": "rgba(113, 181, 235, 1)",
  healing: "rgba(96, 222, 218, 1)",
  "mobility-positioning": "rgba(126, 166, 255, 1)",
  "narrative-interaction": "rgba(151, 188, 255, 1)",
  "investigation-world-interaction": "rgba(107, 214, 255, 1)",
  summon: "rgba(135, 143, 255, 1)",
};

const RANGE_HIGHLIGHT_VISUALS: Record<string, DataCircleHighlightVisual> = {
  self: {
    fillColor: "#caa46a",
    glowColor: "#e6c47d",
    strokeColor: "rgba(255, 239, 185, 0.82)",
  },
  melee: {
    fillColor: "#d7b06a",
    glowColor: "#f0cf86",
    strokeColor: "rgba(255, 239, 185, 0.82)",
  },
  mid: {
    fillColor: "#9fc27f",
    glowColor: "#c7e59d",
    strokeColor: "rgba(238, 255, 204, 0.82)",
  },
  long: {
    fillColor: "#72a7e8",
    glowColor: "#9fc7ff",
    strokeColor: "rgba(215, 234, 255, 0.86)",
  },
};

function toRoman(value: number): string {
  if (value === 0) return "C";

  const romanByNumber: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
  };

  return romanByNumber[value] ?? String(value);
}

function getWarlockInvocationMax(selectedLevel: number): number {
  if (selectedLevel < 2) return 0;
  if (selectedLevel < 5) return 2;
  if (selectedLevel < 7) return 3;
  if (selectedLevel < 9) return 4;
  if (selectedLevel < 12) return 5;
  return 6;
}

function getSorcererMetamagicMax(selectedLevel: number): number {
  if (selectedLevel < 2) return 0;
  if (selectedLevel < 3) return 2;
  if (selectedLevel < 10) return 3;
  return 4;
}

function getEffectiveClassFeatureChoiceMax(
  choiceGroupId: string,
  defaultMax: number,
  selectedLevel: number
): number {
  if (choiceGroupId === "warlock-eldritch-invocations") {
    return getWarlockInvocationMax(selectedLevel);
  }

  if (choiceGroupId === "sorcerer-metamagic") {
    return getSorcererMetamagicMax(selectedLevel);
  }

  return defaultMax;
}

function getClassAbilityTabTitle(
  selectedClass: ClassName | "",
  selectedSubclass: string
): string {
  if (!selectedClass) return "Spells & Abilities";

  if (selectedClass === "Fighter" && selectedSubclass === "Battle Master") {
    return "Manoeuvres & Fighter Features";
  }

  if (selectedClass === "Fighter") return "Fighter Features";
  if (selectedClass === "Barbarian") return "Rage Actions & Barbarian Features";
  if (selectedClass === "Warlock") return "Spells, Invocations & Features";
  if (selectedClass === "Monk") return "Ki Actions & Monk Features";
  if (selectedClass === "Rogue") return "Rogue Actions & Features";
  if (selectedClass === "Bard") return "Spells, Inspirations & Bard Features";

  if (selectedClass === "Cleric") {
    return "Spells, Channel Divinity & Cleric Features";
  }

  if (selectedClass === "Druid") return "Spells, Wild Shape & Druid Features";
  if (selectedClass === "Paladin") return "Spells, Smites & Paladin Features";
  if (selectedClass === "Ranger") return "Spells & Ranger Features";

  if (selectedClass === "Sorcerer") {
    return "Spells, Metamagic & Sorcerer Features";
  }

  if (selectedClass === "Wizard") return "Spells & Wizard";

  return `${selectedClass} Spells & Features`;
}

function formatCost(actions: string[], resources: string[]): string {
  const items = [...actions, ...resources].filter((item) => item !== "none");

  if (items.length === 0) return "none";

  return items.join(", ");
}

function hasSpellTag(spell: { tags?: string[] }, tagName: string): boolean {
  return (
    spell.tags?.some((tag) => tag.toLowerCase() === tagName.toLowerCase()) ??
    false
  );
}

function getKindBadge(feature: BG3ClassFeature): string {
  if (feature.isInformational) return "i";
  if (feature.activeGroupId) return "T";
  if (feature.kind === "passive") return "P";
  if (feature.kind === "reaction") return "R";
  if (feature.kind === "manoeuvre") return "M";
  if (feature.kind === "bonus-action") return "B";
  return "A";
}

function getChoiceRequirementClass(selectedCount: number, max: number): string {
  if (max <= 0) return "spell-choice-mini-pill";
  if (selectedCount >= max) return "spell-choice-mini-pill complete";
  if (selectedCount > 0) return "spell-choice-mini-pill partial";
  return "spell-choice-mini-pill";
}

function getFallbackDisplayGroup(feature: BG3ClassFeature): {
  id: string;
  label: string;
  order: number;
} {
  if (feature.isInformational) {
    return {
      id: "informational-effects",
      label: "Possible Effects",
      order: 850,
    };
  }

  if (feature.isFixed) {
    return {
      id: "granted-features",
      label: "Granted Features",
      order: 900,
    };
  }

  return {
    id: feature.choiceGroupId ?? "class-choices",
    label: feature.choiceGroupLabel ?? "Class Choices",
    order: 950,
  };
}

function groupClassFeatures(features: BG3ClassFeature[]): FeatureDisplayGroup[] {
  const groups = new Map<string, FeatureDisplayGroup>();

  for (const feature of features) {
    const fallback = getFallbackDisplayGroup(feature);

    const id = feature.displayGroupId ?? fallback.id;
    const label = feature.displayGroupLabel ?? fallback.label;
    const order = feature.displayGroupOrder ?? fallback.order;

    const existingGroup = groups.get(id);

    if (existingGroup) {
      existingGroup.features.push(feature);
    } else {
      groups.set(id, {
        id,
        label,
        order,
        features: [feature],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label);
  });
}

function getChoiceGroupsInDisplayGroup(features: BG3ClassFeature[]) {
  return Array.from(
    new Map(
      features
        .filter((feature) => feature.choiceGroupId)
        .map((feature) => [
          feature.choiceGroupId,
          {
            id: feature.choiceGroupId as string,
            label: feature.choiceGroupLabel ?? "Choices",
            max: feature.choiceGroupMax ?? 1,
            features: features.filter(
              (item) => item.choiceGroupId === feature.choiceGroupId
            ),
          },
        ])
    ).values()
  );
}

function getActiveGroupsInDisplayGroup(features: BG3ClassFeature[]) {
  return Array.from(
    new Map(
      features
        .filter((feature) => feature.activeGroupId)
        .map((feature) => [
          feature.activeGroupId,
          {
            id: feature.activeGroupId as string,
            label: feature.activeGroupLabel ?? "Active Toggle",
            max: feature.activeGroupMax ?? 1,
            features: features.filter(
              (item) => item.activeGroupId === feature.activeGroupId
            ),
          },
        ])
    ).values()
  );
}

function getSpellLevelSortValue(spell: BG3Spell): string {
  return `${spell.rank.toString().padStart(2, "0")}-${spell.name}`;
}

function getSpellsForChoiceRule(
  availableSpells: BG3Spell[],
  rule: ActiveSpellChoiceRule
): BG3Spell[] {
  return availableSpells
    .filter((spell) => rule.spellIds.includes(spell.id))
    .sort((a, b) =>
      getSpellLevelSortValue(a).localeCompare(getSpellLevelSortValue(b))
    );
}

function isMagicalSecretsRule(rule: ActiveSpellChoiceRule): boolean {
  return rule.id.includes("magical-secrets");
}

function getChoiceRulesForRank(
  rank: number,
  rules: ActiveSpellChoiceRule[],
  availableSpells: BG3Spell[]
): ActiveSpellChoiceRule[] {
  return rules.filter((rule) =>
    availableSpells.some(
      (spell) => spell.rank === rank && rule.spellIds.includes(spell.id)
    )
  );
}

function renderChoiceCountPill(
  rule: ActiveSpellChoiceRule,
  selectedSpellIds: string[]
) {
  const selectedInRule = getSelectedSpellIdsForRule(selectedSpellIds, rule);

  return (
    <span
      key={rule.id}
      className={getChoiceRequirementClass(selectedInRule.length, rule.max)}
      title={`${rule.displayGroupLabel}: ${selectedInRule.length}/${rule.max}`}
    >
      {selectedInRule.length}/{rule.max}
    </span>
  );
}

function getFloatingTooltipPosition(rect: DOMRect): {
  x: number;
  y: number;
  placement: "top" | "bottom";
} {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const clampedX = Math.min(
    Math.max(rect.left + rect.width / 2, TOOLTIP_MARGIN + TOOLTIP_WIDTH / 2),
    viewportWidth - TOOLTIP_MARGIN - TOOLTIP_WIDTH / 2
  );

  const hasEnoughSpaceAbove = rect.top > 230;
  const y = hasEnoughSpaceAbove
    ? Math.max(TOOLTIP_MARGIN, rect.top - TOOLTIP_VERTICAL_GAP)
    : Math.min(
        viewportHeight - TOOLTIP_MARGIN,
        rect.bottom + TOOLTIP_VERTICAL_GAP
      );

  return {
    x: clampedX,
    y,
    placement: hasEnoughSpaceAbove ? "top" : "bottom",
  };
}

function FloatingSpellTooltip({
  tooltip,
}: {
  tooltip: FloatingTooltipState | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !tooltip) return null;

  return createPortal(
    <div
      className={[
        "spell-floating-tooltip",
        tooltip.placement === "bottom"
          ? "spell-floating-tooltip--bottom"
          : "spell-floating-tooltip--top",
      ].join(" ")}
      style={{
        left: tooltip.x,
        top: tooltip.y,
        width: TOOLTIP_WIDTH,
      }}
      role="tooltip"
      data-study-region="spell-floating-tooltip"
      data-study-id={`floating-tooltip-${tooltip.id}`}
    >
      {tooltip.content}
    </div>,
    document.body
  );
}

function normalizeDamageType(value: string): string {
  if (value === "Weapon" || value === "Physical") return "Weapon";
  return value;
}

function getAbilityRangeBand(ability: HighlightableAbility): string | null {
  const category = ability.range?.category;

  if (!category) return null;

  if (category === "self") return "self";
  if (category === "melee" || category === "weapon-range") return "melee";
  if (category === "mid") return "mid";
  if (category === "long") return "long";

  return null;
}

function abilityMatchesRoleFocus(
  ability: HighlightableAbility,
  focusItems: DataCircleFocusItem[]
): boolean {
  const roleItems = focusItems.filter((item) => item.type === "role");
  const roleGroupItems = focusItems.filter((item) => item.type === "roleGroup");

  if (roleItems.length === 0 && roleGroupItems.length === 0) return true;

  const matchesRole = roleItems.some((item) =>
    ability.roles.includes(item.role)
  );

  const matchesRoleGroup = roleGroupItems.some((item) => {
    if (item.roleGroup === "damage") {
      return ability.roles.some((role) => DAMAGE_ROLE_KEYS.includes(role));
    }

    return ability.roles.some((role) => UTILITY_ROLE_KEYS.includes(role));
  });

  return matchesRole || matchesRoleGroup;
}

function abilityMatchesDamageFocus(
  ability: HighlightableAbility,
  focusItems: DataCircleFocusItem[]
): boolean {
  const damageTypeItems = focusItems.filter(
    (item) => item.type === "damageType"
  );

  if (damageTypeItems.length === 0) return true;

  const abilityDamageTypes = ability.damageTypes.map(normalizeDamageType);

  return damageTypeItems.some((item) =>
    abilityDamageTypes.includes(normalizeDamageType(item.damageType))
  );
}

function abilityMatchesRangeFocus(
  ability: HighlightableAbility,
  focusItems: DataCircleFocusItem[]
): boolean {
  const rangeItems = focusItems.filter((item) => item.type === "range");

  if (rangeItems.length === 0) return true;

  const abilityRangeBand = getAbilityRangeBand(ability);

  if (!abilityRangeBand) return false;

  return rangeItems.some((item) => item.range === abilityRangeBand);
}

function abilityMatchesAbilityFocus(
  ability: HighlightableAbility,
  focusItems: DataCircleFocusItem[]
): boolean {
  const abilityItems = focusItems.filter((item) => item.type === "ability");

  if (abilityItems.length === 0) return true;

  return abilityItems.some((item) => item.abilityId === ability.id);
}

function isAbilityHighlightedByDataCircleFocus(
  ability: HighlightableAbility,
  focus: DataCircleFocus | undefined
): boolean {
  const focusItems = getFocusItems(focus ?? null);

  if (focusItems.length === 0) return false;

  const hasRoundFocus = focusItems.some((item) => item.type === "round");

  if (hasRoundFocus) return false;

  return (
    abilityMatchesAbilityFocus(ability, focusItems) &&
    abilityMatchesRoleFocus(ability, focusItems) &&
    abilityMatchesDamageFocus(ability, focusItems) &&
    abilityMatchesRangeFocus(ability, focusItems)
  );
}

function getDamageTypeHighlightVisual(
  damageType: string
): DataCircleHighlightVisual | undefined {
  const normalizedDamageType =
    damageType === "Physical" ? "Weapon" : damageType;

  const damageTypeVisual = DAMAGE_TYPES.find(
    (type) => type.key === normalizedDamageType
  );

  if (!damageTypeVisual) return undefined;

  return {
    fillColor: damageTypeVisual.color,
    glowColor: damageTypeVisual.glowColor,
    strokeColor: damageTypeVisual.glowColor,
  };
}

function getRoleGroupHighlightVisual(
  roleGroup: "damage" | "utility"
): DataCircleHighlightVisual {
  const visual = ROLE_VISUALS[roleGroup];

  return {
    fillColor: visual.color,
    glowColor: visual.glowColor,
    strokeColor: visual.lineColor ?? visual.glowColor,
  };
}

function getRoleHighlightVisual(role: AbilityRole): DataCircleHighlightVisual {
  const isDamageRole = DAMAGE_ROLE_KEYS.includes(role);
  const roleGroupVisual = isDamageRole
    ? ROLE_VISUALS.damage
    : ROLE_VISUALS.utility;

  const subcategoryColor = SUBCATEGORY_SHADE_COLORS[role];

  if (subcategoryColor) {
    return {
      fillColor: subcategoryColor,
      glowColor: subcategoryColor,
      strokeColor: isDamageRole
        ? "rgba(255, 218, 190, 0.92)"
        : "rgba(214, 238, 255, 0.9)",
    };
  }

  return {
    fillColor: roleGroupVisual.color,
    glowColor: roleGroupVisual.glowColor,
    strokeColor: roleGroupVisual.lineColor ?? roleGroupVisual.glowColor,
  };
}

function getDataCircleHighlightVisual(
  focus: DataCircleFocus | undefined
): DataCircleHighlightVisual | undefined {
  const focusItems = getFocusItems(focus ?? null);

  if (focusItems.length === 0) return undefined;

  const damageTypeFocus = focusItems.find((item) => item.type === "damageType");
  if (damageTypeFocus?.type === "damageType") {
    return getDamageTypeHighlightVisual(damageTypeFocus.damageType);
  }

  const roleFocus = focusItems.find((item) => item.type === "role");
  if (roleFocus?.type === "role") {
    return getRoleHighlightVisual(roleFocus.role);
  }

  const roleGroupFocus = focusItems.find((item) => item.type === "roleGroup");
  if (roleGroupFocus?.type === "roleGroup") {
    return getRoleGroupHighlightVisual(roleGroupFocus.roleGroup);
  }

  const rangeFocus = focusItems.find((item) => item.type === "range");
  if (rangeFocus?.type === "range") {
    return RANGE_HIGHLIGHT_VISUALS[rangeFocus.range];
  }

  const abilityFocus = focusItems.find((item) => item.type === "ability");
  if (abilityFocus?.type === "ability") {
    return {
      fillColor: "rgba(215, 176, 106, 1)",
      glowColor: "rgba(240, 207, 134, 1)",
      strokeColor: "rgba(255, 239, 185, 0.86)",
    };
  }

  return undefined;
}

function getDataCircleHighlightStyle(
  isHighlighted: boolean,
  focus: DataCircleFocus | undefined
): CSSProperties | undefined {
  if (!isHighlighted) return undefined;

  const visual = getDataCircleHighlightVisual(focus);

  if (!visual) return undefined;

  return {
    "--data-circle-focus-fill": visual.fillColor,
    "--data-circle-focus-glow": visual.glowColor,
    "--data-circle-focus-stroke": visual.strokeColor,
  } as CSSProperties;
}

function getDataCircleFocusKeyForLogging(focus: DataCircleFocus | undefined) {
  const focusItems = getFocusItems(focus ?? null);

  if (focusItems.length === 0) return null;

  return focusItems
    .map((item) => {
      const record = item as unknown as Record<string, unknown>;
      const type = record.type;

      if (type === "role") return `role:${String(record.role ?? "")}`;
      if (type === "roleGroup") {
        return `roleGroup:${String(record.roleGroup ?? "")}`;
      }
      if (type === "damageType") {
        return `damageType:${String(record.damageType ?? "")}`;
      }
      if (type === "range") return `range:${String(record.range ?? "")}`;
      if (type === "ability") return `ability:${String(record.abilityId ?? "")}`;
      if (type === "round") return `round:${String(record.round ?? "")}`;

      return String(type ?? "unknown-focus");
    })
    .join("|");
}

function getDataCircleFocusSummaryForLogging(focus: DataCircleFocus | undefined) {
  const focusItems = getFocusItems(focus ?? null);

  return {
    focusKey: getDataCircleFocusKeyForLogging(focus),
    focusItemCount: focusItems.length,
    focusItems,
  };
}

function createSpellSummaryForLogging(
  spell: BG3Spell,
  args: {
    isSelected?: boolean;
    isFixed?: boolean;
    isDisabled?: boolean;
    isRitual?: boolean;
    groupFull?: boolean;
    choiceRule?: ActiveSpellChoiceRule;
    isDataCircleHighlighted?: boolean;
  } = {}
) {
  return {
    abilityType: "spell",
    id: spell.id,
    name: spell.name,
    rank: spell.rank,
    roles: spell.roles,
    damageTypes: spell.damageTypes,
    rangeCategory: spell.range?.category ?? null,
    rangeLabel: spell.range?.label ?? null,
    actionCosts: spell.costs.actions,
    resourceCosts: spell.costs.resources,
    requiresConcentration: spell.costs.requiresConcentration,
    tags: spell.tags ?? [],
    choiceRuleId: args.choiceRule?.id ?? null,
    choiceRuleLabel: args.choiceRule?.displayGroupLabel ?? null,
    choiceRuleMax: args.choiceRule?.max ?? null,
    isSelected: args.isSelected ?? false,
    isFixed: args.isFixed ?? false,
    isDisabled: args.isDisabled ?? false,
    isRitual: args.isRitual ?? false,
    groupFull: args.groupFull ?? false,
    isDataCircleHighlighted: args.isDataCircleHighlighted ?? false,
  };
}

function createFeatureSummaryForLogging(
  feature: BG3ClassFeature,
  args: {
    isSelected?: boolean;
    isFixed?: boolean;
    isActive?: boolean;
    isInformational?: boolean;
    isActiveToggle?: boolean;
    isDisabled?: boolean;
    groupFull?: boolean;
    activeGroupFull?: boolean;
    isDataCircleHighlighted?: boolean;
  } = {}
) {
  return {
    abilityType: "classFeature",
    id: feature.id,
    name: feature.name,
    kind: feature.kind,
    roles: feature.roles,
    damageTypes: feature.damageTypes,
    rangeCategory: feature.range?.category ?? null,
    rangeLabel: feature.range?.label ?? null,
    actionCosts: feature.costs.actions,
    resourceCosts: feature.costs.resources,
    requiresConcentration: feature.costs.requiresConcentration,
    choiceGroupId: feature.choiceGroupId ?? null,
    choiceGroupLabel: feature.choiceGroupLabel ?? null,
    choiceGroupMax: feature.choiceGroupMax ?? null,
    activeGroupId: feature.activeGroupId ?? null,
    activeGroupLabel: feature.activeGroupLabel ?? null,
    activeGroupMax: feature.activeGroupMax ?? null,
    isSelected: args.isSelected ?? false,
    isFixed: args.isFixed ?? false,
    isActive: args.isActive ?? false,
    isInformational: args.isInformational ?? false,
    isActiveToggle: args.isActiveToggle ?? false,
    isDisabled: args.isDisabled ?? false,
    groupFull: args.groupFull ?? false,
    activeGroupFull: args.activeGroupFull ?? false,
    isDataCircleHighlighted: args.isDataCircleHighlighted ?? false,
  };
}
function formatDamageKindLabel(kind: string): string {
  if (kind === "temporary-hit-points") return "Temporary HP";
  return kind.replaceAll("-", " ");
}

function formatSaveBehaviour(value: string): string {
  return value.replaceAll("-", " ");
}

function formatDamageAverage(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderSpellDamageTooltipSection(spell: BG3Spell) {
  const profile = spell.damage;

  if (!profile || !profile.hasDamage) return null;

  const damageText = formatDamageProfile(profile);
  const min = getDamageProfileMin(profile);
  const average = getDamageProfileAverage(profile);
  const max = getDamageProfileMax(profile);

  return (
    <span className="spell-damage-tooltip-section">
      <span className="spell-tooltip-subtitle">
        {formatDamageKindLabel(profile.damageKind)}
      </span>

      {damageText ? (
        <span>
          <b>Roll:</b> {damageText}
        </span>
      ) : null}

      {profile.rolls.length > 0 ? (
        <span>
          <b>Amount:</b> {formatDamageAverage(min)}–{formatDamageAverage(max)}{" "}
          <span className="spell-tooltip-muted">
            avg. {formatDamageAverage(average)}
          </span>
        </span>
      ) : null}

      <span>
        <b>Delivery:</b> {profile.delivery.replaceAll("-", " ")}
      </span>

      {profile.saveBehaviour !== "none" ? (
        <span>
          <b>Resolution:</b> {formatSaveBehaviour(profile.saveBehaviour)}
          {profile.saveAbility ? ` (${profile.saveAbility})` : ""}
        </span>
      ) : null}

      {profile.repeats ? (
        <span>
          <b>Repeats:</b>{" "}
          {profile.repeatDurationTurns
            ? `up to ${profile.repeatDurationTurns} turns`
            : "yes"}
        </span>
      ) : null}

      {profile.notes ? (
        <span className="spell-tooltip-muted">{profile.notes}</span>
      ) : null}
    </span>
  );
}

function SpellsAbilitiesTab({
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedWarlockInvocations,
  selectedSpellIds,
  setSelectedSpellIds,
  availableClassFeatures,
  selectedClassFeatureIds,
  fixedClassFeatureIds,
  setSelectedClassFeatureIds,
  activeClassFeatureIds,
  setActiveClassFeatureIds,
  spellChoiceMaxOverrides = {},
  featSelections,
  dataCircleFocus = null,
  activeView = "spells-abilities-tab",
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: SpellsAbilitiesTabProps) {
  const spellRanks = [0, 1, 2, 3, 4, 5, 6] as const;
  const [floatingTooltip, setFloatingTooltip] =
    useState<FloatingTooltipState | null>(null);

  const tooltipOpenedAtRef = useRef<number | null>(null);
  const tooltipIdRef = useRef<string | null>(null);
  const tooltipPayloadRef = useRef<Record<string, unknown> | null>(null);
  const lastLinkedHighlightKeyRef = useRef<string | null>(null);

  const baseAvailableSpells = getAvailableSpellsForBuild(
    bg3Spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  );

  const magicalSecretSpells = getAvailableBardMagicalSecretSpells(
    selectedClass,
    selectedSubclass,
    selectedLevel
  );

  const arcaneTricksterSpells = getAvailableRogueArcaneTricksterSpells(
    selectedClass,
    selectedSubclass,
    selectedLevel
  );

  const featSpellChoiceData = getFeatSpellChoiceData(featSelections);

  const availableSpells = mergeSpellLists(baseAvailableSpells, [
    ...magicalSecretSpells,
    ...arcaneTricksterSpells,
    ...featSpellChoiceData.spells,
  ]);

  const availableSpellIds = availableSpells.map((spell) => spell.id);

  const baseSpellChoiceRules = getActiveSpellChoiceRulesForBuild(
    availableSpells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    spellChoiceMaxOverrides
  );

  const activeSpellChoiceRules = [
    ...baseSpellChoiceRules,
    ...featSpellChoiceData.rules,
  ];

  const visibleSpellChoiceRules = activeSpellChoiceRules
    .filter((rule) => rule.spellIds.length > 0)
    .sort((a, b) => a.displayGroupOrder - b.displayGroupOrder);

  const featSpellChoiceRules = featSpellChoiceData.rules
    .filter((rule) => rule.spellIds.length > 0)
    .sort((a, b) => a.displayGroupOrder - b.displayGroupOrder);

  const magicalSecretsRules = activeSpellChoiceRules
    .filter(isMagicalSecretsRule)
    .sort((a, b) => a.displayGroupOrder - b.displayGroupOrder);

  const baseAvailableSpellIds = new Set([
    ...baseAvailableSpells.map((spell) => spell.id),
    ...magicalSecretSpells.map((spell) => spell.id),
    ...arcaneTricksterSpells.map((spell) => spell.id),
  ]);

  const nonMagicalAvailableSpells = availableSpells.filter((spell) => {
    if (hasSpellTag(spell, BARD_MAGICAL_SECRET_TAG)) return false;

    const isFeatOnlySpell =
      featSpellChoiceData.featSpellIds.includes(spell.id) &&
      !baseAvailableSpellIds.has(spell.id);

    return !isFeatOnlySpell;
  });

  const featureDisplayGroups = groupClassFeatures(availableClassFeatures);

  const selectedSpellCount = selectedSpellIds.length;
  const selectedFeatureCount = selectedClassFeatureIds.length;
  const fixedFeatureCount = fixedClassFeatureIds.length;
  const activeFeatureCount = activeClassFeatureIds.length;

  const focusSummaryForLogging = useMemo(
    () => getDataCircleFocusSummaryForLogging(dataCircleFocus),
    [dataCircleFocus]
  );

  const highlightedSpellsForLogging = useMemo(
    () =>
      availableSpells.filter((spell) =>
        isAbilityHighlightedByDataCircleFocus(spell, dataCircleFocus)
      ),
    [availableSpells, dataCircleFocus]
  );

  const highlightedFeaturesForLogging = useMemo(
    () =>
      availableClassFeatures.filter((feature) =>
        isAbilityHighlightedByDataCircleFocus(feature, dataCircleFocus)
      ),
    [availableClassFeatures, dataCircleFocus]
  );

  function getLoggingContext() {
    return {
      activeView,
      activeBuildId,
      activeBuildLabel:
        activeBuildLabel || selectedSubclass || selectedClass || null,
      activePartyMemberIndex,
      activePartyMemberLabel,
      activeFocusSource,
      partySnapshotHash,
    };
  }

  function createPanelStatePayload() {
    return {
      sourceComponent: "SpellsAbilitiesTab",
      selectedClass,
      selectedSubclass,
      selectedLevel,
      selectedSpellCount,
      selectedFeatureCount,
      fixedFeatureCount,
      activeFeatureCount,
      availableSpellCount: availableSpells.length,
      availableClassFeatureCount: availableClassFeatures.length,
      visibleSpellChoiceRuleCount: visibleSpellChoiceRules.length,
      featSpellChoiceRuleCount: featSpellChoiceRules.length,
      magicalSecretsRuleCount: magicalSecretsRules.length,
      featureDisplayGroupCount: featureDisplayGroups.length,
      dataCircleFocus: focusSummaryForLogging,
      highlightedSpellCount: highlightedSpellsForLogging.length,
      highlightedFeatureCount: highlightedFeaturesForLogging.length,
      highlightedAbilityCount:
        highlightedSpellsForLogging.length + highlightedFeaturesForLogging.length,
      highlightedSpellIds: highlightedSpellsForLogging.map((spell) => spell.id),
      highlightedFeatureIds: highlightedFeaturesForLogging.map(
        (feature) => feature.id
      ),
      partySnapshotHash,
    };
  }

  function logAbilityIntent(
    eventType: string,
    payload: Record<string, unknown>
  ) {
    logStudyEvent({
      eventCategory: "build_edit",
      eventType,
      taskPhase: "exploration",
      ...getLoggingContext(),
      activeVisualizationFocus: focusSummaryForLogging.focusKey,
      payload: {
        ...createPanelStatePayload(),
        ...payload,
      },
    });
  }

  function logBlockedAbilityAction(
    targetType: string,
    targetId: string,
    reason: string,
    payload: Record<string, unknown>
  ) {
    logFrictionEvent(
      "invalid_selection_attempted",
      {
        ...createPanelStatePayload(),
        targetType,
        targetId,
        reason,
        ...payload,
      },
      getLoggingContext()
    );
  }

  useEffect(() => {
    const focusKey = focusSummaryForLogging.focusKey;

    if (!focusKey) {
      lastLinkedHighlightKeyRef.current = null;
      return;
    }

    const highlightedSpellIds = highlightedSpellsForLogging.map(
      (spell) => spell.id
    );

    const highlightedFeatureIds = highlightedFeaturesForLogging.map(
      (feature) => feature.id
    );

    const highlightKey = JSON.stringify({
      focusKey,
      highlightedSpellIds,
      highlightedFeatureIds,
      selectedSpellIds,
      selectedClassFeatureIds,
      activeClassFeatureIds,
    });

    if (lastLinkedHighlightKeyRef.current === highlightKey) return;
    lastLinkedHighlightKeyRef.current = highlightKey;

    const highlightedItemIds = [
      ...highlightedSpellIds,
      ...highlightedFeatureIds,
    ];

    if (highlightedItemIds.length === 0) return;

    logLinkedHighlightExposed(
      {
        focusKey,
        highlightedItemCount: highlightedItemIds.length,
        highlightedVisibleCount: highlightedItemIds.length,
        highlightedSelectedCount:
          highlightedSpellsForLogging.filter((spell) =>
            selectedSpellIds.includes(spell.id)
          ).length +
          highlightedFeaturesForLogging.filter(
            (feature) =>
              selectedClassFeatureIds.includes(feature.id) ||
              activeClassFeatureIds.includes(feature.id)
          ).length,
        highlightedItemIds,
        highlightedSpellIds,
        highlightedFeatureIds,
        selectedHighlightedSpellIds: highlightedSpellIds.filter((id) =>
          selectedSpellIds.includes(id)
        ),
        selectedHighlightedFeatureIds: highlightedFeatureIds.filter((id) =>
          selectedClassFeatureIds.includes(id)
        ),
        activeHighlightedFeatureIds: highlightedFeatureIds.filter((id) =>
          activeClassFeatureIds.includes(id)
        ),
        dataCircleFocus: focusSummaryForLogging,
      },
      getLoggingContext()
    );
  }, [
    focusSummaryForLogging,
    highlightedSpellsForLogging,
    highlightedFeaturesForLogging,
    selectedSpellIds,
    selectedClassFeatureIds,
    activeClassFeatureIds,
  ]);

  function showFloatingTooltip(
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    id: string,
    content: ReactNode,
    payload: Record<string, unknown>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = getFloatingTooltipPosition(rect);
    const nowMs = Date.now();

    tooltipOpenedAtRef.current = nowMs;
    tooltipIdRef.current = id;
    tooltipPayloadRef.current = payload;

    logStudyEvent({
      eventCategory: "visualization",
      eventType: "highlighted_item_tooltip_opened",
      taskPhase: "exploration",
      ...getLoggingContext(),
      activeVisualizationFocus: focusSummaryForLogging.focusKey,
      payload: {
        ...createPanelStatePayload(),
        tooltipId: id,
        openedAtMs: nowMs,
        openedBy: event.type,
        tooltipPlacement: position.placement,
        tooltipPosition: {
          x: position.x,
          y: position.y,
        },
        ...payload,
      },
    });

    setFloatingTooltip({
      id,
      content,
      ...position,
    });
  }

  function hideFloatingTooltip(id?: string) {
    const nowMs = Date.now();
    const openedAtMs = tooltipOpenedAtRef.current;
    const activeTooltipId = tooltipIdRef.current;
    const activePayload = tooltipPayloadRef.current;

    if (activeTooltipId && (!id || activeTooltipId === id)) {
      const tooltipDurationMs = openedAtMs ? nowMs - openedAtMs : null;

      logStudyEvent({
        eventCategory: "visualization",
        eventType: "highlighted_item_tooltip_closed",
        taskPhase: "exploration",
        ...getLoggingContext(),
        activeVisualizationFocus: focusSummaryForLogging.focusKey,
        payload: {
          ...createPanelStatePayload(),
          tooltipId: activeTooltipId,
          tooltipDurationMs,
          producedTooltipDwell:
            tooltipDurationMs !== null ? tooltipDurationMs >= 600 : false,
          ...(activePayload ?? {}),
        },
      });

      tooltipOpenedAtRef.current = null;
      tooltipIdRef.current = null;
      tooltipPayloadRef.current = null;
    }

    setFloatingTooltip((current) => {
      if (!current) return null;
      if (id && current.id !== id) return current;
      return null;
    });
  }

  function renderFeatureTooltipContent(
    feature: BG3ClassFeature,
    state: {
      isInformational: boolean;
      isFixed: boolean;
      isActiveToggle: boolean;
      isActive: boolean;
      activeGroupFull: boolean;
      isDataCircleHighlighted: boolean;
    }
  ) {
    return (
      <>
        <strong>{feature.name}</strong>

        {feature.description && (
          <span className="spell-description">{feature.description}</span>
        )}

        <span>
          <b>Type:</b> {feature.kind.replaceAll("-", " ")}
        </span>

        {feature.range && (
          <span>
            <b>Range:</b> {feature.range.label}
          </span>
        )}

        {feature.roles.length > 0 && (
          <span>
            <b>Role:</b>{" "}
            {feature.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
          </span>
        )}

        {feature.damageTypes.length > 0 && (
          <span>
            <b>Damage:</b> {feature.damageTypes.join(", ")}
          </span>
        )}

        <span>
          <b>Cost:</b>{" "}
          {formatCost(feature.costs.actions, feature.costs.resources)}
        </span>

        {feature.requiredFeatureIds && feature.requiredFeatureIds.length > 0 && (
          <span>Granted by selected feature</span>
        )}

        {state.isInformational && <span>Possible effect</span>}
        {state.isFixed && <span>Granted automatically</span>}
        {state.isActiveToggle && (
          <span>Can be set active for the visualisation</span>
        )}
        {state.isActive && <span>Currently active</span>}
        {state.activeGroupFull && !state.isActive && (
          <span>Click to replace the current active toggle</span>
        )}
        {state.isDataCircleHighlighted && (
          <span>Matches the current Data Circle focus</span>
        )}
      </>
    );
  }

function renderSpellTooltipContent(
  spell: BG3Spell,
  args: {
    choiceRule?: ActiveSpellChoiceRule;
    isRitual: boolean;
    groupFull: boolean;
    isSelected: boolean;
    isFixed: boolean;
    isDataCircleHighlighted?: boolean;
  }
) {
  return (
    <>
      <strong>{spell.name}</strong>

      {spell.description && (
        <span className="spell-description">{spell.description}</span>
      )}

      {renderSpellDamageTooltipSection(spell)}

      {args.choiceRule && (
        <span>
          <b>Choice:</b> {args.choiceRule.displayGroupLabel}{" "}
          {getSelectedSpellIdsForRule(selectedSpellIds, args.choiceRule).length}/
          {args.choiceRule.max}
        </span>
      )}

      <span>
        <b>Level:</b> {spell.rank === 0 ? "Cantrip" : toRoman(spell.rank)}
      </span>

      {spell.roles.length > 0 && (
        <span>
          <b>Role:</b>{" "}
          {spell.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
        </span>
      )}

      {spell.damageTypes.length > 0 && (
        <span>
          <b>Damage type:</b> {spell.damageTypes.join(", ")}
        </span>
      )}

      {(spell.costs.actions.length > 0 || spell.costs.resources.length > 0) && (
        <span>
          <b>Cost:</b> {formatCost(spell.costs.actions, spell.costs.resources)}
        </span>
      )}

      {spell.costs.requiresConcentration && <span>Requires concentration</span>}
      {args.isRitual && <span>Ritual spell</span>}
      {args.groupFull && !args.isSelected && <span>Choice limit reached</span>}
      {args.isFixed && <span>Granted automatically</span>}
      {args.isDataCircleHighlighted && (
        <span>Matches the current Data Circle focus</span>
      )}
    </>
  );
}

  function renderFeatureButton(
    feature: BG3ClassFeature,
    groupFull = false,
    activeGroupFull = false
  ) {
    const isInformational = feature.isInformational ?? false;
    const isActiveToggle = Boolean(feature.activeGroupId);
    const isFixed =
      !isInformational &&
      (fixedClassFeatureIds.includes(feature.id) || feature.isFixed);
    const isSelected = selectedClassFeatureIds.includes(feature.id);
    const isActive = activeClassFeatureIds.includes(feature.id);

    const isDataCircleHighlighted = isAbilityHighlightedByDataCircleFocus(
      feature,
      dataCircleFocus
    );

    const isDisabled =
      isInformational || groupFull || (isFixed && !isActiveToggle);

    const tooltipId = `feature-${feature.id}`;

    const tooltipContent = renderFeatureTooltipContent(feature, {
      isInformational,
      isFixed,
      isActiveToggle,
      isActive,
      activeGroupFull,
      isDataCircleHighlighted,
    });

    function createFeaturePayload() {
      return {
        tooltipTargetType: "class-feature",
        feature: createFeatureSummaryForLogging(feature, {
          isSelected,
          isFixed,
          isActive,
          isInformational,
          isActiveToggle,
          isDisabled,
          groupFull,
          activeGroupFull,
          isDataCircleHighlighted,
        }),
        isLinkedHighlightTooltip: isDataCircleHighlighted,
      };
    }

    function handleClick() {
      const featureSummary = createFeatureSummaryForLogging(feature, {
        isSelected,
        isFixed,
        isActive,
        isInformational,
        isActiveToggle,
        isDisabled,
        groupFull,
        activeGroupFull,
        isDataCircleHighlighted,
      });

      if (isDisabled) {
        const reason = isInformational
          ? "feature_is_informational"
          : isFixed && !isActiveToggle
            ? "feature_is_fixed"
            : groupFull
              ? "choice_group_full"
              : "feature_disabled";

        logBlockedAbilityAction("class-feature", feature.id, reason, {
          action: "class_feature_click_blocked",
          feature: featureSummary,
        });

        return;
      }

      logAbilityIntent("class_feature_toggle_attempted", {
        action: isActiveToggle
          ? isActive
            ? "deactivate_feature"
            : "activate_feature"
          : isSelected
            ? "remove_feature"
            : "select_feature",
        feature: featureSummary,
        isLinkedHighlightSelection: isDataCircleHighlighted,
        selectedClassFeatureCountBefore: selectedClassFeatureIds.length,
        activeClassFeatureCountBefore: activeClassFeatureIds.length,
      });

      if (isActiveToggle) {
        setActiveClassFeatureIds((current) =>
          toggleActiveClassFeatureSelection(
            feature.id,
            current,
            availableClassFeatures
          )
        );
        return;
      }

      setSelectedClassFeatureIds((current) =>
        toggleClassFeatureSelection(feature.id, current, availableClassFeatures)
      );
    }

    return (
      <button
        key={feature.id}
        className={[
          "spell-icon-button",
          isSelected ? "selected-spell" : "",
          isActive ? "active-ability" : "",
          isFixed ? "fixed-ability" : "",
          isInformational ? "informational-ability" : "",
          isDataCircleHighlighted ? "data-circle-linked-highlight" : "",
          groupFull || (activeGroupFull && !isActive)
            ? "choice-disabled-soft"
            : "",
        ].join(" ")}
        style={getDataCircleHighlightStyle(
          isDataCircleHighlighted,
          dataCircleFocus
        )}
        type="button"
        aria-disabled={isDisabled}
        onClick={handleClick}
        data-study-region="class-feature-button"
        data-study-id={`class-feature-${feature.id}`}
        data-study-element={
          isDataCircleHighlighted
            ? "linked-highlight-class-feature"
            : "class-feature"
        }
        onMouseEnter={(event) =>
          showFloatingTooltip(event, tooltipId, tooltipContent, createFeaturePayload())
        }
        onMouseLeave={() => hideFloatingTooltip(tooltipId)}
        onFocus={(event) =>
          showFloatingTooltip(event, tooltipId, tooltipContent, createFeaturePayload())
        }
        onBlur={() => hideFloatingTooltip(tooltipId)}
      >
        <img
          src={getClassFeatureIcon(feature)}
          alt={feature.name}
          className="spell-icon-image"
        />

        <span className="ability-kind-badge">{getKindBadge(feature)}</span>
      </button>
    );
  }

  function renderSpellButton(spell: BG3Spell, rule?: ActiveSpellChoiceRule) {
    const isSelected = selectedSpellIds.includes(spell.id);
    const isFixed = hasSpellTag(spell, "fixed");
    const isRitual = hasSpellTag(spell, "ritual");

    const selectedInRule = rule
      ? getSelectedSpellIdsForRule(selectedSpellIds, rule)
      : [];

    const groupFull = rule
      ? selectedInRule.length >= rule.max && !isSelected
      : isSpellChoiceGroupFull(
          spell.id,
          selectedSpellIds,
          activeSpellChoiceRules
        );

    const choiceRule =
      rule ?? getSpellChoiceRuleForSpell(spell.id, activeSpellChoiceRules);

    const isDisabled = isFixed || groupFull;
    const tooltipId = rule ? `spell-${rule.id}-${spell.id}` : `spell-${spell.id}`;

    const isDataCircleHighlighted = isAbilityHighlightedByDataCircleFocus(
      spell,
      dataCircleFocus
    );

    const tooltipContent = renderSpellTooltipContent(spell, {
      choiceRule,
      isRitual,
      groupFull,
      isSelected,
      isFixed,
      isDataCircleHighlighted,
    });

    function createSpellPayload() {
      return {
        tooltipTargetType: "spell",
        spell: createSpellSummaryForLogging(spell, {
          choiceRule,
          isSelected,
          isFixed,
          isDisabled,
          isRitual,
          groupFull,
          isDataCircleHighlighted,
        }),
        isLinkedHighlightTooltip: isDataCircleHighlighted,
      };
    }

    function handleClick() {
      const spellSummary = createSpellSummaryForLogging(spell, {
        choiceRule,
        isSelected,
        isFixed,
        isDisabled,
        isRitual,
        groupFull,
        isDataCircleHighlighted,
      });

      if (isDisabled) {
        const reason = isFixed
          ? "spell_is_fixed"
          : groupFull
            ? "spell_choice_group_full"
            : "spell_disabled";

        logBlockedAbilityAction("spell", spell.id, reason, {
          action: "spell_click_blocked",
          spell: spellSummary,
          selectedInRuleCount: selectedInRule.length,
          selectedInRuleIds: selectedInRule,
        });

        return;
      }

      logAbilityIntent("spell_toggle_attempted", {
        action: isSelected ? "remove_spell" : "select_spell",
        spell: spellSummary,
        selectedSpellCountBefore: selectedSpellIds.length,
        selectedInRuleCountBefore: selectedInRule.length,
        selectedInRuleIdsBefore: selectedInRule,
        isLinkedHighlightSelection: isDataCircleHighlighted,
      });

      setSelectedSpellIds((current) =>
        toggleSpellSelection(
          spell.id,
          current,
          availableSpellIds,
          activeSpellChoiceRules
        )
      );
    }

    return (
      <button
        key={rule ? `${rule.id}-${spell.id}` : spell.id}
        className={[
          "spell-icon-button",
          isSelected ? "selected-spell" : "",
          isFixed ? "fixed-ability" : "",
          isDataCircleHighlighted ? "data-circle-linked-highlight" : "",
          groupFull ? "choice-disabled-soft" : "",
        ].join(" ")}
        style={getDataCircleHighlightStyle(
          isDataCircleHighlighted,
          dataCircleFocus
        )}
        type="button"
        aria-disabled={isDisabled}
        onClick={handleClick}
        data-study-region="spell-button"
        data-study-id={`spell-${spell.id}`}
        data-study-element={
          isDataCircleHighlighted ? "linked-highlight-spell" : "spell"
        }
        onMouseEnter={(event) =>
          showFloatingTooltip(event, tooltipId, tooltipContent, createSpellPayload())
        }
        onMouseLeave={() => hideFloatingTooltip(tooltipId)}
        onFocus={(event) =>
          showFloatingTooltip(event, tooltipId, tooltipContent, createSpellPayload())
        }
        onBlur={() => hideFloatingTooltip(tooltipId)}
      >
        <img
          src={getSpellIcon(spell)}
          alt={spell.name}
          className="spell-icon-image"
        />

        <span className="spell-rank-badge">
          {spell.rank === 0 ? "C" : toRoman(spell.rank)}
        </span>

        {spell.costs.requiresConcentration && (
          <span
            className="spell-concentration-badge"
            title="Requires concentration"
          >
            <img src={concentrationIcon} alt="Concentration" />
          </span>
        )}

        {isRitual && (
          <span className="spell-ritual-badge" title="Ritual spell">
            <img src={ritualIcon} alt="Ritual" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="tab-content"
      data-study-region="spells-abilities-tab"
      data-study-id="spells-abilities-tab"
    >
      <FloatingSpellTooltip tooltip={floatingTooltip} />

      <div
        className="section-heading-row"
        data-study-region="spells-abilities-heading"
      >
        <div>
          <h2 data-study-id="spells-abilities-title">
            {getClassAbilityTabTitle(selectedClass, selectedSubclass)}
          </h2>
          <p
            className="panel-intro compact-intro"
            data-study-id="spells-abilities-intro"
          >
            Select available spells, cantrips, class actions, passives, and
            subclass-specific choices. Fixed features are shown as already
            granted, while toggles can be set active for the visualisation.
          </p>
        </div>

        {selectedClass && (
          <span
            className="section-count-pill"
            data-study-id="spells-abilities-selected-count"
          >
            {selectedSpellCount +
              selectedFeatureCount +
              fixedFeatureCount +
              activeFeatureCount}
          </span>
        )}
      </div>

      {!selectedClass && (
        <div
          className="placeholder-box"
          data-study-region="spells-abilities-empty-class-placeholder"
          data-study-id="spells-abilities-empty-class-placeholder"
        >
          Select a class first to see available spells and class features.
        </div>
      )}

      {selectedClass &&
        availableSpells.length === 0 &&
        availableClassFeatures.length === 0 && (
          <div
            className="placeholder-box"
            data-study-region="spells-abilities-empty-availability-placeholder"
            data-study-id="spells-abilities-empty-availability-placeholder"
          >
            No spells or class features are currently available for this class,
            subclass, and level combination.
          </div>
        )}

      {featureDisplayGroups.map((displayGroup) => {
        const choiceGroups = getChoiceGroupsInDisplayGroup(
          displayGroup.features
        );
        const activeGroups = getActiveGroupsInDisplayGroup(
          displayGroup.features
        );

        const groupedFeatureIds = new Set([
          ...choiceGroups.flatMap((group) =>
            group.features.map((feature) => feature.id)
          ),
          ...activeGroups.flatMap((group) =>
            group.features.map((feature) => feature.id)
          ),
        ]);

        const nonGroupedFeatures = displayGroup.features.filter(
          (feature) => !groupedFeatureIds.has(feature.id)
        );

        return (
          <div
            key={displayGroup.id}
            className="section-block feature-group-block"
            data-study-region="feature-display-group"
            data-study-id={`feature-display-group-${displayGroup.id}`}
          >
            <div
              className="ability-section-heading feature-display-heading"
              data-study-region="feature-display-heading"
            >
              <h3>{displayGroup.label}</h3>
            </div>

            {nonGroupedFeatures.length > 0 && (
              <div
                className="ability-icon-grid"
                data-study-region="feature-icon-grid"
                data-study-id={`feature-icon-grid-${displayGroup.id}`}
              >
                {nonGroupedFeatures.map((feature) =>
                  renderFeatureButton(feature)
                )}
              </div>
            )}

            {activeGroups.map((activeGroup) => {
              const activeInGroup = activeGroup.features.filter((feature) =>
                activeClassFeatureIds.includes(feature.id)
              ).length;

              return (
                <div
                  key={activeGroup.id}
                  className="choice-subgroup active-subgroup"
                  data-study-region="active-feature-choice-subgroup"
                  data-study-id={`active-feature-choice-subgroup-${activeGroup.id}`}
                >
                  <div className="choice-subgroup-header">
                    <strong>{activeGroup.label}</strong>
                    <span>
                      {activeInGroup}/{activeGroup.max}
                    </span>
                  </div>

                  <div
                    className="ability-icon-grid"
                    data-study-region="active-feature-icon-grid"
                    data-study-id={`active-feature-icon-grid-${activeGroup.id}`}
                  >
                    {activeGroup.features.map((feature) => {
                      const isActive = activeClassFeatureIds.includes(
                        feature.id
                      );
                      const activeGroupFull =
                        activeInGroup >= activeGroup.max && !isActive;

                      return renderFeatureButton(
                        feature,
                        false,
                        activeGroupFull
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {choiceGroups.map((choiceGroup) => {
              const selectedInChoiceGroup = choiceGroup.features.filter(
                (feature) => selectedClassFeatureIds.includes(feature.id)
              ).length;

              const effectiveChoiceGroupMax =
                getEffectiveClassFeatureChoiceMax(
                  choiceGroup.id,
                  choiceGroup.max,
                  selectedLevel
                );

              return (
                <div
                  key={choiceGroup.id}
                  className="choice-subgroup"
                  data-study-region="feature-choice-subgroup"
                  data-study-id={`feature-choice-subgroup-${choiceGroup.id}`}
                >
                  <div className="choice-subgroup-header">
                    <strong>{choiceGroup.label}</strong>
                    <span>
                      {selectedInChoiceGroup}/{effectiveChoiceGroupMax}
                    </span>
                  </div>

                  <div
                    className="ability-icon-grid"
                    data-study-region="feature-choice-icon-grid"
                    data-study-id={`feature-choice-icon-grid-${choiceGroup.id}`}
                  >
                    {choiceGroup.features.map((feature) => {
                      const isSelected = selectedClassFeatureIds.includes(
                        feature.id
                      );

                      const groupFull =
                        selectedInChoiceGroup >= effectiveChoiceGroupMax &&
                        !isSelected;

                      return renderFeatureButton(feature, groupFull);
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {availableSpells.length > 0 && (
        <div
          className="section-block"
          data-study-region="spell-book-section"
          data-study-id="spell-book-section"
        >
          <div
            className="ability-section-heading spell-section-heading-inline"
            data-study-region="spell-section-heading"
          >
            <div className="spell-section-title-row">
              <h3>Spells and cantrips</h3>
            </div>

            <span data-study-id="selected-spell-count">
              {selectedSpellIds.length}
            </span>
          </div>

          <div className="spell-book" data-study-region="spell-book">
            {featSpellChoiceRules.map((rule) => {
              const spellsForRule = getSpellsForChoiceRule(
                availableSpells,
                rule
              );

              if (spellsForRule.length === 0) return null;

              return (
                <section
                  key={rule.id}
                  className="spell-rank-section feat-spell-choice-section"
                  data-study-region="feat-spell-choice-section"
                  data-study-id={`feat-spell-choice-section-${rule.id}`}
                >
                  <div className="spell-rank-title-row spell-choice-section-header">
                    <h4>{rule.displayGroupLabel}</h4>

                    <div className="spell-rank-choice-counts">
                      {renderChoiceCountPill(rule, selectedSpellIds)}
                    </div>
                  </div>

                  <div
                    className="spell-icon-grid"
                    data-study-region="feat-spell-choice-grid"
                    data-study-id={`feat-spell-choice-grid-${rule.id}`}
                  >
                    {spellsForRule.map((spell) =>
                      renderSpellButton(spell, rule)
                    )}
                  </div>
                </section>
              );
            })}

            {magicalSecretsRules.map((rule) => {
              const spellsForRule = getSpellsForChoiceRule(
                availableSpells,
                rule
              );

              if (spellsForRule.length === 0) return null;

              return (
                <section
                  key={rule.id}
                  className="spell-rank-section"
                  data-study-region="magical-secrets-section"
                  data-study-id={`magical-secrets-section-${rule.id}`}
                >
                  <div className="spell-rank-title-row spell-choice-section-header">
                    <h4>{rule.displayGroupLabel}</h4>

                    <div className="spell-rank-choice-counts">
                      {renderChoiceCountPill(rule, selectedSpellIds)}
                    </div>
                  </div>

                  <div
                    className="spell-icon-grid"
                    data-study-region="magical-secrets-grid"
                    data-study-id={`magical-secrets-grid-${rule.id}`}
                  >
                    {spellsForRule.map((spell) =>
                      renderSpellButton(spell, rule)
                    )}
                  </div>
                </section>
              );
            })}

            {spellRanks.map((rank) => {
              const spellsForRank = nonMagicalAvailableSpells.filter(
                (spell) => spell.rank === rank
              );

              if (spellsForRank.length === 0) return null;

              const rankChoiceRules = getChoiceRulesForRank(
                rank,
                visibleSpellChoiceRules.filter(
                  (rule) =>
                    !isMagicalSecretsRule(rule) &&
                    !isFeatSpellChoiceRule(rule)
                ),
                nonMagicalAvailableSpells
              );

              return (
                <section
                  key={rank}
                  className="spell-rank-section"
                  data-study-region="spell-rank-section"
                  data-study-id={`spell-rank-${rank}`}
                >
                  <div className="spell-rank-title-row">
                    <h4>
                      {rank === 0 ? "Cantrips" : `Level ${toRoman(rank)}`}
                    </h4>

                    {rankChoiceRules.length > 0 && (
                      <div className="spell-rank-choice-counts">
                        {rankChoiceRules.map((rule) =>
                          renderChoiceCountPill(rule, selectedSpellIds)
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="spell-icon-grid"
                    data-study-region="spell-icon-grid"
                    data-study-id={`spell-icon-grid-rank-${rank}`}
                  >
                    {spellsForRank.map((spell) => renderSpellButton(spell))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpellsAbilitiesTab;