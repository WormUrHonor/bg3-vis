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
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
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
  opacity: number;
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

function getSpiralNodes(
  buildHistory: BuildHistoryEntry[],
  isExpanded: boolean
): SpiralNode[] {
  const sortedHistory = getSortedHistory(buildHistory);

  const maxVisibleNodes = isExpanded ? 42 : 18;
  const visibleHistory = sortedHistory.slice(0, maxVisibleNodes);

  const maxSize = isExpanded ? 132 : 78;
  const minSize = isExpanded ? 38 : 24;

  return visibleHistory.map((entry, index) => {
    /*
      This creates a tightening spiral:
      - newest version starts large and near the outer/top-left curve
      - older versions move around the spiral and become smaller
      - distance grows slowly while size shrinks, so it reads as a descending process trail
    */
    const angle = -2.35 + index * 0.66;
    const distance = isExpanded ? 7 + index * 2.05 : 6 + index * 2.75;

    const shrinkRatio =
      visibleHistory.length <= 1 ? 0 : index / (visibleHistory.length - 1);

    const size = Math.max(
      minSize,
      maxSize - Math.pow(shrinkRatio, 0.72) * (maxSize - minSize)
    );

    return {
      entry,
      index,
      x: 50 + Math.cos(angle) * distance,
      y: 50 + Math.sin(angle) * distance,
      size,
      opacity: Math.max(0.48, 1 - shrinkRatio * 0.38),
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
  isExpanded = false,
  onExpand,
  onCollapse,
  onLoadHistoryEntry,
  onLoadHistoryEntryIntoPartySlot,
}: ProcessSpiralPanelProps) {
  const nodes = useMemo(
    () => getSpiralNodes(buildHistory, isExpanded),
    [buildHistory, isExpanded]
  );

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
    <section
      className={
        isExpanded
          ? "process-spiral-panel process-spiral-panel--expanded"
          : "process-spiral-panel"
      }
      aria-label="Build process spiral"
    >
      <div className="process-spiral-header">
        <div>
          <h3>Build Process</h3>
          <p>Historical versions across all saved builds.</p>
        </div>

        <div className="process-spiral-header-actions">
          <span>{buildHistory.length}</span>

          {isExpanded ? (
            <button type="button" onClick={onCollapse}>
              Back
            </button>
          ) : (
            <button type="button" onClick={onExpand}>
              Enlarge
            </button>
          )}
        </div>
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
                  id={
                    isExpanded
                      ? "processSpiralStrokeExpanded"
                      : "processSpiralStroke"
                  }
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgba(255,222,158,0.9)" />
                  <stop offset="48%" stopColor="rgba(170,91,255,0.78)" />
                  <stop offset="100%" stopColor="rgba(93,178,255,0.5)" />
                </linearGradient>

                <filter
                  id={
                    isExpanded
                      ? "processSpiralGlowExpanded"
                      : "processSpiralGlow"
                  }
                >
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g className="process-spiral-grid">
                {Array.from({ length: isExpanded ? 12 : 8 }, (_, index) => (
                  <line
                    key={`process-grid-x-${index}`}
                    x1={index * (100 / (isExpanded ? 11 : 7))}
                    y1="0"
                    x2={index * (100 / (isExpanded ? 11 : 7))}
                    y2="100"
                  />
                ))}

                {Array.from({ length: isExpanded ? 10 : 7 }, (_, index) => (
                  <line
                    key={`process-grid-y-${index}`}
                    x1="0"
                    y1={index * (100 / (isExpanded ? 9 : 6))}
                    x2="100"
                    y2={index * (100 / (isExpanded ? 9 : 6))}
                  />
                ))}
              </g>

              <path
                d={spiralPath}
                className={
                  isExpanded
                    ? "process-spiral-line process-spiral-line--expanded"
                    : "process-spiral-line"
                }
                fill="none"
              />
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
                    opacity: node.opacity,
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
                      onLoadHistoryEntryIntoPartySlot(
                        selectedEntry.id,
                        slotIndex
                      )
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