export type StudyEventCategory =
  | "study"
  | "heatmap"
  | "build_edit"
  | "build_state"
  | "build_lifecycle"
  | "party"
  | "visualization"
  | "navigation"
  | "simulator"
  | "evaluation"
  | "process"
  | "export"
  | "system"
  | "task"
  | "friction";

export type StudyTaskPhase =
  | "not_started"
  | "initial_planning"
  | "exploration"
  | "revision"
  | "party_review"
  | "evaluation"
  | "submission"
  | (string & {});

export type StudyEventType =
  | "study_started"
  | "study_ended"
  | "survey_pre_task_submitted"
  | "survey_post_task_submitted"
  | "logs_cleared"
  | "logs_exported"
  | "survey_answers_exported"
  | "system_metadata_captured"
  | "heatmap_display_profile_captured"
  | "heatmap_pointer_move"
  | "heatmap_pointer_down"
  | "heatmap_click"
  | "heatmap_scroll"
  | "heatmap_hover_start"
  | "heatmap_hover_end"
  | "heatmap_hover_dwell"
  | "build_edit"
  | "build_semantic_delta"
  | "build_saved"
  | "build_loaded"
  | "build_deleted"
  | "build_overwritten"
  | "build_restored_from_history"
  | "history_entry_created"
  | "party_snapshot_recorded"
  | "party_slot_assigned"
  | "party_slot_cleared"
  | "party_slot_focused"
  | "party_focus_changed"
  | "party_coverage_updated"
  | "party_gap_detected"
  | "party_gap_response_edit"
  | "party_planner_toggled"
  | "aggregate_focused"
  | "editable_focused"
  | "aggregate_to_member_revision"
  | "data_circle_focus_hover_started"
  | "data_circle_focus_hover_ended"
  | "data_circle_focus_hover_dwell"
  | "data_circle_focus_selected"
  | "data_circle_focus_cleared"
  | "data_circle_focus_to_action"
  | "data_circle_dpr_layout_changed"
  | "linked_highlight_exposed"
  | "highlighted_item_selected"
  | "highlighted_item_tooltip_opened"
  | "highlighted_item_tooltip_closed"
  | "nonhighlighted_item_selected_under_focus"
  | "visualization_focus_changed"
  | "visualization_focus_cleared"
  | "visualization_layer_toggled"
  | "tab_changed"
  | "view_changed"
  | "planner_tab_changed"
  | "simulator_request_started"
  | "simulator_request_succeeded"
  | "simulator_request_failed"
  | "evaluation_requested"
  | "evaluation_completed"
  | "evaluation_failed"
  | "post_evaluation_edit"
  | "final_party_submitted"
  | "invalid_selection_attempted"
  | "disabled_option_hovered"
  | "choice_limit_reached"
  | "tooltip_opened_after_error"
  | "rapid_toggle_sequence"
  | "undo_or_revert"
  | "reset_section"
  | "data_circle_damage_preview_updated"
| "data_circle_simulator_dpr_replaced_damage_preview"
  | (string & {});

export type HeatmapPointerEventType =
  | "heatmap_pointer_move"
  | "heatmap_pointer_down"
  | "heatmap_click"
  | "heatmap_hover_start"
  | "heatmap_hover_end"
  | "heatmap_hover_dwell"
  | "heatmap_scroll";

export type StudySessionStatus = "running" | "ended";

export type RedactedFreeTextValue = {
  kind: "redacted_free_text";
  isEmpty: boolean;
  length: number;
};

export type HeatmapTargetForLogging = {
  tagName: string;
  elementType: string | null;
  inputType: string | null;
  role: string | null;
  ariaLabel: string | null;
  title: string | null;
  text: string | null;
  id: string | null;
  className: string | null;
  studyRegion: string | null;
  studyElement: string | null;
  studyId: string | null;
  selector: string | null;
  nearestLabelText: string | null;
  isInteractive: boolean;
  disabled: boolean | null;
};
export type HeatmapPointerPayload = {
  target: HeatmapTargetForLogging;
  pointerType: string;
  button: number;

  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  documentHeight: number;
  viewportAspectRatio?: number;
  viewportOrientation?: "horizontal" | "vertical" | "square-ish";
  viewportCategory?:
    | "mobile-narrow"
    | "tablet-or-small-laptop"
    | "desktop"
    | "large-desktop";

  viewportXNorm: number;
  viewportYNorm: number;
  documentXNorm: number;
  documentYNorm: number;
  scrollXNorm?: number;
  scrollYNorm?: number;

  sampleIntervalMs?: number;
  dwellDurationMs?: number;
};

