import type {
  DataCircleFocusForLogging,
  EvaluationContextForLogging,
  FocusContextForLogging,
  HeatmapPointerEventType,
  HeatmapPointerPayload,
  PartyGapContextForLogging,
  StudyEventType,
  StudyLogEvent,
  StudyLoggerEndPayload,
  StudyLoggerEventInput,
  StudyLoggerStartOptions,
  StudySession,
  StudyTaskPhase,
  VisualizedItemForLogging,
  VisualProfileDeltaForLogging,
  VisualProfileSummaryForLogging,
  BuildSnapshotSummaryForLogging,
  PartyCoverageForLogging,
  PartyGapForLogging,
  PartySnapshotSummaryForLogging,
  BuildEditLoggingPayload,
} from "../types/loggingTypes";

const STUDY_LOG_STORAGE_KEY = "bg3-study-jsonl-logs-v3";
const STUDY_SESSION_STORAGE_KEY = "bg3-study-session-v3";
const STUDY_SEQUENCE_STORAGE_KEY = "bg3-study-sequence-v3";

export const FOCUS_CONTEXT_WINDOW_MS = 20_000;
export const GAP_CONTEXT_WINDOW_MS = 30_000;
export const EVALUATION_CONTEXT_WINDOW_MS = 60_000;

const DEFAULT_PROTOTYPE_VERSION = "bg3-party-planner-study";
const DEFAULT_APP_VERSION = "local";
const DEFAULT_DATA_MODEL_VERSION = "local";

let activeFocusContext: FocusContextForLogging | null = null;
let activePartyGapContext: PartyGapContextForLogging | null = null;
let activeEvaluationContext: EvaluationContextForLogging | null = null;
let evaluationIndex = 0;

let activeHoverFocusKey: string | null = null;
let activeHoverFocusStartedAtMs: number | null = null;
let activeHoverFocus: DataCircleFocusForLogging | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function safeNow(): number {
  return Date.now();
}

function safeIso(timestampMs = safeNow()): string {
  return new Date(timestampMs).toISOString();
}

