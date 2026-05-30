import { useEffect, useMemo, useRef } from "react";
import type { ClassName, RaceName } from "../types/buildPlannerTypes";
import { createStableHash, logStudyEvent } from "../logic/studyLogger";

type BuildSummaryProps = {
  buildName: string;
  selectedRace: RaceName | "";
  selectedClass: ClassName | "";
  selectedLevel: number;

  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

function BuildSummary({
  buildName,
  selectedRace,
  selectedClass,
  selectedLevel,
  activeView = "build-summary",
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: BuildSummaryProps) {
  const lastLoggedSummaryHashRef = useRef<string | null>(null);

  const summaryPayload = useMemo(() => {
    const visibleSummary = {
      buildName: buildName || "Untitled Build",
      selectedRace: selectedRace || "Not selected",
      selectedClass: selectedClass || "Not selected",
      selectedLevel,
      hasBuildName: buildName.trim().length > 0,
      hasSelectedRace: selectedRace !== "",
      hasSelectedClass: selectedClass !== "",
      isClassSelected: selectedClass !== "",
      isRaceSelected: selectedRace !== "",
    };

    return {
      visibleSummary,
      summaryHash: createStableHash(visibleSummary, "build-summary"),
      completionFlags: {
        hasBuildName: visibleSummary.hasBuildName,
        hasSelectedRace: visibleSummary.hasSelectedRace,
        hasSelectedClass: visibleSummary.hasSelectedClass,
        hasSelectedLevel: Number.isFinite(selectedLevel),
      },
    };
  }, [buildName, selectedRace, selectedClass, selectedLevel]);

  useEffect(() => {
    if (lastLoggedSummaryHashRef.current === summaryPayload.summaryHash) {
      return;
    }

    lastLoggedSummaryHashRef.current = summaryPayload.summaryHash;

    logStudyEvent({
      eventCategory: "build_state",
      eventType: "build_summary_updated",
      taskPhase: "exploration",
      activeView,
      activeBuildId,
      activeBuildLabel:
        activeBuildLabel ||
        buildName ||
        selectedClass ||
        selectedRace ||
        "Untitled Build",
      activePartyMemberIndex,
      activePartyMemberLabel,
      activeFocusSource,
      partySnapshotHash,
      payload: summaryPayload,
    });
  }, [
    summaryPayload,
    activeView,
    activeBuildId,
    activeBuildLabel,
    activePartyMemberIndex,
    activePartyMemberLabel,
    activeFocusSource,
    partySnapshotHash,
    buildName,
    selectedClass,
    selectedRace,
  ]);

  return (
    <aside
      className="summary-card"
      data-study-region="build-summary"
      data-study-id="current-build-summary"
    >
      <h2 data-study-id="current-build-summary-title">Current Build</h2>

      <div className="summary-row" data-study-id="summary-build-name-row">
        <span>Name</span>
        <strong data-study-element="summary-build-name">
          {buildName || "Untitled Build"}
        </strong>
      </div>

      <div className="summary-row" data-study-id="summary-race-row">
        <span>Race</span>
        <strong data-study-element="summary-race">
          {selectedRace || "Not selected"}
        </strong>
      </div>

      <div className="summary-row" data-study-id="summary-class-row">
        <span>Class</span>
        <strong data-study-element="summary-class">
          {selectedClass || "Not selected"}
        </strong>
      </div>

      <div className="summary-row" data-study-id="summary-level-row">
        <span>Level</span>
        <strong data-study-element="summary-level">{selectedLevel}</strong>
      </div>
    </aside>
  );
}

export default BuildSummary;