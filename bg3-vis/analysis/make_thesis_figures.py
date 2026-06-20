"""
Remember to cd bg3-vis and then cd analysis before running this script.
Run after run_full_analysis.py

"""

from __future__ import annotations

import re
import textwrap
from pathlib import Path

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap, to_rgba
from matplotlib.lines import Line2D
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from matplotlib.patches import Rectangle

try:
    from PIL import Image
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

try:
    from scipy.ndimage import gaussian_filter
    SCIPY_AVAILABLE = True
except Exception:
    gaussian_filter = None
    SCIPY_AVAILABLE = False

BASE_DIR = Path(__file__).resolve().parent
TABLES_DIR = BASE_DIR / "data" / "results" / "tables"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUT_DIR = BASE_DIR / "data" / "results" / "thesis_figures"
OUT_APPENDIX = OUT_DIR / "appendix"
OUT_PER_PARTICIPANT = OUT_DIR / "per_participant"
ASSETS_DIR = BASE_DIR.parent / "src" / "assets"

for d in (OUT_DIR, OUT_APPENDIX, OUT_PER_PARTICIPANT):
    d.mkdir(parents=True, exist_ok=True)


WHITE = "#ffffff"
INK = "#211a14"
INK_SOFT = "#55493a"
INK_FAINT = "#8a7e6c"
GRID = "#e9e5dd"
GOLD = "#b8863b"          
GOLD_BRIGHT = "#d7b06a" 
GOLD_PALE = "#efdcb2"
TAN = "#cbbda7"         

EMBER = "#c66a3d"         
EMBER_ACCENT = "#ffb56f" 
TEAL = "#3f9f8a"         
TEAL_ACCENT = "#8ae6c8"   

BLOOD = "#8c2f2f"        
MOSS = "#4f8f35"       


DAMAGE_TYPE_COLORS = {
    "Bludgeoning": "#8c7863", "Piercing": "#a48963", "Slashing": "#b69568",
    "Weapon": "#c3aa7c", "Acid": "#8abf36", "Cold": "#7bc9e8",
    "Fire": "#db5a28", "Force": "#c44b62", "Lightning": "#d9c731",
    "Necrotic": "#6e9b45", "Poison": "#4f8f35", "Psychic": "#b05ac4",
    "Radiant": "#e4c956", "Thunder": "#7377d0", "Variable": "#8d857a",
}
DAMAGE_TYPE_ICONS = {
    key: ASSETS_DIR / "Damage Types" / f"{key}_Damage_Icon.png"
    for key in DAMAGE_TYPE_COLORS
}


DAMAGE_ROLES = ["single-target-damage", "area-damage"]
UTILITY_ROLES = [
    "control", "support-buff", "defense-protection", "healing",
    "mobility-positioning", "summon", "narrative-interaction",
    "investigation-world-interaction",
]
ROLE_LABELS = {
    "single-target-damage": "Single-target damage",
    "area-damage": "Area damage",
    "control": "Control",
    "support-buff": "Support / buff",
    "defense-protection": "Defense",
    "healing": "Healing",
    "mobility-positioning": "Mobility",
    "summon": "Summon",
    "narrative-interaction": "Narrative",
    "investigation-world-interaction": "Investigation",
}
ROLE_COLORS = {
    "single-target-damage": "#c66a3d",
    "area-damage": "#e0915c",
    "control": "#2c7a68",
    "support-buff": "#3f9f8a",
    "defense-protection": "#62b3a0",
    "healing": "#8ad1bd",
    "mobility-positioning": "#4f8f9f",
    "summon": "#6c9fa4",
    "narrative-interaction": "#86b6a3",
    "investigation-world-interaction": "#a7cdbd",
}

FAMILY_COLORS = {
    "Build edits": GOLD,
    "Saved-build workflow": "#9a774b",
    "Party planning": "#5a80a0",
    "Visualization inspection": TEAL,
    "Simulator/evaluation": "#8567ad",
    "Friction or blocked action": BLOOD,
    "Navigation/process": TAN,
}

REGION_COLORS = {
    "Character tab": "#4477AA",                    
    "Class & scores tab": "#EE7733",               
    "Actions, spells & passives tab": "#009988",  
    "Build editor": "#CCBB44",                     
    "Current build summary": "#88CCEE",     

    "Saved-build panel": "#AA3377",       
    "Process / history panel": "#EE6677",       
    "Main Data Circle": "#228833",            
    "Mini Data Circles": "#66CCEE",         
    "Party dock": "#332288",                 
    "Party / aggregate view": "#117733",         
    "Evaluation / simulator panel": "#882255",    

    "Navigation / header": "#999933",          
    "Other planning UI": "#DDDDDD",            
}

EDIT_CATEGORY_COLORS = {
    "Class/level": GOLD,
    "Spells": "#5a80a0",
    "Actions/features": "#8aa6c8",
    "Ability scores": "#c58e4c",
    "Feats": "#8567ad",
    "Skills": "#7b4b61",
    "Identity/background": "#9a774b",
    "Other": TAN,
    "Unknown": "#d8cfc0",
}


CMAP_GOLD = LinearSegmentedColormap.from_list(
    "bg3_gold", [WHITE, GOLD_PALE, GOLD_BRIGHT, GOLD, "#6f4f23"])
CMAP_EMBER = LinearSegmentedColormap.from_list(
    "bg3_ember", [WHITE, "#f6d9c4", EMBER_ACCENT, EMBER, "#7e3c1d"])
CMAP_TEAL = LinearSegmentedColormap.from_list(
    "bg3_teal", [WHITE, "#d8efe8", TEAL_ACCENT, TEAL, "#1f5347"])

CMAP_ROLES = LinearSegmentedColormap.from_list(
    "bg3_roles", [TEAL, "#a8d8cb", "#f4f1ea", "#f0c39e", EMBER])

CMAP_HEAT = LinearSegmentedColormap.from_list(
    "bg3_heat",
    ["#12100d", "#26203a", "#503058", "#8c2f2f", "#c66a3d",
     "#d7b06a", "#f7d995", "#fff7e0"])

CMAP_ATTN = LinearSegmentedColormap.from_list(
    "bg3_attention",
    [WHITE, "#dcecff", "#8fb9f3", "#4477AA", "#1e3f66"]
)

EDIT_HEATMAP_CATEGORY_COLORS = {
    "Class/level": "#4477AA",
    "Spells": "#EE7733",
    "Actions/features": "#009988",
    "Ability scores": "#CCBB44",
    "Feats": "#AA3377",
    "Skills": "#66CCEE",
    "Identity/background": "#228833",
    "Other": "#BBBBBB",
    "Unknown": "#DDDDDD",
}

ATTENTION_REGION_COLORS = {
    "Build planner": "#4477AA",
    "Saved builds": "#AA3377",
    "Main Data Circle": "#009988",
    "Party circles": "#CCBB44",
    "Party view": "#66CCEE",
    "Process / history": "#EE6677",
    "Simulation / evaluation": "#8844AA",
}
LIKERT_COLORS = {1: BLOOD, 2: "#c98e6d", 3: "#ddd5c4", 4: "#7fb39b", 5: "#2c7a68"}

FOCUS_LAYER_COLORS = {
    "range": GOLD,
    "roles-utility": TEAL,
    "damage-types": EMBER,
    "ability": "#9a774b",
}
FOCUS_LAYER_NAMES = {
    "range": "Range rings", "roles-utility": "Role ring",
    "damage-types": "Damage-type ring", "ability": "Ability icons",
}

FOCUS_SOURCE_GROUPS = {
    "editor": "Editable build",
    "data-circle-main": "Editable build",
    "data-circle-party": "Party member",
    "party": "Party member",
    "data-circle-aggregate": "Aggregate party",
    "aggregate": "Aggregate party",
}
FOCUS_SOURCE_COLORS = {
    "Editable build": GOLD,
    "Party member": "#5a80a0",
    "Aggregate party": "#8567ad",
}

STUDY_N: int | None = None


def set_study_n_from_mapping(mapping: dict) -> None:
    """Store the current analyzed participant count for labels and captions."""
    global STUDY_N
    STUDY_N = len(mapping)


def study_n() -> int:
    return int(STUDY_N or 0)


def of_n() -> str:
    n = study_n()
    return f"of {n}" if n else "of included participants"


def participant_range_label() -> str:
    n = study_n()
    return f"P01-P{n:02d}" if n else "P01-PN"


def study_footer() -> str:
    n = study_n()
    if n:
        return f"BG3 party-planner study  |  N = {n}  |  one tool condition"
    return "BG3 party-planner study  |  one tool condition"


def participant_fig_height(n: int, base: float = 2.8, row: float = 0.34, minimum: float = 6.0) -> float:
    """Scale participant-row figures when N grows beyond 20."""
    return max(minimum, base + row * max(n, 1))



def setup_style() -> None:
    mpl.rcParams.update({
        "figure.facecolor": WHITE,
        "savefig.facecolor": WHITE,
        "axes.facecolor": WHITE,
        "axes.edgecolor": GOLD,
        "axes.linewidth": 0.9,
        "axes.grid": True,
        "grid.color": GRID,
        "grid.linewidth": 0.7,
        "font.family": "serif",
        "font.serif": ["Palatino Linotype", "Book Antiqua", "Georgia",
                       "Times New Roman"],
        "font.size": 10,
        "text.color": INK,
        "axes.labelcolor": INK,
        "axes.labelsize": 10,
        "xtick.color": INK_SOFT,
        "ytick.color": INK_SOFT,
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.fontsize": 8.5,
        "legend.frameon": False,
    })


def wrap(text, width: int = 24) -> str:
    return "\n".join(textwrap.wrap(str(text), width=width,
                                   break_long_words=False))


def style_axes(ax) -> None:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(GOLD)
    ax.spines["bottom"].set_color(GOLD)


def new_fig(width: float, height: float, caption_lines: int = 2,
            left: float = 0.10, right: float = 0.95,
            bottom_extra: float = 0.0):
    fig = plt.figure(figsize=(width, height))
    bottom = 0.085 + 0.024 * max(0, caption_lines - 1) + bottom_extra
    fig.subplots_adjust(top=0.88, bottom=bottom, left=left, right=right)
    return fig


def finish(fig, path: Path, title: str, subtitle: str = "",
           caption: str = "") -> None:
    """Shared frame: serif header over a gold rule, short caption, border."""
    fig.text(0.035, 0.982, title, ha="left", va="top",
             fontsize=15, fontweight="bold", color=INK)
    if subtitle:
        fig.text(0.035, 0.948, subtitle, ha="left", va="top",
                 fontsize=9.5, color=INK_SOFT, style="italic")
    rule_y = 0.931 if subtitle else 0.952
    fig.add_artist(Line2D([0.035, 0.965], [rule_y, rule_y],
                          transform=fig.transFigure, color=GOLD, lw=1.4))

    if caption:
        fig.text(0.035, 0.026, caption, ha="left", va="bottom",
                 fontsize=8.5, color=INK_SOFT)
    fig.text(0.965, 0.008, study_footer(), ha="right", va="bottom",
         fontsize=7, color=INK_FAINT)

    for inset, lw, color in ((0.006, 1.4, GOLD), (0.013, 0.5, GOLD_BRIGHT)):
        fig.add_artist(Rectangle(
            (inset, inset), 1 - 2 * inset, 1 - 2 * inset,
            transform=fig.transFigure, fill=False, ec=color, lw=lw))

    fig.savefig(path, dpi=240)
    plt.close(fig)


def icon_image(path: Path):
    if not (PIL_AVAILABLE and path.exists()):
        return None
    try:
        return np.asarray(Image.open(path).convert("RGBA"))
    except Exception:
        return None


def add_icon(ax, img, x, y, size_px: float = 14.0, dx_points: float = 8.0):
    zoom = size_px / max(img.shape[0], img.shape[1])
    ab = AnnotationBbox(
        OffsetImage(img, zoom=zoom), (x, y),
        xybox=(dx_points, 0), boxcoords="offset points",
        frameon=False, box_alignment=(0.0, 0.5), annotation_clip=False)
    ax.add_artist(ab)


# Load the data

def read_table(name: str, processed: bool = False) -> pd.DataFrame:
    path = (PROCESSED_DIR if processed else TABLES_DIR) / name
    if not path.exists():
        print(f"  [warn] missing table: {path.name}")
        return pd.DataFrame()
    return pd.read_csv(path)


def build_pid_map(combined: pd.DataFrame) -> dict:
    map_path = TABLES_DIR / "participant_id_map.csv"
    if map_path.exists():
        existing = pd.read_csv(map_path)
        mapping = dict(zip(existing["participant_id"], existing["anon_id"]))
        if set(combined["participant_id"]) <= set(mapping):
            return mapping

    d = combined[["participant_id", "first_timestamp"]].copy()
    d["first_timestamp"] = pd.to_datetime(d["first_timestamp"], errors="coerce")
    d = d.sort_values(["first_timestamp", "participant_id"]).reset_index(drop=True)
    mapping = {pid: f"P{i + 1:02d}" for i, pid in enumerate(d["participant_id"])}
    pd.DataFrame({"participant_id": list(mapping),
                  "anon_id": list(mapping.values())}
                 ).to_csv(map_path, index=False, encoding="utf-8-sig")
    return mapping


