import { useEffect, useId, useMemo, useState } from "react";
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

  function toggleSelectedFocus(nextFocus: DataCircleFocusItem) {
    if (isCompact) return;

    setSelectedFocuses((current) => {
      const alreadySelected = current.some((item) =>
        isSameFocusItem(item, nextFocus)
      );

      if (alreadySelected) {
        return current.filter((item) => !isSameFocusItem(item, nextFocus));
      }

      return [...current, nextFocus];
    });
  }

  function clearSelectedFocuses() {
    setSelectedFocuses([]);
    setHoverFocus(null);
    setIsSelectionReviewActive(false);
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
              onClick={() => setDprBarMode("stacked")}
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
              onClick={() => setDprBarMode("grouped")}
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
          onMouseLeave={() => setHoverFocus(null)}
        >
          <DataCircleDefs />

          <BackgroundLayer />

          {shouldShowFullDprLayer ? (
            <DprByRoundLayer
              rounds={mockDprByRound}
              averageDpr={mockAverageDpr}
              focus={activeFocus}
              setFocus={setHoverFocus}
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
            setFocus={setHoverFocus}
            relationshipIndex={relationshipIndex}
            onToggleSelection={toggleSelectedFocus}
            selectedFocuses={selectedFocuses}
            showSelectionMarks={isSelectionReviewActive}
          />

          <RoleDistributionLayer
            roleData={roleData}
            focus={activeFocus}
            setFocus={setHoverFocus}
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
            setFocus={setHoverFocus}
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