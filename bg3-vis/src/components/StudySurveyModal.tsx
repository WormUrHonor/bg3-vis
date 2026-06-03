import { useMemo, useState } from "react";
import "./StudySurveyModal.css";

export type StudySurveyMode = "pre" | "post";

export type StudySurveyAnswers = Record<string, string | Record<string, string>>;

export type StudySurveySubmission = {
  surveySchemaVersion: "bg3-build-planner-survey-v1";
  mode: StudySurveyMode;
  participantId: string;
  submittedAt: string;
  submittedAtMs: number;
  consent?: {
    requiredConsent: boolean;
    anonymizedQuotesConsent: boolean;
    dataReuseConsent: boolean;
  };
  answers: StudySurveyAnswers;
};

type StudySurveyModalProps = {
  mode: StudySurveyMode;
  participantId: string;
  onSubmit: (submission: StudySurveySubmission) => void;
  onCancel: () => void;
};

type ScaleChoice = {
  value: string;
  label: string;
};

type MatrixRow = {
  id: string;
  label: string;
};

type ConditionalTextQuestion = {
  choiceId: string;
  questionId: string;
  label: string;
};

const agreementScale: ScaleChoice[] = [
  { value: "1", label: "Strongly disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neither" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly agree" },
];

const familiarityScale: ScaleChoice[] = [
  { value: "1", label: "Not familiar" },
  { value: "2", label: "Familiar" },
  { value: "3", label: "Very familiar" },
];

const frequencyScale: ScaleChoice[] = [
  { value: "1", label: "Never" },
  { value: "2", label: "Rarely" },
  { value: "3", label: "Sometimes" },
  { value: "4", label: "Often" },
  { value: "5", label: "Very often" },
];

const priorityOptions: ScaleChoice[] = [
  { value: "damage_combat_performance", label: "Damage or combat performance" },
  { value: "survivability", label: "Survivability" },
  { value: "party_balance", label: "Party balance" },
  { value: "clear_party_roles", label: "Clear party roles" },
  { value: "roleplay_fantasy", label: "Roleplaying or character fantasy" },
  {
    value: "narrative_strength",
    label: "Narrative strength, such as dialogue options or story usefulness",
  },
  { value: "experimentation", label: "Experimentation" },
  { value: "ease_of_use", label: "Ease of use during actual play" },
  { value: "versatility", label: "Versatility across different situations" },
  { value: "other", label: "Other" },
];

const finalFactorOptions: ScaleChoice[] = [
  ...priorityOptions,
  {
    value: "visualization_observation",
    label: "Something I noticed in the visualization",
  },
  {
    value: "prior_bg3_knowledge",
    label: "Something I already knew about BG3",
  },
];

const familiarityRows: MatrixRow[] = [
  { id: "bg3", label: "Baldur’s Gate 3" },
  {
    id: "dnd_or_rpg_systems",
    label: "Dungeons & Dragons or similar roleplaying (RPG) systems",
  },
  { id: "build_planning", label: "Character build planning in games" },
  {
    id: "charts_visual_summaries",
    label: "Charts, visual summaries, or dashboards",
  },
];

const explorationRows: MatrixRow[] = [
  {
    id: "exploration_iteration_overall",
    label:
      "The tool supported exploration and iteration by making it easier to try, revise, compare, revisit, and consider different party or build ideas.",
  },
];

const reasoningRows: MatrixRow[] = [
  {
    id: "final_party_confidence",
    label: "I am confident in the quality of the final party I created.",
  },
  {
    id: "reasoning_tradeoffs_party_overall",
    label:
      "I could explain my final party choice, including its strengths, weaknesses, trade-offs, and overall party balance.",
  },
  {
    id: "balanced_autonomous_decision",
    label:
      "The tool helped me balance performance with other goals without pushing me toward one “best” or purely optimized choice.",
  },
];

const visualizationRows: MatrixRow[] = [
  {
    id: "understood_visualization",
    label: "I understood what the main visualization was showing.",
  },
  {
    id: "noticed_party_patterns",
    label:
      "The visualization helped me notice patterns across party members, such as overlap, gaps, or imbalance.",
  },
  {
    id: "interactive_explanation",
    label:
      "The interactivity improved the usability of the tool and my understanding of the build choices.",
  },
  {
    id: "readable",
    label: "The visualization was readable enough for the task.",
  },
];

const experienceRows: MatrixRow[] = [
  {
    id: "appropriate_for_bg3",
    label: "The tool felt appropriate for planning a Baldur’s Gate 3 party.",
  },
  {
    id: "visual_style_fit",
    label: "The visual style fit the game context.",
  },
  {
    id: "engaging_creative_exploration",
    label:
      "Using the tool made build planning feel more engaging, creative, and exploratory than usual.",
  },
];

const openTextRows: MatrixRow[] = [
  {
    id: "supported_exploration",
    label:
      "What part of the tool most helped exploration, creativity, comparison, or iteration, and why?",
  },
  {
    id: "blocked_exploration",
    label:
      "What part of the tool most blocked exploration, creativity, comparison, or iteration, and why?",
  },
  {
    id: "changed_normal_planning",
    label:
      "How, if at all, did using the tool differ from how you would normally plan a party or character build?",
  },
  {
    id: "first_change",
    label:
      "What, if anything, would you change, add, or remove to improve the tool and the data visualization?",
  },
];

const optionalTextAnswerIds = [
  "optional_comments",
  "build_priorities_other",
  "final_party_main_factor_other",
  "final_party_main_factor_visualization_observation",
];

function getMatrixAnswer(
  answers: StudySurveyAnswers,
  questionId: string,
  rowId: string
): string {
  const answer = answers[questionId];

  if (!answer || typeof answer === "string") return "";

  return answer[rowId] ?? "";
}

function getMultiChoiceAnswer(
  answers: StudySurveyAnswers,
  questionId: string
): Record<string, string> {
  const answer = answers[questionId];

  if (!answer || typeof answer === "string") return {};

  return answer;
}

function hasSingleAnswer(
  answers: StudySurveyAnswers,
  questionId: string
): boolean {
  const answer = answers[questionId];

  return typeof answer === "string" && answer.trim() !== "";
}

function hasTextAnswers(
  answers: StudySurveyAnswers,
  rows: MatrixRow[]
): boolean {
  return rows.every((row) => hasSingleAnswer(answers, row.id));
}

function hasMultiAnswer(
  answers: StudySurveyAnswers,
  questionId: string
): boolean {
  const answer = getMultiChoiceAnswer(answers, questionId);

  return Object.values(answer).some((value) => value === "true");
}

function hasMatrixAnswers(
  answers: StudySurveyAnswers,
  questionId: string,
  rows: MatrixRow[]
): boolean {
  return rows.every((row) => getMatrixAnswer(answers, questionId, row.id) !== "");
}

function MatrixBlock({
  title,
  description,
  questionId,
  rows,
  scale,
  answers,
  onChange,
}: {
  title: string;
  description?: string;
  questionId: string;
  rows: MatrixRow[];
  scale: ScaleChoice[];
  answers: StudySurveyAnswers;
  onChange: (questionId: string, rowId: string, value: string) => void;
}) {
  return (
    <section className="study-survey-section">
      <h3>{title}</h3>
      {description ? (
        <p className="study-survey-section-note">{description}</p>
      ) : null}

      <div className="study-survey-matrix">
        <div
          className="study-survey-matrix-header"
          style={{
            gridTemplateColumns: `minmax(190px, 1.3fr) repeat(${scale.length}, minmax(72px, 1fr))`,
          }}
        >
          <span />
          {scale.map((choice) => (
            <span key={choice.value}>{choice.label}</span>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className="study-survey-matrix-row"
            style={{
              gridTemplateColumns: `minmax(190px, 1.3fr) repeat(${scale.length}, minmax(72px, 1fr))`,
            }}
          >
            <span className="study-survey-row-label">{row.label}</span>

            {scale.map((choice) => {
              const name = `${questionId}-${row.id}`;

              return (
                <label key={choice.value} className="study-survey-radio-cell">
                  <input
                    type="radio"
                    name={name}
                    value={choice.value}
                    checked={
                      getMatrixAnswer(answers, questionId, row.id) ===
                      choice.value
                    }
                    onChange={() => onChange(questionId, row.id, choice.value)}
                  />
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function SingleChoiceBlock({
  title,
  description,
  questionId,
  scale,
  answers,
  onChange,
}: {
  title: string;
  description?: string;
  questionId: string;
  scale: ScaleChoice[];
  answers: StudySurveyAnswers;
  onChange: (questionId: string, value: string) => void;
}) {
  const value = typeof answers[questionId] === "string" ? answers[questionId] : "";

  return (
    <section className="study-survey-section">
      <h3>{title}</h3>
      {description ? (
        <p className="study-survey-section-note">{description}</p>
      ) : null}

      <div className="study-survey-choice-list">
        {scale.map((choice) => (
          <label key={choice.value} className="study-survey-choice">
            <input
              type="radio"
              name={questionId}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(questionId, choice.value)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function MultiChoiceBlock({
  title,
  description,
  questionId,
  scale,
  answers,
  otherQuestionId,
  otherLabel = "Please specify.",
  conditionalTextQuestions = [],
  onToggle,
  onTextChange,
}: {
  title: string;
  description?: string;
  questionId: string;
  scale: ScaleChoice[];
  answers: StudySurveyAnswers;
  otherQuestionId?: string;
  otherLabel?: string;
  conditionalTextQuestions?: ConditionalTextQuestion[];
  onToggle: (questionId: string, choiceId: string, checked: boolean) => void;
  onTextChange: (questionId: string, value: string) => void;
}) {
  const selectedValues = getMultiChoiceAnswer(answers, questionId);
  const otherSelected = selectedValues.other === "true";
  const rawOtherValue = otherQuestionId ? answers[otherQuestionId] : "";
  const otherValue = typeof rawOtherValue === "string" ? rawOtherValue : "";

  return (
    <section className="study-survey-section">
      <h3>{title}</h3>
      {description ? (
        <p className="study-survey-section-note">{description}</p>
      ) : null}

      <div className="study-survey-choice-list">
        {scale.map((choice) => (
          <label key={choice.value} className="study-survey-choice">
            <input
              type="checkbox"
              name={`${questionId}-${choice.value}`}
              value={choice.value}
              checked={selectedValues[choice.value] === "true"}
              onChange={(event) =>
                onToggle(questionId, choice.value, event.target.checked)
              }
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>

      {otherQuestionId && otherSelected ? (
        <label className="study-survey-text-question">
          <span>{otherLabel}</span>
          <textarea
            value={otherValue}
            onChange={(event) => onTextChange(otherQuestionId, event.target.value)}
            rows={3}
          />
        </label>
      ) : null}

      {conditionalTextQuestions.map((textQuestion) => {
        if (selectedValues[textQuestion.choiceId] !== "true") return null;

        const rawValue = answers[textQuestion.questionId];
        const value = typeof rawValue === "string" ? rawValue : "";

        return (
          <label
            key={textQuestion.questionId}
            className="study-survey-text-question"
          >
            <span>{textQuestion.label}</span>
            <textarea
              value={value}
              onChange={(event) =>
                onTextChange(textQuestion.questionId, event.target.value)
              }
              rows={3}
            />
          </label>
        );
      })}
    </section>
  );
}

function OptionalCommentBlock({
  questionId,
  title,
  answers,
  onChange,
}: {
  questionId: string;
  title: string;
  answers: StudySurveyAnswers;
  onChange: (questionId: string, value: string) => void;
}) {
  const rawValue = answers[questionId];
  const value = typeof rawValue === "string" ? rawValue : "";

  return (
    <section className="study-survey-section">
      <label className="study-survey-text-question">
        <span>{title}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(questionId, event.target.value)}
          rows={3}
        />
      </label>
    </section>
  );
}

function TextQuestionsBlock({
  rows,
  answers,
  onChange,
}: {
  rows: MatrixRow[];
  answers: StudySurveyAnswers;
  onChange: (questionId: string, value: string) => void;
}) {
  return (
    <section className="study-survey-section">
      <h3>Open-ended questions</h3>

      <div className="study-survey-text-list">
        {rows.map((row) => {
          const rawValue = answers[row.id];
          const value = typeof rawValue === "string" ? rawValue : "";

          return (
            <label key={row.id} className="study-survey-text-question">
              <span>{row.label}</span>
              <textarea
                value={value}
                onChange={(event) => onChange(row.id, event.target.value)}
                rows={3}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}

function getCompletionStatus(
  mode: StudySurveyMode,
  answers: StudySurveyAnswers,
  requiredConsentAccepted: boolean
): boolean {
  if (mode === "pre") {
    return (
      requiredConsentAccepted &&
      hasMatrixAnswers(answers, "pre_familiarity", familiarityRows) &&
      hasSingleAnswer(answers, "external_resources_frequency") &&
      hasMultiAnswer(answers, "build_priorities")
    );
  }

  return (
    hasMatrixAnswers(answers, "exploration", explorationRows) &&
    hasMatrixAnswers(answers, "reasoning", reasoningRows) &&
    hasMatrixAnswers(answers, "visualization", visualizationRows) &&
    hasMatrixAnswers(answers, "experience", experienceRows) &&
    hasMultiAnswer(answers, "final_party_main_factor") &&
    hasTextAnswers(answers, openTextRows)
  );
}

export default function StudySurveyModal({
  mode,
  participantId,
  onSubmit,
  onCancel,
}: StudySurveyModalProps) {
  const [answers, setAnswers] = useState<StudySurveyAnswers>({});
  const [requiredConsentAccepted, setRequiredConsentAccepted] = useState(false);
  const [quotesConsent, setQuotesConsent] = useState(false);
  const [dataReuseConsent, setDataReuseConsent] = useState(false);

  const isComplete = useMemo(
    () => getCompletionStatus(mode, answers, requiredConsentAccepted),
    [mode, answers, requiredConsentAccepted]
  );

  function setSingleAnswer(questionId: string, value: string): void {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function setMatrixAnswer(
    questionId: string,
    rowId: string,
    value: string
  ): void {
    setAnswers((current) => {
      const currentMatrix =
        current[questionId] && typeof current[questionId] !== "string"
          ? (current[questionId] as Record<string, string>)
          : {};

      return {
        ...current,
        [questionId]: {
          ...currentMatrix,
          [rowId]: value,
        },
      };
    });
  }

  function setMultiChoiceAnswer(
    questionId: string,
    choiceId: string,
    checked: boolean
  ): void {
    setAnswers((current) => {
      const currentChoices =
        current[questionId] && typeof current[questionId] !== "string"
          ? (current[questionId] as Record<string, string>)
          : {};

      return {
        ...current,
        [questionId]: {
          ...currentChoices,
          [choiceId]: checked ? "true" : "false",
        },
      };
    });
  }

  function getNormalizedAnswersForExport(
    mode: StudySurveyMode,
    answers: StudySurveyAnswers
  ): StudySurveyAnswers {
    const questionIds =
      mode === "pre"
        ? ["build_priorities_other"]
        : optionalTextAnswerIds.filter(
            (questionId) => questionId !== "build_priorities_other"
          );

    return questionIds.reduce<StudySurveyAnswers>(
      (normalizedAnswers, questionId) => {
        if (normalizedAnswers[questionId] === undefined) {
          normalizedAnswers[questionId] = "";
        }

        return normalizedAnswers;
      },
      { ...answers }
    );
  }

  function handleSubmit(): void {
    if (!isComplete) return;

    onSubmit({
      surveySchemaVersion: "bg3-build-planner-survey-v1",
      mode,
      participantId,
      submittedAt: new Date().toISOString(),
      submittedAtMs: Date.now(),
      ...(mode === "pre"
        ? {
            consent: {
              requiredConsent: requiredConsentAccepted,
              anonymizedQuotesConsent: quotesConsent,
              dataReuseConsent,
            },
          }
        : {}),
      answers: getNormalizedAnswersForExport(mode, answers),
    });
  }

  return (
    <div className="study-survey-backdrop" data-study-region="study-survey-modal">
      <section className="study-survey-modal" role="dialog" aria-modal="true">
        <header className="study-survey-header">
          <div>
            <p>Participant {participantId}</p>
            <h2>
              {mode === "pre"
                ? "Consent and pre-task survey"
                : "Post-task survey"}
            </h2>
          </div>

          <button
            type="button"
            className="study-survey-close"
            onClick={onCancel}
            aria-label="Close survey"
          >
            ×
          </button>
        </header>

        <div className="study-survey-content">
          {mode === "pre" ? (
            <>
              <section className="study-survey-section study-survey-consent">
                <h3>Consent</h3>

                <p>
                  You are invited to take part in a study about a Baldur’s Gate 3
                  party-building tool. During the study, you will use the tool to
                  create a party of four characters and answer short survey questions.
                  The tool records interaction logs during the task, including clicks,
                  hovers, tab changes, saved builds, party assignments, visualization
                  interactions, and exported session data. These logs are used to
                  understand how the tool was used. The study evaluates the tool and
                  the build-planning process, not you as a player.
                </p>

                <p>
                  Participation is voluntary. You may stop participating at any time
                  without giving a reason. Your data will be used for scientific
                  purposes as part of a thesis, stored securely, and reported in
                  anonymized or pseudonymized form. Please do not include directly
                  identifying information in open-text answers.
                </p>

                <label className="study-survey-checkbox">
                  <input
                    type="checkbox"
                    checked={requiredConsentAccepted}
                    onChange={(event) =>
                      setRequiredConsentAccepted(event.target.checked)
                    }
                  />
                  <span>
                    I confirm that I am at least 18 years old, have read and
                    understood the study information, understand that participation is
                    voluntary, understand that interaction logs and survey answers will
                    be collected for scientific purposes, and voluntarily consent to
                    participating in this study.
                  </span>
                </label>

                <label className="study-survey-checkbox study-survey-checkbox--optional">
                  <input
                    type="checkbox"
                    checked={quotesConsent}
                    onChange={(event) => setQuotesConsent(event.target.checked)}
                  />
                  <span>
                    I agree that anonymized quotes from my open-text answers may be
                    used in the thesis or related academic reporting.
                  </span>
                </label>

                <label className="study-survey-checkbox study-survey-checkbox--optional">
                  <input
                    type="checkbox"
                    checked={dataReuseConsent}
                    onChange={(event) => setDataReuseConsent(event.target.checked)}
                  />
                  <span>
                    I agree that anonymized or pseudonymized research data from this
                    study may be shared with other researchers or reused for related
                    scientific research.
                  </span>
                </label>
              </section>

              <MatrixBlock
                title="Background and experience"
                questionId="pre_familiarity"
                rows={familiarityRows}
                scale={familiarityScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <SingleChoiceBlock
                title="How often do you usually use external resources such as wikis, guides, build planners, calculators, or tier lists when planning game builds?"
                questionId="external_resources_frequency"
                scale={frequencyScale}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <MultiChoiceBlock
                title="Build-planning priorities"
                description="When making a character build, which factors are usually most important to you? Select all that apply."
                questionId="build_priorities"
                scale={priorityOptions}
                answers={answers}
                otherQuestionId="build_priorities_other"
                otherLabel="If you selected Other, please describe the other priority."
                onToggle={setMultiChoiceAnswer}
                onTextChange={setSingleAnswer}
              />
            </>
          ) : (
            <>
              <MatrixBlock
                title="Exploration and iteration"
                questionId="exploration"
                rows={explorationRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <MatrixBlock
                title="Decision reasoning"
                questionId="reasoning"
                rows={reasoningRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <MatrixBlock
                title="Visualization interpretation"
                questionId="visualization"
                rows={visualizationRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <MatrixBlock
                title="Game-context fit and engagement"
                questionId="experience"
                rows={experienceRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <MultiChoiceBlock
                title="What factors shaped your final party?"
                description="Select all that apply."
                questionId="final_party_main_factor"
                scale={finalFactorOptions}
                answers={answers}
                otherQuestionId="final_party_main_factor_other"
                otherLabel="If you selected Other, please describe the other factor."
                conditionalTextQuestions={[
                  {
                    choiceId: "visualization_observation",
                    questionId:
                      "final_party_main_factor_visualization_observation",
                    label:
                      "If you selected something noticed in the visualization, please describe what you noticed.",
                  },
                ]}
                onToggle={setMultiChoiceAnswer}
                onTextChange={setSingleAnswer}
              />

              <TextQuestionsBlock
                rows={openTextRows}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <OptionalCommentBlock
                questionId="optional_comments"
                title="Optional: any further comments?"
                answers={answers}
                onChange={setSingleAnswer}
              />
            </>
          )}
        </div>

        <footer className="study-survey-footer">
          <button
            type="button"
            className="study-survey-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="study-survey-primary"
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            {mode === "pre" ? "Start study" : "Submit survey & export"}
          </button>
        </footer>
      </section>
    </div>
  );
}