function safeRandomId(prefix: string): string {
  if (hasWindow() && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function normalizeParticipantId(rawParticipantId: string): string {
  return rawParticipantId.trim().replace(/\s+/g, "_");
}

function readStorage(key: string): string | null {
  if (!hasWindow()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (!hasWindow()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage can fail in private modes or when quota is exceeded.
  }
}

function removeStorage(key: string): void {
  if (!hasWindow()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

function readJson<T>(key: string): T | null {
  const value = readStorage(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getSequenceNumber(): number {
  const raw = readStorage(STUDY_SEQUENCE_STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  const next = Number.isFinite(parsed) ? parsed + 1 : 1;
  writeStorage(STUDY_SEQUENCE_STORAGE_KEY, String(next));
  return next;
}

function resetSequenceNumber(): void {
  writeStorage(STUDY_SEQUENCE_STORAGE_KEY, "0");
}

function getEnvironmentMetadata(): StudySession["environment"] {
  if (!hasWindow()) {
    return {
      userAgent: "",
      language: "",
      platform: "",
      timezoneOffsetMinutes: 0,
      screenWidth: 0,
      screenHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      devicePixelRatio: 1,
    };
  }

  return {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    platform: window.navigator.platform,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

function appendJsonlEvent(event: StudyLogEvent): void {
  const current = readStorage(STUDY_LOG_STORAGE_KEY);
  const nextLine = JSON.stringify(event);
  writeStorage(
    STUDY_LOG_STORAGE_KEY,
    current && current.length > 0 ? `${current}\n${nextLine}` : nextLine
  );
}

function getCurrentSessionOrThrow(): StudySession {
  const session = loadStudySession();

  if (!session || session.status !== "running") {
    throw new Error("Study logging is not running. Enter a participant ID and click Start first.");
  }

  return session;
}

function getCurrentSession(): StudySession | null {
  const session = loadStudySession();
  return session && session.status === "running" ? session : null;
}

function shouldEnrichEvent(eventType: StudyEventType): boolean {
  return ![
    "study_started",
    "study_ended",
    "logs_cleared",
    "logs_exported",
    "heatmap_pointer_move",
    "heatmap_hover_start",
    "heatmap_hover_end",
    "heatmap_hover_dwell",
  ].includes(eventType);
}

function isFocusActionEvent(eventType: StudyEventType): boolean {
  return [
    "build_edit",
    "build_semantic_delta",
    "build_saved",
    "build_loaded",
    "party_slot_assigned",
    "party_slot_cleared",
    "evaluation_requested",
    "evaluation_completed",
    "highlighted_item_selected",
    "highlighted_item_tooltip_opened",
    "nonhighlighted_item_selected_under_focus",
    "tab_changed",
    "view_changed",
  ].includes(eventType);
}

function isGapResponseEvent(eventType: StudyEventType): boolean {
  return [
    "build_edit",
    "build_semantic_delta",
    "party_slot_assigned",
    "party_slot_cleared",
    "evaluation_requested",
    "evaluation_completed",
  ].includes(eventType);
}

function isEvaluationResponseEvent(eventType: StudyEventType): boolean {
  return ["build_edit", "build_semantic_delta", "party_slot_assigned", "party_slot_cleared"].includes(
    eventType
  );
}

function inferAttentionFlags(eventType: StudyEventType, payload: unknown) {
  const text = JSON.stringify(payload ?? {}).toLowerCase();
  const dprAttentionRelevant =
    eventType === "data_circle_dpr_layout_changed" ||
    text.includes("dpr") ||
    text.includes("damage_per_round");

  const partyAttentionRelevant =
    text.includes("party") ||
    text.includes("aggregate") ||
    eventType.startsWith("party_") ||
    eventType === "aggregate_focused" ||
    eventType === "aggregate_to_member_revision";

  const nonDprAttentionRelevant =
    text.includes("utility") ||
    text.includes("range") ||
    text.includes("role") ||
    text.includes("resource") ||
    text.includes("control") ||
    text.includes("healing") ||
    text.includes("support") ||
    text.includes("mobility");

  return {
    dprAttentionRelevant,
    nonDprAttentionRelevant,
    partyAttentionRelevant,
  };
}

function buildDerivedContext(
  eventType: StudyEventType,
  payload: unknown,
  timestampMs: number,
  skipContextEnrichment?: boolean
): StudyLogEvent["derived"] | undefined {
  if (skipContextEnrichment || !shouldEnrichEvent(eventType)) return undefined;

  const derived: StudyLogEvent["derived"] = {};
  const attention = inferAttentionFlags(eventType, payload);

  derived.dprAttentionRelevant = attention.dprAttentionRelevant;
  derived.nonDprAttentionRelevant = attention.nonDprAttentionRelevant;
  derived.partyAttentionRelevant = attention.partyAttentionRelevant;

  if (
    activeFocusContext &&
    isFocusActionEvent(eventType) &&
    timestampMs - activeFocusContext.timestampMs <= FOCUS_CONTEXT_WINDOW_MS
  ) {
    derived.focusContext = activeFocusContext;
    derived.focusToActionLatencyMs = timestampMs - activeFocusContext.timestampMs;
  }

  if (
    activePartyGapContext &&
    isGapResponseEvent(eventType) &&
    timestampMs - activePartyGapContext.timestampMs <= GAP_CONTEXT_WINDOW_MS
  ) {
    derived.gapContext = activePartyGapContext;
    derived.gapToActionLatencyMs = timestampMs - activePartyGapContext.timestampMs;
  }

  if (
    activeEvaluationContext &&
    isEvaluationResponseEvent(eventType) &&
    timestampMs - activeEvaluationContext.timestampMs <= EVALUATION_CONTEXT_WINDOW_MS
  ) {
    derived.evaluationContext = activeEvaluationContext;
    derived.evaluationToActionLatencyMs = timestampMs - activeEvaluationContext.timestampMs;
  }

  return Object.keys(derived).length > 0 ? derived : undefined;
}

function inferTaskPhase(inputPhase: StudyTaskPhase | undefined, eventType: StudyEventType): StudyTaskPhase {
  if (inputPhase) return inputPhase;

  if (eventType === "study_started") return "initial_planning";
  if (eventType === "study_ended") return "submission";
  if (eventType.startsWith("evaluation_") || eventType.startsWith("simulator_")) return "evaluation";
  if (eventType.startsWith("party_") || eventType === "aggregate_focused") return "party_review";
  if (eventType.includes("edit") || eventType.includes("delta")) return "revision";
  if (eventType.includes("focus") || eventType.includes("heatmap")) return "exploration";

  return "exploration";
}

export function loadStudySession(): StudySession | null {
  return readJson<StudySession>(STUDY_SESSION_STORAGE_KEY);
}

export function loadStudyLogs(): StudyLogEvent[] {
  const jsonl = readStorage(STUDY_LOG_STORAGE_KEY);
  if (!jsonl) return [];

  return jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as StudyLogEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is StudyLogEvent => event !== null);
}

export function loadStudyLogsJsonl(): string {
  return readStorage(STUDY_LOG_STORAGE_KEY) ?? "";
}

export function isStudySessionActive(): boolean {
  return loadStudySession()?.status === "running";
}

export function startStudySession(
  rawParticipantId: string,
  options: StudyLoggerStartOptions = {}
): StudySession {
  const participantId = normalizeParticipantId(rawParticipantId);

  if (!participantId) {
    throw new Error("Participant ID is required before starting the study.");
  }

  if (options.clearExistingLogs ?? true) {
    clearStudyLogs({ clearSession: true, silent: true });
  }

  const nowMs = safeNow();

  const session: StudySession = {
    participantId,
    sessionId: participantId,
    status: "running",
    startedAt: safeIso(nowMs),
    startedAtMs: nowMs,
    exportFormat: "jsonl",
    studyDesign: "single_condition_single_task_party_building",
    prototypeVersion: options.prototypeVersion ?? DEFAULT_PROTOTYPE_VERSION,
    appVersion: options.appVersion ?? DEFAULT_APP_VERSION,
    dataModelVersion: options.dataModelVersion ?? DEFAULT_DATA_MODEL_VERSION,
    environment: getEnvironmentMetadata(),
  };

  resetSequenceNumber();
  writeStorage(STUDY_SESSION_STORAGE_KEY, JSON.stringify(session));

  logStudyEvent({
    eventCategory: "study",
    eventType: "study_started",
    taskPhase: "initial_planning",
    activeView: "study-logging-panel",
    payload: {
      session,
      participantIdPresent: true,
    },
    skipContextEnrichment: true,
  });

  logStudyEvent({
    eventCategory: "system",
    eventType: "system_metadata_captured",
    taskPhase: "initial_planning",
    activeView: "study-logging-panel",
    payload: session.environment,
    skipContextEnrichment: true,
  });

  return session;
}

export function endStudySession(payload: StudyLoggerEndPayload = {}): StudySession {
  const session = getCurrentSessionOrThrow();
  const nowMs = safeNow();

  const endedSession: StudySession = {
    ...session,
    status: "ended",
    endedAt: safeIso(nowMs),
    endedAtMs: nowMs,
  };

  logStudyEvent({
    eventCategory: "study",
    eventType: "study_ended",
    taskPhase: "submission",
    activeView: "study-logging-panel",
    payload: {
      ...payload,
      sessionDurationMs: nowMs - session.startedAtMs,
    },
    skipContextEnrichment: true,
  });

  writeStorage(STUDY_SESSION_STORAGE_KEY, JSON.stringify(endedSession));
  return endedSession;
}

export function endAndExportStudySession(payload: StudyLoggerEndPayload = {}): void {
  const endedSession = endStudySession({
    ...payload,
    exportedByParticipant: true,
  });

  exportStudyLogsAsJsonl(endedSession.participantId);
}

export function clearStudyLogs(options: { clearSession?: boolean; silent?: boolean } = {}): void {
  removeStorage(STUDY_LOG_STORAGE_KEY);
  resetSequenceNumber();

  activeFocusContext = null;
  activePartyGapContext = null;
  activeEvaluationContext = null;
  evaluationIndex = 0;
  activeHoverFocusKey = null;
  activeHoverFocusStartedAtMs = null;
  activeHoverFocus = null;

  if (options.clearSession ?? false) {
    removeStorage(STUDY_SESSION_STORAGE_KEY);
  }

  if (!options.silent && hasWindow()) {
    const participantId = loadStudySession()?.participantId ?? "";
    const sessionId = loadStudySession()?.sessionId ?? participantId;

    const event: StudyLogEvent = {
      eventId: safeRandomId("event"),
      sequenceNumber: getSequenceNumber(),
      timestamp: safeIso(),
      timestampMs: safeNow(),
      elapsedStudyMs: 0,
      participantId,
      sessionId,
      studyDesign: "single_condition_single_task_party_building",
      prototypeVersion: DEFAULT_PROTOTYPE_VERSION,
      appVersion: DEFAULT_APP_VERSION,
      dataModelVersion: DEFAULT_DATA_MODEL_VERSION,
      taskPhase: "not_started",
      eventCategory: "study",
      eventType: "logs_cleared",
      payload: {
        clearSession: options.clearSession ?? false,
      },
    };

    appendJsonlEvent(event);
  }
}

export function logStudyEvent(input: StudyLoggerEventInput): StudyLogEvent | null {
  const session = getCurrentSession();

  if (!session) {
    return null;
  }

  const timestampMs = safeNow();
  const elapsedStudyMs = Math.max(0, timestampMs - session.startedAtMs);
  const eventId = safeRandomId("event");

  const event: StudyLogEvent = {
    eventId,
    sequenceNumber: getSequenceNumber(),
    timestamp: safeIso(timestampMs),
    timestampMs,
    elapsedStudyMs,
    participantId: session.participantId,
    sessionId: session.sessionId,
    studyDesign: session.studyDesign,
    prototypeVersion: session.prototypeVersion,
    appVersion: session.appVersion,
    dataModelVersion: session.dataModelVersion,
    taskPhase: inferTaskPhase(input.taskPhase, input.eventType),
    eventCategory: input.eventCategory,
    eventType: input.eventType,
    activeView: input.activeView ?? null,
    activeBuildId: input.activeBuildId ?? null,
    activeBuildLabel: input.activeBuildLabel ?? null,
    activePartyMemberIndex: input.activePartyMemberIndex ?? null,
    activePartyMemberLabel: input.activePartyMemberLabel ?? null,
    activeFocusSource: input.activeFocusSource ?? null,
    activeVisualizationFocus: input.activeVisualizationFocus ?? null,
    partySnapshotHash: input.partySnapshotHash ?? null,
    derived: buildDerivedContext(input.eventType, input.payload, timestampMs, input.skipContextEnrichment),
    payload: sanitizeForLogging(input.payload),
  };

  appendJsonlEvent(event);
  return event;
}

export function exportStudyLogsAsJsonl(participantId?: string): void {
  if (!hasWindow()) return;

  const session = loadStudySession();
  const id = participantId || session?.participantId || "unknown-participant";
  const currentJsonl = loadStudyLogsJsonl();

  if (!currentJsonl.trim()) {
    throw new Error("There are no study logs to export.");
  }

  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = safeIso().replace(/[:.]/g, "-");
  const filename = `bg3-study-log-${safeId}-${timestamp}.jsonl`;

  logStudyEvent({
    eventCategory: "export",
    eventType: "logs_exported",
    taskPhase: "submission",
    activeView: "study-logging-panel",
    payload: {
      filename,
      eventCountIncludingExportEvent: loadStudyLogs().length + 1,
    },
    skipContextEnrichment: true,
  });

  const jsonl = loadStudyLogsJsonl();
  const blob = new Blob([jsonl], { type: "application/x-ndjson;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export function logHeatmapPointerEvent(
  eventType: HeatmapPointerEventType,
  payload: HeatmapPointerPayload,
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    activeFocusSource?: string | null;
    activeVisualizationFocus?: unknown;
    partySnapshotHash?: string | null;
    taskPhase?: StudyTaskPhase;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "heatmap",
    eventType,
    taskPhase: context.taskPhase ?? "exploration",
    activeView: context.activeView ?? payload.target.studyRegion ?? null,
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeFocusSource: context.activeFocusSource ?? null,
    activeVisualizationFocus: context.activeVisualizationFocus ?? null,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
    skipContextEnrichment: true,
  });
}

export function logVisualizationFocusStarted(
  focus: DataCircleFocusForLogging,
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  const nowMs = safeNow();

  if (activeHoverFocusKey && activeHoverFocusStartedAtMs && activeHoverFocus) {
    logVisualizationFocusEnded(activeHoverFocus, context);
  }

  activeHoverFocusKey = focus.focusKey;
  activeHoverFocusStartedAtMs = nowMs;
  activeHoverFocus = focus;

  const event = logStudyEvent({
    eventCategory: "visualization",
    eventType: "data_circle_focus_hover_started",
    taskPhase: "exploration",
    activeView: context.activeView ?? "data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeFocusSource: focus.focusSource ?? null,
    activeVisualizationFocus: focus.focusKey,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload: {
      ...focus,
      focusStartTime: safeIso(nowMs),
      focusStartTimeMs: nowMs,
    },
    skipContextEnrichment: true,
  });

  if (event) {
    activeFocusContext = {
      eventId: event.eventId,
      timestampMs: event.timestampMs,
      focusType: focus.focusType,
      focusKey: focus.focusKey,
      focusLabel: focus.focusLabel ?? null,
      focusLayer: focus.focusLayer ?? null,
      focusSource: focus.focusSource ?? null,
      focusTrigger: focus.focusTrigger,
      activeBuildId: context.activeBuildId ?? null,
      activeBuildLabel: context.activeBuildLabel ?? null,
      activePartyMemberIndex: context.activePartyMemberIndex ?? null,
      activePartyMemberLabel: context.activePartyMemberLabel ?? null,
      partySnapshotHash: context.partySnapshotHash ?? null,
    };
  }
}

export function logVisualizationFocusEnded(
  focus: DataCircleFocusForLogging,
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  const nowMs = safeNow();
  const startedAtMs = activeHoverFocusStartedAtMs ?? nowMs;
  const dwellDurationMs = Math.max(0, nowMs - startedAtMs);

  logStudyEvent({
    eventCategory: "visualization",
    eventType: "data_circle_focus_hover_ended",
    taskPhase: "exploration",
    activeView: context.activeView ?? "data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeFocusSource: focus.focusSource ?? null,
    activeVisualizationFocus: focus.focusKey,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload: {
      ...focus,
      focusEndTime: safeIso(nowMs),
      focusEndTimeMs: nowMs,
      focusDurationMs: dwellDurationMs,
      dwellDurationMs,
    },
    skipContextEnrichment: true,
  });

  if (dwellDurationMs >= 500) {
    logStudyEvent({
      eventCategory: "visualization",
      eventType: "data_circle_focus_hover_dwell",
      taskPhase: "exploration",
      activeView: context.activeView ?? "data-circle",
      activeBuildId: context.activeBuildId ?? null,
      activeBuildLabel: context.activeBuildLabel ?? null,
      activePartyMemberIndex: context.activePartyMemberIndex ?? null,
      activePartyMemberLabel: context.activePartyMemberLabel ?? null,
      activeFocusSource: focus.focusSource ?? null,
      activeVisualizationFocus: focus.focusKey,
      partySnapshotHash: context.partySnapshotHash ?? null,
      payload: {
        ...focus,
        dwellDurationMs,
      },
      skipContextEnrichment: true,
    });
  }

  activeHoverFocusKey = null;
  activeHoverFocusStartedAtMs = null;
  activeHoverFocus = null;
}

export function logVisualizationFocusSelected(
  focus: DataCircleFocusForLogging,
  context: {
    action?: "added" | "removed" | "selected" | "cleared";
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  const event = logStudyEvent({
    eventCategory: "visualization",
    eventType: "data_circle_focus_selected",
    taskPhase: "exploration",
    activeView: context.activeView ?? "data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeFocusSource: focus.focusSource ?? null,
    activeVisualizationFocus: focus.focusKey,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload: {
      action: context.action ?? "selected",
      ...focus,
      focusSelectedTime: safeIso(),
      focusSelectedTimeMs: safeNow(),
    },
    skipContextEnrichment: true,
  });

  if (event) {
    activeFocusContext = {
      eventId: event.eventId,
      timestampMs: event.timestampMs,
      focusType: focus.focusType,
      focusKey: focus.focusKey,
      focusLabel: focus.focusLabel ?? null,
      focusLayer: focus.focusLayer ?? null,
      focusSource: focus.focusSource ?? null,
      focusTrigger: focus.focusTrigger,
      activeBuildId: context.activeBuildId ?? null,
      activeBuildLabel: context.activeBuildLabel ?? null,
      activePartyMemberIndex: context.activePartyMemberIndex ?? null,
      activePartyMemberLabel: context.activePartyMemberLabel ?? null,
      partySnapshotHash: context.partySnapshotHash ?? null,
    };
  }
}

export function logVisualizationFocusCleared(
  payload: {
    clearedFocusCount?: number;
    clearedFocuses?: unknown[];
    previousFocusKey?: string | null;
    reason?: string;
  } = {},
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "visualization",
    eventType: "data_circle_focus_cleared",
    taskPhase: "exploration",
    activeView: context.activeView ?? "data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeVisualizationFocus: null,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
    skipContextEnrichment: true,
  });

  activeFocusContext = null;
}

export function logLinkedHighlightExposed(
  payload: {
    focusKey: string;
    highlightedItemCount: number;
    highlightedVisibleCount?: number;
    highlightedSelectedCount?: number;
    highlightedItemIds?: string[];
    [key: string]: unknown;
  },
  context: StudyLoggerEventInput extends infer _ ? {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } : never = {}
): void {
  logStudyEvent({
    eventCategory: "visualization",
    eventType: "linked_highlight_exposed",
    taskPhase: "exploration",
    activeView: context.activeView ?? "spells-abilities",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    activeVisualizationFocus: payload.focusKey,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
  });
}

export function logBuildEdit(
  payload: {
    editType: string;
    field?: string;
    previousValue?: unknown;
    nextValue?: unknown;
    buildSnapshot?: unknown;
    buildSnapshotSummary?: unknown;
    visualProfileBefore?: VisualProfileSummaryForLogging;
    visualProfileAfter?: VisualProfileSummaryForLogging;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "build_edit",
    eventType: "build_edit",
    taskPhase: "revision",
    activeView: context.activeView ?? null,
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
  });

  if (payload.visualProfileBefore && payload.visualProfileAfter) {
    logBuildSemanticDelta(
      {
        editType: payload.editType,
        delta: createVisualProfileDelta(payload.visualProfileBefore, payload.visualProfileAfter),
        visualProfileBefore: payload.visualProfileBefore,
        visualProfileAfter: payload.visualProfileAfter,
      },
      context
    );
  }
}

export function logBuildSemanticDelta(
  payload: {
    editType: string;
    delta: VisualProfileDeltaForLogging;
    visualProfileBefore?: VisualProfileSummaryForLogging;
    visualProfileAfter?: VisualProfileSummaryForLogging;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "build_edit",
    eventType: "build_semantic_delta",
    taskPhase: "revision",
    activeView: context.activeView ?? null,
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
  });

  if (
    context.activePartyMemberIndex !== null &&
    context.activePartyMemberIndex !== undefined &&
    activePartyGapContext &&
    safeNow() - activePartyGapContext.timestampMs <= GAP_CONTEXT_WINDOW_MS
  ) {
    logStudyEvent({
      eventCategory: "party",
      eventType: "aggregate_to_member_revision",
      taskPhase: "revision",
      activeView: context.activeView ?? null,
      activeBuildId: context.activeBuildId ?? null,
      activeBuildLabel: context.activeBuildLabel ?? null,
      activePartyMemberIndex: context.activePartyMemberIndex,
      activePartyMemberLabel: context.activePartyMemberLabel ?? null,
      partySnapshotHash: context.partySnapshotHash ?? null,
      payload: {
        respondedToPartyGap: true,
        gapContext: activePartyGapContext,
        semanticDelta: payload.delta,
      },
    });
  }
}

export function logPartySnapshot(
  payload: {
    partySnapshotSummary?: unknown;
    partyVisualProfile?: unknown;
    partySnapshotHash?: string | null;
    reason: string;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "party",
    eventType: "party_snapshot_recorded",
    taskPhase: "party_review",
    activeView: context.activeView ?? "party-view",
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload,
  });
}

export function logPartyCoverageUpdated(
  payload: {
    partySnapshotSummary?: unknown;
    partyVisualProfile?: unknown;
    partyGaps?: unknown;
    partySnapshotHash?: string | null;
    partyRedundancyScore?: number | null;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "party",
    eventType: "party_coverage_updated",
    taskPhase: "party_review",
    activeView: context.activeView ?? "party-view",
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload,
  });
}

export function logPartyGapDetected(
  payload: {
    gapType: string;
    gapKey: string;
    gapLabel?: string | null;
    severity?: string | number | null;
    partySnapshotHash?: string | null;
    partySnapshotSummary?: unknown;
    partyVisualProfile?: unknown;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
  } = {}
): void {
  const event = logStudyEvent({
    eventCategory: "party",
    eventType: "party_gap_detected",
    taskPhase: "party_review",
    activeView: context.activeView ?? "party-view",
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload,
    skipContextEnrichment: true,
  });

  if (event) {
    activePartyGapContext = {
      eventId: event.eventId,
      timestampMs: event.timestampMs,
      gapType: payload.gapType,
      gapKey: payload.gapKey,
      gapLabel: payload.gapLabel ?? null,
      severity: payload.severity ?? null,
      partySnapshotHash: payload.partySnapshotHash ?? null,
    };
  }
}

export function logEvaluationRequested(
  payload: {
    resultSource?: string;
    buildSnapshot?: unknown;
    buildSnapshotSummary?: unknown;
    buildSnapshotHash?: string | null;
    partySnapshotSummary?: unknown;
    partyVisualProfile?: unknown;
    partyGaps?: unknown;
    partySnapshotHash?: string | null;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
  } = {}
): number {
  evaluationIndex += 1;

  const event = logStudyEvent({
    eventCategory: "evaluation",
    eventType: "evaluation_requested",
    taskPhase: "evaluation",
    activeView: context.activeView ?? "main-data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload: {
      evaluationIndex,
      ...payload,
    },
  });

  if (event) {
    activeEvaluationContext = {
      eventId: event.eventId,
      timestampMs: event.timestampMs,
      evaluationIndex,
      activeBuildId: context.activeBuildId ?? null,
      activeBuildLabel: context.activeBuildLabel ?? null,
      activePartyMemberIndex: context.activePartyMemberIndex ?? null,
      activePartyMemberLabel: context.activePartyMemberLabel ?? null,
      buildSnapshotHash: payload.buildSnapshotHash ?? null,
      partySnapshotHash: payload.partySnapshotHash ?? null,
    };
  }

  return evaluationIndex;
}

export function logEvaluationCompleted(
  payload: {
    evaluationIndex?: number;
    averageDpr?: number | null;
    totalDamage?: number | null;
    damageByRound?: unknown;
    damageByType?: unknown;
    abilityContributions?: unknown;
    resourceUse?: unknown;
    resultVector?: unknown;
    rawResult?: unknown;
    buildSnapshotHash?: string | null;
    partySnapshotHash?: string | null;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "evaluation",
    eventType: "evaluation_completed",
    taskPhase: "evaluation",
    activeView: context.activeView ?? "main-data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload: {
      evaluationIndex: payload.evaluationIndex ?? evaluationIndex,
      ...payload,
    },
  });

  if (activeEvaluationContext) {
    activeEvaluationContext = {
      ...activeEvaluationContext,
      averageDpr: payload.averageDpr ?? null,
      totalDamage: payload.totalDamage ?? null,
    };
  }
}

export function logEvaluationFailed(
  payload: {
    evaluationIndex?: number;
    errorMessage: string;
    buildSnapshotHash?: string | null;
    partySnapshotHash?: string | null;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "evaluation",
    eventType: "evaluation_failed",
    taskPhase: "evaluation",
    activeView: context.activeView ?? "main-data-circle",
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: payload.partySnapshotHash ?? null,
    payload: {
      evaluationIndex: payload.evaluationIndex ?? evaluationIndex,
      ...payload,
    },
  });
}

