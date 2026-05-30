import { useMemo, useState } from "react";
import {
  clearStudyLogs,
  endAndExportStudySession,
  isStudySessionActive,
  loadStudySession,
  startStudySession,
} from "../logic/studyLogger";
import type { StudyLoggerEndPayload, StudySession } from "../types/loggingTypes";
import "./StudyLoggingPanel.css";

type StudyLoggingPanelProps = {
  activeView?: string | null;

  isPartyComplete?: boolean;
  finalPartyReady?: boolean;

  getFinalPayload?: () => StudyLoggerEndPayload;
  onSubmitFinalParty?: () => void;

  finalPartySnapshotSummary?: unknown;
  finalPartyVisualProfile?: unknown;
  finalPartyGaps?: unknown;
  finalRedundancyScore?: number | null;

  className?: string;
};

export default function StudyLoggingPanel({
  isPartyComplete,
  finalPartyReady,
  getFinalPayload,
  onSubmitFinalParty,
  finalPartySnapshotSummary,
  finalPartyVisualProfile,
  finalPartyGaps,
  finalRedundancyScore,
  className = "",
}: StudyLoggingPanelProps) {
  const [session, setSession] = useState<StudySession | null>(() =>
    loadStudySession()
  );
  const [participantId, setParticipantId] = useState(
    session?.participantId ?? ""
  );
  const [hasTriedStart, setHasTriedStart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRunning = session?.status === "running" || isStudySessionActive();
  const partyComplete = isPartyComplete ?? finalPartyReady ?? false;
  const hasParticipantId = participantId.trim().length > 0;

  const canStart = useMemo(() => {
    return hasParticipantId && !isRunning;
  }, [hasParticipantId, isRunning]);

  const participantError =
    hasTriedStart && !hasParticipantId
      ? "Participant ID is required before starting."
      : null;

  const readinessText = !hasParticipantId && !isRunning
    ? "Enter a participant ID before starting the study log."
    : partyComplete
      ? "Party complete. Ending will export the study log."
      : "Party incomplete. Ending still exports, but the final party will be marked incomplete.";

  function handleStart(): void {
    setHasTriedStart(true);
    setError(null);

    if (!hasParticipantId) {
      return;
    }

    try {
      const nextSession = startStudySession(participantId, {
        clearExistingLogs: true,
      });

      setSession(nextSession);
      setParticipantId(nextSession.participantId);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start the study."
      );
    }
  }

  function buildFinalPayload(): StudyLoggerEndPayload {
    const customPayload =
      typeof getFinalPayload === "function" ? getFinalPayload() : {};

    return {
      finalPartyComplete: partyComplete,
      finalPartySnapshotSummary,
      finalPartyVisualProfile,
      finalPartyGaps,
      finalRedundancyScore: finalRedundancyScore ?? null,
      ...customPayload,
    };
  }

  function handleEndAndExport(): void {
    setError(null);

    try {
      if (typeof onSubmitFinalParty === "function") {
        onSubmitFinalParty();
      }

      endAndExportStudySession(buildFinalPayload());
      setSession(loadStudySession());
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not export the study log."
      );
    }
  }

  function handleClearLogs(): void {
    clearStudyLogs({ clearSession: true });
    setSession(null);
    setParticipantId("");
    setHasTriedStart(false);
    setError(null);
  }

  return (
    <section
      className={`study-logging-panel ${
        isRunning ? "study-logging-panel--running" : ""
      } ${className}`.trim()}
      data-study-region="study-logging-panel"
      data-study-element="study-logging-panel"
    >
      <div className="study-logging-header">
        <div>
          <h3>Study logging</h3>
        </div>

        <span
          className={
            isRunning
              ? "study-logging-status study-logging-status--running"
              : "study-logging-status"
          }
        >
          {isRunning ? "Running" : "Not running"}
        </span>
      </div>

      <label className="study-logging-field">
        <span>Participant ID</span>
        <input
          value={participantId}
          disabled={isRunning}
          onChange={(event) => {
            setParticipantId(event.target.value);
            if (hasTriedStart) setError(null);
          }}
          onBlur={() => setHasTriedStart(true)}
          placeholder="e.g. P01"
          aria-invalid={Boolean(participantError)}
          data-study-element="participant-id-input"
        />
      </label>

      {participantError && (
        <div className="study-logging-error">{participantError}</div>
      )}

      <div
        className={
          partyComplete
            ? "study-logging-readiness study-logging-readiness--ready"
            : "study-logging-readiness"
        }
      >
        <span
          className={
            partyComplete
              ? "study-logging-readiness-dot study-logging-readiness-dot--ready"
              : "study-logging-readiness-dot"
          }
        />
        <p>{readinessText}</p>
      </div>

      {error && <div className="study-logging-error">{error}</div>}

      <div className="study-logging-actions">
        <button
          type="button"
          className="study-logging-button study-logging-button--primary"
          onClick={handleStart}
          disabled={!canStart}
          data-study-element="start-study-button"
        >
          Start
        </button>

        <button
          type="button"
          className="study-logging-button study-logging-button--export"
          onClick={handleEndAndExport}
          disabled={!isRunning}
          data-study-element="end-study-export-button"
        >
          End & export
        </button>

        <button
          type="button"
          className="study-logging-button study-logging-button--ghost"
          onClick={handleClearLogs}
          disabled={isRunning}
          data-study-element="clear-study-logs-button"
        >
          Clear logs
        </button>
      </div>
    </section>
  );
}