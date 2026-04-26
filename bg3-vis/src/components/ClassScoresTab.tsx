import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  AbilityScore,
  ClassName,
  RaceName,
  RangerFavouredEnemy,
  RangerNaturalExplorer,
  Skill,
  WarlockInvocation,
} from "../types/buildPlannerTypes";
import {
  abilityScores,
  classes,
  pointBuyCost,
  rangerFavouredEnemies,
  rangerNaturalExplorers,
  subclassesByClass,
  warlockInvocations,
} from "../data/bg3CharacterData";

type ClassScoresTabProps = {
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedRace: RaceName | "";
  selectedSubrace: string;
  allProficiencies: Skill[];
  bardExpertise: Skill[];
  rogueExpertise: Skill[];
  loreBardSkills: Skill[];
  knowledgeClericExpertise: Skill[];
  rangerFavouredEnemy: RangerFavouredEnemy | "";
  rangerNaturalExplorer: RangerNaturalExplorer | "";
  selectedWarlockInvocations: WarlockInvocation[];
  onClassChange: (value: string) => void;
  setSelectedSubclass: (value: string) => void;
  setSelectedLevel: (value: number) => void;
  setBardExpertise: Dispatch<SetStateAction<Skill[]>>;
  setRogueExpertise: Dispatch<SetStateAction<Skill[]>>;
  setLoreBardSkills: Dispatch<SetStateAction<Skill[]>>;
  setKnowledgeClericExpertise: Dispatch<SetStateAction<Skill[]>>;
  setRangerFavouredEnemy: (value: RangerFavouredEnemy | "") => void;
  setRangerNaturalExplorer: (value: RangerNaturalExplorer | "") => void;
  setSelectedWarlockInvocations: Dispatch<SetStateAction<WarlockInvocation[]>>;
};