export type StudyEnvironmentMetadata = {
  userAgent: string;
  platform: string;
  timezoneOffsetMinutes: number;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
};

export type StudySession = {
  participantId: string;
  sessionId: string;
  status: StudySessionStatus;
  startedAt: string;
  startedAtMs: number;
  endedAt?: string;
  endedAtMs?: number;
  exportFormat: "jsonl";
  studyDesign: "single_condition_single_task_party_building";
  prototypeVersion: string;
  appVersion: string;
  dataModelVersion: string;
  environment: StudyEnvironmentMetadata;
};

export type DataCircleFocusTrigger =
  | "hover"
  | "click"
  | "keyboard"
  | "programmatic"
  | string;

export type DataCircleFocusForLogging = {
  focusType: string;
  focusKey: string;
  focusLabel?: string | null;
  focusLayer?: string | null;
  focusSource?: string | null;
  focusTrigger: DataCircleFocusTrigger;
  itemId?: string | null;
  itemName?: string | null;
  role?: string | null;
  damageType?: string | null;
  rangeBand?: string | null;
  resource?: string | null;
  [key: string]: unknown;
};

export type FocusContextForLogging = {
  eventId: string;
  timestampMs: number;
  focusType: string;
  focusKey: string;
  focusLabel?: string | null;
  focusLayer?: string | null;
  focusSource?: string | null;
  focusTrigger?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  partySnapshotHash?: string | null;
};

export type PartyGapContextForLogging = {
  eventId: string;
  timestampMs: number;
  gapType: string;
  gapKey: string;
  gapLabel?: string | null;
  severity?: string | number | null;
  partySnapshotHash?: string | null;
};

export type EvaluationContextForLogging = {
  eventId: string;
  timestampMs: number;
  evaluationIndex: number;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  buildSnapshotHash?: string | null;
  partySnapshotHash?: string | null;
  averageDpr?: number | null;
  totalDamage?: number | null;
};

export type StudyEventDerivedContext = {
  dprAttentionRelevant?: boolean;
  nonDprAttentionRelevant?: boolean;
  partyAttentionRelevant?: boolean;
  focusContext?: FocusContextForLogging;
  focusToActionLatencyMs?: number;
  gapContext?: PartyGapContextForLogging;
  gapToActionLatencyMs?: number;
  evaluationContext?: EvaluationContextForLogging;
  evaluationToActionLatencyMs?: number;
};

export type StudyEventContext = {
  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  activeVisualizationFocus?: unknown;
  partySnapshotHash?: string | null;
};

export type StudyLogEvent = {
  eventId: string;
  sequenceNumber: number;
  timestamp: string;
  timestampMs: number;
  elapsedStudyMs: number;
  participantId: string;
  sessionId: string;
  studyDesign: StudySession["studyDesign"];
  prototypeVersion: string;
  appVersion: string;
  dataModelVersion: string;
  taskPhase: StudyTaskPhase;
  eventCategory: StudyEventCategory;
  eventType: StudyEventType;
  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  activeVisualizationFocus?: unknown;
  partySnapshotHash?: string | null;
  derived?: StudyEventDerivedContext;
  payload?: unknown;
};

export type StudyLoggerEventInput = StudyEventContext & {
  eventCategory: StudyEventCategory;
  eventType: StudyEventType;
  taskPhase?: StudyTaskPhase;
  payload?: unknown;
  skipContextEnrichment?: boolean;
};

export type StudyLoggerStartOptions = {
  clearExistingLogs?: boolean;
  prototypeVersion?: string;
  appVersion?: string;
  dataModelVersion?: string;
};

