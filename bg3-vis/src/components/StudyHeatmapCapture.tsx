import { useEffect, useRef } from "react";
import { logHeatmapPointerEvent } from "../logic/studyLogger";
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
  scrollDeltaThresholdPx?: number;
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
  lastScrollX: number;
  lastScrollY: number;
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
  const pageX = event.pageX;
  const pageY = event.pageY;

  return {
    target: getTargetForLogging(targetElement),
    pointerType: event.pointerType || "unknown",
    button: event.button,
    viewportX: Math.round(event.clientX),
    viewportY: Math.round(event.clientY),
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    viewportWidth,
    viewportHeight,
    documentWidth,
    documentHeight,
    scrollX: Math.round(window.scrollX),
    scrollY: Math.round(window.scrollY),
    viewportXNorm: round(clamp01(event.clientX / viewportWidth)),
    viewportYNorm: round(clamp01(event.clientY / viewportHeight)),
    documentXNorm: round(clamp01(pageX / documentWidth)),
    documentYNorm: round(clamp01(pageY / documentHeight)),
    sampleIntervalMs,
    dwellDurationMs,
  };
}

function buildScrollPayload(
  previousScrollX: number,
  previousScrollY: number,
  sampleIntervalMs: number
): HeatmapPointerPayload & {
  scrollDeltaX: number;
  scrollDeltaY: number;
  previousScrollX: number;
  previousScrollY: number;
} {
  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const documentWidth = getDocumentWidth() || 1;
  const documentHeight = getDocumentHeight() || 1;
  const scrollX = Math.round(window.scrollX);
  const scrollY = Math.round(window.scrollY);

  return {
    target: getWindowTargetForLogging(),
    pointerType: "scroll",
    button: -1,
    viewportX: 0,
    viewportY: 0,
    pageX: scrollX,
    pageY: scrollY,
    viewportWidth,
    viewportHeight,
    documentWidth,
    documentHeight,
    scrollX,
    scrollY,
    viewportXNorm: 0,
    viewportYNorm: 0,
    documentXNorm: round(clamp01(scrollX / documentWidth)),
    documentYNorm: round(clamp01(scrollY / documentHeight)),
    sampleIntervalMs,
    previousScrollX,
    previousScrollY,
    scrollDeltaX: scrollX - previousScrollX,
    scrollDeltaY: scrollY - previousScrollY,
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
  scrollDeltaThresholdPx = 8,
}: StudyHeatmapCaptureProps) {
  const lastPointerMoveAtRef = useRef(0);
  const hoverStateRef = useRef<HoverState | null>(null);
  const scrollStateRef = useRef<ScrollState>({
    lastLoggedAtMs: 0,
    lastScrollX: typeof window === "undefined" ? 0 : Math.round(window.scrollX),
    lastScrollY: typeof window === "undefined" ? 0 : Math.round(window.scrollY),
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
      const currentScrollX = Math.round(window.scrollX);
      const currentScrollY = Math.round(window.scrollY);
      const deltaX = Math.abs(currentScrollX - previousState.lastScrollX);
      const deltaY = Math.abs(currentScrollY - previousState.lastScrollY);
      const elapsedMs = now - previousState.lastLoggedAtMs;

      if (
        elapsedMs < scrollSampleIntervalMs ||
        (deltaX < scrollDeltaThresholdPx && deltaY < scrollDeltaThresholdPx)
      ) {
        return;
      }

      const payload = buildScrollPayload(
        previousState.lastScrollX,
        previousState.lastScrollY,
        scrollSampleIntervalMs
      );

      scrollStateRef.current = {
        lastLoggedAtMs: now,
        lastScrollX: currentScrollX,
        lastScrollY: currentScrollY,
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
    scrollDeltaThresholdPx,
  ]);

  return null;
}