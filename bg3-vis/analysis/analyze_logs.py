from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "data" / "raw_jsonl"
OUT_DIR = BASE_DIR / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)


OUTPUT_FILES = [
    "analysis_manifest.csv",
    "data_quality_report.csv",
    "clean_events_flat.csv",
    "participant_log_metrics.csv",
    "event_type_counts.csv",
    "event_category_counts.csv",
    "deliberate_event_family_counts.csv",
    "build_edit_events_long.csv",
    "build_edit_field_counts.csv",
    "visualization_focus_events.csv",
    "visualization_focus_summary.csv",
    "party_gap_events.csv",
    "gap_summary.csv",
    "heatmap_semantic_events.csv",
    "heatmap_target_summary.csv",
    "heatmap_region_summary.csv",
    "timeline_bins.csv",
    "feature_followup_events.csv",
    "final_party_members.csv",
    "final_party_profile_long.csv",
    "evaluation_events.csv",
    "friction_events.csv",
]


BUILD_EDIT_EVENTS = {
    "build_edit",
    "build_semantic_delta",
    "character_field_changed",
    "class_field_changed",
    "spell_toggle_attempted",
    "class_feature_toggle_attempted",
    "class_skill_toggle_attempted",
    "limited_skill_toggle_attempted",
    "ability_score_changed",
    "ability_bonus_changed",
    "feat_name_changed",
    "feat_choice_toggled",
    "feat_ability_changed",
    "level_changed",
}

CORE_BUILD_EDIT_EVENTS = {"build_edit"}

SAVED_BUILD_EVENTS = {
    "save_current_build_clicked",
    "build_saved",
    "saved_build_created",
    "build_loaded",
    "saved_build_loaded",
    "build_deleted",
    "saved_build_deleted",
    "build_overwritten",
    "build_restored_from_history",
    "history_entry_created",
    "saved_build_card_hover_started",
    "saved_build_card_hover_ended",
    "saved_build_card_hover_dwell",
    "saved_build_search_changed",
    "saved_build_send_to_party_clicked",
}

PARTY_EVENTS = {
    "party_slot_assigned",
    "party_slot_cleared",
    "party_coverage_updated",
    "party_gap_detected",
    "party_gap_response_edit",
    "party_member_focused",
    "party_aggregate_focused",
    "party_planner_toggled",
}

VISUALIZATION_EVENTS = {
    "data_circle_focus_selected",
    "data_circle_focus_cleared",
    "data_circle_focus_hover_started",
    "data_circle_focus_hover_ended",
    "data_circle_focus_hover_dwell",
    "data_circle_damage_preview_updated",
    "highlighted_item_tooltip_opened",
    "highlighted_item_tooltip_closed",
    "highlighted_item_selected",
    "linked_highlight_exposed",
    "layer_toggled",
    "dpr_layout_changed",
}

VISUALIZATION_FOLLOWUP_TRIGGER_EVENTS = {
    "data_circle_focus_selected",
    "data_circle_focus_hover_dwell",
    "highlighted_item_tooltip_opened",
    "highlighted_item_selected",
    "linked_highlight_exposed",
}

EVALUATION_EVENTS = {
    "evaluation_requested",
    "evaluation_completed",
    "evaluation_failed",
    "simulator_request_started",
    "simulator_request_success",
    "simulator_request_failed",
}

FRICTION_EVENTS = {
    "invalid_selection_attempted",
    "disabled_option_hovered",
    "choice_limit_reached",
    "rapid_toggle_sequence",
    "undo_or_revert_action",
    "section_reset",
}

LOW_LEVEL_HEATMAP_EVENTS = {
    "heatmap_pointer_move",
    "heatmap_pointer_down",
    "heatmap_click",
    "heatmap_hover_dwell",
    "heatmap_scroll",
    "heatmap_display_profile",
}

STUDY_ADMIN_EVENTS = {
    "study_started",
    "study_ended",
    "survey_pre_task_submitted",
    "survey_post_task_submitted",
    "tutorial_opened",
    "tutorial_closed",
    "tutorial_step_viewed",
    "tutorial_step_changed",
}

NAVIGATION_EVENTS = {
    "tab_changed",
    "view_changed",
    "planner_tab_changed",
    "process_zoom_changed",
    "process_view_mode_changed",
    "process_node_hover_started",
    "process_node_hover_ended",
    "new_blank_build_started",
}

MEANINGFUL_EVENTS_EXCLUDING_POINTER_MOVE = (
    BUILD_EDIT_EVENTS
    | SAVED_BUILD_EVENTS
    | PARTY_EVENTS
    | VISUALIZATION_EVENTS
    | EVALUATION_EVENTS
    | FRICTION_EVENTS
    | STUDY_ADMIN_EVENTS
    | NAVIGATION_EVENTS
)

TIMELINE_PLANNING_EVENTS = (
    CORE_BUILD_EDIT_EVENTS
    | {
        # Saved-build / history workflow
        "save_current_build_clicked",
        "build_saved",
        "saved_build_created",
        "build_loaded",
        "saved_build_loaded",
        "build_deleted",
        "saved_build_deleted",
        "build_overwritten",
        "build_restored_from_history",
        "history_entry_created",
        "saved_build_send_to_party_clicked",

        # Party workflow
        "party_slot_assigned",
        "party_slot_cleared",
        "party_gap_response_edit",
        "party_member_focused",
        "party_aggregate_focused",
        "party_planner_toggled",

        # Data Circle / visualization use
        "data_circle_focus_selected",
        "data_circle_focus_hover_dwell",
        "data_circle_focus_cleared",
        "highlighted_item_tooltip_opened",
        "highlighted_item_selected",
        "linked_highlight_exposed",
        "layer_toggled",
        "dpr_layout_changed",

        # Evaluation / simulator
        "evaluation_requested",
        "evaluation_completed",
        "evaluation_failed",
        "simulator_request_started",
        "simulator_request_success",
        "simulator_request_succeeded",
        "simulator_request_failed",

        # Friction / blocked actions
        "invalid_selection_attempted",
        "choice_limit_reached",
        "rapid_toggle_sequence",
        "undo_or_revert",
        "undo_or_revert_action",
        "reset_section",
        "section_reset",

        # Navigation / process movement
        "tab_changed",
        "view_changed",
        "planner_tab_changed",
        "process_zoom_changed",
        "process_view_mode_changed",
        "new_blank_build_started",
    }
)
DELIBERATE_PLANNING_EVENTS = (
    CORE_BUILD_EDIT_EVENTS
    | SAVED_BUILD_EVENTS
    | {
        "party_slot_assigned",
        "party_slot_cleared",
        "party_gap_response_edit",
        "party_member_focused",
        "party_aggregate_focused",
        "party_planner_toggled",
    }
    | VISUALIZATION_EVENTS
    | EVALUATION_EVENTS
    | FRICTION_EVENTS
    | {
        "tab_changed",
        "view_changed",
        "planner_tab_changed",
        "process_zoom_changed",
        "process_view_mode_changed",
        "new_blank_build_started",
    }
)


def clean_output_dir() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for filename in OUTPUT_FILES:
        path = OUT_DIR / filename
        if path.exists():
            path.unlink()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()

    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)

    return h.hexdigest()


