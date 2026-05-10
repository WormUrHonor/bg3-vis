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

/*
  Toggle this layer here.

  false = hide the resource / requirements layer.
  true = show the resource / requirements layer.

  Later, the DPR-by-round layer can be rendered in the same outer slot.
*/
const SHOW_RESOURCE_LAYER = false;

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

  /*
    This is only calculated when the resource layer is enabled.
    If SHOW_RESOURCE_LAYER is false, this avoids doing unnecessary work.
  */
  const resourceCounts = useMemo(
    () => (SHOW_RESOURCE_LAYER ? getResourceCounts(selectedSpells) : null),
    [selectedSpells]
  );

  const maxRangeCount = Math.max(...Object.values(rangeCounts), 1);

  const maxResourceCount = resourceCounts
    ? Math.max(...Object.values(resourceCounts), 1)
    : 1;

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

          {/*
            OUTER SLOT.

            Currently this is the optional C5 resource / requirements layer.
            Later, replace this block with the DPR-by-round layer.

            Example later:

            <DprByRoundLayer ... />

            Do not put DamageTypesLayer here. That is the damage TYPE layer,
            not the outer DPR layer.
          */}
          {SHOW_RESOURCE_LAYER && resourceCounts ? (
            <ResourceLayer
              resourceCounts={resourceCounts}
              maxResourceCount={maxResourceCount}
            />
          ) : null}

          {/*
            Future outer damage layer goes here when created.

            Example:
            {!SHOW_RESOURCE_LAYER ? (
              <DprByRoundLayer ... />
            ) : null}
          */}

          <DamageTypesLayer
            damageTypeCounts={damageTypeCounts}
            damageTypeTotal={damageTypeTotal}
          />

          <RoleDistributionLayer roleData={roleData} />

          <RangeProfileLayer
            rangeCounts={rangeCounts}
            maxRangeCount={maxRangeCount}
          />

          <SectionTitleLayer showResourceTitle={SHOW_RESOURCE_LAYER} />

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