export function logFrictionEvent(
  eventType:
    | "invalid_selection_attempted"
    | "disabled_option_hovered"
    | "choice_limit_reached"
    | "tooltip_opened_after_error"
    | "rapid_toggle_sequence"
    | "undo_or_revert"
    | "reset_section",
  payload: {
    targetType?: string;
    targetId?: string;
    reason?: string;
    [key: string]: unknown;
  },
  context: {
    activeView?: string | null;
    activeBuildId?: string | null;
    activeBuildLabel?: string | null;
    activePartyMemberIndex?: number | null;
    activePartyMemberLabel?: string | null;
    partySnapshotHash?: string | null;
  } = {}
): void {
  logStudyEvent({
    eventCategory: "friction",
    eventType,
    taskPhase: "exploration",
    activeView: context.activeView ?? null,
    activeBuildId: context.activeBuildId ?? null,
    activeBuildLabel: context.activeBuildLabel ?? null,
    activePartyMemberIndex: context.activePartyMemberIndex ?? null,
    activePartyMemberLabel: context.activePartyMemberLabel ?? null,
    partySnapshotHash: context.partySnapshotHash ?? null,
    payload,
  });
}

export function createVisualProfileSummary(
  items: VisualizedItemForLogging[] = []
): VisualProfileSummaryForLogging {
  const roleCounts: Record<string, number> = {};
  const damageTypeCounts: Record<string, number> = {};
  const rangeBandCounts: Record<string, number> = {};
  const resourceCounts: Record<string, number> = {};

  const add = (target: Record<string, number>, value: unknown): void => {
    if (typeof value !== "string" || value.trim().length === 0) return;
    const key = value.trim();
    target[key] = (target[key] ?? 0) + 1;
  };

  const addMany = (target: Record<string, number>, values: unknown): void => {
    if (Array.isArray(values)) {
      values.forEach((value) => add(target, value));
      return;
    }

    add(target, values);
  };

  for (const item of items) {
    addMany(roleCounts, item.roles ?? item.role ?? item.roleGroup);
    addMany(damageTypeCounts, item.damageTypes ?? item.damageType);
    addMany(rangeBandCounts, item.rangeBand ?? item.rangeCategory ?? item.range);
    addMany(resourceCounts, item.resources ?? item.resource ?? item.actionCost ?? item.cost);
  }

  const roles = Object.keys(roleCounts).sort();
  const damageTypes = Object.keys(damageTypeCounts).sort();
  const rangeBands = Object.keys(rangeBandCounts).sort();
  const resources = Object.keys(resourceCounts).sort();

  const countRoleIncludes = (terms: string[]): number => {
    const loweredTerms = terms.map((term) => term.toLowerCase());

    return roles.reduce((sum, role) => {
      const lowerRole = role.toLowerCase();
      const matches = loweredTerms.some((term) => lowerRole.includes(term));
      return matches ? sum + (roleCounts[role] ?? 0) : sum;
    }, 0);
  };

  const damageAbilityCount = countRoleIncludes(["damage"]);
  const healingCount = countRoleIncludes(["heal"]);
  const controlCount = countRoleIncludes(["control"]);
  const supportCount = countRoleIncludes(["support", "buff"]);
  const mobilityCount = countRoleIncludes(["mobility", "position"]);
  const areaDamageCount = countRoleIncludes(["area"]);
  const singleTargetDamageCount = countRoleIncludes(["single"]);
  const longRangeCount = Object.entries(rangeBandCounts).reduce((sum, [key, value]) => {
    const lowered = key.toLowerCase();
    return lowered.includes("long") || lowered.includes("far") ? sum + value : sum;
  }, 0);
  const concentrationCount = items.filter(
    (item) => item.concentration === true || item.requiresConcentration === true
  ).length;

  return {
    selectedAbilityCount: items.length,
    damageAbilityCount,
    utilityAbilityCount: Math.max(0, items.length - damageAbilityCount),
    healingCount,
    controlCount,
    supportCount,
    mobilityCount,
    longRangeCount,
    areaDamageCount,
    singleTargetDamageCount,
    concentrationCount,
    roles,
    damageTypes,
    rangeBands,
    resources,
    roleCounts,
    damageTypeCounts,
    rangeBandCounts,
    resourceCounts,
  };
}

