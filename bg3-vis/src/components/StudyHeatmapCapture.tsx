import { useEffect, useRef } from "react";
import { logHeatmapPointerEvent, logStudyEvent } from "../logic/studyLogger";
import type {
  HeatmapPointerEventType,
  HeatmapPointerPayload,
  HeatmapTargetForLogging,
} from "../types/loggingTypes";

type StudyHeatmapCaptureProps = {
  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  activeVisualizationFocus?: unknown;
  partySnapshotHash?: string | null;
  enabled?: boolean;
  sampleIntervalMs?: number;
  hoverDwellThresholdMs?: number;
  scrollSampleIntervalMs?: number;
  scrollDeltaThresholdNorm?: number;
};

type HeatmapLoggingContext = {
  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  activeVisualizationFocus?: unknown;
  partySnapshotHash?: string | null;
};

type HoverState = {
  target: Element;
  startedAtMs: number;
  payload: HeatmapPointerPayload;
};

type ScrollState = {
  lastLoggedAtMs: number;
  lastScrollXNorm: number;
  lastScrollYNorm: number;
};

type DisplayProfile = {
  viewportWidth: number;
  viewportHeight: number;
  documentWidth: number;
  documentHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  viewportAspectRatio: number;
  screenAspectRatio: number;
  viewportOrientation: "horizontal" | "vertical" | "square-ish";
  screenOrientation: "horizontal" | "vertical" | "square-ish";
  viewportCategory:
    | "mobile-narrow"
    | "tablet-or-small-laptop"
    | "desktop"
    | "large-desktop";
  pointerAccuracy: "coarse" | "fine" | "unknown";
  hoverCapability: "hover" | "no-hover" | "unknown";
  maxTouchPoints: number;
  mobileLike: boolean;
};

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function getDocumentWidth(): number {
  return Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
    document.documentElement.clientWidth
  );
}

function getDocumentHeight(): number {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.clientHeight
  );
}

function getNormScrollX(documentWidth: number, viewportWidth: number): number {
  const maxScrollableX = Math.max(1, documentWidth - viewportWidth);
  return round(clamp01(window.scrollX / maxScrollableX));
}

function getNormScrollY(documentHeight: number, viewportHeight: number): number {
  const maxScrollableY = Math.max(1, documentHeight - viewportHeight);
  return round(clamp01(window.scrollY / maxScrollableY));
}

function getOrientation(
  width: number,
  height: number
): "horizontal" | "vertical" | "square-ish" {
  const ratio = width / Math.max(1, height);

  if (ratio > 1.18) return "horizontal";
  if (ratio < 0.85) return "vertical";
  return "square-ish";
}

function getViewportCategory(
  viewportWidth: number
): DisplayProfile["viewportCategory"] {
  if (viewportWidth < 768) return "mobile-narrow";
  if (viewportWidth < 1200) return "tablet-or-small-laptop";
  if (viewportWidth < 1800) return "desktop";
  return "large-desktop";
}

function getMediaQueryValue(query: string): boolean | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(query).matches;
}

function getDisplayProfile(): DisplayProfile {
  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const documentWidth = getDocumentWidth() || 1;
  const documentHeight = getDocumentHeight() || 1;
  const screenWidth = window.screen.width || viewportWidth;
  const screenHeight = window.screen.height || viewportHeight;

  const coarsePointer = getMediaQueryValue("(pointer: coarse)");
  const finePointer = getMediaQueryValue("(pointer: fine)");
  const canHover = getMediaQueryValue("(hover: hover)");
  const noHover = getMediaQueryValue("(hover: none)");
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;

  const pointerAccuracy =
    coarsePointer === true
      ? "coarse"
      : finePointer === true
        ? "fine"
        : "unknown";

  const hoverCapability =
    canHover === true ? "hover" : noHover === true ? "no-hover" : "unknown";

  const viewportCategory = getViewportCategory(viewportWidth);

  const mobileLike =
    viewportCategory === "mobile-narrow" ||
    maxTouchPoints > 0 ||
    coarsePointer === true ||
    noHover === true;

  return {
    viewportWidth,
    viewportHeight,
    documentWidth,
    documentHeight,
    screenWidth,
    screenHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportAspectRatio: round(viewportWidth / Math.max(1, viewportHeight)),
    screenAspectRatio: round(screenWidth / Math.max(1, screenHeight)),
    viewportOrientation: getOrientation(viewportWidth, viewportHeight),
    screenOrientation: getOrientation(screenWidth, screenHeight),
    viewportCategory,
    pointerAccuracy,
    hoverCapability,
    maxTouchPoints,
    mobileLike,
  };
}

