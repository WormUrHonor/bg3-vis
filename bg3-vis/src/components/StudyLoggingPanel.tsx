import { useMemo, useState } from "react";
import {
  clearStudyLogs,
  endAndExportStudySession,
  isStudySessionActive,
  loadStudySession,
  logStudyEvent,
  startStudySession,
} from "../logic/studyLogger";
import type { StudyLoggerEndPayload, StudySession } from "../types/loggingTypes";
import StudySurveyModal, {
  type StudySurveySubmission,
} from "./StudySurveyModal";
import "./StudyLoggingPanel.css";

type StudyLoggingPanelProps = {
  activeView?: string | null;
  isPartyComplete?: boolean;
  getFinalPayload?: () => StudyLoggerEndPayload;
  finalPartySnapshotSummary?: unknown;
  finalPartyVisualProfile?: unknown;
  finalPartyGaps?: unknown;
  finalRedundancyScore?: number | null;
  className?: string;

  [key: string]: unknown;
};

type StoredSurveyCache = {
  participantId: string;
  sessionId?: string | null;
  preTaskSurvey?: StudySurveySubmission | null;
  postTaskSurvey?: StudySurveySubmission | null;
  lastSurveyExportFilename?: string | null;
  updatedAt: string;
};

const STUDY_SURVEY_CACHE_PREFIX = "bg3-study-survey-cache-v1";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function safeFilenamePart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "unknown-participant";
}

function getSurveyCacheKey(participantId: string): string {
  return `${STUDY_SURVEY_CACHE_PREFIX}:${safeFilenamePart(participantId)}`;
}

function loadSurveyCache(participantId: string): StoredSurveyCache | null {
  if (!hasWindow() || !participantId.trim()) return null;

  try {
    const raw = window.localStorage.getItem(getSurveyCacheKey(participantId));
    return raw ? (JSON.parse(raw) as StoredSurveyCache) : null;
  } catch {
    return null;
  }
}

function saveSurveyCache(cache: StoredSurveyCache): void {
  if (!hasWindow()) return;

  try {
    window.localStorage.setItem(
      getSurveyCacheKey(cache.participantId),
      JSON.stringify(cache)
    );
  } catch {
    // Ignore localStorage errors.
  }
}

function removeSurveyCache(participantId: string): void {
  if (!hasWindow() || !participantId.trim()) return;

  try {
    window.localStorage.removeItem(getSurveyCacheKey(participantId));
  } catch {
    // Ignore localStorage errors.
  }
}

