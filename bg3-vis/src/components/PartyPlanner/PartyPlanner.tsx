import { useMemo } from "react";
import DataCircle from "../DataCircle";
import type { VisualizedBuildItem } from "../DataCircle/dataCircleTypes";
import type { ClassName } from "../../types/buildPlannerTypes";
import {
  createStableHash,
  createVisualProfileSummary,
  logStudyEvent,
} from "../../logic/studyLogger";
import type { VisualizedItemForLogging } from "../../types/loggingTypes";
import "./PartyPlanner.css";

export type PartyBuildSnapshot = {
  id: string;
  buildName: string;
  characterName: string;
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
  fixedClassFeatureIds: string[];
  selectedClassFeatureIds: string[];
  activeClassFeatureIds: string[];
  visualizedItems: VisualizedBuildItem[];
};

type PartyPlannerProps = {
  currentBuild: PartyBuildSnapshot;
  partySlots: Array<PartyBuildSnapshot | null>;
  onSaveCurrentToSlot: (slotIndex: number) => void;
  onLoadSlot: (slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
  activeView?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

function getBuildTitle(snapshot: PartyBuildSnapshot | null, fallback: string) {
  if (!snapshot) return fallback;

  return (
    snapshot.buildName.trim() ||
    snapshot.characterName.trim() ||
    snapshot.selectedSubclass ||
    snapshot.selectedClass ||
    fallback
  );
}

function getBuildSubtitle(snapshot: PartyBuildSnapshot | null) {
  if (!snapshot) {
    return "No build assigned";
  }

  const archetype =
    snapshot.selectedSubclass || snapshot.selectedClass || "Unassigned";

  return `Level ${snapshot.selectedLevel} · ${archetype} · ${snapshot.visualizedItems.length} visualized items`;
}

function createPartyBuildSummary(snapshot: PartyBuildSnapshot | null) {
  if (!snapshot) return null;

  return {
    id: snapshot.id,
    buildName: snapshot.buildName,
    characterName: snapshot.characterName,
    selectedClass: snapshot.selectedClass,
    selectedSubclass: snapshot.selectedSubclass,
    selectedLevel: snapshot.selectedLevel,
    selectedSpellCount: snapshot.selectedSpellIds.length,
    fixedClassFeatureCount: snapshot.fixedClassFeatureIds.length,
    selectedClassFeatureCount: snapshot.selectedClassFeatureIds.length,
    activeClassFeatureCount: snapshot.activeClassFeatureIds.length,
    visualizedItemCount: snapshot.visualizedItems.length,
    visualProfile: createVisualProfileSummary(
      snapshot.visualizedItems as unknown as VisualizedItemForLogging[]
    ),
    snapshotHash: createStableHash(snapshot, "party-build"),
  };
}

function createPartySlotsSummary(partySlots: Array<PartyBuildSnapshot | null>) {
  return partySlots.map((slot, slotIndex) => ({
    slotIndex,
    slotNumber: slotIndex + 1,
    isFilled: Boolean(slot),
    buildId: slot?.id ?? null,
    label: slot ? getBuildTitle(slot, `Member ${slotIndex + 1}`) : null,
    snapshotHash: slot ? createStableHash(slot, "party-build") : null,
    summary: createPartyBuildSummary(slot),
  }));
}

function createStandalonePartyHash(
  currentBuild: PartyBuildSnapshot,
  partySlots: Array<PartyBuildSnapshot | null>
) {
  return createStableHash(
    {
      currentBuildHash: createStableHash(currentBuild, "party-build"),
      slotHashes: partySlots.map((slot) =>
        slot ? createStableHash(slot, "party-build") : null
      ),
    },
    "party"
  );
}

export default function PartyPlanner({
  currentBuild,
  partySlots,
  onSaveCurrentToSlot,
  onLoadSlot,
  onClearSlot,
  activeView = "party-planner",
  activeFocusSource = "party-planner",
  partySnapshotHash,
}: PartyPlannerProps) {
  const filledSlots = partySlots.filter(Boolean).length;

  const resolvedPartySnapshotHash = useMemo(
    () =>
      partySnapshotHash ??
      createStandalonePartyHash(currentBuild, partySlots),
    [currentBuild, partySlots, partySnapshotHash]
  );

  const currentBuildSummary = useMemo(
    () => createPartyBuildSummary(currentBuild),
    [currentBuild]
  );

  const partySlotsSummary = useMemo(
    () => createPartySlotsSummary(partySlots),
    [partySlots]
  );

  function logPartyPlannerAction(
    eventType:
      | "party_slot_assigned"
      | "party_slot_focused"
      | "party_slot_cleared"
      | "invalid_selection_attempted",
    slotIndex: number,
    extraPayload: Record<string, unknown> = {}
  ) {
    const slot = partySlots[slotIndex];
    const slotNumber = slotIndex + 1;

    logStudyEvent({
      eventCategory:
        eventType === "invalid_selection_attempted" ? "friction" : "party",
      eventType,
      taskPhase:
        eventType === "invalid_selection_attempted"
          ? "exploration"
          : "party_review",
      activeView,
      activeBuildId: slot?.id ?? currentBuild.id ?? null,
      activeBuildLabel: slot
        ? getBuildTitle(slot, `Member ${slotNumber}`)
        : getBuildTitle(currentBuild, "Current editor build"),
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: `Member ${slotNumber}`,
      activeFocusSource,
      partySnapshotHash: resolvedPartySnapshotHash,
      payload: {
        sourceComponent: "PartyPlanner",
        slotIndex,
        slotNumber,
        slotWasFilled: Boolean(slot),
        filledSlotsBeforeAction: filledSlots,
        totalSlotCount: partySlots.length,
        currentBuildSummary,
        targetSlotSummary: createPartyBuildSummary(slot),
        partySlotsSummary,
        partySnapshotHash: resolvedPartySnapshotHash,
        ...extraPayload,
      },
    });
  }

  function handleAssignCurrent(slotIndex: number) {
    logPartyPlannerAction("party_slot_assigned", slotIndex, {
      action: "assign_current_build_to_slot",
      assignedBuildSummary: currentBuildSummary,
      previousSlotSummary: createPartyBuildSummary(partySlots[slotIndex]),
    });

    onSaveCurrentToSlot(slotIndex);
  }

  function handleLoadSlot(slotIndex: number) {
    const slot = partySlots[slotIndex];

    if (!slot) {
      logPartyPlannerAction("invalid_selection_attempted", slotIndex, {
        action: "load_empty_party_slot",
        reason: "slot_empty",
      });
      return;
    }

    logPartyPlannerAction("party_slot_focused", slotIndex, {
      action: "load_slot_into_editor",
      loadedBuildSummary: createPartyBuildSummary(slot),
    });

    onLoadSlot(slotIndex);
  }

  function handleClearSlot(slotIndex: number) {
    const slot = partySlots[slotIndex];

    if (!slot) {
      logPartyPlannerAction("invalid_selection_attempted", slotIndex, {
        action: "clear_empty_party_slot",
        reason: "slot_empty",
      });
      return;
    }

    logPartyPlannerAction("party_slot_cleared", slotIndex, {
      action: "clear_party_slot",
      clearedBuildSummary: createPartyBuildSummary(slot),
    });

    onClearSlot(slotIndex);
  }

  return (
    <section
      className="party-planner-panel"
      aria-label="Party planner"
      data-study-region="party-planner"
      data-study-id="party-planner"
    >
      <header
        className="party-planner-header"
        data-study-region="party-planner-header"
        data-study-id="party-planner-header"
      >
        <div>
          <p className="party-planner-eyebrow">Party Planner</p>
          <h2>Assigned Builds</h2>
        </div>

        <p
          className="party-planner-summary"
          data-study-id="party-planner-filled-count"
        >
          {filledSlots}/4 party builds assigned
        </p>
      </header>

      <div
        className="party-assignment-grid"
        data-study-region="party-assignment-grid"
      >
        {partySlots.map((snapshot, slotIndex) => {
          const slotNumber = slotIndex + 1;
          const fallbackTitle = `Member ${slotNumber}`;
          const isEmpty = !snapshot;

          return (
            <article
              key={`party-slot-${slotIndex}`}
              className={`party-build-window ${
                isEmpty ? "party-build-window--empty" : ""
              }`}
              data-study-region="party-build-window"
              data-study-id={`party-planner-slot-${slotNumber}`}
            >
              <header className="party-build-window-header">
                <div>
                  <span className="party-build-window-kicker">
                    Build {slotNumber}
                  </span>

                  <h3 data-study-id={`party-planner-slot-${slotNumber}-title`}>
                    {getBuildTitle(snapshot, fallbackTitle)}
                  </h3>

                  <p data-study-id={`party-planner-slot-${slotNumber}-subtitle`}>
                    {getBuildSubtitle(snapshot)}
                  </p>
                </div>
              </header>

              <div
                className="party-build-window-circle"
                data-study-region="party-build-window-circle"
                data-study-id={`party-planner-slot-${slotNumber}-circle`}
              >
                {snapshot ? (
                  <DataCircle
                    buildName={snapshot.buildName}
                    characterName={snapshot.characterName}
                    selectedClass={snapshot.selectedClass}
                    selectedSubclass={snapshot.selectedSubclass}
                    selectedLevel={snapshot.selectedLevel}
                    selectedSpellIds={snapshot.selectedSpellIds}
                    fixedClassFeatureIds={snapshot.fixedClassFeatureIds}
                    selectedClassFeatureIds={snapshot.selectedClassFeatureIds}
                    activeClassFeatureIds={snapshot.activeClassFeatureIds}
                    visualizedItemsOverride={snapshot.visualizedItems}
                    showDprLayer={false}
                    variant="party"
                    partySnapshotHash={resolvedPartySnapshotHash}
                  />
                ) : (
                  <div
                    className="party-build-empty-circle"
                    data-study-region="party-empty-slot-circle"
                    data-study-id={`party-planner-slot-${slotNumber}-empty-circle`}
                  >
                    <span>Assign build</span>
                  </div>
                )}
              </div>

              <div
                className="party-build-window-actions"
                data-study-region="party-build-window-actions"
              >
                <button
                  type="button"
                  onClick={() => handleAssignCurrent(slotIndex)}
                  title="Save the currently edited build into this party slot."
                  data-study-id={`party-planner-slot-${slotNumber}-assign-current`}
                >
                  Assign current
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadSlot(slotIndex)}
                  aria-disabled={isEmpty}
                  className={isEmpty ? "party-action--blocked" : ""}
                  title={
                    isEmpty
                      ? "This slot is empty, so it cannot be edited yet."
                      : "Load this party build into the main editor."
                  }
                  data-study-id={`party-planner-slot-${slotNumber}-edit`}
                >
                  Edit slot
                </button>

                <button
                  type="button"
                  onClick={() => handleClearSlot(slotIndex)}
                  aria-disabled={isEmpty}
                  className={isEmpty ? "party-action--blocked" : ""}
                  title={
                    isEmpty
                      ? "This slot is already empty."
                      : "Remove this build from the party slot."
                  }
                  data-study-id={`party-planner-slot-${slotNumber}-clear`}
                >
                  Clear
                </button>
              </div>

              {!isEmpty ? (
                <p className="party-build-window-note">
                  Edit loads this build into the main planner. After changing it,
                  assign current again to update the slot.
                </p>
              ) : (
                <p className="party-build-window-note">
                  Configure a build in the main planner, then assign it here.
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div
        className="party-active-build-reference"
        data-study-region="party-active-build-reference"
        data-study-id="party-active-build-reference"
      >
        <span>Current editor build</span>
        <strong data-study-id="party-active-build-reference-title">
          {currentBuild.buildName ||
            currentBuild.characterName ||
            currentBuild.selectedSubclass ||
            currentBuild.selectedClass ||
            "Untitled Build"}
        </strong>
      </div>
    </section>
  );
}