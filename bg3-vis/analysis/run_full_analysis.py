#Run this file first then make_thesis_figures.py
from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
import textwrap
import zipfile
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except Exception:
    stats = None
    SCIPY_AVAILABLE = False


BASE_DIR = Path(__file__).resolve().parent

RAW_EXPORTS_DIR = BASE_DIR / "data" / "raw_exports"
RAW_JSONL_DIR = BASE_DIR / "data" / "raw_jsonl"
RAW_SURVEY_DIR = BASE_DIR / "data" / "raw_surveys"

PROCESSED_DIR = BASE_DIR / "data" / "processed"
RESULTS_DIR = BASE_DIR / "data" / "results"
TABLES_DIR = RESULTS_DIR / "tables"
REPORTS_DIR = RESULTS_DIR / "participant_reports"

ANALYZE_LOGS_SCRIPT = BASE_DIR / "analyze_logs.py"

for directory in [
    RAW_EXPORTS_DIR,
    RAW_JSONL_DIR,
    RAW_SURVEY_DIR,
    PROCESSED_DIR,
    RESULTS_DIR,
    TABLES_DIR,
    REPORTS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)


LIKERT_POST_ITEMS = [
    "exploration_iteration_overall",
    "final_party_confidence",
    "reasoning_tradeoffs_party_overall",
    "balanced_autonomous_decision",
    "understood_visualization",
    "noticed_party_patterns",
    "interactive_explanation",
    "readable",
    "appropriate_for_bg3",
    "visual_style_fit",
    "engaging_creative_exploration",
]

LIKERT_LABELS = {
    "exploration_iteration_overall": "Exploration and iteration",
    "final_party_confidence": "Confidence in final party",
    "reasoning_tradeoffs_party_overall": "Reasoning about trade-offs",
    "balanced_autonomous_decision": "Autonomous decision-making",
    "understood_visualization": "Visualization was understandable",
    "noticed_party_patterns": "Noticed party-level patterns",
    "interactive_explanation": "Interactivity explained the data",
    "readable": "Visualization was readable",
    "appropriate_for_bg3": "Appropriate for BG3 planning",
    "visual_style_fit": "Visual style fit the game",
    "engaging_creative_exploration": "Engaging creative exploration",
}

PRE_PRIORITY_KEYS = [
    "damage_combat_performance",
    "survivability",
    "party_balance",
    "clear_party_roles",
    "roleplay_character_fantasy",
    "narrative_strength",
    "experimentation",
    "ease_of_use",
    "versatility",
]

POST_FACTOR_KEYS = [
    "damage_combat_performance",
    "survivability",
    "party_balance",
    "clear_party_roles",
    "roleplay_character_fantasy",
    "narrative_strength",
    "experimentation",
    "ease_of_use",
    "versatility",
    "visualization_observation",
    "prior_bg3_knowledge",
]

FACTOR_LABELS = {
    "damage_combat_performance": "Damage / combat performance",
    "survivability": "Survivability",
    "party_balance": "Party balance",
    "clear_party_roles": "Clear party roles",
    "roleplay_character_fantasy": "Roleplay / fantasy",
    "narrative_strength": "Narrative fit",
    "experimentation": "Experimentation",
    "ease_of_use": "Ease of use",
    "versatility": "Versatility",
    "visualization_observation": "What the visualization showed",
    "prior_bg3_knowledge": "Prior BG3 knowledge",
}

SURVEY_COMPOSITES = {
    "survey_exploration_support_score": [
        "exploration_iteration_overall",
        "engaging_creative_exploration",
    ],
    "survey_decision_reasoning_score": [
        "final_party_confidence",
        "reasoning_tradeoffs_party_overall",
        "balanced_autonomous_decision",
    ],
    "survey_visualization_interpretation_score": [
        "understood_visualization",
        "noticed_party_patterns",
        "interactive_explanation",
        "readable",
    ],
    "survey_game_context_fit_score": [
        "appropriate_for_bg3",
        "visual_style_fit",
    ],
    "survey_overall_post_score": LIKERT_POST_ITEMS,
}

CORE_LOG_METRICS = [
    "active_duration_min",
    "deliberate_planning_event_count",
    "build_edit_count",
    "unique_build_states_from_edits",
    "visual_profile_changing_edit_count",
    "saved_build_created_count",
    "saved_build_loaded_count",
    "party_slot_assigned_count",
    "unique_party_snapshots",
    "visualization_event_count",
    "data_circle_focus_select_count",
    "data_circle_hover_dwell_count",
    "data_circle_total_dwell_sec",
    "unique_focus_keys",
    "tooltip_open_count",
    "highlight_interaction_count",
    "damage_preview_update_count",
    "edits_after_visualization_60s",
    "party_gap_response_unique_edit_count",
    "evaluation_request_count",
    "evaluation_failure_count",
    "friction_event_count",
    "invalid_selection_count",
]

FINAL_PARTY_METRICS = [
    "final_filled_party_slots",
    "final_party_gap_count",
    "final_high_severity_gap_count",
    "final_medium_severity_gap_count",
    "final_redundancy_score",
    "final_selected_ability_count",
    "final_damage_ability_count",
    "final_utility_ability_count",
    "final_healing_count",
    "final_control_count",
    "final_support_count",
    "final_mobility_count",
    "final_long_range_count",
    "final_area_damage_count",
    "final_single_target_damage_count",
    "final_concentration_count",
    "final_role_count",
    "final_damage_type_count",
    "final_range_band_count",
    "final_resource_count",
    "final_unique_class_count",
]

PRIMARY_ASSOCIATIONS = [
    (
        "unique_focus_keys",
        "understood_visualization",
        "Participants who inspected a wider range of Data Circle concepts may have understood the visualization better.",
    ),
    (
        "unique_focus_keys",
        "survey_visualization_interpretation_score",
        "Broader visual inspection may relate to stronger overall visualization interpretation.",
    ),
    (
        "data_circle_focus_select_count",
        "understood_visualization",
        "Active Data Circle selections may relate to visualization understanding.",
    ),
    (
        "data_circle_total_dwell_sec",
        "understood_visualization",
        "Longer dwell on Data Circle concepts may relate to understanding.",
    ),
    (
        "tooltip_open_count",
        "interactive_explanation",
        "Opening tooltips may relate to perceived usefulness of interactivity.",
    ),
    (
        "aggregate_or_party_focus_event_count",
        "noticed_party_patterns",
        "Party/aggregate visual inspection may relate to noticing party-level patterns.",
    ),
    (
        "party_gap_response_unique_edit_count",
        "noticed_party_patterns",
        "Edits after gap detection may relate to noticing party-level patterns.",
    ),
    (
        "unique_party_snapshots",
        "reasoning_tradeoffs_party_overall",
        "Exploring more party states may relate to trade-off reasoning.",
    ),
    (
        "saved_build_loaded_count",
        "exploration_iteration_overall",
        "Revisiting saved builds may relate to perceived iteration support.",
    ),
    (
        "edits_after_visualization_60s",
        "exploration_iteration_overall",
        "Edits soon after visualization interaction may relate to perceived exploration support.",
    ),
    (
        "visual_profile_changing_edit_count",
        "engaging_creative_exploration",
        "Mechanically meaningful edits may relate to perceived creative engagement.",
    ),
    (
        "friction_event_count",
        "readable",
        "More friction events may relate to lower readability.",
    ),
    (
        "evaluation_failure_count",
        "exploration_iteration_overall",
        "Failed simulator attempts may relate to lower exploration support.",
    ),
    (
        "pre_domain_experience_index",
        "build_edit_count",
        "Prior domain experience may relate to editing activity.",
    ),
    (
        "pre_domain_experience_index",
        "survey_visualization_interpretation_score",
        "Domain experience may relate to visualization interpretation.",
    ),
]


