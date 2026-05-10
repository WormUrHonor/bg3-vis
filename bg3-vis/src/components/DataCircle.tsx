import { useMemo } from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import { getSpellById, type BG3Spell } from "../data/bg3Spells";
import { mockDataCircleBuild, mockSelectedSpellIds } from "../data/mockDataCircle";
import { DataCircleDefs } from "./DataCircle/DataCircleDefs";
import {
  getDamageTypeCounts,
  getRangeCounts,
  getResourceCounts,
  getRoleData,
} from "./DataCircle/dataCircleAggregation";
import { BackgroundLayer } from "./DataCircle/layers/BackgroundLayer";
import { CenterSealLayer } from "./DataCircle/layers/CenterSealLayer";
import { DamageTypesLayer } from "./DataCircle/layers/DamageTypesLayer";
import { RangeProfileLayer } from "./DataCircle/layers/RangeProfileLayer";
import { ResourceLayer } from "./DataCircle/layers/ResourceLayer";
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
  const isUsingMockData = selectedSpellIds.length === 0;
  const displaySpellIds = isUsingMockData ? mockSelectedSpellIds : selectedSpellIds;

  const displayBuildName = isUsingMockData ? mockDataCircleBuild.buildName : buildName;
  const displayCharacterName = isUsingMockData
    ? mockDataCircleBuild.characterName
    : characterName;
  const displayClass = isUsingMockData ? mockDataCircleBuild.selectedClass : selectedClass;
  const displaySubclass = isUsingMockData
    ? mockDataCircleBuild.selectedSubclass
    : selectedSubclass;
  const displayLevel = isUsingMockData ? mockDataCircleBuild.selectedLevel : selectedLevel;

  const selectedSpells = useMemo(
    () => getSelectedSpells(displaySpellIds),
    [displaySpellIds]
  );

  const buildLabel = displayBuildName.trim() || "Untitled Build";
  const characterLabel = displayCharacterName.trim();
  const archetypeLabel = displaySubclass || displayClass || "Unassigned";
  const spellCount = selectedSpells.length;

  const rangeCounts = useMemo(() => getRangeCounts(selectedSpells), [selectedSpells]);
  const roleData = useMemo(() => getRoleData(selectedSpells), [selectedSpells]);
  const damageTypeCounts = useMemo(
    () => getDamageTypeCounts(selectedSpells),
    [selectedSpells]
  );
  const resourceCounts = useMemo(
    () => getResourceCounts(selectedSpells),
    [selectedSpells]
  );

  const maxRangeCount = Math.max(...Object.values(rangeCounts), 1);
  const maxResourceCount = Math.max(...Object.values(resourceCounts), 1);
  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <div className="data-circle-panel">
      <div className="data-circle-stage">
        <svg
          viewBox="0 0 1000 1000"
          className="data-circle-svg"
          role="img"
          aria-label="Overview Data Circle visualization"
        >
          <DataCircleDefs />

          <BackgroundLayer />

          <ResourceLayer
            resourceCounts={resourceCounts}
            maxResourceCount={maxResourceCount}
          />

          <DamageTypesLayer
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
          />

          <RoleDistributionLayer roleData={roleData} />

          <RangeProfileLayer
            rangeCounts={rangeCounts}
            maxRangeCount={maxRangeCount}
          />

          <SectionTitleLayer />

          <CenterSealLayer
            buildLabel={buildLabel}
            characterLabel={characterLabel}
            archetypeLabel={archetypeLabel}
            displayLevel={displayLevel}
            spellCount={spellCount}
          />
        </svg>
      </div>

      {isUsingMockData ? (
        <p className="data-circle-empty">
          Mock data is shown until spells are selected.
        </p>
      ) : null}
    </div>
  );
}
