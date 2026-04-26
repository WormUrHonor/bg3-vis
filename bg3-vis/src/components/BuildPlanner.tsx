import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import "./BuildPlanner.css";

type TabId = "character" | "classScores" | "spellsAbilities";

type Skill =
  | "Acrobatics"
  | "Animal Handling"
  | "Arcana"
  | "Athletics"
  | "Deception"
  | "History"
  | "Insight"
  | "Intimidation"
  | "Investigation"
  | "Medicine"
  | "Nature"
  | "Perception"
  | "Performance"
  | "Persuasion"
  | "Religion"
  | "Sleight of Hand"
  | "Stealth"
  | "Survival";

type AbilityScore =
  | "Strength"
  | "Dexterity"
  | "Constitution"
  | "Intelligence"
  | "Wisdom"
  | "Charisma";

type RaceName =
  | "Human"
  | "Elf"
  | "Half-Elf"
  | "Drow"
  | "Tiefling"
  | "Githyanki"
  | "Dwarf"
  | "Halfling"
  | "Gnome"
  | "Half-Orc"
  | "Dragonborn";

type ClassName =
  | "Barbarian"
  | "Bard"
  | "Cleric"
  | "Druid"
  | "Fighter"
  | "Monk"
  | "Paladin"
  | "Ranger"
  | "Rogue"
  | "Sorcerer"
  | "Warlock"
  | "Wizard";

type Background =
  | "Acolyte"
  | "Charlatan"
  | "Criminal"
  | "Entertainer"
  | "Folk Hero"
  | "Guild Artisan"
  | "Haunted One"
  | "Noble"
  | "Outlander"
  | "Sage"
  | "Soldier"
  | "Urchin";

type RangerFavouredEnemy =
  | "Bounty Hunter"
  | "Keeper of the Veil"
  | "Mage Breaker"
  | "Ranger Knight"
  | "Sanctified Stalker";

type RangerNaturalExplorer =
  | "Beast Tamer"
  | "Urban Tracker"
  | "Wasteland Wanderer: Cold"
  | "Wasteland Wanderer: Fire"
  | "Wasteland Wanderer: Poison";

type WarlockInvocation =
  | "Beguiling Influence"
  | "Agonising Blast"
  | "Armour of Shadows"
  | "Beast Speech"
  | "Devil's Sight"
  | "Repelling Blast";

const tabs: { id: TabId; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "classScores", label: "Class & Scores" },
  { id: "spellsAbilities", label: "Spells & Abilities" },
];

const skills: Skill[] = [
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
];

const abilityScores: AbilityScore[] = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

const races: RaceName[] = [
  "Human",
  "Elf",
  "Half-Elf",
  "Drow",
  "Tiefling",
  "Githyanki",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Orc",
  "Dragonborn",
];

const subracesByRace: Record<RaceName, string[]> = {
  Human: [],
  Elf: ["High Elf", "Wood Elf"],
  "Half-Elf": ["High Half-Elf", "Wood Half-Elf", "Drow Half-Elf"],
  Drow: ["Lolth-Sworn Drow", "Seldarine Drow"],
  Tiefling: ["Asmodeus Tiefling", "Mephistopheles Tiefling", "Zariel Tiefling"],
  Githyanki: [],
  Dwarf: ["Gold Dwarf", "Shield Dwarf", "Duergar"],
  Halfling: ["Lightfoot Halfling", "Strongheart Halfling"],
  Gnome: ["Forest Gnome", "Deep Gnome", "Rock Gnome"],
  "Half-Orc": [],
  Dragonborn: [
    "Black Dragonborn",
    "Blue Dragonborn",
    "Brass Dragonborn",
    "Bronze Dragonborn",
    "Copper Dragonborn",
    "Gold Dragonborn",
    "Green Dragonborn",
    "Red Dragonborn",
    "Silver Dragonborn",
    "White Dragonborn",
  ],
};

const backgrounds: Background[] = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Haunted One",
  "Noble",
  "Outlander",
  "Sage",
  "Soldier",
  "Urchin",
];

const backgroundSkills: Record<Background, Skill[]> = {
  Acolyte: ["Insight", "Religion"],
  Charlatan: ["Deception", "Sleight of Hand"],
  Criminal: ["Deception", "Stealth"],
  Entertainer: ["Acrobatics", "Performance"],
  "Folk Hero": ["Animal Handling", "Survival"],
  "Guild Artisan": ["Insight", "Persuasion"],
  "Haunted One": ["Intimidation", "Medicine"],
  Noble: ["History", "Persuasion"],
  Outlander: ["Athletics", "Survival"],
  Sage: ["Arcana", "History"],
  Soldier: ["Athletics", "Intimidation"],
  Urchin: ["Sleight of Hand", "Stealth"],
};