export function createVisualProfileDelta(
  before: VisualProfileSummaryForLogging,
  after: VisualProfileSummaryForLogging
): VisualProfileDeltaForLogging {
  return {
    rolesAdded: arrayDifference(after.roles, before.roles),
    rolesRemoved: arrayDifference(before.roles, after.roles),
    damageTypesAdded: arrayDifference(after.damageTypes, before.damageTypes),
    damageTypesRemoved: arrayDifference(before.damageTypes, after.damageTypes),
    rangeBandsAdded: arrayDifference(after.rangeBands, before.rangeBands),
    rangeBandsRemoved: arrayDifference(before.rangeBands, after.rangeBands),
    resourcesAdded: arrayDifference(after.resources, before.resources),
    resourcesRemoved: arrayDifference(before.resources, after.resources),
    concentrationCountDelta: numberDelta(before.concentrationCount, after.concentrationCount),
    selectedAbilityCountDelta: numberDelta(before.selectedAbilityCount, after.selectedAbilityCount),
    damageAbilityCountDelta: numberDelta(before.damageAbilityCount, after.damageAbilityCount),
    utilityAbilityCountDelta: numberDelta(before.utilityAbilityCount, after.utilityAbilityCount),
    healingCountDelta: numberDelta(before.healingCount, after.healingCount),
    controlCountDelta: numberDelta(before.controlCount, after.controlCount),
    supportCountDelta: numberDelta(before.supportCount, after.supportCount),
    mobilityCountDelta: numberDelta(before.mobilityCount, after.mobilityCount),
    longRangeCountDelta: numberDelta(before.longRangeCount, after.longRangeCount),
    areaDamageCountDelta: numberDelta(before.areaDamageCount, after.areaDamageCount),
    singleTargetDamageCountDelta: numberDelta(before.singleTargetDamageCount, after.singleTargetDamageCount),
  };
}

