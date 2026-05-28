import DataCircle from "../DataCircle";
import type { VisualizedBuildItem } from "../DataCircle/dataCircleTypes";
import type { ClassName } from "../../types/buildPlannerTypes";
import "./PartyPlanner.css";

export type PartyBuildSnapshot = {
  id: string;
  buildName: string;
  characterName: string;
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
  fixedClassFeatureIds: string[];
  selectedClassFeatureIds: string[];
  activeClassFeatureIds: string[];
  visualizedItems: VisualizedBuildItem[];
};

type PartyPlannerProps = {
  currentBuild: PartyBuildSnapshot;
  partySlots: Array<PartyBuildSnapshot | null>;
  onSaveCurrentToSlot: (slotIndex: number) => void;
  onLoadSlot: (slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
};

function getBuildTitle(snapshot: PartyBuildSnapshot | null, fallback: string) {
  if (!snapshot) return fallback;

  return (
    snapshot.buildName.trim() ||
    snapshot.characterName.trim() ||
    snapshot.selectedSubclass ||
    snapshot.selectedClass ||
    fallback
  );
}

function getBuildSubtitle(snapshot: PartyBuildSnapshot | null) {
  if (!snapshot) {
    return "No build assigned";
  }

  const archetype =
    snapshot.selectedSubclass || snapshot.selectedClass || "Unassigned";

  return `Level ${snapshot.selectedLevel} · ${archetype} · ${snapshot.visualizedItems.length} visualized items`;
}

export default function PartyPlanner({
  currentBuild,
  partySlots,
  onSaveCurrentToSlot,
  onLoadSlot,
  onClearSlot,
}: PartyPlannerProps) {
  const filledSlots = partySlots.filter(Boolean).length;

  return (
    <section className="party-planner-panel" aria-label="Party planner">
      <header className="party-planner-header">
        <div>
          <p className="party-planner-eyebrow">Party Planner</p>
          <h2>Assigned Builds</h2>
        </div>

        <p className="party-planner-summary">
          {filledSlots}/4 party builds assigned
        </p>
      </header>

      <div className="party-assignment-grid">
        {partySlots.map((snapshot, slotIndex) => {
          const slotNumber = slotIndex + 1;
          const fallbackTitle = `Member ${slotNumber}`;
          const isEmpty = !snapshot;

          return (
            <article
              key={`party-slot-${slotIndex}`}
              className={`party-build-window ${
                isEmpty ? "party-build-window--empty" : ""
              }`}
            >
              <header className="party-build-window-header">
                <div>
                  <span className="party-build-window-kicker">
                    Build {slotNumber}
                  </span>

                  <h3>{getBuildTitle(snapshot, fallbackTitle)}</h3>

                  <p>{getBuildSubtitle(snapshot)}</p>
                </div>
              </header>

              <div className="party-build-window-circle">
                {snapshot ? (
                  <DataCircle
                    buildName={snapshot.buildName}
                    characterName={snapshot.characterName}
                    selectedClass={snapshot.selectedClass}
                    selectedSubclass={snapshot.selectedSubclass}
                    selectedLevel={snapshot.selectedLevel}
                    selectedSpellIds={snapshot.selectedSpellIds}
                    fixedClassFeatureIds={snapshot.fixedClassFeatureIds}
                    selectedClassFeatureIds={snapshot.selectedClassFeatureIds}
                    activeClassFeatureIds={snapshot.activeClassFeatureIds}
                    visualizedItemsOverride={snapshot.visualizedItems}
                    showDprLayer={false}
                    variant="party"
                  />
                ) : (
                  <div className="party-build-empty-circle">
                    <span>Assign build</span>
                  </div>
                )}
              </div>

              <div className="party-build-window-actions">
                <button
                  type="button"
                  onClick={() => onSaveCurrentToSlot(slotIndex)}
                  title="Save the currently edited build into this party slot."
                >
                  Assign current
                </button>

                <button
                  type="button"
                  onClick={() => onLoadSlot(slotIndex)}
                  disabled={isEmpty}
                  title="Load this party build into the main editor."
                >
                  Edit slot
                </button>

                <button
                  type="button"
                  onClick={() => onClearSlot(slotIndex)}
                  disabled={isEmpty}
                  title="Remove this build from the party slot."
                >
                  Clear
                </button>
              </div>

              {!isEmpty ? (
                <p className="party-build-window-note">
                  Edit loads this build into the main planner. After changing it,
                  assign current again to update the slot.
                </p>
              ) : (
                <p className="party-build-window-note">
                  Configure a build in the main planner, then assign it here.
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="party-active-build-reference">
        <span>Current editor build</span>
        <strong>
          {currentBuild.buildName ||
            currentBuild.characterName ||
            currentBuild.selectedSubclass ||
            currentBuild.selectedClass ||
            "Untitled Build"}
        </strong>
      </div>
    </section>
  );
}