function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;

  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return null;

  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
}

function safeCssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
}

function getNearestLabelText(element: Element): string | null {
  const label = element.closest("label");
  return cleanText(label?.textContent ?? null);
}

function getStableSelector(element: Element): string | null {
  const studyId = element.getAttribute("data-study-id");
  if (studyId) return `[data-study-id="${safeCssEscape(studyId)}"]`;

  const studyElement = element.getAttribute("data-study-element");
  if (studyElement) {
    return `[data-study-element="${safeCssEscape(studyElement)}"]`;
  }

  const studyRegion = element.getAttribute("data-study-region");
  if (studyRegion) {
    return `[data-study-region="${safeCssEscape(
      studyRegion
    )}"] ${element.tagName.toLowerCase()}`;
  }

  const id = element.id;
  if (id) return `#${safeCssEscape(id)}`;

  return element.tagName.toLowerCase();
}

function getTargetForLogging(element: Element): HeatmapTargetForLogging {
  const htmlElement = element as HTMLElement;
  const inputElement = element as HTMLInputElement;
  const closestStudyRegion = element.closest("[data-study-region]");
  const closestStudyElement = element.closest("[data-study-element]");
  const closestStudyId = element.closest("[data-study-id]");
  const interactive = element.closest(
    "button, a, input, select, textarea, summary, [role='button'], [tabindex]"
  );

  return {
    tagName: element.tagName.toLowerCase(),
    elementType: htmlElement.getAttribute("type"),
    inputType: element instanceof HTMLInputElement ? inputElement.type : null,
    role: htmlElement.getAttribute("role"),
    ariaLabel: htmlElement.getAttribute("aria-label"),
    title: htmlElement.getAttribute("title"),
    text: cleanText(htmlElement.innerText || htmlElement.textContent),
    id: htmlElement.id || null,
    className:
      typeof htmlElement.className === "string"
        ? htmlElement.className || null
        : null,
    studyRegion: closestStudyRegion?.getAttribute("data-study-region") ?? null,
    studyElement:
      closestStudyElement?.getAttribute("data-study-element") ?? null,
    studyId: closestStudyId?.getAttribute("data-study-id") ?? null,
    selector: getStableSelector(element),
    nearestLabelText: getNearestLabelText(element),
    isInteractive: Boolean(interactive),
    disabled:
      "disabled" in htmlElement
        ? Boolean((htmlElement as HTMLButtonElement | HTMLInputElement).disabled)
        : null,
  };
}

function getWindowTargetForLogging(): HeatmapTargetForLogging {
  return {
    tagName: "window",
    elementType: null,
    inputType: null,
    role: null,
    ariaLabel: null,
    title: null,
    text: null,
    id: null,
    className: null,
    studyRegion: "window",
    studyElement: "scroll",
    studyId: null,
    selector: "window",
    nearestLabelText: null,
    isInteractive: false,
    disabled: null,
  };
}

function buildPointerPayload(
  event: PointerEvent,
  sampleIntervalMs?: number,
  dwellDurationMs?: number
): HeatmapPointerPayload {
  const targetElement =
    event.target instanceof Element ? event.target : document.documentElement;

  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const documentWidth = getDocumentWidth() || 1;
  const documentHeight = getDocumentHeight() || 1;

  return {
    target: getTargetForLogging(targetElement),
    pointerType: event.pointerType || "unknown",
    button: event.button,

    viewportWidth,
    viewportHeight,
    documentWidth,
    documentHeight,
    viewportAspectRatio: round(viewportWidth / Math.max(1, viewportHeight)),
    viewportOrientation: getOrientation(viewportWidth, viewportHeight),
    viewportCategory: getViewportCategory(viewportWidth),

    viewportXNorm: round(clamp01(event.clientX / viewportWidth)),
    viewportYNorm: round(clamp01(event.clientY / viewportHeight)),
    documentXNorm: round(clamp01(event.pageX / documentWidth)),
    documentYNorm: round(clamp01(event.pageY / documentHeight)),
    scrollXNorm: getNormScrollX(documentWidth, viewportWidth),
    scrollYNorm: getNormScrollY(documentHeight, viewportHeight),

    sampleIntervalMs,
    dwellDurationMs,
  };
}

