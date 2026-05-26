import { useMemo, useState } from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import { getSpellById, type BG3Spell } from "../data/bg3Spells";
import {
  getClassFeatureById,
  type BG3ClassFeature,
} from "../data/bg3ClassFeatures";
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
import {
  buildLayerRelationshipIndex,
  isSameFocusItem,
  type DataCircleFocus,
  type DataCircleFocusItem,
} from "./DataCircle/dataCircleInteraction";
import { BackgroundLayer } from "./DataCircle/layers/BackgroundLayer";
import { CenterSealLayer } from "./DataCircle/layers/CenterSealLayer";
import { DamageTypesLayer } from "./DataCircle/layers/DamageTypesLayer";
import { DprByRoundLayer } from "./DataCircle/layers/DprByRoundLayer";
import { FocusExplanationLayer } from "./DataCircle/layers/FocusExplanationLayer";
import { RangeProfileLayer } from "./DataCircle/layers/RangeProfileLayer";
import { RoleDistributionLayer } from "./DataCircle/layers/RoleDistributionLayer";
import { SectionTitleLayer } from "./DataCircle/layers/SectionTitleLayer";
import "./DataCircle.css";

type DataCircleProps = {
  buildName: string;
  characterName: string;
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
  fixedClassFeatureIds: string[];
  selectedClassFeatureIds: string[];
  activeClassFeatureIds: string[];
  showDprLayer: boolean;
};

export type DprBarMode = "stacked" | "grouped";

import type { VisualizedBuildItem } from "./DataCircle/dataCircleTypes";

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

function isVisualizableClassFeature(feature: BG3ClassFeature): boolean {
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

  return hasRange && (isUsableAction || isRelevantPassive) && (hasRoles || hasDamageTypes);
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export default function DataCircle({
  buildName,
  characterName,
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedSpellIds,
  fixedClassFeatureIds,
  selectedClassFeatureIds,
  activeClassFeatureIds,
  showDprLayer,
}: DataCircleProps) {
  const [hoverFocus, setHoverFocus] = useState<DataCircleFocus>(null);
  const [selectedFocuses, setSelectedFocuses] = useState<DataCircleFocusItem[]>(
    []
  );
  const [isSelectionReviewActive, setIsSelectionReviewActive] = useState(false);
  const [dprBarMode, setDprBarMode] = useState<DprBarMode>("stacked");

  const activeFocus: DataCircleFocus =
    hoverFocus ?? (selectedFocuses.length > 0 ? selectedFocuses : null);

  const selectedClassFeatureIdsForCircle = useMemo(
    () =>
      uniqueById(
        getSelectedClassFeatures([
          ...fixedClassFeatureIds,
          ...selectedClassFeatureIds,
          ...activeClassFeatureIds,
        ])
      ).filter(isVisualizableClassFeature),
    [fixedClassFeatureIds, selectedClassFeatureIds, activeClassFeatureIds]
  );

  const isUsingMockData =
    selectedSpellIds.length === 0 && selectedClassFeatureIdsForCircle.length === 0;

  const displaySpellIds = isUsingMockData ? mockSelectedSpellIds : selectedSpellIds;

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

  const selectedSpells = useMemo(
    () => getSelectedSpells(displaySpellIds),
    [displaySpellIds]
  );

  const visualizedItems: VisualizedBuildItem[] = useMemo(
    () =>
      uniqueById([
        ...selectedSpells,
        ...(isUsingMockData ? [] : selectedClassFeatureIdsForCircle),
      ]),
    [selectedSpells, selectedClassFeatureIdsForCircle, isUsingMockData]
  );

  const buildLabel = displayBuildName.trim() || "Untitled Build";
  const characterLabel = displayCharacterName.trim();
  const archetypeLabel = displaySubclass || displayClass || "Unassigned";
  const abilityCount = visualizedItems.length;

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
    <div className="data-circle-panel">
      {showDprLayer ? (
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

      {selectedFocuses.length > 0 ? (
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
          aria-label="Overview Data Circle visualization"
          onMouseLeave={() => setHoverFocus(null)}
        >
          <DataCircleDefs />

          <BackgroundLayer />

          {showDprLayer ? (
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

          <SectionTitleLayer
            outerTitle={showDprLayer ? "DPR BY ROUND" : "BUILD PROFILE"}
          />

          {hoverFocus ? (
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
              averageDpr={showDprLayer ? mockAverageDpr : undefined}
              totalDamage={showDprLayer ? totalDamage : undefined}
            />
          )}
        </svg>
      </div>
    </div>
  );
}