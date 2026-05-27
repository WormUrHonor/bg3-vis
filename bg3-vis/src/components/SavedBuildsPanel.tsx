import { useState } from "react";
import type { BuildEditorSnapshot, SavedBuild } from "../types/savedBuildTypes";
import {
  formatSavedBuildDate,
  getDefaultSavedBuildLabel,
} from "../logic/savedBuildStorage";

type SavedBuildsPanelProps = {
  currentSnapshot: BuildEditorSnapshot;
  savedBuilds: SavedBuild[];
  onSaveNew: (label: string) => void;
  onOverwrite: (buildId: string) => void;
  onLoad: (buildId: string) => void;
  onDelete: (buildId: string) => void;
};

function getSnapshotSubtitle(snapshot: BuildEditorSnapshot) {
  const classLabel = snapshot.selectedSubclass || snapshot.selectedClass || "No class";
  const raceLabel = snapshot.selectedSubrace || snapshot.selectedRace || "No race";

  return `Level ${snapshot.selectedLevel} · ${classLabel} · ${raceLabel}`;
}

export default function SavedBuildsPanel({
  currentSnapshot,
  savedBuilds,
  onSaveNew,
  onOverwrite,
  onLoad,
  onDelete,
}: SavedBuildsPanelProps) {
  const [draftLabel, setDraftLabel] = useState(
    getDefaultSavedBuildLabel(currentSnapshot)
  );

  function handleSaveNew() {
    onSaveNew(draftLabel);
    setDraftLabel(getDefaultSavedBuildLabel(currentSnapshot));
  }

  return (
    <section className="saved-builds-panel" aria-label="Saved builds">
      <div className="saved-builds-header">
        <div>
          <h3>Saved Builds</h3>
          <p>Save the current editor state and load it later.</p>
        </div>

        <span>{savedBuilds.length}</span>
      </div>

      <div className="saved-builds-save-row">
        <input
          type="text"
          value={draftLabel}
          onChange={(event) => setDraftLabel(event.target.value)}
          placeholder="Build name"
          aria-label="Saved build name"
        />

        <button type="button" onClick={handleSaveNew}>
          Save
        </button>
      </div>

      <div className="saved-builds-list">
        {savedBuilds.length === 0 ? (
          <p className="saved-builds-empty">
            No saved builds yet.
          </p>
        ) : (
          savedBuilds.map((savedBuild) => (
            <article className="saved-build-card" key={savedBuild.id}>
              <div className="saved-build-card-main">
                <strong>{savedBuild.label}</strong>
                <p>{getSnapshotSubtitle(savedBuild.snapshot)}</p>
                <span>Updated {formatSavedBuildDate(savedBuild.updatedAt)}</span>
              </div>

              <div className="saved-build-card-actions">
                <button type="button" onClick={() => onLoad(savedBuild.id)}>
                  Load
                </button>

                <button type="button" onClick={() => onOverwrite(savedBuild.id)}>
                  Update
                </button>

                <button
                  type="button"
                  className="saved-build-delete-button"
                  onClick={() => onDelete(savedBuild.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}