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
    does: "For this study, create a party of 4 characters.",
    action:
      "After this tutorial, build your party of 4, fill the three small party slots, keep the fourth character in the large focus circle, then click End & export.",
    note:
      "If you have questions, contact the researcher at sinkovichana@gmail.com.",
    requiredMessage: "Required: click End & Export at the end of the study.",
    requiredAcknowledgementLabel:
      "I understand that my final party must have 4 characters: 3 assigned builds plus 1 focus build.",
  },
  {
    title: "Build a party of four",
    targetSelector: '[data-study-region="workspace-page"]',
    placementHint: "center",
    does:
      "Your party is made from four characters: three assigned party slots plus the current editable focus build.",
    action:
      "Create characters, save finished builds when needed, assign three saved builds to the small party slots, and keep the fourth character as the current editable build.",
    note:
      "The editable build shown in the large focus circle counts as one party member.",
  },
  {
    title: "Use the editor tabs",
    targetSelector: '[data-study-region="planner-tabs"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-character"]',
    placementHint: "bottom",
    requestedTab: "character",
    requestEditableFocus: true,
    does: "The editor tabs split character creation into three parts.",
    action:
      "Use Character first, then Class & Scores, then Actions & Passives. You can return to earlier tabs at any time.",
  },
  {
    title: "Character tab",
    targetSelector: '[data-study-region="build-editor-panel"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-character"]',
    placementHint: "right",
    requestedTab: "character",
    requestEditableFocus: true,
    does:
      "This tab sets the character name, race, background, class, and skills.",
    action:
      "Choose a class and give the character a clear name so you can recognize it later.",
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
      "Use it to shape the character before selecting spells, actions, or passives.",
  },
  {
    title: "Actions & Passives tab",
    targetSelector: '[data-study-region="spells-abilities-tab"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-spellsAbilities"]',
    placementHint: "left",
    requestedTab: "spellsAbilities",
    requestEditableFocus: true,
    does:
      "This tab contains selectable spells, actions, passives, toggles, and features.",
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
      "Use it when you want the optimal rotation and estimated damage-per-round information.",
    note:
      "This is optional. The rest of the tool still works without simulation.",
  },
  {
    title: "Read the Data Circle",
    targetSelector: '[data-study-region="main-data-circle-frame"]',
    secondaryTargetSelector: '[data-study-id="planner-tab-spellsAbilities"]',
    placementHint: "left",
    requestedTab: "spellsAbilities",
    requestEditableFocus: true,
    does:
      "The large Data Circle, or focus circle, summarizes the focused build or selected party view.",
    action:
      "Use it to inspect range, role distribution, damage types, damage preview, and possible party gaps or overlap.",
    note:
      "When three party slots are filled, the current editable build in this large focus circle is the fourth party member.",
    layerLegend: [
      {
        label: "Combat Range Profile",
        description:
          "Shows whether abilities are self, melee, mid-range, or long-range.",
      },
      {
        label: "Ability Role Distribution",
        description:
          "Shows what the build can do, such as damage, control, support, defence, healing, or mobility.",
      },
      {
        label: "Damage Type Profile",
        description:
          "Shows which damage types the build can access, such as fire, force, radiant, or weapon damage.",
      },
      {
        label: "Damage Preview",
        description:
          "Shows possible damage values for abilities when available.",
      },
      {
        label: "Rotation and DPR Simulation",
        description:
          "After simulation, the outer layer can show the suggested rotation and damage-per-round.",
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
    does: "Hovering previews a segment. Clicking keeps it selected.",
    action:
      "Click a role, range band, damage type, or ability to keep it highlighted.",
    note: "Related abilities in the editor can become highlighted.",
  },
  {
    title: "Start another character",
    targetSelector: '[data-study-id="new-blank-build-button"]',
    placementHint: "bottom",
    requestEditableFocus: true,
    does:
      "New blank build clears only the current editor so you can make another character.",
    action:
      "Use it after saving or assigning a character when you want to create the next one.",
    note: "Saved builds, assigned party slots, and study logs are kept.",
  },
  {
    title: "Saved builds",
    targetSelector: '[data-study-region="saved-builds-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does:
      "Saved Builds stores characters so they can be reused, restored, or assigned to the party.",
    action:
      "When a character is finished, save it so it appears as a saved-build card.",
    note:
      "Saving stores the build, but assigning it to the party is a separate step.",
  },
  {
    title: "Assign saved builds to slots",
    targetSelector:
      '[data-study-region="saved-build-send-to-party"], [data-study-region="saved-builds-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does:
      "Saved-build cards can be sent to the three small party slots.",
    action:
      "Click Send to Party 1, 2, or 3 to fill Slot 1, Slot 2, and Slot 3.",
    note:
      "Your final party is Slot 1 + Slot 2 + Slot 3 + the current focus build = 4 characters.",
  },
  {
    title: "Use build history",
    targetSelector: '[data-study-region="process-spiral-panel"]',
    placementHint: "right",
    scrollTarget: true,
    does: "Build Process shows saved and updated versions.",
    action:
      "Load, restore, or assign earlier versions if you want to return to them.",
    note: "This can help when trying several build directions.",
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
    note: "Aggregate is the combined party view.",
  },
  {
    title: "Review the party",
    targetSelector: '[data-study-region="party-dock"]',
    placementHint: "safeTopRight",
    scrollTarget: false,
    requestEditableFocus: true,
    does: "The party dock shows the aggregate party and each party member.",
    action:
      "Before finishing, check that all three small party slots are filled and that the current focus build is the fourth character.",
    note: "The final party must have 4 characters total.",
  },
  {
    title: "Required: End & export",
    targetSelector: '[data-study-region="study-logging-panel"]',
    placementHint: "safeTopRight",
    scrollTarget: true,
    does: "End & export is the required final step.",
    action:
      "When the 4-character party is finished, click End & export. Then complete the post-task survey and send the downloaded ZIP file to the researcher.",
    note:
      "The study is not finished until the ZIP file has been exported and sent.",
    requiredMessage:
      "Before finishing: make sure you created 4 characters, assigned 3 saved builds to the small party circles, kept the 4th character in the large focus circle, and clicked End & export.",
    requiredAcknowledgementLabel:
      "I understand that I must click End & export and send the downloaded ZIP file via Dropbox.",
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
  const [isOpen, setIsOpen] = useState(false);
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
    function handlePreTaskSurveyCompleted() {
      window.localStorage.removeItem("bg3-tool-tutorial-seen");
      setStepIndex(0);
      setIsTransitioning(false);
      setHasAcknowledgedStudyLogging(false);
      setIsOpen(true);

      logTutorialEvent("tutorial_opened", {
        openedFrom: "pre_task_survey_completed",
      });
    }

    window.addEventListener(
      "bg3-pre-task-survey-completed",
      handlePreTaskSurveyCompleted
    );

    return () => {
      window.removeEventListener(
        "bg3-pre-task-survey-completed",
        handlePreTaskSurveyCompleted
      );
    };
  }, []);

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