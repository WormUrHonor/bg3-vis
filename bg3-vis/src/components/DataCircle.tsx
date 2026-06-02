import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getClassFeatureById } from "../data/bg3ClassFeatures";
import {
  formatDamageRoll,
  getSpellById,
  type AbilityDamageProfile,
  type DamageRoll,
} from "../data/bg3Spells";
import { getClassFeatureIcon } from "../logic/classFeatureIconLogic";
import { getSpellIcon } from "../logic/spellIconLogic";
import type { ClassName } from "../types/buildPlannerTypes";
import { DataCircleDefs } from "./DataCircle/DataCircleDefs";
import {
  getDamageTypeCounts,
  getRangeCounts,
  getRoleData,
} from "./DataCircle/dataCircleAggregation";
import { getVisualizedBuildItems } from "./DataCircle/dataCircleBuildItems";
import {
  buildLayerRelationshipIndex,
  getFocusedAbilityIds,
  getFocusItems,
  isSameFocusItem,
  type DataCircleFocus,
  type DataCircleFocusItem,
  type DprRound,
} from "./DataCircle/dataCircleInteraction";
import type { VisualizedBuildItem } from "./DataCircle/dataCircleTypes";
import { BackgroundLayer } from "./DataCircle/layers/BackgroundLayer";
import { CenterSealLayer } from "./DataCircle/layers/CenterSealLayer";
import { DamageTypesLayer } from "./DataCircle/layers/DamageTypesLayer";
import { DprByRoundLayer } from "./DataCircle/layers/DprByRoundLayer";
import { FocusExplanationLayer } from "./DataCircle/layers/FocusExplanationLayer";
import { RangeProfileLayer } from "./DataCircle/layers/RangeProfileLayer";
import { RoleDistributionLayer } from "./DataCircle/layers/RoleDistributionLayer";
import { SectionTitleLayer } from "./DataCircle/layers/SectionTitleLayer";
import {
  SpellDamagePreviewLayer,
  type SpellDamagePreviewItem,
} from "./DataCircle/layers/SpellDamagePreviewLayer";
import {
  logStudyEvent,
  logVisualizationFocusCleared,
  logVisualizationFocusEnded,
  logVisualizationFocusSelected,
  logVisualizationFocusStarted,
} from "../logic/studyLogger";
import type {
  DataCircleFocusForLogging,
  DataCircleFocusTrigger,
} from "../types/loggingTypes";
import "./DataCircle.css";

export type DprBarMode = "stacked" | "grouped";
export type DataCircleVariant = "main" | "party" | "aggregate";