function arrayDifference(a: string[] = [], b: string[] = []): string[] {
  const bSet = new Set(b);
  return Array.from(new Set(a)).filter((item) => !bSet.has(item)).sort();
}

function numberDelta(before: unknown, after: unknown): number {
  const beforeNumber = typeof before === "number" && Number.isFinite(before) ? before : 0;
  const afterNumber = typeof after === "number" && Number.isFinite(after) ? after : 0;
  return afterNumber - beforeNumber;
}

export function createStableHash(value: unknown, prefix = "hash"): string {
  const input = stableStringify(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  return `${prefix}-${hash}`;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableStringify(value));
}

function sortForStableStringify(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableStringify);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortForStableStringify(record[key]);
        return acc;
      }, {});
  }

  return value;
}

export function createBuildSnapshotSummary(
  snapshot: unknown
): BuildSnapshotSummaryForLogging | null {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const record = snapshot as Record<string, unknown>;

  return {
    buildName: record.buildName ?? null,
    characterName: record.characterName ?? null,
    selectedRace: record.selectedRace ?? null,
    selectedSubrace: record.selectedSubrace ?? null,
    selectedBackground: record.selectedBackground ?? null,
    selectedClass: record.selectedClass ?? null,
    selectedSubclass: record.selectedSubclass ?? null,
    selectedLevel: record.selectedLevel ?? null,
    selectedSpellCount: Array.isArray(record.selectedSpellIds) ? record.selectedSpellIds.length : 0,
    selectedClassFeatureCount: Array.isArray(record.selectedClassFeatureIds)
      ? record.selectedClassFeatureIds.length
      : 0,
    activeClassFeatureCount: Array.isArray(record.activeClassFeatureIds)
      ? record.activeClassFeatureIds.length
      : 0,
    selectedClassSkillsCount: Array.isArray(record.selectedClassSkills)
      ? record.selectedClassSkills.length
      : 0,
    featSelectionCount: Array.isArray(record.featSelections) ? record.featSelections.length : 0,
    snapshotHash: createStableHash(snapshot, "build"),
  };
}