def anon(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    if df.empty or "participant_id" not in df.columns:
        return df
    out = df.copy()
    out["pid"] = out["participant_id"].map(mapping).fillna("P??")
    return out


def pid_key(label) -> int:
    try:
        return int(str(label).lstrip("P"))
    except ValueError:
        return 999


def by_pid(df: pd.DataFrame, ascending: bool = True) -> pd.DataFrame:
    """
    Fixed participant order.
    """
    if df.empty or "pid" not in df.columns:
        return df
    return df.sort_values("pid", key=lambda s: s.map(pid_key),
                          ascending=ascending).reset_index(drop=True)


def pid_order(df: pd.DataFrame) -> list[str]:
    if df.empty or "pid" not in df.columns:
        return []
    return sorted(df["pid"].dropna().unique(), key=pid_key)


def reindex_pid_rows(table: pd.DataFrame, pids: list[str], fill_value=0) -> pd.DataFrame:
    if table.empty:
        return table
    return table.reindex(pids, fill_value=fill_value)


def apply_top_down_pid_axis(ax) -> None:
    ax.invert_yaxis()


RAW_INTERFACE_LABELS = {
    "character-tab": "Character tab",
    "character": "Character tab",
    "class-scores-tab": "Class & scores tab",
    "class-scores": "Class & scores tab",
    "class-level-tab": "Class & scores tab",
    "spells-abilities-tab": "Actions, spells & passives tab",
    "spells-abilities": "Actions, spells & passives tab",
    "spellsabilities": "Actions, spells & passives tab",
    "actions-passives-tab": "Actions, spells & passives tab",
    "actions-passives": "Actions, spells & passives tab",
    "spell-button": "Actions, spells & passives tab",
    "spell-action-option": "Actions, spells & passives tab",
    "class-feature-button": "Actions, spells & passives tab",
    "passive-button": "Actions, spells & passives tab",
    "feat-card": "Actions, spells & passives tab",
    "build-editor": "Build editor",
    "build-editor-panel": "Build editor",
    "current-build-summary": "Current build summary",
    "main-data-circle": "Main Data Circle",
    "main-data-circle-frame": "Main Data Circle",
    "data-circle-stage-main": "Main Data Circle",
    "data-circle-main": "Main Data Circle",
    "data-circle": "Main Data Circle",
    "data_circle": "Main Data Circle",
    "data-circle-party": "Mini Data Circles",
    "party-data-circle": "Mini Data Circles",
    "data-circle-aggregate": "Mini Data Circles",
    "mini-data-circle": "Mini Data Circles",
    "party-dock": "Party dock",
    "party-slot": "Party dock",
    "party-summary": "Party / aggregate view",
    "party-view": "Party / aggregate view",
    "aggregate-view": "Party / aggregate view",
    "party-aggregate": "Party / aggregate view",
    "saved-build-panel": "Saved-build panel",
    "saved-build-card": "Saved-build panel",
    "process-panel": "Process / history panel",
    "process-spiral": "Process / history panel",
    "process-spiral-expanded": "Process / history panel",
    "process-spiral-compact": "Process / history panel",
    "process-node": "Process / history panel",
    "evaluation-panel": "Evaluation / simulator panel",
    "simulator-panel": "Evaluation / simulator panel",
    "workspace-header-actions": "Navigation / header",
    "planner-tabs": "Navigation / header",
    "focus-selector": "Navigation / header",
    "visualisation-panel": "Other planning UI",
    "visualization-panel": "Other planning UI",
}


TAB_VIEW_LABELS = {
    "character": "Character tab",
    "character-tab": "Character tab",
    "class-scores": "Class & scores tab",
    "class-scores-tab": "Class & scores tab",
    "spells-abilities": "Actions, spells & passives tab",
    "spells-abilities-tab": "Actions, spells & passives tab",
    "actions-passives": "Actions, spells & passives tab",
    "actions-passives-tab": "Actions, spells & passives tab",
    "process-spiral": "Process / history panel",
    "process-spiral-expanded": "Process / history panel",
    "process-spiral-compact": "Process / history panel",
    "party": "Party / aggregate view",
    "party-view": "Party / aggregate view",
    "aggregate": "Party / aggregate view",
    "aggregate-view": "Party / aggregate view",
    "saved-builds": "Saved-build panel",
    "saved-build-panel": "Saved-build panel",
    "editor": "Build editor",
    "build-editor": "Build editor",
    "main": "Main Data Circle",
    "data-circle-main": "Main Data Circle",
}


def canonical_key(value) -> str:
    if pd.isna(value) or value is None:
        return ""
    text = str(value).strip()
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", text)
    text = text.replace("_", "-")
    text = re.sub(r"\s+", "-", text)
    return text.lower()


def canonical_interface_region(value) -> str:
    key = canonical_key(value)
    if not key:
        return "Other planning UI"
    if key in RAW_INTERFACE_LABELS:
        return RAW_INTERFACE_LABELS[key]
    title = key.replace("-", " ").title()
    return RAW_INTERFACE_LABELS.get(title, "Other planning UI")


def canonical_tab_or_view(value) -> str:
    key = canonical_key(value)
    if not key:
        return "Other planning UI"
    if key in TAB_VIEW_LABELS:
        return TAB_VIEW_LABELS[key]
    return canonical_interface_region(key)


def prepare_attention(att: pd.DataFrame) -> pd.DataFrame:
    if att.empty:
        return att
    out = att.copy()
    if "region_label" not in out.columns:
        out["region_label"] = out.get("study_region", "").map(canonical_interface_region)
    else:
        out["region_label"] = out["region_label"].map(canonical_interface_region)
    if "element_label" not in out.columns:
        out["element_label"] = out.get("study_element", "").map(canonical_interface_region)
    if "active_view" in out.columns:
        out["active_view_group"] = out["active_view"].map(canonical_tab_or_view)
    else:
        out["active_view_group"] = "Other planning UI"
    out["interface_group"] = np.where(
        out["region_label"].eq("Other planning UI"),
        out["active_view_group"],
        out["region_label"],
    )
    out["attention_context"] = np.where(
        out["interface_group"].isin(REGION_COLORS),
        "Planning interface",
        out.get("attention_context", "Other / uncategorized"),
    )
    out["interaction_weight"] = pd.to_numeric(out.get("interaction_weight", 0), errors="coerce").fillna(0)
    return out

def semantic_attention_region(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    text = str(value).strip().lower()
    if not text:
        return None

    if any(k in text for k in [
        "other planning ui", "other ui", "uncategorized", "unknown",
        "visualisation-panel", "visualization-panel",
    ]):
        return None

    if any(k in text for k in [
        "saved-build", "saved build", "search builds", "saved-build panel",
    ]):
        return "Saved builds"

    if any(k in text for k in [
        "process", "history", "spiral",
    ]):
        return "Process / history"

    if any(k in text for k in [
        "simulate", "simulator", "evaluation",
    ]):
        return "Simulation / evaluation"

    if any(k in text for k in [
        "mini data circles", "mini-data-circle", "mini circle",
        "data-circle-party", "data-circle-aggregate",
    ]):
        return "Party circles"

    if any(k in text for k in [
        "party dock", "party / aggregate", "party view", "party summary",
        "aggregate view", "aggregate-view", "party slot", "focus selector",
    ]):
        return "Party view"

    if any(k in text for k in [
        "main data circle", "main-data-circle", "data-circle-main",
        "focus circle", "data circle",
    ]):
        return "Main Data Circle"

    return "Build planner"


def prepare_semantic_attention(att: pd.DataFrame) -> pd.DataFrame:
    if att.empty:
        return att.copy()

    d = prepare_attention(att).copy()

    if "interface_group" in d.columns:
        source = d["interface_group"]
    elif "region_label" in d.columns:
        source = d["region_label"]
    else:
        source = pd.Series([""], index=d.index)

    d["semantic_region"] = source.map(semantic_attention_region)
    d = d[d["semantic_region"].notna()].copy()
    d = d[d["attention_context"] == "Planning interface"].copy()

    d["interaction_weight"] = pd.to_numeric(
        d.get("interaction_weight", 0), errors="coerce"
    ).fillna(0)

    return d
def prepare_events(events: pd.DataFrame) -> pd.DataFrame:
    if events.empty:
        return events
    out = events.copy()
    if "active_view" in out.columns:
        out["view_group"] = out["active_view"].map(canonical_tab_or_view)
    else:
        out["view_group"] = "Other planning UI"
    return out


def ordered_pid_index(pids: list[str]) -> list[str]:
    return sorted([p for p in pids if pd.notna(p)], key=pid_key)


def fig26_edit_composition_new(edits: pd.DataFrame) -> None:
    counts = (edits.groupby(["pid", "field_category"]).size()
              .unstack(fill_value=0))

    order = [c for c in EDIT_CATEGORY_COLORS if c in counts.columns] + \
            [c for c in counts.columns if c not in EDIT_CATEGORY_COLORS]

    counts = counts.reindex(columns=order, fill_value=0)
    pids = ordered_pid_index(counts.index.tolist())
    counts = counts.reindex(index=pids, fill_value=0)

    totals = counts.sum(axis=1)
    props = counts.div(totals.replace(0, np.nan), axis=0).fillna(0)

    fig = new_fig(
        11.4,
        participant_fig_height(len(props), minimum=8.0),
        caption_lines=2,
        left=0.08,
        right=0.95,
        bottom_extra=0.08,
    )
    gs = fig.add_gridspec(1, 2, width_ratios=[8.8, 1.6], wspace=0.08)
    ax = fig.add_subplot(gs[0, 0])
    ax2 = fig.add_subplot(gs[0, 1], sharey=ax)

    vmax = max(0.35, float(props.to_numpy().max()))
    im = ax.imshow(
        props.to_numpy(),
        aspect="auto",
        cmap=CMAP_ATTN,
        vmin=0,
        vmax=vmax,
    )

    ax.set_xticks(range(len(props.columns)))
    ax.set_xticklabels(
        [wrap(c, 13) for c in props.columns],
        rotation=35,
        ha="right",
        fontsize=8,
    )
    ax.set_yticks(range(len(props.index)))
    ax.set_yticklabels(props.index, fontsize=8.5)
    ax.grid(False)

    for j, col in enumerate(props.columns):
        ax.add_patch(Rectangle(
            (j - 0.5, -0.65),
            1.0,
            0.16,
            facecolor=EDIT_HEATMAP_CATEGORY_COLORS.get(col, TAN),
            edgecolor=WHITE,
            lw=0.0,
            clip_on=False,
        ))

    for i in range(props.shape[0]):
        for j in range(props.shape[1]):
            v = props.iloc[i, j]
            if v >= 0.06:
                ax.text(
                    j, i, f"{v:.0%}",
                    ha="center",
                    va="center",
                    fontsize=7.5,
                    color=WHITE if v > vmax * 0.55 else INK,
                )

    for spine in ax.spines.values():
        spine.set_color(GOLD)

    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Edit share within participant", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    ax2.barh(
        range(len(totals)),
        totals.to_numpy(),
        color=GOLD_BRIGHT,
        edgecolor=INK,
        linewidth=0.4,
        height=0.72,
    )
    ax2.set_yticks(range(len(totals)))
    ax2.tick_params(labelleft=False)
    ax2.set_xlabel("Total edits")
    style_axes(ax2)
    ax2.grid(axis="y", visible=False)
    apply_top_down_pid_axis(ax2)

    finish(
        fig, OUT_DIR / "026_build_edit_composition.png",
        "What participants edited",
        "Each row is one participant. Cells show edit shares; side bars show total edits.",
        "Darker cells mean a larger share of that participant's edits. Values show relative focus,\n"
        "not who edited the most overall.",
    )


def fig01_sample_quality(combined: pd.DataFrame) -> None:
    d = by_pid(combined)
    y = np.arange(len(d))[::-1]

    fig = new_fig(10.5, participant_fig_height(len(d), minimum=7.4), caption_lines=2, left=0.07)
    gs = fig.add_gridspec(1, 2, width_ratios=[4.4, 1.2], wspace=0.05)
    ax = fig.add_subplot(gs[0, 0])
    ax2 = fig.add_subplot(gs[0, 1], sharey=ax)

    total = pd.to_numeric(d["session_duration_min"], errors="coerce")
    active = pd.to_numeric(d["active_duration_min"], errors="coerce")

    ax.barh(y, total, color=GOLD_PALE, height=0.66, label="Total session")
    ax.barh(y, active, color=GOLD, height=0.66, label="Active interaction")
    med = active.median()
    ax.axvline(med, color=INK, lw=1.1, ls="--")
    ax.text(med + 2, -0.4, f"median {med:.0f} min", fontsize=8.5, color=INK,
            va="center")
    ax.set_yticks(y)
    ax.set_yticklabels(d["pid"])
    ax.set_xlabel("Minutes")
    ax.legend(loc="lower right")
    style_axes(ax)

    checks = [("Log", pd.Series(True, index=d.index)),
              ("Survey", d["post_task_survey_completed"].astype(bool)),
              ("Party 4/4", d["final_party_complete"].astype(bool))]
    for j, (_, series) in enumerate(checks):
        for yi, ok in zip(y, series):
            ax2.scatter(j, yi, marker="o" if ok else "x", s=46,
                        color=MOSS if ok else BLOOD, linewidth=0.5, zorder=3)
    ax2.set_xlim(-0.5, 2.5)
    ax2.set_xticks(range(3))
    ax2.set_xticklabels([c[0] for c in checks], fontsize=8.5)
    ax2.xaxis.tick_top()
    ax2.grid(False)
    ax2.tick_params(left=False, labelleft=False)
    for spine in ax2.spines.values():
        spine.set_visible(False)

    finish(
        fig, OUT_DIR / "01_sample_and_data_quality.png",
        "Sample and data checks",
        "Active time and total session time, with log, survey, and final-party checks.",
        f"Rows use the fixed {participant_range_label()} order. Durations show time with the task,\n"
        "not build quality or performance.")


def fig02_background(combined: pd.DataFrame) -> None:
    items = [
        ("pre_bg3_familiarity", "Baldur's Gate 3", 3),
        ("pre_dnd_or_rpg_systems_familiarity", "D&D/RPG systems", 3),
        ("pre_build_planning_familiarity", "Build planning", 3),
        ("pre_charts_visual_summaries_familiarity", "Charts and dashboards", 3),
        ("pre_external_resources_frequency", "External resources", 5),
    ]
    d = by_pid(combined)
    y = np.arange(len(d))[::-1]

    fig = new_fig(9.8, participant_fig_height(len(d), minimum=7.2), caption_lines=2, left=0.08)
    ax = fig.add_subplot(111)
    for j, (col, _, smax) in enumerate(items):
        vals = pd.to_numeric(d[col], errors="coerce")
        frac = (vals - 1) / (smax - 1)
        for yi, v, f in zip(y, vals, frac):
            if pd.isna(v):
                ax.text(j, yi, "–", ha="center", va="center", color=INK_FAINT)
                continue
            ax.scatter(j, yi, s=60 + 190 * f, color=CMAP_GOLD(0.25 + 0.65 * f),
                       edgecolor=GOLD, linewidth=0.7, zorder=3)
            ax.text(j, yi, f"{v:.0f}", ha="center", va="center", fontsize=6.6,
                    color=WHITE if f > 0.55 else INK, zorder=4)
    ax.set_xticks(range(len(items)))
    ax.set_xticklabels([wrap(lbl, 14) for _, lbl, _ in items], fontsize=9)
    ax.set_yticks(y)
    ax.set_yticklabels(d["pid"])
    ax.set_xlim(-0.6, len(items) - 0.4)
    ax.set_ylim(-0.8, len(d) - 0.2)
    ax.grid(axis="x", alpha=0)
    style_axes(ax)

    finish(
        fig, OUT_DIR / "02_participant_background_profiles.png",
        "Participant background",
        "Familiarity ratings and external-resource use before the task. Larger, darker markers mean higher values.",
        "Columns use different scales, so compare values within a column only. These values give context\n"
        "for the results; they were not used to exclude participants.")


def fig03_pre_priorities(pre_counts: pd.DataFrame) -> None:
    d = pre_counts.sort_values("count_selected")
    y = np.arange(len(d))

    fig = new_fig(9.3, 5.9, caption_lines=2, left=0.24, bottom_extra=0.02)
    ax = fig.add_subplot(111)
    ax.hlines(y, 0, d["count_selected"], color=GOLD_BRIGHT, lw=1.4, zorder=2)
    ax.scatter(d["count_selected"], y, s=120, color=GOLD, edgecolor=INK,
               linewidth=0.6, zorder=3)
    for yi, (cnt, prop) in enumerate(zip(d["count_selected"],
                                         d["proportion_selected"])):
        ax.text(cnt + 0.45, yi, f"{cnt:.0f} ({prop:.0%})", va="center",
                fontsize=8.5, color=INK_SOFT)
    ax.set_yticks(y)
    ax.set_yticklabels(d["label"])
    ax.set_xlim(0, d["count_selected"].max() * 1.32)
    ax.set_xlabel(f"Participants selecting priority ({of_n()})")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "03_pre_task_build_priorities.png",
        "Pre-task build priorities",
        "Participants could choose more than one priority before starting the task.",
        "These responses show what participants cared about before using the tool.")


