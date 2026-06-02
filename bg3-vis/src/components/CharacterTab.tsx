import type { Dispatch, SetStateAction } from "react";
import type {
  Background,
  ClassName,
  RaceName,
  Skill,
} from "../types/buildPlannerTypes";
import {
  backgrounds,
  classSkillRules,
  classes,
  races,
  skills,
  subracesByRace,
} from "../data/bg3CharacterData";
import { unique } from "../logic/proficiencyLogic";
import { logFrictionEvent, logStudyEvent } from "../logic/studyLogger";

type CharacterTabProps = {
  buildName: string;
  setBuildName: (value: string) => void;
  characterName: string;
  setCharacterName: (value: string) => void;
  selectedRace: RaceName | "";
  selectedSubrace: string;
  selectedBackground: Background | "";
  selectedClass: ClassName | "";
  selectedClassSkills: Skill[];
  lockedSkills: Skill[];
  unavailableClassSkillProficiencies: Skill[];
  allProficiencies: Skill[];
  allExpertise: Skill[];
  onRaceChange: (value: string) => void;
  setSelectedSubrace: (value: string) => void;
  setSelectedBackground: (value: Background | "") => void;
  onClassChange: (value: string) => void;
  setSelectedClassSkills: Dispatch<SetStateAction<Skill[]>>;

  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
};

type SkillChoiceState = {
  isSelected: boolean;
  isUnavailableFromOtherSource: boolean;
  outsideClassOptions: boolean;
  currentOutsideClassCount: number;
  humanOutsideLimitReached: boolean;
  nonHumanOutsideClass: boolean;
  maxReached: boolean;
  blockedReason: string | null;
  isBlocked: boolean;
  isHumanExtraOption: boolean;
  isSelectedHumanExtraOption: boolean;
  humanExtraAlreadyChosen: boolean;
};