def safe_get(d: Any, path: Iterable[str], default: Any = None) -> Any:
    cur = d

    for key in path:
        if not isinstance(cur, dict):
            return default

        cur = cur.get(key)

        if cur is None:
            return default

    return cur


def parse_num(value: Any) -> float:
    if value is None or value == "":
        return np.nan

    try:
        return float(value)
    except Exception:
        return np.nan


def normalize_participant_id_from_filename(filename: str) -> Optional[str]:
    match = re.search(r"(participant-[A-Za-z0-9_-]+)", filename)
    return match.group(1) if match else None


def discover_jsonl_files(raw_dir: Path) -> List[Path]:
    if not raw_dir.exists():
        raise FileNotFoundError(
            f"Raw log folder does not exist: {raw_dir}\n"
            "Create this folder and place exported .jsonl files inside it."
        )

    files = sorted(p for p in raw_dir.rglob("*.jsonl") if p.is_file())

    if not files:
        raise FileNotFoundError(
            f"No .jsonl files found in {raw_dir}\n"
            "Put participant .jsonl files in analysis/data/raw_jsonl."
        )

    return files


def parse_jsonl_file(path: Path, source_hash: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    parse_errors = 0

    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                parse_errors += 1
                continue

            if not isinstance(event, dict):
                parse_errors += 1
                continue

            payload = event.get("payload") if isinstance(event.get("payload"), dict) else {}

            participant_id = (
                event.get("participantId")
                or safe_get(payload, ["session", "participantId"])
                or normalize_participant_id_from_filename(path.name)
            )

            session_id = (
                event.get("sessionId")
                or safe_get(payload, ["session", "sessionId"])
                or participant_id
            )

            rows.append(
                {
                    "source_file": path.name,
                    "source_path": str(path),
                    "source_hash": source_hash,
                    "event_id": event.get("eventId"),
                    "sequence_number": event.get("sequenceNumber"),
                    "timestamp": event.get("timestamp"),
                    "timestamp_ms": event.get("timestampMs"),
                    "elapsed_ms": event.get("elapsedStudyMs"),
                    "participant_id": participant_id,
                    "session_id": session_id,
                    "study_design": event.get("studyDesign"),
                    "prototype_version": event.get("prototypeVersion"),
                    "app_version": event.get("appVersion"),
                    "data_model_version": event.get("dataModelVersion"),
                    "task_phase": event.get("taskPhase"),
                    "event_category": event.get("eventCategory"),
                    "event_type": event.get("eventType"),
                    "active_view": event.get("activeView"),
                    "active_build_id": event.get("activeBuildId"),
                    "active_build_label": event.get("activeBuildLabel"),
                    "active_party_member_index": event.get("activePartyMemberIndex"),
                    "active_party_member_label": event.get("activePartyMemberLabel"),
                    "active_focus_source": event.get("activeFocusSource"),
                    "active_visualization_focus": event.get("activeVisualizationFocus"),
                    "party_snapshot_hash": event.get("partySnapshotHash"),
                    "payload": payload,
                }
            )

    df = pd.DataFrame(rows)

    if not df.empty:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
        df["timestamp_ms"] = pd.to_numeric(df["timestamp_ms"], errors="coerce")
        df["elapsed_ms"] = pd.to_numeric(df["elapsed_ms"], errors="coerce")
        df["sequence_number"] = pd.to_numeric(df["sequence_number"], errors="coerce")

    manifest_row = {
        "source_file": path.name,
        "source_path": str(path),
        "source_hash": source_hash,
        "parse_errors": parse_errors,
        "raw_event_count": int(len(df)),
        "participant_id": (
            df["participant_id"].dropna().iloc[0]
            if not df.empty and df["participant_id"].notna().any()
            else normalize_participant_id_from_filename(path.name)
        ),
        "session_id": (
            df["session_id"].dropna().iloc[0]
            if not df.empty and df["session_id"].notna().any()
            else normalize_participant_id_from_filename(path.name)
        ),
        "first_timestamp": df["timestamp"].min() if not df.empty else pd.NaT,
        "last_timestamp": df["timestamp"].max() if not df.empty else pd.NaT,
        "study_ended_count": int((df["event_type"] == "study_ended").sum()) if not df.empty else 0,
        "post_task_survey_count": int((df["event_type"] == "survey_post_task_submitted").sum()) if not df.empty else 0,
        "export_event_count": int(df["event_type"].fillna("").str.contains("export", case=False).sum()) if not df.empty else 0,
    }

    return df, manifest_row


def load_and_select_logs(raw_dir: Path) -> Tuple[pd.DataFrame, pd.DataFrame]:
    files = discover_jsonl_files(raw_dir)

    seen_hashes: Dict[str, str] = {}
    frames: List[pd.DataFrame] = []
    manifest_rows: List[Dict[str, Any]] = []

    for path in files:
        source_hash = sha256_file(path)

        if source_hash in seen_hashes:
            manifest_rows.append(
                {
                    "source_file": path.name,
                    "source_path": str(path),
                    "source_hash": source_hash,
                    "status": "excluded",
                    "exclude_reason": f"exact_duplicate_of:{seen_hashes[source_hash]}",
                    "parse_errors": 0,
                    "raw_event_count": 0,
                    "participant_id": normalize_participant_id_from_filename(path.name),
                    "session_id": normalize_participant_id_from_filename(path.name),
                    "first_timestamp": pd.NaT,
                    "last_timestamp": pd.NaT,
                    "study_ended_count": 0,
                    "post_task_survey_count": 0,
                    "export_event_count": 0,
                }
            )
            continue

        seen_hashes[source_hash] = path.name

        df, row = parse_jsonl_file(path, source_hash)
        row["status"] = "candidate"
        row["exclude_reason"] = ""
        manifest_rows.append(row)

        if not df.empty:
            frames.append(df)

    if not frames:
        manifest = pd.DataFrame(manifest_rows)
        manifest.to_csv(OUT_DIR / "analysis_manifest.csv", index=False, encoding="utf-8-sig")
        raise ValueError("No readable events could be parsed.")

    all_events = pd.concat(frames, ignore_index=True)
    all_events = all_events.sort_values(
        ["participant_id", "session_id", "elapsed_ms", "sequence_number"],
        kind="stable",
    )

    candidates = pd.DataFrame([r for r in manifest_rows if r.get("status") == "candidate"])

    candidates["participant_id"] = candidates["participant_id"].fillna(
        candidates["source_file"].map(normalize_participant_id_from_filename)
    )
    candidates["session_id"] = candidates["session_id"].fillna(candidates["participant_id"])

    candidates["completion_score"] = (
        candidates["study_ended_count"].fillna(0).astype(int) * 4
        + candidates["post_task_survey_count"].fillna(0).astype(int) * 3
        + candidates["export_event_count"].fillna(0).astype(int) * 1
    )

    candidates["raw_event_count"] = candidates["raw_event_count"].fillna(0).astype(int)

    chosen_hashes = set()

    for _, group in candidates.groupby(["participant_id", "session_id"], dropna=False):
        best = group.sort_values(
            ["completion_score", "raw_event_count", "last_timestamp", "source_file"],
            ascending=[False, False, False, True],
        ).iloc[0]

        chosen_hashes.add(best["source_hash"])

    manifest = pd.DataFrame(manifest_rows)

    for idx, row in manifest.iterrows():
        if row.get("status") == "excluded":
            continue

        if row.get("source_hash") in chosen_hashes:
            manifest.at[idx, "status"] = "included"
            manifest.at[idx, "exclude_reason"] = ""
        else:
            manifest.at[idx, "status"] = "excluded"
            manifest.at[idx, "exclude_reason"] = "superseded_by_better_export_for_same_participant_session"

    included_events = all_events[all_events["source_hash"].isin(chosen_hashes)].copy()
    included_events = included_events.sort_values(
        ["participant_id", "session_id", "elapsed_ms", "sequence_number"],
        kind="stable",
    )

    return included_events, manifest


def count_events(df: pd.DataFrame, event_types: set[str]) -> int:
    if df.empty or "event_type" not in df.columns:
        return 0

    return int(df["event_type"].isin(event_types).sum())


def dedupe_by_event_and_payload_key(df: pd.DataFrame, event_type: str, payload_key: str) -> int:
    sub = df[df["event_type"] == event_type]
    values = set()

    for payload in sub["payload"]:
        if isinstance(payload, dict):
            value = payload.get(payload_key)

            if value not in (None, "", [], {}):
                values.add(str(value))

    return len(values)


def active_duration_minutes(df: pd.DataFrame, cap_gap_seconds: int = 180) -> float:
    meaningful = df[df["event_type"].isin(MEANINGFUL_EVENTS_EXCLUDING_POINTER_MOVE)].copy()
    meaningful = meaningful.dropna(subset=["elapsed_ms"])

    if len(meaningful) < 2:
        return 0.0

    elapsed = meaningful.sort_values(["elapsed_ms", "sequence_number"], kind="stable")["elapsed_ms"].to_numpy(dtype=float)
    deltas = np.diff(elapsed)
    deltas = deltas[deltas >= 0]
    capped = np.minimum(deltas, cap_gap_seconds * 1000)

    return float(capped.sum() / 60000)


def idle_gap_summary(df: pd.DataFrame) -> Dict[str, Any]:
    d = df.dropna(subset=["elapsed_ms"]).sort_values(["elapsed_ms", "sequence_number"], kind="stable")

    if len(d) < 2:
        return {
            "idle_gap_over_2min_count": 0,
            "idle_gap_over_5min_count": 0,
            "longest_idle_gap_min": np.nan,
        }

    deltas = np.diff(d["elapsed_ms"].to_numpy(dtype=float)) / 60000
    deltas = deltas[deltas >= 0]

    return {
        "idle_gap_over_2min_count": int((deltas > 2).sum()),
        "idle_gap_over_5min_count": int((deltas > 5).sum()),
        "longest_idle_gap_min": float(deltas.max()) if len(deltas) else np.nan,
    }


def categorize_event_family(event_type: Any) -> str:
    event_type = str(event_type)

    if event_type in CORE_BUILD_EDIT_EVENTS:
        return "Build edits"

    if event_type in SAVED_BUILD_EVENTS:
        return "Saved-build workflow"

    if event_type in {
        "party_slot_assigned",
        "party_slot_cleared",
        "party_gap_response_edit",
        "party_member_focused",
        "party_aggregate_focused",
        "party_planner_toggled",
    }:
        return "Party planning"

    if event_type in VISUALIZATION_EVENTS:
        return "Visualization inspection"

    if event_type in EVALUATION_EVENTS:
        return "Simulator/evaluation"

    if event_type in FRICTION_EVENTS:
        return "Friction or blocked action"

    if event_type in NAVIGATION_EVENTS:
        return "Navigation/process"

    if event_type in STUDY_ADMIN_EVENTS:
        return "Study/tutorial/survey"

    if event_type in LOW_LEVEL_HEATMAP_EVENTS:
        return "Low-level heatmap logging"

    return "Other"


def categorize_build_field(field: Any) -> str:
    if field is None:
        return "Unknown"

    f = str(field).lower()

    if any(x in f for x in ["name", "race", "subrace", "background"]):
        return "Identity/background"

    if any(x in f for x in ["class", "subclass", "level"]):
        return "Class/level"

    if "spell" in f:
        return "Spells"

    if "feature" in f or "passive" in f or "action" in f or "toggle" in f:
        return "Actions/features"

    if "skill" in f:
        return "Skills"

    if "feat" in f:
        return "Feats"

    if "ability" in f or "score" in f or "bonus" in f:
        return "Ability scores"

    return "Other"


def visual_delta_changed(delta: Dict[str, Any]) -> bool:
    if not isinstance(delta, dict):
        return False

    for value in delta.values():
        if isinstance(value, list) and len(value) > 0:
            return True

        if isinstance(value, (int, float)) and value != 0:
            return True

    return False


def extract_build_edit_long(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for _, row in events[events["event_type"] == "build_edit"].iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}
        field = payload.get("field") or payload.get("changedField")
        delta = payload.get("visualProfileDelta") or {}
        next_summary = payload.get("nextSnapshotSummary") or {}

        rows.append(
            {
                "participant_id": row["participant_id"],
                "session_id": row["session_id"],
                "event_id": row["event_id"],
                "sequence_number": row["sequence_number"],
                "elapsed_ms": row["elapsed_ms"],
                "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                "active_view": row["active_view"],
                "active_build_label": row["active_build_label"],
                "field": str(field) if field is not None else "Unknown",
                "field_category": categorize_build_field(field),
                "next_snapshot_hash": payload.get("nextSnapshotHash"),
                "visual_profile_changed": visual_delta_changed(delta),
                "roles_added_count": len(delta.get("rolesAdded") or []) if isinstance(delta, dict) else 0,
                "damage_types_added_count": len(delta.get("damageTypesAdded") or []) if isinstance(delta, dict) else 0,
                "range_bands_added_count": len(delta.get("rangeBandsAdded") or []) if isinstance(delta, dict) else 0,
                "resources_added_count": len(delta.get("resourcesAdded") or []) if isinstance(delta, dict) else 0,
                "selected_class_after": next_summary.get("selectedClass") if isinstance(next_summary, dict) else None,
                "selected_subclass_after": next_summary.get("selectedSubclass") if isinstance(next_summary, dict) else None,
                "selected_race_after": next_summary.get("selectedRace") if isinstance(next_summary, dict) else None,
            }
        )

    return pd.DataFrame(rows)


def extract_build_edit_summaries(events: pd.DataFrame) -> Dict[str, Any]:
    edits = extract_build_edit_long(events)

    if edits.empty:
        out = {
            "unique_changed_fields": 0,
            "unique_build_states_from_edits": 0,
            "unique_classes_seen_in_edits": 0,
            "unique_subclasses_seen_in_edits": 0,
            "unique_races_seen_in_edits": 0,
            "visual_profile_changing_edit_count": 0,
            "roles_added_total": 0,
            "damage_types_added_total": 0,
            "range_bands_added_total": 0,
            "resources_added_total": 0,
        }
    else:
        out = {
            "unique_changed_fields": int(edits["field"].nunique()),
            "unique_build_states_from_edits": int(edits["next_snapshot_hash"].dropna().nunique()),
            "unique_classes_seen_in_edits": int(edits["selected_class_after"].dropna().nunique()),
            "unique_subclasses_seen_in_edits": int(edits["selected_subclass_after"].dropna().nunique()),
            "unique_races_seen_in_edits": int(edits["selected_race_after"].dropna().nunique()),
            "visual_profile_changing_edit_count": int(edits["visual_profile_changed"].sum()),
            "roles_added_total": int(edits["roles_added_count"].sum()),
            "damage_types_added_total": int(edits["damage_types_added_count"].sum()),
            "range_bands_added_total": int(edits["range_bands_added_count"].sum()),
            "resources_added_total": int(edits["resources_added_count"].sum()),
        }

    categories = [
        "Identity/background",
        "Class/level",
        "Spells",
        "Actions/features",
        "Skills",
        "Feats",
        "Ability scores",
        "Other",
        "Unknown",
    ]

    category_counts = edits["field_category"].value_counts().to_dict() if not edits.empty else {}

    for category in categories:
        key = category.lower().replace("/", "_").replace(" ", "_")
        out[f"edit_category_{key}_count"] = int(category_counts.get(category, 0))

    return out


def extract_visualization_focus_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    focus_event_types = {
        "data_circle_focus_selected",
        "data_circle_focus_hover_dwell",
        "data_circle_focus_hover_started",
        "data_circle_focus_hover_ended",
        "data_circle_focus_cleared",
    }

    for _, row in events[events["event_type"].isin(focus_event_types)].iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}

        focus_layer = (
            payload.get("focusLayer")
            or payload.get("nextFocusLayer")
            or safe_get(row.get("active_visualization_focus"), ["layer"])
        )

        focus_key = (
            payload.get("focusKey")
            or payload.get("nextFocusKey")
            or safe_get(row.get("active_visualization_focus"), ["key"])
        )

        focus_label = (
            payload.get("focusLabel")
            or payload.get("focusedLabel")
            or payload.get("nextFocusLabel")
        )

        focus_source = payload.get("focusSource") or row.get("active_focus_source")

        rows.append(
            {
                "participant_id": row["participant_id"],
                "session_id": row["session_id"],
                "event_id": row["event_id"],
                "sequence_number": row["sequence_number"],
                "elapsed_ms": row["elapsed_ms"],
                "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                "event_type": row["event_type"],
                "active_view": row["active_view"],
                "focus_source": focus_source,
                "focus_layer": focus_layer,
                "focus_type": payload.get("focusType"),
                "focus_key": focus_key,
                "focus_label": focus_label,
                "dwell_duration_ms": payload.get("dwellDurationMs"),
            }
        )

    return pd.DataFrame(rows)


