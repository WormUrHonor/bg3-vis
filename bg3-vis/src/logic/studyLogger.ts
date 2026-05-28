import type {
  StudyLogEvent,
  StudyLogInput,
  StudySessionMetadata,
} from "../types/loggingTypes";

const STUDY_LOGS_STORAGE_KEY = "bg3-vis.study-logs.v1";
const STUDY_METADATA_STORAGE_KEY = "bg3-vis.study-session-metadata.v1";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultStudySessionMetadata(): StudySessionMetadata {
  return {
    participantId: "",
    sessionId: createId("session"),
    taskId: "",
    conditionId: "redesigned",
    conditionSequenceIndex: 1,
    activeScenarioPreset: "default",
    activeVisualizationState: "data-circle",
    isLoggingEnabled: false,
    taskStartedAt: null,
  };
}

export function loadStudySessionMetadata(): StudySessionMetadata {
  try {
    const rawValue = localStorage.getItem(STUDY_METADATA_STORAGE_KEY);

    if (!rawValue) return createDefaultStudySessionMetadata();

    const parsedValue = JSON.parse(rawValue);

    return {
      ...createDefaultStudySessionMetadata(),
      ...parsedValue,
      participantId:
        typeof parsedValue?.participantId === "string"
          ? parsedValue.participantId
          : "",
      sessionId:
        typeof parsedValue?.sessionId === "string" && parsedValue.sessionId
          ? parsedValue.sessionId
          : createId("session"),
      taskId: typeof parsedValue?.taskId === "string" ? parsedValue.taskId : "",
      conditionId:
        typeof parsedValue?.conditionId === "string"
          ? parsedValue.conditionId
          : "redesigned",
      conditionSequenceIndex:
        typeof parsedValue?.conditionSequenceIndex === "number"
          ? parsedValue.conditionSequenceIndex
          : 1,
      activeScenarioPreset:
        typeof parsedValue?.activeScenarioPreset === "string"
          ? parsedValue.activeScenarioPreset
          : "default",
      activeVisualizationState:
        typeof parsedValue?.activeVisualizationState === "string"
          ? parsedValue.activeVisualizationState
          : "data-circle",
      isLoggingEnabled: Boolean(parsedValue?.isLoggingEnabled),
      taskStartedAt:
        typeof parsedValue?.taskStartedAt === "string"
          ? parsedValue.taskStartedAt
          : null,
    };
  } catch {
    return createDefaultStudySessionMetadata();
  }
}

export function saveStudySessionMetadata(metadata: StudySessionMetadata) {
  localStorage.setItem(STUDY_METADATA_STORAGE_KEY, JSON.stringify(metadata));
}

export function updateStudySessionMetadata(
  patch: Partial<StudySessionMetadata>
): StudySessionMetadata {
  const nextMetadata = {
    ...loadStudySessionMetadata(),
    ...patch,
  };

  saveStudySessionMetadata(nextMetadata);

  return nextMetadata;
}

export function loadStudyLogs(): StudyLogEvent[] {
  try {
    const rawValue = localStorage.getItem(STUDY_LOGS_STORAGE_KEY);

    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(
      (item): item is StudyLogEvent =>
        typeof item?.eventId === "string" &&
        typeof item?.sequenceNumber === "number" &&
        typeof item?.timestamp === "string" &&
        typeof item?.timestampMs === "number" &&
        typeof item?.eventCategory === "string" &&
        typeof item?.eventType === "string"
    );
  } catch {
    return [];
  }
}

function saveStudyLogs(events: StudyLogEvent[]) {
  localStorage.setItem(STUDY_LOGS_STORAGE_KEY, JSON.stringify(events));
}

function getNextSequenceNumber(events: StudyLogEvent[]) {
  if (events.length === 0) return 1;

  return (
    Math.max(
      ...events.map((event) =>
        Number.isFinite(event.sequenceNumber) ? event.sequenceNumber : 0
      )
    ) + 1
  );
}

function getElapsedTaskMs(
  timestampMs: number,
  metadata: StudySessionMetadata
): number | null {
  if (!metadata.taskStartedAt) return null;

  const taskStartedAtMs = new Date(metadata.taskStartedAt).getTime();

  if (Number.isNaN(taskStartedAtMs)) return null;

  return Math.max(0, timestampMs - taskStartedAtMs);
}