function extractSnapshotFromSlot(slot: unknown): unknown {
  if (!slot || typeof slot !== "object") return null;

  const record = slot as Record<string, unknown>;
  return record.snapshot ?? slot;
}

export function createPartySnapshotSummary(input: unknown): PartySnapshotSummaryForLogging {
  const record = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : { partySlots: input };

  const partySlots = Array.isArray(record.partySlots) ? record.partySlots : [];
  const focusedBuild = record.focusedBuild ?? null;
  const focusedBuildId = typeof record.focusedBuildId === "string" ? record.focusedBuildId : null;
  const focusedBuildLabel = typeof record.focusedBuildLabel === "string" ? record.focusedBuildLabel : null;

  const slotHashes = partySlots.map((slot, index) => {
    const slotRecord = slot && typeof slot === "object" ? (slot as Record<string, unknown>) : null;
    const snapshot = extractSnapshotFromSlot(slot);

    return {
      partyMemberIndex: index,
      slotNumber: index + 1,
      savedBuildId: typeof slotRecord?.id === "string" ? slotRecord.id : null,
      label: typeof slotRecord?.label === "string" ? slotRecord.label : null,
      snapshotHash: snapshot ? createStableHash(snapshot, "build") : null,
      summary: snapshot ? createBuildSnapshotSummary(snapshot) : null,
    };
  });

  const hashInput = {
    focusedBuild,
    focusedBuildId,
    focusedBuildLabel,
    partySlots: slotHashes.map((slot) => slot.snapshotHash),
  };

  const filledSlotCount =
    slotHashes.filter((slot) => Boolean(slot.snapshotHash)).length +
    (focusedBuild ? 1 : 0);

  const emptySlotCount = slotHashes.filter(
    (slot) => !slot.snapshotHash
  ).length;

  const partySize = partySlots.length + (focusedBuild ? 1 : 0);

  return {
    partySize,
    totalPartyMemberCount: partySize,

    filledSlotCount,
    filledPartySlotCount: filledSlotCount,

    emptySlotCount,

    focusedBuildId,
    focusedBuildLabel,
    focusedBuildSummary: focusedBuild
      ? createBuildSnapshotSummary(focusedBuild)
      : null,
    focusedBuildHash: focusedBuild
      ? createStableHash(focusedBuild, "build")
      : null,

    slotHashes,
    partySnapshotHash: createStableHash(hashInput, "party"),
  };
}