function exportSurveyAnswersAsJson(payload: unknown, participantId: string): string {
  if (!hasWindow()) {
    throw new Error("Survey export is only available in the browser.");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `bg3-study-survey-${safeFilenamePart(participantId)}-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);

  return filename;
}

export default function StudyLoggingPanel({
  isPartyComplete = false,
  getFinalPayload,
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
  const [error, setError] = useState<string | null>(null);
  const [showPreTaskSurvey, setShowPreTaskSurvey] = useState(false);
  const [showPostTaskSurvey, setShowPostTaskSurvey] = useState(false);

  const isRunning = session?.status === "running" || isStudySessionActive();
  const trimmedParticipantId = participantId.trim();

  const canStart = useMemo(() => {
    return trimmedParticipantId.length > 0 && !isRunning;
  }, [trimmedParticipantId, isRunning]);

  const readinessText = isPartyComplete
    ? "Party complete. Ending opens the post-task survey, then exports the survey answers and study log."
    : "Party incomplete. Ending still works, but the final party will be marked incomplete.";

  function buildFinalPayload(): StudyLoggerEndPayload {
    const customPayload =
      typeof getFinalPayload === "function" ? getFinalPayload() : {};

    return {
      finalPartyComplete: isPartyComplete,
      finalPartySnapshotSummary,
      finalPartyVisualProfile,
      finalPartyGaps,
      finalRedundancyScore: finalRedundancyScore ?? null,
      ...customPayload,
    };
  }

  function handleStart(): void {
    setError(null);

    if (!trimmedParticipantId) {
      setError("Participant ID is required before starting the study.");
      return;
    }

    setShowPreTaskSurvey(true);
  }

  function handlePreTaskSurveySubmit(submission: StudySurveySubmission): void {
    setError(null);

    try {
      const nextSession = startStudySession(trimmedParticipantId, {
        clearExistingLogs: true,
      });

      const normalizedSubmission: StudySurveySubmission = {
        ...submission,
        participantId: nextSession.participantId,
      };

      saveSurveyCache({
        participantId: nextSession.participantId,
        sessionId: nextSession.sessionId,
        preTaskSurvey: normalizedSubmission,
        postTaskSurvey: null,
        lastSurveyExportFilename: null,
        updatedAt: new Date().toISOString(),
      });

      logStudyEvent({
        eventCategory: "study",
        eventType: "survey_pre_task_submitted",
        taskPhase: "initial_planning",
        activeView: "study-survey-modal",
        payload: {
          surveySchemaVersion: normalizedSubmission.surveySchemaVersion,
          participantId: nextSession.participantId,
          submittedAt: normalizedSubmission.submittedAt,
          consent: normalizedSubmission.consent,
          answers: normalizedSubmission.answers,
        },
      });

      setSession(nextSession);
      setParticipantId(nextSession.participantId);
      setShowPreTaskSurvey(false);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Could not start the study."
      );
    }
  }

  function handleEndClick(): void {
    setError(null);

    if (!isRunning) {
      setError("Study logging is not running.");
      return;
    }

    setShowPostTaskSurvey(true);
  }

  function handlePostTaskSurveySubmit(submission: StudySurveySubmission): void {
    setError(null);

    try {
      const activeSession = loadStudySession();

      if (!activeSession || activeSession.status !== "running") {
        throw new Error("Study logging is not running.");
      }

      const normalizedSubmission: StudySurveySubmission = {
        ...submission,
        participantId: activeSession.participantId,
      };

      const finalPayload = buildFinalPayload();
      const previousCache =
        loadSurveyCache(activeSession.participantId) ??
        {
          participantId: activeSession.participantId,
          sessionId: activeSession.sessionId,
          preTaskSurvey: null,
          postTaskSurvey: null,
          lastSurveyExportFilename: null,
          updatedAt: new Date().toISOString(),
        };

      logStudyEvent({
        eventCategory: "study",
        eventType: "survey_post_task_submitted",
        taskPhase: "submission",
        activeView: "study-survey-modal",
        payload: {
          surveySchemaVersion: normalizedSubmission.surveySchemaVersion,
          participantId: activeSession.participantId,
          submittedAt: normalizedSubmission.submittedAt,
          answers: normalizedSubmission.answers,
        },
      });

      const surveyExportPayload = {
        exportType: "bg3-build-planner-survey-answers",
        exportSchemaVersion: "bg3-build-planner-survey-export-v1",
        exportedAt: new Date().toISOString(),
        exportedAtMs: Date.now(),
        participantId: activeSession.participantId,
        sessionId: activeSession.sessionId,
        studyDesign: activeSession.studyDesign,
        prototypeVersion: activeSession.prototypeVersion,
        appVersion: activeSession.appVersion,
        dataModelVersion: activeSession.dataModelVersion,
        sessionStartedAt: activeSession.startedAt,
        preTaskSurvey: previousCache.preTaskSurvey ?? null,
        postTaskSurvey: normalizedSubmission,
        finalTaskState: finalPayload,
      };

      const filename = exportSurveyAnswersAsJson(
        surveyExportPayload,
        activeSession.participantId
      );

      saveSurveyCache({
        participantId: activeSession.participantId,
        sessionId: activeSession.sessionId,
        preTaskSurvey: previousCache.preTaskSurvey ?? null,
        postTaskSurvey: normalizedSubmission,
        lastSurveyExportFilename: filename,
        updatedAt: new Date().toISOString(),
      });

      logStudyEvent({
        eventCategory: "export",
        eventType: "survey_answers_exported",
        taskPhase: "submission",
        activeView: "study-survey-modal",
        payload: {
          filename,
          participantId: activeSession.participantId,
          hasPreTaskSurvey: Boolean(previousCache.preTaskSurvey),
          hasPostTaskSurvey: true,
        },
      });

      endAndExportStudySession({
        ...finalPayload,
        postTaskSurveyCompleted: true,
        surveyAnswersExported: true,
        surveyAnswersFilename: filename,
      });

      setShowPostTaskSurvey(false);
      setSession(loadStudySession());
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not submit the survey or export the study data."
      );
    }
  }

  function handleClearLogs(): void {
    const currentParticipantId =
      loadStudySession()?.participantId ?? participantId.trim();

    clearStudyLogs({ clearSession: true });

    if (currentParticipantId) {
      removeSurveyCache(currentParticipantId);
    }

    setSession(null);
    setParticipantId("");
    setError(null);
    setShowPreTaskSurvey(false);
    setShowPostTaskSurvey(false);
  }

  return (
    <>
      <section
        className={`study-logging-panel ${className}`.trim()}
        data-study-region="study-logging-panel"
      >
        <div className="study-logging-header">
          <div>
            <h3>Study logging</h3>
            <p>Single-session party-building log.</p>
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
            onChange={(event) => setParticipantId(event.target.value)}
            placeholder="e.g. P01"
            data-study-element="participant-id-input"
          />
        </label>

        <div className="study-logging-readiness">
          <span
            className={
              isPartyComplete
                ? "study-logging-readiness-dot study-logging-readiness-dot--ready"
                : "study-logging-readiness-dot"
            }
          />
          <p>{readinessText}</p>
        </div>

        {error ? <div className="study-logging-error">{error}</div> : null}

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
            onClick={handleEndClick}
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

      {showPreTaskSurvey ? (
        <StudySurveyModal
          mode="pre"
          participantId={trimmedParticipantId}
          onSubmit={handlePreTaskSurveySubmit}
          onCancel={() => setShowPreTaskSurvey(false)}
        />
      ) : null}

      {showPostTaskSurvey ? (
        <StudySurveyModal
          mode="post"
          participantId={session?.participantId ?? trimmedParticipantId}
          onSubmit={handlePostTaskSurveySubmit}
          onCancel={() => setShowPostTaskSurvey(false)}
        />
      ) : null}
    </>
  );
}