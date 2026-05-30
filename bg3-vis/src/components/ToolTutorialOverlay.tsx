import { useState } from "react";
import { logStudyEvent } from "../logic/studyLogger";
import "./ToolTutorialOverlay.css";

type ToolTutorialOverlayProps = {
  activeView?: string | null;
  activeBuildLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

const tutorialSteps = [
  {
    title: "Goal of the task",
    body:
      "Your goal is to create a party of four characters. The currently edited build counts as one party member. The three smaller party slots can be filled with saved builds.",
    hint:
      "You do not need to find a perfect answer. Use the tool to explore, compare, and adjust your party.",
  },
  {
    title: "Create one build at a time",
    body:
      "Use the tabs on the left to define a character. Start with Character, then Class & Scores, then Spells & Abilities. The Current Build panel shows the build currently being edited.",
    hint:
      "Selections update the visualisation automatically.",
  },
  {
    title: "Read the main Data Circle",
    body:
      "The large circle on the right summarises the current build. It shows combat range, ability roles, damage types, resources, and, after evaluation, damage per round.",
    hint:
      "Hover or click parts of the circle to highlight related spells and abilities.",
  },
  {
    title: "Save builds before assigning them",
    body:
      "When you are happy with a build, use Saved Builds to save it. Saved builds can then be loaded again, updated, deleted, or assigned to a party slot.",
    hint:
      "Saving versions also creates a build history in the Build Process panel.",
  },
  {
    title: "Build the full party",
    body:
      "Assign saved builds to Slot 1, Slot 2, and Slot 3. Together with the currently edited build, these form the party of four.",
    hint:
      "The small circles at the bottom show each party member and the aggregate party view.",
  },
  {
    title: "Use the aggregate view",
    body:
      "Click Aggregate to inspect the whole party at once. This helps you see whether the party has gaps, overlaps, or a strong balance of damage, utility, range, and resources.",
    hint:
      "Aggregate is a preview, so switch back to Editable or a party slot to make changes.",
  },
  {
    title: "End the study and export",
    body:
      "When you are finished, go to the Study logging panel and click End & export. This downloads one JSONL file. Send that file to the researcher.",
    hint:
      "The file contains interaction logs only. Open survey answers are handled separately.",
  },
];

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
  const currentStep = tutorialSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === tutorialSteps.length - 1;

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
        ...payload,
      },
    });
  }

  function openTutorial() {
    setIsOpen(true);
    logTutorialEvent("tutorial_opened", {
      openedFrom: "help_button",
    });
  }

  function closeTutorial(reason: "finished" | "dismissed") {
    window.localStorage.setItem("bg3-tool-tutorial-seen", "true");
    setIsOpen(false);

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
          <section className="tool-tutorial-card" role="dialog" aria-modal="true">
            <header className="tool-tutorial-header">
              <div>
                <p>Quick guide</p>
                <h2>How to use the BG3 party planner</h2>
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

              <h3>{currentStep.title}</h3>
              <p>{currentStep.body}</p>

              <div className="tool-tutorial-hint">
                <strong>Tip</strong>
                <span>{currentStep.hint}</span>
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