function countRecordValues(record: Record<string, number> = {}): number {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function createGap(
  gapType: string,
  gapKey: string,
  gapLabel: string,
  count: number,
  desiredMinimum = 1
): PartyGapForLogging | null {
  if (count >= desiredMinimum) return null;

  return {
    gapType,
    gapKey,
    gapLabel,
    count,
    severity: count === 0 ? "high" : "medium",
  };
}

export function createPartyCoverageForLogging(input: {
  partySnapshotSummary: PartySnapshotSummaryForLogging;
  partyVisualProfile: VisualProfileSummaryForLogging;
}): PartyCoverageForLogging {
  const { partySnapshotSummary, partyVisualProfile } = input;
  const gaps: PartyGapForLogging[] = [];

  const candidateGaps = [
    createGap("role", "healing", "No clear healing option", partyVisualProfile.healingCount),
    createGap("role", "control", "No clear control option", partyVisualProfile.controlCount),
    createGap("role", "support", "No clear support/buff option", partyVisualProfile.supportCount),
    createGap("role", "mobility", "No clear mobility/positioning option", partyVisualProfile.mobilityCount),
    createGap("role", "area-damage", "No clear area damage option", partyVisualProfile.areaDamageCount),
    createGap("role", "single-target-damage", "No clear single-target damage option", partyVisualProfile.singleTargetDamageCount),
    createGap("range", "long-range", "No clear long-range option", partyVisualProfile.longRangeCount),
  ];

  for (const gap of candidateGaps) {
    if (gap) gaps.push(gap);
  }

  const totalRoleAssignments = countRecordValues(partyVisualProfile.roleCounts);
  const roleRedundancy = Object.values(partyVisualProfile.roleCounts).reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0
  );
  const redundancyScore = totalRoleAssignments > 0 ? roleRedundancy / totalRoleAssignments : 0;

  return {
    partySnapshotSummary,
    partyVisualProfile,
    partyGaps: gaps,
    redundancyScore,
    partyRedundancyScore: redundancyScore,
  };
}