def get_focus_layer_key_source_counts(events: pd.DataFrame) -> Dict[str, Any]:
    focus_events = extract_visualization_focus_events(events)

    if focus_events.empty:
        return {
            "unique_focus_layers": 0,
            "unique_focus_keys": 0,
            "unique_focus_sources": 0,
            "data_circle_total_dwell_sec": 0.0,
            "editor_or_main_focus_event_count": 0,
            "aggregate_or_party_focus_event_count": 0,
        }

    source_text = focus_events["focus_source"].fillna("").astype(str).str.lower()

    return {
        "unique_focus_layers": int(focus_events["focus_layer"].dropna().nunique()),
        "unique_focus_keys": int(focus_events["focus_key"].dropna().nunique()),
        "unique_focus_sources": int(focus_events["focus_source"].dropna().nunique()),
        "data_circle_total_dwell_sec": float(pd.to_numeric(focus_events["dwell_duration_ms"], errors="coerce").fillna(0).sum() / 1000),
        "editor_or_main_focus_event_count": int(source_text.str.contains("editor|main").sum()),
        "aggregate_or_party_focus_event_count": int(source_text.str.contains("aggregate|party").sum()),
    }


def count_followup_edits(
    events: pd.DataFrame,
    trigger_events: set[str],
    followup_events: set[str],
    window_seconds: int,
) -> Tuple[int, Optional[float]]:
    d = events.dropna(subset=["elapsed_ms"]).copy()
    d = d.sort_values(["elapsed_ms", "sequence_number"], kind="stable")

    trigger_times = d.loc[d["event_type"].isin(trigger_events), "elapsed_ms"].to_numpy(dtype=float)
    followup = d[d["event_type"].isin(followup_events)].copy()

    if len(trigger_times) == 0 or followup.empty:
        return 0, None

    count = 0
    latencies = []

    for edit_time in followup["elapsed_ms"].to_numpy(dtype=float):
        previous_triggers = trigger_times[trigger_times <= edit_time]

        if len(previous_triggers) == 0:
            continue

        latency_sec = (edit_time - previous_triggers[-1]) / 1000

        if 0 <= latency_sec <= window_seconds:
            count += 1
            latencies.append(latency_sec)

    median_latency = float(np.median(latencies)) if latencies else None

    return count, median_latency