def fig04_timeline(timeline: pd.DataFrame) -> None:

    totals_by_family = (
        timeline.groupby("event_family")["count"]
        .sum()
        .sort_values(ascending=True)
    )

    fam = totals_by_family.index.tolist()

    agg = (
        timeline.groupby(["time_bin_min", "event_family"])["count"]
        .sum()
        .unstack(fill_value=0)
        .reindex(columns=fam, fill_value=0)
        .sort_index()
    )

    if agg.empty:
        return

    fig = new_fig(
        11.5,
        6.6,
        caption_lines=2,
        left=0.08,
        right=0.78,
        bottom_extra=0.04,
    )
    ax = fig.add_subplot(111)

    x = agg.index.to_numpy()
    bottom = np.zeros(len(agg))

    for family in fam:
        values = agg[family].to_numpy()
        top = bottom + values

        is_friction = family == "Friction or blocked action"

        ax.fill_between(
            x,
            bottom,
            top,
            color=FAMILY_COLORS.get(family, TAN),
            alpha=0.62 if is_friction else 0.90,
            edgecolor=WHITE,
            linewidth=0.45,
            label=family,
        )

        if is_friction:
            ax.plot(
                x,
                top,
                color=FAMILY_COLORS.get(family, BLOOD),
                linewidth=1.4,
                alpha=0.95,
            )

        bottom = top

    ax.set_xlabel("Minutes since session start")
    ax.set_ylabel("Planning events per 5-minute bin")
    ax.set_xlim(0, agg.index.max())
    ax.set_ylim(bottom=0)

    ax.legend(
        loc="center left",
        bbox_to_anchor=(1.02, 0.5),
        ncol=1,
        fontsize=8,
        title="Event family",
        title_fontsize=8.5,
        borderaxespad=0.0,
    )

    style_axes(ax)

    finish(
        fig,
        OUT_DIR / "04_planning_activity_timeline.png",
        "Planning activity over time",
        "Stacked counts of planning actions in 5-minute bins. Event families are ordered from lowest to highest total count.",
        "The chart shows when actions happened, not how important they were. Pointer movement, survey, and tutorial events are excluded.",
    )
def fig05_timeline_small_multiples(timeline: pd.DataFrame) -> None:
    fam = (
    timeline.groupby("event_family")["count"]
    .sum()
    .sort_values(ascending=True)
    .index
    .tolist()
)
    pids = sorted(timeline["pid"].unique(), key=pid_key)

    ncols, nrows = 5, int(np.ceil(len(pids) / 5))
    fig = new_fig(12.5, 2.1 * nrows + 2.4, caption_lines=2)
    axes = fig.subplots(nrows, ncols)
    for ax in np.ravel(axes):
        ax.set_visible(False)
    for i, pid in enumerate(pids):
        ax = np.ravel(axes)[i]
        ax.set_visible(True)
        pv = (timeline[timeline["pid"] == pid]
              .groupby(["time_bin_min", "event_family"])["count"].sum()
              .unstack(fill_value=0).reindex(columns=fam, fill_value=0)
              .sort_index())
        if pv.empty:
            continue
        ax.stackplot(pv.index, [pv[c] for c in fam],
                     colors=[FAMILY_COLORS[c] for c in fam], alpha=0.95,
                     linewidth=0)
        ax.set_title(pid, fontsize=9, pad=2, loc="left", color=INK)
        ax.grid(False)
        ax.tick_params(labelsize=6.5, length=2)
        for spine in ax.spines.values():
            spine.set_color(GOLD_BRIGHT)
            spine.set_linewidth(0.6)

    handles = [Rectangle((0, 0), 1, 1, color=FAMILY_COLORS[f]) for f in fam]
    fig.legend(handles, fam, loc="lower center", ncol=4, fontsize=8,
               bbox_to_anchor=(0.5, 0.075))
    fig.subplots_adjust(hspace=0.55, wspace=0.30, bottom=0.165)

    finish(
        fig, OUT_DIR / "05_session_timelines_per_participant.png",
        "Session timelines by participant",
        "One timeline per participant. Each panel uses its own y-axis.",
        "Panels show the shape of each session, not total volume. They show editing, inspection,\n"
        "short focused periods, and friction episodes.")


def fig06_behaviour_matrix(combined: pd.DataFrame) -> None:
    metrics = {
        "active_duration_min": "Active minutes",
        "build_edit_count": "Build edits",
        "unique_build_states_from_edits": "Unique build states",
        "visual_profile_changing_edit_count": "Profile-changing edits",
        "saved_build_created_count": "Saved builds",
        "saved_build_loaded_count": "Builds revisited",
        "party_slot_assigned_count": "Party assignments",
        "unique_party_snapshots": "Unique party states",
        "unique_focus_keys": "Data Circle concepts",
        "data_circle_total_dwell_sec": "Data Circle dwell (s)",
        "tooltip_open_count": "Tooltips opened",
        "edits_after_visualization_60s": "Edits after inspection",
        "party_gap_response_unique_edit_count": "Edits after gap alert",
        "friction_event_count": "Friction events",
    }
    cols = [c for c in metrics if c in combined.columns]
    d = by_pid(combined)
    vals = d[cols].apply(pd.to_numeric, errors="coerce")
    z = ((vals - vals.mean()) / vals.std(ddof=1).replace(0, np.nan))
    z = z.fillna(0).clip(-2.5, 2.5)

    fig = new_fig(11.8, participant_fig_height(len(d), minimum=8.3), caption_lines=2, left=0.07, bottom_extra=0.05)
    ax = fig.add_subplot(111)
    im = ax.imshow(z.to_numpy(), aspect="auto", cmap=CMAP_ROLES,
                   vmin=-2.5, vmax=2.5)
    ax.set_xticks(range(len(cols)))
    ax.set_xticklabels([wrap(metrics[c], 13) for c in cols], rotation=45,
                       ha="right", fontsize=8)
    ax.set_yticks(range(len(d)))
    ax.set_yticklabels(d["pid"], fontsize=8.5)
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Compared with sample average", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "06_behaviour_profile_matrix.png",
        "Behavior profiles across participants",
        "Each value is compared with the sample average. Rows use the fixed participant order.",
        "Warm cells are above the sample average, and cool cells are below it. Counts show interaction\n"
        "activity, not decision quality.")


def fig07_edit_composition(edits: pd.DataFrame) -> None:
    counts = (edits.groupby(["pid", "field_category"]).size()
              .unstack(fill_value=0))
    order = [c for c in EDIT_CATEGORY_COLORS if c in counts.columns] + \
            [c for c in counts.columns if c not in EDIT_CATEGORY_COLORS]
    counts = counts.reindex(columns=order, fill_value=0)
    totals = counts.sum(axis=1)
    props = counts.div(totals, axis=0)
    props = props.loc[sorted(props.index, key=pid_key)]
    totals = totals.loc[props.index]

    fig = new_fig(10.8, participant_fig_height(len(props), minimum=7.8), caption_lines=2, left=0.07, right=0.93,
                  bottom_extra=0.06)
    ax = fig.add_subplot(111)
    left = np.zeros(len(props))
    for cat in props.columns:
        v = props[cat].to_numpy()
        ax.barh(props.index, v, left=left, height=0.72,
                color=EDIT_CATEGORY_COLORS.get(cat, TAN), label=cat,
                edgecolor=WHITE, linewidth=0.4)
        left += v
    for yi, tot in enumerate(totals):
        ax.text(1.012, yi, f"{int(tot)}", va="center", fontsize=7.5,
                color=INK_SOFT, transform=ax.get_yaxis_transform())
    ax.set_xlim(0, 1)
    ax.set_xlabel("Share of build edits (total at right)")
    apply_top_down_pid_axis(ax)
    ax.legend(ncol=5, loc="upper center", bbox_to_anchor=(0.5, -0.10),
              fontsize=8, columnspacing=1.1, handlelength=1.3)
    style_axes(ax)

    finish(
        fig, OUT_DIR / "07_build_edit_composition.png",
        "What participants edited",
        "Share of each participant's build edits by field category.",
        "Bars show shares within each participant. The number at the right shows that participant's total edits.")


def fig08_interface_zone_attention(att: pd.DataFrame) -> None:
    d = prepare_attention(att)
    d = d[d["attention_context"] == "Planning interface"].copy()
    if d.empty:
        return

    pids = ordered_pid_index(d["pid"].unique().tolist())
    order = [r for r in REGION_COLORS if r in set(d["interface_group"])]
    weights = (d.groupby(["pid", "interface_group"])["interaction_weight"].sum()
               .unstack(fill_value=0)
               .reindex(index=pids, columns=order, fill_value=0))
    shares = weights.div(weights.sum(axis=1), axis=0).fillna(0)

    fig = new_fig(11.8, participant_fig_height(len(shares), minimum=8.4), caption_lines=2, left=0.08, bottom_extra=0.075)
    ax = fig.add_subplot(111)
    y = np.arange(len(shares))
    left = np.zeros(len(shares))
    for region in shares.columns:
        values = shares[region].to_numpy()
        ax.barh(y, values, left=left, height=0.74,
                color=REGION_COLORS.get(region, TAN),
                edgecolor=WHITE, linewidth=0.4, label=region)
        left += values

    ax.set_yticks(y)
    ax.set_yticklabels(shares.index, fontsize=8.5)
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
    ax.set_xlabel("Share of planning click/dwell activity")
    ax.legend(ncol=4, loc="upper center", bbox_to_anchor=(0.5, -0.10),
              fontsize=7.5, columnspacing=0.9, handlelength=1.1)
    apply_top_down_pid_axis(ax)
    style_axes(ax)

    finish(
        fig, OUT_DIR / "08_interface_zone_attention.png",
        "Planning attention by tool area",
        "Click and dwell activity split by main tool area. Survey and tutorial interactions are excluded.",
        f"Rows use the fixed {participant_range_label()} order. The process/history area and the actions, spells,\n"
        "and passives tab are shown separately.")


