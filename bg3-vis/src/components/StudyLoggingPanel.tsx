import { useMemo, useState } from "react";
import {
  clearStudyLogs,
  endStudySession,
  isStudySessionActive,
  loadStudyLogsJsonl,
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
  lastZipFilename?: string | null;
  updatedAt: string;
};

type LastZipExport = {
  filename: string;
  blob: Blob;
};

const STUDY_SURVEY_CACHE_PREFIX = "bg3-study-survey-cache-v1";
const STUDY_UPLOAD_URL = "https://www.dropbox.com/request/guzuiiqjn65qw4kflmfd";

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

function downloadBlob(blob: Blob, filename: string): void {
  if (!hasWindow()) return;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

function openStudyUploadPage(): void {
  if (!hasWindow()) return;

  window.open(STUDY_UPLOAD_URL, "_blank", "noopener,noreferrer");
}

function dateToDosTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: number[], value: number): void {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(target: number[], value: number): void {
  target.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  );
}

function appendBytes(target: number[], bytes: Uint8Array): void {
  for (const byte of bytes) {
    target.push(byte);
  }
}

function createZipBlob(files: Array<{ filename: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const now = new Date();
  const dos = dateToDosTime(now);
  const output: number[] = [];
  const centralDirectory: number[] = [];

  for (const file of files) {
    const nameBytes = encoder.encode(file.filename);
    const dataBytes = encoder.encode(file.content);
    const localHeaderOffset = output.length;
    const checksum = crc32(dataBytes);

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, dos.time);
    writeUint16(output, dos.date);
    writeUint32(output, checksum);
    writeUint32(output, dataBytes.length);
    writeUint32(output, dataBytes.length);
    writeUint16(output, nameBytes.length);
    writeUint16(output, 0);
    appendBytes(output, nameBytes);
    appendBytes(output, dataBytes);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, dos.time);
    writeUint16(centralDirectory, dos.date);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, dataBytes.length);
    writeUint32(centralDirectory, dataBytes.length);
    writeUint16(centralDirectory, nameBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localHeaderOffset);
    appendBytes(centralDirectory, nameBytes);
  }

  const centralDirectoryOffset = output.length;
  appendBytes(output, new Uint8Array(centralDirectory));
  const centralDirectorySize = centralDirectory.length;

  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, centralDirectorySize);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], {
    type: "application/zip",
  });
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
  const [lastZipExport, setLastZipExport] = useState<LastZipExport | null>(
    null
  );
  const [hasAcknowledgedManualUpload, setHasAcknowledgedManualUpload] =
    useState(false);
  const [showManualUploadCloseCheck, setShowManualUploadCloseCheck] =
    useState(false);

  const isRunning = session?.status === "running" || isStudySessionActive();
  const trimmedParticipantId = participantId.trim();

  const canStart = useMemo(() => {
    return trimmedParticipantId.length > 0 && !isRunning;
  }, [trimmedParticipantId, isRunning]);

  const readinessText = isPartyComplete
    ? "Party complete. Ending opens the post-task survey, then exports the survey and study log together as a ZIP."
    : "Party incomplete. Ending still works, but the final party will be marked incomplete in the interaction log.";

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
        lastZipFilename: null,
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
      setLastZipExport(null);
      setHasAcknowledgedManualUpload(false);
      setShowManualUploadCloseCheck(false);
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

      const previousCache =
        loadSurveyCache(activeSession.participantId) ?? {
          participantId: activeSession.participantId,
          sessionId: activeSession.sessionId,
          preTaskSurvey: null,
          postTaskSurvey: null,
          lastZipFilename: null,
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

      const finalPayload = buildFinalPayload();

      const endedSession = endStudySession({
        ...finalPayload,
        postTaskSurveyCompleted: true,
        exportedAsZip: true,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeId = safeFilenamePart(activeSession.participantId);
      const surveyFilename = `bg3-study-survey-${safeId}-${timestamp}.json`;
      const logFilename = `bg3-study-log-${safeId}-${timestamp}.jsonl`;
      const zipFilename = `bg3-study-export-${safeId}-${timestamp}.zip`;

      const surveyExportPayload = {
        exportType: "bg3-build-planner-survey-answers",
        exportSchemaVersion: "bg3-build-planner-survey-export-v2",
        exportedAt: new Date().toISOString(),
        exportedAtMs: Date.now(),
        participantId: endedSession.participantId,
        sessionId: endedSession.sessionId,
        studyDesign: endedSession.studyDesign,
        prototypeVersion: endedSession.prototypeVersion,
        appVersion: endedSession.appVersion,
        dataModelVersion: endedSession.dataModelVersion,
        sessionStartedAt: endedSession.startedAt,
        sessionEndedAt: endedSession.endedAt,
        preTaskSurvey: previousCache.preTaskSurvey ?? null,
        postTaskSurvey: normalizedSubmission,
      };

      const logJsonl = loadStudyLogsJsonl();

      if (!logJsonl.trim()) {
        throw new Error("There are no study logs to export.");
      }

      const zipBlob = createZipBlob([
        {
          filename: surveyFilename,
          content: JSON.stringify(surveyExportPayload, null, 2),
        },
        {
          filename: logFilename,
          content: logJsonl,
        },
      ]);

      downloadBlob(zipBlob, zipFilename);

      saveSurveyCache({
        participantId: endedSession.participantId,
        sessionId: endedSession.sessionId,
        preTaskSurvey: previousCache.preTaskSurvey ?? null,
        postTaskSurvey: normalizedSubmission,
        lastZipFilename: zipFilename,
        updatedAt: new Date().toISOString(),
      });

      setLastZipExport({
        filename: zipFilename,
        blob: zipBlob,
      });

      setShowPostTaskSurvey(false);
      setSession(endedSession);
      setParticipantId(endedSession.participantId);
      setHasAcknowledgedManualUpload(false);
      setShowManualUploadCloseCheck(false);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not submit the survey or export the study data."
      );
    }
  }

  function handleRestartStudy(): void {
    const confirmed = window.confirm(
      "Restart the study session? This clears the current study logs, survey cache, and export reminder, then returns the logging panel to the state before Start was clicked."
    );

    if (!confirmed) return;

    const currentParticipantId =
      loadStudySession()?.participantId ?? participantId.trim();

    clearStudyLogs({ clearSession: true, silent: true });

    if (currentParticipantId) {
      removeSurveyCache(currentParticipantId);
    }

    setSession(null);
    setParticipantId("");
    setError(null);
    setShowPreTaskSurvey(false);
    setShowPostTaskSurvey(false);
    setLastZipExport(null);
    setHasAcknowledgedManualUpload(false);
    setShowManualUploadCloseCheck(false);
  }

  function handleRequestExportClose(): void {
    if (!hasAcknowledgedManualUpload) return;

    setShowManualUploadCloseCheck(true);
  }

  function handleConfirmExportClose(): void {
    setLastZipExport(null);
    setShowManualUploadCloseCheck(false);
    setHasAcknowledgedManualUpload(false);
    setSession(loadStudySession());
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
            placeholder="Unique fantasy name"
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
            onClick={handleRestartStudy}
            data-study-element="restart-study-button"
          >
            Restart
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

      {lastZipExport ? (
        <div
          className="study-export-backdrop"
          data-study-region="study-export-complete"
        >
          <section className="study-export-modal" role="dialog" aria-modal="true">
            <h2>Study export complete</h2>

            <p>
              Thank you for completing the study. A ZIP file has been downloaded
              to your device.
            </p>

            <p className="study-export-filename">{lastZipExport.filename}</p>

            <div className="study-export-required-warning">
              <div className="study-export-required-label">
                Required final step
              </div>

              <p>
                The tool runs entirely in your browser, so the researcher does
                not receive your study data automatically. Please upload the
                downloaded ZIP file manually using the Dropbox upload page.
              </p>

              <p>
                If Dropbox asks for a name, please enter only your participant
                ID. Any name or email requested by Dropbox is part of the Dropbox
                upload process and will not be used as study data.
              </p>

              <label className="study-export-required-check">
                <input
                  type="checkbox"
                  checked={hasAcknowledgedManualUpload}
                  onChange={(event) =>
                    setHasAcknowledgedManualUpload(event.target.checked)
                  }
                />
                <span>
                  I understand that I must manually upload the downloaded ZIP
                  file before closing this window.
                </span>
              </label>
            </div>

            <p className="study-export-note">
              If there are any issues, you can contact me or send the ZIP file
              to sinkovichana@gmail.com. Thank you again for taking the time to
              participate.
            </p>

            <div className="study-export-actions">
              <button
                type="button"
                className="study-survey-secondary"
                onClick={() =>
                  downloadBlob(lastZipExport.blob, lastZipExport.filename)
                }
              >
                Download ZIP again
              </button>

              <button
                type="button"
                className="study-survey-primary"
                onClick={openStudyUploadPage}
              >
                Upload ZIP file
              </button>

              <button
                type="button"
                className="study-survey-secondary"
                onClick={handleRequestExportClose}
                disabled={!hasAcknowledgedManualUpload}
                title={
                  hasAcknowledgedManualUpload
                    ? "Close this export reminder."
                    : "Please confirm that you understand the ZIP file must be uploaded manually."
                }
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showManualUploadCloseCheck ? (
        <div
          className="study-export-close-check-backdrop"
          data-study-region="study-export-close-check"
        >
          <section
            className="study-export-close-check-modal"
            role="dialog"
            aria-modal="true"
          >
            <h2>Before closing</h2>

            <p>
              Please make sure you have uploaded the downloaded ZIP file through
              Dropbox, or sent it by email (sinkovichana@gmail.com) if Dropbox did not work. Without that
              file, the study data cannot be received. Thank you for your understanding!
            </p>

            <div className="study-export-close-check-actions">
              <button
                type="button"
                className="study-survey-secondary"
                onClick={() => setShowManualUploadCloseCheck(false)}
              >
                Go back
              </button>

              <button
                type="button"
                className="study-survey-primary"
                onClick={openStudyUploadPage}
              >
                Open upload page
              </button>

              <button
                type="button"
                className="study-survey-primary"
                onClick={handleConfirmExportClose}
              >
                I uploaded or sent it
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}