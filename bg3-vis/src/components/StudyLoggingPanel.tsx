import { useMemo, useState } from "react";
import {
  clearStudyLogs,
  completeStudyTask,
  downloadStudyLogs,
  loadStudyLogs,
  loadStudySessionMetadata,
  logStudyEvent,
  saveStudySessionMetadata,
  startStudyTask,
} from "../logic/studyLogger";
import type { BuildEditorSnapshot, SavedBuild } from "../types/savedBuildTypes";
import type { StudySessionMetadata } from "../types/loggingTypes";

type StudyLoggingPanelProps = {
  currentSnapshot: BuildEditorSnapshot;
  partySlots: Array<SavedBuild | null>;
  focusedLabel: string;
};

function getDefaultPartyPayload(
  currentSnapshot: BuildEditorSnapshot,
  partySlots: Array<SavedBuild | null>
) {
  return {
    focusedBuild: currentSnapshot,
    partySlots: partySlots.map((slot, index) => ({
      slotIndex: index,
      slotNumber: index + 1,
      savedBuildId: slot?.id ?? null,
      label: slot?.label ?? null,
      snapshot: slot?.snapshot ?? null,
    })),
  };
}

function hasActiveTask(metadata: StudySessionMetadata) {
  return Boolean(metadata.taskStartedAt);
}

export default function StudyLoggingPanel({
  currentSnapshot,
  partySlots,
  focusedLabel,
}: StudyLoggingPanelProps) {
  const [metadata, setMetadata] = useState<StudySessionMetadata>(() =>
    loadStudySessionMetadata()
  );

  const [logCount, setLogCount] = useState(() => loadStudyLogs().length);

  const canStart = useMemo(
    () =>
      metadata.participantId.trim().length > 0 &&
      metadata.sessionId.trim().length > 0 &&
      metadata.taskId.trim().length > 0,
    [metadata.participantId, metadata.sessionId, metadata.taskId]
  );

  const taskIsActive = hasActiveTask(metadata) && metadata.isLoggingEnabled;

  function refreshLogCount() {
    setLogCount(loadStudyLogs().length);
  }

  function updateMetadata(patch: Partial<StudySessionMetadata>) {
    const nextMetadata = {
      ...metadata,
      ...patch,
    };

    setMetadata(nextMetadata);
    saveStudySessionMetadata(nextMetadata);

    /*
      Metadata edits are only logged after a task is active. This avoids messy
      logs where typing "P001" becomes P, P0, P00, P001.
    */
    if (taskIsActive) {
      logStudyEvent({
        eventCategory: "session",
        eventType: "study_session_metadata_updated",
        activeView: "study-logging-panel",
        payload: {
          changedFields: Object.keys(patch),
          metadata: nextMetadata,
        },
      });

      refreshLogCount();
    }
  }

  function handleStartTask() {
    if (!canStart) return;

    const nextMetadata = startStudyTask();

    setMetadata(nextMetadata);
    refreshLogCount();
  }

  function handleSubmitFinalParty() {
    if (!taskIsActive) return;

    logStudyEvent({
      eventCategory: "task",
      eventType: "final_party_submitted",
      activeBuildLabel: focusedLabel,
      activeView: "study-logging-panel",
      payload: getDefaultPartyPayload(currentSnapshot, partySlots),
    });

    refreshLogCount();
  }

  function handleCompleteTask() {
    if (!taskIsActive) return;

    completeStudyTask({
      focusedLabel,
      finalPartyPreview: getDefaultPartyPayload(currentSnapshot, partySlots),
    });

    /*
      The task is now finished. Logging stays enabled so the export event can
      still be recorded, but taskStartedAt remains in metadata so elapsed time
      is preserved in the exported log.
    */
    refreshLogCount();
  }

  function handleExport() {
    /*
      One export format only. This is the researcher-facing study file.
      JSON keeps all nested payloads, including build snapshots and party state.
    */
    downloadStudyLogs("json");
    refreshLogCount();
  }

function handleClearLogs() {
  clearStudyLogs();
  refreshLogCount();
}
  return (
    <section className="study-logging-panel" aria-label="Study logging controls">
      <div className="study-logging-header">
        <div>
          <h3>Study Logging</h3>
          <p>Start task, submit final party, end task, then export.</p>
        </div>

        <span>{logCount}</span>
      </div>

      <div className="study-logging-grid">
        <label>
          Participant
          <input
            type="text"
            value={metadata.participantId}
            placeholder="P001"
            disabled={taskIsActive}
            onChange={(event) =>
              updateMetadata({ participantId: event.target.value })
            }
          />
        </label>

        <label>
          Session
          <input
            type="text"
            value={metadata.sessionId}
            disabled={taskIsActive}
            onChange={(event) =>
              updateMetadata({ sessionId: event.target.value })
            }
          />
        </label>

        <label>
          Task
          <input
            type="text"
            value={metadata.taskId}
            placeholder="T1"
            disabled={taskIsActive}
            onChange={(event) => updateMetadata({ taskId: event.target.value })}
          />
        </label>

        <label>
          Condition
          <select
            value={metadata.conditionId}
            disabled={taskIsActive}
            onChange={(event) =>
              updateMetadata({ conditionId: event.target.value })
            }
          >
            <option value="baseline">baseline</option>
            <option value="redesigned">redesigned</option>
          </select>
        </label>

        <label>
          Order
          <select
            value={metadata.conditionSequenceIndex}
            disabled={taskIsActive}
            onChange={(event) =>
              updateMetadata({
                conditionSequenceIndex: Number(event.target.value),
              })
            }
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>

        <label>
          Scenario
          <input
            type="text"
            value={metadata.activeScenarioPreset}
            placeholder="default"
            disabled={taskIsActive}
            onChange={(event) =>
              updateMetadata({ activeScenarioPreset: event.target.value })
            }
          />
        </label>
      </div>

      <label className="study-logging-toggle">
        <input
          type="checkbox"
          checked={metadata.isLoggingEnabled}
          onChange={(event) =>
            updateMetadata({ isLoggingEnabled: event.target.checked })
          }
        />
        Logging enabled
      </label>

      <div className="study-logging-status">
        {taskIsActive ? (
          <span>Task is recording.</span>
        ) : canStart ? (
          <span>Ready to start.</span>
        ) : (
          <span>Enter participant and task before starting.</span>
        )}
      </div>

      <div className="study-logging-actions study-logging-actions--main">
        <button type="button" onClick={handleStartTask} disabled={!canStart}>
          Start
        </button>

        <button
          type="button"
          onClick={handleSubmitFinalParty}
          disabled={!taskIsActive}
        >
          Submit party
        </button>

        <button type="button" onClick={handleCompleteTask} disabled={!taskIsActive}>
          End
        </button>
      </div>

      <div className="study-logging-actions study-logging-actions--export">
        <button type="button" onClick={handleExport} disabled={logCount <= 0}>
          Export
        </button>

        <button type="button" onClick={handleClearLogs}>
          Clear
        </button>
      </div>
    </section>
  );
}