def fig09_tab_transition_matrix(events: pd.DataFrame) -> None:
    d = prepare_events(events)
    if d.empty or "pid" not in d.columns or "elapsed_ms" not in d.columns:
        return

    d["elapsed_ms"] = pd.to_numeric(d["elapsed_ms"], errors="coerce")
    d = d.dropna(subset=["elapsed_ms", "view_group"])
    d = d[d["view_group"].isin(REGION_COLORS)]
    if d.empty:
        return

    transitions = []
    for pid, g in d.sort_values(["pid", "elapsed_ms", "sequence_number"],
                                kind="stable").groupby("pid"):
        views = g["view_group"].tolist()
        last = None
        for view in views:
            if last is not None and view != last:
                transitions.append({"pid": pid, "from": last, "to": view})
            last = view

    t = pd.DataFrame(transitions)
    if t.empty:
        return

    labels = [r for r in REGION_COLORS if r in set(t["from"]) or r in set(t["to"])]
    mat = (t.groupby(["from", "to"]).size().unstack(fill_value=0)
           .reindex(index=labels, columns=labels, fill_value=0))

    fig = new_fig(11.0, 9.2, caption_lines=2, left=0.20, bottom_extra=0.06)
    ax = fig.add_subplot(111)
    vmax = max(1, float(mat.to_numpy().max()))
    im = ax.imshow(mat.to_numpy(), cmap=CMAP_GOLD, vmin=0, vmax=vmax)
    for i in range(mat.shape[0]):
        for j in range(mat.shape[1]):
            v = mat.iloc[i, j]
            if v:
                ax.text(j, i, f"{int(v)}", ha="center", va="center",
                        fontsize=7.5, color=WHITE if v / vmax > 0.55 else INK)
            else:
                ax.text(j, i, "·", ha="center", va="center",
                        fontsize=7.5, color=INK_FAINT)

    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels([wrap(x, 14) for x in labels], rotation=40,
                       ha="right", fontsize=8)
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels([wrap(x, 18) for x in labels], fontsize=8)
    ax.set_xlabel("Next tool area")
    ax.set_ylabel("Previous tool area")
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Moves between areas", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "09_interface_transition_matrix.png",
        "Movement between tool areas",
        "Moves between tool areas, based on consecutive logged active views.",
        "This shows the flow of work, not total event volume. Higher counts mean participants often moved\n"
        "between those two areas.")


def fig10_process_history_workflow(events: pd.DataFrame, att: pd.DataFrame) -> None:
    d = prepare_events(events)
    if d.empty or "pid" not in d.columns:
        return

    pids = ordered_pid_index(d["pid"].dropna().unique().tolist())
    rows = []
    action_defs = {
        "History states created": d["event_type"].eq("history_entry_created"),
        "Loaded from history/process": d["event_type"].isin(["build_loaded", "saved_build_loaded"]) & d["view_group"].eq("Process / history panel"),
        "Restored history state": d["event_type"].eq("build_restored_from_history"),
        "Assigned history to party": d["event_type"].eq("party_slot_assigned") & d["view_group"].eq("Process / history panel"),
        "Process view interactions": d["view_group"].eq("Process / history panel"),
    }
    for label, mask in action_defs.items():
        counts = d[mask].groupby("pid").size()
        for pid in pids:
            rows.append({"pid": pid, "action": label, "count": int(counts.get(pid, 0))})

    matrix = (pd.DataFrame(rows).pivot(index="pid", columns="action", values="count")
              .reindex(index=pids, fill_value=0))
    cols = list(action_defs.keys())
    matrix = matrix.reindex(columns=cols, fill_value=0)

    fig = new_fig(11.0, participant_fig_height(len(matrix), minimum=8.0), caption_lines=2, left=0.10, bottom_extra=0.04)
    ax = fig.add_subplot(111)
    vmax = max(1, float(np.nanpercentile(matrix.to_numpy(), 95)))
    im = ax.imshow(matrix.to_numpy(), aspect="auto", cmap=CMAP_GOLD,
                   vmin=0, vmax=vmax)
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            v = matrix.iloc[i, j]
            ax.text(j, i, f"{int(v)}" if v else "–", ha="center", va="center",
                    fontsize=7.8, color=WHITE if v / vmax > 0.55 else INK)
    ax.set_xticks(range(len(cols)))
    ax.set_xticklabels([wrap(c, 16) for c in cols], rotation=35, ha="right")
    ax.set_yticks(range(len(matrix)))
    ax.set_yticklabels(matrix.index)
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Count", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "10_process_history_workflow.png",
        "Process and history use",
        "Counts of history and process-panel actions per participant.",
        "This shows whether participants used the process view to inspect, reload, restore, or assign earlier builds.")


def fig11_saved_build_party_workflow(events: pd.DataFrame) -> None:
    d = prepare_events(events)
    if d.empty or "pid" not in d.columns:
        return
    pids = ordered_pid_index(d["pid"].dropna().unique().tolist())

    action_defs = {
        "Saved build created": ["build_saved", "saved_build_created"],
        "Saved build loaded": ["build_loaded", "saved_build_loaded"],
        "Saved build overwritten": ["build_overwritten"],
        "Saved build deleted": ["build_deleted", "saved_build_deleted"],
        "Sent to party": ["saved_build_send_to_party_clicked"],
        "Party slot assigned": ["party_slot_assigned"],
        "Party slot cleared": ["party_slot_cleared"],
    }
    rows = []
    for label, types in action_defs.items():
        counts = d[d["event_type"].isin(types)].groupby("pid").size()
        for pid in pids:
            rows.append({"pid": pid, "action": label, "count": int(counts.get(pid, 0))})

    matrix = (pd.DataFrame(rows).pivot(index="pid", columns="action", values="count")
              .reindex(index=pids, columns=list(action_defs), fill_value=0))

    fig = new_fig(11.4, participant_fig_height(len(matrix), minimum=8.2), caption_lines=2, left=0.10, bottom_extra=0.05)
    ax = fig.add_subplot(111)
    vmax = max(1, float(np.nanpercentile(matrix.to_numpy(), 95)))
    im = ax.imshow(matrix.to_numpy(), aspect="auto", cmap=CMAP_GOLD,
                   vmin=0, vmax=vmax)
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            v = matrix.iloc[i, j]
            ax.text(j, i, f"{int(v)}" if v else "–", ha="center", va="center",
                    fontsize=7.8, color=WHITE if v / vmax > 0.55 else INK)
    ax.set_xticks(range(matrix.shape[1]))
    ax.set_xticklabels([wrap(c, 15) for c in matrix.columns],
                       rotation=35, ha="right")
    ax.set_yticks(range(matrix.shape[0]))
    ax.set_yticklabels(matrix.index)
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Count", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "11_saved_build_party_workflow.png",
        "Saved builds and party setup",
        "Counts of saved-build and party setup actions per participant.",
        "These actions show how participants saved builds, returned to them, and placed them in the party.")

def fig12_actions_spells_passives_detail(edits: pd.DataFrame, att: pd.DataFrame) -> None:
    if edits.empty:
        return

    pids = ordered_pid_index(edits["pid"].dropna().unique().tolist())
    edit_counts = edits.groupby(["pid", "field_category"]).size().unstack(fill_value=0)
    edit_counts = edit_counts.reindex(index=pids, fill_value=0)
    edit_totals = edit_counts.sum(axis=1).replace(0, np.nan)

    data = pd.DataFrame(index=pids)
    data["Spell edit share"] = edit_counts.get("Spells", 0) / edit_totals

    a = prepare_attention(att)
    if not a.empty:
        planning = a[a["attention_context"] == "Planning interface"].copy()
        total_attention = planning.groupby("pid")["interaction_weight"].sum().replace(0, np.nan)
        actions_attention = (
            planning[planning["interface_group"].eq("Actions, spells & passives tab")]
            .groupby("pid")["interaction_weight"]
            .sum()
        )
        data["Actions tab activity share"] = (
            actions_attention.reindex(pids, fill_value=0) / total_attention.reindex(pids)
        )
    else:
        data["Actions tab activity share"] = np.nan

    data = data.fillna(0)

    fig = new_fig(
        10.8,
        participant_fig_height(len(data), minimum=8.0),
        caption_lines=2,
        left=0.11,
        bottom_extra=0.04,
    )
    ax = fig.add_subplot(111)

    im = ax.imshow(data.to_numpy(), aspect="auto", cmap=CMAP_GOLD, vmin=0, vmax=1)

    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            v = data.iloc[i, j]
            ax.text(
                j,
                i,
                f"{v:.0%}" if v else "–",
                ha="center",
                va="center",
                fontsize=8.2,
                color=WHITE if v > 0.55 else INK,
            )

    ax.set_xticks(range(data.shape[1]))
    ax.set_xticklabels(
        [wrap(c, 18) for c in data.columns],
        rotation=25,
        ha="right",
    )
    ax.set_yticks(range(data.shape[0]))
    ax.set_yticklabels(data.index)
    ax.grid(False)

    for spine in ax.spines.values():
        spine.set_color(GOLD)

    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Share", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig,
        OUT_DIR / "12_actions_spells_passives_detail.png",
        "Spell edits and actions-tab activity",
        "Each participant's spell-edit share and activity share in the actions, spells, and passives tab.",
        "The tab includes spells, class features, passives, icons, tooltips, and descriptions.\n"
        "Values are shares within each participant, not total activity.",
    )
def fig13_feature_supported_revision_matrix(followup: pd.DataFrame,
                                            events: pd.DataFrame) -> None:
    rows = []

    if not followup.empty and {"trigger_event_type", "edit_field_category"}.issubset(followup.columns):
        f = followup.copy()
        f["trigger_group"] = f["trigger_event_type"].map(lambda x: (
            "Data Circle inspection" if str(x).startswith("data_circle") or "highlight" in str(x)
            else "Simulator/evaluation" if "evaluation" in str(x) or "simulator" in str(x)
            else str(x)
        ))
        f["edit_group"] = f["edit_field_category"].fillna("Unknown")
        rows.append(f[["trigger_group", "edit_group"]])

    if not events.empty and "event_type" in events.columns:
        e = events.copy()
        explicit = {
            "data_circle_focus_to_action": "Data Circle focus-to-action",
            "party_gap_response_edit": "Party gap response",
            "aggregate_to_member_revision": "Aggregate-to-member revision",
            "post_evaluation_edit": "Post-evaluation edit",
        }
        e = e[e["event_type"].isin(explicit)]
        if not e.empty:
            rows.append(pd.DataFrame({
                "trigger_group": e["event_type"].map(explicit),
                "edit_group": "Logged linked action",
            }))

    if not rows:
        return

    d = pd.concat(rows, ignore_index=True)
    if d.empty:
        return

    trigger_order = [
        "Data Circle inspection",
        "Data Circle focus-to-action",
        "Party gap response",
        "Aggregate-to-member revision",
        "Simulator/evaluation",
        "Post-evaluation edit",
    ]
    edit_order = [
        "Class/level", "Spells", "Actions/features", "Ability scores", "Feats",
        "Skills", "Identity/background", "Logged linked action", "Other", "Unknown",
    ]

    mat = (d.groupby(["trigger_group", "edit_group"]).size().unstack(fill_value=0))
    mat = mat.reindex(
        index=[x for x in trigger_order if x in mat.index] + [x for x in mat.index if x not in trigger_order],
        columns=[x for x in edit_order if x in mat.columns] + [x for x in mat.columns if x not in edit_order],
        fill_value=0,
    )

    fig = new_fig(11.2, 6.8, caption_lines=2, left=0.22, bottom_extra=0.04)
    ax = fig.add_subplot(111)
    vmax = max(1, float(mat.to_numpy().max()))
    im = ax.imshow(mat.to_numpy(), aspect="auto", cmap=CMAP_TEAL, vmin=0, vmax=vmax)
    for i in range(mat.shape[0]):
        for j in range(mat.shape[1]):
            v = mat.iloc[i, j]
            ax.text(j, i, f"{int(v)}" if v else "·", ha="center", va="center",
                    fontsize=8, color=WHITE if v / vmax > 0.55 else INK)
    ax.set_xticks(range(mat.shape[1]))
    ax.set_xticklabels([wrap(c, 13) for c in mat.columns], rotation=35, ha="right")
    ax.set_yticks(range(mat.shape[0]))
    ax.set_yticklabels([wrap(c, 26) for c in mat.index])
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(TEAL)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Linked or follow-up edits", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "13_feature_supported_revision_matrix.png",
        "Feature-linked edits",
        "Edits that happened after, or were directly linked to, tool features.",
        "Counts show close timing or direct logged links. They do not prove why a participant made an edit.")