function buildScrollPayload(
  previousScrollXNorm: number,
  previousScrollYNorm: number,
  sampleIntervalMs: number
): HeatmapPointerPayload & {
  scrollDeltaXNorm: number;
  scrollDeltaYNorm: number;
  previousScrollXNorm: number;
  previousScrollYNorm: number;
} {
  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const documentWidth = getDocumentWidth() || 1;
  const documentHeight = getDocumentHeight() || 1;
  const scrollXNorm = getNormScrollX(documentWidth, viewportWidth);
  const scrollYNorm = getNormScrollY(documentHeight, viewportHeight);

  return {
    target: getWindowTargetForLogging(),
    pointerType: "scroll",
    button: -1,

    viewportWidth,
    viewportHeight,
    documentWidth,
    documentHeight,
    viewportAspectRatio: round(viewportWidth / Math.max(1, viewportHeight)),
    viewportOrientation: getOrientation(viewportWidth, viewportHeight),
    viewportCategory: getViewportCategory(viewportWidth),

    viewportXNorm: 0,
    viewportYNorm: 0,
    documentXNorm: scrollXNorm,
    documentYNorm: scrollYNorm,
    scrollXNorm,
    scrollYNorm,

    sampleIntervalMs,
    previousScrollXNorm,
    previousScrollYNorm,
    scrollDeltaXNorm: round(scrollXNorm - previousScrollXNorm),
    scrollDeltaYNorm: round(scrollYNorm - previousScrollYNorm),
  };
}