REGION_LABELS = {
    "study-survey-modal": "Consent / survey modal",
    "study_survey_modal": "Consent / survey modal",
    "survey-modal": "Consent / survey modal",
    "tutorial-overlay": "Tutorial overlay",
    "tutorial": "Tutorial overlay",
    "data-circle-stage-main": "Main Data Circle",
    "data_circle_stage_main": "Main Data Circle",
    "data-circle": "Data Circle",
    "data_circle": "Data Circle",
    "party-dock": "Party dock",
    "party-summary": "Party summary",
    "party-view": "Party / aggregate view",
    "saved-build-panel": "Saved-build panel",
    "build-editor": "Build editor",
    "character-tab": "Character tab",
    "class-scores-tab": "Class & scores tab",
    "actions-passives-tab": "Actions & passives tab",
    "planner-tabs": "Planner tabs",
    "process-panel": "Process panel",
    "evaluation-panel": "Evaluation panel",
    "unknown": "Unknown / uncategorized",
}

ELEMENT_LABELS = {
    "spell-button": "Spell/action option",
    "class-selector": "Class selector",
    "subclass-selector": "Subclass selector",
    "race-selector": "Race selector",
    "ability-score-card": "Ability score card",
    "feat-card": "Feat card",
    "data-circle-stage-main": "Main Data Circle",
    "party-slot": "Party slot",
    "saved-build-card": "Saved-build card",
    "survey-answer": "Survey answer",
    "survey-submit": "Survey submit",
    "tutorial-next": "Tutorial navigation",
}


PLANNING_REGION_ALLOWLIST = {
    "Main Data Circle",
    "Data Circle",
    "Party dock",
    "Party summary",
    "Party / aggregate view",
    "Saved-build panel",
    "Build editor",
    "Character tab",
    "Class & scores tab",
    "Actions & passives tab",
    "Planner tabs",
    "Process panel",
    "Evaluation panel",
}

ADMIN_REGION_LABELS = {
    "Consent / survey modal",
    "Tutorial overlay",
}


CAPABILITY_METRIC_LABELS = {
    "final_damage_ability_count": "Damage abilities",
    "final_utility_ability_count": "Utility abilities",
    "final_healing_count": "Healing",
    "final_control_count": "Control",
    "final_support_count": "Support",
    "final_mobility_count": "Mobility",
    "final_long_range_count": "Long-range",
    "final_area_damage_count": "Area damage",
    "final_single_target_damage_count": "Single-target damage",
    "final_concentration_count": "Concentration",
}


BEHAVIOUR_PROFILE_METRICS = {
    "active_duration_min": "Active time",
    "build_edit_count": "Build edits",
    "unique_build_states_from_edits": "Unique build states",
    "visual_profile_changing_edit_count": "Profile-changing edits",
    "saved_build_created_count": "Saved builds",
    "saved_build_loaded_count": "Revisited builds",
    "party_slot_assigned_count": "Party assignments",
    "unique_party_snapshots": "Party states",
    "unique_focus_keys": "Data Circle concepts",
    "tooltip_open_count": "Tooltips opened",
    "edits_after_visualization_60s": "Edits after visual inspection",
    "party_gap_response_unique_edit_count": "Edits after gap detection",
    "evaluation_failure_count": "Evaluation failures",
    "friction_event_count": "Friction events",
}


FIGURE_NOTE = (
    "Counts are interpreted as traces of interaction, not as direct measures of decision quality."
)


def setup_plot_style() -> None:
    plt.rcParams.update(
        {
            "figure.facecolor": "white",
            "axes.facecolor": "#fbfbfd",
            "axes.edgecolor": "#d6d6df",
            "axes.linewidth": 0.8,
            "axes.grid": True,
            "grid.color": "#e8e8ef",
            "grid.linewidth": 0.7,
            "grid.alpha": 0.9,
            "font.size": 10,
            "axes.titlesize": 13,
            "axes.labelsize": 10,
            "xtick.labelsize": 9,
            "ytick.labelsize": 9,
            "legend.fontsize": 9,
            "savefig.facecolor": "white",
        }
    )


def safe_get(d: Any, path: Iterable[str], default: Any = None) -> Any:
    cur = d

    for key in path:
        if not isinstance(cur, dict):
            return default

        cur = cur.get(key)

        if cur is None:
            return default

    return cur


def first_present(d: Dict[str, Any], keys: Sequence[str], default: Any = None) -> Any:
    for key in keys:
        if key in d and d[key] not in (None, "", [], {}):
            return d[key]

    return default


def parse_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value

    if value is None:
        return None

    text = str(value).strip().lower()

    if text in {"true", "1", "yes", "y", "checked"}:
        return True

    if text in {"false", "0", "no", "n", "unchecked"}:
        return False

    return None


def parse_num(value: Any) -> float:
    if value is None or value == "":
        return np.nan

    try:
        return float(value)
    except Exception:
        return np.nan


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()

    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)

    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def existing_hashes_in_folder(folder: Path, suffixes: tuple[str, ...]) -> set[str]:
    hashes = set()

    if not folder.exists():
        return hashes

    for path in folder.rglob("*"):
        if not path.is_file():
            continue

        if not path.name.lower().endswith(suffixes):
            continue

        try:
            hashes.add(sha256_file(path))
        except Exception:
            continue

    return hashes


def sanitize_filename(value: Any) -> str:
    text = str(value) if value is not None else "unknown"
    text = re.sub(r"[^A-Za-z0-9_-]+", "_", text)
    return text[:80] if text else "unknown"


def wrap_label(text: Any, width: int = 24) -> str:
    text = str(text) if text is not None else "Unknown"
    return "\n".join(textwrap.wrap(text, width=width))


def make_unique_path(path: Path) -> Path:
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix

    for i in range(2, 10000):
        candidate = path.with_name(f"{stem}_{i}{suffix}")
        if not candidate.exists():
            return candidate

    raise RuntimeError(f"Could not create a unique filename for {path}")


def is_survey_export(data: Any) -> bool:
    return isinstance(data, dict) and data.get("exportType") == "bg3-build-planner-survey-answers"


def stage_raw_exports() -> pd.DataFrame:
    staged_rows = []

    existing_jsonl_hashes = existing_hashes_in_folder(RAW_JSONL_DIR, (".jsonl",))
    existing_survey_hashes = existing_hashes_in_folder(RAW_SURVEY_DIR, (".json",))

    for path in sorted(RAW_EXPORTS_DIR.rglob("*")):
        if not path.is_file():
            continue

        lower_name = path.name.lower()

        if lower_name.endswith(".jsonl"):
            file_hash = sha256_file(path)

            if file_hash in existing_jsonl_hashes:
                staged_rows.append(
                    {
                        "source_file": str(path),
                        "staged_file": "",
                        "file_type": "jsonl",
                        "status": "skipped_existing_hash",
                    }
                )
                continue

            target = make_unique_path(RAW_JSONL_DIR / path.name)
            shutil.copy2(path, target)
            existing_jsonl_hashes.add(file_hash)

            staged_rows.append(
                {
                    "source_file": str(path),
                    "staged_file": str(target),
                    "file_type": "jsonl",
                    "status": "staged",
                }
            )

        elif lower_name.endswith(".json"):
            file_hash = sha256_file(path)

            if file_hash in existing_survey_hashes:
                staged_rows.append(
                    {
                        "source_file": str(path),
                        "staged_file": "",
                        "file_type": "survey_json",
                        "status": "skipped_existing_hash",
                    }
                )
                continue

            try:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = None

            if is_survey_export(data):
                target = make_unique_path(RAW_SURVEY_DIR / path.name)
                shutil.copy2(path, target)
                existing_survey_hashes.add(file_hash)

                staged_rows.append(
                    {
                        "source_file": str(path),
                        "staged_file": str(target),
                        "file_type": "survey_json",
                        "status": "staged",
                    }
                )

        elif lower_name.endswith(".zip"):
            try:
                with zipfile.ZipFile(path, "r") as z:
                    for member in z.infolist():
                        if member.is_dir():
                            continue

                        member_name = Path(member.filename).name

                        if not member_name:
                            continue

                        member_lower = member_name.lower()
                        raw_bytes = z.read(member)
                        member_hash = sha256_bytes(raw_bytes)

                        if member_lower.endswith(".jsonl"):
                            if member_hash in existing_jsonl_hashes:
                                staged_rows.append(
                                    {
                                        "source_file": str(path),
                                        "zip_member": member.filename,
                                        "staged_file": "",
                                        "file_type": "jsonl",
                                        "status": "skipped_existing_hash",
                                    }
                                )
                                continue

                            target_name = f"{path.stem}__{member_name}"
                            target = make_unique_path(RAW_JSONL_DIR / target_name)
                            target.write_bytes(raw_bytes)
                            existing_jsonl_hashes.add(member_hash)

                            staged_rows.append(
                                {
                                    "source_file": str(path),
                                    "zip_member": member.filename,
                                    "staged_file": str(target),
                                    "file_type": "jsonl",
                                    "status": "staged",
                                }
                            )

                        elif member_lower.endswith(".json"):
                            if member_hash in existing_survey_hashes:
                                staged_rows.append(
                                    {
                                        "source_file": str(path),
                                        "zip_member": member.filename,
                                        "staged_file": "",
                                        "file_type": "survey_json",
                                        "status": "skipped_existing_hash",
                                    }
                                )
                                continue

                            try:
                                data = json.loads(raw_bytes.decode("utf-8"))
                            except Exception:
                                data = None

                            if is_survey_export(data):
                                target_name = f"{path.stem}__{member_name}"
                                target = make_unique_path(RAW_SURVEY_DIR / target_name)
                                target.write_bytes(raw_bytes)
                                existing_survey_hashes.add(member_hash)

                                staged_rows.append(
                                    {
                                        "source_file": str(path),
                                        "zip_member": member.filename,
                                        "staged_file": str(target),
                                        "file_type": "survey_json",
                                        "status": "staged",
                                    }
                                )

            except zipfile.BadZipFile:
                staged_rows.append(
                    {
                        "source_file": str(path),
                        "staged_file": "",
                        "file_type": "zip",
                        "status": "bad_zip",
                    }
                )

    staged = pd.DataFrame(staged_rows)

    if not staged.empty:
        staged.to_csv(TABLES_DIR / "staged_raw_exports.csv", index=False, encoding="utf-8-sig")

    return staged