def concept_color(layer: str, label: str) -> str:
    if layer == "damage-types" and label in DAMAGE_TYPE_COLORS:
        return DAMAGE_TYPE_COLORS[label]
    if layer == "roles-utility":
        key = label.lower().replace(" ", "-")
        if key in ("damage",):
            return EMBER
        if key in ("utility",):
            return TEAL
        for role, color in ROLE_COLORS.items():
            if ROLE_LABELS[role].lower().startswith(label.lower()[:6]) or \
               role.startswith(key):
                return color
        return TEAL
    return FOCUS_LAYER_COLORS.get(layer, TAN)
def fig08_data_circle_concepts(focus: pd.DataFrame) -> None:
    if focus.empty:
        return

    d = focus.dropna(subset=["focus_layer", "focus_key"]).copy()
    d["label"] = d["focus_label"].fillna(d["focus_key"]).astype(str)

    grouped = (d.groupby(["focus_layer", "label"])
               .agg(participants=("participant_id", "nunique"),
                    events=("event_type", "size"))
               .reset_index())

    rows = []

    for _, row in grouped.iterrows():
        rows.append({
            "focus_layer": row["focus_layer"],
            "label": row["label"],
            "participants": int(row["participants"]),
            "events": int(row["events"]),
        })

    existing_damage_labels = set(
        grouped[grouped["focus_layer"] == "damage-types"]["label"].astype(str)
    )

    for damage_type in DAMAGE_TYPE_COLORS:
        if damage_type not in existing_damage_labels:
            rows.append({
                "focus_layer": "damage-types",
                "label": damage_type,
                "participants": 0,
                "events": 0,
            })

    summary = pd.DataFrame(rows)

    layer_order = ["range", "roles-utility", "damage-types", "ability"]
    summary["layer_order"] = summary["focus_layer"].map(
        {layer: i for i, layer in enumerate(layer_order)}
    ).fillna(99)

    damage_order = {name: i for i, name in enumerate(DAMAGE_TYPE_COLORS)}

    def concept_sort_key(row):
        if row["focus_layer"] == "damage-types":
            return damage_order.get(row["label"], 999)
        return -row["participants"] * 100000 - row["events"]

    summary["concept_order"] = summary.apply(concept_sort_key, axis=1)

    summary = summary.sort_values(
        ["layer_order", "concept_order", "label"],
        ascending=[True, True, True]
    ).reset_index(drop=True)

    fig_height = max(8.0, 0.34 * len(summary) + 2.8)

    fig = new_fig(
        11.4,
        fig_height,
        caption_lines=2,
        left=0.25,
        bottom_extra=0.025,
    )
    ax = fig.add_subplot(111)

    y = np.arange(len(summary))

    colors = [
        concept_color(row["focus_layer"], row["label"])
        for _, row in summary.iterrows()
    ]

    ax.barh(
        y,
        summary["participants"],
        height=0.72,
        color=colors,
        edgecolor=INK,
        linewidth=0.4,
    )

    layer_starts = summary.groupby("focus_layer", sort=False).head(1).index.tolist()
    for idx in layer_starts:
        if idx > 0:
            ax.axhline(idx - 0.5, color=GRID, lw=1.0)

    for layer, group in summary.groupby("focus_layer", sort=False):
        mid = (group.index.min() + group.index.max()) / 2
        ax.text(
            -0.13,
            mid,
            FOCUS_LAYER_NAMES.get(layer, layer),
            transform=ax.get_yaxis_transform(),
            ha="right",
            va="center",
            fontsize=8.5,
            color=FOCUS_LAYER_COLORS.get(layer, INK_SOFT),
            fontweight="bold",
        )

    for yi, (_, row) in enumerate(summary.iterrows()):
        p = int(row["participants"])
        e = int(row["events"])

        label_text = f"{p}"
        if e > 0:
            label_text += f" ({e})"

        ax.text(
            p + 0.25,
            yi,
            label_text,
            va="center",
            fontsize=7.8,
            color=INK_SOFT,
        )

    ax.set_yticks(y)
    ax.set_yticklabels(summary["label"], fontsize=8.5)
    ax.invert_yaxis()

    ax.set_xlabel(f"Participants who used the concept at least once ({of_n()}; events in parentheses)")
    ax.set_xlim(0, max(study_n() + 2, int(summary["participants"].max()) + 2))

    handles = [
        Rectangle((0, 0), 1, 1, color=FOCUS_LAYER_COLORS[k])
        for k in FOCUS_LAYER_COLORS
        if k in set(summary["focus_layer"])
    ]
    labels = [
        FOCUS_LAYER_NAMES[k]
        for k in FOCUS_LAYER_COLORS
        if k in set(summary["focus_layer"])
    ]

    if handles:
        ax.legend(
            handles,
            labels,
            loc="lower right",
            fontsize=8,
        )

    style_axes(ax)

    finish(
        fig,
        OUT_DIR / "08_data_circle_concepts_inspected.png",
        "Data Circle concepts used",
        "Participants who used each Data Circle concept. Damage types with no use are still shown.",
        "A concept counts when it was selected, focused, or hovered long enough to record dwell.\n"
        "Numbers show participants first, with event counts in parentheses.",
    )
def fig27_attention_shares(att: pd.DataFrame) -> None:
    d = prepare_semantic_attention(att)

    if d.empty:
        return

    pids = ordered_pid_index(d["pid"].dropna().unique().tolist())
    order = [r for r in ATTENTION_REGION_COLORS
             if r in set(d["semantic_region"])]

    w = (d.groupby(["pid", "semantic_region"])["interaction_weight"].sum()
         .unstack(fill_value=0)
         .reindex(index=pids, columns=order, fill_value=0))

    shares = w.div(w.sum(axis=1).replace(0, np.nan), axis=0).fillna(0)
    mean_share = shares.mean(axis=0).sort_values(ascending=False)

    fig = new_fig(
        11.6,
        participant_fig_height(len(shares), minimum=8.4),
        caption_lines=2,
        left=0.09,
        right=0.95,
        bottom_extra=0.08,
    )
    gs = fig.add_gridspec(1, 2, width_ratios=[8.8, 2.0], wspace=0.08)
    ax = fig.add_subplot(gs[0, 0])
    ax2 = fig.add_subplot(gs[0, 1])

    vmax = max(0.35, float(shares.to_numpy().max()))
    im = ax.imshow(
        shares.to_numpy(),
        aspect="auto",
        cmap=CMAP_ATTN,
        vmin=0,
        vmax=vmax,
    )

    ax.set_xticks(range(len(shares.columns)))
    ax.set_xticklabels(
        [wrap(c, 14) for c in shares.columns],
        rotation=35,
        ha="right",
        fontsize=8,
    )
    ax.set_yticks(range(len(shares.index)))
    ax.set_yticklabels(shares.index, fontsize=8.5)
    ax.grid(False)

    for j, col in enumerate(shares.columns):
        ax.add_patch(Rectangle(
            (j - 0.5, -0.68),
            1.0,
            0.18,
            facecolor=ATTENTION_REGION_COLORS.get(col, TAN),
            edgecolor=WHITE,
            lw=0.0,
            clip_on=False,
        ))

    for i in range(shares.shape[0]):
        for j in range(shares.shape[1]):
            v = shares.iloc[i, j]
            if v >= 0.07:
                ax.text(
                    j, i, f"{v:.0%}",
                    ha="center",
                    va="center",
                    fontsize=7.4,
                    color=WHITE if v > vmax * 0.55 else INK,
                )

    for spine in ax.spines.values():
        spine.set_color(GOLD)

    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Activity share within participant", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    ax2.barh(
        np.arange(len(mean_share)),
        mean_share.to_numpy(),
        color=[ATTENTION_REGION_COLORS.get(c, TAN) for c in mean_share.index],
        edgecolor=INK,
        linewidth=0.4,
        height=0.72,
    )
    ax2.set_yticks(np.arange(len(mean_share)))
    ax2.set_yticklabels([wrap(c, 11) for c in mean_share.index], fontsize=8)
    ax2.invert_yaxis()
    ax2.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
    ax2.set_xlabel("Mean share")
    style_axes(ax2)
    ax2.grid(axis="y", visible=False)

    finish(
        fig, OUT_DIR / "27_interface_attention_shares.png",
        "Where planning activity happened",
        "Participant-level shares of planning click/dwell activity, with the sample mean at right.",
        "Detailed labels are grouped into broader tool areas. Generic other-UI events are removed\n"
        "so the main planning areas are easier to read.",
    )
def fig09_layer_source_engagement(focus: pd.DataFrame) -> None:
    d = focus.dropna(subset=["focus_layer"]).copy()
    pids = sorted(d["pid"].unique(), key=pid_key)

    layer = (d.groupby(["pid", "focus_layer"]).size().unstack(fill_value=0)
             .reindex(pids))
    layer = layer.reindex(columns=[c for c in FOCUS_LAYER_COLORS
                                   if c in layer.columns], fill_value=0)
    layer_share = layer.div(layer.sum(axis=1), axis=0).fillna(0)

    src = d.copy()
    src["group"] = src["focus_source"].map(FOCUS_SOURCE_GROUPS).fillna("Editable build")
    source = (src.groupby(["pid", "group"]).size().unstack(fill_value=0)
              .reindex(pids))
    source = source.reindex(columns=[c for c in FOCUS_SOURCE_COLORS
                                     if c in source.columns], fill_value=0)
    source_share = source.div(source.sum(axis=1), axis=0).fillna(0)

    fig = new_fig(11.8, participant_fig_height(len(pids), minimum=8.0), caption_lines=2, left=0.07, right=0.97,
                  bottom_extra=0.06)
    axL, axR = fig.subplots(1, 2, sharey=True)
    fig.subplots_adjust(wspace=0.06)

    def stacked(ax, shares, colors):
        left = np.zeros(len(shares))
        for col in shares.columns:
            v = shares[col].to_numpy()
            ax.barh(shares.index, v, left=left, height=0.72, color=colors[col],
                    edgecolor=WHITE, linewidth=0.4)
            left += v
        ax.set_xlim(0, 1)
        ax.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
        style_axes(ax)
        apply_top_down_pid_axis(ax)

    stacked(axL, layer_share, FOCUS_LAYER_COLORS)
    axL.set_title("Layer used", fontsize=10.5, loc="left",
                  color=INK, pad=8)
    axL.legend([Rectangle((0, 0), 1, 1, color=FOCUS_LAYER_COLORS[c])
                for c in layer_share.columns],
               [FOCUS_LAYER_NAMES[c] for c in layer_share.columns],
               ncol=4, loc="upper center", bbox_to_anchor=(0.5, -0.085),
               fontsize=7.5, columnspacing=0.8, handlelength=1.1)

    stacked(axR, source_share, FOCUS_SOURCE_COLORS)
    axR.set_title("Build being inspected", fontsize=10.5, loc="left",
                  color=INK, pad=8)
    axR.legend([Rectangle((0, 0), 1, 1, color=FOCUS_SOURCE_COLORS[c])
                for c in source_share.columns],
               list(source_share.columns),
               ncol=3, loc="upper center", bbox_to_anchor=(0.5, -0.085),
               fontsize=7.5, columnspacing=0.8, handlelength=1.1)

    finish(
        fig, OUT_DIR / "09_data_circle_layer_and_source_use.png",
        "Data Circle layer and source use",
        "Shares of Data Circle focus events by layer and by the build being inspected.",
        "The left panel shows what kind of visual information was used. The right panel shows whether the focus\n"
        "was on the current build, a party member, or the aggregate party.")


def fig10_viz_followup(combined: pd.DataFrame) -> None:
    d = by_pid(combined)
    edits = pd.to_numeric(d["build_edit_count"], errors="coerce")
    f30 = pd.to_numeric(d["edits_after_visualization_30s"], errors="coerce")
    f60 = pd.to_numeric(d["edits_after_visualization_60s"], errors="coerce")
    s60 = (f60 / edits).fillna(0)
    s30 = (f30 / edits).fillna(0)
    y = np.arange(len(d))

    fig = new_fig(10.4, participant_fig_height(len(d), minimum=7.4), caption_lines=2)
    ax = fig.add_subplot(111)
    ax.barh(y, s60, height=0.72, color=TEAL_ACCENT,
            edgecolor=INK, linewidth=0.4, label="within 60 s")
    ax.barh(y, s30, height=0.72, color=TEAL,
            edgecolor=INK, linewidth=0.4, label="within 30 s")
    ax.set_yticks(y)
    ax.set_yticklabels(d["pid"])
    apply_top_down_pid_axis(ax)
    ax.set_xlabel("Share of edits soon after visualization use")
    ax.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
    ax.legend(loc="lower right")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "10_visualization_followed_edits.png",
        "Edits after visualization use",
        "Share of build edits that happened within 30 or 60 seconds after visualization use.",
        "This shows timing only. It does not prove that the visualization caused the edit.")


