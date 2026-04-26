import type { Dispatch, SetStateAction } from "react";
import type { Background, ClassName, RaceName, Skill } from "../types/buildPlannerTypes";
import {
  backgrounds,
  classSkillRules,
  classes,
  races,
  skills,
  subracesByRace,
} from "../data/bg3CharacterData";
import { unique } from "../logic/proficiencyLogic";

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
  allProficiencies: Skill[];
  allExpertise: Skill[];
  onRaceChange: (value: string) => void;
  setSelectedSubrace: (value: string) => void;
  setSelectedBackground: (value: Background | "") => void;
  onClassChange: (value: string) => void;
  setSelectedClassSkills: Dispatch<SetStateAction<Skill[]>>;
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
  allProficiencies,
  allExpertise,
  onRaceChange,
  setSelectedSubrace,
  setSelectedBackground,
  onClassChange,
  setSelectedClassSkills,
}: CharacterTabProps) {
  const availableSubraces = selectedRace ? subracesByRace[selectedRace] : [];
  const classRule = selectedClass ? classSkillRules[selectedClass] : undefined;

  const humanExtraSkillCount = selectedRace === "Human" ? 1 : 0;
  const maxClassSkills = (classRule?.choose ?? 0) + humanExtraSkillCount;

  const skillOptions =
    selectedRace === "Human" && classRule
      ? unique([...classRule.options, ...skills])
      : classRule?.options ?? [];

  function toggleClassSkill(skill: Skill) {
    if (!classRule) return;
    if (lockedSkills.includes(skill)) return;

    setSelectedClassSkills((current) => {
      const isSelected = current.includes(skill);

      if (isSelected) {
        return current.filter((item) => item !== skill);
      }

      const outsideClassOptions = current.filter((item) => !classRule.options.includes(item));
      const skillIsOutsideClassOptions = !classRule.options.includes(skill);

      if (selectedRace === "Human" && skillIsOutsideClassOptions && outsideClassOptions.length >= 1) {
        return current;
      }

      if (selectedRace !== "Human" && skillIsOutsideClassOptions) {
        return current;
      }

      if (current.length >= maxClassSkills) {
        return current;
      }

      return [...current, skill];
    });
  }

  return (
    <div className="tab-content">
      <h2>Character</h2>
      <p className="panel-intro">Basic BG3 character setup and skill proficiencies.</p>

      <div className="form-grid">
        <label>
          Build name
          <input
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            placeholder="e.g. Radiant Frontliner"
          />
        </label>

        <label>
          Character name
          <input
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Character name"
          />
        </label>

        <label>
          Race
          <select value={selectedRace} onChange={(e) => onRaceChange(e.target.value)}>
            <option value="">Select race</option>
            {races.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subrace
          <select
            value={selectedSubrace}
            onChange={(e) => setSelectedSubrace(e.target.value)}
            disabled={!selectedRace || availableSubraces.length === 0}
          >
            <option value="">
              {selectedRace && availableSubraces.length === 0 ? "No subrace" : "Select subrace"}
            </option>
            {availableSubraces.map((subrace) => (
                              <option key={subrace} value={subrace}>
                {subrace}
              </option>
            ))}
          </select>
        </label>

        <label>
          Background
          <select
            value={selectedBackground}
            onChange={(e) => setSelectedBackground(e.target.value as Background | "")}
          >
            <option value="">Select background</option>
            {backgrounds.map((background) => (
              <option key={background} value={background}>
                {background}
              </option>
            ))}
          </select>
        </label>

        <label>
          Class
          <select value={selectedClass} onChange={(e) => onClassChange(e.target.value)}>
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
        <div className="section-block">
          <h3>Githyanki Astral Knowledge</h3>
          <div className="placeholder-box">
            Astral Knowledge grants temporary proficiency in all skills linked to one chosen
            ability. It is not added to permanent build proficiencies here.
          </div>
        </div>
      )}

      <div className="section-block">
        <h3>Locked proficiencies</h3>
        <p className="panel-intro">
          These come from background, race, subclass, class features, or selected class options.
        </p>

        <div className="chip-grid">
          {lockedSkills.length === 0 && <span className="muted-text">No locked skills yet.</span>}
          {lockedSkills.map((skill) => (
            <span key={skill} className="choice-chip locked">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Class skill proficiencies</h3>
        <p className="panel-intro">
          {classRule
            ? `Choose ${maxClassSkills} skill${maxClassSkills > 1 ? "s" : ""}. Selected: ${
                selectedClassSkills.length
              }/${maxClassSkills}.`
            : "Select a class first."}
        </p>

        {selectedRace === "Human" && classRule && (
          <p className="panel-intro">
            Human adds one extra free skill proficiency. One selected skill may come from outside
            the class skill list.
          </p>
        )}

        <div className="skill-grid">
          {skillOptions.map((skill) => {
            const isLocked = lockedSkills.includes(skill);
            const isSelected = selectedClassSkills.includes(skill);
            const outsideClassOptions = classRule ? !classRule.options.includes(skill) : false;
            const currentOutsideClassCount = classRule
              ? selectedClassSkills.filter((item) => !classRule.options.includes(item)).length
              : 0;

            const humanOutsideLimitReached =
              selectedRace === "Human" &&
              outsideClassOptions &&
              currentOutsideClassCount >= 1 &&
              !isSelected;

            const nonHumanOutsideClass = selectedRace !== "Human" && outsideClassOptions;
            const maxReached = selectedClassSkills.length >= maxClassSkills && !isSelected;
            const disabled =
              isLocked || maxReached || humanOutsideLimitReached || nonHumanOutsideClass;

            return (
              <button
                key={skill}
                type="button"
                disabled={disabled}
                className={[
                  "choice-chip",
                  isSelected ? "selected" : "",
                  isLocked ? "locked" : "",
                  outsideClassOptions ? "outside-class-skill" : "",
                ].join(" ")}
                onClick={() => toggleClassSkill(skill)}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <h3>All current skill proficiencies</h3>
        <div className="chip-grid">
          {allProficiencies.length === 0 && (
            <span className="muted-text">No skills selected yet.</span>
          )}
          {allProficiencies.map((skill) => (
            <span key={skill} className="choice-chip summary-chip">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Expertise</h3>
        <div className="chip-grid">
          {allExpertise.length === 0 && <span className="muted-text">No expertise yet.</span>}
          {allExpertise.map((skill) => (
            <span key={skill} className="choice-chip expertise-chip">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CharacterTab;