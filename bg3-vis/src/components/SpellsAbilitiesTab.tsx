import {
  useEffect,
  useState,
  type Dispatch,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { bg3Spells, type BG3Spell } from "../data/bg3Spells";
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

const TOOLTIP_WIDTH = 300;
const TOOLTIP_MARGIN = 14;
const TOOLTIP_VERTICAL_GAP = 12;

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

  if (selectedClass === "Wizard") return "Spells & Wizard Features";

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
    : Math.min(viewportHeight - TOOLTIP_MARGIN, rect.bottom + TOOLTIP_VERTICAL_GAP);

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
    >
      {tooltip.content}
    </div>,
    document.body
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
}: SpellsAbilitiesTabProps) {
  const spellRanks = [0, 1, 2, 3, 4, 5, 6] as const;
  const [floatingTooltip, setFloatingTooltip] =
    useState<FloatingTooltipState | null>(null);

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

function showFloatingTooltip(
  event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
  id: string,
  content: ReactNode
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const position = getFloatingTooltipPosition(rect);

  setFloatingTooltip({
    id,
    content,
    ...position,
  });
}

  function hideFloatingTooltip(id?: string) {
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
    }
  ) {
    return (
      <>
        <strong>{spell.name}</strong>

        {spell.description && (
          <span className="spell-description">{spell.description}</span>
        )}

        {args.choiceRule && (
          <span>
            <b>Choice:</b> {args.choiceRule.displayGroupLabel}{" "}
            {
              getSelectedSpellIdsForRule(selectedSpellIds, args.choiceRule)
                .length
            }
            /{args.choiceRule.max}
          </span>
        )}

        <span>
          <b>Level:</b> {spell.rank === 0 ? "Cantrip" : toRoman(spell.rank)}
        </span>

        {spell.range && (
          <span>
            <b>Range:</b> {spell.range.label}
          </span>
        )}

        {spell.roles.length > 0 && (
          <span>
            <b>Role:</b>{" "}
            {spell.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
          </span>
        )}

        {spell.damageTypes.length > 0 && (
          <span>
            <b>Damage:</b> {spell.damageTypes.join(", ")}
          </span>
        )}

        {(spell.costs.actions.length > 0 ||
          spell.costs.resources.length > 0) && (
          <span>
            <b>Cost:</b>{" "}
            {formatCost(spell.costs.actions, spell.costs.resources)}
          </span>
        )}

        {spell.costs.requiresConcentration && <span>Requires concentration</span>}
        {args.isRitual && <span>Ritual spell</span>}
        {args.groupFull && !args.isSelected && <span>Choice limit reached</span>}
        {args.isFixed && <span>Granted automatically</span>}
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

  const isDisabled =
    isInformational || groupFull || (isFixed && !isActiveToggle);

  const tooltipId = `feature-${feature.id}`;

  const tooltipContent = renderFeatureTooltipContent(feature, {
    isInformational,
    isFixed,
    isActiveToggle,
    isActive,
    activeGroupFull,
  });

  function handleClick() {
    if (isDisabled) return;

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
        groupFull || (activeGroupFull && !isActive)
          ? "choice-disabled-soft"
          : "",
      ].join(" ")}
      type="button"
      aria-disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={(event) =>
        showFloatingTooltip(event, tooltipId, tooltipContent)
      }
      onMouseLeave={() => hideFloatingTooltip(tooltipId)}
      onFocus={(event) => showFloatingTooltip(event, tooltipId, tooltipContent)}
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

  const tooltipContent = renderSpellTooltipContent(spell, {
    choiceRule,
    isRitual,
    groupFull,
    isSelected,
    isFixed,
  });

  function handleClick() {
    if (isDisabled) return;

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
        groupFull ? "choice-disabled-soft" : "",
      ].join(" ")}
      type="button"
      aria-disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={(event) =>
        showFloatingTooltip(event, tooltipId, tooltipContent)
      }
      onMouseLeave={() => hideFloatingTooltip(tooltipId)}
      onFocus={(event) => showFloatingTooltip(event, tooltipId, tooltipContent)}
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
    <div className="tab-content">
      <FloatingSpellTooltip tooltip={floatingTooltip} />

      <div className="section-heading-row">
        <div>
          <h2>{getClassAbilityTabTitle(selectedClass, selectedSubclass)}</h2>
          <p className="panel-intro compact-intro">
            Select available spells, cantrips, class actions, passives, and
            subclass-specific choices. Fixed features are shown as already
            granted, while toggles can be set active for the visualisation.
          </p>
        </div>

        {selectedClass && (
          <span className="section-count-pill">
            {selectedSpellCount +
              selectedFeatureCount +
              fixedFeatureCount +
              activeFeatureCount}
          </span>
        )}
      </div>

      {!selectedClass && (
        <div className="placeholder-box">
          Select a class first to see available spells and class features.
        </div>
      )}

      {selectedClass &&
        availableSpells.length === 0 &&
        availableClassFeatures.length === 0 && (
          <div className="placeholder-box">
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
          >
            <div className="ability-section-heading feature-display-heading">
              <h3>{displayGroup.label}</h3>
            </div>

            {nonGroupedFeatures.length > 0 && (
              <div className="ability-icon-grid">
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
                >
                  <div className="choice-subgroup-header">
                    <strong>{activeGroup.label}</strong>
                    <span>
                      {activeInGroup}/{activeGroup.max}
                    </span>
                  </div>

                  <div className="ability-icon-grid">
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
                <div key={choiceGroup.id} className="choice-subgroup">
                  <div className="choice-subgroup-header">
                    <strong>{choiceGroup.label}</strong>
                    <span>
                      {selectedInChoiceGroup}/{effectiveChoiceGroupMax}
                    </span>
                  </div>

                  <div className="ability-icon-grid">
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
        <div className="section-block">
          <div className="ability-section-heading spell-section-heading-inline">
            <div className="spell-section-title-row">
              <h3>Spells and cantrips</h3>
            </div>

            <span>{selectedSpellIds.length}</span>
          </div>

          <div className="spell-book">
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
                >
                  <div className="spell-rank-title-row spell-choice-section-header">
                    <h4>{rule.displayGroupLabel}</h4>

                    <div className="spell-rank-choice-counts">
                      {renderChoiceCountPill(rule, selectedSpellIds)}
                    </div>
                  </div>

                  <div className="spell-icon-grid">
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
                <section key={rule.id} className="spell-rank-section">
                  <div className="spell-rank-title-row spell-choice-section-header">
                    <h4>{rule.displayGroupLabel}</h4>

                    <div className="spell-rank-choice-counts">
                      {renderChoiceCountPill(rule, selectedSpellIds)}
                    </div>
                  </div>

                  <div className="spell-icon-grid">
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
                <section key={rank} className="spell-rank-section">
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

                  <div className="spell-icon-grid">
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