def summarize_gap_response_edits(events: pd.DataFrame) -> Dict[str, Any]:
    sub = events[events["event_type"] == "party_gap_response_edit"].copy()

    if sub.empty:
        return {
            "party_gap_response_edit_event_count": 0,
            "party_gap_response_unique_edit_count": 0,
            "party_gap_response_within_30s_count": 0,
            "party_gap_response_within_60s_count": 0,
            "median_gap_response_latency_sec": None,
            "gap_response_unique_gap_keys": 0,
        }

    next_hashes = set()
    latencies_sec = []
    gap_keys = set()

    for payload in sub["payload"]:
        if not isinstance(payload, dict):
            continue

        next_hash = payload.get("nextSnapshotHash")

        if next_hash:
            next_hashes.add(str(next_hash))

        latency_ms = payload.get("gapToEditLatencyMs")

        if isinstance(latency_ms, (int, float)):
            latencies_sec.append(float(latency_ms) / 1000)

        for gap in payload.get("partyGapsAtLastDetection") or []:
            if isinstance(gap, dict) and gap.get("gapKey"):
                gap_keys.add(str(gap["gapKey"]))

    return {
        "party_gap_response_edit_event_count": int(len(sub)),
        "party_gap_response_unique_edit_count": int(len(next_hashes)),
        "party_gap_response_within_30s_count": int(sum(0 <= x <= 30 for x in latencies_sec)),
        "party_gap_response_within_60s_count": int(sum(0 <= x <= 60 for x in latencies_sec)),
        "median_gap_response_latency_sec": float(np.median(latencies_sec)) if latencies_sec else None,
        "gap_response_unique_gap_keys": int(len(gap_keys)),
    }


def get_last_event(events: pd.DataFrame, event_type: str) -> Optional[pd.Series]:
    sub = events[events["event_type"] == event_type]

    if sub.empty:
        return None

    return sub.iloc[-1]