def fig11_final_party_classes(members: pd.DataFrame) -> None:
    d = members.dropna(subset=["selectedClass"])
    if d.empty:
        return
    n_parties = int(d["pid"].nunique())
    n_slots = int(len(d))
    freq = (d.drop_duplicates(["pid", "selectedClass"])
            .groupby("selectedClass")["pid"].nunique().sort_values())
    slots = d.groupby("selectedClass").size().reindex(freq.index)
    y = np.arange(len(freq))

    fig = new_fig(9.6, 6.4, caption_lines=2, bottom_extra=0.02)
    ax = fig.add_subplot(111)
    ax.barh(y, slots, height=0.72, color=GOLD_PALE, edgecolor=INK,
            linewidth=0.3, label="Party slots filled")
    ax.barh(y, freq, height=0.72, color=GOLD, edgecolor=INK, linewidth=0.4,
            label="Parties including class")
    for yi, (f, s) in enumerate(zip(freq, slots)):
        ax.text(s + 0.15, yi, f"{f:.0f} / {s:.0f}", va="center", fontsize=8,
                color=INK_SOFT)
    ax.set_yticks(y)
    ax.set_yticklabels(freq.index)
    ax.set_xlabel(f"Count across {n_parties} final parties ({n_slots} slots); label: parties / slots")
    ax.set_xlim(0, slots.max() * 1.22)
    ax.legend(loc="lower right")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "11_final_party_class_composition.png",
        "Class composition of final parties",
        f"Darker bars show parties that included the class. Lighter bars show total party slots filled by the class.",
        "The label shows parties including the class / total party slots. Repeated classes increase the slot count.")


def fig12_class_cooccurrence(members: pd.DataFrame) -> None:
    d = members.dropna(subset=["selectedClass"])
    if d.empty:
        return
    party_classes = d.groupby("pid")["selectedClass"].apply(
        lambda s: sorted(set(s)))
    n_parties = int(len(party_classes))
    classes = sorted({c for lst in party_classes for c in lst})
    n = len(classes)
    idx = {c: i for i, c in enumerate(classes)}
    co = np.zeros((n, n))
    for lst in party_classes:
        for a in lst:
            for b in lst:
                co[idx[a], idx[b]] += 1

    fig = new_fig(9.8, 8.6, caption_lines=2, left=0.13, bottom_extra=0.03)
    ax = fig.add_subplot(111)
    shown = np.where(np.triu(np.ones((n, n), dtype=bool), k=1), np.nan, co)
    im = ax.imshow(shown, cmap=CMAP_GOLD, vmin=0, vmax=max(1, np.nanmax(co)))
    for i in range(n):
        for j in range(i + 1):
            v = co[i, j]
            frac = v / max(1, np.nanmax(co))
            ax.text(j, i, f"{int(v)}" if v else "·", ha="center", va="center",
                    fontsize=8.5, color=WHITE if frac > 0.6 else INK,
                    fontweight="bold" if i == j else "normal")
    ax.set_xticks(range(n))
    ax.set_xticklabels(classes, rotation=40, ha="right", fontsize=8.5)
    ax.set_yticks(range(n))
    ax.set_yticklabels(classes, fontsize=8.5)
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Parties with both classes", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "12_final_party_class_pairings.png",
        "Class pairings in final parties",
        f"Counts show final parties that included both classes. The diagonal shows parties that included that class.",
        "These pairings describe what participants submitted. They do not show which pairings are better in play.")


def fig13_role_coverage(profile_long: pd.DataFrame) -> None:
    d = profile_long[profile_long["dimension"] == "role"]
    pivot = (d.pivot_table(index="pid", columns="key", values="ability_count",
                           aggfunc="sum").fillna(0))
    pivot = pivot.loc[sorted(pivot.index, key=pid_key)]

    dmg_cols = [r for r in DAMAGE_ROLES if r in pivot.columns]
    utl_cols = [r for r in UTILITY_ROLES if r in pivot.columns]

    fig = new_fig(12.2, participant_fig_height(len(pivot), minimum=8.6), caption_lines=2, left=0.06, right=0.97,
                  bottom_extra=0.05)
    gs = fig.add_gridspec(1, 2, width_ratios=[len(dmg_cols), len(utl_cols)],
                          wspace=0.04)
    axD = fig.add_subplot(gs[0, 0])
    axU = fig.add_subplot(gs[0, 1], sharey=axD)

    def block(ax, cols, cmap, title, color):
        vals = pivot[cols]
        vmax = max(1.0, np.nanpercentile(vals.to_numpy(), 95))
        ax.imshow(vals.to_numpy(), aspect="auto", cmap=cmap, vmin=0, vmax=vmax)
        for i in range(vals.shape[0]):
            for j in range(vals.shape[1]):
                v = vals.iloc[i, j]
                frac = min(1.0, v / vmax)
                ax.text(j, i, f"{int(v)}" if v else "–", ha="center",
                        va="center", fontsize=7.5,
                        color=WHITE if frac > 0.6 else INK)
        ax.set_xticks(range(len(cols)))
        ax.set_xticklabels([wrap(ROLE_LABELS[c], 12) for c in cols],
                           rotation=40, ha="right", fontsize=8)
        ax.set_title(title, fontsize=10.5, loc="left", color=color, pad=8,
                     fontweight="bold")
        ax.grid(False)
        for spine in ax.spines.values():
            spine.set_color(color)

    block(axD, dmg_cols, CMAP_EMBER, "Damage roles", EMBER)
    block(axU, utl_cols, CMAP_TEAL, "Utility roles", TEAL)
    axD.set_yticks(range(len(pivot)))
    axD.set_yticklabels(pivot.index, fontsize=8.5)
    axU.tick_params(labelleft=False)

    finish(
        fig, OUT_DIR / "13_final_party_role_coverage.png",
        "Role coverage in final parties",
        "Counts of selected abilities tagged with each tracked role.",
        "Colors follow the tool. Counts show coverage in the prototype data, not party quality.\n"
        "A dash means no ability was tagged with that role.")


def fig14_damage_type_profile(profile_long: pd.DataFrame) -> None:
    d = profile_long[profile_long["dimension"] == "damage_type"]
    pivot = (d.pivot_table(index="pid", columns="key", values="ability_count",
                           aggfunc="sum").fillna(0))
    order = [t for t in DAMAGE_TYPE_COLORS if t in pivot.columns] + \
            [c for c in pivot.columns if c not in DAMAGE_TYPE_COLORS]
    pivot = pivot.reindex(columns=order, fill_value=0)
    totals = pivot.sum(axis=1)
    shares = pivot.div(totals, axis=0).fillna(0)
    shares = shares.loc[sorted(shares.index, key=pid_key)]
    totals = totals.loc[shares.index]

    fig = new_fig(11.4, participant_fig_height(len(shares), minimum=8.2), caption_lines=2, left=0.07, right=0.93,
                  bottom_extra=0.075)
    ax = fig.add_subplot(111)
    left = np.zeros(len(shares))
    for dt in shares.columns:
        v = shares[dt].to_numpy()
        ax.barh(shares.index, v, left=left, height=0.74,
                color=DAMAGE_TYPE_COLORS.get(dt, TAN), label=dt,
                edgecolor=WHITE, linewidth=0.35)
        left += v
    for yi, tot in enumerate(totals):
        ax.text(1.012, yi, f"{int(tot)}", va="center", fontsize=7.5,
                color=INK_SOFT, transform=ax.get_yaxis_transform())
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
    ax.set_xlabel("Share of damage-tagged abilities (total at right)")
    ax.legend(ncol=7, loc="upper center", bbox_to_anchor=(0.5, -0.095),
              fontsize=7.5, columnspacing=0.8, handlelength=1.1)
    style_axes(ax)

    finish(
        fig, OUT_DIR / "14_final_party_damage_type_profile.png",
        "Damage types in final parties",
        "Share of each final party's damage-tagged abilities by damage type.",
        "Bars are shares within each party. The number at the right shows total damage-tagged abilities.")


def fig15_party_gaps(gaps: pd.DataFrame, combined: pd.DataFrame) -> None:
    # TODO: ranges aren't working crrectly so they need to be fixed and put back in
    g = gaps[gaps["gap_key"].astype(str) != "long-range"].copy()
    g["label"] = g["gap_label"].fillna(g["gap_key"]).astype(str)
    seen = (g.drop_duplicates(["pid", "label"])
            .groupby("label")["pid"].nunique())

    key_to_label = dict(g.dropna(subset=["gap_key"])
                        .drop_duplicates("gap_key")[["gap_key", "label"]].values)
    final_counts: dict = {}
    for keys in combined["final_gap_keys"].fillna("").astype(str):
        for key in [k for k in keys.split(";") if k and k != "long-range"]:
            label = key_to_label.get(key, key)
            final_counts[label] = final_counts.get(label, 0) + 1

    labels = seen.sort_values().index.tolist()
    y = np.arange(len(labels))
    final_vals = [final_counts.get(label, 0) for label in labels]

    fig = new_fig(10.6, 6.4, caption_lines=2, left=0.28, bottom_extra=0.05)
    ax = fig.add_subplot(111)
    ax.barh(y, seen[labels], height=0.72, color=GOLD_PALE, edgecolor=INK,
            linewidth=0.4, label="Seen during planning")
    ax.barh(y, final_vals, height=0.72, color=BLOOD, edgecolor=INK,
            linewidth=0.4, label="Still present at the end")
    for yi, (s, f) in enumerate(zip(seen[labels], final_vals)):
        ax.text(s + 0.2, yi, f"{s:.0f} → {f:.0f}".replace("→", "to"),
                va="center", fontsize=8.5, color=INK_SOFT)
    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=9)
    ax.set_xlabel(f"Participants ({of_n()})")
    ax.set_xlim(0, max(study_n() + 2, int(max(seen.max(), max(final_vals) if final_vals else 0)) + 2))
    ax.legend(ncol=2, loc="upper center", bbox_to_anchor=(0.5, -0.13))
    style_axes(ax)

    finish(
        fig, OUT_DIR / "15_party_gaps_seen_vs_final.png",
        "Party gaps during planning and at the end",
        "Participants who saw each gap during planning, compared with final parties still showing it.",
        "The long-range gap is excluded because its tagging was not recorded consistently.\n"
        "Counts are coverage indicators, not party-quality scores.")


def fig16_attention(att: pd.DataFrame) -> None:
    att = prepare_attention(att)

    d = att[att["attention_context"] == "Planning interface"].copy()

    if "interface_group" in d.columns:
        d["plot_region"] = d["interface_group"]
    else:
        d["plot_region"] = d["region_label"]

    d = d[~d["plot_region"].isin(["Other planning UI"])].copy()

    if d.empty:
        return

    all_pids = sorted(d["pid"].dropna().unique(), key=pid_key)

    w = (
        d.groupby(["pid", "plot_region"])["interaction_weight"]
        .sum()
        .unstack(fill_value=0)
    )

    order = [r for r in REGION_COLORS if r in w.columns] + [
        c for c in w.columns if c not in REGION_COLORS
    ]

    w = w.reindex(index=all_pids, columns=order, fill_value=0)

    shares = w.div(w.sum(axis=1).replace(0, np.nan), axis=0).fillna(0)
    shares = shares.loc[sorted(shares.index, key=pid_key)]
    mean_share = shares.mean(axis=0)

    fig = new_fig(
        11.2,
        participant_fig_height(len(shares), minimum=8.6),
        caption_lines=2,
        left=0.08,
        bottom_extra=0.075,
    )

    gs = fig.add_gridspec(2, 1, height_ratios=[1, 9], hspace=0.28)
    ax_top = fig.add_subplot(gs[0])
    ax = fig.add_subplot(gs[1])

    left = 0.0
    for region in shares.columns:
        v = mean_share[region]
        ax_top.barh(
            [0],
            [v],
            left=left,
            color=REGION_COLORS.get(region, TAN),
            edgecolor=WHITE,
            linewidth=0.4,
        )
        if v > 0.07:
            ax_top.text(
                left + v / 2,
                0,
                f"{v:.0%}",
                ha="center",
                va="center",
                fontsize=7.5,
                color=WHITE if v > 0.15 else INK,
            )
        left += v

    ax_top.set_xlim(0, 1)
    ax_top.set_yticks([0])
    ax_top.set_yticklabels(["Mean"], fontsize=8.5)
    ax_top.set_xticks([])
    ax_top.grid(False)

    for spine in ax_top.spines.values():
        spine.set_visible(False)

    left_arr = np.zeros(len(shares))

    for region in shares.columns:
        v = shares[region].to_numpy()
        ax.barh(
            shares.index,
            v,
            left=left_arr,
            height=0.74,
            color=REGION_COLORS.get(region, TAN),
            label=region,
            edgecolor=WHITE,
            linewidth=0.4,
        )
        left_arr += v

    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(mpl.ticker.PercentFormatter(xmax=1.0))
    ax.set_xlabel("Share of planning click/dwell activity")
    apply_top_down_pid_axis(ax)

    ax.legend(
        ncol=4,
        loc="upper center",
        bbox_to_anchor=(0.5, -0.10),
        fontsize=7.5,
        columnspacing=0.9,
        handlelength=1.1,
    )

    style_axes(ax)

    finish(
        fig,
        OUT_DIR / "16_interface_attention_shares.png",
        "Where planning activity happened",
        "Planning click/dwell shares per participant. Generic other-UI events are excluded.",
        "The top strip shows the sample mean. Rows show participant-level shares across the main tool areas.",
    )

def _coordinate_events(att: pd.DataFrame) -> pd.DataFrame:
    d = prepare_attention(att).copy()
    for col in ("viewport_x_norm", "viewport_y_norm", "interaction_weight"):
        d[col] = pd.to_numeric(d[col], errors="coerce")
    d = d.dropna(subset=["viewport_x_norm", "viewport_y_norm",
                         "interaction_weight"])
    d = d[d["viewport_x_norm"].between(0, 1) & d["viewport_y_norm"].between(0, 1)]
    return d[d["attention_context"] == "Planning interface"]