export type StudyLoggerEndPayload = {
  finalPartyComplete?: boolean | null;
  finalPartySnapshotSummary?: unknown;
  finalPartyVisualProfile?: unknown;
  finalPartyGaps?: unknown;
  finalRedundancyScore?: number | null;
  exportedByParticipant?: boolean;
  [key: string]: unknown;
};
export type VisualizedItemForLogging = {
  id?: string;
  itemId?: string;
  abilityId?: string;
  spellId?: string;
  featureId?: string;
  name?: string;
  itemName?: string;
  abilityName?: string;
  label?: string;

  role?: string;
  roles?: string[];
  roleGroup?: string;

  damageType?: string;
  damageTypes?: string[];
  damageProfile?: {
    hasDamage?: boolean;
    damageKind?: string;
    delivery?: string;
    scaling?: string;
    saveBehaviour?: string;
    saveAbility?: string | null;
    attackRoll?: boolean;
    canCrit?: boolean;
    repeats?: boolean;
    repeatDurationTurns?: number | null;
    targetCount?: number | null;
    aoe?: boolean;
    aoeMeters?: number | null;
    min?: number;
    average?: number;
    max?: number;
    rolls?: unknown[];
    notes?: string | null;
    [key: string]: unknown;
  } | null;

  range?: string | { category?: string; label?: string; meters?: number };
  rangeBand?: string;
  rangeCategory?: string;

  resource?: string;
  resources?: string[];
  actionCost?: string;
  cost?: string;
  costs?: {
    actions?: string[];
    resources?: string[];
    requiresConcentration?: boolean;
    [key: string]: unknown;
  };

  concentration?: boolean;
  requiresConcentration?: boolean;
  tags?: string[];

  [key: string]: unknown;
};

export type VisualProfileSummaryForLogging = {
  selectedAbilityCount: number;
  damageAbilityCount: number;
  utilityAbilityCount: number;
  healingCount: number;
  controlCount: number;
  supportCount: number;
  mobilityCount: number;
  longRangeCount: number;
  areaDamageCount: number;
  singleTargetDamageCount: number;
  concentrationCount: number;
  roles: string[];
  damageTypes: string[];
  rangeBands: string[];
  resources: string[];
  roleCounts: Record<string, number>;
  damageTypeCounts: Record<string, number>;
  rangeBandCounts: Record<string, number>;
  resourceCounts: Record<string, number>;
};

export type VisualProfileDeltaForLogging = {
  rolesAdded: string[];
  rolesRemoved: string[];
  damageTypesAdded: string[];
  damageTypesRemoved: string[];
  rangeBandsAdded: string[];
  rangeBandsRemoved: string[];
  resourcesAdded: string[];
  resourcesRemoved: string[];
  concentrationCountDelta: number;
  selectedAbilityCountDelta: number;
  damageAbilityCountDelta: number;
  utilityAbilityCountDelta: number;
  healingCountDelta: number;
  controlCountDelta: number;
  supportCountDelta: number;
  mobilityCountDelta: number;
  longRangeCountDelta: number;
  areaDamageCountDelta: number;
  singleTargetDamageCountDelta: number;
};

export type BuildSnapshotSummaryForLogging = {
  buildName: unknown;
  characterName: unknown;
  selectedRace: unknown;
  selectedSubrace: unknown;
  selectedBackground: unknown;
  selectedClass: unknown;
  selectedSubclass: unknown;
  selectedLevel: unknown;
  selectedSpellCount: number;
  selectedClassFeatureCount: number;
  activeClassFeatureCount: number;
  selectedClassSkillsCount: number;
  featSelectionCount: number;
  snapshotHash: string;
};

export type PartySnapshotSummaryForLogging = {
  partySize: number;
  totalPartyMemberCount: number;

  filledSlotCount: number;
  filledPartySlotCount: number;

  emptySlotCount: number;

  focusedBuildId?: string | null;
  focusedBuildLabel?: string | null;
  focusedBuildSummary?: BuildSnapshotSummaryForLogging | null;
  focusedBuildHash?: string | null;

  slotHashes: Array<{
    partyMemberIndex: number;
    slotNumber: number;
    savedBuildId?: string | null;
    label?: string | null;
    snapshotHash: string | null;
    summary: BuildSnapshotSummaryForLogging | null;
  }>;

  partySnapshotHash: string;
};

export type PartyGapForLogging = {
  gapType: string;
  gapKey: string;
  gapLabel: string;
  severity: "low" | "medium" | "high";
  count?: number;
};

export type PartyCoverageForLogging = {
  partySnapshotSummary: PartySnapshotSummaryForLogging;
  partyVisualProfile: VisualProfileSummaryForLogging;
  partyGaps: PartyGapForLogging[];
  redundancyScore: number;
  partyRedundancyScore: number;
};

export type BuildEditLoggingPayload = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  previousSnapshotHash: string;
  nextSnapshotHash: string;
  previousSnapshotSummary: BuildSnapshotSummaryForLogging | null;
  nextSnapshotSummary: BuildSnapshotSummaryForLogging | null;
  snapshotDiff: Record<string, { previousValue: unknown; nextValue: unknown }>;
  visualProfileBefore: VisualProfileSummaryForLogging;
  visualProfileAfter: VisualProfileSummaryForLogging;
  visualProfileDelta: VisualProfileDeltaForLogging;
  [key: string]: unknown;
};
