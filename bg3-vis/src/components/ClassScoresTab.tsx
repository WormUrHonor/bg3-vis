import type { Dispatch, SetStateAction } from "react";
import type {
  AbilityScore,
  ClassName,
  ElementalAdeptDamageType,
  FeatName,
  FeatSelection,
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
  skills,
  subclassesByClass,
  warlockInvocations,
} from "../data/bg3CharacterData";
import {
  battleMasterManoeuvres,
  bg3Feats,
  elementalAdeptDamageTypes,
  getFeatDefinition,
  ritualCasterSpells,
  spellSniperCantrips,
  weaponMasterWeaponTypes,
} from "../data/bg3Feats";
import {
  calculateFinalAbilityScores,
  calculateUsedPointBuyPoints,
} from "../logic/abilityScoreLogic";
import {
  createEmptyFeatSelection,
  describeFeatSelection,
  resetFeatSelection,
} from "../logic/featLogic";

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
  baseAbilityScores: Record<AbilityScore, number>;
  bonusPlusTwo: AbilityScore | "";
  bonusPlusOne: AbilityScore | "";
  featSelections: FeatSelection[];
  featAbilityIncreases: Partial<Record<AbilityScore, number>>;
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
  setBaseAbilityScores: Dispatch<SetStateAction<Record<AbilityScore, number>>>;
  setBonusPlusTwo: (value: AbilityScore | "") => void;
  setBonusPlusOne: (value: AbilityScore | "") => void;
  setFeatSelections: Dispatch<SetStateAction<FeatSelection[]>>;
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
  baseAbilityScores,
  bonusPlusTwo,
  bonusPlusOne,
  featSelections,
  featAbilityIncreases,
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
  setBaseAbilityScores,
  setBonusPlusTwo,
  setBonusPlusOne,
  setFeatSelections,
}: ClassScoresTabProps) {
  const availableSubclasses = selectedClass ? subclassesByClass[selectedClass] : [];
  const usedPoints = calculateUsedPointBuyPoints(baseAbilityScores);
  const pointsRemaining = 27 - usedPoints;
  const knowledgeSkills: Skill[] = ["Arcana", "History", "Nature", "Religion"];

  const finalScores = calculateFinalAbilityScores(
    baseAbilityScores,
    bonusPlusTwo,
    bonusPlusOne,
    featAbilityIncreases
  );

  function increaseScore(score: AbilityScore) {
    setBaseAbilityScores((current) => {
      const currentValue = current[score];
      if (currentValue >= 15) return current;

      const nextValue = currentValue + 1;
      const costDifference = pointBuyCost[nextValue] - pointBuyCost[currentValue];

      if (pointsRemaining < costDifference) return current;

      return { ...current, [score]: nextValue };
    });
  }

  function decreaseScore(score: AbilityScore) {
    setBaseAbilityScores((current) => {
      const currentValue = current[score];
      if (currentValue <= 8) return current;
      return { ...current, [score]: currentValue - 1 };
    });
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

  function updateFeatSelection(
    slotLevel: number,
    updater: (current: FeatSelection) => FeatSelection
  ) {
    setFeatSelections((current) => {
      const existing = current.find((selection) => selection.slotLevel === slotLevel);

      if (!existing) {
        return [...current, updater(createEmptyFeatSelection(slotLevel))].sort(
          (a, b) => a.slotLevel - b.slotLevel
        );
      }

      return current.map((selection) =>
        selection.slotLevel === slotLevel ? updater(selection) : selection
      );
    });
  }

  function handleFeatNameChange(slotLevel: number, featName: FeatName | "") {
    updateFeatSelection(slotLevel, () => resetFeatSelection(slotLevel, featName));
  }

  function toggleFeatListItem(
    slotLevel: number,
    field:
      | "selectedSkills"
      | "selectedCantrips"
      | "selectedSpells"
      | "selectedWeaponTypes"
      | "selectedManoeuvres",
    item: string,
    max: number
  ) {
    updateFeatSelection(slotLevel, (current) => {
      const currentItems = current[field] as string[];
      const isSelected = currentItems.includes(item);

      if (isSelected) {
        return {
          ...current,
          [field]: currentItems.filter((currentItem) => currentItem !== item),
        };
      }

      if (currentItems.length >= max) {
        return current;
      }

      return {
        ...current,
        [field]: [...currentItems, item],
      };
    });
  }

  function setFeatAbility(
    slotLevel: number,
    field: "selectedAbility" | "secondaryAbility",
    value: AbilityScore | ""
  ) {
    updateFeatSelection(slotLevel, (current) => ({
      ...current,
      [field]: value,
    }));
  }

  function setFeatDamageType(
    slotLevel: number,
    value: ElementalAdeptDamageType | ""
  ) {
    updateFeatSelection(slotLevel, (current) => ({
      ...current,
      selectedDamageType: value,
    }));
  }

  function renderFeatChoices(selection: FeatSelection) {
    const feat = getFeatDefinition(selection.featName);
    if (!feat) return null;

    if (feat.choiceKind === "ability-improvement") {
      return (
        <div className="feat-choice-grid">
          <label>
            First +1
            <select
              value={selection.selectedAbility}
              onChange={(e) =>
                setFeatAbility(
                  selection.slotLevel,
                  "selectedAbility",
                  e.target.value as AbilityScore | ""
                )
              }
            >
              <option value="">Select ability</option>
              {abilityScores.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>

          <label>
            Second +1
            <select
              value={selection.secondaryAbility}
              onChange={(e) =>
                setFeatAbility(
                  selection.slotLevel,
                  "secondaryAbility",
                  e.target.value as AbilityScore | ""
                )
              }
            >
              <option value="">Select ability</option>
              {abilityScores.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

if (
  feat.choiceKind === "single-ability" ||
  feat.choiceKind === "resilient"
) {
  return (
    <div className="feat-choice-grid">
      <label>
        Ability increase
        <select
          value={selection.selectedAbility}
          onChange={(e) =>
            setFeatAbility(
              selection.slotLevel,
              "selectedAbility",
              e.target.value as AbilityScore | ""
            )
          }
        >
          <option value="">Select ability</option>
          {(feat.abilityOptions ?? abilityScores).map((score) => (
            <option key={score} value={score}>
              {score}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

    if (feat.choiceKind === "elemental-adept") {
      return (
        <div className="feat-choice-grid">
          <label>
            Damage type
            <select
              value={selection.selectedDamageType}
              onChange={(e) =>
                setFeatDamageType(
                  selection.slotLevel,
                  e.target.value as ElementalAdeptDamageType | ""
                )
              }
            >
              <option value="">Select damage type</option>
              {elementalAdeptDamageTypes.map((damageType) => (
                <option key={damageType} value={damageType}>
                  {damageType}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    if (feat.choiceKind === "skill-proficiencies") {
      const max = feat.chooseSkillCount ?? 3;

      return (
        <div className="feat-subsection">
          <p className="panel-intro">
            Choose {max} skill proficiencies. Selected: {selection.selectedSkills.length}/{max}.
          </p>

          <div className="skill-grid">
            {skills.map((skill) => {
              const isSelected = selection.selectedSkills.includes(skill);
              const alreadyProficient = allProficiencies.includes(skill) && !isSelected;
              const maxReached = selection.selectedSkills.length >= max && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  disabled={alreadyProficient || maxReached}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    alreadyProficient ? "locked" : "",
                  ].join(" ")}
                  onClick={() =>
                    toggleFeatListItem(selection.slotLevel, "selectedSkills", skill, max)
                  }
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (feat.choiceKind === "ritual-caster") {
      const max = feat.chooseSpellCount ?? 2;

      return (
        <div className="feat-subsection">
          <p className="panel-intro">
            Choose {max} ritual spells. Selected: {selection.selectedSpells.length}/{max}.
          </p>

          <div className="chip-grid">
            {ritualCasterSpells.map((spell) => {
              const isSelected = selection.selectedSpells.includes(spell);
              const maxReached = selection.selectedSpells.length >= max && !isSelected;

              return (
                <button
                  key={spell}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() =>
                    toggleFeatListItem(selection.slotLevel, "selectedSpells", spell, max)
                  }
                >
                  {spell}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (feat.choiceKind === "spell-sniper") {
      const max = feat.chooseCantripCount ?? 1;

      return (
        <div className="feat-subsection">
          <p className="panel-intro">
            Choose {max} cantrip. Selected: {selection.selectedCantrips.length}/{max}.
          </p>

          <div className="chip-grid">
            {spellSniperCantrips.map((cantrip) => {
              const isSelected = selection.selectedCantrips.includes(cantrip);
              const maxReached = selection.selectedCantrips.length >= max && !isSelected;

              return (
                <button
                  key={cantrip}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() =>
                    toggleFeatListItem(selection.slotLevel, "selectedCantrips", cantrip, max)
                  }
                >
                  {cantrip}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

if (feat.choiceKind === "weapon-master") {
  const max = feat.chooseWeaponCount ?? 4;

  return (
    <>
      <div className="feat-choice-grid">
        <label>
          Ability increase
          <select
            value={selection.selectedAbility}
            onChange={(e) =>
              setFeatAbility(
                selection.slotLevel,
                "selectedAbility",
                e.target.value as AbilityScore | ""
              )
            }
          >
            <option value="">Select ability</option>
            {(feat.abilityOptions ?? abilityScores).map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="feat-subsection">
        <p className="panel-intro">
          Choose {max} weapon proficiencies. Selected:{" "}
          {selection.selectedWeaponTypes.length}/{max}.
        </p>

        <div className="chip-grid">
          {weaponMasterWeaponTypes.map((weaponType) => {
            const isSelected = selection.selectedWeaponTypes.includes(weaponType);
            const maxReached =
              selection.selectedWeaponTypes.length >= max && !isSelected;

            return (
              <button
                key={weaponType}
                type="button"
                disabled={maxReached}
                className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                onClick={() =>
                  toggleFeatListItem(
                    selection.slotLevel,
                    "selectedWeaponTypes",
                    weaponType,
                    max
                  )
                }
              >
                {weaponType}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

    if (feat.choiceKind === "martial-adept") {
      const max = feat.chooseManoeuvreCount ?? 2;

      return (
        <div className="feat-subsection">
          <p className="panel-intro">
            Choose {max} manoeuvres. Selected: {selection.selectedManoeuvres.length}/{max}.
          </p>

          <div className="chip-grid">
            {battleMasterManoeuvres.map((manoeuvre) => {
              const isSelected = selection.selectedManoeuvres.includes(manoeuvre);
              const maxReached = selection.selectedManoeuvres.length >= max && !isSelected;

              return (
                <button
                  key={manoeuvre}
                  type="button"
                  disabled={maxReached}
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() =>
                    toggleFeatListItem(
                      selection.slotLevel,
                      "selectedManoeuvres",
                      manoeuvre,
                      max
                    )
                  }
                >
                  {manoeuvre}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (feat.choiceKind === "magic-initiate") {
      return (
        <div className="placeholder-box feat-note-box">
          This feat is recorded here. Its exact cantrip and spell choices should be connected to
          the spell data once Magic Initiate spell-list filtering is added.
        </div>
      );
    }

    return null;
  }

  return (
    <div className="tab-content">
      <h2>Class & Ability Scores</h2>
      <p className="panel-intro">
        Select the class progression, point-buy scores, flexible ability bonuses, and level-based
        feats used by the build.
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
          Feat slots
          <input
            value={
              featSelections.length > 0
                ? featSelections.map((selection) => `Level ${selection.slotLevel}`).join(", ")
                : "None yet"
            }
            readOnly
          />
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
          const currentValue = baseAbilityScores[score];
          const nextValue = currentValue + 1;
          const costDifference =
            nextValue <= 15 ? pointBuyCost[nextValue] - pointBuyCost[currentValue] : Infinity;

          const featBonus = featAbilityIncreases[score] ?? 0;
          const flexibleBonus =
            (bonusPlusTwo === score ? 2 : 0) + (bonusPlusOne === score ? 1 : 0);
          const totalBonus = flexibleBonus + featBonus;

          return (
            <div key={score} className="score-card">
              <span className="score-name">{score}</span>
              <div className="score-controls">
                <button
                  type="button"
                  onClick={() => decreaseScore(score)}
                  disabled={baseAbilityScores[score] <= 8}
                >
                  −
                </button>
                <strong>{baseAbilityScores[score]}</strong>
                <button
                  type="button"
                  onClick={() => increaseScore(score)}
                  disabled={baseAbilityScores[score] >= 15 || pointsRemaining < costDifference}
                >
                  +
                </button>
              </div>
              <span className="score-final">
                Final: {finalScores[score]}
                {totalBonus > 0 ? ` (+${totalBonus})` : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="form-grid">
        <label>
          +2 ability bonus
          <select
            value={bonusPlusTwo}
            onChange={(e) => setBonusPlusTwo(e.target.value as AbilityScore | "")}
          >
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
          <select
            value={bonusPlusOne}
            onChange={(e) => setBonusPlusOne(e.target.value as AbilityScore | "")}
          >
            <option value="">Select ability</option>
            {abilityScores.map((score) => (
              <option key={score} value={score} disabled={bonusPlusTwo === score}>
                {score}
              </option>
            ))}
          </select>
        </label>
      </div>

      {featSelections.length > 0 && (
        <div className="section-block">
          <h3>Feats</h3>
          <p className="panel-intro">
            Feat slots are based on the selected class and level. Fighter receives an additional
            slot at level 6, while Rogue receives an additional slot at level 10.
          </p>

          <div className="feat-slot-list">
            {featSelections.map((selection) => {
              const feat = getFeatDefinition(selection.featName);

              return (
                <div key={selection.slotLevel} className="feat-card">
                  <div className="feat-card-header">
                    <div>
                      <h4>Level {selection.slotLevel}</h4>
                      <span>{describeFeatSelection(selection)}</span>
                    </div>
                  </div>

                  <label>
                    Feat / ASI
                    <select
                      value={selection.featName}
                      onChange={(e) =>
                        handleFeatNameChange(
                          selection.slotLevel,
                          e.target.value as FeatName | ""
                        )
                      }
                    >
                      <option value="">Select feat</option>
                      {bg3Feats.map((featOption) => (
                        <option key={featOption.name} value={featOption.name}>
                          {featOption.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {feat && (
                    <>
                      <p className="feat-description">{feat.description}</p>
                      {feat.requirements && (
                        <p className="feat-requirement">{feat.requirements}</p>
                      )}
                      {renderFeatChoices(selection)}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            {skills.map((skill) => {
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