def run_log_parser() -> None:
    if not ANALYZE_LOGS_SCRIPT.exists():
        raise FileNotFoundError(f"Missing {ANALYZE_LOGS_SCRIPT}")

    print("Running analyze_logs.py...")

    subprocess.run(
        [sys.executable, str(ANALYZE_LOGS_SCRIPT)],
        check=True,
        cwd=str(BASE_DIR),
    )


def read_processed_csv(name: str, required: bool = True) -> pd.DataFrame:
    path = PROCESSED_DIR / name

    if not path.exists():
        if required:
            raise FileNotFoundError(f"Missing processed file: {path}")
        return pd.DataFrame()

    return pd.read_csv(path)


def flatten_survey_export(data: Dict[str, Any], source_file: str, source_hash: str) -> Dict[str, Any]:
    participant_id = data.get("participantId")
    session_id = data.get("sessionId") or participant_id

    pre = data.get("preTaskSurvey") or {}
    post = data.get("postTaskSurvey") or {}

    pre_answers = pre.get("answers") or {}
    post_answers = post.get("answers") or {}

    row: Dict[str, Any] = {
        "participant_id": participant_id,
        "session_id": session_id,
        "survey_source_file": source_file,
        "survey_source_hash": source_hash,
        "survey_exported_at": data.get("exportedAt"),
        "survey_exported_at_ms": data.get("exportedAtMs"),
        "pre_submitted_at": pre.get("submittedAt"),
        "post_submitted_at": post.get("submittedAt"),
        "required_consent": parse_bool(safe_get(pre, ["consent", "requiredConsent"])),
        "anonymized_quotes_consent": parse_bool(safe_get(pre, ["consent", "anonymizedQuotesConsent"])),
        "data_reuse_consent": parse_bool(safe_get(pre, ["consent", "dataReuseConsent"])),
    }

    familiarity = pre_answers.get("pre_familiarity") or {}

    row["pre_bg3_familiarity"] = parse_num(familiarity.get("bg3"))
    row["pre_dnd_or_rpg_systems_familiarity"] = parse_num(familiarity.get("dnd_or_rpg_systems"))
    row["pre_charts_visual_summaries_familiarity"] = parse_num(familiarity.get("charts_visual_summaries"))
    row["pre_build_planning_familiarity"] = parse_num(familiarity.get("build_planning"))
    row["pre_external_resources_frequency"] = parse_num(pre_answers.get("external_resources_frequency"))

    priorities = pre_answers.get("build_priorities") or {}

    for key in PRE_PRIORITY_KEYS:
        row[f"pre_priority_{key}"] = parse_bool(priorities.get(key, False))

    row["pre_build_priorities_other"] = pre_answers.get("build_priorities_other", "")

    for group_name in ["exploration", "reasoning", "visualization", "experience"]:
        group = post_answers.get(group_name) or {}
        for key, value in group.items():
            row[key] = parse_num(value)

    factors = post_answers.get("final_party_main_factor") or {}

    for key in POST_FACTOR_KEYS:
        row[f"post_factor_{key}"] = parse_bool(factors.get(key, False))

    row["open_supported_exploration"] = post_answers.get("supported_exploration", "")
    row["open_blocked_exploration"] = post_answers.get("blocked_exploration", "")
    row["open_changed_normal_planning"] = post_answers.get("changed_normal_planning", "")
    row["open_suggested_change"] = post_answers.get("first_change", "")
    row["open_optional_comments"] = post_answers.get("optional_comments", "")
    row["open_factor_visualization_observation"] = post_answers.get(
        "final_party_main_factor_visualization_observation", ""
    )
    row["open_factor_other"] = post_answers.get("final_party_main_factor_other", "")

    row["pre_domain_experience_index"] = np.nanmean(
        [
            row["pre_bg3_familiarity"],
            row["pre_dnd_or_rpg_systems_familiarity"],
            row["pre_build_planning_familiarity"],
        ]
    )

    row["pre_overall_experience_index"] = np.nanmean(
        [
            row["pre_bg3_familiarity"],
            row["pre_dnd_or_rpg_systems_familiarity"],
            row["pre_build_planning_familiarity"],
            row["pre_charts_visual_summaries_familiarity"],
        ]
    )

    bg3 = row["pre_bg3_familiarity"]

    if bg3 == 1:
        row["bg3_experience_group"] = "low"
    elif bg3 == 2:
        row["bg3_experience_group"] = "moderate"
    elif bg3 == 3:
        row["bg3_experience_group"] = "high"
    else:
        row["bg3_experience_group"] = "unknown"

    for composite_name, items in SURVEY_COMPOSITES.items():
        values = [row.get(item, np.nan) for item in items]
        row[composite_name] = np.nanmean(values) if np.any(pd.notna(values)) else np.nan

    return row


def parse_survey_from_json_file(path: Path) -> Optional[Dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    if not is_survey_export(data):
        return None

    return flatten_survey_export(data, path.name, sha256_file(path))


def normalize_survey_event_payload(payload: Dict[str, Any], mode: str) -> Dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}

    if "answers" in payload or "consent" in payload:
        return payload

    if mode == "pre":
        return {
            "submittedAt": payload.get("submittedAt"),
            "submittedAtMs": payload.get("submittedAtMs"),
            "consent": payload.get("consent") or {},
            "answers": payload.get("answers") or payload,
        }

    return {
        "submittedAt": payload.get("submittedAt"),
        "submittedAtMs": payload.get("submittedAtMs"),
        "answers": payload.get("answers") or payload,
    }