function CharacterTab({
  buildName,
  setBuildName,
  characterName,
  setCharacterName,
  selectedRace,
  selectedSubrace,
  selectedBackground,
  selectedClass,
  selectedClassSkills,
  lockedSkills,
  unavailableClassSkillProficiencies,
  allProficiencies,
  allExpertise,
  onRaceChange,
  setSelectedSubrace,
  setSelectedBackground,
  onClassChange,
  setSelectedClassSkills,
  activeView = "character-tab",
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: CharacterTabProps) {
  const availableSubraces = selectedRace ? subracesByRace[selectedRace] : [];
  const classRule = selectedClass ? classSkillRules[selectedClass] : undefined;

  const humanExtraSkillCount = selectedRace === "Human" ? 1 : 0;
  const maxClassSkills = (classRule?.choose ?? 0) + humanExtraSkillCount;

  const skillOptions =
    selectedRace === "Human" && classRule
      ? unique([...classRule.options, ...skills])
      : classRule?.options ?? [];

  function getSkillChoiceState(
    skill: Skill,
    currentSkills: Skill[] = selectedClassSkills
  ): SkillChoiceState {
    const isSelected = currentSkills.includes(skill);

    const isUnavailableFromOtherSource =
      unavailableClassSkillProficiencies.includes(skill) && !isSelected;

    const outsideClassOptions = classRule
      ? !classRule.options.includes(skill)
      : false;

    const currentOutsideClassCount = classRule
      ? currentSkills.filter((item) => !classRule.options.includes(item)).length
      : 0;

    const isHumanExtraOption = selectedRace === "Human" && outsideClassOptions;
    const isSelectedHumanExtraOption = isHumanExtraOption && isSelected;
    const humanExtraAlreadyChosen =
      selectedRace === "Human" && currentOutsideClassCount >= 1;

    const humanOutsideLimitReached =
      isHumanExtraOption &&
      humanExtraAlreadyChosen &&
      !isSelected;

    const nonHumanOutsideClass = selectedRace !== "Human" && outsideClassOptions;

    const maxReached = currentSkills.length >= maxClassSkills && !isSelected;

    const blockedReason = isUnavailableFromOtherSource
      ? "skill_already_granted_by_other_source"
      : humanOutsideLimitReached
        ? "human_extra_skill_limit_reached"
        : nonHumanOutsideClass
          ? "skill_outside_class_options_for_non_human"
          : maxReached
            ? "class_skill_limit_reached"
            : null;

    return {
      isSelected,
      isUnavailableFromOtherSource,
      outsideClassOptions,
      currentOutsideClassCount,
      humanOutsideLimitReached,
      nonHumanOutsideClass,
      maxReached,
      blockedReason,
      isBlocked: Boolean(blockedReason),
      isHumanExtraOption,
      isSelectedHumanExtraOption,
      humanExtraAlreadyChosen,
    };
  }

  function getSkillChoiceTitle(skill: Skill, state: SkillChoiceState): string {
    if (state.isUnavailableFromOtherSource) {
      return "Already granted by another source.";
    }

    if (state.humanOutsideLimitReached) {
      return "Human can only select one skill from outside the class list. Remove the selected Human extra skill first.";
    }

    if (state.nonHumanOutsideClass) {
      return "This skill is outside the selected class skill list.";
    }

    if (state.maxReached) {
      return "Class skill limit reached.";
    }

    if (state.isSelectedHumanExtraOption) {
      return "Remove this Human extra skill proficiency.";
    }

    if (state.isSelected) {
      return "Remove skill proficiency.";
    }

    if (state.isHumanExtraOption) {
      return "Add this as the Human extra skill proficiency.";
    }

    return "Add skill proficiency.";
  }

  function getHumanSkillBadgeText(state: SkillChoiceState): string | null {
    if (!state.isHumanExtraOption) return null;

    if (state.isSelectedHumanExtraOption) return "Human selected";
    if (state.humanOutsideLimitReached) return "Human used";

    return "Human extra";
  }

  function getLoggingContext() {
    return {
      activeView,
      activeBuildId,
      activeBuildLabel:
        activeBuildLabel || buildName || characterName || selectedClass || null,
      activePartyMemberIndex,
      activePartyMemberLabel,
      activeFocusSource,
      partySnapshotHash,
    };
  }

  function logCharacterFieldIntent(
    field: string,
    previousValue: unknown,
    nextValue: unknown,
    extraPayload: Record<string, unknown> = {}
  ) {
    if (JSON.stringify(previousValue) === JSON.stringify(nextValue)) return;

    logStudyEvent({
      eventCategory: "navigation",
      eventType: "character_field_changed",
      taskPhase: "exploration",
      ...getLoggingContext(),
      payload: {
        sourceComponent: "CharacterTab",
        field,
        previousValue,
        nextValue,
        selectedRace,
        selectedSubrace,
        selectedBackground,
        selectedClass,
        selectedClassSkillCount: selectedClassSkills.length,
        lockedSkillCount: lockedSkills.length,
        proficiencyCount: allProficiencies.length,
        expertiseCount: allExpertise.length,
        ...extraPayload,
      },
    });
  }

  function logSkillToggleAttempt(payload: Record<string, unknown>) {
    logStudyEvent({
      eventCategory: "build_edit",
      eventType: "class_skill_toggle_attempted",
      taskPhase: "exploration",
      ...getLoggingContext(),
      payload: {
        sourceComponent: "CharacterTab",
        selectedRace,
        selectedClass,
        selectedClassSkillCount: selectedClassSkills.length,
        maxClassSkills,
        selectedClassSkills,
        lockedSkills,
        unavailableClassSkillProficiencies,
        ...payload,
      },
    });
  }

  function logBlockedSkillChoice(
    skill: Skill,
    reason: string,
    extraPayload: Record<string, unknown> = {}
  ) {
    logFrictionEvent(
      "invalid_selection_attempted",
      {
        sourceComponent: "CharacterTab",
        targetType: "class-skill",
        targetId: skill,
        reason,
        selectedRace,
        selectedClass,
        selectedClassSkillCount: selectedClassSkills.length,
        maxClassSkills,
        selectedClassSkills,
        unavailableClassSkillProficiencies,
        ...extraPayload,
      },
      getLoggingContext()
    );
  }

  function handleBuildNameChange(value: string) {
    logCharacterFieldIntent("buildName", buildName, value, {
      textLengthBefore: buildName.length,
      textLengthAfter: value.length,
      becameEmpty: value.trim().length === 0,
    });

    setBuildName(value);
  }

  function handleCharacterNameChange(value: string) {
    logCharacterFieldIntent("characterName", characterName, value, {
      textLengthBefore: characterName.length,
      textLengthAfter: value.length,
      becameEmpty: value.trim().length === 0,
    });

    setCharacterName(value);
  }

  function handleRaceChange(value: string) {
    logCharacterFieldIntent("selectedRace", selectedRace, value, {
      resetsSubrace: selectedSubrace !== "",
      previousSubrace: selectedSubrace || null,
      availableSubraceCount:
        value && value in subracesByRace
          ? subracesByRace[value as RaceName].length
          : 0,
    });

    onRaceChange(value);
  }

  function handleSubraceChange(value: string) {
    logCharacterFieldIntent("selectedSubrace", selectedSubrace, value, {
      selectedRace,
      availableSubraceCount: availableSubraces.length,
    });

    setSelectedSubrace(value);
  }

  function handleBackgroundChange(value: string) {
    const nextBackground = value as Background | "";

    logCharacterFieldIntent(
      "selectedBackground",
      selectedBackground,
      nextBackground
    );

    setSelectedBackground(nextBackground);
  }

  function handleClassChange(value: string) {
    logCharacterFieldIntent("selectedClass", selectedClass, value, {
      resetsClassSkills: selectedClassSkills.length > 0,
      previousSelectedClassSkills: selectedClassSkills,
      previousClassSkillCount: selectedClassSkills.length,
    });

    onClassChange(value);
  }

  function toggleClassSkill(skill: Skill) {
    if (!classRule) {
      logBlockedSkillChoice(skill, "class_not_selected");
      return;
    }

    setSelectedClassSkills((current) => {
      const state = getSkillChoiceState(skill, current);

      logSkillToggleAttempt({
        skill,
        action: state.isSelected ? "remove_skill" : "add_skill",
        wasSelected: state.isSelected,
        wouldBeBlocked: state.isBlocked,
        blockedReason: state.blockedReason,
        outsideClassOptions: state.outsideClassOptions,
        isHumanExtraOption: state.isHumanExtraOption,
        isSelectedHumanExtraOption: state.isSelectedHumanExtraOption,
        humanExtraAlreadyChosen: state.humanExtraAlreadyChosen,
        currentOutsideClassCount: state.currentOutsideClassCount,
        selectedSkillCountBefore: current.length,
        selectedSkillCountAfter: state.isBlocked
          ? current.length
          : state.isSelected
            ? current.length - 1
            : current.length + 1,
      });

      if (state.blockedReason) {
        logBlockedSkillChoice(skill, state.blockedReason, {
          outsideClassOptions: state.outsideClassOptions,
          isHumanExtraOption: state.isHumanExtraOption,
          isSelectedHumanExtraOption: state.isSelectedHumanExtraOption,
          humanExtraAlreadyChosen: state.humanExtraAlreadyChosen,
          currentOutsideClassCount: state.currentOutsideClassCount,
          isUnavailableFromOtherSource: state.isUnavailableFromOtherSource,
          humanOutsideLimitReached: state.humanOutsideLimitReached,
          nonHumanOutsideClass: state.nonHumanOutsideClass,
          maxReached: state.maxReached,
        });

        return current;
      }

      if (state.isSelected) {
        return current.filter((item) => item !== skill);
      }

      return [...current, skill];
    });
  }

  return (
    <div
      className="tab-content"
      data-study-region="character-tab"
      data-study-id="character-tab"
    >
      <h2 data-study-id="character-tab-title">Character</h2>

      <p className="panel-intro" data-study-id="character-tab-intro">
        Basic BG3 character setup and skill proficiencies.
      </p>

      <div className="form-grid" data-study-region="character-basic-fields">
        <label data-study-id="build-name-field">
          Build name
          <input
            value={buildName}
            onChange={(e) => handleBuildNameChange(e.target.value)}
            placeholder="e.g. Poison Wizard"
            data-study-element="build-name-input"
            data-study-id="build-name-input"
          />
        </label>

        <label data-study-id="character-name-field">
          Character name
          <input
            value={characterName}
            onChange={(e) => handleCharacterNameChange(e.target.value)}
            placeholder="Character name"
            data-study-element="character-name-input"
            data-study-id="character-name-input"
          />
        </label>

        <label data-study-id="race-field">
          Race
          <select
            value={selectedRace}
            onChange={(e) => handleRaceChange(e.target.value)}
            data-study-element="race-select"
            data-study-id="race-select"
          >
            <option value="">Select race</option>
            {races.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="subrace-field">
          Subrace
          <select
            value={selectedSubrace}
            onChange={(e) => handleSubraceChange(e.target.value)}
            disabled={!selectedRace || availableSubraces.length === 0}
            data-study-element="subrace-select"
            data-study-id="subrace-select"
          >
            <option value="">
              {selectedRace && availableSubraces.length === 0
                ? "No subrace"
                : "Select subrace"}
            </option>

            {availableSubraces.map((subrace) => (
              <option key={subrace} value={subrace}>
                {subrace}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="background-field">
          Background
          <select
            value={selectedBackground}
            onChange={(e) => handleBackgroundChange(e.target.value)}
            data-study-element="background-select"
            data-study-id="background-select"
          >
            <option value="">Select background</option>
            {backgrounds.map((background) => (
              <option key={background} value={background}>
                {background}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="class-field">
          Class
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            data-study-element="class-select"
            data-study-id="class-select"
          >
            <option value="">Select class</option>
            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedRace === "Githyanki" && (
        <div
          className="section-block"
          data-study-region="githyanki-astral-knowledge-info"
          data-study-id="githyanki-astral-knowledge-info"
        >
          <h3>Githyanki Astral Knowledge</h3>
          <div className="placeholder-box">
            Astral Knowledge grants temporary proficiency in all skills linked
            to one chosen ability. It is not added to permanent build
            proficiencies here.
          </div>
        </div>
      )}

      <div
        className="section-block"
        data-study-region="locked-proficiencies-section"
        data-study-id="locked-proficiencies-section"
      >
        <h3>Locked proficiencies</h3>
        <p className="panel-intro">
          These come from background, race, subclass, class features, or fixed
          feature choices.
        </p>

        <div className="chip-grid" data-study-region="locked-skill-grid">
          {lockedSkills.length === 0 && (
            <span className="muted-text" data-study-id="no-locked-skills">
              No locked skills yet.
            </span>
          )}

          {lockedSkills.map((skill) => (
            <span
              key={skill}
              className="choice-chip locked"
              data-study-element="locked-skill-chip"
              data-study-id={`locked-skill-${skill}`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div
        className="section-block"
        data-study-region="class-skill-proficiencies-section"
        data-study-id="class-skill-proficiencies-section"
      >
        <h3>Class skill proficiencies</h3>
        <p className="panel-intro" data-study-id="class-skill-counter">
          {classRule
            ? `Choose ${maxClassSkills} skill${
                maxClassSkills > 1 ? "s" : ""
              }. Selected: ${selectedClassSkills.length}/${maxClassSkills}.`
            : "Select a class first."}
        </p>

        {selectedRace === "Human" && classRule && (
          <p className="panel-intro" data-study-id="human-extra-skill-note">
            Human adds one extra free skill proficiency. Purple-tinted skills are
            Human extra options from outside the class skill list. Only one can
            be selected.
          </p>
        )}

        <div className="skill-grid" data-study-region="class-skill-grid">
          {skillOptions.map((skill) => {
            const state = getSkillChoiceState(skill);
            const humanBadge = getHumanSkillBadgeText(state);

            return (
              <button
                key={skill}
                type="button"
                aria-disabled={state.isBlocked}
                className={[
                  "choice-chip",
                  state.isSelected ? "selected" : "",
                  state.isUnavailableFromOtherSource ? "locked" : "",
                  state.isHumanExtraOption ? "choice-chip--human-extra" : "",
                  state.isSelectedHumanExtraOption
                    ? "choice-chip--human-extra-selected"
                    : "",
                  state.humanOutsideLimitReached
                    ? "choice-chip--human-extra-unavailable"
                    : "",
                  state.isBlocked ? "choice-chip--blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => toggleClassSkill(skill)}
                data-study-element="class-skill-button"
                data-study-id={`class-skill-${skill}`}
                data-skill-source={
                  state.isHumanExtraOption ? "human-extra" : "class"
                }
                data-human-extra-status={
                  state.isSelectedHumanExtraOption
                    ? "selected"
                    : state.humanOutsideLimitReached
                      ? "unavailable-limit-used"
                      : state.isHumanExtraOption
                        ? "available"
                        : "not-human-extra"
                }
                title={getSkillChoiceTitle(skill, state)}
              >
                <span>{skill}</span>

                {humanBadge ? (
                  <span className="choice-chip-note">{humanBadge}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="section-block"
        data-study-region="all-proficiencies-section"
        data-study-id="all-proficiencies-section"
      >
        <h3>All current skill proficiencies</h3>
        <div className="chip-grid" data-study-region="all-proficiencies-grid">
          {allProficiencies.length === 0 && (
            <span className="muted-text" data-study-id="no-proficiencies">
              No skills selected yet.
            </span>
          )}

          {allProficiencies.map((skill) => (
            <span
              key={skill}
              className="choice-chip summary-chip"
              data-study-element="proficiency-summary-chip"
              data-study-id={`proficiency-summary-${skill}`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div
        className="section-block"
        data-study-region="expertise-section"
        data-study-id="expertise-section"
      >
        <h3>Expertise</h3>
        <div className="chip-grid" data-study-region="expertise-grid">
          {allExpertise.length === 0 && (
            <span className="muted-text" data-study-id="no-expertise">
              No expertise yet.
            </span>
          )}

          {allExpertise.map((skill) => (
            <span
              key={skill}
              className="choice-chip expertise-chip"
              data-study-element="expertise-summary-chip"
              data-study-id={`expertise-summary-${skill}`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CharacterTab;