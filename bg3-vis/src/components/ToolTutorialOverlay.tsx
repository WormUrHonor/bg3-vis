import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { logStudyEvent } from "../logic/studyLogger";
import "./ToolTutorialOverlay.css";

type TutorialRequestedTab = "character" | "classScores" | "spellsAbilities";

type ToolTutorialOverlayProps = {
  activeView?: string | null;
  activeBuildLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
  onRequestTab?: (tabId: TutorialRequestedTab) => void;
  onRequestEditableFocus?: () => void;
};

type HighlightRect = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type TutorialStep = {
  title: string;
  targetSelector: string;
  secondaryTargetSelector?: string;
  placementHint:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "center"
    | "safeTopRight";
  requestedTab?: TutorialRequestedTab;

  requestEditableFocus?: boolean;
  scrollTarget?: boolean;
  does: string;
  action: string;
  note?: string;
  requiredMessage?: string;
  requiredAcknowledgementLabel?: string;
  layerLegend?: Array<{
    label: string;
    description: string;
  }>;
};

const tutorialSteps: TutorialStep[] = [
    {
    title: "How to participate in the study",
    targetSelector: '[data-study-region="workspace-page"]',
    placementHint: "center",
    does: 
    "Read the tutorial carefully. For this study you must create a party of 4 charachters, one MUST be a level 12 wizard. The study takes approximately 30-45 minutes, there is no time limit.",
       action:
      "Complete the tutorial -> click start at the bottom of the current build window -> complete pre-task survey -> create a party of four -> assign party members to the bottom three slots and keep the fourth in the large focus circle -> click end & export -> complete the post task survey -> send the downloaded ZIP file to the researcher.",
   
    note: "If you have any questions about the study, please contact the researcher at +31644437745 or via email at sinkovichana@gmail.com I will respond immedietly and am happy to help! :)",
  },
  {
    title: "Build a party of four",
    targetSelector: '[data-study-region="workspace-page"]',
    placementHint: "center",
    does:
      "The party has four characters: the current editable build plus three saved builds assigned to slots.",
    action:
      "Create a build, save it, assign it to a slot, then start another build.",
    note: "The editable build is always included as one party member.",
  },
  {
    title: "Use the editor tabs",
    targetSelector: '[data-study-region="planner-tabs"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-character"]',
    placementHint: "bottom",
    requestedTab: "character",
    requestEditableFocus: true,
    does:
      "The tabs split character creation into three parts.",
    action:
      "Use Character first, then Class & Scores, then the Actions & Passives tab.",
    note: "You can return to any tab later.",
  },
  {
    title: "Character tab",
    targetSelector: '[data-study-region="build-editor-panel"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-character"]',
    placementHint: "right",
    requestedTab: "character",
    requestEditableFocus: true,
    does:
      "This tab sets build name, race, background, class, and skills.",
    action: "Choose a class and give the build a clear name.",
    note: "The class controls which later options appear.",
  },
  {
    title: "Class & Scores tab",
    targetSelector: '[data-study-region="build-editor-panel"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-classScores"]',
    placementHint: "right",
    requestedTab: "classScores",
    requestEditableFocus: true,
    does:
      "This tab sets level, subclass, ability scores, feats, and class-specific choices.",
    action:
      "Use it to shape the character before selecting spells or actions.",
    note: "Level 12 exposes the largest option set.",
  },
  {
    title: "Actions & Passives tab",
    targetSelector: '[data-study-region="spells-abilities-tab"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-spellsAbilities"]',
    placementHint: "left",
    requestedTab: "spellsAbilities",
    requestEditableFocus: true,
    does:
      "This tab contains passives and selectable spells, actions, toggles, and features.",
    action:
      "Click icons to select or activate them. Hover icons to read details.",
    note: "Selected and active actions are used in the Data Circle.",
  },
  {
    title: "Simulate Build",
    targetSelector: '[data-study-id="evaluate-build-button"]',
    placementHint: "bottom",
    requestEditableFocus: true,
    does:
      "Simulate Build runs an external simulator for the current editable build.",
    action:
      "Use it when you want estimated damage-per-round information.",
    note: "This is optional. The tool still works without simulation.",
  },
  {
    title: "Read the Data Circle",
    targetSelector: '[data-study-region="main-data-circle-frame"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-spellsAbilities"]',
    placementHint: "left",
    requestedTab: "spellsAbilities",
    requestEditableFocus: true,
    does: "The large Data Circle summarises the focused build profile.",
action:
  "",
layerLegend: [
  {
    label: "Combat Range Profile",
    description:
      "Shows whether abilities are self, melee, mid-range, or long-range.",
  },
  {
    label: "Ability Role Distribution",
    description:
      "Shows what the build can do: damage, control, support, defence, healing, or mobility.",
  },
  {
    label: "Damage Type Profile",
    description:
      "Shows which damage types the build can access, such as fire, force, radiant, or weapon damage.",
  },
    {
    label: "Damage Preview",
    description:
      "Shows the possible damage of each ability. The average and the minimum-to-maximum range",
  },
  {
    label: "Rotation and DPR Simulation",
    description:
      "After simulation, the outermost circle shows the optimal rotation and the damage-per-round.",
  },
    {
    label: "Icons",
    description:
      "Icons mark the individual spells, actions, and features represented in the circle.",
  },

],
  },
  {
    title: "Inspect circle segments",
    targetSelector: '[data-study-region="main-data-circle-frame"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-spellsAbilities"]',
    placementHint: "left",
    requestedTab: "spellsAbilities",
    requestEditableFocus: true,
    does:
      "Hovering previews a segment. Clicking keeps it selected.",
    action:
      "Click a role, range band, damage type, or ability to keep it highlighted.",
    note: "Related abilities in the editor can become highlighted.",
  },
  {
    title: "Start a new build",
    targetSelector: '[data-study-id="new-blank-build-button"]',
    placementHint: "bottom",
    requestEditableFocus: true,
    does: "New blank build clears only the current editor.",
    action:
      "Use it after saving a character when you want to create another one.",
    note: "Saved builds, assigned slots, and logs are kept.",
  },
  {
    title: "Save builds",
    targetSelector: '[data-study-region="saved-builds-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does:
      "Saved Builds stores characters after you click Save current build.",
    action:
      "Create a character, save it, and it will appear as a saved-build card.",
    note:
      "Saving stores the build, but does not automatically assign it to the party.",
  },
  {
    title: "Assign saved builds to slots",
    targetSelector:
      '[data-study-region="saved-build-send-to-party"], [data-study-region="saved-builds-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does:
      "Each saved-build card has Send to Party buttons labelled 1, 2, and 3.",
    action:
      "Click 1, 2, or 3 to send that saved build to party Slot 1, Slot 2, or Slot 3.",
    note:
      "If you do not see these buttons yet, save a build first. The numbered buttons are how the three party slots are filled.",
  },
  {
    title: "Use build history",
    targetSelector: '[data-study-region="process-spiral-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does: "Build Process shows saved and updated versions.",
    action:
      "Load, restore, or assign earlier versions if you want to return to them.",
    note: "This is useful when trying several build directions.",
  },
  {
    title: "Switch focus",
    targetSelector: '[data-study-region="focus-selector"]',
    placementHint: "right",
    scrollTarget: true,
    does:
      "The focus selector changes what the large Data Circle displays.",
    action:
      "Use Editable for the current build, Aggregate for the combined party, or Slot buttons for assigned members.",
    note: "Aggregate is the overall combined party view.",
  },
  {
    title: "Review the party",
    targetSelector: '[data-study-region="party-dock"]',
    placementHint: "safeTopRight",
    scrollTarget: false,
    requestEditableFocus: true,
    does:
      "The party dock shows the aggregate party and each party member.",
    action:
      "Use it to compare members and inspect the full party composition.",
    note: "Empty slots need saved builds assigned to them.",
  },
  {
    title: "Required: start and export the study log",
    targetSelector: '[data-study-region="study-logging-panel"]',
    placementHint: "safeTopRight",
    scrollTarget: true,
    does:
      "The study log only records the party-building task correctly if it is started before the participant begins building.",
    action:
      "Before starting the task, enter the participant ID and click Start. When the party is finished, click End & export and send the downloaded ZIP file to the researcher.",
    note:
      "Thank very much for paricipating in the study! :) <3",
    requiredMessage:
      "Do not begin building before clicking Start. When finished, click End & export and send the downloaded JSONL file to the researcher.",
    requiredAcknowledgementLabel:
      "I understand that I must click Start before beginning the task, and click End & export when I finish.",
  },
];