export default function StudyHeatmapCapture({
  activeView = null,
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  activeVisualizationFocus = null,
  partySnapshotHash = null,
  enabled = true,
  sampleIntervalMs = 250,
  hoverDwellThresholdMs = 500,
  scrollSampleIntervalMs = 250,
  scrollDeltaThresholdNorm = 0.01,
}: StudyHeatmapCaptureProps) {
  const lastPointerMoveAtRef = useRef(0);
  const hoverStateRef = useRef<HoverState | null>(null);
  const displayProfileLoggedRef = useRef(false);
  const scrollStateRef = useRef<ScrollState>({
    lastLoggedAtMs: 0,
    lastScrollXNorm:
      typeof window === "undefined"
        ? 0
        : getNormScrollX(getDocumentWidth(), window.innerWidth || 1),
    lastScrollYNorm:
      typeof window === "undefined"
        ? 0
        : getNormScrollY(getDocumentHeight(), window.innerHeight || 1),
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    function getHeatmapContext(): HeatmapLoggingContext {
      return {
        activeView,
        activeBuildId,
        activeBuildLabel,
        activePartyMemberIndex,
        activePartyMemberLabel,
        activeFocusSource,
        activeVisualizationFocus,
        partySnapshotHash,
      };
    }

    if (!displayProfileLoggedRef.current) {
      displayProfileLoggedRef.current = true;

      logStudyEvent({
        eventCategory: "heatmap",
        eventType: "heatmap_display_profile_captured",
        taskPhase: "initial_planning",
        activeView,
        activeBuildId,
        activeBuildLabel,
        activePartyMemberIndex,
        activePartyMemberLabel,
        activeFocusSource,
        activeVisualizationFocus,
        partySnapshotHash,
        payload: getDisplayProfile(),
        skipContextEnrichment: true,
      });
    }

    function logPointer(
      eventType: HeatmapPointerEventType,
      event: PointerEvent,
      dwellDurationMs?: number
    ) {
      logHeatmapPointerEvent(
        eventType,
        buildPointerPayload(event, sampleIntervalMs, dwellDurationMs),
        getHeatmapContext()
      );
    }

    function handlePointerMove(event: PointerEvent) {
      const now = Date.now();

      if (now - lastPointerMoveAtRef.current < sampleIntervalMs) return;

      lastPointerMoveAtRef.current = now;
      logPointer("heatmap_pointer_move", event);
    }

    function handlePointerDown(event: PointerEvent) {
      logPointer("heatmap_pointer_down", event);
    }

    function handleClick(event: MouseEvent) {
      const pointerLikeEvent = event as unknown as PointerEvent;

      logHeatmapPointerEvent(
        "heatmap_click",
        buildPointerPayload(pointerLikeEvent, sampleIntervalMs),
        getHeatmapContext()
      );
    }

    function endHover(event: PointerEvent) {
      const hoverState = hoverStateRef.current;
      if (!hoverState) return;

      const duration = Date.now() - hoverState.startedAtMs;
      const endPayload = buildPointerPayload(
        event,
        sampleIntervalMs,
        duration
      );

      logHeatmapPointerEvent(
        "heatmap_hover_end",
        endPayload,
        getHeatmapContext()
      );

      if (duration >= hoverDwellThresholdMs) {
        logHeatmapPointerEvent(
          "heatmap_hover_dwell",
          {
            ...endPayload,
            dwellDurationMs: duration,
          },
          getHeatmapContext()
        );
      }

      hoverStateRef.current = null;
    }

    function handlePointerOver(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;

      if (hoverStateRef.current?.target === event.target) return;

      if (hoverStateRef.current) {
        endHover(event);
      }

      const payload = buildPointerPayload(event, sampleIntervalMs);

      hoverStateRef.current = {
        target: event.target,
        startedAtMs: Date.now(),
        payload,
      };

      logHeatmapPointerEvent(
        "heatmap_hover_start",
        payload,
        getHeatmapContext()
      );
    }

    function handlePointerOut(event: PointerEvent) {
      if (!hoverStateRef.current) return;

      const relatedTarget = event.relatedTarget;
      if (
        relatedTarget instanceof Node &&
        hoverStateRef.current.target.contains(relatedTarget)
      ) {
        return;
      }

      endHover(event);
    }

    function handleScroll() {
      const now = Date.now();
      const previousState = scrollStateRef.current;

      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const documentWidth = getDocumentWidth() || 1;
      const documentHeight = getDocumentHeight() || 1;

      const currentScrollXNorm = getNormScrollX(documentWidth, viewportWidth);
      const currentScrollYNorm = getNormScrollY(documentHeight, viewportHeight);

      const deltaXNorm = Math.abs(
        currentScrollXNorm - previousState.lastScrollXNorm
      );
      const deltaYNorm = Math.abs(
        currentScrollYNorm - previousState.lastScrollYNorm
      );
      const elapsedMs = now - previousState.lastLoggedAtMs;

      if (
        elapsedMs < scrollSampleIntervalMs ||
        (deltaXNorm < scrollDeltaThresholdNorm &&
          deltaYNorm < scrollDeltaThresholdNorm)
      ) {
        return;
      }

      const payload = buildScrollPayload(
        previousState.lastScrollXNorm,
        previousState.lastScrollYNorm,
        scrollSampleIntervalMs
      );

      scrollStateRef.current = {
        lastLoggedAtMs: now,
        lastScrollXNorm: currentScrollXNorm,
        lastScrollYNorm: currentScrollYNorm,
      };

      logHeatmapPointerEvent(
        "heatmap_scroll",
        payload,
        getHeatmapContext()
      );
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
      capture: true,
    });
    window.addEventListener("click", handleClick, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerover", handlePointerOver, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerout", handlePointerOut, {
      passive: true,
      capture: true,
    });
    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, {
        capture: true,
      });
      window.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("click", handleClick, {
        capture: true,
      });
      window.removeEventListener("pointerover", handlePointerOver, {
        capture: true,
      });
      window.removeEventListener("pointerout", handlePointerOut, {
        capture: true,
      });
      window.removeEventListener("scroll", handleScroll, {
        capture: true,
      });
    };
  }, [
    activeView,
    activeBuildId,
    activeBuildLabel,
    activePartyMemberIndex,
    activePartyMemberLabel,
    activeFocusSource,
    activeVisualizationFocus,
    partySnapshotHash,
    enabled,
    hoverDwellThresholdMs,
    sampleIntervalMs,
    scrollSampleIntervalMs,
    scrollDeltaThresholdNorm,
  ]);

  return null;
}