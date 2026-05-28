import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import {
  mockAverageDpr,
  mockDataCircleBuild,
  mockDprByRound,
  mockSelectedSpellIds,
} from "../data/mockDataCircle";
import { DataCircleDefs } from "./DataCircle/DataCircleDefs";
import {
  getDamageTypeCounts,
  getRangeCounts,
  getRoleData,
} from "./DataCircle/dataCircleAggregation";
import { getVisualizedBuildItems } from "./DataCircle/dataCircleBuildItems";
import {
  buildLayerRelationshipIndex,
  isSameFocusItem,
  type DataCircleFocus,
  type DataCircleFocusItem,
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
import { logStudyEvent } from "../logic/studyLogger";
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
};

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "none";

  try {
    return JSON.stringify(value, Object.keys(value as object).sort());
  } catch {
    return String(value);
  }
}

function getFocusLogKey(focus: DataCircleFocus) {
  if (!focus) return "none";

  if (Array.isArray(focus)) {
    return focus.map((item) => stableStringify(item)).sort().join("|");
  }

  return stableStringify(focus);
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
}: DataCircleProps) {
  const rawInstanceId = useId();
  const lastLoggedHoverKeyRef = useRef<string>("none");

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

  const isCompact = variant !== "main";

  const activeFocus: DataCircleFocus =
    hoverFocus ?? (selectedFocuses.length > 0 ? selectedFocuses : null);

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

  const hasOverride = visualizedItemsOverride !== undefined;

  const isUsingMockData =
    !hasOverride &&
    selectedSpellIds.length === 0 &&
    resolvedVisualizedItems.length === 0;

  const visualizedItems: VisualizedBuildItem[] = useMemo(() => {
    if (hasOverride) return visualizedItemsOverride;

    if (isUsingMockData) {
      return getVisualizedBuildItems({
        selectedSpellIds: mockSelectedSpellIds,
        fixedClassFeatureIds: [],
        selectedClassFeatureIds: [],
        activeClassFeatureIds: [],
      });
    }

    return resolvedVisualizedItems;
  }, [
    hasOverride,
    visualizedItemsOverride,
    isUsingMockData,
    resolvedVisualizedItems,
  ]);

  const visualizedItemsKey = useMemo(
    () =>
      visualizedItems
        .map((item) => item.id)
        .sort()
        .join("|"),
    [visualizedItems]
  );

  useEffect(() => {
    setHoverFocus(null);
    setSelectedFocuses([]);
    setIsSelectionReviewActive(false);
    lastLoggedHoverKeyRef.current = "none";
  }, [visualizedItemsKey, showDprLayer, variant]);

  const displayBuildName = isUsingMockData
    ? mockDataCircleBuild.buildName
    : buildName;

  const displayCharacterName = isUsingMockData
    ? mockDataCircleBuild.characterName
    : characterName;

  const displayClass = isUsingMockData
    ? mockDataCircleBuild.selectedClass
    : selectedClass;

  const displaySubclass = isUsingMockData
    ? mockDataCircleBuild.selectedSubclass
    : selectedSubclass;

  const displayLevel = isUsingMockData
    ? mockDataCircleBuild.selectedLevel
    : selectedLevel;

  const buildLabel = displayBuildName.trim() || "Untitled Build";
  const characterLabel = displayCharacterName.trim();
  const archetypeLabel = displaySubclass || displayClass || "Unassigned";
  const abilityCount = visualizedItems.length;

  const shouldShowFullDprLayer = !isCompact && showDprLayer;
  const shouldShowCompactDprNumber = isCompact;

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
    () => buildLayerRelationshipIndex(visualizedItems, mockDprByRound),
    [visualizedItems]
  );

  const totalDamage = mockDprByRound.reduce(
    (sum, round) => sum + round.damage,
    0
  );

  const setHoverFocusWithLogging: Dispatch<SetStateAction<DataCircleFocus>> = (
    nextFocusOrUpdater
  ) => {
    setHoverFocus((previousFocus) => {
      const nextFocus =
        typeof nextFocusOrUpdater === "function"
          ? (nextFocusOrUpdater as (previous: DataCircleFocus) => DataCircleFocus)(
              previousFocus
            )
          : nextFocusOrUpdater;

      if (!isCompact && nextFocus && !Array.isArray(nextFocus)) {
        const nextKey = getFocusLogKey(nextFocus);

        if (nextKey !== lastLoggedHoverKeyRef.current) {
          lastLoggedHoverKeyRef.current = nextKey;

          logStudyEvent({
            eventCategory: "visualization",
            eventType: "data_circle_focus_hovered",
            activeBuildLabel: buildLabel,
            activeView: `data-circle-${variant}`,
            payload: {
              focus: nextFocus,
              focusKey: nextKey,
              buildLabel,
              characterLabel,
              variant,
            },
          });
        }
      }

      if (!nextFocus) {
        lastLoggedHoverKeyRef.current = "none";
      }

      return nextFocus;
    });
  };

  function setDprBarModeWithLogging(nextMode: DprBarMode) {
    if (nextMode === dprBarMode) return;

    logStudyEvent({
      eventCategory: "visualization",
      eventType: "data_circle_dpr_layout_changed",
      activeBuildLabel: buildLabel,
      activeView: `data-circle-${variant}`,
      payload: {
        previousMode: dprBarMode,
        nextMode,
        buildLabel,
      },
    });

    setDprBarMode(nextMode);
  }

  function toggleSelectedFocus(nextFocus: DataCircleFocusItem) {
    if (isCompact) return;

    setSelectedFocuses((current) => {
      const alreadySelected = current.some((item) =>
        isSameFocusItem(item, nextFocus)
      );

      const nextSelectedFocuses = alreadySelected
        ? current.filter((item) => !isSameFocusItem(item, nextFocus))
        : [...current, nextFocus];

      logStudyEvent({
        eventCategory: "visualization",
        eventType: "data_circle_focus_selected",
        activeBuildLabel: buildLabel,
        activeView: `data-circle-${variant}`,
        payload: {
          action: alreadySelected ? "removed" : "added",
          focus: nextFocus,
          focusKey: stableStringify(nextFocus),
          selectedFocusCount: nextSelectedFocuses.length,
          selectedFocuses: nextSelectedFocuses,
          buildLabel,
        },
      });

      return nextSelectedFocuses;
    });
  }

  function clearSelectedFocuses() {
    logStudyEvent({
      eventCategory: "visualization",
      eventType: "data_circle_focus_cleared",
      activeBuildLabel: buildLabel,
      activeView: `data-circle-${variant}`,
      payload: {
        clearedFocusCount: selectedFocuses.length,
        clearedFocuses: selectedFocuses,
        buildLabel,
      },
    });

    setSelectedFocuses([]);
    setHoverFocus(null);
    setIsSelectionReviewActive(false);
    lastLoggedHoverKeyRef.current = "none";
  }

  return (
    <div
      className={`data-circle-panel data-circle-panel--${variant}`}
      data-circle-variant={variant}
    >
      {shouldShowFullDprLayer ? (
        <div className="data-circle-controls">
          <div className="data-circle-dpr-toggle" aria-label="DPR bar layout">
            <span className="data-circle-dpr-toggle-label">DPR layout</span>

            <button
              type="button"
              className={`data-circle-dpr-toggle-button ${
                dprBarMode === "stacked"
                  ? "data-circle-dpr-toggle-button--active"
                  : ""
              }`}
              onClick={() => setDprBarModeWithLogging("stacked")}
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
            >
              Side-by-side
            </button>
          </div>
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
        >
          Clear selection · {selectedFocuses.length}
        </button>
      ) : null}

      <div className="data-circle-stage">
        <svg
          viewBox="0 0 1000 1000"
          className="data-circle-svg"
          role="img"
          aria-label={`${buildLabel} Data Circle visualization`}
          onMouseLeave={() => setHoverFocusWithLogging(null)}
        >
          <DataCircleDefs />

          <BackgroundLayer />

          {shouldShowFullDprLayer ? (
            <DprByRoundLayer
              rounds={mockDprByRound}
              averageDpr={mockAverageDpr}
              focus={activeFocus}
              setFocus={setHoverFocusWithLogging}
              relationshipIndex={relationshipIndex}
              onToggleSelection={toggleSelectedFocus}
              selectedFocuses={selectedFocuses}
              showSelectionMarks={isSelectionReviewActive}
              barMode={dprBarMode}
            />
          ) : null}

          <DamageTypesLayer
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
            focus={activeFocus}
            setFocus={setHoverFocusWithLogging}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={isSelectionReviewActive}
          />

          <RoleDistributionLayer
            roleData={roleData}
            focus={activeFocus}
            setFocus={setHoverFocusWithLogging}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={isSelectionReviewActive}
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
            showSelectionMarks={isSelectionReviewActive}
          />

          {!isCompact ? (
            <SectionTitleLayer
              outerTitle={
                shouldShowFullDprLayer ? "DPR BY ROUND" : "BUILD PROFILE"
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
              displayLevel={displayLevel}
              spellCount={abilityCount}
              averageDpr={
                shouldShowFullDprLayer || shouldShowCompactDprNumber
                  ? mockAverageDpr
                  : undefined
              }
              totalDamage={shouldShowFullDprLayer ? totalDamage : undefined}
              compactMode={isCompact}
            />
          )}
        </svg>
      </div>
    </div>
  );
}