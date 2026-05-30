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
import { logFrictionEvent, logStudyEvent } from "../logic/studyLogger";

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

  activeView?: string | null;
  activeBuildId?: string | null;
  activeBuildLabel?: string | null;
  activePartyMemberIndex?: number | null;
  activePartyMemberLabel?: string | null;
  activeFocusSource?: string | null;
  partySnapshotHash?: string | null;
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
  activeView = "class-scores-tab",
  activeBuildId = null,
  activeBuildLabel = null,
  activePartyMemberIndex = null,
  activePartyMemberLabel = null,
  activeFocusSource = null,
  partySnapshotHash = null,
}: ClassScoresTabProps) {
  const availableSubclasses = selectedClass ? subclassesByClass[selectedClass] : [];
  const usedPoints = calculateUsedPointBuyPoints(baseAbilityScores);
  const pointsRemaining = 27 - usedPoints;
  const knowledgeSkills: Skill[] = ["Arcana", "History", "Nature", "Religion"];

  const selectedFeatCount = featSelections.filter(
    (selection) => selection.featName
  ).length;

  const finalScores = calculateFinalAbilityScores(
    baseAbilityScores,
    bonusPlusTwo,
    bonusPlusOne,
    featAbilityIncreases
  );

  function getLoggingContext() {
    return {
      activeView,
      activeBuildId,
      activeBuildLabel: activeBuildLabel || selectedSubclass || selectedClass || null,
      activePartyMemberIndex,
      activePartyMemberLabel,
      activeFocusSource,
      partySnapshotHash,
    };
  }

  function logIntent(
    eventType: string,
    payload: Record<string, unknown>,
    eventCategory:
      | "navigation"
      | "build_edit"
      | "build_state"
      | "friction" = "build_edit"
  ) {
    logStudyEvent({
      eventCategory,
      eventType,
      taskPhase: "exploration",
      ...getLoggingContext(),
      payload: {
        sourceComponent: "ClassScoresTab",
        selectedClass,
        selectedSubclass,
        selectedLevel,
        selectedRace,
        selectedSubrace,
        usedPoints,
        pointsRemaining,
        selectedFeatCount,
        totalFeatSlots: featSelections.length,
        ...payload,
      },
    });
  }

  function logBlockedAction(
    targetType: string,
    targetId: string,
    reason: string,
    extraPayload: Record<string, unknown> = {}
  ) {
    logFrictionEvent(
      "invalid_selection_attempted",
      {
        sourceComponent: "ClassScoresTab",
        targetType,
        targetId,
        reason,
        selectedClass,
        selectedSubclass,
        selectedLevel,
        usedPoints,
        pointsRemaining,
        selectedFeatCount,
        totalFeatSlots: featSelections.length,
        ...extraPayload,
      },
      getLoggingContext()
    );
  }

  function increaseLevel() {
    const nextLevel = Math.min(12, selectedLevel + 1);

    if (nextLevel === selectedLevel) {
      logBlockedAction("level-stepper", "increase-level", "level_max_reached", {
        currentLevel: selectedLevel,
        maxLevel: 12,
      });
      return;
    }

    logIntent("level_changed", {
      direction: "increase",
      previousLevel: selectedLevel,
      nextLevel,
      resetBardExpertise: false,
      resetLoreBardSkills: false,
      trimmedRogueExpertise: false,
    });

    setSelectedLevel(nextLevel);
  }

  function decreaseLevel() {
    const nextLevel = Math.max(1, selectedLevel - 1);

    if (nextLevel === selectedLevel) {
      logBlockedAction("level-stepper", "decrease-level", "level_min_reached", {
        currentLevel: selectedLevel,
        minLevel: 1,
      });
      return;
    }

    logIntent("level_changed", {
      direction: "decrease",
      previousLevel: selectedLevel,
      nextLevel,
      resetBardExpertise: nextLevel < 3 && bardExpertise.length > 0,
      resetLoreBardSkills: nextLevel < 3 && loreBardSkills.length > 0,
      trimmedRogueExpertise: nextLevel < 6 && rogueExpertise.length > 2,
      previousBardExpertiseCount: bardExpertise.length,
      previousLoreBardSkillCount: loreBardSkills.length,
      previousRogueExpertiseCount: rogueExpertise.length,
    });

    setSelectedLevel(nextLevel);

    if (nextLevel < 3) {
      setBardExpertise([]);
      setLoreBardSkills([]);
    }

    if (nextLevel < 6) {
      setRogueExpertise((current) => current.slice(0, 2));
    }
  }

  function increaseScore(score: AbilityScore) {
    setBaseAbilityScores((current) => {
      const currentValue = current[score];

      if (currentValue >= 15) {
        logBlockedAction("ability-score", score, "point_buy_score_max_reached", {
          action: "increase",
          score,
          currentValue,
          maxValue: 15,
        });
        return current;
      }

      const nextValue = currentValue + 1;
      const currentUsedPoints = calculateUsedPointBuyPoints(current);
      const currentRemainingPoints = 27 - currentUsedPoints;
      const costDifference =
        pointBuyCost[nextValue] - pointBuyCost[currentValue];

      if (currentRemainingPoints < costDifference) {
        logBlockedAction("ability-score", score, "not_enough_point_buy_points", {
          action: "increase",
          score,
          currentValue,
          attemptedValue: nextValue,
          costDifference,
          currentRemainingPoints,
        });
        return current;
      }

      logIntent("ability_score_changed", {
        action: "increase",
        score,
        previousValue: currentValue,
        nextValue,
        costDifference,
        previousUsedPoints: currentUsedPoints,
        nextUsedPoints: currentUsedPoints + costDifference,
        previousRemainingPoints: currentRemainingPoints,
        nextRemainingPoints: currentRemainingPoints - costDifference,
      });

      return { ...current, [score]: nextValue };
    });
  }

  function decreaseScore(score: AbilityScore) {
    setBaseAbilityScores((current) => {
      const currentValue = current[score];

      if (currentValue <= 8) {
        logBlockedAction("ability-score", score, "point_buy_score_min_reached", {
          action: "decrease",
          score,
          currentValue,
          minValue: 8,
        });
        return current;
      }

      const nextValue = currentValue - 1;
      const currentUsedPoints = calculateUsedPointBuyPoints(current);
      const refund = pointBuyCost[currentValue] - pointBuyCost[nextValue];

      logIntent("ability_score_changed", {
        action: "decrease",
        score,
        previousValue: currentValue,
        nextValue,
        refundedPoints: refund,
        previousUsedPoints: currentUsedPoints,
        nextUsedPoints: currentUsedPoints - refund,
        previousRemainingPoints: 27 - currentUsedPoints,
        nextRemainingPoints: 27 - currentUsedPoints + refund,
      });

      return { ...current, [score]: nextValue };
    });
  }

  function toggleLimitedSkill(
    skill: Skill,
    setter: Dispatch<SetStateAction<Skill[]>>,
    max: number,
    fieldName: string,
    allowedOptions?: Skill[]
  ) {
    if (allowedOptions && !allowedOptions.includes(skill)) {
      logBlockedAction(fieldName, skill, "skill_not_in_allowed_options", {
        skill,
        allowedOptions,
      });
      return;
    }

    setter((current) => {
      const isSelected = current.includes(skill);
      const maxReached = current.length >= max && !isSelected;

      logIntent("limited_skill_toggle_attempted", {
        fieldName,
        skill,
        action: isSelected ? "remove" : "add",
        wasSelected: isSelected,
        wouldBeBlocked: maxReached,
        blockedReason: maxReached ? "choice_limit_reached" : null,
        selectedCountBefore: current.length,
        selectedCountAfter: maxReached
          ? current.length
          : isSelected
            ? current.length - 1
            : current.length + 1,
        max,
      });

      if (maxReached) {
        logBlockedAction(fieldName, skill, "choice_limit_reached", {
          skill,
          selectedCount: current.length,
          max,
        });
        return current;
      }

      if (isSelected) {
        return current.filter((item) => item !== skill);
      }

      return [...current, skill];
    });
  }

  function toggleInvocation(invocation: WarlockInvocation) {
    setSelectedWarlockInvocations((current) => {
      const isSelected = current.includes(invocation);

      logIntent("warlock_invocation_toggled", {
        invocation,
        action: isSelected ? "remove" : "add",
        selectedCountBefore: current.length,
        selectedCountAfter: isSelected ? current.length - 1 : current.length + 1,
      });

      if (isSelected) {
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
      const existing = current.find(
        (selection) => selection.slotLevel === slotLevel
      );

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

  function handleClassChange(value: string) {
    logIntent("class_field_changed", {
      field: "selectedClass",
      previousValue: selectedClass,
      nextValue: value,
      resetsSubclass: selectedSubclass !== "",
      previousSubclass: selectedSubclass || null,
    });

    onClassChange(value);
  }

  function handleSubclassChange(value: string) {
    logIntent("class_field_changed", {
      field: "selectedSubclass",
      previousValue: selectedSubclass,
      nextValue: value,
      resetsLoreBardSkills: loreBardSkills.length > 0,
      resetsKnowledgeClericExpertise: knowledgeClericExpertise.length > 0,
      previousLoreBardSkillCount: loreBardSkills.length,
      previousKnowledgeExpertiseCount: knowledgeClericExpertise.length,
    });

    setSelectedSubclass(value);
    setLoreBardSkills([]);
    setKnowledgeClericExpertise([]);
  }

  function handleBonusPlusTwoChange(value: string) {
    const nextValue = value as AbilityScore | "";

    logIntent("ability_bonus_changed", {
      field: "bonusPlusTwo",
      previousValue: bonusPlusTwo,
      nextValue,
      blockedDuplicateWithPlusOne: nextValue !== "" && nextValue === bonusPlusOne,
    });

    setBonusPlusTwo(nextValue);
  }

  function handleBonusPlusOneChange(value: string) {
    const nextValue = value as AbilityScore | "";

    logIntent("ability_bonus_changed", {
      field: "bonusPlusOne",
      previousValue: bonusPlusOne,
      nextValue,
      blockedDuplicateWithPlusTwo: nextValue !== "" && nextValue === bonusPlusTwo,
    });

    setBonusPlusOne(nextValue);
  }

  function handleFeatNameChange(slotLevel: number, featName: FeatName | "") {
    const previousSelection =
      featSelections.find((selection) => selection.slotLevel === slotLevel) ??
      createEmptyFeatSelection(slotLevel);

    logIntent("feat_name_changed", {
      slotLevel,
      previousFeatName: previousSelection.featName,
      nextFeatName: featName,
      previousSelection,
      resetsFeatChoices: true,
    });

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
      const maxReached = currentItems.length >= max && !isSelected;

      logIntent("feat_choice_toggled", {
        slotLevel,
        featName: current.featName,
        field,
        item,
        action: isSelected ? "remove" : "add",
        wasSelected: isSelected,
        selectedCountBefore: currentItems.length,
        selectedCountAfter: maxReached
          ? currentItems.length
          : isSelected
            ? currentItems.length - 1
            : currentItems.length + 1,
        max,
        wouldBeBlocked: maxReached,
        blockedReason: maxReached ? "choice_limit_reached" : null,
      });

      if (maxReached) {
        logBlockedAction("feat-choice", `${slotLevel}-${field}-${item}`, "choice_limit_reached", {
          slotLevel,
          featName: current.featName,
          field,
          item,
          selectedCount: currentItems.length,
          max,
        });
        return current;
      }

      if (isSelected) {
        return {
          ...current,
          [field]: currentItems.filter((currentItem) => currentItem !== item),
        };
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
    updateFeatSelection(slotLevel, (current) => {
      logIntent("feat_ability_changed", {
        slotLevel,
        featName: current.featName,
        field,
        previousValue: current[field],
        nextValue: value,
      });

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function setFeatDamageType(
    slotLevel: number,
    value: ElementalAdeptDamageType | ""
  ) {
    updateFeatSelection(slotLevel, (current) => {
      logIntent("feat_damage_type_changed", {
        slotLevel,
        featName: current.featName,
        previousValue: current.selectedDamageType,
        nextValue: value,
      });

      return {
        ...current,
        selectedDamageType: value,
      };
    });
  }

  function handleRangerFavouredEnemyChange(value: string) {
    const nextValue = value as RangerFavouredEnemy | "";

    logIntent("ranger_choice_changed", {
      field: "rangerFavouredEnemy",
      previousValue: rangerFavouredEnemy,
      nextValue,
    });

    setRangerFavouredEnemy(nextValue);
  }

  function handleRangerNaturalExplorerChange(value: string) {
    const nextValue = value as RangerNaturalExplorer | "";

    logIntent("ranger_choice_changed", {
      field: "rangerNaturalExplorer",
      previousValue: rangerNaturalExplorer,
      nextValue,
    });

    setRangerNaturalExplorer(nextValue);
  }

  function renderFeatChoices(selection: FeatSelection) {
    const feat = getFeatDefinition(selection.featName);

    if (!feat) return null;

    if (feat.choiceKind === "ability-improvement") {
      return (
        <div className="feat-choice-grid" data-study-region="feat-asi-choice-grid">
          <label data-study-id={`feat-${selection.slotLevel}-first-ability`}>
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
              data-study-id={`feat-${selection.slotLevel}-first-ability-select`}
            >
              <option value="">Select ability</option>
              {abilityScores.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>

          <label data-study-id={`feat-${selection.slotLevel}-second-ability`}>
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
              data-study-id={`feat-${selection.slotLevel}-second-ability-select`}
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
        <div className="feat-choice-grid" data-study-region="feat-single-ability-grid">
          <label data-study-id={`feat-${selection.slotLevel}-single-ability`}>
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
              data-study-id={`feat-${selection.slotLevel}-single-ability-select`}
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
        <div className="feat-choice-grid" data-study-region="feat-elemental-adept-grid">
          <label data-study-id={`feat-${selection.slotLevel}-damage-type`}>
            Damage type
            <select
              value={selection.selectedDamageType}
              onChange={(e) =>
                setFeatDamageType(
                  selection.slotLevel,
                  e.target.value as ElementalAdeptDamageType | ""
                )
              }
              data-study-id={`feat-${selection.slotLevel}-damage-type-select`}
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
        <div className="feat-subsection" data-study-region="feat-skill-proficiency-section">
          <p className="panel-intro compact-intro">
            Choose {max} skill proficiencies. Selected:{" "}
            {selection.selectedSkills.length}/{max}.
          </p>

          <div className="skill-grid compact-chip-grid" data-study-region="feat-skill-grid">
            {skills.map((skill) => {
              const isSelected = selection.selectedSkills.includes(skill);
              const alreadyProficient =
                allProficiencies.includes(skill) && !isSelected;
              const maxReached =
                selection.selectedSkills.length >= max && !isSelected;
              const isBlocked = alreadyProficient || maxReached;

              return (
                <button
                  key={skill}
                  type="button"
                  aria-disabled={isBlocked}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    alreadyProficient ? "locked" : "",
                    isBlocked ? "choice-chip--blocked" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (alreadyProficient) {
                      logBlockedAction(
                        "feat-skill",
                        `${selection.slotLevel}-${skill}`,
                        "already_proficient",
                        {
                          slotLevel: selection.slotLevel,
                          featName: selection.featName,
                          skill,
                        }
                      );
                      return;
                    }

                    toggleFeatListItem(
                      selection.slotLevel,
                      "selectedSkills",
                      skill,
                      max
                    );
                  }}
                  data-study-id={`feat-${selection.slotLevel}-skill-${skill}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (
      feat.choiceKind === "ritual-caster" ||
      feat.choiceKind === "spell-sniper" ||
      feat.choiceKind === "magic-initiate"
    ) {
      return (
        <div
          className="feat-subsection"
          data-study-region="feat-spell-choice-placeholder"
          data-study-id={`feat-${selection.slotLevel}-spell-choice-placeholder`}
        />
      );
    }

    if (feat.choiceKind === "weapon-master") {
      const max = feat.chooseWeaponCount ?? 4;

      return (
        <>
          <div className="feat-choice-grid" data-study-region="feat-weapon-master-ability-grid">
            <label data-study-id={`feat-${selection.slotLevel}-weapon-master-ability`}>
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
                data-study-id={`feat-${selection.slotLevel}-weapon-master-ability-select`}
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

          <div className="feat-subsection" data-study-region="feat-weapon-master-section">
            <p className="panel-intro compact-intro">
              Choose {max} weapon proficiencies. Selected:{" "}
              {selection.selectedWeaponTypes.length}/{max}.
            </p>

            <div className="chip-grid compact-chip-grid" data-study-region="feat-weapon-master-grid">
              {weaponMasterWeaponTypes.map((weaponType) => {
                const isSelected =
                  selection.selectedWeaponTypes.includes(weaponType);
                const maxReached =
                  selection.selectedWeaponTypes.length >= max && !isSelected;

                return (
                  <button
                    key={weaponType}
                    type="button"
                    aria-disabled={maxReached}
                    className={[
                      "choice-chip",
                      isSelected ? "selected" : "",
                      maxReached ? "choice-chip--blocked" : "",
                    ].join(" ")}
                    onClick={() =>
                      toggleFeatListItem(
                        selection.slotLevel,
                        "selectedWeaponTypes",
                        weaponType,
                        max
                      )
                    }
                    data-study-id={`feat-${selection.slotLevel}-weapon-${weaponType}`}
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
        <div className="feat-subsection" data-study-region="feat-martial-adept-section">
          <p className="panel-intro compact-intro">
            Choose {max} manoeuvres. Selected:{" "}
            {selection.selectedManoeuvres.length}/{max}.
          </p>

          <div className="chip-grid compact-chip-grid" data-study-region="feat-manoeuvre-grid">
            {battleMasterManoeuvres.map((manoeuvre) => {
              const isSelected = selection.selectedManoeuvres.includes(manoeuvre);
              const maxReached =
                selection.selectedManoeuvres.length >= max && !isSelected;

              return (
                <button
                  key={manoeuvre}
                  type="button"
                  aria-disabled={maxReached}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    maxReached ? "choice-chip--blocked" : "",
                  ].join(" ")}
                  onClick={() =>
                    toggleFeatListItem(
                      selection.slotLevel,
                      "selectedManoeuvres",
                      manoeuvre,
                      max
                    )
                  }
                  data-study-id={`feat-${selection.slotLevel}-manoeuvre-${manoeuvre}`}
                >
                  {manoeuvre}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div
      className="tab-content"
      data-study-region="class-scores-tab"
      data-study-id="class-scores-tab"
    >
      <h2 data-study-id="class-scores-tab-title">Class & Ability Scores</h2>

      <p className="panel-intro" data-study-id="class-scores-tab-intro">
        Select the class progression, point-buy scores, flexible ability bonuses, and
        level-based feats used by the build.
      </p>

      <div className="form-grid compact-class-grid" data-study-region="class-progression-fields">
        <label data-study-id="class-scores-class-field">
          Class
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            data-study-id="class-scores-class-select"
          >
            <option value="">Select class</option>
            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="subclass-field">
          Subclass
          <select
            value={selectedSubclass}
            onChange={(e) => handleSubclassChange(e.target.value)}
            disabled={!selectedClass}
            data-study-id="subclass-select"
          >
            <option value="">
              {selectedClass ? "Select subclass" : "Select class first"}
            </option>
            {availableSubclasses.map((subclass) => (
              <option key={subclass} value={subclass}>
                {subclass}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="level-stepper-field">
          <span className="label-with-meta">
            Level
            {selectedClass && featSelections.length > 0 && (
              <span>
                {selectedFeatCount}/{featSelections.length} feats selected
              </span>
            )}
          </span>

          <div className="level-stepper" data-study-region="level-stepper">
            <button
              type="button"
              onClick={decreaseLevel}
              aria-disabled={selectedLevel <= 1}
              aria-label="Decrease level"
              data-study-id="decrease-level-button"
            >
              −
            </button>

            <strong data-study-id="current-level-label">Level {selectedLevel}</strong>

            <button
              type="button"
              onClick={increaseLevel}
              aria-disabled={selectedLevel >= 12}
              aria-label="Increase level"
              data-study-id="increase-level-button"
            >
              +
            </button>
          </div>
        </label>
      </div>

      <h3 data-study-id="ability-scores-heading">Ability Scores</h3>

      <div className="point-buy-header" data-study-region="point-buy-header">
        <strong>Point buy</strong>
        <span data-study-id="point-buy-counter">
          Used: {usedPoints}/27 · Remaining: {pointsRemaining}
        </span>
      </div>

      <div className="score-grid improved" data-study-region="ability-score-grid">
        {abilityScores.map((score) => {
          const currentValue = baseAbilityScores[score];
          const nextValue = currentValue + 1;
          const costDifference =
            nextValue <= 15
              ? pointBuyCost[nextValue] - pointBuyCost[currentValue]
              : Infinity;

          const featBonus = featAbilityIncreases[score] ?? 0;
          const flexibleBonus =
            (bonusPlusTwo === score ? 2 : 0) + (bonusPlusOne === score ? 1 : 0);
          const totalBonus = flexibleBonus + featBonus;

          const increaseBlocked =
            baseAbilityScores[score] >= 15 || pointsRemaining < costDifference;

          return (
            <div
              key={score}
              className="score-card"
              data-study-region="ability-score-card"
              data-study-id={`ability-score-${score}`}
            >
              <span className="score-name">{score}</span>

              <div className="score-controls">
                <button
                  type="button"
                  onClick={() => decreaseScore(score)}
                  aria-disabled={baseAbilityScores[score] <= 8}
                  data-study-id={`decrease-${score}`}
                >
                  −
                </button>

                <strong data-study-id={`base-score-${score}`}>
                  {baseAbilityScores[score]}
                </strong>

                <button
                  type="button"
                  onClick={() => increaseScore(score)}
                  aria-disabled={increaseBlocked}
                  data-study-id={`increase-${score}`}
                >
                  +
                </button>
              </div>

              <span className="score-final" data-study-id={`final-score-${score}`}>
                Final: {finalScores[score]}
                {totalBonus > 0 ? ` (+${totalBonus})` : ""}
              </span>
            </div>
          );
        })}
      </div>

      <div className="form-grid" data-study-region="flexible-ability-bonus-fields">
        <label data-study-id="plus-two-bonus-field">
          +2 ability bonus
          <select
            value={bonusPlusTwo}
            onChange={(e) => handleBonusPlusTwoChange(e.target.value)}
            data-study-id="plus-two-bonus-select"
          >
            <option value="">Select ability</option>
            {abilityScores.map((score) => (
              <option key={score} value={score} disabled={bonusPlusOne === score}>
                {score}
              </option>
            ))}
          </select>
        </label>

        <label data-study-id="plus-one-bonus-field">
          +1 ability bonus
          <select
            value={bonusPlusOne}
            onChange={(e) => handleBonusPlusOneChange(e.target.value)}
            data-study-id="plus-one-bonus-select"
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
        <div
          className="section-block"
          data-study-region="feats-section"
          data-study-id="feats-section"
        >
          <div className="section-heading-row">
            <div>
              <h3>Feats</h3>
              <p className="panel-intro compact-intro">
                Choose feats for the available level-up slots. Ability increases
                and proficiency effects are applied automatically.
              </p>
            </div>

            <span className="section-count-pill" data-study-id="feat-count-pill">
              {selectedFeatCount}/{featSelections.length}
            </span>
          </div>

          <div className="feat-slot-list" data-study-region="feat-slot-list">
            {featSelections.map((selection) => {
              const feat = getFeatDefinition(selection.featName);

              return (
                <div
                  key={selection.slotLevel}
                  className="feat-card"
                  data-study-region="feat-card"
                  data-study-id={`feat-slot-${selection.slotLevel}`}
                >
                  <div className="feat-card-header compact-feat-header">
                    <span className="feat-level-pill">
                      Lv. {selection.slotLevel}
                    </span>
                    <span className="feat-summary-line">
                      {describeFeatSelection(selection)}
                    </span>
                  </div>

                  <label data-study-id={`feat-${selection.slotLevel}-name-field`}>
                    Feat / ASI
                    <select
                      value={selection.featName}
                      onChange={(e) =>
                        handleFeatNameChange(
                          selection.slotLevel,
                          e.target.value as FeatName | ""
                        )
                      }
                      data-study-id={`feat-${selection.slotLevel}-name-select`}
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
        <div className="section-block" data-study-region="ranger-proficiencies-section">
          <h3>Ranger proficiencies</h3>

          <div className="form-grid">
            <label data-study-id="ranger-favoured-enemy-field">
              Favoured Enemy
              <select
                value={rangerFavouredEnemy}
                onChange={(e) => handleRangerFavouredEnemyChange(e.target.value)}
                data-study-id="ranger-favoured-enemy-select"
              >
                <option value="">Select favoured enemy</option>
                {rangerFavouredEnemies.map((enemy) => (
                  <option key={enemy} value={enemy}>
                    {enemy}
                  </option>
                ))}
              </select>
            </label>

            <label data-study-id="ranger-natural-explorer-field">
              Natural Explorer
              <select
                value={rangerNaturalExplorer}
                onChange={(e) => handleRangerNaturalExplorerChange(e.target.value)}
                data-study-id="ranger-natural-explorer-select"
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
        <div className="section-block" data-study-region="warlock-invocations-section">
          <h3>Eldritch Invocations</h3>
          <p className="panel-intro">
            Beguiling Influence grants Deception and Persuasion proficiency.
          </p>

          <div className="chip-grid" data-study-region="warlock-invocation-grid">
            {warlockInvocations.map((invocation) => {
              const isSelected = selectedWarlockInvocations.includes(invocation);

              return (
                <button
                  key={invocation}
                  type="button"
                  className={["choice-chip", isSelected ? "selected" : ""].join(" ")}
                  onClick={() => toggleInvocation(invocation)}
                  data-study-id={`warlock-invocation-${invocation}`}
                >
                  {invocation}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Bard" &&
        selectedSubclass === "College of Lore" &&
        selectedLevel >= 3 && (
          <div className="section-block" data-study-region="lore-bard-skills-section">
            <h3>College of Lore bonus proficiencies</h3>
            <p className="panel-intro">
              Choose any three additional skill proficiencies.
            </p>

            <div className="skill-grid" data-study-region="lore-bard-skill-grid">
              {skills.map((skill) => {
                const isSelected = loreBardSkills.includes(skill);
                const alreadyKnown = allProficiencies.includes(skill) && !isSelected;
                const maxReached = loreBardSkills.length >= 3 && !isSelected;
                const isBlocked = alreadyKnown || maxReached;

                return (
                  <button
                    key={skill}
                    type="button"
                    aria-disabled={isBlocked}
                    className={[
                      "choice-chip",
                      isSelected ? "selected" : "",
                      alreadyKnown ? "locked" : "",
                      isBlocked ? "choice-chip--blocked" : "",
                    ].join(" ")}
                    onClick={() => {
                      if (alreadyKnown) {
                        logBlockedAction("lore-bard-skill", skill, "already_proficient", {
                          skill,
                        });
                        return;
                      }

                      toggleLimitedSkill(
                        skill,
                        setLoreBardSkills,
                        3,
                        "loreBardSkills"
                      );
                    }}
                    data-study-id={`lore-bard-skill-${skill}`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {selectedClass === "Cleric" && selectedSubclass === "Knowledge Domain" && (
        <div className="section-block" data-study-region="knowledge-domain-expertise-section">
          <h3>Knowledge Domain expertise</h3>
          <p className="panel-intro">
            Choose two from Arcana, History, Nature, and Religion. These do not
            require prior proficiency.
          </p>

          <div className="skill-grid" data-study-region="knowledge-domain-grid">
            {knowledgeSkills.map((skill) => {
              const isSelected = knowledgeClericExpertise.includes(skill);
              const maxReached = knowledgeClericExpertise.length >= 2 && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  aria-disabled={maxReached}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    maxReached ? "choice-chip--blocked" : "",
                  ].join(" ")}
                  onClick={() =>
                    toggleLimitedSkill(
                      skill,
                      setKnowledgeClericExpertise,
                      2,
                      "knowledgeClericExpertise",
                      knowledgeSkills
                    )
                  }
                  data-study-id={`knowledge-expertise-${skill}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Bard" && selectedLevel >= 3 && (
        <div className="section-block" data-study-region="bard-expertise-section">
          <h3>Bard expertise</h3>
          <p className="panel-intro">
            Bards select expertise in two proficient skills at level 3. A second
            pair becomes available at level 10.
          </p>

          <div className="skill-grid" data-study-region="bard-expertise-grid">
            {allProficiencies.map((skill) => {
              const maxExpertise = selectedLevel >= 10 ? 4 : 2;
              const isSelected = bardExpertise.includes(skill);
              const maxReached = bardExpertise.length >= maxExpertise && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  aria-disabled={maxReached}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    maxReached ? "choice-chip--blocked" : "",
                  ].join(" ")}
                  onClick={() =>
                    toggleLimitedSkill(
                      skill,
                      setBardExpertise,
                      maxExpertise,
                      "bardExpertise"
                    )
                  }
                  data-study-id={`bard-expertise-${skill}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedClass === "Rogue" && (
        <div className="section-block" data-study-region="rogue-expertise-section">
          <h3>Rogue expertise</h3>
          <p className="panel-intro">
            Rogues select expertise in two proficient skills at level 1. A second
            pair becomes available at level 6.
          </p>

          <div className="skill-grid" data-study-region="rogue-expertise-grid">
            {allProficiencies.map((skill) => {
              const maxExpertise = selectedLevel >= 6 ? 4 : 2;
              const isSelected = rogueExpertise.includes(skill);
              const maxReached = rogueExpertise.length >= maxExpertise && !isSelected;

              return (
                <button
                  key={skill}
                  type="button"
                  aria-disabled={maxReached}
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    maxReached ? "choice-chip--blocked" : "",
                  ].join(" ")}
                  onClick={() =>
                    toggleLimitedSkill(
                      skill,
                      setRogueExpertise,
                      maxExpertise,
                      "rogueExpertise"
                    )
                  }
                  data-study-id={`rogue-expertise-${skill}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedRace === "Gnome" && selectedSubrace === "Rock Gnome" && (
        <div
          className="section-block"
          data-study-region="rock-gnome-expertise-info"
          data-study-id="rock-gnome-expertise-info"
        >
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