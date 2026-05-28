import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
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
  onRestoreHistoryEntryAsSavedBuild: (historyEntryId: string) => void;
};

type SpiralNode = {
  entry: BuildHistoryEntry;
  index: number;
  x: number;
  y: number;
  sizePercent: number;
  opacity: number;
  zIndex: number;
};

type RingSpec = {
  capacity: number;
  radiusX: number;
  radiusY: number;
  sizePercent: number;
  angleOffset: number;
};

type ViewportState = {
  zoom: number;
  panX: number;
  panY: number;
};

type DragState = {
  pointerId: number;
  lastX: number;
  lastY: number;
  startedAtX: number;
  startedAtY: number;
  hasMoved: boolean;
};

const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
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

function getRingSpecs(isExpanded: boolean): RingSpec[] {
  if (isExpanded) {
    return [
      {
        capacity: 6,
        radiusX: 17,
        radiusY: 14,
        sizePercent: 8.1,
        angleOffset: -88,
      },
      {
        capacity: 9,
        radiusX: 29,
        radiusY: 23,
        sizePercent: 6.2,
        angleOffset: -65,
      },
      {
        capacity: 12,
        radiusX: 40,
        radiusY: 31,
        sizePercent: 4.8,
        angleOffset: -42,
      },
      {
        capacity: 16,
        radiusX: 46,
        radiusY: 37,
        sizePercent: 3.8,
        angleOffset: -20,
      },
    ];
  }

  return [
    {
      capacity: 5,
      radiusX: 21,
      radiusY: 17,
      sizePercent: 9.8,
      angleOffset: -90,
    },
    {
      capacity: 8,
      radiusX: 33,
      radiusY: 27,
      sizePercent: 6.7,
      angleOffset: -56,
    },
    {
      capacity: 10,
      radiusX: 42,
      radiusY: 35,
      sizePercent: 5,
      angleOffset: -22,
    },
  ];
}

function getRingForIndex(indexAfterCenter: number, rings: RingSpec[]) {
  let remaining = indexAfterCenter;

  for (let ringIndex = 0; ringIndex < rings.length; ringIndex += 1) {
    const ring = rings[ringIndex];

    if (remaining < ring.capacity) {
      return {
        ring,
        ringIndex,
        slotIndex: remaining,
      };
    }

    remaining -= ring.capacity;
  }

  const lastRing = rings[rings.length - 1];

  return {
    ring: lastRing,
    ringIndex: rings.length - 1,
    slotIndex: lastRing.capacity - 1,
  };
}

