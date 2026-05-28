import { useEffect, useMemo, useState } from "react";
import { bg3ClassFeatures } from "../data/bg3ClassFeatures";
import { getAvailableClassFeaturesForBuild } from "../data/bg3ClassFeatureAvailability";
import { getAvailableRaceFeaturesForBuild } from "../data/raceFeatures";
import { getFixedClassFeatureIds } from "../logic/classFeatureSelectionLogic";
import { formatSavedBuildDate } from "../logic/savedBuildStorage";
import type {
  BuildEditorSnapshot,
  BuildHistoryEntry,
} from "../types/savedBuildTypes";
import DataCircle from "./DataCircle";

type ProcessSpiralPanelProps = {
  buildHistory: BuildHistoryEntry[];
  onLoadHistoryEntry: (historyEntryId: string) => void;
  onLoadHistoryEntryIntoPartySlot: (
    historyEntryId: string,
    slotIndex: number
  ) => void;
};

type SpiralNode = {
  entry: BuildHistoryEntry;
  index: number;
  x: number;
  y: number;
  size: number;
};

function getFixedClassFeatureIdsForSnapshot(snapshot: BuildEditorSnapshot) {
  const classFeaturesOnly = getAvailableClassFeaturesForBuild(
    bg3ClassFeatures,
    snapshot.selectedClass,
    snapshot.selectedSubclass,
    snapshot.selectedLevel,
    snapshot.selectedClassFeatureIds,
    snapshot.rangerFavouredEnemy,
    snapshot.rangerNaturalExplorer
  );

  const raceFeatures = getAvailableRaceFeaturesForBuild(
    snapshot.selectedRace,
    snapshot.selectedSubrace,
    snapshot.selectedLevel
  );

  return getFixedClassFeatureIds([...raceFeatures, ...classFeaturesOnly]);
}

function getHistoryLabel(entry: BuildHistoryEntry) {
  return (
    entry.label ||
    entry.snapshot.buildName ||
    entry.snapshot.characterName ||
    entry.snapshot.selectedSubclass ||
    entry.snapshot.selectedClass ||
    "Untitled Build"
  );
}

function getHistorySubtitle(entry: BuildHistoryEntry) {
  const classLabel =
    entry.snapshot.selectedSubclass || entry.snapshot.selectedClass || "No class";

  const raceLabel =
    entry.snapshot.selectedSubrace || entry.snapshot.selectedRace || "No race";

  return `Level ${entry.snapshot.selectedLevel} · ${classLabel} · ${raceLabel}`;
}

function getSortedHistory(buildHistory: BuildHistoryEntry[]) {
  return [...buildHistory].sort((a, b) => {
    const bTime = new Date(b.createdAt).getTime();
    const aTime = new Date(a.createdAt).getTime();

    return bTime - aTime;
  });
}

function getSpiralNodes(buildHistory: BuildHistoryEntry[]): SpiralNode[] {
  const sortedHistory = getSortedHistory(buildHistory);

  return sortedHistory.map((entry, index) => {
    const angle = -2.65 + index * 0.74;
    const distance = 4 + index * 8.4;

    return {
      entry,
      index,
      x: 50 + Math.cos(angle) * distance,
      y: 47 + Math.sin(angle) * distance,
      size: Math.max(42, 82 - index * 4.6),
    };
  });
}

function getSpiralPath(nodes: SpiralNode[]) {
  if (nodes.length <= 0) return "";

  return nodes
    .map((node, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${node.x.toFixed(2)} ${node.y.toFixed(2)}`;
    })
    .join(" ");
}

export default function ProcessSpiralPanel({
  buildHistory,
  onLoadHistoryEntry,
  onLoadHistoryEntryIntoPartySlot,
}: ProcessSpiralPanelProps) {
  const nodes = useMemo(() => getSpiralNodes(buildHistory), [buildHistory]);
  const spiralPath = useMemo(() => getSpiralPath(nodes), [nodes]);

  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = useState<
    string | null
  >(null);

  const selectedEntry = useMemo(() => {
    if (!selectedHistoryEntryId) return nodes[0]?.entry ?? null;

    return (
      nodes.find((node) => node.entry.id === selectedHistoryEntryId)?.entry ??
      nodes[0]?.entry ??
      null
    );
  }, [nodes, selectedHistoryEntryId]);

  useEffect(() => {
    if (nodes.length <= 0) {
      setSelectedHistoryEntryId(null);
      return;
    }

    if (
      selectedHistoryEntryId &&
      nodes.some((node) => node.entry.id === selectedHistoryEntryId)
    ) {
      return;
    }

    setSelectedHistoryEntryId(nodes[0].entry.id);
  }, [nodes, selectedHistoryEntryId]);

  return (
    <section className="process-spiral-panel" aria-label="Build process spiral">
      <div className="process-spiral-header">
        <div>
          <h3>Build Process</h3>
          <p>Saved versions of build states over time.</p>
        </div>

        <span>{buildHistory.length}</span>
      </div>

      {nodes.length <= 0 ? (
        <div className="process-spiral-empty">
          Save or update a build to start the process trace.
        </div>
      ) : (
        <>
          <div className="process-spiral-stage">
            <svg
              viewBox="0 0 100 100"
              className="process-spiral-backdrop"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="processSpiralStroke"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgba(255,222,158,0.84)" />
                  <stop offset="48%" stopColor="rgba(170,91,255,0.76)" />
                  <stop offset="100%" stopColor="rgba(93,178,255,0.48)" />
                </linearGradient>

                <filter id="processSpiralGlow">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g className="process-spiral-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <line
                    key={`process-grid-x-${index}`}
                    x1={index * 14.3}
                    y1="0"
                    x2={index * 14.3}
                    y2="100"
                  />
                ))}

                {Array.from({ length: 7 }, (_, index) => (
                  <line
                    key={`process-grid-y-${index}`}
                    x1="0"
                    y1={index * 16.7}
                    x2="100"
                    y2={index * 16.7}
                  />
                ))}
              </g>

              <path d={spiralPath} className="process-spiral-line" fill="none" />
            </svg>

            {nodes.map((node) => {
              const isSelected = selectedEntry?.id === node.entry.id;

              return (
                <button
                  key={node.entry.id}
                  type="button"
                  className={
                    isSelected
                      ? "process-spiral-node process-spiral-node--selected"
                      : "process-spiral-node"
                  }
                  style={{
                    width: `${node.size}px`,
                    height: `${node.size}px`,
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                  }}
                  onClick={() => setSelectedHistoryEntryId(node.entry.id)}
                  title={getHistoryLabel(node.entry)}
                >
                  <span className="process-spiral-node-index">
                    {node.index + 1}
                  </span>

                  <DataCircle
                    buildName={node.entry.snapshot.buildName}
                    characterName={node.entry.snapshot.characterName}
                    selectedClass={node.entry.snapshot.selectedClass}
                    selectedSubclass={node.entry.snapshot.selectedSubclass}
                    selectedLevel={node.entry.snapshot.selectedLevel}
                    selectedSpellIds={node.entry.snapshot.selectedSpellIds}
                    fixedClassFeatureIds={getFixedClassFeatureIdsForSnapshot(
                      node.entry.snapshot
                    )}
                    selectedClassFeatureIds={
                      node.entry.snapshot.selectedClassFeatureIds
                    }
                    activeClassFeatureIds={
                      node.entry.snapshot.activeClassFeatureIds
                    }
                    showDprLayer={false}
                    variant="party"
                  />
                </button>
              );
            })}
          </div>

          {selectedEntry ? (
            <article className="process-spiral-selection">
              <div className="process-spiral-selection-main">
                <span>
                  {selectedEntry.eventType === "created"
                    ? "Saved version"
                    : "Updated version"}
                </span>

                <strong>{getHistoryLabel(selectedEntry)}</strong>
                <p>{getHistorySubtitle(selectedEntry)}</p>

                <small>
                  Recorded {formatSavedBuildDate(selectedEntry.createdAt)}
                </small>
              </div>

              <div className="process-spiral-actions">
                <button
                  type="button"
                  onClick={() => onLoadHistoryEntry(selectedEntry.id)}
                >
                  Load
                </button>

                {[0, 1, 2].map((slotIndex) => (
                  <button
                    key={`history-slot-${slotIndex}`}
                    type="button"
                    onClick={() =>
                      onLoadHistoryEntryIntoPartySlot(selectedEntry.id, slotIndex)
                    }
                  >
                    Slot {slotIndex + 1}
                  </button>
                ))}
              </div>
            </article>
          ) : null}
        </>
      )}
    </section>
  );
}