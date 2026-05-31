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

const agreementScale: ScaleChoice[] = [
  { value: "1", label: "Strongly disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neither" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly agree" },
];

const familiarityScale: ScaleChoice[] = [
  { value: "1", label: "Not familiar" },
  { value: "2", label: "Slightly" },
  { value: "3", label: "Moderately" },
  { value: "4", label: "Familiar" },
  { value: "5", label: "Very familiar" },
];

const frequencyScale: ScaleChoice[] = [
  { value: "1", label: "Never" },
  { value: "2", label: "Rarely" },
  { value: "3", label: "Sometimes" },
  { value: "4", label: "Often" },
  { value: "5", label: "Very often" },
];

const importanceScale: ScaleChoice[] = [
  { value: "1", label: "Not important" },
  { value: "2", label: "Slightly" },
  { value: "3", label: "Moderately" },
  { value: "4", label: "Important" },
  { value: "5", label: "Very important" },
];

const workloadScale: ScaleChoice[] = [
  { value: "1", label: "Very low" },
  { value: "2", label: "Low" },
  { value: "3", label: "Moderate" },
  { value: "4", label: "High" },
  { value: "5", label: "Very high" },
];

const usefulnessScale: ScaleChoice[] = [
  { value: "not_used", label: "Did not use" },
  { value: "1", label: "Not useful" },
  { value: "2", label: "Slightly" },
  { value: "3", label: "Moderately" },
  { value: "4", label: "Useful" },
  { value: "5", label: "Very useful" },
];

const taskEaseScale: ScaleChoice[] = [
  { value: "1", label: "Very difficult" },
  { value: "2", label: "Difficult" },
  { value: "3", label: "Neither" },
  { value: "4", label: "Easy" },
  { value: "5", label: "Very easy" },
];

const priorityOptions: ScaleChoice[] = [
  { value: "damage_combat_performance", label: "Damage or combat performance" },
  { value: "survivability", label: "Survivability" },
  { value: "party_balance", label: "Party balance" },
  { value: "clear_party_roles", label: "Clear party roles" },
  { value: "roleplay_fantasy", label: "Roleplaying or character fantasy" },
  { value: "narrative_strength", label: "Narrative strength, such as dialogue options or story usefulness" },
  { value: "experimentation", label: "Experimentation" },
  { value: "ease_of_use", label: "Ease of use during actual play" },
  { value: "versatility", label: "Versatility across different situations" },
  { value: "other", label: "Other" },
];

const finalFactorOptions: ScaleChoice[] = [
  ...priorityOptions,
  { value: "visualization_observation", label: "Something I noticed in the visualization" },
  { value: "prior_bg3_knowledge", label: "Something I already knew about BG3" },
];

const stopReasonOptions: ScaleChoice[] = [
  { value: "satisfied", label: "I was satisfied with the party" },
  { value: "explored_enough", label: "I felt I had explored enough" },
  { value: "ran_out_of_time", label: "I ran out of time" },
  { value: "no_useful_changes", label: "I could not see useful changes anymore" },
  { value: "tool_preferred_option", label: "The tool made one option seem clearly preferable" },
  { value: "tired", label: "I became tired" },
  { value: "unsure", label: "I was unsure what else to try" },
  { value: "other", label: "Other" },
];

const conceptCountOptions: ScaleChoice[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5_or_more", label: "5 or more" },
  { value: "not_sure", label: "Not sure" },
];

const revisedMembersOptions: ScaleChoice[] = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "not_sure", label: "Not sure" },
];

const familiarityRows: MatrixRow[] = [
  { id: "bg3", label: "Baldur’s Gate 3" },
  { id: "dnd_or_rpg_systems", label: "Dungeons & Dragons or similar roleplaying systems" },
  { id: "build_planning", label: "Character build planning in games" },
  { id: "charts_visual_summaries", label: "Charts, visual summaries, or dashboards" },
];

