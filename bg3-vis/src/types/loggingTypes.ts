import type { BuildEditorSnapshot, SavedBuild } from "./savedBuildTypes";

export type StudyEventCategory =
  | "session"
  | "task"
  | "build_lifecycle"
  | "build_edit"
  | "party"
  | "visualization"
  | "evaluation"
  | "process"
  | "export";

export type StudyEventType =
  | "study_session_metadata_updated"
  | "task_started"
  | "task_completed"
  | "final_party_submitted"
  | "build_saved"
  | "build_overwritten"
  | "build_loaded"
  | "build_deleted"
  | "build_restored_from_history"
  | "history_entry_created"
  | "build_edit"
  | "party_slot_assigned"
  | "party_slot_cleared"
  | "party_slot_focused"
  | "aggregate_focused"
  | "editable_focused"
  | "party_planner_toggled"
  | "planner_tab_changed"
  | "data_circle_dpr_layout_changed"
  | "data_circle_focus_hovered"
  | "data_circle_focus_selected"
  | "data_circle_focus_cleared"
  | "process_panel_expanded"
  | "process_panel_collapsed"
  | "process_node_selected"
  | "process_node_loaded"
  | "process_node_restored"
  | "process_node_assigned_to_party"
  | "process_zoom_changed"
  | "process_view_reset"
  | "process_focus_selected_version"
  | "saved_build_search_changed"
  | "evaluation_requested"
  | "evaluation_completed"
  | "evaluation_failed"
  | "logs_exported"
  | "logs_cleared";

export type VisualizationConditionId = "baseline" | "redesigned" | string;

export type StudySessionMetadata = {
  participantId: string;
  sessionId: string;
  taskId: string;
  conditionId: VisualizationConditionId;
  conditionSequenceIndex: number;
  activeScenarioPreset: string;
  activeVisualizationState: string;
  isLoggingEnabled: boolean;
  taskStartedAt: string | null;
};

export type StudyLogPayload = Record<string, unknown>;

export type StudyLogEvent = {
  eventId: string;
  sequenceNumber: number;
  timestamp: string;
  timestampMs: number;
  elapsedTaskMs: number | null;

  participantId: string;
  sessionId: string;
  taskId: string;
  conditionId: VisualizationConditionId;
  conditionSequenceIndex: number;

  activeScenarioPreset: string;
  activeVisualizationState: string;
  activeView?: string;

  eventCategory: StudyEventCategory;
  eventType: StudyEventType;

  activeBuildId?: string;
  activeBuildLabel?: string;

  payload?: StudyLogPayload;
};

export type StudyLogInput = {
  eventCategory: StudyEventCategory;
  eventType: StudyEventType;
  activeBuildId?: string;
  activeBuildLabel?: string;
  activeView?: string;
  payload?: StudyLogPayload;
};

export type FinalPartySnapshotForLogging = {
  focusedBuild: BuildEditorSnapshot;
  partySlots: Array<SavedBuild | null>;
};