export function logStudyEvent(input: StudyLogInput): StudyLogEvent | null {
  const metadata = loadStudySessionMetadata();

  if (!metadata.isLoggingEnabled) return null;

  const previousEvents = loadStudyLogs();
  const now = new Date();
  const timestampMs = now.getTime();

  const nextEvent: StudyLogEvent = {
    eventId: createId("event"),
    sequenceNumber: getNextSequenceNumber(previousEvents),
    timestamp: now.toISOString(),
    timestampMs,
    elapsedTaskMs: getElapsedTaskMs(timestampMs, metadata),

    participantId: metadata.participantId.trim(),
    sessionId: metadata.sessionId.trim(),
    taskId: metadata.taskId.trim(),
    conditionId: metadata.conditionId,
    conditionSequenceIndex: metadata.conditionSequenceIndex,

    activeScenarioPreset: metadata.activeScenarioPreset,
    activeVisualizationState: metadata.activeVisualizationState,
    activeView: input.activeView,

    eventCategory: input.eventCategory,
    eventType: input.eventType,

    activeBuildId: input.activeBuildId,
    activeBuildLabel: input.activeBuildLabel,

    payload: input.payload,
  };

  saveStudyLogs([...previousEvents, nextEvent]);

  return nextEvent;
}

export function startStudyTask() {
  const now = new Date().toISOString();
  const nextMetadata = updateStudySessionMetadata({
    taskStartedAt: now,
    isLoggingEnabled: true,
  });

  logStudyEvent({
    eventCategory: "task",
    eventType: "task_started",
    payload: {
      taskStartedAt: now,
      metadata: nextMetadata,
    },
  });

  return nextMetadata;
}

export function completeStudyTask(payload?: Record<string, unknown>) {
  logStudyEvent({
    eventCategory: "task",
    eventType: "task_completed",
    payload,
  });
}

export function clearStudyLogs() {
  const previousCount = loadStudyLogs().length;

  localStorage.setItem(STUDY_LOGS_STORAGE_KEY, JSON.stringify([]));

  return previousCount;
}

function escapeCsvValue(value: unknown): string {
  if (value === undefined || value === null) return "";

  const stringValue =
    typeof value === "string" ? value : JSON.stringify(value);

  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function exportStudyLogsAsJson() {
  return JSON.stringify(loadStudyLogs(), null, 2);
}

export function exportStudyLogsAsJsonl() {
  return loadStudyLogs()
    .map((event) => JSON.stringify(event))
    .join("\n");
}

export function exportStudyLogsAsCsv() {
  const events = loadStudyLogs();

  const columns: Array<keyof StudyLogEvent | "payloadJson"> = [
    "eventId",
    "sequenceNumber",
    "timestamp",
    "timestampMs",
    "elapsedTaskMs",
    "participantId",
    "sessionId",
    "taskId",
    "conditionId",
    "conditionSequenceIndex",
    "activeScenarioPreset",
    "activeVisualizationState",
    "activeView",
    "eventCategory",
    "eventType",
    "activeBuildId",
    "activeBuildLabel",
    "payloadJson",
  ];

  const header = columns.join(",");

  const rows = events.map((event) =>
    columns
      .map((column) => {
        if (column === "payloadJson") {
          return escapeCsvValue(event.payload ?? {});
        }

        return escapeCsvValue(event[column]);
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function downloadStudyLogs(format: "json" | "jsonl" | "csv") {
  const metadata = loadStudySessionMetadata();
  const safeParticipantId = metadata.participantId.trim() || "unknown-participant";
  const safeTaskId = metadata.taskId.trim() || "unknown-task";
  const safeConditionId = String(metadata.conditionId).trim() || "unknown-condition";
  const nowLabel = new Date().toISOString().replaceAll(":", "-");

  const baseFilename = `bg3-study-logs_${safeParticipantId}_${safeTaskId}_${safeConditionId}_${nowLabel}`;

  if (format === "json") {
    downloadTextFile(`${baseFilename}.json`, exportStudyLogsAsJson());
  }

  if (format === "jsonl") {
    downloadTextFile(`${baseFilename}.jsonl`, exportStudyLogsAsJsonl());
  }

  if (format === "csv") {
    downloadTextFile(`${baseFilename}.csv`, exportStudyLogsAsCsv());
  }

  logStudyEvent({
    eventCategory: "export",
    eventType: "logs_exported",
    payload: {
      format,
      exportedEventCount: loadStudyLogs().length,
    },
  });
}