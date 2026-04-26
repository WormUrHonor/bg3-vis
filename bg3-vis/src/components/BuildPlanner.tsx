import { useState } from "react";
import "./BuildPlanner.css";

import CharacterTab from "./CharacterTab";
import ClassScoresTab from "./ClassScoresTab";
import SpellsAbilitiesTab from "./SpellsAbilitiesTab";

import type {
  Background,
  ClassName,
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

import {
  getRaceExpertise,
  getRaceSkills,
  unique,
} from "../logic/proficiencyLogic";

const tabs: { id: TabId; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "classScores", label: "Class & Scores" },
  { id: "spellsAbilities", label: "Spells & Abilities" },
];

function BuildPlanner() {
  const [activeTab, setActiveTab] = useState<TabId>("character");

  const [buildName, setBuildName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [selectedRace, setSelectedRace] = useState<RaceName | "">("");
  const [selectedSubrace, setSelectedSubrace] = useState("");
  const [selectedBackground, setSelectedBackground] = useState<Background | "">("");
  const [selectedClass, setSelectedClass] = useState<ClassName | "">("");
  const [selectedSubclass, setSelectedSubclass] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(12);

  const [selectedClassSkills, setSelectedClassSkills] = useState<Skill[]>([]);
  const [bardExpertise, setBardExpertise] = useState<Skill[]>([]);
  const [rogueExpertise, setRogueExpertise] = useState<Skill[]>([]);
  const [loreBardSkills, setLoreBardSkills] = useState<Skill[]>([]);
  const [knowledgeClericExpertise, setKnowledgeClericExpertise] = useState<Skill[]>([]);

  const [rangerFavouredEnemy, setRangerFavouredEnemy] = useState<RangerFavouredEnemy | "">("");
  const [rangerNaturalExplorer, setRangerNaturalExplorer] = useState<RangerNaturalExplorer | "">("");
  const [selectedWarlockInvocations, setSelectedWarlockInvocations] = useState<WarlockInvocation[]>([]);

  const lockedBackgroundSkills: Skill[] = selectedBackground ? backgroundSkills[selectedBackground] : [];
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
    selectedClass === "Warlock" && selectedWarlockInvocations.includes("Beguiling Influence")
      ? ["Deception", "Persuasion"]
      : [];

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
  ]);

  const directExpertise: Skill[] = unique([
    ...getRaceExpertise(selectedRace, selectedSubrace),
    ...knowledgeClericExpertise,
  ]);

  const proficiencyBasedExpertise: Skill[] = unique([
    ...(selectedClass === "Bard" ? bardExpertise : []),
    ...(selectedClass === "Rogue" ? rogueExpertise : []),
  ]).filter((skill) => allProficiencies.includes(skill));

  const allExpertise: Skill[] = unique([...directExpertise, ...proficiencyBasedExpertise]);

  function handleRaceChange(value: string) {
    const race = value as RaceName | "";
    setSelectedRace(race);
    setSelectedSubrace("");
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
  }

  return (
    <main className="planner-page">
      <section className="planner-shell">
        <header className="planner-header">
          <div>
            <p className="eyebrow">BG3 Build Planner</p>
            <h1>Build Creation</h1>
          </div>
          <button className="evaluate-button">Evaluate Build</button>
        </header>

        <nav className="tab-bar" aria-label="Build creation sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="planner-layout">
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
                setSelectedSubrace={setSelectedSubrace}
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
              />
            )}

            {activeTab === "spellsAbilities" && <SpellsAbilitiesTab />}
          </section>

          <aside className="info-card">
            <h2>Selection Details</h2>
            <p>
              This panel can later show details for the currently selected race, class,
              background, skill, feat, spell, or ability.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default BuildPlanner;