def _heat_grid(x, y, w, bins=(160, 90), sigma: float = 3.5) -> np.ndarray:
    grid, _, _ = np.histogram2d(y, x, bins=[bins[1], bins[0]],
                                range=[[0, 1], [0, 1]], weights=w)
    if SCIPY_AVAILABLE:
        grid = gaussian_filter(grid, sigma=sigma)
    return np.power(grid, 0.40)


def _dark_screen(ax) -> None:
    ax.set_facecolor("#12100d")
    ax.set_xlim(0, 1)
    ax.set_ylim(1, 0)
    ax.grid(False)
    ax.set_box_aspect(9 / 16)
    for spine in ax.spines.values():
        spine.set_color(GOLD)


def fig17_coordinate_heatmap(att: pd.DataFrame) -> None:
    d = _coordinate_events(att)
    if d.empty:
        return
    grid = _heat_grid(d["viewport_x_norm"].to_numpy(),
                      d["viewport_y_norm"].to_numpy(),
                      d["interaction_weight"].to_numpy())

    fig = new_fig(11.8, 7.6, caption_lines=2, left=0.05, right=0.95)
    ax = fig.add_subplot(111)
    im = ax.imshow(grid, extent=(0, 1, 1, 0), cmap=CMAP_HEAT,
                   interpolation="bicubic", aspect="auto")
    _dark_screen(ax)
    ax.set_xticks([0, 0.25, 0.5, 0.75, 1.0])
    ax.set_yticks([0, 0.25, 0.5, 0.75, 1.0])
    ax.set_xlabel("Screen x (normalized)")
    ax.set_ylabel("Screen y (normalized)")

    top_regions = (d.groupby("region_label")["interaction_weight"].sum()
                   .sort_values(ascending=False).head(6).index)
    for region in top_regions:
        r = d[d["region_label"] == region]
        wsum = r["interaction_weight"].sum()
        cx = (r["viewport_x_norm"] * r["interaction_weight"]).sum() / wsum
        cy = (r["viewport_y_norm"] * r["interaction_weight"]).sum() / wsum
        ax.annotate(region, (cx, cy), color="#f2e7d2", fontsize=8,
                    ha="center", va="center",
                    bbox=dict(boxstyle="round,pad=0.32",
                              fc=to_rgba("#211a14", 0.78),
                              ec=GOLD_BRIGHT, lw=0.7))

    cbar = fig.colorbar(im, ax=ax, fraction=0.030, pad=0.012)
    cbar.set_ticks([])
    cbar.set_label("Activity density (low to high)", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "17_attention_heatmap_aggregate.png",
        "Where screen activity clustered",
        "Aggregate screen heatmap using hover dwell, pointer samples, and clicks.",
        "Labels mark the busiest regions. Coordinates are normalized, so this is a visual aid,\n"
        "not an eye-tracking result.")


def fig18_heatmap_small_multiples(att: pd.DataFrame) -> None:
    d = _coordinate_events(att)
    if d.empty:
        return
    pids = sorted(d["pid"].unique(), key=pid_key)
    ncols, nrows = 5, int(np.ceil(len(pids) / 5))

    fig = new_fig(12.5, 1.75 * nrows + 2.4, caption_lines=2)
    axes = fig.subplots(nrows, ncols)
    fig.subplots_adjust(hspace=0.42, wspace=0.10)
    for ax in np.ravel(axes):
        ax.set_visible(False)
    for i, pid in enumerate(pids):
        ax = np.ravel(axes)[i]
        ax.set_visible(True)
        r = d[d["pid"] == pid]
        grid = _heat_grid(r["viewport_x_norm"].to_numpy(),
                          r["viewport_y_norm"].to_numpy(),
                          r["interaction_weight"].to_numpy(),
                          bins=(96, 54), sigma=2.6)
        ax.imshow(grid, extent=(0, 1, 1, 0), cmap=CMAP_HEAT,
                  interpolation="bicubic", aspect="auto")
        _dark_screen(ax)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_title(pid, fontsize=9, pad=2, loc="left", color=INK)

    finish(
        fig, OUT_DIR / "18_attention_heatmaps_per_participant.png",
        "Screen activity by participant",
        "One screen heatmap per participant. Each panel is scaled to its own maximum.",
        "Panels show where activity clustered within each participant's session. They do not compare total volume.")

def fig19_evaluation(combined: pd.DataFrame) -> None:
    d = by_pid(combined)
    req = pd.to_numeric(d["evaluation_request_count"], errors="coerce").fillna(0)
    fail = pd.to_numeric(d["evaluation_failure_count"], errors="coerce").fillna(0)
    succ = pd.to_numeric(d["evaluation_success_count"], errors="coerce").fillna(0)
    x = np.arange(len(d))

    fig = new_fig(10.6, 5.9, caption_lines=2, bottom_extra=0.03)
    ax = fig.add_subplot(111)
    ax.bar(x, succ, color=MOSS, label="Successful", edgecolor=INK, linewidth=0.4)
    ax.bar(x, fail, bottom=succ, color=BLOOD, label="Failed / unavailable",
           edgecolor=INK, linewidth=0.4)
    for xi, r in zip(x, req):
        if r > 0:
            ax.text(xi, r + 0.2, f"{r:.0f}", ha="center", fontsize=7.5,
                    color=INK_SOFT)
    ax.set_xticks(x)
    ax.set_xticklabels(d["pid"], fontsize=7.5)
    ax.set_ylabel("Simulator evaluation requests")
    ax.legend(loc="upper right")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "19_simulator_evaluation_outcomes.png",
        "Simulator requests and outcomes",
        f"Evaluation requests: {int(req.sum())} total, {int(succ.sum())} successful, {int(fail.sum())} failed or unavailable.",
        "Failed requests mean the simulator did not return usable output. They are not zero-performance results.")


LIKERT_LABELS = {
    "exploration_iteration_overall": "Supported exploration and iteration",
    "final_party_confidence": "Confidence in the final party",
    "reasoning_tradeoffs_party_overall": "Helped reason about trade-offs",
    "balanced_autonomous_decision": "Balanced, autonomous decisions",
    "understood_visualization": "Visualization was understandable",
    "noticed_party_patterns": "Noticed party-level patterns",
    "interactive_explanation": "Interactivity explained the data",
    "readable": "Visualization was readable",
    "appropriate_for_bg3": "Appropriate for BG3 planning",
    "visual_style_fit": "Visual style fit the game",
    "engaging_creative_exploration": "Engaging, creative exploration",
}


def fig20_likert(survey: pd.DataFrame) -> None:
    items = [c for c in LIKERT_LABELS if c in survey.columns]
    rows = []
    for col in items:
        v = pd.to_numeric(survey[col], errors="coerce").dropna()
        rows.append({"item": LIKERT_LABELS[col],
                     **{k: int((v == k).sum()) for k in range(1, 6)},
                     "median": v.median(), "mean": v.mean()})
    d = pd.DataFrame(rows).sort_values("mean")

    fig = new_fig(11.4, 7.8, caption_lines=2, left=0.24, right=0.90,
                  bottom_extra=0.055)
    ax = fig.add_subplot(111)
    min_l, max_r = 0.0, 0.0
    for yi, (_, row) in enumerate(d.iterrows()):
        left = -(row[1] + row[2] + row[3] / 2)
        min_l = min(min_l, left)
        for k in range(1, 6):
            v = row[k]
            if v > 0:
                ax.barh(yi, v, left=left, height=0.72, color=LIKERT_COLORS[k],
                        edgecolor=WHITE, linewidth=0.5)
                if v >= 2:
                    ax.text(left + v / 2, yi, f"{v}", ha="center", va="center",
                            fontsize=7.5,
                            color=WHITE if k in (1, 5) else INK)
            left += v
        max_r = max(max_r, left)
        ax.text(1.015, yi, f"Mdn {row['median']:.1f}", va="center", fontsize=8,
                color=INK_SOFT, transform=ax.get_yaxis_transform())
    ax.axvline(0, color=INK, lw=1.0)
    ax.set_yticks(np.arange(len(d)))
    ax.set_yticklabels(d["item"], fontsize=9)
    ax.set_xlim(min_l * 1.2 - 1, max_r * 1.05 + 1)
    ax.set_xlabel("Participants (disagree left, agree right)")
    handles = [Rectangle((0, 0), 1, 1, color=LIKERT_COLORS[k])
               for k in range(1, 6)]
    ax.legend(handles, ["1 strongly disagree", "2", "3 neutral", "4",
                        "5 strongly agree"],
              ncol=5, loc="upper center", bbox_to_anchor=(0.5, -0.10),
              fontsize=8)
    style_axes(ax)

    finish(
        fig, OUT_DIR / "20_post_task_ratings_distribution.png",
        "Post-task ratings",
        f"Responses to the eleven five-point survey items. The neutral midpoint is centered at zero.",
        "Items are ordered by mean. Medians are shown at the right because these are five-point ratings.")


def fig21_midpoint_effects(midpoint: pd.DataFrame) -> None:
    d = midpoint[midpoint["variable"].isin(LIKERT_LABELS)].copy()
    d["item"] = d["variable"].map(LIKERT_LABELS)
    d = d.dropna(subset=["rank_biserial_effect_size"]).sort_values(
        "rank_biserial_effect_size")
    y = np.arange(len(d))

    fig = new_fig(10.8, 7.0, caption_lines=2, left=0.25, right=0.82)
    ax = fig.add_subplot(111)
    ax.axvline(0, color=INK, lw=1.0)
    for band, alpha in ((0.3, 0.10), (0.5, 0.06)):
        ax.axvspan(-band, band, color=TAN, alpha=alpha, zorder=0)
    sig = d["wilcoxon_p_value_bh"] < 0.05
    ax.hlines(y, 0, d["rank_biserial_effect_size"], color=GOLD_BRIGHT, lw=1.4)
    ax.scatter(d["rank_biserial_effect_size"], y, s=140,
               c=[GOLD if s else WHITE for s in sig],
               edgecolor=INK, linewidth=0.9, zorder=3)
    for yi, (_, row) in enumerate(d.iterrows()):
        q = row["wilcoxon_p_value_bh"]
        qtxt = f"q={q:.3f}" if pd.notna(q) else "q=n/a"
        ax.text(1.02, yi, f"{row['rank_biserial_effect_size']:+.2f} ({qtxt})",
                va="center", fontsize=8, color=INK_SOFT,
                transform=ax.get_yaxis_transform())
    ax.set_yticks(y)
    ax.set_yticklabels(d["item"], fontsize=9)
    ax.set_xlim(-1.05, 1.05)
    ax.set_xlabel("Rank-biserial effect size vs. neutral midpoint")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "21_midpoint_effect_sizes.png",
        "Ratings compared with neutral",
        "Effect sizes for ratings compared with the neutral midpoint. Filled markers have adjusted q < .05.",
        "Effect sizes and adjusted p-values are shown together. These checks are exploratory.")

def fig22_priorities_vs_factors(pre_counts: pd.DataFrame,
                                post_counts: pd.DataFrame) -> None:
    pre = pre_counts.set_index("factor")
    post = post_counts.set_index("factor")
    shared = [f for f in pre.index if f in post.index]
    post_only = [f for f in post.index if f not in pre.index]

    d = pd.DataFrame({"label": pre.loc[shared, "label"],
                      "pre": pre.loc[shared, "count_selected"],
                      "post": post.loc[shared, "count_selected"]}
                     ).sort_values("post")
    y = np.arange(len(d))

    fig = new_fig(10.8, 7.2, caption_lines=2, left=0.20)
    ax = fig.add_subplot(111)
    ax.hlines(y, d["pre"], d["post"], color=GOLD_BRIGHT, lw=2.0, zorder=2)
    ax.scatter(d["pre"], y, s=110, color=TAN, edgecolor=INK, linewidth=0.6,
               zorder=3, label="Before task")
    ax.scatter(d["post"], y, s=130, color=GOLD, edgecolor=INK, linewidth=0.7,
               zorder=4, label="After task")
    for yi, (_, row) in enumerate(d.iterrows()):
        delta = row["post"] - row["pre"]
        ax.text(max(row["pre"], row["post"]) + 0.5, yi, f"{delta:+.0f}",
                va="center", fontsize=8.5,
                color=MOSS if delta > 0 else (BLOOD if delta < 0 else INK_FAINT))
    ax.set_yticks(y)
    ax.set_yticklabels(d["label"], fontsize=9)
    lines = ["Post-task only:"] + [
        f"  {post.loc[f, 'label']}: {post.loc[f, 'count_selected']:.0f}"
        for f in post_only]
    ax.text(0.985, 0.03, "\n".join(lines), transform=ax.transAxes, ha="right",
            va="bottom", fontsize=8.5, color=INK_SOFT,
            bbox=dict(boxstyle="round,pad=0.45", fc=WHITE, ec=GOLD, lw=0.8))
    max_count = max(float(d[["pre", "post"]].to_numpy().max()) if not d.empty else 0.0, study_n())
    ax.set_xlim(0, max_count + 1)
    ax.set_xlabel(f"Participants selecting ({of_n()})")
    ax.legend(loc="upper left")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "22_priorities_before_vs_factors_after.png",
        "Before-task priorities and final decision factors",
        "Same factors before the task and after participants submitted their final party.",
        "Values are self-reports. They show what participants said mattered, not verified causes.")