type DataCircleProps = {
  buildName: string;
  characterName: string;
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;

  selectedSpellIds?: string[];
  fixedClassFeatureIds?: string[];
  selectedClassFeatureIds?: string[];
  activeClassFeatureIds?: string[];

  showDprLayer?: boolean;
  variant?: DataCircleVariant;
  visualizedItemsOverride?: VisualizedBuildItem[];

  dprRounds?: DprRound[];
  averageDpr?: number;
  dprStatus?: "idle" | "loading" | "success" | "error";
  dprError?: string | null;

  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  partySnapshotHash?: string | null;

  setLinkedFocus?: Dispatch<SetStateAction<DataCircleFocus>>;
};

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSort);

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableSort((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "none";

  try {
    return JSON.stringify(stableSort(value));
  } catch {
    return String(value);
  }
}

function getFocusLogKey(focus: DataCircleFocus): string {
  if (!focus) return "none";

  if (Array.isArray(focus)) {
    return focus.map((item) => stableStringify(item)).sort().join("|");
  }

  return stableStringify(focus);
}

function humanizeKey(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFocusLabel(
  focus: DataCircleFocusItem,
  abilityNames: Record<string, string>
): string {
  switch (focus.type) {
    case "ability":
      return abilityNames[focus.abilityId] ?? focus.abilityId;

    case "role":
      return humanizeKey(focus.role);

    case "roleGroup":
      return humanizeKey(focus.roleGroup);

    case "damageType":
      return focus.damageType;

    case "range":
      return humanizeKey(focus.range);

    case "round":
      return `Round ${focus.round}`;

    default:
      return stableStringify(focus);
  }
}

function getFocusLayer(focus: DataCircleFocusItem): string {
  switch (focus.type) {
    case "ability":
      return "ability";

    case "role":
    case "roleGroup":
      return "roles-utility";

    case "damageType":
      return "damage-types";

    case "range":
      return "range";

    case "round":
      return "dpr";

    default:
      return "unknown";
  }
}

function isRealDamageRoll(damageRoll: DamageRoll): boolean {
  return !["Healing", "Temporary Hit Points"].includes(
    String(damageRoll.damageType)
  );
}

function getDamageRollMin(damageRoll: DamageRoll): number {
  const diceMin =
    damageRoll.diceCount > 0 && damageRoll.diceSize > 0
      ? damageRoll.diceCount
      : 0;

  return diceMin + (damageRoll.flatBonus ?? 0);
}

function getDamageRollAverageLocal(damageRoll: DamageRoll): number {
  const diceAverage =
    damageRoll.diceCount > 0 && damageRoll.diceSize > 0
      ? damageRoll.diceCount * ((damageRoll.diceSize + 1) / 2)
      : 0;

  return diceAverage + (damageRoll.flatBonus ?? 0);
}

function getDamageRollMax(damageRoll: DamageRoll): number {
  const diceMax =
    damageRoll.diceCount > 0 && damageRoll.diceSize > 0
      ? damageRoll.diceCount * damageRoll.diceSize
      : 0;

  return diceMax + (damageRoll.flatBonus ?? 0);
}

function getDamageOnlyPreviewStats(profile?: AbilityDamageProfile) {
  if (!profile || !profile.hasDamage) return null;

  const damageRolls = profile.rolls.filter(isRealDamageRoll);

  if (damageRolls.length <= 0) return null;

  const min = damageRolls.reduce(
    (sum, damageRoll) => sum + getDamageRollMin(damageRoll),
    0
  );

  const average = damageRolls.reduce(
    (sum, damageRoll) => sum + getDamageRollAverageLocal(damageRoll),
    0
  );

  const max = damageRolls.reduce(
    (sum, damageRoll) => sum + getDamageRollMax(damageRoll),
    0
  );

  return {
    min,
    average,
    max,
    rollText: damageRolls.map(formatDamageRoll).join(" + "),
  };
}

function formatDamagePreviewResolution(profile?: AbilityDamageProfile) {
  if (!profile || profile.saveBehaviour === "none") return null;

  const saveBehaviour = profile.saveBehaviour.replaceAll("-", " ");

  return profile.saveAbility
    ? `${saveBehaviour} (${profile.saveAbility})`
    : saveBehaviour;
}

function formatDamagePreviewDelivery(profile?: AbilityDamageProfile) {
  if (!profile || profile.delivery === "none") return null;
  return profile.delivery.replaceAll("-", " ");
}

function getAverageFromRounds(rounds: DprRound[]): number {
  if (rounds.length <= 0) return 0;
  return rounds.reduce((sum, round) => sum + round.damage, 0) / rounds.length;
}

function isPassiveVisualizedItem(item: VisualizedBuildItem): boolean {
  const record = item as unknown as Record<string, unknown>;

  const kindLikeValues = [
    record.kind,
    record.itemKind,
    record.featureKind,
    record.sourceKind,
    record.actionKind,
    record.activationType,
  ]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  const tags = Array.isArray(record.tags)
    ? record.tags
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase())
    : [];

  return (
    kindLikeValues.includes("passive") ||
    kindLikeValues.includes("passive-feature") ||
    tags.includes("passive")
  );
}

export default function DataCircle({
  buildName,
  characterName,
  selectedClass,
  selectedSubclass,
  selectedLevel,

  selectedSpellIds = [],
  fixedClassFeatureIds = [],
  selectedClassFeatureIds = [],
  activeClassFeatureIds = [],

  showDprLayer = false,
  variant = "main",
  visualizedItemsOverride,

  dprRounds,
  averageDpr,
  dprStatus = "idle",
  dprError = null,

  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  partySnapshotHash = null,

  setLinkedFocus,
}: DataCircleProps) {
  const rawInstanceId = useId();

  const svgInstanceId = useMemo(
    () => rawInstanceId.replace(/[^a-zA-Z0-9_-]/g, ""),
    [rawInstanceId]
  );

  const [hoverFocus, setHoverFocus] = useState<DataCircleFocus>(null);
  const [selectedFocuses, setSelectedFocuses] = useState<DataCircleFocusItem[]>(
    []
  );
  const [isSelectionReviewActive, setIsSelectionReviewActive] = useState(false);
  const [dprBarMode, setDprBarMode] = useState<DprBarMode>("stacked");

  const hoverFocusRef = useRef<DataCircleFocus>(null);
  const selectedFocusesRef = useRef<DataCircleFocusItem[]>([]);
  const setLinkedFocusRef = useRef(setLinkedFocus);

  useEffect(() => {
    setLinkedFocusRef.current = setLinkedFocus;
  }, [setLinkedFocus]);

  const isCompact = variant !== "main";

  const resolvedVisualizedItems = useMemo(
    () =>
      getVisualizedBuildItems({
        selectedSpellIds,
        fixedClassFeatureIds,
        selectedClassFeatureIds,
        activeClassFeatureIds,
      }),
    [
      selectedSpellIds,
      fixedClassFeatureIds,
      selectedClassFeatureIds,
      activeClassFeatureIds,
    ]
  );

  const visualizedItems: VisualizedBuildItem[] = useMemo(() => {
    const sourceItems = visualizedItemsOverride ?? resolvedVisualizedItems;

    return sourceItems.filter((item) => !isPassiveVisualizedItem(item));
  }, [resolvedVisualizedItems, visualizedItemsOverride]);

  const resolvedDprRounds = useMemo(() => dprRounds ?? [], [dprRounds]);

  const resolvedAverageDpr =
    typeof averageDpr === "number"
      ? averageDpr
      : getAverageFromRounds(resolvedDprRounds);

  const hasDprData = resolvedDprRounds.length > 0;

  const spellDamagePreviewItems = useMemo<SpellDamagePreviewItem[]>(() => {
    return visualizedItems
      .map((item): SpellDamagePreviewItem | null => {
        const spell = getSpellById(item.id);

        if (spell) {
          const stats = getDamageOnlyPreviewStats(spell.damage);

          if (!stats || stats.average <= 0) return null;

          return {
            id: spell.id,
            name: spell.name,
            min: stats.min,
            average: stats.average,
            max: stats.max,
            rollText: stats.rollText,
            damageTypes: spell.damageTypes,
            saveLabel: formatDamagePreviewResolution(spell.damage),
            deliveryLabel: formatDamagePreviewDelivery(spell.damage),
            iconHref: getSpellIcon(spell),
          };
        }

        const feature = getClassFeatureById(item.id);

        if (feature) {
          const stats = getDamageOnlyPreviewStats(feature.damage);

          if (!stats || stats.average <= 0) return null;

          return {
            id: feature.id,
            name: feature.name,
            min: stats.min,
            average: stats.average,
            max: stats.max,
            rollText: stats.rollText,
            damageTypes: feature.damageTypes ?? [],
            saveLabel: formatDamagePreviewResolution(feature.damage),
            deliveryLabel: formatDamagePreviewDelivery(feature.damage),
            iconHref: getClassFeatureIcon(feature),
          };
        }

        return null;
      })
      .filter((item): item is SpellDamagePreviewItem => Boolean(item))
      .sort((first, second) => second.average - first.average)
      .slice(0, 14);
  }, [visualizedItems]);

  const hasSpellDamagePreviewData = spellDamagePreviewItems.length > 0;

  const selectedPersistentFocus: DataCircleFocus =
    selectedFocuses.length > 0 ? selectedFocuses : null;

  const activeFocus: DataCircleFocus = selectedPersistentFocus ?? hoverFocus;

  useEffect(() => {
    hoverFocusRef.current = hoverFocus;
  }, [hoverFocus]);

  useEffect(() => {
    selectedFocusesRef.current = selectedFocuses;
  }, [selectedFocuses]);

  const visualizedItemsKey = useMemo(
    () =>
      visualizedItems
        .map((item) => item.id)
        .sort()
        .join("|"),
    [visualizedItems]
  );

  useEffect(() => {
    setSelectedFocuses((currentSelectedFocuses) => {
      const nextSelectedFocuses = currentSelectedFocuses.filter((focusItem) => {
        if (focusItem.type !== "ability") return true;

        return visualizedItems.some((item) => item.id === focusItem.abilityId);
      });

      const changed =
        nextSelectedFocuses.length !== currentSelectedFocuses.length ||
        nextSelectedFocuses.some(
          (focusItem, index) => focusItem !== currentSelectedFocuses[index]
        );

      selectedFocusesRef.current = nextSelectedFocuses;

      if (nextSelectedFocuses.length === 0) {
        setIsSelectionReviewActive(false);
      }

      return changed ? nextSelectedFocuses : currentSelectedFocuses;
    });
  }, [visualizedItemsKey, visualizedItems]);

  useEffect(() => {
    if (variant !== "main") return;

    const linkedFocus =
      selectedFocuses.length > 0 ? selectedFocuses : hoverFocus;

    setLinkedFocusRef.current?.(linkedFocus);
  }, [selectedFocuses, hoverFocus, variant]);

  const buildLabel = buildName.trim() || "Untitled Build";
  const characterLabel = characterName.trim();
  const archetypeLabel = selectedSubclass || selectedClass || "Unassigned";
  const abilityCount = visualizedItems.length;

const shouldShowDprByRoundLayer =
  !isCompact && showDprLayer && hasDprData;

const shouldShowSpellDamagePreview =
  !isCompact &&
  showDprLayer &&
  !hasDprData &&
  hasSpellDamagePreviewData;

const shouldShowDprControls =
  !isCompact &&
  showDprLayer &&
  (hasDprData || dprStatus === "loading" || dprStatus === "error");

  const shouldShowCompactDprNumber = isCompact && hasDprData;

  const rangeCounts = useMemo(
    () => getRangeCounts(visualizedItems),
    [visualizedItems]
  );

  const roleData = useMemo(() => getRoleData(visualizedItems), [visualizedItems]);

  const damageTypeCounts = useMemo(
    () => getDamageTypeCounts(visualizedItems),
    [visualizedItems]
  );

  const maxRangeCount = Math.max(...Object.values(rangeCounts), 1);

  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const relationshipIndex = useMemo(
    () => buildLayerRelationshipIndex(visualizedItems, resolvedDprRounds),
    [visualizedItems, resolvedDprRounds]
  );

  const totalDamage = resolvedDprRounds.reduce(
    (sum, round) => sum + round.damage,
    0
  );

  function makeFocusForLogging(
    focus: DataCircleFocusItem,
    trigger: DataCircleFocusTrigger
  ): DataCircleFocusForLogging {
    const matchingAbilityIds = getFocusedAbilityIds(focus, relationshipIndex);

    return {
      focusType: focus.type,
      focusKey: stableStringify(focus),
      focusLabel: getFocusLabel(focus, relationshipIndex.abilityNames),
      focusLayer: getFocusLayer(focus),
      focusSource: `data-circle-${variant}`,
      focusTrigger: trigger,
      rawFocus: focus,
      matchingAbilityCount: matchingAbilityIds.length,
      matchingAbilityIds,
      selectedFocusCount: selectedFocusesRef.current.length,
      selectedFocuses: selectedFocusesRef.current,
    };
  }

  function getLoggingContext() {
    return {
      activeView: `data-circle-${variant}`,
      activeBuildLabel: buildLabel,
      activePartyMemberIndex,
      activePartyMemberLabel,
      partySnapshotHash,
    };
  }

  const setHoverFocusWithLogging: Dispatch<SetStateAction<DataCircleFocus>> = (
    nextFocusOrUpdater
  ) => {
    const previousFocus = hoverFocusRef.current;
    const nextFocus =
      typeof nextFocusOrUpdater === "function"
        ? (nextFocusOrUpdater as (previous: DataCircleFocus) => DataCircleFocus)(
            previousFocus
          )
        : nextFocusOrUpdater;

    const previousKey = getFocusLogKey(previousFocus);
    const nextKey = getFocusLogKey(nextFocus);

    if (previousKey === nextKey) {
      hoverFocusRef.current = nextFocus;
      setHoverFocus(nextFocus);
      return;
    }

    const previousItems = getFocusItems(previousFocus);

    if (previousItems.length === 1) {
      logVisualizationFocusEnded(
        makeFocusForLogging(previousItems[0], "hover"),
        getLoggingContext()
      );
    }

    const nextItems = getFocusItems(nextFocus);

    if (nextItems.length === 1) {
      logVisualizationFocusStarted(
        makeFocusForLogging(nextItems[0], "hover"),
        getLoggingContext()
      );
    }

    hoverFocusRef.current = nextFocus;
    setHoverFocus(nextFocus);
  };

  function setDprBarModeWithLogging(nextMode: DprBarMode) {
    if (nextMode === dprBarMode) return;

    logStudyEvent({
      eventCategory: "visualization",
      eventType: "data_circle_dpr_layout_changed",
      activeView: `data-circle-${variant}`,
      activeBuildLabel: buildLabel,
      activePartyMemberIndex,
      activePartyMemberLabel,
      partySnapshotHash,
      payload: {
        previousMode: dprBarMode,
        nextMode,
        buildLabel,
        characterLabel,
        variant,
        hasDprData,
        roundCount: resolvedDprRounds.length,
      },
    });

    setDprBarMode(nextMode);
  }

  function toggleSelectedFocus(nextFocus: DataCircleFocusItem) {
    if (isCompact) return;

    const current = selectedFocusesRef.current;
    const alreadySelected = current.some((item) =>
      isSameFocusItem(item, nextFocus)
    );

    const nextSelectedFocuses = alreadySelected
      ? current.filter((item) => !isSameFocusItem(item, nextFocus))
      : [...current, nextFocus];

    selectedFocusesRef.current = nextSelectedFocuses;
    setSelectedFocuses(nextSelectedFocuses);
    setIsSelectionReviewActive(nextSelectedFocuses.length > 0);

    logVisualizationFocusSelected(
      {
        ...makeFocusForLogging(nextFocus, "click"),
        selectedFocusCount: nextSelectedFocuses.length,
        selectedFocuses: nextSelectedFocuses,
      },
      {
        ...getLoggingContext(),
        action: alreadySelected ? "removed" : "added",
      }
    );
  }

  function clearSelectedFocuses() {
    const currentSelectedFocuses = selectedFocusesRef.current;

    logVisualizationFocusCleared(
      {
        clearedFocusCount: currentSelectedFocuses.length,
        clearedFocuses: currentSelectedFocuses,
        previousFocusKey: getFocusLogKey(currentSelectedFocuses),
        reason: "manual_clear",
      },
      getLoggingContext()
    );

    selectedFocusesRef.current = [];
    setSelectedFocuses([]);

    setHoverFocusWithLogging(null);
    setIsSelectionReviewActive(false);
    setLinkedFocus?.(null);
  }

  return (
    <div
      className={`data-circle-panel data-circle-panel--${variant}`}
      data-circle-variant={variant}
      data-study-region={`data-circle-${variant}`}
      data-study-id={`data-circle-panel-${variant}-${svgInstanceId}`}
    >
      {shouldShowDprControls ? (
        <div
          className="data-circle-controls"
          data-study-region="data-circle-dpr-controls"
          data-study-id={`data-circle-dpr-controls-${svgInstanceId}`}
        >
          <div className="data-circle-dpr-toggle" aria-label="DPR bar layout">
<span className="data-circle-dpr-toggle-label">
  {dprStatus === "loading"
    ? "Running simulator"
    : dprStatus === "error"
      ? "Simulator unavailable"
      : hasDprData
        ? "DPR layout"
        : "Damage preview"}
</span>

            <button
              type="button"
              className={`data-circle-dpr-toggle-button ${
                dprBarMode === "stacked"
                  ? "data-circle-dpr-toggle-button--active"
                  : ""
              }`}
              onClick={() => setDprBarModeWithLogging("stacked")}
              disabled={!hasDprData}
              data-study-element="data-circle-dpr-toggle-stacked"
              data-study-id={`data-circle-dpr-toggle-stacked-${svgInstanceId}`}
            >
              Stacked
            </button>

            <button
              type="button"
              className={`data-circle-dpr-toggle-button ${
                dprBarMode === "grouped"
                  ? "data-circle-dpr-toggle-button--active"
                  : ""
              }`}
              onClick={() => setDprBarModeWithLogging("grouped")}
              disabled={!hasDprData}
              data-study-element="data-circle-dpr-toggle-grouped"
              data-study-id={`data-circle-dpr-toggle-grouped-${svgInstanceId}`}
            >
              Side-by-side
            </button>
          </div>

          {dprStatus === "error" && dprError ? (
            <p className="data-circle-dpr-error">{dprError}</p>
          ) : null}
        </div>
      ) : null}

      {!isCompact && selectedFocuses.length > 0 ? (
        <button
          type="button"
          className={`data-circle-clear-selection-button ${
            isSelectionReviewActive
              ? "data-circle-clear-selection-button--active"
              : ""
          }`}
          onClick={clearSelectedFocuses}
          onMouseEnter={() => setIsSelectionReviewActive(true)}
          onMouseLeave={() => setIsSelectionReviewActive(false)}
          onFocus={() => setIsSelectionReviewActive(true)}
          onBlur={() => setIsSelectionReviewActive(false)}
          data-study-element="data-circle-clear-selection"
          data-study-id={`data-circle-clear-selection-${svgInstanceId}`}
        >
          Clear selection · {selectedFocuses.length}
        </button>
      ) : null}

      <div
        className="data-circle-stage"
        data-study-region={`data-circle-stage-${variant}`}
        data-study-id={`data-circle-stage-${variant}-${svgInstanceId}`}
      >
        <svg
          viewBox="0 0 1000 1000"
          className="data-circle-svg"
          role="img"
          aria-label={`${buildLabel} Data Circle visualization`}
          onMouseLeave={() => setHoverFocusWithLogging(null)}
          data-study-element="data-circle-svg"
          data-study-id={`data-circle-svg-${variant}-${svgInstanceId}`}
        >
          <DataCircleDefs />

          <BackgroundLayer svgInstanceId={svgInstanceId} />

          {shouldShowDprByRoundLayer ? (
            <DprByRoundLayer
              rounds={resolvedDprRounds}
              averageDpr={resolvedAverageDpr}
              focus={activeFocus}
              setFocus={setHoverFocusWithLogging}
              relationshipIndex={relationshipIndex}
              onToggleSelection={toggleSelectedFocus}
              selectedFocuses={selectedFocuses}
              showSelectionMarks={
                selectedFocuses.length > 0 || isSelectionReviewActive
              }
              barMode={dprBarMode}
            />
          ) : null}

          {shouldShowSpellDamagePreview ? (
            <SpellDamagePreviewLayer
              items={spellDamagePreviewItems}
              focus={activeFocus}
              setFocus={setHoverFocusWithLogging}
              relationshipIndex={relationshipIndex}
              onToggleSelection={toggleSelectedFocus}
              selectedFocuses={selectedFocuses}
              showSelectionMarks={
                selectedFocuses.length > 0 || isSelectionReviewActive
              }
            />
          ) : null}

          <DamageTypesLayer
            svgInstanceId={svgInstanceId}
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
            focus={activeFocus}
            setFocus={setHoverFocusWithLogging}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={
              selectedFocuses.length > 0 || isSelectionReviewActive
            }
          />

          <RoleDistributionLayer
            svgInstanceId={svgInstanceId}
            roleData={roleData}
            focus={activeFocus}
            setFocus={setHoverFocusWithLogging}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={
              selectedFocuses.length > 0 || isSelectionReviewActive
            }
          />

          <RangeProfileLayer
            svgInstanceId={svgInstanceId}
            rangeCounts={rangeCounts}
            maxRangeCount={maxRangeCount}
            roleData={roleData}
            focus={activeFocus}
            setFocus={setHoverFocusWithLogging}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={
              selectedFocuses.length > 0 || isSelectionReviewActive
            }
          />

          {!isCompact ? (
            <SectionTitleLayer
              svgInstanceId={svgInstanceId}
              outerTitle={
                shouldShowDprByRoundLayer
                  ? "DPR BY ROUND"
                  : shouldShowSpellDamagePreview
                    ? "DAMAGE PREVIEW"
                    : "BUILD PROFILE"
              }
            />
          ) : null}

          {!isCompact && hoverFocus ? (
            <FocusExplanationLayer
              focus={hoverFocus}
              relationshipIndex={relationshipIndex}
            />
          ) : (
            <CenterSealLayer
              buildLabel={buildLabel}
              characterLabel={characterLabel}
              archetypeLabel={archetypeLabel}
              displayLevel={selectedLevel}
              spellCount={abilityCount}
              averageDpr={
                shouldShowDprByRoundLayer || shouldShowCompactDprNumber
                  ? resolvedAverageDpr
                  : undefined
              }
              totalDamage={shouldShowDprByRoundLayer ? totalDamage : undefined}
              compactMode={isCompact}
            />
          )}
        </svg>
      </div>
    </div>
  );
}