const priorityRows: MatrixRow[] = [
  { id: "damage_combat_performance", label: "Damage or combat performance" },
  { id: "survivability", label: "Survivability" },
  { id: "party_balance", label: "Party balance" },
  { id: "clear_party_roles", label: "Clear party roles, such as healer, tank, support, or damage dealer" },
  { id: "roleplay_fantasy", label: "Roleplaying or character fantasy" },
  { id: "narrative_strength", label: "Narrative strength, such as dialogue options, charisma, or story usefulness" },
  { id: "experimentation", label: "Experimenting with unusual combinations" },
  { id: "ease_of_use", label: "Ease of use during actual play" },
  { id: "versatility", label: "Versatility across different situations" },
];

const preUnderstandingRows: MatrixRow[] = [
  { id: "ready_to_use_tool", label: "I feel ready to use the tool for the party-building task." },
  { id: "goal_party_of_four", label: "I understand that the goal is to create a party of four characters." },
  { id: "aggregate_whole_party", label: "I understand that the aggregate view shows the party as a whole." },
];

const workloadRows: MatrixRow[] = [
  { id: "mental_demand", label: "How mentally demanding was the task?" },
  { id: "time_pressure", label: "How much time pressure did you feel?" },
  { id: "effort", label: "How much effort did you need to complete the task?" },
  { id: "frustration", label: "How frustrated did you feel during the task?" },
  { id: "unsuccessful", label: "How unsuccessful did you feel while completing the task?" },
];

const usabilityRows: MatrixRow[] = [
  { id: "easy_to_use", label: "The tool was easy to use." },
  { id: "features_supported_task", label: "The tool’s features supported what I needed to do." },
  { id: "parts_worked_together", label: "The different parts of the tool worked together clearly." },
  { id: "found_information", label: "I could find the information I needed without too much effort." },
  { id: "tutorial_enough", label: "The tutorial gave me enough information to use the tool." },
];

const explorationRows: MatrixRow[] = [
  { id: "try_ideas", label: "The tool made it easy to try different build ideas." },
  { id: "revise_after_info", label: "The tool made it easy to revise a build after seeing new information." },
  { id: "compare_party_options", label: "The tool helped me compare different party options." },
  { id: "return_to_ideas", label: "The tool helped me return to earlier ideas or saved versions." },
  { id: "consider_new_options", label: "The tool helped me consider options I might not have considered otherwise." },
];

const reasoningRows: MatrixRow[] = [
  { id: "final_party_confidence", label: "I am confident in the final party I created." },
  { id: "could_explain_choice", label: "I could explain why I chose this final party." },
  { id: "understood_strengths", label: "I understood the main strengths of my final party." },
  { id: "understood_weaknesses", label: "I understood the main weaknesses or limitations of my final party." },
  { id: "tradeoffs", label: "The tool helped me think about trade-offs between different build choices." },
  { id: "party_as_whole", label: "The tool helped me think about the party as a whole, not only individual characters." },
  { id: "balance_with_other_goals", label: "The tool helped me balance combat performance with other goals such as utility, roleplay, or narrative usefulness." },
];

const visualizationRows: MatrixRow[] = [
  { id: "understood_visualization", label: "I understood what the main visualization was showing." },
  { id: "related_to_choices", label: "I understood how the visualization related to the choices I made in the build planner." },
  { id: "noticed_weak_areas", label: "The visualization helped me notice missing or weak areas in the party." },
  { id: "noticed_overlap", label: "The visualization helped me notice overlap between party members." },
  { id: "hover_explanations", label: "The hover explanations helped me understand spells, abilities, or visualized categories." },
  { id: "readable", label: "The visualization was readable enough for the task." },
];

const autonomyRows: MatrixRow[] = [
  { id: "own_decision", label: "The tool helped me make my own decision rather than simply follow one “best” number." },
  { id: "damage_one_factor", label: "I treated damage information as one factor among several." },
  { id: "non_damage_factors", label: "I considered non-damage factors such as support, control, utility, range, roleplay, or narrative strength." },
  { id: "could_ignore_tool", label: "I felt able to ignore tool information when it did not match my own build goal." },
  { id: "not_pure_optimization", label: "The tool supported exploration without making the task feel like pure optimization." },
];

