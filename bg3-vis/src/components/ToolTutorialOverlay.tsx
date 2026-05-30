import { useEffect, useMemo, useState } from "react";
import { logStudyEvent } from "../logic/studyLogger";
import "./ToolTutorialOverlay.css";

type ToolTutorialOverlayProps = {
  activeView?: string | null;
  activeBuildLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

type TutorialStep = {
  title: string;
  targetSelector: string;
  placementHint: "left" | "right" | "top" | "bottom" | "center";
  body: string;
  instruction: string;
  whyItMatters: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    title: "Start here: create a party of four",
    targetSelector: '[data-study-region="workspace-page"]',
    placementHint: "center",
    body:
      "The study task is to create a full party of four characters. The tool is split into a build editor on the left and visual summaries on the right.",
    instruction:
      "You will create, save, and assign builds until the party feels complete.",
    whyItMatters:
      "The study is about how people use the visual summaries while exploring and revising a party composition.",
  },
  {
    title: "Use these tabs to edit the current build",
    targetSelector: '[data-study-region="planner-tabs"]',
    placementHint: "bottom",
    body:
      "The tabs divide the build editor into character setup, class and ability scores, and spells or class abilities.",
    instruction:
      "Move through the tabs when creating a character. You do not need to follow a strict order, but Character and Class & Scores usually come first.",
    whyItMatters:
      "These choices determine which abilities appear in the visualisation.",
  },
  {
    title: "This is the currently edited build",
    targetSelector: '[data-study-region="current-build-summary"]',
    placementHint: "right",
    body:
      "The Current Build panel shows the build that is currently active in the editor. This build also counts as one of the four party members.",
    instruction:
      "Check this panel when you are unsure which character you are editing.",
    whyItMatters:
      "A common mistake is to edit the wrong party member after switching between saved builds, slots, and aggregate view.",
  },
  {
    title: "Use New blank build when starting another character",
    targetSelector: '[data-study-id="new-blank-build-button"]',
    placementHint: "bottom",
    body:
      "This button clears the editor and lets you start from an empty build. It does not delete saved builds or assigned party slots.",
    instruction:
      "Use it after saving a character when you want to create a different party member from scratch.",
    whyItMatters:
      "Without this, users have to manually remove old choices, rename the build, and replace many fields.",
  },
  {
    title: "Save builds before assigning them",
    targetSelector: '[data-study-region="saved-builds-panel"]',
    placementHint: "right",
    body:
      "Saved Builds stores versions of characters you have created. Saved builds can be loaded, updated, deleted, or sent to a party slot.",
    instruction:
      "When a build seems useful, save it. Then send it to Slot 1, Slot 2, or Slot 3.",
    whyItMatters:
      "The party is made from the current editable build plus the three assigned slots.",
  },
  {
    title: "Use the build process view to revisit earlier versions",
    targetSelector: '[data-study-region="process-spiral-panel"]',
    placementHint: "right",
    body:
      "The Build Process panel shows saved or updated build versions as a visual history.",
    instruction:
      "Use it if you want to return to an earlier version, restore it, or assign it to a party slot.",
    whyItMatters:
      "This helps with exploratory work where you may try several directions before choosing one.",
  },
  {
    title: "The big circle summarises the focused build",
    targetSelector: '[data-study-region="main-data-circle-frame"]',
    placementHint: "left",
    body:
      "The large Data Circle summarises the build currently in focus. It shows combat range, ability roles, damage types, resources, and later damage per round if evaluation is used.",
    instruction:
      "Hover or click parts of the circle to inspect what each segment represents.",
    whyItMatters:
      "This is the main visual decision-support view. It helps you see what the build can do rather than reading every ability one by one.",
  },
  {
    title: "Highlights connect the circle to the ability list",
    targetSelector: '[data-study-region="spells-abilities-tab"]',
    placementHint: "right",
    body:
      "When a Data Circle segment is focused, matching spells and abilities in the editor can be highlighted.",
    instruction:
      "Use this to find which choices contribute to a role, damage type, range band, or other visual pattern.",
    whyItMatters:
      "This helps you move from noticing a pattern in the visualisation to changing the build.",
  },
  {
    title: "Switch between editable build and aggregate party view",
    targetSelector: '[data-study-region="focus-selector"]',
    placementHint: "right",
    body:
      "The focus selector controls what the big Data Circle shows. Editable shows the build you can currently modify. Aggregate shows the whole party together.",
    instruction:
      "Use Aggregate when you want to inspect the party as a whole. Switch back to Editable or a slot when you want to change a build.",
    whyItMatters:
      "Aggregate view is for review. Editing still happens through the normal build editor.",
  },
  {
    title: "The bottom row shows the party composition",
    targetSelector: '[data-study-region="party-dock"]',
    placementHint: "top",
    body:
      "The bottom row shows the aggregate party and the individual party members. Empty slots need saved builds assigned to them.",
    instruction:
      "Use the small circles to compare members and check whether the party is becoming balanced.",
    whyItMatters:
      "Your final result should be a party, not just one optimized character.",
  },
  {
    title: "Evaluate Build is optional unless instructed",
    targetSelector: '[data-study-id="evaluate-build-button"]',
    placementHint: "bottom",
    body:
      "Evaluate Build runs the simulator for the currently editable build. It can add damage-per-round information to the visualisation.",
    instruction:
      "Use it if you want performance feedback. Do not use it while viewing Aggregate, because Aggregate is a party preview.",
    whyItMatters:
      "Damage output is only one part of the build. The rest of the circle still matters for roles, range, resources, and utility.",
  },
  {
    title: "End and export when finished",
    targetSelector: '[data-study-region="study-logging-panel"]',
    placementHint: "right",
    body:
      "At the bottom of the left panel, the Study logging section lets you start and end the session. When you end, one JSONL file is downloaded.",
    instruction:
      "Enter your participant ID, click Start, use the tool, then click End & export when finished.",
    whyItMatters:
      "The exported file is what the researcher needs. Survey answers are collected separately.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getStepTarget(selector: string): HTMLElement | null {
  return document.querySelector(selector) as HTMLElement | null;
}

function getTutorialCardStyle(
  target: HTMLElement | null,
  placementHint: TutorialStep["placementHint"]
): React.CSSProperties {
  if (!target || placementHint === "center") {
    return {};
  }

  const rect = target.getBoundingClientRect();
  const cardWidth = Math.min(420, window.innerWidth - 32);
  const cardHeightEstimate = 380;
  const gap = 18;

  if (placementHint === "right") {
    return {
      left: clamp(rect.right + gap, 16, window.innerWidth - cardWidth - 16),
      top: clamp(rect.top, 16, window.innerHeight - cardHeightEstimate),
      transform: "none",
    };
  }

  if (placementHint === "left") {
    return {
      left: clamp(rect.left - cardWidth - gap, 16, window.innerWidth - cardWidth - 16),
      top: clamp(rect.top, 16, window.innerHeight - cardHeightEstimate),
      transform: "none",
    };
  }

  if (placementHint === "bottom") {
    return {
      left: clamp(rect.left + rect.width / 2 - cardWidth / 2, 16, window.innerWidth - cardWidth - 16),
      top: clamp(rect.bottom + gap, 16, window.innerHeight - cardHeightEstimate),
      transform: "none",
    };
  }

  return {
    left: clamp(rect.left + rect.width / 2 - cardWidth / 2, 16, window.innerWidth - cardWidth - 16),
    top: clamp(rect.top - cardHeightEstimate - gap, 16, window.innerHeight - cardHeightEstimate),
    transform: "none",
  };
}

export default function ToolTutorialOverlay({
  activeView = "tutorial",
  activeBuildLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: ToolTutorialOverlayProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return window.localStorage.getItem("bg3-tool-tutorial-seen") !== "true";
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStep = tutorialSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === tutorialSteps.length - 1;

  const cardStyle = useMemo(
    () => getTutorialCardStyle(targetElement, currentStep.placementHint),
    [targetElement, currentStep.placementHint, stepIndex]
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
        ...payload,
      },
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    const target = getStepTarget(currentStep.targetSelector);
    setTargetElement(target);

    document
      .querySelectorAll(".tool-tutorial-highlight-target")
      .forEach((element) =>
        element.classList.remove("tool-tutorial-highlight-target")
      );

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      window.setTimeout(() => {
        target.classList.add("tool-tutorial-highlight-target");
        setTargetElement(target);
      }, 260);
    }

    logTutorialEvent("tutorial_step_viewed", {
      targetFound: Boolean(target),
    });

    return () => {
      target?.classList.remove("tool-tutorial-highlight-target");
    };
  }, [isOpen, stepIndex]);

  function openTutorial() {
    setIsOpen(true);
    setStepIndex(0);

    logTutorialEvent("tutorial_opened", {
      openedFrom: "help_button",
    });
  }

  function closeTutorial(reason: "finished" | "dismissed") {
    window.localStorage.setItem("bg3-tool-tutorial-seen", "true");
    setIsOpen(false);

    document
      .querySelectorAll(".tool-tutorial-highlight-target")
      .forEach((element) =>
        element.classList.remove("tool-tutorial-highlight-target")
      );

    logTutorialEvent("tutorial_closed", {
      closeReason: reason,
      completedTutorial: reason === "finished",
    });
  }

  function goNext() {
    if (isLastStep) {
      closeTutorial("finished");
      return;
    }

    logTutorialEvent("tutorial_step_changed", {
      direction: "next",
      previousStepIndex: stepIndex,
      nextStepIndex: stepIndex + 1,
      previousStepTitle: currentStep.title,
      nextStepTitle: tutorialSteps[stepIndex + 1].title,
    });

    setStepIndex((current) => current + 1);
  }

  function goBack() {
    if (isFirstStep) return;

    logTutorialEvent("tutorial_step_changed", {
      direction: "back",
      previousStepIndex: stepIndex,
      nextStepIndex: stepIndex - 1,
      previousStepTitle: currentStep.title,
      nextStepTitle: tutorialSteps[stepIndex - 1].title,
    });

    setStepIndex((current) => current - 1);
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
          className="tool-tutorial-backdrop"
          data-study-region="tool-tutorial-overlay"
          data-study-id="tool-tutorial-overlay"
        >
          <section
            className={
              currentStep.placementHint === "center"
                ? "tool-tutorial-card tool-tutorial-card--center"
                : "tool-tutorial-card"
            }
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
                  onClick={() => {
                    logTutorialEvent("tutorial_step_changed", {
                      direction: "direct",
                      previousStepIndex: stepIndex,
                      nextStepIndex: index,
                      previousStepTitle: currentStep.title,
                      nextStepTitle: step.title,
                    });

                    setStepIndex(index);
                  }}
                  aria-label={`Go to tutorial step ${index + 1}`}
                  data-study-id={`tutorial-step-dot-${index + 1}`}
                />
              ))}
            </div>

            <main className="tool-tutorial-body">
              <span className="tool-tutorial-step-label">
                Step {stepIndex + 1} of {tutorialSteps.length}
              </span>

              <p>{currentStep.body}</p>

              <div className="tool-tutorial-instruction">
                <strong>What to do</strong>
                <span>{currentStep.instruction}</span>
              </div>

              <div className="tool-tutorial-hint">
                <strong>Why this matters</strong>
                <span>{currentStep.whyItMatters}</span>
              </div>
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
                data-study-id="tutorial-next-button"
              >
                {isLastStep ? "Start using the tool" : "Next"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}