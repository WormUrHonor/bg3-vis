import { useEffect, useMemo, useRef, useState } from "react";
import type { BuildEditorSnapshot, SavedBuild } from "../types/savedBuildTypes";
import {
  formatSavedBuildDate,
  getDefaultSavedBuildLabel,
} from "../logic/savedBuildStorage";
import {
  createBuildSnapshotSummary,
  createStableHash,
  logFrictionEvent,
  logStudyEvent,
} from "../logic/studyLogger";

type SavedBuildsPanelProps = {
  currentSnapshot: BuildEditorSnapshot;
  savedBuilds: SavedBuild[];
  partySlots: Array<SavedBuild | null>;
  onSaveNew: () => void;
  onOverwrite: (buildId: string) => void;
  onLoad: (buildId: string) => void;
  onLoadIntoPartySlot: (buildId: string, slotIndex: number) => void;
  onClearPartySlot: (slotIndex: number) => void;
  onDelete: (buildId: string) => void;

  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

const SAVED_BUILD_HOVER_DWELL_MS = 600;

function getSnapshotSubtitle(snapshot: BuildEditorSnapshot) {
  const classLabel =
    snapshot.selectedSubclass || snapshot.selectedClass || "No class";
  const raceLabel =
    snapshot.selectedSubrace || snapshot.selectedRace || "No race";

  return `Level ${snapshot.selectedLevel} · ${classLabel} · ${raceLabel}`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getSavedBuildSearchScore(savedBuild: SavedBuild, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return 0;

  const label = normalizeSearchValue(savedBuild.label);
  const buildName = normalizeSearchValue(savedBuild.snapshot.buildName);
  const characterName = normalizeSearchValue(savedBuild.snapshot.characterName);
  const className = normalizeSearchValue(savedBuild.snapshot.selectedClass);
  const subclass = normalizeSearchValue(savedBuild.snapshot.selectedSubclass);
  const race = normalizeSearchValue(savedBuild.snapshot.selectedRace);
  const subrace = normalizeSearchValue(savedBuild.snapshot.selectedSubrace);

  const searchableText = [
    label,
    buildName,
    characterName,
    className,
    subclass,
    race,
    subrace,
  ].join(" ");

  if (label === normalizedQuery || buildName === normalizedQuery) return 100;
  if (label.startsWith(normalizedQuery) || buildName.startsWith(normalizedQuery)) {
    return 80;
  }
  if (label.includes(normalizedQuery) || buildName.includes(normalizedQuery)) {
    return 60;
  }
  if (characterName.includes(normalizedQuery)) return 45;
  if (subclass.includes(normalizedQuery) || className.includes(normalizedQuery)) {
    return 30;
  }
  if (subrace.includes(normalizedQuery) || race.includes(normalizedQuery)) {
    return 20;
  }
  if (searchableText.includes(normalizedQuery)) return 10;

  return -1;
}

function getSavedBuildTitle(savedBuild: SavedBuild) {
  return (
    savedBuild.label ||
    savedBuild.snapshot.buildName ||
    savedBuild.snapshot.characterName ||
    savedBuild.snapshot.selectedSubclass ||
    savedBuild.snapshot.selectedClass ||
    "Untitled Build"
  );
}

function createSavedBuildSummary(savedBuild: SavedBuild | null) {
  if (!savedBuild) return null;

  return {
    savedBuildId: savedBuild.id,
    label: savedBuild.label,
    createdAt: savedBuild.createdAt,
    updatedAt: savedBuild.updatedAt,
    subtitle: getSnapshotSubtitle(savedBuild.snapshot),
    snapshotHash: createStableHash(savedBuild.snapshot, "build"),
    snapshotSummary: createBuildSnapshotSummary(savedBuild.snapshot),
  };
}

function createPartySlotSummary(
  slot: SavedBuild | null,
  slotIndex: number
) {
  return {
    slotIndex,
    slotNumber: slotIndex + 1,
    isFilled: Boolean(slot),
    savedBuildId: slot?.id ?? null,
    label: slot?.label ?? null,
    snapshotHash: slot?.snapshot
      ? createStableHash(slot.snapshot, "build")
      : null,
    snapshotSummary: slot?.snapshot
      ? createBuildSnapshotSummary(slot.snapshot)
      : null,
  };
}

function createPartySlotsSummary(partySlots: Array<SavedBuild | null>) {
  return partySlots.map((slot, index) => createPartySlotSummary(slot, index));
}

export default function SavedBuildsPanel({
  currentSnapshot,
  savedBuilds,
  partySlots,
  onSaveNew,
  onOverwrite,
  onLoad,
  onLoadIntoPartySlot,
  onClearPartySlot,
  onDelete,
  activeView = "saved-builds-panel",
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: SavedBuildsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hasMountedRef = useRef(false);
  const hoveredBuildIdRef = useRef<string | null>(null);
  const hoveredBuildStartedAtRef = useRef<number | null>(null);

  const currentBuildLabel = getDefaultSavedBuildLabel(currentSnapshot);

  const currentSnapshotSummary = useMemo(
    () => createBuildSnapshotSummary(currentSnapshot),
    [currentSnapshot]
  );

  const currentSnapshotHash = useMemo(
    () => createStableHash(currentSnapshot, "build"),
    [currentSnapshot]
  );

  const partySlotsSummary = useMemo(
    () => createPartySlotsSummary(partySlots),
    [partySlots]
  );

  const filteredSavedBuilds = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);

    if (!normalizedQuery) return savedBuilds;

    return savedBuilds
      .map((savedBuild) => ({
        savedBuild,
        score: getSavedBuildSearchScore(savedBuild, normalizedQuery),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        return (
          new Date(b.savedBuild.updatedAt).getTime() -
          new Date(a.savedBuild.updatedAt).getTime()
        );
      })
      .map((entry) => entry.savedBuild);
  }, [savedBuilds, searchQuery]);

  function getLoggingContext(savedBuild?: SavedBuild | null) {
    return {
      activeView,
      activeBuildId: savedBuild?.id ?? activeBuildId,
      activeBuildLabel:
        savedBuild?.label ??
        activeBuildLabel ??
        currentBuildLabel ??
        null,
      activePartyMemberIndex,
      activePartyMemberLabel,
      activeFocusSource,
      partySnapshotHash,
    };
  }

  function createPanelStatePayload() {
    return {
      sourceComponent: "SavedBuildsPanel",
      searchQueryLength: searchQuery.length,
      hasSearchQuery: searchQuery.trim().length > 0,
      matchingBuildCount: filteredSavedBuilds.length,
      totalSavedBuildCount: savedBuilds.length,
      filledPartySlotCount: partySlots.filter(Boolean).length,
      totalPartySlotCount: partySlots.length,
      currentBuildLabel,
      currentSnapshotHash,
      currentSnapshotSummary,
      partySlotsSummary,
      partySnapshotHash,
    };
  }

  function logPanelAction(
    eventType: string,
    payload: Record<string, unknown>,
    savedBuild?: SavedBuild | null
  ) {
    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType,
      taskPhase: "exploration",
      ...getLoggingContext(savedBuild),
      payload: {
        ...createPanelStatePayload(),
        ...payload,
      },
    });
  }

  function logInvalidPanelAction(
    targetType: string,
    targetId: string,
    reason: string,
    payload: Record<string, unknown> = {}
  ) {
logFrictionEvent(
  "invalid_selection_attempted",
  {
    ...createPanelStatePayload(),
    targetType,
    targetId,
    reason,
    ...payload,
  },
  getLoggingContext()
);
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logStudyEvent({
        eventCategory: "navigation",
        eventType: "saved_build_search_changed",
        taskPhase: "exploration",
        ...getLoggingContext(),
        payload: {
          ...createPanelStatePayload(),
          searchQuery,
          matchingBuildIds: filteredSavedBuilds.map((build) => build.id),
          matchingBuildLabels: filteredSavedBuilds.map((build) => build.label),
        },
      });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [
    searchQuery,
    filteredSavedBuilds,
    savedBuilds.length,
    partySlots,
    currentSnapshotHash,
    partySnapshotHash,
  ]);

  function handleSaveNew() {
    logPanelAction("save_current_build_clicked", {
      action: "save_current_build",
      currentSnapshotHash,
      currentSnapshotSummary,
      currentBuildLabel,
      savedBuildCountBeforeAction: savedBuilds.length,
    });

    onSaveNew();
  }

  function handleLoad(savedBuild: SavedBuild) {
    logPanelAction(
      "saved_build_load_clicked",
      {
        action: "load_saved_build",
        targetBuildSummary: createSavedBuildSummary(savedBuild),
        currentSnapshotHashBeforeLoad: currentSnapshotHash,
        currentSnapshotSummaryBeforeLoad: currentSnapshotSummary,
      },
      savedBuild
    );

    onLoad(savedBuild.id);
  }

  function handleOverwrite(savedBuild: SavedBuild) {
    logPanelAction(
      "saved_build_update_clicked",
      {
        action: "overwrite_saved_build_with_current",
        targetBuildSummary: createSavedBuildSummary(savedBuild),
        targetSnapshotHashBeforeOverwrite: createStableHash(
          savedBuild.snapshot,
          "build"
        ),
        currentSnapshotHash,
        currentSnapshotSummary,
      },
      savedBuild
    );

    onOverwrite(savedBuild.id);
  }

  function handleDelete(savedBuild: SavedBuild) {
    logPanelAction(
      "saved_build_delete_clicked",
      {
        action: "delete_saved_build",
        targetBuildSummary: createSavedBuildSummary(savedBuild),
        wasAssignedToPartySlot: partySlots.some(
          (slot) => slot?.id === savedBuild.id
        ),
        assignedPartySlotIndexes: partySlots
          .map((slot, index) => (slot?.id === savedBuild.id ? index : null))
          .filter((index): index is number => index !== null),
      },
      savedBuild
    );

    onDelete(savedBuild.id);
  }

  function handleLoadIntoPartySlot(savedBuild: SavedBuild, slotIndex: number) {
    const previousSlot = partySlots[slotIndex];

    logStudyEvent({
      eventCategory: "party",
      eventType: "saved_build_send_to_party_clicked",
      taskPhase: "party_review",
      ...getLoggingContext(savedBuild),
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: `Member ${slotIndex + 1}`,
      payload: {
        ...createPanelStatePayload(),
        action: "send_saved_build_to_party_slot",
        slotIndex,
        slotNumber: slotIndex + 1,
        targetBuildSummary: createSavedBuildSummary(savedBuild),
        previousSlotSummary: createPartySlotSummary(previousSlot, slotIndex),
        willOverwriteFilledSlot: Boolean(previousSlot),
      },
    });

    onLoadIntoPartySlot(savedBuild.id, slotIndex);
  }

  function handleClearPartySlot(slotIndex: number) {
    const slot = partySlots[slotIndex];

    if (!slot) {
      logInvalidPanelAction(
        "party-slot-clear",
        `party-slot-${slotIndex + 1}`,
        "party_slot_already_empty",
        {
          slotIndex,
          slotNumber: slotIndex + 1,
          targetSlotSummary: createPartySlotSummary(slot, slotIndex),
        }
      );
      return;
    }

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_clear_clicked",
      taskPhase: "party_review",
      ...getLoggingContext(slot),
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: `Member ${slotIndex + 1}`,
      payload: {
        ...createPanelStatePayload(),
        action: "clear_party_slot",
        slotIndex,
        slotNumber: slotIndex + 1,
        clearedSlotSummary: createPartySlotSummary(slot, slotIndex),
      },
    });

    onClearPartySlot(slotIndex);
  }

  function handleCardHoverStart(savedBuild: SavedBuild) {
    hoveredBuildIdRef.current = savedBuild.id;
    hoveredBuildStartedAtRef.current = Date.now();

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "saved_build_card_hover_started",
      taskPhase: "exploration",
      ...getLoggingContext(savedBuild),
      payload: {
        ...createPanelStatePayload(),
        targetBuildSummary: createSavedBuildSummary(savedBuild),
      },
    });
  }

  function handleCardHoverEnd(savedBuild: SavedBuild) {
    const startedAtMs = hoveredBuildStartedAtRef.current;
    const durationMs = startedAtMs ? Date.now() - startedAtMs : 0;
    const wasSameBuild = hoveredBuildIdRef.current === savedBuild.id;

    if (wasSameBuild) {
      logStudyEvent({
        eventCategory: "build_lifecycle",
        eventType: "saved_build_card_hover_ended",
        taskPhase: "exploration",
        ...getLoggingContext(savedBuild),
        payload: {
          ...createPanelStatePayload(),
          targetBuildSummary: createSavedBuildSummary(savedBuild),
          durationMs,
          producedDwell: durationMs >= SAVED_BUILD_HOVER_DWELL_MS,
        },
      });

      if (durationMs >= SAVED_BUILD_HOVER_DWELL_MS) {
        logStudyEvent({
          eventCategory: "build_lifecycle",
          eventType: "saved_build_card_hover_dwell",
          taskPhase: "exploration",
          ...getLoggingContext(savedBuild),
          payload: {
            ...createPanelStatePayload(),
            targetBuildSummary: createSavedBuildSummary(savedBuild),
            dwellDurationMs: durationMs,
          },
        });
      }
    }

    hoveredBuildIdRef.current = null;
    hoveredBuildStartedAtRef.current = null;
  }

  return (
    <section
      className="saved-builds-panel"
      aria-label="Saved builds"
      data-study-region="saved-builds-panel"
      data-study-id="saved-builds-panel"
    >
      <div
        className="saved-builds-header"
        data-study-region="saved-builds-header"
      >
        <div>
          <h3>Saved Builds</h3>
          <p>Save, reload, or assign builds to party slots.</p>
        </div>

        <span data-study-id="saved-build-count">{savedBuilds.length}</span>
      </div>

      <div
        className="saved-builds-save-row saved-builds-save-row--single"
        data-study-region="saved-builds-save-row"
      >
        <button
          type="button"
          onClick={handleSaveNew}
          data-study-id="save-current-build-button"
        >
          Save current build
        </button>
      </div>

      <div
        className="saved-builds-current-name"
        data-study-region="saved-builds-current-name"
        data-study-id="saved-builds-current-name"
      >
        <span>Saved as</span>
        <strong>{currentBuildLabel}</strong>
      </div>

      <section
        className="saved-party-slots"
        aria-label="Current party slots"
        data-study-region="saved-party-slots"
      >
        {partySlots.map((slot, index) => (
          <article
            className="saved-party-slot"
            key={`party-slot-${index}`}
            data-study-region="saved-party-slot"
            data-study-id={`saved-party-slot-${index + 1}`}
          >
            <div>
              <span>Party {index + 1}</span>
              <strong>{slot ? slot.label : "Empty slot"}</strong>
            </div>

            <button
              type="button"
              onClick={() => handleClearPartySlot(index)}
              aria-disabled={!slot}
              className={!slot ? "saved-builds-button--blocked" : ""}
              data-study-id={`clear-party-slot-${index + 1}`}
              title={
                slot
                  ? `Clear ${slot.label} from party slot ${index + 1}.`
                  : `Party slot ${index + 1} is already empty.`
              }
            >
              Clear
            </button>
          </article>
        ))}
      </section>

      <label
        className="saved-builds-search"
        data-study-region="saved-builds-search"
        data-study-id="saved-builds-search"
      >
        Search builds
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by build, character, class, race..."
          data-study-element="saved-build-search-input"
          data-study-id="saved-build-search-input"
        />
      </label>

      <div
        className="saved-builds-list"
        data-study-region="saved-builds-list"
      >
        {filteredSavedBuilds.length === 0 ? (
          <p
            className="saved-builds-empty"
            data-study-id={
              savedBuilds.length === 0
                ? "saved-builds-empty-list"
                : "saved-builds-empty-search-results"
            }
          >
            {savedBuilds.length === 0
              ? "No saved builds yet."
              : "No saved builds match this search."}
          </p>
        ) : (
          filteredSavedBuilds.map((savedBuild) => (
            <article
              className="saved-build-card"
              key={savedBuild.id}
              data-study-region="saved-build-card"
              data-study-id={`saved-build-card-${savedBuild.id}`}
              onMouseEnter={() => handleCardHoverStart(savedBuild)}
              onMouseLeave={() => handleCardHoverEnd(savedBuild)}
              onFocus={() => handleCardHoverStart(savedBuild)}
              onBlur={() => handleCardHoverEnd(savedBuild)}
            >
              <div className="saved-build-card-main">
                <strong data-study-id={`saved-build-label-${savedBuild.id}`}>
                  {savedBuild.label}
                </strong>

                <p>{getSnapshotSubtitle(savedBuild.snapshot)}</p>

                <span>
                  Updated {formatSavedBuildDate(savedBuild.updatedAt)}
                </span>
              </div>

              <div
                className="saved-build-card-actions"
                data-study-region="saved-build-card-actions"
              >
                <button
                  type="button"
                  onClick={() => handleLoad(savedBuild)}
                  data-study-id={`load-saved-build-${savedBuild.id}`}
                >
                  Load
                </button>

                <button
                  type="button"
                  onClick={() => handleOverwrite(savedBuild)}
                  data-study-id={`update-saved-build-${savedBuild.id}`}
                >
                  Update
                </button>

                <button
                  type="button"
                  className="saved-build-delete-button"
                  onClick={() => handleDelete(savedBuild)}
                  data-study-id={`delete-saved-build-${savedBuild.id}`}
                >
                  Delete
                </button>
              </div>

              <div
                className="saved-build-party-actions"
                data-study-region="saved-build-party-actions"
              >
                <span>Send to party</span>

                {[0, 1, 2].map((slotIndex) => (
                  <button
                    key={`${savedBuild.id}-party-${slotIndex}`}
                    type="button"
                    onClick={() =>
                      handleLoadIntoPartySlot(savedBuild, slotIndex)
                    }
                    data-study-id={`send-saved-build-${savedBuild.id}-to-party-${
                      slotIndex + 1
                    }`}
                  >
                    {slotIndex + 1}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}