const experienceRows: MatrixRow[] = [
  { id: "appropriate_for_bg3", label: "The tool felt appropriate for planning a Baldur’s Gate 3 party." },
  { id: "visual_style_fit", label: "The visual style fit the game context." },
  { id: "more_interesting", label: "Using the tool made build planning more interesting." },
  { id: "control", label: "I felt in control of the party-building process." },
  { id: "would_use_again", label: "I would consider using a tool like this outside the study." },
];

const featureRows: MatrixRow[] = [
  { id: "character_tab", label: "Character tab and basic build setup" },
  { id: "class_scores", label: "Class and ability score choices" },
  { id: "spells_abilities", label: "Spells and abilities tab" },
  { id: "hover_descriptions", label: "Spell and ability hover descriptions" },
  { id: "focused_data_circle", label: "Individual Data Circle for the focused build" },
  { id: "center_explanation", label: "Focused explanation in the center of the Data Circle" },
  { id: "party_aggregate", label: "Party aggregate view" },
  { id: "small_party_circles", label: "Small party member circles" },
  { id: "saved_builds", label: "Saved builds panel" },
  { id: "process_history", label: "Build process/history view" },
  { id: "new_build_button", label: "Create new build button" },
  { id: "assign_party_controls", label: "Assign-to-party controls" },
  { id: "tutorial", label: "Tutorial/help overlay" },
  { id: "evaluation", label: "Evaluation/simulator output, if used" },
];