def extract_survey_exports_from_jsonl() -> pd.DataFrame:
    manifest_path = PROCESSED_DIR / "analysis_manifest.csv"

    if not manifest_path.exists():
        return pd.DataFrame()

    manifest = pd.read_csv(manifest_path)
    included = manifest[manifest["status"] == "included"]

    rows = []

    for _, manifest_row in included.iterrows():
        source_path = Path(str(manifest_row["source_path"]))

        if not source_path.exists():
            continue

        participant_id = None
        session_id = None
        pre_event = None
        post_event = None
        ended_at = None
        ended_at_ms = None

        with source_path.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    event = json.loads(line)
                except Exception:
                    continue

                if not isinstance(event, dict):
                    continue

                participant_id = participant_id or event.get("participantId")
                session_id = session_id or event.get("sessionId") or participant_id

                event_type = event.get("eventType")
                payload = event.get("payload") or {}

                if event_type == "survey_pre_task_submitted":
                    pre_event = normalize_survey_event_payload(payload, "pre")

                elif event_type == "survey_post_task_submitted":
                    post_event = normalize_survey_event_payload(payload, "post")

                elif event_type == "study_ended":
                    ended_at = event.get("timestamp")
                    ended_at_ms = event.get("timestampMs")

        if pre_event or post_event:
            synthetic = {
                "exportType": "bg3-build-planner-survey-answers",
                "exportSchemaVersion": "extracted-from-jsonl",
                "exportedAt": ended_at,
                "exportedAtMs": ended_at_ms,
                "participantId": participant_id,
                "sessionId": session_id,
                "preTaskSurvey": pre_event or {},
                "postTaskSurvey": post_event or {},
            }

            rows.append(
                flatten_survey_export(
                    synthetic,
                    f"extracted_from_{source_path.name}",
                    str(manifest_row.get("source_hash", "")),
                )
            )

    return pd.DataFrame(rows)


def load_surveys() -> pd.DataFrame:
    survey_rows = []

    for path in sorted(RAW_SURVEY_DIR.rglob("*.json")):
        row = parse_survey_from_json_file(path)
        if row is not None:
            survey_rows.append(row)

    survey_files_df = pd.DataFrame(survey_rows)
    jsonl_survey_df = extract_survey_exports_from_jsonl()

    if survey_files_df.empty and jsonl_survey_df.empty:
        return pd.DataFrame()

    combined = pd.concat(
        [survey_files_df, jsonl_survey_df],
        ignore_index=True,
    )

    combined["survey_exported_at_ms"] = pd.to_numeric(
        combined["survey_exported_at_ms"],
        errors="coerce",
    )
    combined["has_external_survey_file"] = ~combined["survey_source_file"].fillna("").str.startswith(
        "extracted_from_"
    )

    combined = combined.sort_values(
        [
            "participant_id",
            "session_id",
            "has_external_survey_file",
            "survey_exported_at_ms",
        ],
        ascending=[True, True, False, False],
    )

    combined = combined.drop_duplicates(["participant_id", "session_id"], keep="first").reset_index(drop=True)

    return combined


def extract_technical_environment_from_logs() -> pd.DataFrame:
    manifest_path = PROCESSED_DIR / "analysis_manifest.csv"

    if not manifest_path.exists():
        return pd.DataFrame()

    manifest = pd.read_csv(manifest_path)
    included = manifest[manifest["status"] == "included"]
    rows = []

    for _, manifest_row in included.iterrows():
        source_path = Path(str(manifest_row["source_path"]))

        if not source_path.exists():
            continue

        participant_id = manifest_row.get("participant_id")
        session_id = manifest_row.get("session_id") or participant_id

        env_row = {
            "participant_id": participant_id,
            "session_id": session_id,
            "source_file": source_path.name,
            "user_agent": "",
            "platform": "",
            "time_zone_offset_min": np.nan,
            "screen_width": np.nan,
            "screen_height": np.nan,
            "viewport_width": np.nan,
            "viewport_height": np.nan,
            "device_pixel_ratio": np.nan,
            "mobile_like_viewport": False,
        }

        with source_path.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    event = json.loads(line)
                except Exception:
                    continue

                if not isinstance(event, dict):
                    continue

                payload = event.get("payload") or {}

                candidate_env = (
                    payload.get("technicalEnvironment")
                    or payload.get("environment")
                    or payload.get("device")
                    or payload.get("browser")
                    or payload
                )

                if not isinstance(candidate_env, dict):
                    continue

                env_row["user_agent"] = first_present(
                    candidate_env,
                    ["userAgent", "user_agent"],
                    env_row["user_agent"],
                )
                env_row["platform"] = first_present(
                    candidate_env,
                    ["platform", "navigatorPlatform"],
                    env_row["platform"],
                )
                env_row["time_zone_offset_min"] = parse_num(
                    first_present(
                        candidate_env,
                        ["timeZoneOffsetMin", "timezoneOffsetMin", "time_zone_offset_min"],
                        env_row["time_zone_offset_min"],
                    )
                )
                env_row["screen_width"] = parse_num(
                    first_present(
                        candidate_env,
                        ["screenWidth", "screen_width"],
                        env_row["screen_width"],
                    )
                )
                env_row["screen_height"] = parse_num(
                    first_present(
                        candidate_env,
                        ["screenHeight", "screen_height"],
                        env_row["screen_height"],
                    )
                )
                env_row["viewport_width"] = parse_num(
                    first_present(
                        candidate_env,
                        ["viewportWidth", "innerWidth", "windowWidth", "viewport_width"],
                        env_row["viewport_width"],
                    )
                )
                env_row["viewport_height"] = parse_num(
                    first_present(
                        candidate_env,
                        ["viewportHeight", "innerHeight", "windowHeight", "viewport_height"],
                        env_row["viewport_height"],
                    )
                )
                env_row["device_pixel_ratio"] = parse_num(
                    first_present(
                        candidate_env,
                        ["devicePixelRatio", "device_pixel_ratio"],
                        env_row["device_pixel_ratio"],
                    )
                )

                if event.get("eventType") == "study_started":
                    break

        vw = env_row["viewport_width"]
        vh = env_row["viewport_height"]
        ua = str(env_row["user_agent"]).lower()

        mobile_by_size = pd.notna(vw) and pd.notna(vh) and min(vw, vh) < 650
        mobile_by_agent = any(token in ua for token in ["mobile", "android", "iphone", "ipad"])

        env_row["mobile_like_viewport"] = bool(mobile_by_size or mobile_by_agent)

        rows.append(env_row)

    return pd.DataFrame(rows)


def bootstrap_ci(values: pd.Series, statistic: str = "mean", n_boot: int = 3000) -> Tuple[float, float]:
    x = pd.to_numeric(values, errors="coerce").dropna().to_numpy(dtype=float)

    if len(x) < 3:
        return np.nan, np.nan

    rng = np.random.default_rng(2026)
    boot = np.empty(n_boot)

    for i in range(n_boot):
        sample = rng.choice(x, size=len(x), replace=True)
        boot[i] = np.median(sample) if statistic == "median" else np.mean(sample)

    return float(np.percentile(boot, 2.5)), float(np.percentile(boot, 97.5))


def numeric_descriptives(df: pd.DataFrame, columns: Sequence[str], group_col: Optional[str] = None) -> pd.DataFrame:
    rows = []

    if group_col and group_col in df.columns:
        groups = list(df.groupby(group_col, dropna=False))
    else:
        groups = [(None, df)]

    for group_value, group_df in groups:
        for col in columns:
            if col not in group_df.columns:
                continue

            x = pd.to_numeric(group_df[col], errors="coerce").dropna()

            mean_ci = bootstrap_ci(x, "mean") if len(x) >= 3 else (np.nan, np.nan)
            median_ci = bootstrap_ci(x, "median") if len(x) >= 3 else (np.nan, np.nan)

            rows.append(
                {
                    "group_variable": group_col or "",
                    "group": group_value if group_col else "",
                    "variable": col,
                    "n": int(x.count()),
                    "missing": int(len(group_df) - x.count()),
                    "mean": float(x.mean()) if len(x) else np.nan,
                    "sd": float(x.std(ddof=1)) if len(x) > 1 else np.nan,
                    "median": float(x.median()) if len(x) else np.nan,
                    "q1": float(x.quantile(0.25)) if len(x) else np.nan,
                    "q3": float(x.quantile(0.75)) if len(x) else np.nan,
                    "min": float(x.min()) if len(x) else np.nan,
                    "max": float(x.max()) if len(x) else np.nan,
                    "mean_ci_low_boot": mean_ci[0],
                    "mean_ci_high_boot": mean_ci[1],
                    "median_ci_low_boot": median_ci[0],
                    "median_ci_high_boot": median_ci[1],
                }
            )

    return pd.DataFrame(rows)


