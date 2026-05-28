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
  updateStudySessionMetadata,
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
  return Boolean(metadata.taskStartedAt) && metadata.isLoggingEnabled;
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

  const taskIsActive = hasActiveTask(metadata);

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
      Do not log metadata typing before the task starts. This keeps the real
      study logs clean and avoids partial participant/task IDs in the dataset.
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
    if (!canStart || taskIsActive) return;

    const nextMetadata = startStudyTask();

    setMetadata(nextMetadata);
    refreshLogCount();
  }

  function logFinalPartySubmission() {
    logStudyEvent({
      eventCategory: "task",
      eventType: "final_party_submitted",
      activeBuildLabel: focusedLabel,
      activeView: "study-logging-panel",
      payload: getDefaultPartyPayload(currentSnapshot, partySlots),
    });
  }

  function handleEndTask() {
    if (!taskIsActive) return;

    const finalPartyPayload = getDefaultPartyPayload(currentSnapshot, partySlots);

    logFinalPartySubmission();

    completeStudyTask({
      focusedLabel,
      finalPartyPreview: finalPartyPayload,
    });

    /*
      Export after final_party_submitted and task_completed have been written,
      so the downloaded JSONL is the complete study-task file.
    */
    downloadStudyLogs("jsonl");

    const nextMetadata = updateStudySessionMetadata({
      isLoggingEnabled: false,
      taskStartedAt: null,
    });

    setMetadata(nextMetadata);
    refreshLogCount();
  }

  function handleClearLogs() {
    /*
      Fallback reset. Use this before the next participant/task, after confirming
      that the exported JSONL file has downloaded correctly.
    */
    clearStudyLogs();
    refreshLogCount();
  }

  return (
    <section className="study-logging-panel" aria-label="Study logging controls">
      <div className="study-logging-header">
        <div>
          <h3>Study Logging</h3>
          <p>Start recording, end task to submit and export JSONL.</p>
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

      <div
        className={
          taskIsActive
            ? "study-logging-recording study-logging-recording--active"
            : "study-logging-recording"
        }
      >
        {taskIsActive ? "Recording" : canStart ? "Ready" : "Setup required"}
      </div>

      <div className="study-logging-actions study-logging-actions--single-row">
  <button
    type="button"
    onClick={handleStartTask}
    disabled={!canStart || taskIsActive}
  >
    Start
  </button>

  <button type="button" onClick={handleEndTask} disabled={!taskIsActive}>
    End task
  </button>

  <button type="button" onClick={handleClearLogs}>
    Clear
  </button>
</div>
    </section>
  );
}