const openTextRows: MatrixRow[] = [
  { id: "final_party_description", label: "Briefly describe the final party you were trying to create." },
  { id: "most_important_tradeoff", label: "What was the most important trade-off you considered?" },
  { id: "most_influential_tool_part", label: "What part of the tool influenced your decisions the most?" },
  { id: "missing_information", label: "Was there any information you wanted but could not find?" },
  { id: "confusing_or_misleading", label: "Was anything confusing or misleading?" },
  { id: "changed_normal_planning", label: "Did the tool change how you would normally plan a party or character build? If yes, how?" },
  { id: "first_change", label: "What would you change first about the tool?" },
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

function hasSingleAnswer(answers: StudySurveyAnswers, questionId: string): boolean {
  return typeof answers[questionId] === "string" && answers[questionId] !== "";
}

function hasMatrixAnswers(
  answers: StudySurveyAnswers,
  questionId: string,
  rows: MatrixRow[]
): boolean {
  return rows.every((row) => getMatrixAnswer(answers, questionId, row.id) !== "");
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
      hasMatrixAnswers(answers, "build_priorities", priorityRows) &&
      hasSingleAnswer(answers, "main_build_priority") &&
      hasSingleAnswer(answers, "second_build_priority") &&
      hasMatrixAnswers(answers, "pre_understanding", preUnderstandingRows)
    );
  }

  return (
    hasSingleAnswer(answers, "task_ease") &&
    hasMatrixAnswers(answers, "workload", workloadRows) &&
    hasMatrixAnswers(answers, "usability", usabilityRows) &&
    hasMatrixAnswers(answers, "exploration", explorationRows) &&
    hasMatrixAnswers(answers, "reasoning", reasoningRows) &&
    hasMatrixAnswers(answers, "visualization", visualizationRows) &&
    hasMatrixAnswers(answers, "autonomy", autonomyRows) &&
    hasMatrixAnswers(answers, "experience", experienceRows) &&
    hasSingleAnswer(answers, "party_concepts_considered") &&
    hasSingleAnswer(answers, "revised_party_members") &&
    hasSingleAnswer(answers, "aggregate_use_frequency") &&
    hasSingleAnswer(answers, "description_inspection_frequency") &&
    hasSingleAnswer(answers, "visualization_change_frequency") &&
    hasSingleAnswer(answers, "final_party_main_factor") &&
    hasSingleAnswer(answers, "stop_reason") &&
    hasMatrixAnswers(answers, "feature_usefulness", featureRows)
  );
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
      {description ? <p className="study-survey-section-note">{description}</p> : null}

      <div className="study-survey-matrix">
        <div
          className="study-survey-matrix-header"
          style={{ gridTemplateColumns: `minmax(190px, 1.3fr) repeat(${scale.length}, minmax(72px, 1fr))` }}
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
            style={{ gridTemplateColumns: `minmax(190px, 1.3fr) repeat(${scale.length}, minmax(72px, 1fr))` }}
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
                    checked={getMatrixAnswer(answers, questionId, row.id) === choice.value}
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
      {description ? <p className="study-survey-section-note">{description}</p> : null}

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
      <p className="study-survey-section-note">
        These are optional, but they help explain the interaction logs.
      </p>

      <div className="study-survey-text-list">
        {rows.map((row) => {
          const rawValue = answers[row.id];
          const value: string = typeof rawValue === "string" ? rawValue : "";

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

function getNormalizedAnswersForExport(
  mode: StudySurveyMode,
  answers: StudySurveyAnswers
): StudySurveyAnswers {
  if (mode !== "post") return answers;

  return openTextRows.reduce<StudySurveyAnswers>(
    (normalizedAnswers, row) => {
      if (normalizedAnswers[row.id] === undefined) {
        normalizedAnswers[row.id] = "";
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
                  purposes as part of an MSc thesis, stored securely, and reported in
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

              <MatrixBlock
                title="Build-planning priorities"
                description="When making a character build, how important are the following factors to you?"
                questionId="build_priorities"
                rows={priorityRows}
                scale={importanceScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <SingleChoiceBlock
                title="Which of these is usually your main priority when making a build?"
                questionId="main_build_priority"
                scale={priorityOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="Which of these is usually your second priority when making a build?"
                questionId="second_build_priority"
                scale={priorityOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <MatrixBlock
                title="Pre-task understanding"
                questionId="pre_understanding"
                rows={preUnderstandingRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />
            </>
          ) : (
            <>
              <SingleChoiceBlock
                title="Overall, how easy was it to complete the party-building task?"
                questionId="task_ease"
                scale={taskEaseScale}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <MatrixBlock
                title="Workload"
                questionId="workload"
                rows={workloadRows}
                scale={workloadScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <MatrixBlock
                title="Usability and usefulness"
                questionId="usability"
                rows={usabilityRows}
                scale={agreementScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

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
                title="Metric focus and decision autonomy"
                questionId="autonomy"
                rows={autonomyRows}
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

              <SingleChoiceBlock
                title="How many substantially different party concepts did you seriously consider?"
                questionId="party_concepts_considered"
                scale={conceptCountOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="How many party members did you substantially revise after first creating them?"
                questionId="revised_party_members"
                scale={revisedMembersOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="How often did you use the aggregate party view while deciding?"
                questionId="aggregate_use_frequency"
                scale={frequencyScale}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="How often did you inspect spell, ability, or feature descriptions?"
                questionId="description_inspection_frequency"
                scale={frequencyScale}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="How often did you change a build because of something you noticed in the visualization?"
                questionId="visualization_change_frequency"
                scale={frequencyScale}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="What was the main factor that shaped your final party?"
                questionId="final_party_main_factor"
                scale={finalFactorOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <SingleChoiceBlock
                title="What made you stop and submit the final party?"
                questionId="stop_reason"
                scale={stopReasonOptions}
                answers={answers}
                onChange={setSingleAnswer}
              />

              <MatrixBlock
                title="Feature usefulness"
                description="How useful was each part of the tool for your party-building decisions?"
                questionId="feature_usefulness"
                rows={featureRows}
                scale={usefulnessScale}
                answers={answers}
                onChange={setMatrixAnswer}
              />

              <TextQuestionsBlock
                rows={openTextRows}
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
            {mode === "pre"
              ? "Start study"
              : "Submit survey & export"}
          </button>
        </footer>
      </section>
    </div>
  );
}