def cronbach_alpha(df: pd.DataFrame, items: Sequence[str]) -> float:
    available = [c for c in items if c in df.columns]

    if len(available) < 3:
        return np.nan

    item_df = df[available].apply(pd.to_numeric, errors="coerce").dropna()

    if len(item_df) < 3:
        return np.nan

    k = len(available)
    item_variances = item_df.var(axis=0, ddof=1)
    total_variance = item_df.sum(axis=1).var(ddof=1)

    if pd.isna(total_variance) or total_variance == 0:
        return np.nan

    return float((k / (k - 1)) * (1 - item_variances.sum() / total_variance))


def survey_reliability_table(survey_df: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for composite, items in SURVEY_COMPOSITES.items():
        available = [c for c in items if c in survey_df.columns]
        complete_cases = survey_df[available].apply(pd.to_numeric, errors="coerce").dropna().shape[0] if available else 0

        rows.append(
            {
                "composite": composite,
                "items": ";".join(items),
                "item_count": len(items),
                "available_item_count": len(available),
                "complete_cases": int(complete_cases),
                "cronbach_alpha": cronbach_alpha(survey_df, items),
                "alpha_interpretable": bool(len(available) >= 3 and complete_cases >= 3),
            }
        )

    return pd.DataFrame(rows)


def bh_adjust(p_values: Sequence[float]) -> List[float]:
    p = np.array([np.nan if v is None else v for v in p_values], dtype=float)
    q = np.full_like(p, np.nan, dtype=float)

    valid = np.where(~np.isnan(p))[0]

    if len(valid) == 0:
        return q.tolist()

    pv = p[valid]
    order = np.argsort(pv)
    ranked = pv[order]
    m = len(ranked)

    adjusted = np.empty(m)
    running = 1.0

    for i in range(m - 1, -1, -1):
        rank = i + 1
        running = min(running, ranked[i] * m / rank)
        adjusted[i] = running

    restored = np.empty(m)
    restored[order] = adjusted
    q[valid] = restored

    return q.tolist()


def rank_biserial_from_differences(values: pd.Series, neutral: float = 3.0) -> float:
    x = pd.to_numeric(values, errors="coerce").dropna()
    diff = x - neutral
    diff = diff[diff != 0]

    if diff.empty:
        return np.nan

    ranks = pd.Series(np.abs(diff)).rank(method="average")
    w_pos = float(ranks[diff > 0].sum())
    w_neg = float(ranks[diff < 0].sum())
    denom = w_pos + w_neg

    if denom == 0:
        return np.nan

    return (w_pos - w_neg) / denom


def likert_midpoint_tests(df: pd.DataFrame, columns: Sequence[str], neutral: float = 3.0) -> pd.DataFrame:
    rows = []

    for col in columns:
        if col not in df.columns:
            continue

        x = pd.to_numeric(df[col], errors="coerce").dropna()

        if x.empty:
            continue

        above = int((x > neutral).sum())
        below = int((x < neutral).sum())
        ties = int((x == neutral).sum())
        n_non_tied = above + below

        wilcoxon_stat = np.nan
        wilcoxon_p = np.nan
        sign_p = np.nan

        if SCIPY_AVAILABLE and len(x) >= 5:
            diff = x - neutral
            nonzero = diff[diff != 0]

            if len(nonzero) > 0:
                try:
                    wilcoxon_stat, wilcoxon_p = stats.wilcoxon(
                        nonzero,
                        zero_method="wilcox",
                        alternative="two-sided",
                    )
                except Exception:
                    pass

            if n_non_tied > 0:
                try:
                    sign_p = stats.binomtest(
                        k=max(above, below),
                        n=n_non_tied,
                        p=0.5,
                        alternative="two-sided",
                    ).pvalue
                except Exception:
                    pass

        rows.append(
            {
                "variable": col,
                "label": LIKERT_LABELS.get(col, col),
                "n": int(len(x)),
                "median": float(x.median()),
                "q1": float(x.quantile(0.25)),
                "q3": float(x.quantile(0.75)),
                "mean": float(x.mean()),
                "neutral_reference": neutral,
                "above_neutral_count": above,
                "below_neutral_count": below,
                "neutral_tie_count": ties,
                "above_neutral_proportion": above / len(x),
                "below_neutral_proportion": below / len(x),
                "rank_biserial_effect_size": rank_biserial_from_differences(x, neutral),
                "wilcoxon_statistic": float(wilcoxon_stat) if pd.notna(wilcoxon_stat) else np.nan,
                "wilcoxon_p_value": float(wilcoxon_p) if pd.notna(wilcoxon_p) else np.nan,
                "sign_test_p_value": float(sign_p) if pd.notna(sign_p) else np.nan,
                "note": "Exploratory midpoint check; interpreted with effect size and descriptive distribution.",
            }
        )

    out = pd.DataFrame(rows)

    if not out.empty:
        out["wilcoxon_p_value_bh"] = bh_adjust(out["wilcoxon_p_value"].tolist())
        out["sign_test_p_value_bh"] = bh_adjust(out["sign_test_p_value"].tolist())

    return out


def spearman_ci_bootstrap(x: pd.Series, y: pd.Series, n_boot: int = 3000) -> Tuple[float, float]:
    pair = pd.DataFrame({"x": x, "y": y}).apply(pd.to_numeric, errors="coerce").dropna()

    if len(pair) < 8:
        return np.nan, np.nan

    rng = np.random.default_rng(2026)
    values = pair.to_numpy(dtype=float)
    boot = []

    for _ in range(n_boot):
        idx = rng.choice(np.arange(len(values)), size=len(values), replace=True)
        sample = values[idx, :]

        if len(np.unique(sample[:, 0])) < 2 or len(np.unique(sample[:, 1])) < 2:
            continue

        rho = pd.Series(sample[:, 0]).rank().corr(pd.Series(sample[:, 1]).rank())

        if pd.notna(rho):
            boot.append(rho)

    if len(boot) < 50:
        return np.nan, np.nan

    return float(np.percentile(boot, 2.5)), float(np.percentile(boot, 97.5))


def primary_association_tests(df: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for x_col, y_col, rationale in PRIMARY_ASSOCIATIONS:
        if x_col not in df.columns or y_col not in df.columns:
            rows.append(
                {
                    "x": x_col,
                    "y": y_col,
                    "rationale": rationale,
                    "n": 0,
                    "spearman_rho": np.nan,
                    "spearman_p_value": np.nan,
                    "kendall_tau_b": np.nan,
                    "kendall_p_value": np.nan,
                    "spearman_ci_low_boot": np.nan,
                    "spearman_ci_high_boot": np.nan,
                    "note": "Variable missing.",
                }
            )
            continue

        pair = df[[x_col, y_col]].apply(pd.to_numeric, errors="coerce").dropna()

        if len(pair) < 5:
            rows.append(
                {
                    "x": x_col,
                    "y": y_col,
                    "rationale": rationale,
                    "n": int(len(pair)),
                    "spearman_rho": np.nan,
                    "spearman_p_value": np.nan,
                    "kendall_tau_b": np.nan,
                    "kendall_p_value": np.nan,
                    "spearman_ci_low_boot": np.nan,
                    "spearman_ci_high_boot": np.nan,
                    "note": "Too few complete cases for correlation.",
                }
            )
            continue

        if pair[x_col].nunique() < 2 or pair[y_col].nunique() < 2:
            rows.append(
                {
                    "x": x_col,
                    "y": y_col,
                    "rationale": rationale,
                    "n": int(len(pair)),
                    "spearman_rho": np.nan,
                    "spearman_p_value": np.nan,
                    "kendall_tau_b": np.nan,
                    "kendall_p_value": np.nan,
                    "spearman_ci_low_boot": np.nan,
                    "spearman_ci_high_boot": np.nan,
                    "note": "One variable has no variation.",
                }
            )
            continue

        if SCIPY_AVAILABLE:
            rho, p = stats.spearmanr(pair[x_col], pair[y_col])
            tau, tau_p = stats.kendalltau(pair[x_col], pair[y_col], variant="b")
        else:
            rho = pair[x_col].rank().corr(pair[y_col].rank())
            p = np.nan
            tau = np.nan
            tau_p = np.nan

        ci_low, ci_high = spearman_ci_bootstrap(pair[x_col], pair[y_col])

        rows.append(
            {
                "x": x_col,
                "y": y_col,
                "rationale": rationale,
                "n": int(len(pair)),
                "spearman_rho": float(rho) if pd.notna(rho) else np.nan,
                "spearman_p_value": float(p) if pd.notna(p) else np.nan,
                "kendall_tau_b": float(tau) if pd.notna(tau) else np.nan,
                "kendall_p_value": float(tau_p) if pd.notna(tau_p) else np.nan,
                "spearman_ci_low_boot": ci_low,
                "spearman_ci_high_boot": ci_high,
                "note": "Exploratory association; not causal.",
            }
        )

    out = pd.DataFrame(rows)

    if not out.empty:
        out["spearman_p_value_bh"] = bh_adjust(out["spearman_p_value"].tolist())
        out["kendall_p_value_bh"] = bh_adjust(out["kendall_p_value"].tolist())

    return out


def zscore_series(s: pd.Series) -> pd.Series:
    x = pd.to_numeric(s, errors="coerce")
    sd = x.std(ddof=1)

    if pd.isna(sd) or sd == 0:
        return pd.Series(np.zeros(len(x)), index=x.index)

    return (x - x.mean()) / sd


def add_exploratory_indices(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    definitions = {
        "log_exploration_breadth_index": [
            "unique_build_states_from_edits",
            "saved_build_created_count",
            "saved_build_loaded_count",
            "unique_party_snapshots",
            "unique_focus_keys",
        ],
        "log_revision_depth_index": [
            "build_edit_count",
            "visual_profile_changing_edit_count",
            "edits_after_visualization_60s",
            "party_gap_response_unique_edit_count",
        ],
        "log_visualization_engagement_index": [
            "visualization_event_count",
            "data_circle_focus_select_count",
            "data_circle_total_dwell_sec",
            "tooltip_open_count",
            "unique_focus_keys",
        ],
        "log_party_reasoning_index": [
            "party_slot_assigned_count",
            "party_coverage_unique_state_count",
            "party_gap_response_unique_edit_count",
            "aggregate_or_party_focus_event_count",
        ],
        "log_friction_index": [
            "friction_event_count",
            "invalid_selection_count",
            "evaluation_failure_count",
        ],
    }

    for index_name, cols in definitions.items():
        existing = [c for c in cols if c in out.columns]

        if not existing:
            out[index_name] = np.nan
            continue

        z_df = pd.DataFrame({c: zscore_series(out[c]) for c in existing})
        out[index_name] = z_df.mean(axis=1)

    return out


def priority_factor_tables(survey_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    def summarize(prefix: str, keys: Sequence[str]) -> pd.DataFrame:
        rows = []

        for key in keys:
            col = f"{prefix}{key}"

            if col not in survey_df.columns:
                selected = pd.Series([False] * len(survey_df))
            else:
                selected = survey_df[col].map(parse_bool).fillna(False)

            rows.append(
                {
                    "factor": key,
                    "label": FACTOR_LABELS.get(key, key),
                    "count_selected": int(selected.sum()),
                    "n": int(len(selected)),
                    "proportion_selected": float(selected.mean()) if len(selected) else np.nan,
                }
            )

        return pd.DataFrame(rows).sort_values("count_selected", ascending=False)

    return summarize("pre_priority_", PRE_PRIORITY_KEYS), summarize("post_factor_", POST_FACTOR_KEYS)


def qualitative_tables(survey_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    text_fields = [
        ("supported_exploration", "open_supported_exploration"),
        ("blocked_exploration", "open_blocked_exploration"),
        ("changed_normal_planning", "open_changed_normal_planning"),
        ("suggested_change", "open_suggested_change"),
        ("optional_comments", "open_optional_comments"),
        ("visualization_observation", "open_factor_visualization_observation"),
        ("other_factor", "open_factor_other"),
    ]

    keyword_sets = {
        "mentions_data_circle": ["circle", "data circle", "ring", "radial"],
        "mentions_party_view": ["party", "aggregate", "gap", "balance", "roles"],
        "mentions_tooltips_explanation": ["tooltip", "explain", "explanation", "definition", "understand"],
        "mentions_simulator_or_server": ["simulator", "server", "occupied", "try out", "dpr"],
        "mentions_confusion": ["confusing", "confused", "unclear", "did not know", "hard to"],
        "mentions_exploration": ["explore", "exploration", "try", "revise", "compare", "curious"],
        "mentions_external_resources": ["search", "google", "guide", "wiki", "look up"],
    }

    rows = []

    for _, row in survey_df.iterrows():
        for response_type, col in text_fields:
            text = row.get(col, "")
            if pd.isna(text):
                text = ""

            text = str(text).strip()
            lower = text.lower()

            out = {
                "participant_id": row.get("participant_id"),
                "session_id": row.get("session_id"),
                "response_type": response_type,
                "response_text": text,
                "word_count": len(text.split()) if text else 0,
                "character_count": len(text),
            }

            for flag, keywords in keyword_sets.items():
                out[flag] = any(k in lower for k in keywords)

            rows.append(out)

    qualitative_export = pd.DataFrame(rows)

    coding_template = qualitative_export.copy()
    coding_template["include_quote"] = ""
    coding_template["code_primary"] = ""
    coding_template["code_secondary"] = ""
    coding_template["theme"] = ""
    coding_template["researcher_note"] = ""

    if qualitative_export.empty:
        theme_indicators = pd.DataFrame()
    else:
        indicator_cols = list(keyword_sets.keys())
        theme_indicators = (
            qualitative_export.groupby("response_type")[indicator_cols]
            .sum()
            .reset_index()
        )

    return qualitative_export, coding_template, theme_indicators


def experience_group_tests(df: pd.DataFrame, metrics: Sequence[str]) -> pd.DataFrame:
    if "bg3_experience_group" not in df.columns:
        return pd.DataFrame()

    rows = []

    for metric in metrics:
        if metric not in df.columns:
            continue

        groups = []

        for group_name, group_df in df.groupby("bg3_experience_group", dropna=False):
            x = pd.to_numeric(group_df[metric], errors="coerce").dropna()

            if len(x) >= 3:
                groups.append((group_name, x.to_numpy(dtype=float)))

        h_stat = np.nan
        p_value = np.nan
        test_name = "not_run"

        if SCIPY_AVAILABLE and len(groups) >= 2:
            try:
                h_stat, p_value = stats.kruskal(*[g[1] for g in groups])
                test_name = "kruskal_wallis"
            except Exception:
                pass

        rows.append(
            {
                "metric": metric,
                "valid_groups_with_n_at_least_3": ";".join(str(g[0]) for g in groups),
                "test": test_name,
                "statistic": float(h_stat) if pd.notna(h_stat) else np.nan,
                "p_value": float(p_value) if pd.notna(p_value) else np.nan,
                "note": "Exploratory group check; use only with enough participants per experience group.",
            }
        )

    out = pd.DataFrame(rows)

    if not out.empty:
        out["p_value_bh"] = bh_adjust(out["p_value"].tolist())

    return out


def normalize_region_label(value: Any) -> str:
    if pd.isna(value) or value in (None, ""):
        return "Unknown / uncategorized"

    key = str(value).strip()
    normalized_key = key.lower().replace("_", "-")

    return REGION_LABELS.get(key, REGION_LABELS.get(normalized_key, key.replace("_", " ").replace("-", " ").title()))


def normalize_element_label(value: Any) -> str:
    if pd.isna(value) or value in (None, ""):
        return "Unknown element"

    key = str(value).strip()
    normalized_key = key.lower().replace("_", "-")

    return ELEMENT_LABELS.get(key, ELEMENT_LABELS.get(normalized_key, key.replace("_", " ").replace("-", " ").title()))


def add_attention_labels(heatmap_semantic_events: pd.DataFrame) -> pd.DataFrame:
    if heatmap_semantic_events.empty:
        return heatmap_semantic_events

    out = heatmap_semantic_events.copy()
    out["region_label"] = out["study_region"].map(normalize_region_label)
    out["element_label"] = out["study_element"].map(normalize_element_label)

    out["attention_context"] = np.where(
        out["region_label"].isin(ADMIN_REGION_LABELS),
        "Study administration / onboarding",
        np.where(out["region_label"].isin(PLANNING_REGION_ALLOWLIST), "Planning interface", "Other / uncategorized"),
    )

    return out


def save_csv(df: pd.DataFrame, name: str) -> None:
    df.to_csv(TABLES_DIR / name, index=False, encoding="utf-8-sig")


def savefig(path: Path) -> None:
    plt.tight_layout()
    plt.savefig(path, dpi=240, bbox_inches="tight")
    plt.close()


def annotate_bars(ax, bars, fmt="{:.0f}") -> None:
    for bar in bars:
        width = bar.get_width()
        if pd.notna(width):
            ax.text(
                width,
                bar.get_y() + bar.get_height() / 2,
                " " + fmt.format(width),
                va="center",
                ha="left",
                fontsize=8,
                color="#333333",
            )


def plot_horizontal_count_bars(
    df: pd.DataFrame,
    label_col: str,
    value_col: str,
    title: str,
    subtitle: str,
    path: Path,
    top_n: int = 25,
    xlabel: str = "Count",
) -> None:
    if df.empty or label_col not in df.columns or value_col not in df.columns:
        return

    d = df[[label_col, value_col]].dropna().copy()
    d[value_col] = pd.to_numeric(d[value_col], errors="coerce")
    d = d.dropna(subset=[value_col])

    if d.empty:
        return

    d = d.sort_values(value_col, ascending=True)

    if len(d) > top_n:
        d = d.tail(top_n)

    plt.figure(figsize=(9.5, max(4.8, 0.42 * len(d))))
    ax = plt.gca()

    bars = ax.barh(d[label_col].astype(str), d[value_col], color="#5b78a7", alpha=0.9)

    annotate_bars(ax, bars)

    ax.set_title(title, loc="left", pad=18, fontweight="bold")
    ax.text(
        0,
        1.01,
        subtitle,
        transform=ax.transAxes,
        ha="left",
        va="bottom",
        fontsize=9,
        color="#555555",
        wrap=True,
    )
    ax.set_xlabel(xlabel)
    ax.set_ylabel("")
    ax.spines[["top", "right"]].set_visible(False)

    savefig(path)




def create_event_instrumentation_audit(event_type_counts: pd.DataFrame) -> pd.DataFrame:
    if event_type_counts.empty:
        return pd.DataFrame()

    d = event_type_counts.copy()

    d["event_family"] = d["event_type"].map(
        lambda event_type: (
            "Build edit"
            if str(event_type) == "build_edit"
            else "Saved-build workflow"
            if str(event_type) in {
                "save_current_build_clicked",
                "build_saved",
                "saved_build_created",
                "build_loaded",
                "saved_build_loaded",
                "build_deleted",
                "saved_build_deleted",
                "build_overwritten",
                "saved_build_send_to_party_clicked",
            }
            else "Party planning / derived party state"
            if str(event_type).startswith("party_")
            else "Visualization interaction"
            if str(event_type).startswith("data_circle") or "highlighted" in str(event_type) or str(event_type) == "linked_highlight_exposed"
            else "Simulator/evaluation"
            if "evaluation" in str(event_type) or "simulator" in str(event_type)
            else "Friction / blocked action"
            if str(event_type) in {
                "invalid_selection_attempted",
                "disabled_option_hovered",
                "choice_limit_reached",
                "rapid_toggle_sequence",
                "undo_or_revert_action",
                "section_reset",
            }
            else "Low-level heatmap logging"
            if str(event_type).startswith("heatmap_")
            else "Study/tutorial/survey/admin"
            if "survey" in str(event_type) or "tutorial" in str(event_type) or str(event_type).startswith("study_")
            else "Other"
        )
    )

    d["analytic_use"] = np.select(
        [
            d["event_family"].eq("Low-level heatmap logging"),
            d["event_type"].isin(["party_coverage_updated", "party_gap_detected"]),
            d["event_family"].eq("Study/tutorial/survey/admin"),
        ],
        [
            "Appendix/interface attention only; not used as engagement count",
            "Derived state; deduplicated by party state",
            "Data-quality/onboarding context; not planning behaviour",
        ],
        default="Main behavioural analysis",
    )

    audit = (
        d.groupby(["event_family", "event_type", "analytic_use"], dropna=False)
        .agg(
            total_count=("count", "sum"),
            participant_count=("participant_id", "nunique"),
        )
        .reset_index()
        .sort_values(["event_family", "total_count"], ascending=[True, False])
    )

    return audit

def generate_participant_reports(combined: pd.DataFrame, qualitative_export: pd.DataFrame) -> None:
    if combined.empty:
        return

    for _, row in combined.iterrows():
        participant_id = row.get("participant_id")
        session_id = row.get("session_id")
        safe_id = sanitize_filename(participant_id)

        q = qualitative_export[
            qualitative_export["participant_id"] == participant_id
        ] if not qualitative_export.empty else pd.DataFrame()

        lines = [
            f"# Participant report: {participant_id}",
            "",
            f"Session ID: `{session_id}`",
            "",
            "## Completion and timing",
            "",
            f"- Final party complete: {row.get('final_party_complete')}",
            f"- Post-task survey completed: {row.get('post_task_survey_completed')}",
            f"- Active duration: {row.get('active_duration_min')}",
            f"- Total session duration: {row.get('session_duration_min')}",
            f"- Longest idle gap in minutes: {row.get('longest_idle_gap_min')}",
            "",
            "## Core behaviour",
            "",
            f"- Build edits: {row.get('build_edit_count')}",
            f"- Unique build states: {row.get('unique_build_states_from_edits')}",
            f"- Profile-changing edits: {row.get('visual_profile_changing_edit_count')}",
            f"- Saved builds created: {row.get('saved_build_created_count')}",
            f"- Saved builds loaded: {row.get('saved_build_loaded_count')}",
            f"- Unique party states: {row.get('unique_party_snapshots')}",
            f"- Visualization events: {row.get('visualization_event_count')}",
            f"- Unique Data Circle focus keys: {row.get('unique_focus_keys')}",
            f"- Edits after visualization within 60s: {row.get('edits_after_visualization_60s')}",
            f"- Gap-response unique edits: {row.get('party_gap_response_unique_edit_count')}",
            f"- Evaluation failures: {row.get('evaluation_failure_count')}",
            f"- Friction events: {row.get('friction_event_count')}",
            "",
            "## Final party",
            "",
            f"- Classes: {row.get('final_classes')}",
            f"- Filled slots: {row.get('final_filled_party_slots')}",
            f"- Party gaps: {row.get('final_party_gap_count')}",
            f"- High-severity gaps: {row.get('final_high_severity_gap_count')}",
            f"- Role count: {row.get('final_role_count')}",
            f"- Damage type count: {row.get('final_damage_type_count')}",
            f"- Range band count: {row.get('final_range_band_count')}",
            "",
            "## Survey",
            "",
            f"- Exploration support: {row.get('exploration_iteration_overall')}",
            f"- Visualization understanding: {row.get('understood_visualization')}",
            f"- Party-pattern detection: {row.get('noticed_party_patterns')}",
            f"- Readability: {row.get('readable')}",
            f"- BG3 familiarity: {row.get('pre_bg3_familiarity')}",
            "",
            "## Open-ended responses",
            "",
        ]

        if q.empty:
            lines.append("No open-ended responses available.")
        else:
            for _, qr in q.iterrows():
                text = str(qr.get("response_text", "")).strip()
                if text:
                    lines.append(f"### {qr.get('response_type')}")
                    lines.append("")
                    lines.append(text)
                    lines.append("")

        (REPORTS_DIR / f"{safe_id}.md").write_text("\n".join(lines), encoding="utf-8")


def write_analysis_summary(
    combined: pd.DataFrame,
    survey_df: pd.DataFrame,
    data_quality: pd.DataFrame,
    associations: pd.DataFrame,
) -> None:
    n = len(combined)
    usable = int(data_quality["include_recommended"].sum()) if "include_recommended" in data_quality.columns else np.nan

    lines = [
    "# Analysis summary",
    "",
    f"Usable participants: {usable}",
    ]   

    if not associations.empty:
        top = associations.dropna(subset=["spearman_rho"]).copy()
        if not top.empty:
            top["abs_rho"] = top["spearman_rho"].abs()
            top = top.sort_values("abs_rho", ascending=False).head(10)

            lines.extend(["## Strongest exploratory associations", ""])

            for _, row in top.iterrows():
                lines.append(
                    f"- `{row['x']}` vs `{row['y']}`: rho={row['spearman_rho']:.3f}, "
                    f"N={int(row['n'])}, BH p={row.get('spearman_p_value_bh', np.nan)}"
                )

    (RESULTS_DIR / "analysis_summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    setup_plot_style()

    staged = stage_raw_exports()

    if not staged.empty:
        print(f"Staged {len(staged)} file(s) from raw_exports.")

    run_log_parser()

    participant_metrics = read_processed_csv("participant_log_metrics.csv")
    data_quality = read_processed_csv("data_quality_report.csv", required=False)
    event_type_counts = read_processed_csv("event_type_counts.csv", required=False)
    event_category_counts = read_processed_csv("event_category_counts.csv", required=False)
    deliberate_event_family_counts = read_processed_csv("deliberate_event_family_counts.csv", required=False)
    timeline_bins = read_processed_csv("timeline_bins.csv", required=False)
    build_edit_events = read_processed_csv("build_edit_events_long.csv", required=False)
    build_edit_field_counts = read_processed_csv("build_edit_field_counts.csv", required=False)
    visualization_focus_events = read_processed_csv("visualization_focus_events.csv", required=False)
    visualization_focus_summary = read_processed_csv("visualization_focus_summary.csv", required=False)
    party_gap_events = read_processed_csv("party_gap_events.csv", required=False)
    gap_summary = read_processed_csv("gap_summary.csv", required=False)
    heatmap_semantic_events = read_processed_csv("heatmap_semantic_events.csv", required=False)
    heatmap_target_summary = read_processed_csv("heatmap_target_summary.csv", required=False)
    heatmap_region_summary = read_processed_csv("heatmap_region_summary.csv", required=False)
    final_party_members = read_processed_csv("final_party_members.csv", required=False)
    final_party_profile_long = read_processed_csv("final_party_profile_long.csv", required=False)
    evaluation_events = read_processed_csv("evaluation_events.csv", required=False)
    friction_events = read_processed_csv("friction_events.csv", required=False)
    feature_followup_events = read_processed_csv("feature_followup_events.csv", required=False)

    survey_df = load_surveys()
    technical_environment = extract_technical_environment_from_logs()

    combined = participant_metrics.copy()

    if not survey_df.empty:
        combined = combined.merge(
            survey_df,
            on=["participant_id", "session_id"],
            how="left",
        )

    if not technical_environment.empty:
        combined = combined.merge(
            technical_environment.drop(columns=["source_file"], errors="ignore"),
            on=["participant_id", "session_id"],
            how="left",
        )

    combined = add_exploratory_indices(combined)

    heatmap_semantic_events_labelled = add_attention_labels(heatmap_semantic_events)

    log_descriptives = numeric_descriptives(combined, CORE_LOG_METRICS)
    final_party_descriptives = numeric_descriptives(combined, FINAL_PARTY_METRICS)

    if "bg3_experience_group" in combined.columns:
        log_descriptives_by_bg3_experience = numeric_descriptives(
            combined,
            CORE_LOG_METRICS + FINAL_PARTY_METRICS,
            group_col="bg3_experience_group",
        )
    else:
        log_descriptives_by_bg3_experience = pd.DataFrame()

    if not survey_df.empty:
        survey_item_descriptives = numeric_descriptives(survey_df, LIKERT_POST_ITEMS)
        survey_composite_descriptives = numeric_descriptives(survey_df, list(SURVEY_COMPOSITES.keys()))
        survey_reliability = survey_reliability_table(survey_df)
        survey_midpoint_tests = likert_midpoint_tests(
            survey_df,
            LIKERT_POST_ITEMS + list(SURVEY_COMPOSITES.keys()),
            neutral=3.0,
        )
        pre_priority_counts, post_factor_counts = priority_factor_tables(survey_df)
        qualitative_export, coding_template, qualitative_keyword_indicators = qualitative_tables(survey_df)
    else:
        survey_item_descriptives = pd.DataFrame()
        survey_composite_descriptives = pd.DataFrame()
        survey_reliability = pd.DataFrame()
        survey_midpoint_tests = pd.DataFrame()
        pre_priority_counts = pd.DataFrame()
        post_factor_counts = pd.DataFrame()
        qualitative_export = pd.DataFrame()
        coding_template = pd.DataFrame()
        qualitative_keyword_indicators = pd.DataFrame()

    primary_associations = primary_association_tests(combined)

    experience_group_results = experience_group_tests(
        combined,
        [
            "build_edit_count",
            "unique_build_states_from_edits",
            "visualization_event_count",
            "unique_focus_keys",
            "edits_after_visualization_60s",
            "party_gap_response_unique_edit_count",
            "friction_event_count",
            "survey_visualization_interpretation_score",
            "survey_decision_reasoning_score",
            "survey_exploration_support_score",
        ],
    )

    save_csv(combined, "participant_analysis_table.csv")
    save_csv(data_quality, "data_quality_report.csv")
    save_csv(technical_environment, "technical_environment_summary.csv")
    save_csv(log_descriptives, "overall_log_descriptives.csv")
    save_csv(log_descriptives_by_bg3_experience, "log_descriptives_by_bg3_experience.csv")
    save_csv(final_party_descriptives, "final_party_descriptives.csv")
    save_csv(survey_df, "survey_participant_table.csv")
    save_csv(survey_item_descriptives, "survey_item_descriptives.csv")
    save_csv(survey_composite_descriptives, "survey_composite_descriptives.csv")
    save_csv(survey_reliability, "survey_reliability.csv")
    save_csv(survey_midpoint_tests, "survey_midpoint_tests.csv")
    save_csv(primary_associations, "primary_log_survey_associations.csv")
    save_csv(experience_group_results, "experience_group_tests.csv")
    save_csv(pre_priority_counts, "pre_priority_counts.csv")
    save_csv(post_factor_counts, "post_decision_factor_counts.csv")
    save_csv(qualitative_export, "qualitative_text_export.csv")
    save_csv(coding_template, "qualitative_coding_template.csv")
    save_csv(qualitative_keyword_indicators, "qualitative_keyword_indicators.csv")
    save_csv(heatmap_semantic_events_labelled, "heatmap_semantic_events_labelled.csv")
    save_csv(deliberate_event_family_counts, "deliberate_event_family_counts.csv")
    save_csv(build_edit_events, "build_edit_events_long.csv")
    save_csv(build_edit_field_counts, "build_edit_field_counts.csv")
    save_csv(visualization_focus_events, "visualization_focus_events.csv")
    save_csv(visualization_focus_summary, "visualization_focus_summary.csv")
    save_csv(party_gap_events, "party_gap_events.csv")
    save_csv(gap_summary, "gap_summary.csv")
    save_csv(heatmap_target_summary, "heatmap_target_summary.csv")
    save_csv(heatmap_region_summary, "heatmap_region_summary.csv")
    save_csv(final_party_members, "final_party_members.csv")
    save_csv(final_party_profile_long, "final_party_profile_long.csv")
    save_csv(evaluation_events, "evaluation_events.csv")
    save_csv(friction_events, "friction_events.csv")
    save_csv(feature_followup_events, "feature_followup_events.csv")

    generate_participant_reports(combined, qualitative_export)
    write_analysis_summary(combined, survey_df, data_quality, primary_associations)

    print()
    print("Full analysis complete.")
    print(f"Main participant table: {TABLES_DIR / 'participant_analysis_table.csv'}")
    print(f"Tables: {TABLES_DIR}")
    print(f"Participant reports: {REPORTS_DIR}")
    print(f"Summary: {RESULTS_DIR / 'analysis_summary.md'}")
    print()
    print("Participants:")
    print(combined[["participant_id", "session_id"]].to_string(index=False))


if __name__ == "__main__":
    main()