const classes: ClassName[] = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const classSkillRules: Record<ClassName, { choose: number; options: Skill[] }> = {
  Barbarian: {
    choose: 2,
    options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
  },
  Bard: {
    choose: 3,
    options: skills,
  },
  Cleric: {
    choose: 2,
    options: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
  },
  Druid: {
    choose: 2,
    options: ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
  },
  Fighter: {
    choose: 2,
    options: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
  },
  Monk: {
    choose: 2,
    options: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
  },
  Paladin: {
    choose: 2,
    options: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
  },
  Ranger: {
    choose: 3,
    options: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
  },
  Rogue: {
    choose: 4,
    options: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
  },
  Sorcerer: {
    choose: 2,
    options: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
  },
  Warlock: {
    choose: 2,
    options: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Religion"],
  },
  Wizard: {
    choose: 2,
    options: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
  },
};

const subclassesByClass: Record<ClassName, string[]> = {
  Barbarian: ["Berserker", "Wildheart", "Wild Magic"],
  Bard: ["College of Lore", "College of Valour", "College of Swords"],
  Cleric: ["Life Domain", "Light Domain", "Trickery Domain", "Knowledge Domain", "Nature Domain", "Tempest Domain", "War Domain"],
  Druid: ["Circle of the Land", "Circle of the Moon", "Circle of the Spores"],
  Fighter: ["Battle Master", "Champion", "Eldritch Knight"],
  Monk: ["Way of the Open Hand", "Way of Shadow", "Way of the Four Elements"],
  Paladin: ["Oath of the Ancients", "Oath of Devotion", "Oath of Vengeance", "Oathbreaker"],
  Ranger: ["Hunter", "Beast Master", "Gloom Stalker"],
  Rogue: ["Arcane Trickster", "Assassin", "Thief"],
  Sorcerer: ["Draconic Bloodline", "Wild Magic", "Storm Sorcery"],
  Warlock: ["The Fiend", "The Great Old One", "The Archfey"],
  Wizard: ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School", "Illusion School", "Necromancy School", "Transmutation School"],
};

const rangerFavouredEnemies: RangerFavouredEnemy[] = [
  "Bounty Hunter",
  "Keeper of the Veil",
  "Mage Breaker",
  "Ranger Knight",
  "Sanctified Stalker",
];

const rangerFavouredEnemySkills: Partial<Record<RangerFavouredEnemy, Skill>> = {
  "Bounty Hunter": "Investigation",
  "Keeper of the Veil": "Arcana",
  "Ranger Knight": "History",
  "Sanctified Stalker": "Religion",
};

const rangerNaturalExplorers: RangerNaturalExplorer[] = [
  "Beast Tamer",
  "Urban Tracker",
  "Wasteland Wanderer: Cold",
  "Wasteland Wanderer: Fire",
  "Wasteland Wanderer: Poison",
];

const warlockInvocations: WarlockInvocation[] = [
  "Beguiling Influence",
  "Agonising Blast",
  "Armour of Shadows",
  "Beast Speech",
  "Devil's Sight",
  "Repelling Blast",
];

const pointBuyCost: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function getRaceSkills(race: RaceName | "", subrace: string): Skill[] {
  const result: Skill[] = [];

  if (race === "Elf") result.push("Perception");
  if (race === "Drow") result.push("Perception");
  if (race === "Half-Orc") result.push("Intimidation");

  if (subrace === "Wood Elf") result.push("Stealth");
  if (subrace === "Wood Half-Elf") result.push("Stealth");

  return unique(result);
}

function getRaceExpertise(race: RaceName | "", subrace: string): Skill[] {
  if (race === "Gnome" && subrace === "Rock Gnome") return ["History"];
  return [];
}

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
  setSelectedClassSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
};

