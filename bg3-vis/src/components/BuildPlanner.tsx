import { useMemo, useState } from "react";
import "./BuildPlanner.css";

type TabId = "character" | "classScores" | "spellsAbilities";

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

const tabs: { id: TabId; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "classScores", label: "Class & Scores" },
  { id: "spellsAbilities", label: "Spells & Abilities" },
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

const subclassesByClass: Record<ClassName, string[]> = {
  Barbarian: [
    "Berserker",
    "Wildheart",
    "Wild Magic",
    "Path of Giants",
  ],
  Bard: [
    "College of Lore",
    "College of Valour",
    "College of Swords",
    "College of Glamour",
  ],
  Cleric: [
    "Life Domain",
    "Light Domain",
    "Trickery Domain",
    "Knowledge Domain",
    "Nature Domain",
    "Tempest Domain",
    "War Domain",
    "Death Domain",
  ],
  Druid: [
    "Circle of the Land",
    "Circle of the Moon",
    "Circle of the Spores",
    "Circle of the Stars",
  ],
  Fighter: [
    "Battle Master",
    "Champion",
    "Eldritch Knight",
    "Arcane Archer",
  ],
  Monk: [
    "Way of the Open Hand",
    "Way of Shadow",
    "Way of the Four Elements",
    "Way of the Drunken Master",
  ],
  Paladin: [
    "Oath of the Ancients",
    "Oath of Devotion",
    "Oath of Vengeance",
    "Oathbreaker",
    "Oath of the Crown",
  ],
  Ranger: [
    "Hunter",
    "Beast Master",
    "Gloom Stalker",
    "Swarmkeeper",
  ],
  Rogue: [
    "Arcane Trickster",
    "Assassin",
    "Thief",
    "Swashbuckler",
  ],
  Sorcerer: [
    "Draconic Bloodline",
    "Wild Magic",
    "Storm Sorcery",
    "Shadow Magic",
  ],
  Warlock: [
    "The Fiend",
    "The Great Old One",
    "The Archfey",
    "Hexblade",
  ],
  Wizard: [
    "Abjuration School",
    "Conjuration School",
    "Divination School",
    "Enchantment School",
    "Evocation School",
    "Illusion School",
    "Necromancy School",
    "Transmutation School",
    "Bladesinging",
  ],
};

const backgrounds = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Noble",
  "Outlander",
  "Sage",
  "Soldier",
  "Urchin",
];

const skills = [
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

const abilityScores = [
  "Strength",
  "Dexterity",
  "Constitution",
  "Intelligence",
  "Wisdom",
  "Charisma",
];

function BuildPlanner() {
  const [activeTab, setActiveTab] = useState<TabId>("character");

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
              <strong>Untitled Build</strong>
            </div>
            <div className="summary-row">
              <span>Race</span>
              <strong>Not selected</strong>
            </div>
            <div className="summary-row">
              <span>Class</span>
              <strong>Not selected</strong>
            </div>
            <div className="summary-row">
              <span>Level</span>
              <strong>12</strong>
            </div>
          </aside>

          <section className="main-panel">
            {activeTab === "character" && <CharacterTab />}
            {activeTab === "classScores" && <ClassScoresTab />}
            {activeTab === "spellsAbilities" && <SpellsAbilitiesTab />}
          </section>

          <aside className="info-card">
            <h2>Selection Details</h2>
            <p>
              This panel can later show explanations for the currently selected race,
              subrace, background, skill, class, subclass, spell, feat, or ability.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function CharacterTab() {
  const [selectedRace, setSelectedRace] = useState<RaceName | "">("");
  const [selectedSubrace, setSelectedSubrace] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const availableSubraces = useMemo(() => {
    if (!selectedRace) return [];
    return subracesByRace[selectedRace];
  }, [selectedRace]);

  function handleRaceChange(value: string) {
    const race = value as RaceName;
    setSelectedRace(race);
    setSelectedSubrace("");
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  }

  return (
    <div className="tab-content">
      <h2>Character</h2>
      <p className="panel-intro">Basic character setup for the build planner.</p>

      <div className="form-grid">
        <label>
          Build name
          <input placeholder="e.g. Radiant Frontliner" />
        </label>

        <label>
          Character name
          <input placeholder="Character name" />
        </label>

        <label>
          Race
          <select value={selectedRace} onChange={(e) => handleRaceChange(e.target.value)}>
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
          <select>
            <option>Select background</option>
            {backgrounds.map((background) => (
              <option key={background}>{background}</option>
            ))}
          </select>
        </label>
      </div>

      <h3>Skill Proficiencies</h3>
      <p className="panel-intro">
        Select the skills this build should be proficient in. Later this can be constrained by race,
        class, and background rules.
      </p>

      <div className="skill-grid">
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            className={selectedSkills.includes(skill) ? "choice-chip selected" : "choice-chip"}
            onClick={() => toggleSkill(skill)}
          >
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClassScoresTab() {
  const [selectedClass, setSelectedClass] = useState<ClassName | "">("");
  const [selectedSubclass, setSelectedSubclass] = useState("");

  const availableSubclasses = useMemo(() => {
    if (!selectedClass) return [];
    return subclassesByClass[selectedClass];
  }, [selectedClass]);

  function handleClassChange(value: string) {
    const className = value as ClassName;
    setSelectedClass(className);
    setSelectedSubclass("");
  }

  return (
    <div className="tab-content">
      <h2>Class & Ability Scores</h2>
      <p className="panel-intro">
        Core mechanical build choices based on BG3 character creation and level-up choices.
      </p>

      <div className="form-grid">
        <label>
          Class
          <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}>
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
            onChange={(e) => setSelectedSubclass(e.target.value)}
            disabled={!selectedClass}
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

        <label>
          Level
          <select defaultValue="12">
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
            <option>Select feat or ability score improvement</option>
            <option>Ability Score Improvement</option>
            <option>Alert</option>
            <option>Great Weapon Master</option>
            <option>Sharpshooter</option>
            <option>War Caster</option>
          </select>
        </label>
      </div>

      <h3>Ability Scores</h3>
      <div className="score-grid">
        {abilityScores.map((score) => (
          <label key={score}>
            {score}
            <input type="number" min="8" max="20" defaultValue="10" />
          </label>
        ))}
      </div>

      <h3>Class-specific choices</h3>
      <div className="placeholder-box">
        Fighting styles, metamagic, invocations, maneuvers, favoured enemy, and similar
        class-specific choices can appear here depending on the selected class.
      </div>
    </div>
  );
}

function SpellsAbilitiesTab() {
  return (
    <div className="tab-content">
      <h2>Spells & Abilities</h2>
      <p className="panel-intro">
        Selectable spells, cantrips, class abilities, and passives gained from the build.
      </p>

      <div className="section-block">
        <h3>Cantrips</h3>
        <div className="chip-grid">
          {["Fire Bolt", "Guidance", "Mage Hand", "Ray of Frost", "Eldritch Blast"].map((spell) => (
            <button key={spell} className="choice-chip">
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
              <button className="small-button">Add spell</button>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Class abilities and passives</h3>
        <div className="placeholder-box">
          Class and subclass abilities can be shown here once the selected class is known.
        </div>
      </div>
    </div>
  );
}

export default BuildPlanner;