const STEP_CHANGE_DELAY_MS = 90;
const POST_SCROLL_MEASURE_DELAY_MS = 520;
const NO_SCROLL_MEASURE_DELAY_MS = 120;
const TRANSITION_END_DELAY_MS = 220;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getElement(selector?: string): HTMLElement | null {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
}

function isScrollable(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;

  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight
  );
}

function getScrollableParents(element: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let parent = element.parentElement;

  while (parent) {
    if (isScrollable(parent)) {
      parents.push(parent);
    }

    parent = parent.parentElement;
  }

  return parents;
}

function scrollTargetIntoView(element: HTMLElement) {
  const scrollableParents = getScrollableParents(element);

  for (const parent of scrollableParents) {
    const parentRect = parent.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();

    const offset =
      targetRect.top -
      parentRect.top -
      parent.clientHeight / 2 +
      targetRect.height / 2;

    parent.scrollTo({
      top: parent.scrollTop + offset,
      behavior: "smooth",
    });
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
}

function getHighlightRect(element: HTMLElement, id: string): HighlightRect {
  const rect = element.getBoundingClientRect();

  return {
    id,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function rectsOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function estimateCardHeight(step: TutorialStep) {
  let height = 214;

  if (step.note) height += 34;
  if (step.layerLegend) height += Math.min(250, step.layerLegend.length * 38);
  if (step.requiredMessage) height += 132;

  return Math.min(height, window.innerHeight - 32);
}

function getCandidatePosition(
  rect: DOMRect,
  placement: TutorialStep["placementHint"],
  cardWidth: number,
  cardHeight: number,
  gap: number
) {
  if (placement === "safeTopRight") {
    return {
      left: window.innerWidth - cardWidth - 18,
      top: 18,
    };
  }

  if (placement === "right") {
    return {
      left: rect.right + gap,
      top: rect.top + rect.height / 2 - cardHeight / 2,
    };
  }

  if (placement === "left") {
    return {
      left: rect.left - cardWidth - gap,
      top: rect.top + rect.height / 2 - cardHeight / 2,
    };
  }

  if (placement === "top") {
    return {
      left: rect.left + rect.width / 2 - cardWidth / 2,
      top: rect.top - cardHeight - gap,
    };
  }

  return {
    left: rect.left + rect.width / 2 - cardWidth / 2,
    top: rect.bottom + gap,
  };
}

function getCardStyle(
  target: HTMLElement | null,
  step: TutorialStep
): CSSProperties {
  const viewportPadding = 16;
  const cardWidth = Math.min(
    step.layerLegend ? 430 : step.requiredMessage ? 430 : 370,
    window.innerWidth - viewportPadding * 2
  );
  const cardHeight = estimateCardHeight(step);
  const gap = 18;

  if (!target || step.placementHint === "center") {
    return {
      left: "50%",
      top: "50%",
      width: cardWidth,
      transform: "translate(-50%, -50%)",
    };
  }

  const rect = target.getBoundingClientRect();
  const preferredPlacements: TutorialStep["placementHint"][] =
    step.placementHint === "safeTopRight"
      ? ["safeTopRight"]
      : [
          step.placementHint,
          "right",
          "left",
          "bottom",
          "top",
          "safeTopRight",
        ];

  const targetBox = {
    left: rect.left - 8,
    top: rect.top - 8,
    right: rect.right + 8,
    bottom: rect.bottom + 8,
  };

  for (const placement of preferredPlacements) {
    if (placement === "center") continue;

    const candidate = getCandidatePosition(
      rect,
      placement,
      cardWidth,
      cardHeight,
      gap
    );

    const left = clamp(
      candidate.left,
      viewportPadding,
      window.innerWidth - cardWidth - viewportPadding
    );

    const top = clamp(
      candidate.top,
      viewportPadding,
      window.innerHeight - cardHeight - viewportPadding
    );

    const cardBox = {
      left,
      top,
      right: left + cardWidth,
      bottom: top + cardHeight,
    };

    if (placement === "safeTopRight" || !rectsOverlap(cardBox, targetBox)) {
      return {
        left,
        top,
        width: cardWidth,
        transform: "none",
      };
    }
  }

  return {
    right: viewportPadding,
    top: viewportPadding,
    width: cardWidth,
    transform: "none",
  };
}

export default function ToolTutorialOverlay({
  activeView = "tutorial",
  activeBuildLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
  onRequestTab,
  onRequestEditableFocus,
}: ToolTutorialOverlayProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return window.localStorage.getItem("bg3-tool-tutorial-seen") !== "true";
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([]);
  const [positionRevision, setPositionRevision] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasAcknowledgedStudyLogging, setHasAcknowledgedStudyLogging] =
    useState(false);

  const currentStep = tutorialSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === tutorialSteps.length - 1;
  const isRequiredStep = Boolean(currentStep.requiredMessage);
  const canFinishRequiredStep = !isRequiredStep || hasAcknowledgedStudyLogging;

  const cardStyle = useMemo(
    () => getCardStyle(targetElement, currentStep),
    [targetElement, currentStep, positionRevision]
  );

  function logTutorialEvent(eventType: string, payload: Record<string, unknown>) {
    logStudyEvent({
      eventCategory: "navigation",
      eventType,
      taskPhase: "exploration",
      activeView,
      activeBuildLabel,
      activeFocusSource,
      partySnapshotHash,
      payload: {
        sourceComponent: "ToolTutorialOverlay",
        stepIndex,
        stepNumber: stepIndex + 1,
        totalSteps: tutorialSteps.length,
        stepTitle: currentStep.title,
        targetSelector: currentStep.targetSelector,
        secondaryTargetSelector: currentStep.secondaryTargetSelector ?? null,
        ...payload,
      },
    });
  }

  function updateHighlights() {
    const primary = getElement(currentStep.targetSelector);
    const secondary = getElement(currentStep.secondaryTargetSelector);

    const nextRects: HighlightRect[] = [];

    if (primary) {
      nextRects.push(getHighlightRect(primary, "primary"));
    }

    if (secondary && secondary !== primary) {
      nextRects.push(getHighlightRect(secondary, "secondary"));
    }

    setTargetElement(primary);

    if (nextRects.length > 0) {
      setHighlightRects(nextRects);
    } else {
      setHighlightRects([]);
    }

    setPositionRevision((value) => value + 1);
  }

  function changeStep(
    nextStepIndex: number,
    direction: "next" | "back" | "direct"
  ) {
    if (nextStepIndex === stepIndex) return;

    logTutorialEvent("tutorial_step_changed", {
      direction,
      previousStepIndex: stepIndex,
      nextStepIndex,
      previousStepTitle: currentStep.title,
      nextStepTitle: tutorialSteps[nextStepIndex].title,
    });

    setIsTransitioning(true);

    window.setTimeout(() => {
      setStepIndex(nextStepIndex);

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, TRANSITION_END_DELAY_MS);
    }, STEP_CHANGE_DELAY_MS);
  }

  useEffect(() => {
    if (!isOpen) return;

    if (currentStep.requestedTab) {
      onRequestTab?.(currentStep.requestedTab);
    }

    if (currentStep.requestEditableFocus) {
      onRequestEditableFocus?.();
    }

    const timeoutId = window.setTimeout(() => {
      const target = getElement(currentStep.targetSelector);

      if (target && currentStep.scrollTarget !== false) {
        scrollTargetIntoView(target);
      }

      window.setTimeout(
        updateHighlights,
        currentStep.scrollTarget === false
          ? NO_SCROLL_MEASURE_DELAY_MS
          : POST_SCROLL_MEASURE_DELAY_MS
      );

      logTutorialEvent("tutorial_step_viewed", {
        targetFound: Boolean(target),
      });
    }, 140);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updateHighlights();

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOpen, stepIndex]);

  function openTutorial() {
    setIsOpen(true);
    setStepIndex(0);
    setIsTransitioning(false);
    setHasAcknowledgedStudyLogging(false);

    logTutorialEvent("tutorial_opened", {
      openedFrom: "help_button",
    });
  }

function closeTutorial(reason: "finished" | "dismissed") {
  if (reason === "finished" && isRequiredStep && !hasAcknowledgedStudyLogging) {
    logTutorialEvent("tutorial_required_acknowledgement_missing", {
      attemptedCloseReason: reason,
    });
    return;
  }

  window.localStorage.setItem("bg3-tool-tutorial-seen", "true");

  if (reason === "finished") {
    onRequestEditableFocus?.();
    onRequestTab?.("character");
  }

  setIsOpen(false);
  setHighlightRects([]);
  setTargetElement(null);
  setIsTransitioning(false);

  logTutorialEvent("tutorial_closed", {
    closeReason: reason,
    completedTutorial: reason === "finished",
    acknowledgedStudyLogging: hasAcknowledgedStudyLogging,
    finalRequestedTab: reason === "finished" ? "character" : null,
  });
}

  function goNext() {
    if (isLastStep) {
      closeTutorial("finished");
      return;
    }

    changeStep(stepIndex + 1, "next");
  }

  function goBack() {
    if (isFirstStep) return;

    changeStep(stepIndex - 1, "back");
  }

  function handleRequiredAcknowledgement(checked: boolean) {
    setHasAcknowledgedStudyLogging(checked);

    logTutorialEvent("tutorial_required_acknowledgement_changed", {
      checked,
    });
  }

  return (
    <>
      <button
        type="button"
        className="tool-tutorial-help-button"
        onClick={openTutorial}
        data-study-region="tutorial-help-button"
        data-study-id="open-tool-tutorial"
      >
        How to use
      </button>

      {isOpen ? (
        <div
          className={[
            "tool-tutorial-backdrop",
            isRequiredStep ? "tool-tutorial-backdrop--required" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-study-region="tool-tutorial-overlay"
          data-study-id="tool-tutorial-overlay"
        >
          {highlightRects.map((rect) => (
            <div
              key={rect.id}
              className={`tool-tutorial-spotlight tool-tutorial-spotlight--${rect.id} ${
                isTransitioning ? "tool-tutorial-spotlight--transitioning" : ""
              }`}
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          ))}

          <section
            className={[
              "tool-tutorial-card",
              isRequiredStep ? "tool-tutorial-card--required" : "",
              isTransitioning ? "tool-tutorial-card--transitioning" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={cardStyle}
            role="dialog"
            aria-modal="true"
          >
            <header className="tool-tutorial-header">
              <div>
                <p>Guided tutorial</p>
                <h2>{currentStep.title}</h2>
              </div>

              <button
                type="button"
                className="tool-tutorial-close"
                onClick={() => closeTutorial("dismissed")}
                aria-label="Close tutorial"
                data-study-id="close-tool-tutorial"
              >
                ×
              </button>
            </header>

            <div className="tool-tutorial-progress">
              {tutorialSteps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  className={
                    index === stepIndex
                      ? "tool-tutorial-dot tool-tutorial-dot--active"
                      : index < stepIndex
                        ? "tool-tutorial-dot tool-tutorial-dot--seen"
                        : "tool-tutorial-dot"
                  }
                  onClick={() => changeStep(index, "direct")}
                  aria-label={`Go to tutorial step ${index + 1}`}
                  data-study-id={`tutorial-step-dot-${index + 1}`}
                />
              ))}
            </div>

            <main className="tool-tutorial-body">
              <span className="tool-tutorial-step-label">
                Step {stepIndex + 1} of {tutorialSteps.length}
              </span>

              <div className="tool-tutorial-text-block">
                <strong>What it does</strong>
                <p>{currentStep.does}</p>
              </div>

              <div className="tool-tutorial-text-block">
                <strong>How to use it</strong>
                <p>{currentStep.action}</p>
              </div>

              {currentStep.note ? (
                <div className="tool-tutorial-note">
                  <strong>Note</strong>
                  <p>{currentStep.note}</p>
                </div>
              ) : null}

              {currentStep.requiredMessage ? (
                <div className="tool-tutorial-required-warning">
                  <div className="tool-tutorial-required-warning-label">
                    Required for the study
                  </div>

                  <p>{currentStep.requiredMessage}</p>

                  <label className="tool-tutorial-required-check">
                    <input
                      type="checkbox"
                      checked={hasAcknowledgedStudyLogging}
                      onChange={(event) =>
                        handleRequiredAcknowledgement(event.target.checked)
                      }
                    />
                    <span>
                      {currentStep.requiredAcknowledgementLabel ??
                        "I understand this instruction."}
                    </span>
                  </label>
                </div>
              ) : null}

              {currentStep.layerLegend ? (
                <div className="tool-tutorial-layer-list">
                  {currentStep.layerLegend.map((layer) => (
                    <div key={layer.label}>
                      <strong>{layer.label}</strong>
                      <span>{layer.description}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </main>

            <footer className="tool-tutorial-footer">
              <button
                type="button"
                className="tool-tutorial-secondary"
                onClick={goBack}
                disabled={isFirstStep}
                data-study-id="tutorial-back-button"
              >
                Back
              </button>

              <button
                type="button"
                className="tool-tutorial-primary"
                onClick={goNext}
                disabled={isLastStep && !canFinishRequiredStep}
                data-study-id="tutorial-next-button"
              >
                {isLastStep ? "I understand" : "Next"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}