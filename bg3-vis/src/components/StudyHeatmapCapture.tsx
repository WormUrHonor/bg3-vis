import { useEffect, useRef } from "react";
import { logHeatmapPointerEvent } from "../logic/studyLogger";
import type {
  HeatmapPointerEventType,
  HeatmapPointerPayload,
  HeatmapTargetForLogging,
} from "../types/loggingTypes";

type StudyHeatmapCaptureProps = {
  activeView?: string | null;
  enabled?: boolean;
  sampleIntervalMs?: number;
  hoverDwellThresholdMs?: number;
};

type HoverState = {
  target: Element;
  startedAtMs: number;
  payload: HeatmapPointerPayload;
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

function getNearestLabelText(element: Element): string | null {
  const label = element.closest("label");
  return cleanText(label?.textContent ?? null);
}

function getStableSelector(element: Element): string | null {
  const studyId = element.getAttribute("data-study-id");
  if (studyId) return `[data-study-id="${CSS.escape(studyId)}"]`;

  const studyElement = element.getAttribute("data-study-element");
  if (studyElement) return `[data-study-element="${CSS.escape(studyElement)}"]`;

  const studyRegion = element.getAttribute("data-study-region");
  if (studyRegion) {
    return `[data-study-region="${CSS.escape(studyRegion)}"] ${element.tagName.toLowerCase()}`;
  }

  const id = element.id;
  if (id) return `#${CSS.escape(id)}`;

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
    className: typeof htmlElement.className === "string" ? htmlElement.className || null : null,
    studyRegion: closestStudyRegion?.getAttribute("data-study-region") ?? null,
    studyElement: closestStudyElement?.getAttribute("data-study-element") ?? null,
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

function buildPointerPayload(
  event: PointerEvent,
  sampleIntervalMs?: number,
  hoverDurationMs?: number
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
    hoverDurationMs,
  };
}

export default function StudyHeatmapCapture({
  activeView = null,
  enabled = true,
  sampleIntervalMs = 250,
  hoverDwellThresholdMs = 500,
}: StudyHeatmapCaptureProps) {
  const lastPointerMoveAtRef = useRef(0);
  const hoverStateRef = useRef<HoverState | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    function logPointer(eventType: HeatmapPointerEventType, event: PointerEvent, hoverDurationMs?: number) {
      logHeatmapPointerEvent(eventType, buildPointerPayload(event, sampleIntervalMs, hoverDurationMs), {
        activeView,
      });
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
      logHeatmapPointerEvent("heatmap_click", buildPointerPayload(pointerLikeEvent), {
        activeView,
      });
    }

    function endHover(event: PointerEvent) {
      const hoverState = hoverStateRef.current;
      if (!hoverState) return;

      const duration = Date.now() - hoverState.startedAtMs;
      const endPayload = buildPointerPayload(event, sampleIntervalMs, duration);

      logHeatmapPointerEvent("heatmap_hover_end", endPayload, { activeView });

      if (duration >= hoverDwellThresholdMs) {
        logHeatmapPointerEvent(
          "heatmap_hover_dwell",
          {
            ...endPayload,
            dwellDurationMs: duration,
            hoverDurationMs: duration,
          },
          { activeView }
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

      logHeatmapPointerEvent("heatmap_hover_start", payload, { activeView });
    }

    function handlePointerOut(event: PointerEvent) {
      if (!hoverStateRef.current) return;

      const relatedTarget = event.relatedTarget;
      if (relatedTarget instanceof Node && hoverStateRef.current.target.contains(relatedTarget)) {
        return;
      }

      endHover(event);
    }

    function handleScroll() {
      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const documentWidth = getDocumentWidth() || 1;
      const documentHeight = getDocumentHeight() || 1;

      logHeatmapPointerEvent(
        "heatmap_scroll",
        {
          target: {
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
          },
          pointerType: "scroll",
          button: -1,
          viewportX: 0,
          viewportY: 0,
          pageX: Math.round(window.scrollX),
          pageY: Math.round(window.scrollY),
          viewportWidth,
          viewportHeight,
          documentWidth,
          documentHeight,
          scrollX: Math.round(window.scrollX),
          scrollY: Math.round(window.scrollY),
          viewportXNorm: 0,
          viewportYNorm: 0,
          documentXNorm: round(clamp01(window.scrollX / documentWidth)),
          documentYNorm: round(clamp01(window.scrollY / documentHeight)),
        },
        { activeView }
      );
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true });
    window.addEventListener("click", handleClick, { passive: true, capture: true });
    window.addEventListener("pointerover", handlePointerOver, { passive: true, capture: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true, capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, { capture: true });
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("pointerover", handlePointerOver, { capture: true });
      window.removeEventListener("pointerout", handlePointerOut, { capture: true });
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [activeView, enabled, hoverDwellThresholdMs, sampleIntervalMs]);

  return null;
}