ASSOC_X_LABELS = {
    "unique_focus_keys": "Data Circle concepts used",
    "data_circle_focus_select_count": "Data Circle selections",
    "data_circle_total_dwell_sec": "Data Circle dwell time",
    "tooltip_open_count": "Tooltips opened",
    "aggregate_or_party_focus_event_count": "Party/aggregate inspections",
    "party_gap_response_unique_edit_count": "Edits after gap alerts",
    "unique_party_snapshots": "Unique party states",
    "saved_build_loaded_count": "Saved builds revisited",
    "edits_after_visualization_60s": "Edits after inspection (60 s)",
    "visual_profile_changing_edit_count": "Profile-changing edits",
    "friction_event_count": "Friction events",
    "evaluation_failure_count": "Failed evaluations",
    "pre_domain_experience_index": "Domain experience",
    "build_edit_count": "Build edits",
}
ASSOC_Y_LABELS = {
    **LIKERT_LABELS,
    "survey_visualization_interpretation_score": "Visualization interpretation (composite)",
    "survey_exploration_support_score": "Exploration support (composite)",
    "build_edit_count": "Build edits",
}


def fig23_associations(assoc: pd.DataFrame) -> None:
    d = assoc.dropna(subset=["spearman_rho"]).copy()
    d["pair"] = [f"{ASSOC_Y_LABELS.get(yv, yv)}  ~  {ASSOC_X_LABELS.get(xv, xv)}"
                 for xv, yv in zip(d["x"], d["y"])]
    d = d.sort_values("spearman_rho")
    y = np.arange(len(d))

    fig = new_fig(12.4, 8.0, caption_lines=2, left=0.37, right=0.84)
    ax = fig.add_subplot(111)
    ax.axvline(0, color=INK, lw=1.0)
    for band in (0.3, 0.5):
        ax.axvspan(-band, band, color=TAN, alpha=0.07, zorder=0)
    has_ci = d[["spearman_ci_low_boot", "spearman_ci_high_boot"]].notna().all(axis=1)
    ax.hlines(y[has_ci.to_numpy()],
              d.loc[has_ci, "spearman_ci_low_boot"],
              d.loc[has_ci, "spearman_ci_high_boot"],
              color=GOLD_BRIGHT, lw=2.4, alpha=0.9)
    sig = d["spearman_p_value_bh"] < 0.05
    ax.scatter(d["spearman_rho"], y, s=140,
               c=[GOLD if s else WHITE for s in sig],
               edgecolor=INK, linewidth=0.9, zorder=3)
    for yi, (_, row) in enumerate(d.iterrows()):
        q = row["spearman_p_value_bh"]
        txt = f"ρ={row['spearman_rho']:+.2f}"
        if pd.notna(q):
            txt += f"  q={q:.2f}"
        ax.text(1.02, yi, txt, va="center", fontsize=7.8, color=INK_SOFT,
                transform=ax.get_yaxis_transform())
    ax.set_yticks(y)
    ax.set_yticklabels([wrap(p, 55) for p in d["pair"]], fontsize=8)
    ax.set_xlim(-1.05, 1.05)
    ax.set_xlabel("Spearman correlation (whiskers: bootstrap 95% CI)")
    style_axes(ax)

    finish(
        fig, OUT_DIR / "23_log_survey_associations.png",
        "Planned log-survey associations",
        "Planned pairs, read as survey rating compared with logged behavior.",
        "Correlations describe this sample only. They do not show cause and effect.")


def fig24_scatter_panel(combined: pd.DataFrame, assoc: pd.DataFrame) -> None:
    panels = [
        ("unique_focus_keys", "understood_visualization",
         "Data Circle concepts used", "Understood visualization"),
        ("data_circle_total_dwell_sec", "understood_visualization",
         "Data Circle dwell time (s)", "Understood visualization"),
        ("friction_event_count", "readable",
         "Friction / blocked-action events", "Readability rating"),
        ("saved_build_loaded_count", "exploration_iteration_overall",
         "Saved builds revisited", "Exploration & iteration rating"),
    ]
    lookup = {(r["x"], r["y"]): r for _, r in assoc.iterrows()}
    rng = np.random.default_rng(2026)

    fig = new_fig(11.0, 9.0, caption_lines=2)
    axes = fig.subplots(2, 2)
    fig.subplots_adjust(hspace=0.42, wspace=0.30)
    for ax, (xc, yc, xl, yl) in zip(np.ravel(axes), panels):
        x = pd.to_numeric(combined[xc], errors="coerce")
        yv = pd.to_numeric(combined[yc], errors="coerce")
        ok = x.notna() & yv.notna()
        jitter = rng.uniform(-0.12, 0.12, ok.sum())
        ax.scatter(x[ok], yv[ok] + jitter, s=85, color=GOLD, alpha=0.85,
                   edgecolor=INK, linewidth=0.6)
        if x[ok].nunique() > 1:
            coef = np.polyfit(x[ok], yv[ok], 1)
            xs = np.linspace(x[ok].min(), x[ok].max(), 50)
            ax.plot(xs, np.polyval(coef, xs), ls="--", color=INK_SOFT, lw=1.1)
        stat = lookup.get((xc, yc))
        if stat is not None and pd.notna(stat["spearman_rho"]):
            q = stat.get("spearman_p_value_bh", np.nan)
            ax.set_title(f"ρ = {stat['spearman_rho']:+.2f}"
                         + (f",  q = {q:.2f}" if pd.notna(q) else ""),
                         fontsize=10, loc="right", color=INK_SOFT,
                         fontweight="normal")
        ax.set_xlabel(xl, fontsize=9)
        ax.set_ylabel(yl, fontsize=9)
        ax.set_yticks([1, 2, 3, 4, 5])
        ax.set_ylim(0.5, 5.7)
        style_axes(ax)

    finish(
        fig, OUT_DIR / "24_key_association_scatterplots.png",
        "Selected log-survey pairs",
        "Four selected pairs. Ratings are slightly jittered so overlapping points are visible.",
        "Dashed lines are visual guides only. The reported statistic is the Spearman correlation.")


def fig25_qualitative(indicators: pd.DataFrame) -> None:
    theme_labels = {
        "mentions_data_circle": "Data Circle / radial view",
        "mentions_party_view": "Party-level reasoning",
        "mentions_tooltips_explanation": "Explanations / tooltips",
        "mentions_simulator_or_server": "Simulator / server issues",
        "mentions_confusion": "Confusion / unclear",
        "mentions_exploration": "Exploration / comparison",
        "mentions_external_resources": "External resources",
    }
    response_labels = {
        "supported_exploration": "What supported exploration",
        "blocked_exploration": "What blocked exploration",
        "changed_normal_planning": "Difference from normal planning",
        "suggested_change": "Suggested changes",
        "optional_comments": "Optional comments",
        "visualization_observation": "Visualization-based decisions",
        "other_factor": "Other decision factors",
    }
    d = indicators.set_index("response_type")
    d = d.reindex([r for r in response_labels if r in d.index])
    cols = [c for c in theme_labels if c in d.columns]
    vals = d[cols].to_numpy(dtype=float)
    vmax = max(1.0, vals.max())

    fig = new_fig(10.8, 6.8, caption_lines=2, left=0.24, bottom_extra=0.05)
    ax = fig.add_subplot(111)
    im = ax.imshow(vals, aspect="auto", cmap=CMAP_GOLD, vmin=0, vmax=vmax)
    for i in range(vals.shape[0]):
        for j in range(vals.shape[1]):
            v = vals[i, j]
            ax.text(j, i, f"{int(v)}" if v else "·", ha="center", va="center",
                    fontsize=9, color=WHITE if v / vmax > 0.6 else INK)
    ax.set_xticks(range(len(cols)))
    ax.set_xticklabels([wrap(theme_labels[c], 14) for c in cols], rotation=35,
                       ha="right", fontsize=8.5)
    ax.set_yticks(range(len(d)))
    ax.set_yticklabels([response_labels.get(r, r) for r in d.index], fontsize=9)
    ax.grid(False)
    for spine in ax.spines.values():
        spine.set_color(GOLD)
    cbar = fig.colorbar(im, ax=ax, fraction=0.035, pad=0.015)
    cbar.set_label("Responses with keyword group", fontsize=8.5)
    cbar.outline.set_edgecolor(GOLD)

    finish(
        fig, OUT_DIR / "25_qualitative_keyword_indicators.png",
        "Keywords in open-ended responses",
        "Response rows that contained each keyword group.",
        "These counts helped guide coding. They are not the full thematic analysis, and frequency alone does not show importance.")


def per_participant_timelines(timeline: pd.DataFrame) -> None:
    fam = [f for f in FAMILY_COLORS if f in set(timeline["event_family"])]
    for pid in sorted(timeline["pid"].unique(), key=pid_key):
        pv = (timeline[timeline["pid"] == pid]
              .groupby(["time_bin_min", "event_family"])["count"].sum()
              .unstack(fill_value=0).reindex(columns=fam, fill_value=0)
              .sort_index())
        if pv.empty:
            continue
        fig = new_fig(9.5, 4.8, caption_lines=1)
        ax = fig.add_subplot(111)
        ax.stackplot(pv.index, [pv[c] for c in fam], labels=fam,
                     colors=[FAMILY_COLORS[c] for c in fam], alpha=0.95,
                     linewidth=0)
        ax.set_xlabel("Minutes since session start")
        ax.set_ylabel("Events per 5-minute bin")
        ax.legend(loc="upper right", fontsize=7, ncol=2)
        style_axes(ax)
        finish(fig, OUT_PER_PARTICIPANT / f"{pid}_session_timeline.png",
               f"Session timeline — {pid}",
               "Planning actions by event family.",
               "Supplementary timeline for one participant.")
        
def main() -> None:
    setup_style()
    print("Loading tables...")

    combined = read_table("participant_analysis_table.csv")
    if combined.empty:
        raise SystemExit("Run run_full_analysis.py first.")

    mapping = build_pid_map(combined)
    set_study_n_from_mapping(mapping)
    combined = anon(combined, mapping)

    survey = anon(read_table("survey_participant_table.csv"), mapping)
    timeline = anon(read_table("timeline_bins.csv", processed=True), mapping)
    events = anon(read_table("clean_events_flat.csv", processed=True), mapping)
    edits = anon(read_table("build_edit_events_long.csv"), mapping)
    focus = anon(read_table("visualization_focus_events.csv"), mapping)
    gaps = anon(read_table("gap_summary.csv"), mapping)
    members = anon(read_table("final_party_members.csv"), mapping)
    profile_long = anon(read_table("final_party_profile_long.csv"), mapping)
    att = anon(read_table("heatmap_semantic_events_labelled.csv"), mapping)
    followup = anon(read_table("feature_followup_events.csv", processed=True), mapping)
    midpoint = read_table("survey_midpoint_tests.csv")
    assoc = read_table("primary_log_survey_associations.csv")
    pre_counts = read_table("pre_priority_counts.csv")
    post_counts = read_table("post_decision_factor_counts.csv")
    indicators = read_table("qualitative_keyword_indicators.csv")

    if not att.empty:
        att = prepare_attention(att)
    if not events.empty:
        events = prepare_events(events)

    for folder in (OUT_DIR, OUT_APPENDIX, OUT_PER_PARTICIPANT):
        for old in folder.glob("*.png"):
            old.unlink()

    print("Rendering figures...")
    fig01_sample_quality(combined)
    fig02_background(combined)
    if not pre_counts.empty:
        fig03_pre_priorities(pre_counts)
    if not timeline.empty:
        fig04_timeline(timeline)
        fig05_timeline_small_multiples(timeline)
        per_participant_timelines(timeline)
    fig06_behaviour_matrix(combined)
    if not edits.empty:
        fig07_edit_composition(edits)
        fig26_edit_composition_new(edits)

    if not att.empty:
        fig08_interface_zone_attention(att)
    if not events.empty:
        fig09_tab_transition_matrix(events)
        fig10_process_history_workflow(events, att)
        fig11_saved_build_party_workflow(events)
    if not edits.empty:
        fig12_actions_spells_passives_detail(edits, att)
    if not followup.empty or not events.empty:
        fig13_feature_supported_revision_matrix(followup, events)
    if not focus.empty:
        fig08_data_circle_concepts(focus)
        fig09_layer_source_engagement(focus)
    fig10_viz_followup(combined)
    if not members.empty:
        fig11_final_party_classes(members)
        fig12_class_cooccurrence(members)
    if not profile_long.empty:
        fig13_role_coverage(profile_long)
        fig14_damage_type_profile(profile_long)
    if not gaps.empty:
        fig15_party_gaps(gaps, combined)
    if not att.empty:
        fig27_attention_shares(att)
        fig16_attention(att)
        fig17_coordinate_heatmap(att)
        fig18_heatmap_small_multiples(att)
    fig19_evaluation(combined)
    if not survey.empty:
        fig20_likert(survey)
    if not midpoint.empty:
        fig21_midpoint_effects(midpoint)
    if not pre_counts.empty and not post_counts.empty:
        fig22_priorities_vs_factors(pre_counts, post_counts)
    if not assoc.empty:
        fig23_associations(assoc)
        fig24_scatter_panel(combined, assoc)
    if not indicators.empty:
        fig25_qualitative(indicators)
    print(f"\nDone. Figures: {OUT_DIR}")


if __name__ == "__main__":
    main()