def extract_final_party_metrics(study_end_payload: Dict[str, Any]) -> Dict[str, Any]:
    final_profile = study_end_payload.get("finalPartyVisualProfile") or {}
    final_gaps = study_end_payload.get("finalPartyGaps") or []
    final_summary = study_end_payload.get("finalPartySnapshotSummary") or {}

    role_counts = final_profile.get("roleCounts") or {}
    damage_type_counts = final_profile.get("damageTypeCounts") or {}
    range_band_counts = final_profile.get("rangeBandCounts") or {}
    resource_counts = final_profile.get("resourceCounts") or {}

    high_gaps = [
        g for g in final_gaps
        if isinstance(g, dict) and g.get("severity") == "high"
    ]

    medium_gaps = [
        g for g in final_gaps
        if isinstance(g, dict) and g.get("severity") == "medium"
    ]

    gap_keys = [
        str(g.get("gapKey"))
        for g in final_gaps
        if isinstance(g, dict) and g.get("gapKey")
    ]

    final_classes = []
    focused = final_summary.get("focusedBuildSummary")

    if isinstance(focused, dict) and focused.get("selectedClass"):
        final_classes.append(str(focused["selectedClass"]))

    for slot in final_summary.get("slotHashes") or []:
        if isinstance(slot, dict):
            summary = slot.get("summary") or {}

            if isinstance(summary, dict) and summary.get("selectedClass"):
                final_classes.append(str(summary["selectedClass"]))

    simulator_status = study_end_payload.get("simulatorStatus")
    simulator_average_dpr = study_end_payload.get("simulatorAverageDpr")

    if simulator_status not in {"completed", "success", "available"}:
        simulator_average_dpr_interpretable = np.nan
    else:
        simulator_average_dpr_interpretable = simulator_average_dpr

    return {
        "final_party_complete": bool(study_end_payload.get("finalPartyComplete")),
        "post_task_survey_completed": bool(study_end_payload.get("postTaskSurveyCompleted")),
        "exported_as_zip": bool(study_end_payload.get("exportedAsZip")),
        "final_filled_party_slots": safe_get(final_summary, ["filledPartySlotCount"], np.nan),
        "final_empty_party_slots": safe_get(final_summary, ["emptySlotCount"], np.nan),
        "final_party_gap_count": len(final_gaps),
        "final_high_severity_gap_count": len(high_gaps),
        "final_medium_severity_gap_count": len(medium_gaps),
        "final_gap_keys": ";".join(gap_keys),
        "final_redundancy_score": study_end_payload.get("finalRedundancyScore"),
        "simulator_status_at_end": simulator_status,
        "simulator_average_dpr_raw_at_end": simulator_average_dpr,
        "simulator_average_dpr_interpretable_at_end": simulator_average_dpr_interpretable,
        "final_selected_ability_count": final_profile.get("selectedAbilityCount", np.nan),
        "final_damage_ability_count": final_profile.get("damageAbilityCount", np.nan),
        "final_utility_ability_count": final_profile.get("utilityAbilityCount", np.nan),
        "final_healing_count": final_profile.get("healingCount", np.nan),
        "final_control_count": final_profile.get("controlCount", np.nan),
        "final_support_count": final_profile.get("supportCount", np.nan),
        "final_mobility_count": final_profile.get("mobilityCount", np.nan),
        "final_long_range_count": final_profile.get("longRangeCount", np.nan),
        "final_area_damage_count": final_profile.get("areaDamageCount", np.nan),
        "final_single_target_damage_count": final_profile.get("singleTargetDamageCount", np.nan),
        "final_concentration_count": final_profile.get("concentrationCount", np.nan),
        "final_role_count": len(role_counts),
        "final_damage_type_count": len(damage_type_counts),
        "final_range_band_count": len(range_band_counts),
        "final_resource_count": len(resource_counts),
        "final_unique_class_count": len(set(final_classes)),
        "final_classes": ";".join(final_classes),
    }


def summarize_participant(events: pd.DataFrame) -> Dict[str, Any]:
    participant_id = (
        events["participant_id"].dropna().iloc[0]
        if events["participant_id"].notna().any()
        else None
    )

    session_id = (
        events["session_id"].dropna().iloc[0]
        if events["session_id"].notna().any()
        else participant_id
    )

    start_ms = events["elapsed_ms"].min()
    end_ms = events["elapsed_ms"].max()

    session_duration_min = (
        float((end_ms - start_ms) / 60000)
        if pd.notna(start_ms) and pd.notna(end_ms)
        else np.nan
    )

    active_min = active_duration_minutes(events, cap_gap_seconds=180)

    study_end = get_last_event(events, "study_ended")
    study_end_payload = (
        study_end["payload"]
        if study_end is not None and isinstance(study_end["payload"], dict)
        else {}
    )

    edits_after_viz_30, median_viz_latency_30 = count_followup_edits(
        events,
        VISUALIZATION_FOLLOWUP_TRIGGER_EVENTS,
        CORE_BUILD_EDIT_EVENTS,
        30,
    )

    edits_after_viz_60, median_viz_latency_60 = count_followup_edits(
        events,
        VISUALIZATION_FOLLOWUP_TRIGGER_EVENTS,
        CORE_BUILD_EDIT_EVENTS,
        60,
    )

    edits_after_eval_60, median_eval_latency_60 = count_followup_edits(
        events,
        EVALUATION_EVENTS,
        CORE_BUILD_EDIT_EVENTS,
        60,
    )

    meaningful_event_count = int(events["event_type"].isin(MEANINGFUL_EVENTS_EXCLUDING_POINTER_MOVE).sum())
    deliberate_event_count = int(events["event_type"].isin(DELIBERATE_PLANNING_EVENTS).sum())

    metrics: Dict[str, Any] = {
        "participant_id": participant_id,
        "session_id": session_id,
        "source_file": ";".join(sorted(events["source_file"].dropna().unique())),
        "source_hash": ";".join(sorted(events["source_hash"].dropna().unique())),
        "event_count_total": int(len(events)),
        "first_timestamp": events["timestamp"].min(),
        "last_timestamp": events["timestamp"].max(),
        "session_duration_min": session_duration_min,
        "active_duration_min": active_min,
        "meaningful_event_count": meaningful_event_count,
        "deliberate_planning_event_count": deliberate_event_count,
        "heatmap_event_count": count_events(events, LOW_LEVEL_HEATMAP_EVENTS),
        "pointer_move_count": int((events["event_type"] == "heatmap_pointer_move").sum()),
        "click_count": int((events["event_type"] == "heatmap_click").sum()),
        "scroll_count": int((events["event_type"] == "heatmap_scroll").sum()),
        "hover_dwell_count": int((events["event_type"] == "heatmap_hover_dwell").sum()),

        "build_edit_count": int((events["event_type"] == "build_edit").sum()),
        "semantic_delta_count": int((events["event_type"] == "build_semantic_delta").sum()),

        "saved_build_event_count": count_events(events, SAVED_BUILD_EVENTS),
        "saved_build_created_count": int(events["event_type"].isin({"build_saved", "saved_build_created"}).sum()),
        "saved_build_loaded_count": int(events["event_type"].isin({"build_loaded", "saved_build_loaded"}).sum()),
        "saved_build_deleted_count": int(events["event_type"].isin({"build_deleted", "saved_build_deleted"}).sum()),

        "party_event_count": count_events(events, PARTY_EVENTS),
        "party_slot_event_count": int(events["event_type"].isin({"party_slot_assigned", "party_slot_cleared"}).sum()),
        "party_slot_assigned_count": int((events["event_type"] == "party_slot_assigned").sum()),
        "unique_party_snapshots": int(events["party_snapshot_hash"].dropna().nunique()),
        "party_coverage_unique_state_count": dedupe_by_event_and_payload_key(events, "party_coverage_updated", "partySnapshotHash"),
        "party_gap_unique_state_count": dedupe_by_event_and_payload_key(events, "party_gap_detected", "partySnapshotHash"),

        "visualization_event_count": count_events(events, VISUALIZATION_EVENTS),
        "data_circle_focus_select_count": int((events["event_type"] == "data_circle_focus_selected").sum()),
        "data_circle_hover_dwell_count": int((events["event_type"] == "data_circle_focus_hover_dwell").sum()),
        "tooltip_open_count": int((events["event_type"] == "highlighted_item_tooltip_opened").sum()),
        "highlight_interaction_count": int(events["event_type"].isin({"highlighted_item_selected", "linked_highlight_exposed"}).sum()),
        "damage_preview_update_count": int((events["event_type"] == "data_circle_damage_preview_updated").sum()),

        "evaluation_event_count": count_events(events, EVALUATION_EVENTS),
        "evaluation_request_count": int(events["event_type"].isin({"evaluation_requested", "simulator_request_started"}).sum()),
        "evaluation_success_count": int(events["event_type"].isin({"evaluation_completed", "simulator_request_success"}).sum()),
        "evaluation_failure_count": int(events["event_type"].isin({"evaluation_failed", "simulator_request_failed"}).sum()),

        "friction_event_count": count_events(events, FRICTION_EVENTS),
        "invalid_selection_count": int((events["event_type"] == "invalid_selection_attempted").sum()),

        "edits_after_visualization_30s": edits_after_viz_30,
        "edits_after_visualization_60s": edits_after_viz_60,
        "median_visualization_to_edit_latency_30s": median_viz_latency_30,
        "median_visualization_to_edit_latency_60s": median_viz_latency_60,
        "edits_after_evaluation_60s": edits_after_eval_60,
        "median_evaluation_to_edit_latency_60s": median_eval_latency_60,
    }

    metrics.update(idle_gap_summary(events))
    metrics.update(extract_build_edit_summaries(events))
    metrics.update(get_focus_layer_key_source_counts(events))
    metrics.update(summarize_gap_response_edits(events))
    metrics.update(extract_final_party_metrics(study_end_payload))

    if active_min and active_min > 0:
        metrics["build_edits_per_active_min"] = metrics["build_edit_count"] / active_min
        metrics["visualization_events_per_active_min"] = metrics["visualization_event_count"] / active_min
        metrics["friction_events_per_active_min"] = metrics["friction_event_count"] / active_min
        metrics["meaningful_events_per_active_min"] = meaningful_event_count / active_min
        metrics["deliberate_events_per_active_min"] = deliberate_event_count / active_min
    else:
        metrics["build_edits_per_active_min"] = np.nan
        metrics["visualization_events_per_active_min"] = np.nan
        metrics["friction_events_per_active_min"] = np.nan
        metrics["meaningful_events_per_active_min"] = np.nan
        metrics["deliberate_events_per_active_min"] = np.nan

    return metrics