function ClassScoresTab({
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedRace,
  selectedSubrace,
  allProficiencies,
  bardExpertise,
  rogueExpertise,
  loreBardSkills,
  knowledgeClericExpertise,
  rangerFavouredEnemy,
  rangerNaturalExplorer,
  selectedWarlockInvocations,
  onClassChange,
  setSelectedSubclass,
  setSelectedLevel,
  setBardExpertise,
  setRogueExpertise,
  setLoreBardSkills,
  setKnowledgeClericExpertise,
  setRangerFavouredEnemy,
  setRangerNaturalExplorer,
  setSelectedWarlockInvocations,
}: ClassScoresTabProps) {
  const [scores, setScores] = useState<Record<AbilityScore, number>>({
    Strength: 8,
    Dexterity: 8,
    Constitution: 8,
    Intelligence: 8,
    Wisdom: 8,
    Charisma: 8,
  });

  const [bonusPlusTwo, setBonusPlusTwo] = useState<AbilityScore | "">("");
  const [bonusPlusOne, setBonusPlusOne] = useState<AbilityScore | "">("");

  const availableSubclasses = selectedClass ? subclassesByClass[selectedClass] : [];
  const usedPoints = abilityScores.reduce((sum, score) => sum + pointBuyCost[scores[score]], 0);
  const pointsRemaining = 27 - usedPoints;
  const knowledgeSkills: Skill[] = ["Arcana", "History", "Nature", "Religion"];

  function increaseScore(score: AbilityScore) {
    setScores((current) => {
      const currentValue = current[score];
      if (currentValue >= 15) return current;

      const nextValue = currentValue + 1;
      const costDifference = pointBuyCost[nextValue] - pointBuyCost[currentValue];

      if (pointsRemaining < costDifference) return current;

      return { ...current, [score]: nextValue };
    });
  }

  function decreaseScore(score: AbilityScore) {
    setScores((current) => {
      const currentValue = current[score];
      if (currentValue <= 8) return current;
      return { ...current, [score]: currentValue - 1 };
    });
  }

  function finalScore(score: AbilityScore) {
    let bonus = 0;
    if (bonusPlusTwo === score) bonus += 2;
    if (bonusPlusOne === score) bonus += 1;
    return scores[score] + bonus;
  }

  function toggleLimitedSkill(
    skill: Skill,
    setter: Dispatch<SetStateAction<Skill[]>>,
    max: number,
    allowedOptions?: Skill[]
  ) {
    if (allowedOptions && !allowedOptions.includes(skill)) return;

    setter((current) => {
      if (current.includes(skill)) {
        return current.filter((item) => item !== skill);
      }

      if (current.length >= max) {
        return current;
      }

      return [...current, skill];
    });
  }

  function toggleInvocation(invocation: WarlockInvocation) {
    setSelectedWarlockInvocations((current) => {
      if (current.includes(invocation)) {
        return current.filter((item) => item !== invocation);
      }

      return [...current, invocation];
    });
  }

  return (
    <div className="tab-content">
      <h2>Class & Ability Scores</h2>
      <p className="panel-intro">
        Core BG3 build choices. Multiclassing is intentionally excluded.
      </p>

      <div className="form-grid">
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

        <label>
          Subclass
          <select
            value={selectedSubclass}
            onChange={(e) => {
              setSelectedSubclass(e.target.value);
              setLoreBardSkills([]);
              setKnowledgeClericExpertise([]);
            }}
            disabled={!selectedClass}
          >
            <option value="">{selectedClass ? "Select subclass" : "Select class first"}</option>
            {availableSubclasses.map((subclass) => (
              <option key={subclass} value={subclass}>
                {subclass}
              </option>
            ))}
          </select>
        </label>

        <label>
          Level
          <select
            value={selectedLevel}
            onChange={(e) => {
              const nextLevel = Number(e.target.value);
              setSelectedLevel(nextLevel);

              if (nextLevel < 3) {
                setBardExpertise([]);
                setLoreBardSkills([]);
              }

              if (nextLevel < 6) {
                setRogueExpertise((current) => current.slice(0, 2));
              }
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>
        </label>

        <label>
          Feat / ASI
          <select>
            <option>Select later</option>
            <option>Ability Score Improvement</option>
            <option>Actor</option>
            <option>Alert</option>
            <option>Great Weapon Master</option>
            <option>Sharpshooter</option>
            <option>War Caster</option>
          </select>
        </label>
      </div>

      <h3>Ability Scores</h3>
      <div className="point-buy-header">
        <strong>Point buy</strong>
        <span>
          Used: {usedPoints}/27 · Remaining: {pointsRemaining}
        </span>
      </div>

      <div className="score-grid improved">
        {abilityScores.map((score) => {
          const currentValue = scores[score];
          const nextValue = currentValue + 1;
          const costDifference =
            nextValue <= 15 ? pointBuyCost[nextValue] - pointBuyCost[currentValue] : Infinity;

          return (
            <div key={score} className="score-card">
              <span className="score-name">{score}</span>
              <div className="score-controls">
                <button type="button" onClick={() => decreaseScore(score)} disabled={scores[score] <= 8}>
                  −
                </button>
                <strong>{scores[score]}</strong>
                <button
                  type="button"
                  onClick={() => increaseScore(score)}
                  disabled={scores[score] >= 15 || pointsRemaining < costDifference}
                >
                  +
                </button>
              </div>
              <span className="score-final">Final: {finalScore(score)}</span>
            </div>
          );
        })}
      </div>

      <div className="form-grid">
        <label>
          +2 ability bonus
          <select value={bonusPlusTwo} onChange={(e) => setBonusPlusTwo(e.target.value as AbilityScore | "")}>
            <option value="">Select ability</option>
            {abilityScores.map((score) => (
              <option key={score} value={score} disabled={bonusPlusOne === score}>
                {score}
              </option>
            ))}
          </select>
        </label>

        <label>
          +1 ability bonus
          <select value={bonusPlusOne} onChange={(e) => setBonusPlusOne(e.target.value as AbilityScore | "")}>
            <option value="">Select ability</option>
            {abilityScores.map((score) => (
              <option key={score} value={score} disabled={bonusPlusTwo === score}>
                {score}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedClass === "Ranger" && (
        <div className="section-block">
          <h3>Ranger proficiencies</h3>

          <div className="form-grid">
            <label>
              Favoured Enemy
              <select
                value={rangerFavouredEnemy}
                onChange={(e) => setRangerFavouredEnemy(e.target.value as RangerFavouredEnemy | "")}
              >
                <option value="">Select favoured enemy</option>
                {rangerFavouredEnemies.map((enemy) => (
                  <option key={enemy} value={enemy}>
                    {enemy}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Natural Explorer
              <select
                value={rangerNaturalExplorer}
                onChange={(e) => setRangerNaturalExplorer(e.target.value as RangerNaturalExplorer | "")}
              >
                <option value="">Select natural explorer</option>
                {rangerNaturalExplorers.map((environment) => (
                  <option key={environment} value={environment}>
                    {environment}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {selectedClass === "Warlock" && (
        <div className="section-block">
          <h3>Eldritch Invocations</h3>
          <p className="panel-intro">Beguiling Influence grants Deception and Persuasion proficiency.</p>

          <div className="chip-grid">
            {warlockInvocations.map((invocation) => {
              const isSelected = selectedWarlockInvocations.includes(invocation);

              return (
                <button
                  key={invocation}
                  type="button"
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() => toggleInvocation(invocation)}
                >
                  {invocation}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Bard" && selectedSubclass === "College of Lore" && selectedLevel >= 3 && (
        <div className="section-block">
          <h3>College of Lore bonus proficiencies</h3>
          <p className="panel-intro">Choose any three additional skill proficiencies.</p>

          <div className="skill-grid">
            {knowledgeSkills.concat(allProficiencies).length > 0 &&
              ([
                "Acrobatics",
                "Animal Handling",
                "Arcana",
                "Athletics",
                "Deception",
                "History",
                "Insight",
                "Intimidation",
                "Investigation",
                "Medicine",
                "Nature",
                "Perception",
                "Performance",
                "Persuasion",
                "Religion",
                "Sleight of Hand",
                "Stealth",
                "Survival",
              ] as Skill[]).map((skill) => {
                const isSelected = loreBardSkills.includes(skill);
                const alreadyKnown = allProficiencies.includes(skill) && !isSelected;
                const maxReached = loreBardSkills.length >= 3 && !isSelected;

                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={alreadyKnown || maxReached}
                    className={["choice-chip", isSelected ? "selected" : "", alreadyKnown ? "locked" : ""].join(" ")}
                    onClick={() => toggleLimitedSkill(skill, setLoreBardSkills, 3)}
                  >
                    {skill}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {selectedClass === "Cleric" && selectedSubclass === "Knowledge Domain" && (
        <div className="section-block">
          <h3>Knowledge Domain expertise</h3>
          <p className="panel-intro">
            Choose two from Arcana, History, Nature, and Religion. These do not require prior proficiency.
          </p>

          <div className="skill-grid">
            {knowledgeSkills.map((skill) => {
              const isSelected = knowledgeClericExpertise.includes(skill);
              const maxReached = knowledgeClericExpertise.length >= 2 && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() => toggleLimitedSkill(skill, setKnowledgeClericExpertise, 2, knowledgeSkills)}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Bard" && selectedLevel >= 3 && (
        <div className="section-block">
          <h3>Bard expertise</h3>
          <p className="panel-intro">
            Bards select expertise in two proficient skills at level 3. A second pair becomes available at level 10.
          </p>

          <div className="skill-grid">
            {allProficiencies.map((skill) => {
              const maxExpertise = selectedLevel >= 10 ? 4 : 2;
              const isSelected = bardExpertise.includes(skill);
              const maxReached = bardExpertise.length >= maxExpertise && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() => toggleLimitedSkill(skill, setBardExpertise, maxExpertise)}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Rogue" && (
        <div className="section-block">
          <h3>Rogue expertise</h3>
          <p className="panel-intro">
            Rogues select expertise in two proficient skills at level 1. A second pair becomes available at level 6.
          </p>

          <div className="skill-grid">
            {allProficiencies.map((skill) => {
              const maxExpertise = selectedLevel >= 6 ? 4 : 2;
              const isSelected = rogueExpertise.includes(skill);
              const maxReached = rogueExpertise.length >= maxExpertise && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() => toggleLimitedSkill(skill, setRogueExpertise, maxExpertise)}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedRace === "Gnome" && selectedSubrace === "Rock Gnome" && (
        <div className="section-block">
          <h3>Rock Gnome expertise</h3>
          <div className="placeholder-box">
            Rock Gnomes have expertise in History. This is applied directly.
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassScoresTab;