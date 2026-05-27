import { useEffect, useMemo, useState } from "react";
import "./BuildPlanner.css";

import { getAvailableRaceFeaturesForBuild } from "../data/raceFeatures";
import CharacterTab from "./CharacterTab";
import ClassScoresTab from "./ClassScoresTab";
import SpellsAbilitiesTab from "./SpellsAbilitiesTab";
import DataCircle from "./DataCircle";
import PartyPlanner, {
  type PartyBuildSnapshot,
} from "./PartyPlanner/PartyPlanner";
import { getVisualizedBuildItems } from "./DataCircle/dataCircleBuildItems";

import { bg3ClassFeatures } from "../data/bg3ClassFeatures";
import { getAvailableClassFeaturesForBuild } from "../data/bg3ClassFeatureAvailability";

import {
  cleanActiveClassFeatureIds,
  cleanSelectedClassFeatureIds,
  getFixedClassFeatureIds,
} from "../logic/classFeatureSelectionLogic";

import type {
  AbilityScore,
  Background,
  ClassName,
  FeatSelection,
  RaceName,
  RangerFavouredEnemy,
  RangerNaturalExplorer,
  Skill,
  TabId,
  WarlockInvocation,
} from "../types/buildPlannerTypes";

import {
  backgroundSkills,
  rangerFavouredEnemySkills,
} from "../data/bg3CharacterData";

import { bg3Spells } from "../data/bg3Spells";

import {
  getRaceExpertise,
  getRaceSkills,
  unique,
} from "../logic/proficiencyLogic";

import {
  cleanSelectedSpellIds,
  getAvailableSpellIdsForBuild,
} from "../logic/spellSelectionLogic";

import { defaultAbilityScores } from "../logic/abilityScoreLogic";

import {
  cleanFeatSelections,
  getFeatAbilityIncreases,
  getFeatExpertise,
  getFeatLevelsForClass,
  getFeatSkillProficiencies,
} from "../logic/featLogic";

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getWisdomPreparedSpellMax(
  selectedClass: ClassName | "",
  selectedLevel: number,
  wisdomScore: number
): number | undefined {
  if (selectedClass !== "Cleric" && selectedClass !== "Druid") {
    return undefined;
  }

  return Math.max(1, selectedLevel + getAbilityModifier(wisdomScore));
}

function getDruidCantripMax(
  selectedClass: ClassName | "",
  selectedSubclass: string,
  selectedLevel: number
): number | undefined {
  if (selectedClass !== "Druid") return undefined;

  const baseMax = selectedLevel >= 10 ? 4 : selectedLevel >= 4 ? 3 : 2;
  const landBonus =
    selectedSubclass === "Circle of the Land" && selectedLevel >= 2 ? 1 : 0;

  return baseMax + landBonus;
}

function getSpellsAbilitiesTabLabel(
  selectedClass: ClassName | "",
  selectedSubclass: string
): string {
  if (selectedClass === "Fighter" && selectedSubclass === "Battle Master") {
    return "Manoeuvres";
  }

  if (selectedClass === "Fighter") return "Fighter Features";
  if (selectedClass === "Warlock") return "Spells & Invocations";
  if (selectedClass === "Monk") return "Ki Actions";
  if (selectedClass === "Barbarian") return "Rage Actions";
  if (selectedClass === "Rogue") return "Rogue Actions";
  if (selectedClass === "Bard") return "Spells & Inspiration";
  if (selectedClass === "Cleric") return "Spells & Divinity";
  if (selectedClass === "Druid") return "Spells & Wild Shape";
  if (selectedClass === "Paladin") return "Spells & Smites";
  if (selectedClass === "Ranger") return "Spells & Ranger";
  if (selectedClass === "Sorcerer") return "Spells & Metamagic";
  if (selectedClass === "Wizard") return "Spells & Wizard";

  return "Spells & Abilities";
}

function BuildPlanner() {
  const [showPartyPlanner, setShowPartyPlanner] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("character");

  const [buildName, setBuildName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [selectedRace, setSelectedRace] = useState<RaceName | "">("");
  const [selectedSubrace, setSelectedSubrace] = useState("");
  const [selectedBackground, setSelectedBackground] = useState<Background | "">(
    ""
  );
  const [selectedClass, setSelectedClass] = useState<ClassName | "">("");
  const [selectedSubclass, setSelectedSubclass] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(12);

  const [baseAbilityScores, setBaseAbilityScores] =
    useState<Record<AbilityScore, number>>(defaultAbilityScores);
  const [bonusPlusTwo, setBonusPlusTwo] = useState<AbilityScore | "">("");
  const [bonusPlusOne, setBonusPlusOne] = useState<AbilityScore | "">("");
  const [featSelections, setFeatSelections] = useState<FeatSelection[]>([]);

  const [selectedClassSkills, setSelectedClassSkills] = useState<Skill[]>([]);
  const [bardExpertise, setBardExpertise] = useState<Skill[]>([]);
  const [rogueExpertise, setRogueExpertise] = useState<Skill[]>([]);
  const [loreBardSkills, setLoreBardSkills] = useState<Skill[]>([]);
  const [knowledgeClericExpertise, setKnowledgeClericExpertise] =
    useState<Skill[]>([]);

  const [rangerFavouredEnemy, setRangerFavouredEnemy] = useState<
    RangerFavouredEnemy | ""
  >("");
  const [rangerNaturalExplorer, setRangerNaturalExplorer] = useState<
    RangerNaturalExplorer | ""
  >("");
  const [selectedWarlockInvocations, setSelectedWarlockInvocations] = useState<
    WarlockInvocation[]
  >([]);

  const [selectedSpellIds, setSelectedSpellIds] = useState<string[]>([]);
  const [selectedClassFeatureIds, setSelectedClassFeatureIds] = useState<
    string[]
  >([]);
  const [activeClassFeatureIds, setActiveClassFeatureIds] = useState<string[]>(
    []
  );

  const [partySlots, setPartySlots] = useState<
    Array<PartyBuildSnapshot | null>
  >([null, null, null]);

  const [hasEvaluatedBuild, setHasEvaluatedBuild] = useState(false);

  const tabs: { id: TabId; label: string }[] = [
    { id: "character", label: "Character" },
    { id: "classScores", label: "Class & Scores" },
    {
      id: "spellsAbilities",
      label: getSpellsAbilitiesTabLabel(selectedClass, selectedSubclass),
    },
  ];

  const lockedBackgroundSkills: Skill[] = selectedBackground
    ? backgroundSkills[selectedBackground]
    : [];

  const lockedRaceSkills: Skill[] = getRaceSkills(selectedRace, selectedSubrace);

  const rangerEnemySkill: Skill | undefined =
    selectedClass === "Ranger" && rangerFavouredEnemy
      ? rangerFavouredEnemySkills[rangerFavouredEnemy]
      : undefined;

  const rangerEnvironmentSkill: Skill | undefined =
    selectedClass === "Ranger" && rangerNaturalExplorer === "Urban Tracker"
      ? "Sleight of Hand"
      : undefined;

  const warlockInvocationSkills: Skill[] =
    selectedClass === "Warlock" &&
    selectedWarlockInvocations.includes("Beguiling Influence")
      ? ["Deception", "Persuasion"]
      : [];

  const featSkillProficiencies = getFeatSkillProficiencies(featSelections);
  const featExpertise = getFeatExpertise(featSelections);
  const featAbilityIncreases = getFeatAbilityIncreases(featSelections);

  const finalCharismaScore =
    baseAbilityScores.Charisma +
    (bonusPlusTwo === "Charisma" ? 2 : 0) +
    (bonusPlusOne === "Charisma" ? 1 : 0) +
    (featAbilityIncreases.Charisma ?? 0);

  const finalWisdomScore =
    baseAbilityScores.Wisdom +
    (bonusPlusTwo === "Wisdom" ? 2 : 0) +
    (bonusPlusOne === "Wisdom" ? 1 : 0) +
    (featAbilityIncreases.Wisdom ?? 0);

  const paladinPreparedSpellLimit =
    selectedClass === "Paladin" && selectedLevel >= 2
      ? Math.max(
          1,
          Math.floor(selectedLevel / 2) + getAbilityModifier(finalCharismaScore)
        )
      : undefined;

  const clericOrDruidPreparedSpellLimit = getWisdomPreparedSpellMax(
    selectedClass,
    selectedLevel,
    finalWisdomScore
  );

  const druidCantripLimit = getDruidCantripMax(
    selectedClass,
    selectedSubclass,
    selectedLevel
  );

  const spellChoiceMaxOverrides: Record<string, number> = {
    ...(paladinPreparedSpellLimit !== undefined
      ? {
          "paladin-prepared-spells": paladinPreparedSpellLimit,
        }
      : {}),

    ...(selectedClass === "Cleric" &&
    clericOrDruidPreparedSpellLimit !== undefined
      ? {
          "cleric-prepared-spells": clericOrDruidPreparedSpellLimit,
        }
      : {}),

    ...(selectedClass === "Druid" &&
    clericOrDruidPreparedSpellLimit !== undefined
      ? {
          "druid-prepared-spells": clericOrDruidPreparedSpellLimit,
        }
      : {}),

    ...(druidCantripLimit !== undefined
      ? {
          "druid-cantrips": druidCantripLimit,
        }
      : {}),
  };

  const lockedSkills: Skill[] = unique([
    ...lockedBackgroundSkills,
    ...lockedRaceSkills,
    ...(rangerEnemySkill ? [rangerEnemySkill] : []),
    ...(rangerEnvironmentSkill ? [rangerEnvironmentSkill] : []),
    ...warlockInvocationSkills,
  ]);

  const allProficiencies: Skill[] = unique([
    ...lockedSkills,
    ...selectedClassSkills,
    ...loreBardSkills,
    ...featSkillProficiencies,
  ]);

  const directExpertise: Skill[] = unique([
    ...getRaceExpertise(selectedRace, selectedSubrace),
    ...knowledgeClericExpertise,
    ...featExpertise,
  ]);

  const proficiencyBasedExpertise: Skill[] = unique([
    ...(selectedClass === "Bard" ? bardExpertise : []),
    ...(selectedClass === "Rogue" ? rogueExpertise : []),
  ]).filter((skill) => allProficiencies.includes(skill));

  const allExpertise: Skill[] = unique([
    ...directExpertise,
    ...proficiencyBasedExpertise,
  ]);

  const availableSpellIds = getAvailableSpellIdsForBuild(
    bg3Spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  );

  const availableClassFeaturesOnly = useMemo(
    () =>
      getAvailableClassFeaturesForBuild(
        bg3ClassFeatures,
        selectedClass,
        selectedSubclass,
        selectedLevel,
        selectedClassFeatureIds,
        rangerFavouredEnemy,
        rangerNaturalExplorer
      ),
    [
      selectedClass,
      selectedSubclass,
      selectedLevel,
      selectedClassFeatureIds,
      rangerFavouredEnemy,
      rangerNaturalExplorer,
    ]
  );

  const availableRaceFeatures = useMemo(
    () =>
      getAvailableRaceFeaturesForBuild(
        selectedRace,
        selectedSubrace,
        selectedLevel
      ),
    [selectedRace, selectedSubrace, selectedLevel]
  );

  const availableClassFeatures = useMemo(
    () => [...availableRaceFeatures, ...availableClassFeaturesOnly],
    [availableRaceFeatures, availableClassFeaturesOnly]
  );

  const availableClassFeatureKey = availableClassFeatures
    .map((feature) => feature.id)
    .join("|");

  const fixedClassFeatureIds = getFixedClassFeatureIds(availableClassFeatures);

  const currentBuildSnapshot: PartyBuildSnapshot = useMemo(
    () => ({
      id: "current-build",
      buildName,
      characterName,
      selectedClass,
      selectedSubclass,
      selectedLevel,
      selectedSpellIds,
      fixedClassFeatureIds,
      selectedClassFeatureIds,
      activeClassFeatureIds,
      visualizedItems: getVisualizedBuildItems({
        selectedSpellIds,
        fixedClassFeatureIds,
        selectedClassFeatureIds,
        activeClassFeatureIds,
      }),
    }),
    [
      buildName,
      characterName,
      selectedClass,
      selectedSubclass,
      selectedLevel,
      selectedSpellIds,
      fixedClassFeatureIds,
      selectedClassFeatureIds,
      activeClassFeatureIds,
    ]
  );

  useEffect(() => {
    setSelectedSpellIds((current) =>
      cleanSelectedSpellIds(current, availableSpellIds)
    );
  }, [availableSpellIds.join("|")]);

  useEffect(() => {
    setSelectedClassFeatureIds((current) =>
      cleanSelectedClassFeatureIds(current, availableClassFeatures)
    );
  }, [availableClassFeatureKey]);

  useEffect(() => {
    setActiveClassFeatureIds((current) =>
      cleanActiveClassFeatureIds(current, availableClassFeatures)
    );
  }, [availableClassFeatureKey]);

  useEffect(() => {
    const featLevels = getFeatLevelsForClass(selectedClass, selectedLevel);
    setFeatSelections((current) => cleanFeatSelections(current, featLevels));
  }, [selectedClass, selectedLevel]);

  useEffect(() => {
    setHasEvaluatedBuild(false);
  }, [
    buildName,
    characterName,
    selectedRace,
    selectedSubrace,
    selectedBackground,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedClassSkills,
    bardExpertise,
    rogueExpertise,
    loreBardSkills,
    knowledgeClericExpertise,
    rangerFavouredEnemy,
    rangerNaturalExplorer,
    selectedWarlockInvocations,
    selectedSpellIds,
    selectedClassFeatureIds,
    activeClassFeatureIds,
    baseAbilityScores,
    bonusPlusTwo,
    bonusPlusOne,
    featSelections,
  ]);

  function handleRaceChange(value: string) {
    const race = value as RaceName | "";

    setSelectedRace(race);
    setSelectedSubrace("");
    setSelectedClassFeatureIds([]);
    setActiveClassFeatureIds([]);
  }

  function handleClassChange(value: string) {
    const className = value as ClassName | "";

    setSelectedClass(className);
    setSelectedSubclass("");
    setSelectedClassSkills([]);
    setBardExpertise([]);
    setRogueExpertise([]);
    setLoreBardSkills([]);
    setKnowledgeClericExpertise([]);
    setRangerFavouredEnemy("");
    setRangerNaturalExplorer("");
    setSelectedWarlockInvocations([]);
    setSelectedSpellIds([]);
    setSelectedClassFeatureIds([]);
    setActiveClassFeatureIds([]);
  }

  function handleEvaluateBuild() {
    setHasEvaluatedBuild(true);
  }

  function handleSaveCurrentToPartySlot(slotIndex: number) {
    setPartySlots((current) =>
      current.map((slot, index) =>
        index === slotIndex
          ? {
              ...currentBuildSnapshot,
              id: `party-slot-${slotIndex}-${Date.now()}`,
            }
          : slot
      )
    );
  }

  function handleLoadPartySlot(slotIndex: number) {
    const snapshot = partySlots[slotIndex];

    if (!snapshot) return;

    setBuildName(snapshot.buildName);
    setCharacterName(snapshot.characterName);
    setSelectedClass(snapshot.selectedClass);
    setSelectedSubclass(snapshot.selectedSubclass);
    setSelectedLevel(snapshot.selectedLevel);
    setSelectedSpellIds(snapshot.selectedSpellIds);
    setSelectedClassFeatureIds(snapshot.selectedClassFeatureIds);
    setActiveClassFeatureIds(snapshot.activeClassFeatureIds);
    setHasEvaluatedBuild(false);
  }

  function handleClearPartySlot(slotIndex: number) {
    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? null : slot))
    );
  }

  return (
    <main className="workspace-page">
      <section className="workspace-half planner-half">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">BG3 Build Planner</p>
            <h1>Build Creation</h1>
          </div>

          <button
            className="evaluate-button"
            type="button"
            onClick={handleEvaluateBuild}
          >
            {hasEvaluatedBuild ? "Re-evaluate Build" : "Evaluate Build"}
          </button>
        </header>

        <nav className="tab-bar" aria-label="Build creation sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="planner-content-layout">
          <aside className="summary-card">
            <h2>Current Build</h2>

            <div className="summary-row">
              <span>Name</span>
              <strong>{buildName || "Untitled Build"}</strong>
            </div>

            <div className="summary-row">
              <span>Race</span>
              <strong>{selectedRace || "Not selected"}</strong>
            </div>

            <div className="summary-row">
              <span>Class</span>
              <strong>{selectedClass || "Not selected"}</strong>
            </div>

            <div className="summary-row">
              <span>Subclass</span>
              <strong>{selectedSubclass || "Not selected"}</strong>
            </div>

            <div className="summary-row">
              <span>Level</span>
              <strong>{selectedLevel}</strong>
            </div>
          </aside>

          <section className="main-panel">
            {activeTab === "character" && (
              <CharacterTab
                buildName={buildName}
                setBuildName={setBuildName}
                characterName={characterName}
                setCharacterName={setCharacterName}
                selectedRace={selectedRace}
                selectedSubrace={selectedSubrace}
                selectedBackground={selectedBackground}
                selectedClass={selectedClass}
                selectedClassSkills={selectedClassSkills}
                lockedSkills={lockedSkills}
                allProficiencies={allProficiencies}
                allExpertise={allExpertise}
                onRaceChange={handleRaceChange}
                setSelectedSubrace={(value) => {
                  setSelectedSubrace(value);
                  setSelectedClassFeatureIds([]);
                  setActiveClassFeatureIds([]);
                }}
                setSelectedBackground={setSelectedBackground}
                onClassChange={handleClassChange}
                setSelectedClassSkills={setSelectedClassSkills}
              />
            )}

            {activeTab === "classScores" && (
              <ClassScoresTab
                selectedClass={selectedClass}
                selectedSubclass={selectedSubclass}
                selectedLevel={selectedLevel}
                selectedRace={selectedRace}
                selectedSubrace={selectedSubrace}
                allProficiencies={allProficiencies}
                bardExpertise={bardExpertise}
                rogueExpertise={rogueExpertise}
                loreBardSkills={loreBardSkills}
                knowledgeClericExpertise={knowledgeClericExpertise}
                rangerFavouredEnemy={rangerFavouredEnemy}
                rangerNaturalExplorer={rangerNaturalExplorer}
                selectedWarlockInvocations={selectedWarlockInvocations}
                baseAbilityScores={baseAbilityScores}
                bonusPlusTwo={bonusPlusTwo}
                bonusPlusOne={bonusPlusOne}
                featSelections={featSelections}
                featAbilityIncreases={featAbilityIncreases}
                onClassChange={handleClassChange}
                setSelectedSubclass={setSelectedSubclass}
                setSelectedLevel={setSelectedLevel}
                setBardExpertise={setBardExpertise}
                setRogueExpertise={setRogueExpertise}
                setLoreBardSkills={setLoreBardSkills}
                setKnowledgeClericExpertise={setKnowledgeClericExpertise}
                setRangerFavouredEnemy={setRangerFavouredEnemy}
                setRangerNaturalExplorer={setRangerNaturalExplorer}
                setSelectedWarlockInvocations={setSelectedWarlockInvocations}
                setBaseAbilityScores={setBaseAbilityScores}
                setBonusPlusTwo={setBonusPlusTwo}
                setBonusPlusOne={setBonusPlusOne}
                setFeatSelections={setFeatSelections}
              />
            )}

            {activeTab === "spellsAbilities" && (
              <SpellsAbilitiesTab
                selectedClass={selectedClass}
                selectedSubclass={selectedSubclass}
                selectedLevel={selectedLevel}
                selectedWarlockInvocations={selectedWarlockInvocations}
                selectedSpellIds={selectedSpellIds}
                setSelectedSpellIds={setSelectedSpellIds}
                availableClassFeatures={availableClassFeatures}
                selectedClassFeatureIds={selectedClassFeatureIds}
                fixedClassFeatureIds={fixedClassFeatureIds}
                setSelectedClassFeatureIds={setSelectedClassFeatureIds}
                activeClassFeatureIds={activeClassFeatureIds}
                setActiveClassFeatureIds={setActiveClassFeatureIds}
                spellChoiceMaxOverrides={spellChoiceMaxOverrides}
              />
            )}
          </section>
        </div>
      </section>



      <section className="workspace-half visualisation-half visualisation-half--immersive">
        <div
          className={`visualisation-panel visualisation-panel--with-party-dock ${
            showPartyPlanner ? "" : "visualisation-panel--party-hidden"
          }`}
        >
          <button
            type="button"
            className={`party-dock-toggle ${
              showPartyPlanner ? "party-dock-toggle--active" : ""
            }`}
            onClick={() => setShowPartyPlanner((current) => !current)}
          >
            {showPartyPlanner ? "Hide party planner" : "Show party planner"}
          </button>

          <div className="main-data-circle-frame">
            <DataCircle
              buildName={buildName}
              characterName={characterName}
              selectedClass={selectedClass}
              selectedSubclass={selectedSubclass}
              selectedLevel={selectedLevel}
              selectedSpellIds={selectedSpellIds}
              fixedClassFeatureIds={fixedClassFeatureIds}
              selectedClassFeatureIds={selectedClassFeatureIds}
              activeClassFeatureIds={activeClassFeatureIds}
              showDprLayer={hasEvaluatedBuild}
            />
          </div>

          {showPartyPlanner && (
            <section className="party-dock" aria-label="Party planner preview">
              <div className="party-dock-track">
                {[
                  {
                    label: "Aggregate",
                    name: "Combined Party",
                    subtitle: "Shared capability profile",
                    modifier: "aggregate",
                  },
                  {
                    label: "Member 1",
                    name: buildName || "Current Build",
                    subtitle: selectedSubclass || selectedClass || "Unassigned",
                    modifier: "active",
                  },
                  {
                    label: "Member 2",
                    name: "Companion Build",
                    subtitle: selectedSubclass || selectedClass || "Unassigned",
                    modifier: "member",
                  },
                  {
                    label: "Member 3",
                    name: "Companion Build",
                    subtitle: selectedSubclass || selectedClass || "Unassigned",
                    modifier: "member",
                  },
                ].map((slot) => (
                  <article
                    className={`party-node party-node--${slot.modifier}`}
                    key={slot.label}
                    title={`${slot.label}: ${slot.name} · ${slot.subtitle}`}
                  >
                    <span className="party-node-side-label">{slot.label}</span>

                    <div className="party-node-orb-shell">
                      <div className="party-node-circle">
                        <DataCircle
                          buildName={slot.name}
                          characterName={characterName}
                          selectedClass={selectedClass}
                          selectedSubclass={selectedSubclass}
                          selectedLevel={selectedLevel}
                          selectedSpellIds={selectedSpellIds}
                          fixedClassFeatureIds={fixedClassFeatureIds}
                          selectedClassFeatureIds={selectedClassFeatureIds}
                          activeClassFeatureIds={activeClassFeatureIds}
                          showDprLayer={false}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>



    </main>
  );
}

export default BuildPlanner;