def create_event_type_counts(events: pd.DataFrame) -> pd.DataFrame:
    return (
        events.groupby(
            ["participant_id", "session_id", "event_category", "event_type"],
            dropna=False,
        )
        .size()
        .reset_index(name="count")
        .sort_values(
            ["participant_id", "session_id", "event_category", "count"],
            ascending=[True, True, True, False],
        )
    )


def create_event_category_counts(events: pd.DataFrame) -> pd.DataFrame:
    return (
        events.groupby(["participant_id", "session_id", "event_category"], dropna=False)
        .size()
        .reset_index(name="count")
        .sort_values(
            ["participant_id", "session_id", "count"],
            ascending=[True, True, False],
        )
    )


def create_deliberate_event_family_counts(events: pd.DataFrame) -> pd.DataFrame:
    d = events[events["event_type"].isin(DELIBERATE_PLANNING_EVENTS)].copy()

    if d.empty:
        return pd.DataFrame()

    d["event_family"] = d["event_type"].map(categorize_event_family)

    return (
        d.groupby(["participant_id", "session_id", "event_family"], dropna=False)
        .size()
        .reset_index(name="count")
        .sort_values(["participant_id", "session_id", "event_family"])
    )


def create_build_edit_field_counts(build_edit_long: pd.DataFrame) -> pd.DataFrame:
    if build_edit_long.empty:
        return pd.DataFrame()

    return (
        build_edit_long.groupby(
            ["participant_id", "session_id", "field_category", "field"],
            dropna=False,
        )
        .size()
        .reset_index(name="count")
        .sort_values(
            ["participant_id", "session_id", "count"],
            ascending=[True, True, False],
        )
    )


def create_visualization_focus_summary(visualization_focus_events: pd.DataFrame) -> pd.DataFrame:
    if visualization_focus_events.empty:
        return pd.DataFrame()

    return (
        visualization_focus_events.groupby(
            [
                "participant_id",
                "session_id",
                "event_type",
                "focus_source",
                "focus_layer",
                "focus_type",
                "focus_key",
                "focus_label",
            ],
            dropna=False,
        )
        .agg(
            count=("event_type", "size"),
            total_dwell_ms=("dwell_duration_ms", "sum"),
            mean_dwell_ms=("dwell_duration_ms", "mean"),
        )
        .reset_index()
        .sort_values(
            ["participant_id", "session_id", "count"],
            ascending=[True, True, False],
        )
    )


def create_party_gap_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for _, row in events[
        events["event_type"].isin({"party_gap_detected", "party_coverage_updated"})
    ].iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}
        gaps = payload.get("partyGaps") or []
        snapshot_hash = payload.get("partySnapshotHash") or row.get("party_snapshot_hash")

        for gap in gaps:
            if not isinstance(gap, dict):
                continue

            rows.append(
                {
                    "participant_id": row["participant_id"],
                    "session_id": row["session_id"],
                    "event_id": row["event_id"],
                    "sequence_number": row["sequence_number"],
                    "elapsed_ms": row["elapsed_ms"],
                    "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                    "event_type": row["event_type"],
                    "party_snapshot_hash": snapshot_hash,
                    "gap_type": gap.get("gapType"),
                    "gap_key": gap.get("gapKey"),
                    "gap_label": gap.get("gapLabel"),
                    "severity": gap.get("severity"),
                    "count_value": gap.get("count"),
                }
            )

    return pd.DataFrame(rows)


def create_gap_summary(party_gap_events: pd.DataFrame) -> pd.DataFrame:
    if party_gap_events.empty:
        return pd.DataFrame()

    dedup = party_gap_events.drop_duplicates(
        [
            "participant_id",
            "session_id",
            "party_snapshot_hash",
            "gap_type",
            "gap_key",
            "severity",
        ]
    )

    return (
        dedup.groupby(
            ["participant_id", "session_id", "gap_type", "gap_key", "gap_label", "severity"],
            dropna=False,
        )
        .size()
        .reset_index(name="unique_party_states_with_gap")
        .sort_values(
            ["participant_id", "session_id", "unique_party_states_with_gap"],
            ascending=[True, True, False],
        )
    )


