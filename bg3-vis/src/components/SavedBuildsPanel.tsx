import { useMemo, useState } from "react";
import type { BuildEditorSnapshot, SavedBuild } from "../types/savedBuildTypes";
import {
  formatSavedBuildDate,
  getDefaultSavedBuildLabel,
} from "../logic/savedBuildStorage";

type SavedBuildsPanelProps = {
  currentSnapshot: BuildEditorSnapshot;
  savedBuilds: SavedBuild[];
  partySlots: Array<SavedBuild | null>;
  onSaveNew: () => void;
  onOverwrite: (buildId: string) => void;
  onLoad: (buildId: string) => void;
  onLoadIntoPartySlot: (buildId: string, slotIndex: number) => void;
  onClearPartySlot: (slotIndex: number) => void;
  onDelete: (buildId: string) => void;
};

function getSnapshotSubtitle(snapshot: BuildEditorSnapshot) {
  const classLabel = snapshot.selectedSubclass || snapshot.selectedClass || "No class";
  const raceLabel = snapshot.selectedSubrace || snapshot.selectedRace || "No race";

  return `Level ${snapshot.selectedLevel} · ${classLabel} · ${raceLabel}`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getSavedBuildSearchScore(savedBuild: SavedBuild, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return 0;

  const label = normalizeSearchValue(savedBuild.label);
  const buildName = normalizeSearchValue(savedBuild.snapshot.buildName);
  const characterName = normalizeSearchValue(savedBuild.snapshot.characterName);
  const className = normalizeSearchValue(savedBuild.snapshot.selectedClass);
  const subclass = normalizeSearchValue(savedBuild.snapshot.selectedSubclass);
  const race = normalizeSearchValue(savedBuild.snapshot.selectedRace);
  const subrace = normalizeSearchValue(savedBuild.snapshot.selectedSubrace);

  const searchableText = [
    label,
    buildName,
    characterName,
    className,
    subclass,
    race,
    subrace,
  ].join(" ");

  if (label === normalizedQuery || buildName === normalizedQuery) return 100;
  if (label.startsWith(normalizedQuery) || buildName.startsWith(normalizedQuery)) return 80;
  if (label.includes(normalizedQuery) || buildName.includes(normalizedQuery)) return 60;
  if (characterName.includes(normalizedQuery)) return 45;
  if (subclass.includes(normalizedQuery) || className.includes(normalizedQuery)) return 30;
  if (subrace.includes(normalizedQuery) || race.includes(normalizedQuery)) return 20;
  if (searchableText.includes(normalizedQuery)) return 10;

  return -1;
}

export default function SavedBuildsPanel({
  currentSnapshot,
  savedBuilds,
  partySlots,
  onSaveNew,
  onOverwrite,
  onLoad,
  onLoadIntoPartySlot,
  onClearPartySlot,
  onDelete,
}: SavedBuildsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const currentBuildLabel = getDefaultSavedBuildLabel(currentSnapshot);

  const filteredSavedBuilds = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);

    if (!normalizedQuery) return savedBuilds;

    return savedBuilds
      .map((savedBuild) => ({
        savedBuild,
        score: getSavedBuildSearchScore(savedBuild, normalizedQuery),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        return (
          new Date(b.savedBuild.updatedAt).getTime() -
          new Date(a.savedBuild.updatedAt).getTime()
        );
      })
      .map((entry) => entry.savedBuild);
  }, [savedBuilds, searchQuery]);

  return (
    <section className="saved-builds-panel" aria-label="Saved builds">
      <div className="saved-builds-header">
        <div>
          <h3>Saved Builds</h3>
          <p>Save, reload, or assign builds to party slots.</p>
        </div>

        <span>{savedBuilds.length}</span>
      </div>

      <div className="saved-builds-save-row saved-builds-save-row--single">
        <button type="button" onClick={onSaveNew}>
          Save current build
        </button>
      </div>

      <div className="saved-builds-current-name">
        <span>Saved as</span>
        <strong>{currentBuildLabel}</strong>
      </div>

      <section className="saved-party-slots" aria-label="Current party slots">
        {partySlots.map((slot, index) => (
          <article className="saved-party-slot" key={`party-slot-${index}`}>
            <div>
              <span>Party {index + 1}</span>
              <strong>{slot ? slot.label : "Empty slot"}</strong>
            </div>

            <button
              type="button"
              onClick={() => onClearPartySlot(index)}
              disabled={!slot}
            >
              Clear
            </button>
          </article>
        ))}
      </section>

      <label className="saved-builds-search">
        Search builds
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by build, character, class, race..."
        />
      </label>

      <div className="saved-builds-list">
        {filteredSavedBuilds.length === 0 ? (
          <p className="saved-builds-empty">
            {savedBuilds.length === 0
              ? "No saved builds yet."
              : "No saved builds match this search."}
          </p>
        ) : (
          filteredSavedBuilds.map((savedBuild) => (
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

              <div className="saved-build-party-actions">
                <span>Send to party</span>

                {[0, 1, 2].map((slotIndex) => (
                  <button
                    key={`${savedBuild.id}-party-${slotIndex}`}
                    type="button"
                    onClick={() => onLoadIntoPartySlot(savedBuild.id, slotIndex)}
                  >
                    {slotIndex + 1}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}