function diffSnapshots(
  previousSnapshot: Record<string, unknown>,
  nextSnapshot: Record<string, unknown>
): Record<string, { previousValue: unknown; nextValue: unknown }> {
  const keys = new Set([...Object.keys(previousSnapshot), ...Object.keys(nextSnapshot)]);
  const diff: Record<string, { previousValue: unknown; nextValue: unknown }> = {};

  for (const key of keys) {
    const previousValue = previousSnapshot[key];
    const nextValue = nextSnapshot[key];

    if (stableStringify(previousValue) !== stableStringify(nextValue)) {
      diff[key] = { previousValue, nextValue };
    }
  }

  return diff;
}

export function createBuildEditLoggingPayload(input: {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  previousSnapshot: Record<string, unknown>;
  nextSnapshot: Record<string, unknown>;
  previousItems?: VisualizedItemForLogging[];
  nextItems?: VisualizedItemForLogging[];
  extraPayload?: Record<string, unknown>;
}): BuildEditLoggingPayload {
  const visualProfileBefore = createVisualProfileSummary(input.previousItems ?? []);
  const visualProfileAfter = createVisualProfileSummary(input.nextItems ?? []);
  const visualProfileDelta = createVisualProfileDelta(visualProfileBefore, visualProfileAfter);

  return {
    field: input.field,
    oldValue: input.oldValue,
    newValue: input.newValue,
    previousSnapshotHash: createStableHash(input.previousSnapshot, "build"),
    nextSnapshotHash: createStableHash(input.nextSnapshot, "build"),
    previousSnapshotSummary: createBuildSnapshotSummary(input.previousSnapshot),
    nextSnapshotSummary: createBuildSnapshotSummary(input.nextSnapshot),
    snapshotDiff: diffSnapshots(input.previousSnapshot, input.nextSnapshot),
    visualProfileBefore,
    visualProfileAfter,
    visualProfileDelta,
    ...(input.extraPayload ?? {}),
  };
}

function sanitizeForLogging(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 200
      ? {
          kind: "redacted_free_text",
          isEmpty: value.trim().length === 0,
          length: value.length,
        }
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLogging);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(record)) {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes("notes") ||
        lowerKey.includes("comment") ||
        lowerKey.includes("free") ||
        lowerKey.includes("description")
      ) {
        const text = typeof nestedValue === "string" ? nestedValue : JSON.stringify(nestedValue ?? "");
        sanitized[key] = {
          kind: "redacted_free_text",
          isEmpty: text.trim().length === 0,
          length: text.length,
        };
      } else {
        sanitized[key] = sanitizeForLogging(nestedValue);
      }
    }

    return sanitized;
  }

  return value;
}