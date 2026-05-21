import { useMemo, useState } from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import { getSpellById, type BG3Spell } from "../data/bg3Spells";
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
  showDprLayer: boolean;
};

function getSelectedSpells(selectedSpellIds: string[]): BG3Spell[] {
  return selectedSpellIds
    .map((id) => getSpellById(id))
    .filter((spell): spell is BG3Spell => Boolean(spell));
}

export default function DataCircle({
  buildName,
  characterName,
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedSpellIds,
  showDprLayer,
}: DataCircleProps) {
  const [hoverFocus, setHoverFocus] = useState<DataCircleFocus>(null);
  const [selectedFocuses, setSelectedFocuses] = useState<DataCircleFocusItem[]>(
    []
  );
  const [isSelectionReviewActive, setIsSelectionReviewActive] = useState(false);

  const activeFocus: DataCircleFocus =
    hoverFocus ?? (selectedFocuses.length > 0 ? selectedFocuses : null);

  const isUsingMockData = selectedSpellIds.length === 0;

  const displaySpellIds = isUsingMockData
    ? mockSelectedSpellIds
    : selectedSpellIds;

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

  const buildLabel = displayBuildName.trim() || "Untitled Build";
  const characterLabel = displayCharacterName.trim();
  const archetypeLabel = displaySubclass || displayClass || "Unassigned";
  const spellCount = selectedSpells.length;

  const rangeCounts = useMemo(
    () => getRangeCounts(selectedSpells),
    [selectedSpells]
  );

  const roleData = useMemo(() => getRoleData(selectedSpells), [selectedSpells]);

  const damageTypeCounts = useMemo(
    () => getDamageTypeCounts(selectedSpells),
    [selectedSpells]
  );

  const maxRangeCount = Math.max(...Object.values(rangeCounts), 1);

  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const relationshipIndex = useMemo(
    () => buildLayerRelationshipIndex(selectedSpells, mockDprByRound),
    [selectedSpells]
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
              spellCount={spellCount}
              averageDpr={showDprLayer ? mockAverageDpr : undefined}
              totalDamage={showDprLayer ? totalDamage : undefined}
            />
          )}
        </svg>
      </div>
    </div>
  );
}