def extract_heatmap_semantic_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    heatmap = events[events["event_type"].isin({"heatmap_click", "heatmap_hover_dwell", "heatmap_pointer_down"})]

    for _, row in heatmap.iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}
        target = payload.get("target") if isinstance(payload.get("target"), dict) else {}

        dwell_ms = parse_num(payload.get("dwellDurationMs"))

        if row["event_type"] == "heatmap_click":
            interaction_weight = 1.0
        elif row["event_type"] == "heatmap_pointer_down":
            interaction_weight = 0.75
        elif row["event_type"] == "heatmap_hover_dwell":
            interaction_weight = max(0.25, min(5.0, dwell_ms / 1000)) if pd.notna(dwell_ms) else 1.0
        else:
            interaction_weight = 1.0

        rows.append(
            {
                "participant_id": row["participant_id"],
                "session_id": row["session_id"],
                "event_id": row["event_id"],
                "sequence_number": row["sequence_number"],
                "elapsed_ms": row["elapsed_ms"],
                "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                "event_type": row["event_type"],
                "active_view": row["active_view"],
                "study_region": target.get("studyRegion"),
                "study_element": target.get("studyElement"),
                "element_type": target.get("elementType"),
                "is_interactive": target.get("isInteractive"),
                "target_text": target.get("text"),
                "selector": target.get("selector"),
                "viewport_x_norm": payload.get("viewportXNorm") or payload.get("viewport_x_norm") or payload.get("xNorm"),
                "viewport_y_norm": payload.get("viewportYNorm") or payload.get("viewport_y_norm") or payload.get("yNorm"),
                "dwell_duration_ms": dwell_ms,
                "interaction_weight": interaction_weight,
            }
        )

    return pd.DataFrame(rows)


def create_heatmap_target_summary(heatmap_semantic_events: pd.DataFrame) -> pd.DataFrame:
    if heatmap_semantic_events.empty:
        return pd.DataFrame()

    return (
        heatmap_semantic_events.groupby(
            [
                "participant_id",
                "session_id",
                "event_type",
                "active_view",
                "study_region",
                "study_element",
                "element_type",
                "is_interactive",
            ],
            dropna=False,
        )
        .agg(
            interaction_count=("event_type", "size"),
            total_dwell_ms=("dwell_duration_ms", "sum"),
            mean_dwell_ms=("dwell_duration_ms", "mean"),
            total_interaction_weight=("interaction_weight", "sum"),
        )
        .reset_index()
        .sort_values(
            ["participant_id", "session_id", "total_interaction_weight"],
            ascending=[True, True, False],
        )
    )


def create_heatmap_region_summary(heatmap_semantic_events: pd.DataFrame) -> pd.DataFrame:
    if heatmap_semantic_events.empty:
        return pd.DataFrame()

    return (
        heatmap_semantic_events.groupby(
            ["participant_id", "session_id", "active_view", "study_region"],
            dropna=False,
        )
        .agg(
            interaction_count=("event_type", "size"),
            total_dwell_ms=("dwell_duration_ms", "sum"),
            total_interaction_weight=("interaction_weight", "sum"),
        )
        .reset_index()
        .sort_values(
            ["participant_id", "session_id", "total_interaction_weight"],
            ascending=[True, True, False],
        )
    )

def create_timeline_bins(events: pd.DataFrame, bin_minutes: int = 5) -> pd.DataFrame:
    d = events[
        events["event_type"].isin(TIMELINE_PLANNING_EVENTS)
    ].dropna(subset=["elapsed_ms"]).copy()

    if d.empty:
        return pd.DataFrame()

    d["time_bin_min"] = (
        np.floor((d["elapsed_ms"] / 60000) / bin_minutes) * bin_minutes
    ).astype(int)

    d["event_family"] = d["event_type"].map(categorize_event_family)

    return (
        d.groupby(
            ["participant_id", "session_id", "time_bin_min", "event_family"],
            dropna=False,
        )
        .size()
        .reset_index(name="count")
        .sort_values(
            ["participant_id", "session_id", "time_bin_min", "event_family"]
        )
    )

def create_feature_followup_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for (participant_id, session_id), df in events.groupby(
        ["participant_id", "session_id"],
        dropna=False,
    ):
        d = df.dropna(subset=["elapsed_ms"]).sort_values(
            ["elapsed_ms", "sequence_number"],
            kind="stable",
        )

        trigger_df = d[
            d["event_type"].isin(VISUALIZATION_FOLLOWUP_TRIGGER_EVENTS | EVALUATION_EVENTS)
        ].copy()

        edit_df = d[d["event_type"].isin(CORE_BUILD_EDIT_EVENTS)].copy()

        if trigger_df.empty or edit_df.empty:
            continue

        trigger_times = trigger_df["elapsed_ms"].to_numpy(dtype=float)
        trigger_types = trigger_df["event_type"].to_numpy()
        trigger_ids = trigger_df["event_id"].to_numpy()

        for _, edit in edit_df.iterrows():
            edit_time = float(edit["elapsed_ms"])
            idxs = np.where(trigger_times <= edit_time)[0]

            if len(idxs) == 0:
                continue

            last_idx = idxs[-1]
            latency_sec = (edit_time - trigger_times[last_idx]) / 1000

            if 0 <= latency_sec <= 60:
                payload = edit["payload"] if isinstance(edit["payload"], dict) else {}

                rows.append(
                    {
                        "participant_id": participant_id,
                        "session_id": session_id,
                        "edit_event_id": edit.get("event_id"),
                        "trigger_event_id": trigger_ids[last_idx],
                        "edit_sequence_number": edit.get("sequence_number"),
                        "edit_elapsed_ms": edit.get("elapsed_ms"),
                        "edit_field": payload.get("field") or payload.get("changedField"),
                        "edit_field_category": categorize_build_field(payload.get("field") or payload.get("changedField")),
                        "trigger_event_type": trigger_types[last_idx],
                        "latency_sec": latency_sec,
                        "within_30s": latency_sec <= 30,
                        "within_60s": latency_sec <= 60,
                    }
                )

    return pd.DataFrame(rows)


