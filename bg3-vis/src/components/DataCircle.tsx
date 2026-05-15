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
  type DataCircleFocus,
} from "./DataCircle/dataCircleInteraction";
import { BackgroundLayer } from "./DataCircle/layers/BackgroundLayer";
import { CenterSealLayer } from "./DataCircle/layers/CenterSealLayer";
import { ConnectivityLayer } from "./DataCircle/layers/ConnectivityLayer";
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
}: DataCircleProps) {
  const [focus, setFocus] = useState<DataCircleFocus>(null);

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

  return (
    <div className="data-circle-panel">
      <div className="data-circle-stage">
        <svg
          viewBox="0 0 1000 1000"
          className="data-circle-svg"
          role="img"
          aria-label="Overview Data Circle visualization"
          onMouseLeave={() => setFocus(null)}
        >
          <DataCircleDefs />

          <BackgroundLayer />

          <DprByRoundLayer
            rounds={mockDprByRound}
            averageDpr={mockAverageDpr}
            focus={focus}
            setFocus={setFocus}
            relationshipIndex={relationshipIndex}
          />

          <DamageTypesLayer
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
            focus={focus}
            setFocus={setFocus}
            relationshipIndex={relationshipIndex}
          />

          <RoleDistributionLayer
            roleData={roleData}
            focus={focus}
            setFocus={setFocus}
            relationshipIndex={relationshipIndex}
          />

          <RangeProfileLayer
            rangeCounts={rangeCounts}
            maxRangeCount={maxRangeCount}
            focus={focus}
            setFocus={setFocus}
            relationshipIndex={relationshipIndex}
          />

          <ConnectivityLayer
            focus={focus}
            relationshipIndex={relationshipIndex}
            roleData={roleData}
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
            rounds={mockDprByRound}
          />

          <SectionTitleLayer outerTitle="DPR BY ROUND" />

          <CenterSealLayer
            buildLabel={buildLabel}
            characterLabel={characterLabel}
            archetypeLabel={archetypeLabel}
            displayLevel={displayLevel}
            spellCount={spellCount}
            averageDpr={mockAverageDpr}
            totalDamage={mockDprByRound.reduce(
              (sum, round) => sum + round.damage,
              0
            )}
          />

          <FocusExplanationLayer
            focus={focus}
            relationshipIndex={relationshipIndex}
          />
        </svg>
      </div>
    </div>
  );
}