function getVisibleCapacity(isExpanded: boolean) {
  const rings = getRingSpecs(isExpanded);
  return 1 + rings.reduce((sum, ring) => sum + ring.capacity, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSpiralNodes(
  buildHistory: BuildHistoryEntry[],
  isExpanded: boolean
): SpiralNode[] {
  const sortedHistory = getSortedHistory(buildHistory);
  const visibleHistory = sortedHistory.slice(0, getVisibleCapacity(isExpanded));
  const count = visibleHistory.length;

  if (count === 0) return [];

  const rings = getRingSpecs(isExpanded);
  const centerX = 50;
  const centerY = isExpanded ? 43 : 44;

  return visibleHistory.map((entry, index) => {
    if (index === 0) {
      return {
        entry,
        index,
        x: centerX,
        y: centerY,
        sizePercent: isExpanded ? 13.2 : 20.5,
        opacity: 1,
        zIndex: 2000,
      };
    }

    const { ring, ringIndex, slotIndex } = getRingForIndex(index - 1, rings);

    const usedBeforeThisRing =
      1 +
      rings
        .slice(0, ringIndex)
        .reduce((sum, previousRing) => sum + previousRing.capacity, 0);

    const remainingVisibleInThisRing = Math.max(0, count - usedBeforeThisRing);
    const actualSlotsInRing = Math.min(ring.capacity, remainingVisibleInThisRing);

    const step = 360 / actualSlotsInRing;
    const angle = ((ring.angleOffset + slotIndex * step) * Math.PI) / 180;
    const altitudeDrop = ringIndex * (isExpanded ? 2.1 : 2.6);

    return {
      entry,
      index,
      x: centerX + Math.cos(angle) * ring.radiusX,
      y: centerY + Math.sin(angle) * ring.radiusY + altitudeDrop,
      sizePercent: ring.sizePercent,
      opacity: Math.max(0.52, 1 - index * 0.018),
      zIndex: 1600 - index,
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

function MiniHistoryCircle({ entry }: { entry: BuildHistoryEntry }) {
  return (
    <DataCircle
      buildName={entry.snapshot.buildName}
      characterName={entry.snapshot.characterName}
      selectedClass={entry.snapshot.selectedClass}
      selectedSubclass={entry.snapshot.selectedSubclass}
      selectedLevel={entry.snapshot.selectedLevel}
      selectedSpellIds={entry.snapshot.selectedSpellIds}
      fixedClassFeatureIds={getFixedClassFeatureIdsForSnapshot(entry.snapshot)}
      selectedClassFeatureIds={entry.snapshot.selectedClassFeatureIds}
      activeClassFeatureIds={entry.snapshot.activeClassFeatureIds}
      showDprLayer={false}
      variant="party"
    />
  );
}

export default function ProcessSpiralPanel({
  buildHistory,
  isExpanded = false,
  onExpand,
  onCollapse,
  onLoadHistoryEntry,
  onLoadHistoryEntryIntoPartySlot,
  onRestoreHistoryEntryAsSavedBuild,
}: ProcessSpiralPanelProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const zoomAnimationTimeoutRef = useRef<number | null>(null);

  const nodes = useMemo(
    () => getSpiralNodes(buildHistory, isExpanded),
    [buildHistory, isExpanded]
  );

  const spiralPath = useMemo(() => getSpiralPath(nodes), [nodes]);

  const [selectedHistoryEntryId, setSelectedHistoryEntryId] = useState<
    string | null
  >(null);

  const [hoveredHistoryEntryId, setHoveredHistoryEntryId] = useState<
    string | null
  >(null);

  const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isViewportAnimating, setIsViewportAnimating] = useState(false);

  const selectedEntry = useMemo(() => {
    if (!selectedHistoryEntryId) return nodes[0]?.entry ?? null;

    return (
      nodes.find((node) => node.entry.id === selectedHistoryEntryId)?.entry ??
      nodes[0]?.entry ??
      null
    );
  }, [nodes, selectedHistoryEntryId]);

  const hoveredEntry = useMemo(() => {
    if (!hoveredHistoryEntryId) return null;

    return (
      nodes.find((node) => node.entry.id === hoveredHistoryEntryId)?.entry ??
      null
    );
  }, [nodes, hoveredHistoryEntryId]);

  const previewEntry = hoveredEntry ?? selectedEntry;

  const hiddenCount = Math.max(0, buildHistory.length - nodes.length);
  const maxZoom = isExpanded ? 8 : 5;
  const minZoom = 0.62;

  useEffect(() => {
    setViewport(DEFAULT_VIEWPORT);
    setDragState(null);
    setIsViewportAnimating(false);
  }, [isExpanded]);

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

  useEffect(() => {
    return () => {
      if (zoomAnimationTimeoutRef.current !== null) {
        window.clearTimeout(zoomAnimationTimeoutRef.current);
      }
    };
  }, []);

  function brieflyAnimateViewport(duration = 190) {
    setIsViewportAnimating(true);

    if (zoomAnimationTimeoutRef.current !== null) {
      window.clearTimeout(zoomAnimationTimeoutRef.current);
    }

    zoomAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsViewportAnimating(false);
    }, duration);
  }

  function zoomAtPoint(
    multiplier: number,
    clientX?: number,
    clientY?: number,
    shouldAnimate = true
  ) {
    const stage = stageRef.current;

    setViewport((current) => {
      const nextZoom = clamp(current.zoom * multiplier, minZoom, maxZoom);

      if (!stage || nextZoom === current.zoom) {
        return {
          ...current,
          zoom: nextZoom,
        };
      }

      const rect = stage.getBoundingClientRect();

      const pointerX =
        clientX !== undefined ? clientX - rect.left : rect.width / 2;

      const pointerY =
        clientY !== undefined ? clientY - rect.top : rect.height / 2;

      const offsetX = pointerX - rect.width / 2;
      const offsetY = pointerY - rect.height / 2;

      const worldX = (offsetX - current.panX) / current.zoom;
      const worldY = (offsetY - current.panY) / current.zoom;

      return {
        zoom: nextZoom,
        panX: offsetX - worldX * nextZoom,
        panY: offsetY - worldY * nextZoom,
      };
    });

    if (shouldAnimate) {
      brieflyAnimateViewport();
    }
  }

  function changeZoom(multiplier: number) {
    zoomAtPoint(multiplier, undefined, undefined, true);
  }

  function resetViewport() {
    brieflyAnimateViewport(220);
    setViewport(DEFAULT_VIEWPORT);
    setDragState(null);
  }

  function focusSelectedVersion() {
    if (!selectedEntry) return;

    const selectedNode = nodes.find((node) => node.entry.id === selectedEntry.id);
    const stage = stageRef.current;

    if (!selectedNode || !stage) return;

    const rect = stage.getBoundingClientRect();
    const targetZoom = isExpanded ? 2.45 : 2.2;

    const worldX = ((selectedNode.x - 50) / 100) * rect.width;
    const worldY = ((selectedNode.y - 50) / 100) * rect.height;

    brieflyAnimateViewport(260);

    setViewport({
      zoom: targetZoom,
      panX: -worldX * targetZoom,
      panY: -worldY * targetZoom,
    });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();

    const trackpadFineControl = Math.abs(event.deltaY) < 40;
    const baseIntensity = trackpadFineControl ? 1.045 : 1.15;
    const multiplier = event.deltaY < 0 ? baseIntensity : 1 / baseIntensity;

    zoomAtPoint(multiplier, event.clientX, event.clientY, true);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsViewportAnimating(false);

    setDragState({
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      startedAtX: event.clientX,
      startedAtY: event.clientY,
      hasMoved: false,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.lastX;
    const deltaY = event.clientY - dragState.lastY;

    const totalMoveX = event.clientX - dragState.startedAtX;
    const totalMoveY = event.clientY - dragState.startedAtY;
    const hasMoved =
      dragState.hasMoved || Math.hypot(totalMoveX, totalMoveY) > 3;

    setViewport((current) => ({
      ...current,
      panX: current.panX + deltaX,
      panY: current.panY + deltaY,
    }));

    setDragState({
      ...dragState,
      lastX: event.clientX,
      lastY: event.clientY,
      hasMoved,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragState?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragState(null);
    }
  }

  return (
    <section
      className={
        isExpanded
          ? "process-spiral-panel process-spiral-panel--expanded"
          : "process-spiral-panel"
      }
      aria-label="Build process spiral"
    >
      <div className="process-spiral-topbar">
        <div className="process-spiral-title-block">
          <h3>Build Process</h3>
          <p>Historical versions across all saved builds.</p>
        </div>

        <div className="process-spiral-topbar-controls">
          <span className="process-spiral-count">{buildHistory.length}</span>

          <button type="button" onClick={() => changeZoom(1.34)}>
            +
          </button>

          <button type="button" onClick={() => changeZoom(1 / 1.34)}>
            −
          </button>

          <button type="button" onClick={focusSelectedVersion}>
            Focus
          </button>

          <button type="button" onClick={resetViewport}>
            Reset
          </button>

          <span className="process-spiral-zoom">
            {Math.round(viewport.zoom * 100)}%
          </span>

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
          <div
            ref={stageRef}
            className={[
              "process-spiral-stage",
              dragState ? "process-spiral-stage--dragging" : "",
              isViewportAnimating ? "process-spiral-stage--animating" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className="process-spiral-world"
              style={{
                transform: `translate3d(${viewport.panX}px, ${viewport.panY}px, 0) scale(${viewport.zoom})`,
              }}
            >
              <svg
                viewBox="0 0 100 100"
                className="process-spiral-backdrop"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient
                    id={
                      isExpanded
                        ? "processMountainGlowExpanded"
                        : "processMountainGlow"
                    }
                    cx="50%"
                    cy="43%"
                    r="58%"
                  >
                    <stop offset="0%" stopColor="rgba(255,222,158,0.22)" />
                    <stop offset="45%" stopColor="rgba(176,119,214,0.09)" />
                    <stop offset="100%" stopColor="rgba(93,178,255,0)" />
                  </radialGradient>

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
                    <stop offset="0%" stopColor="rgba(255,222,158,0.94)" />
                    <stop offset="44%" stopColor="rgba(174,100,255,0.8)" />
                    <stop offset="100%" stopColor="rgba(93,178,255,0.48)" />
                  </linearGradient>

                  <filter
                    id={
                      isExpanded
                        ? "processSpiralGlowExpanded"
                        : "processSpiralGlow"
                    }
                  >
                    <feGaussianBlur stdDeviation="1.25" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill={
                    isExpanded
                      ? "url(#processMountainGlowExpanded)"
                      : "url(#processMountainGlow)"
                  }
                />

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
                const isHovered = hoveredHistoryEntryId === node.entry.id;

                return (
                  <button
                    key={node.entry.id}
                    type="button"
                    className={[
                      "process-spiral-node",
                      isSelected ? "process-spiral-node--selected" : "",
                      isHovered ? "process-spiral-node--hovered" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      width: `${node.sizePercent}%`,
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      opacity: node.opacity,
                      zIndex: isHovered ? 5000 : isSelected ? 3500 : node.zIndex,
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseEnter={() => setHoveredHistoryEntryId(node.entry.id)}
                    onMouseLeave={() => setHoveredHistoryEntryId(null)}
                    onFocus={() => setHoveredHistoryEntryId(node.entry.id)}
                    onBlur={() => setHoveredHistoryEntryId(null)}
                    onClick={() => setSelectedHistoryEntryId(node.entry.id)}
                    onDoubleClick={() => {
                      setSelectedHistoryEntryId(node.entry.id);
                      window.setTimeout(focusSelectedVersion, 0);
                    }}
                    title={getHistoryLabel(node.entry)}
                  >
                    <span className="process-spiral-node-index">
                      {node.index + 1}
                    </span>

                    <MiniHistoryCircle entry={node.entry} />
                  </button>
                );
              })}
            </div>

            {isExpanded && previewEntry ? (
              <div className="process-spiral-loupe process-spiral-loupe--expanded">
                <div className="process-spiral-loupe-circle">
                  <MiniHistoryCircle entry={previewEntry} />
                </div>

                <div className="process-spiral-loupe-caption">
                  <span>
                    {hoveredEntry ? "Hovered version" : "Selected version"}
                  </span>
                  <strong>{getHistoryLabel(previewEntry)}</strong>
                </div>
              </div>
            ) : null}

            {hiddenCount > 0 ? (
              <div className="process-spiral-hidden-count">
                +{hiddenCount} older versions
              </div>
            ) : null}
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

                <button
                  type="button"
                  onClick={() =>
                    onRestoreHistoryEntryAsSavedBuild(selectedEntry.id)
                  }
                >
                  Restore
                </button>

                {[0, 1, 2].map((slotIndex) => (
                  <button
                    key={`history-slot-${slotIndex}`}
                    type="button"
                    title={`Assign to party slot ${slotIndex + 1}`}
                    onClick={() =>
                      onLoadHistoryEntryIntoPartySlot(
                        selectedEntry.id,
                        slotIndex
                      )
                    }
                  >
                    {slotIndex + 1}
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