function CharacterTab(props: CharacterTabProps) {
  const {
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
  } = props;

  const availableSubraces = selectedRace ? subracesByRace[selectedRace] : [];
  const classRule = selectedClass ? classSkillRules[selectedClass] : undefined;
  const humanExtraSkillCount = selectedRace === "Human" ? 1 : 0;
const maxClassSkills = (classRule?.choose ?? 0) + humanExtraSkillCount;

function toggleClassSkill(skill: Skill) {
  if (!classRule) return;
  if (lockedSkills.includes(skill)) return;

  setSelectedClassSkills((current) => {
    if (current.includes(skill)) {
      return current.filter((item) => item !== skill);
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
            Astral Knowledge grants temporary proficiency in all skills linked to one chosen ability.
            It is not added to permanent build proficiencies here.
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
            ? `Choose ${maxClassSkills} skill${maxClassSkills > 1 ? "s" : ""}. Selected: ${selectedClassSkills.length}/${maxClassSkills}.`
            : "Select a class first."}
        </p>

        <div className="skill-grid">
          {classRule?.options.map((skill) => {
            const isLocked = lockedSkills.includes(skill);
            const isSelected = selectedClassSkills.includes(skill);
            const maxReached = selectedClassSkills.length >= maxClassSkills && !isSelected;
            const disabled = isLocked || maxReached;

            return (
              <button
                key={skill}
                type="button"
                disabled={disabled}
                className={[
                  "choice-chip",
                  isSelected ? "selected" : "",
                  isLocked ? "locked" : "",
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
          {allProficiencies.length === 0 && <span className="muted-text">No skills selected yet.</span>}
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
  setBardExpertise: React.Dispatch<React.SetStateAction<Skill[]>>;
  setRogueExpertise: React.Dispatch<React.SetStateAction<Skill[]>>;
  setLoreBardSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  setKnowledgeClericExpertise: React.Dispatch<React.SetStateAction<Skill[]>>;
  setRangerFavouredEnemy: (value: RangerFavouredEnemy | "") => void;
  setRangerNaturalExplorer: (value: RangerNaturalExplorer | "") => void;
  setSelectedWarlockInvocations: React.Dispatch<React.SetStateAction<WarlockInvocation[]>>;
};

function ClassScoresTab(props: ClassScoresTabProps) {
  const {
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
  } = props;

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

  const usedPoints = abilityScores.reduce((sum, score) => {
    return sum + pointBuyCost[scores[score]];
  }, 0);

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
                <button
                  type="button"
                  onClick={() => decreaseScore(score)}
                  disabled={scores[score] <= 8}
                >
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
                onChange={(e) =>
                  setRangerNaturalExplorer(e.target.value as RangerNaturalExplorer | "")
                }
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

          <p className="panel-intro">
            Bounty Hunter grants Investigation, Keeper of the Veil grants Arcana,
            Ranger Knight grants History, Sanctified Stalker grants Religion, and Urban
            Tracker grants Sleight of Hand. Mage Breaker does not grant a skill proficiency.
          </p>
        </div>
      )}

      {selectedClass === "Warlock" && (
        <div className="section-block">
          <h3>Eldritch Invocations</h3>
          <p className="panel-intro">
            Beguiling Influence grants Deception and Persuasion proficiency.
          </p>

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
          <p className="panel-intro">
            Choose any three additional skill proficiencies.
          </p>

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
                  className={[
                    "choice-chip",
                    isSelected ? "selected" : "",
                    alreadyKnown ? "locked" : "",
                  ].join(" ")}
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
            Choose two from Arcana, History, Nature, and Religion. These are expertise sources
            and do not require prior proficiency.
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
                  onClick={() =>
                    toggleLimitedSkill(skill, setKnowledgeClericExpertise, 2, knowledgeSkills)
                  }
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
            Bards select expertise in two proficient skills at level 3. A second pair becomes
            available at level 10.
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
            Rogues select expertise in two proficient skills at level 1. A second pair becomes
            available at level 6.
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
                  onClick={() =>
                    toggleLimitedSkill(skill, setRogueExpertise, maxExpertise)
                  }
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
            Rock Gnomes have expertise in History. This is applied directly and does not require
            History proficiency from another source.
          </div>
        </div>
      )}
    </div>
  );
}

function SpellsAbilitiesTab() {
  return (
    <div className="tab-content">
      <h2>Spells & Abilities</h2>
      <p className="panel-intro">
        Next implementation step: restrict available cantrips, spells, and class abilities by
        selected class and level.
      </p>

      <div className="section-block">
        <h3>Cantrips</h3>
        <div className="chip-grid">
          {["Fire Bolt", "Guidance", "Mage Hand", "Ray of Frost", "Eldritch Blast"].map((spell) => (
            <button key={spell} className="choice-chip" type="button">
              {spell}
            </button>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Spells by level</h3>
        <div className="spell-levels">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="spell-level-card">
              <h4>Level {level}</h4>
              <button className="small-button" type="button">
                Add spell
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Class abilities and passives</h3>
        <div className="placeholder-box">
          Class and subclass abilities can be shown here once the selected class and level are known.
        </div>
      </div>
    </div>
  );
}

export default BuildPlanner;