def create_final_party_profile_long(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    dimension_fields = [
        ("role", "roleCounts"),
        ("damage_type", "damageTypeCounts"),
        ("range_band", "rangeBandCounts"),
        ("resource", "resourceCounts"),
    ]

    for (participant_id, session_id), df in events.groupby(
        ["participant_id", "session_id"],
        dropna=False,
    ):
        study_end = get_last_event(df, "study_ended")

        if study_end is None:
            continue

        payload = study_end["payload"] if isinstance(study_end["payload"], dict) else {}
        profile = payload.get("finalPartyVisualProfile") or {}

        for dimension, field in dimension_fields:
            counts = profile.get(field) or {}

            if not isinstance(counts, dict):
                continue

            for key, value in counts.items():
                rows.append(
                    {
                        "participant_id": participant_id,
                        "session_id": session_id,
                        "dimension": dimension,
                        "key": str(key),
                        "ability_count": pd.to_numeric(value, errors="coerce"),
                    }
                )

    return pd.DataFrame(rows)


def create_final_party_long_table(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for (participant_id, session_id), df in events.groupby(
        ["participant_id", "session_id"],
        dropna=False,
    ):
        study_end = get_last_event(df, "study_ended")

        if study_end is None:
            continue

        payload = study_end["payload"] if isinstance(study_end["payload"], dict) else {}
        final_summary = payload.get("finalPartySnapshotSummary") or {}

        focused = final_summary.get("focusedBuildSummary")

        if isinstance(focused, dict):
            rows.append(
                {
                    "participant_id": participant_id,
                    "session_id": session_id,
                    "slot_type": "current_editor",
                    "slot_number": 4,
                    "saved_build_id": final_summary.get("focusedBuildId"),
                    "label": final_summary.get("focusedBuildLabel"),
                    **focused,
                }
            )

        for slot in final_summary.get("slotHashes") or []:
            if not isinstance(slot, dict):
                continue

            summary = slot.get("summary") or {}

            if not isinstance(summary, dict):
                summary = {}

            rows.append(
                {
                    "participant_id": participant_id,
                    "session_id": session_id,
                    "slot_type": "saved_slot",
                    "slot_number": slot.get("slotNumber"),
                    "saved_build_id": slot.get("savedBuildId"),
                    "label": slot.get("label"),
                    **summary,
                }
            )

    return pd.DataFrame(rows)


def create_evaluation_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for _, row in events[events["event_type"].isin(EVALUATION_EVENTS)].iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}

        rows.append(
            {
                "participant_id": row["participant_id"],
                "session_id": row["session_id"],
                "event_id": row["event_id"],
                "sequence_number": row["sequence_number"],
                "elapsed_ms": row["elapsed_ms"],
                "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                "event_type": row["event_type"],
                "active_view": row["active_view"],
                "status": payload.get("status"),
                "error": payload.get("error") or payload.get("message"),
                "average_dpr": payload.get("averageDpr") or payload.get("average_dpr"),
            }
        )

    return pd.DataFrame(rows)


def create_friction_events(events: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for _, row in events[events["event_type"].isin(FRICTION_EVENTS)].iterrows():
        payload = row["payload"] if isinstance(row["payload"], dict) else {}

        rows.append(
            {
                "participant_id": row["participant_id"],
                "session_id": row["session_id"],
                "event_id": row["event_id"],
                "sequence_number": row["sequence_number"],
                "elapsed_ms": row["elapsed_ms"],
                "elapsed_min": row["elapsed_ms"] / 60000 if pd.notna(row["elapsed_ms"]) else np.nan,
                "event_type": row["event_type"],
                "active_view": row["active_view"],
                "field": payload.get("field") or payload.get("targetField"),
                "reason": payload.get("reason") or payload.get("message"),
                "limit": payload.get("limit"),
            }
        )

    return pd.DataFrame(rows)


def create_data_quality_report(
    participant_metrics: pd.DataFrame,
) -> pd.DataFrame:
    rows = []

    for _, row in participant_metrics.iterrows():
        flags = []

        if not bool(row.get("final_party_complete")):
            flags.append("final_party_not_complete")

        if not bool(row.get("post_task_survey_completed")):
            flags.append("post_task_survey_missing")

        if row.get("event_count_total", 0) < 100:
            flags.append("very_low_event_count")

        if row.get("active_duration_min", 0) < 5:
            flags.append("very_short_active_duration")

        if row.get("final_filled_party_slots", 0) < 4:
            flags.append("fewer_than_four_final_party_members")

        rows.append(
            {
                "participant_id": row.get("participant_id"),
                "session_id": row.get("session_id"),
                "include_recommended": len(flags) == 0,
                "quality_flags": ";".join(flags),
                "event_count_total": row.get("event_count_total"),
                "active_duration_min": row.get("active_duration_min"),
                "session_duration_min": row.get("session_duration_min"),
                "idle_gap_over_5min_count": row.get("idle_gap_over_5min_count"),
                "longest_idle_gap_min": row.get("longest_idle_gap_min"),
                "final_party_complete": row.get("final_party_complete"),
                "post_task_survey_completed": row.get("post_task_survey_completed"),
                "final_filled_party_slots": row.get("final_filled_party_slots"),
            }
        )

    return pd.DataFrame(rows)


def export_csv(df: pd.DataFrame, filename: str) -> None:
    df.to_csv(OUT_DIR / filename, index=False, encoding="utf-8-sig")


def main() -> None:
    clean_output_dir()

    events, manifest = load_and_select_logs(RAW_DIR)
    export_csv(manifest, "analysis_manifest.csv")

    participant_metrics = pd.DataFrame(
        [
            summarize_participant(group.copy())
            for _, group in events.groupby(["participant_id", "session_id"], dropna=False)
        ]
    )

    event_type_counts = create_event_type_counts(events)
    event_category_counts = create_event_category_counts(events)
    deliberate_event_family_counts = create_deliberate_event_family_counts(events)

    build_edit_events_long = extract_build_edit_long(events)
    build_edit_field_counts = create_build_edit_field_counts(build_edit_events_long)

    visualization_focus_events = extract_visualization_focus_events(events)
    visualization_focus_summary = create_visualization_focus_summary(visualization_focus_events)

    party_gap_events = create_party_gap_events(events)
    gap_summary = create_gap_summary(party_gap_events)

    heatmap_semantic_events = extract_heatmap_semantic_events(events)
    heatmap_target_summary = create_heatmap_target_summary(heatmap_semantic_events)
    heatmap_region_summary = create_heatmap_region_summary(heatmap_semantic_events)

    timeline_bins = create_timeline_bins(events, bin_minutes=5)
    feature_followup_events = create_feature_followup_events(events)
    final_party_members = create_final_party_long_table(events)
    final_party_profile_long = create_final_party_profile_long(events)
    evaluation_events = create_evaluation_events(events)
    friction_events = create_friction_events(events)
    data_quality_report = create_data_quality_report(participant_metrics)

    events_for_export = events.drop(columns=["payload"]).copy()
    events_for_export["event_family"] = events_for_export["event_type"].map(categorize_event_family)

    export_csv(data_quality_report, "data_quality_report.csv")
    export_csv(events_for_export, "clean_events_flat.csv")
    export_csv(participant_metrics, "participant_log_metrics.csv")
    export_csv(event_type_counts, "event_type_counts.csv")
    export_csv(event_category_counts, "event_category_counts.csv")
    export_csv(deliberate_event_family_counts, "deliberate_event_family_counts.csv")
    export_csv(build_edit_events_long, "build_edit_events_long.csv")
    export_csv(build_edit_field_counts, "build_edit_field_counts.csv")
    export_csv(visualization_focus_events, "visualization_focus_events.csv")
    export_csv(visualization_focus_summary, "visualization_focus_summary.csv")
    export_csv(party_gap_events, "party_gap_events.csv")
    export_csv(gap_summary, "gap_summary.csv")
    export_csv(heatmap_semantic_events, "heatmap_semantic_events.csv")
    export_csv(heatmap_target_summary, "heatmap_target_summary.csv")
    export_csv(heatmap_region_summary, "heatmap_region_summary.csv")
    export_csv(timeline_bins, "timeline_bins.csv")
    export_csv(feature_followup_events, "feature_followup_events.csv")
    export_csv(final_party_members, "final_party_members.csv")
    export_csv(final_party_profile_long, "final_party_profile_long.csv")
    export_csv(evaluation_events, "evaluation_events.csv")
    export_csv(friction_events, "friction_events.csv")

    print("Analysis complete. Output folder:")
    print(f"- {OUT_DIR}")
    print()

    print("Included log files:")
    print(
        manifest[manifest["status"] == "included"][
            ["source_file", "participant_id", "session_id", "raw_event_count"]
        ].to_string(index=False)
    )

    excluded = manifest[manifest["status"] == "excluded"]

    if not excluded.empty:
        print()
        print("Excluded duplicate/superseded files:")
        print(excluded[["source_file", "exclude_reason"]].to_string(index=False))

    print()
    print("Participant metrics preview:")
    print(participant_metrics.head().to_string(index=False))


if __name__ == "__main__":
    main()

