import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import "./BuildPlanner.css";
import {
  getAverageDpr,
  getSimulatorBuildNameForSnapshot,
  mapBg3SimulationToDprRounds,
} from "../logic/bg3SimulatorDprMapping";
import {
  runBg3PrioritySimulation,
  type Bg3SimulatorStatus,
} from "../services/bg3SimulatorApi";
import type {
  DataCircleFocus,
  DprRound,
} from "./DataCircle/dataCircleInteraction";
import { getFeatAvailableSpellIds } from "../logic/featSpellChoiceLogic";
import { getAvailableRaceFeaturesForBuild } from "../data/raceFeatures";
import CharacterTab from "./CharacterTab";
import ClassScoresTab from "./ClassScoresTab";
import SpellsAbilitiesTab from "./SpellsAbilitiesTab";
import DataCircle from "./DataCircle";
import SavedBuildsPanel from "./SavedBuildsPanel";
import ProcessSpiralPanel from "./ProcessSpiralPanel";
import StudyLoggingPanel from "./StudyLoggingPanel";

import { bg3ClassFeatures } from "../data/bg3ClassFeatures";
import { getAvailableClassFeaturesForBuild } from "../data/bg3ClassFeatureAvailability";
import { getVisualizedBuildItems } from "./DataCircle/dataCircleBuildItems";

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

import type {
  BuildEditorSnapshot,
  BuildHistoryEntry,
  SavedBuild,
} from "../types/savedBuildTypes";

import {
  createBuildHistoryEntry,
  createSavedBuild,
  getDefaultSavedBuildLabel,
  loadBuildHistoryFromStorage,
  loadSavedBuildsFromStorage,
  saveBuildHistoryToStorage,
  saveSavedBuildsToStorage,
} from "../logic/savedBuildStorage";

import { logStudyEvent } from "../logic/studyLogger";

import {
  backgroundSkills,
  classSkillRules,
  rangerFavouredEnemySkills,
  skills as allSkillOptions,
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

type DataCircleFocusSource = "editor" | "aggregate";

type PartyDockItem = {
  label: string;
  fallbackLabel: string;
  modifier: string;
  savedBuild: SavedBuild | null;
  isFocused: boolean;
  onFocus: () => void;
};

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function areLogValuesEqual(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function getSnapshotSummary(snapshot: BuildEditorSnapshot) {
  return {
    buildName: snapshot.buildName,
    characterName: snapshot.characterName,
    selectedRace: snapshot.selectedRace,
    selectedSubrace: snapshot.selectedSubrace,
    selectedBackground: snapshot.selectedBackground,
    selectedClass: snapshot.selectedClass,
    selectedSubclass: snapshot.selectedSubclass,
    selectedLevel: snapshot.selectedLevel,
    selectedSpellCount: snapshot.selectedSpellIds.length,
    selectedClassFeatureCount: snapshot.selectedClassFeatureIds.length,
    activeClassFeatureCount: snapshot.activeClassFeatureIds.length,
    selectedSkillCount: snapshot.selectedClassSkills.length,
    featCount: snapshot.featSelections.length,
  };
}

function getClassSkillOptionsForBuild(
  selectedClass: ClassName | "",
  selectedRace: RaceName | ""
): Skill[] {
  if (!selectedClass) return [];

  const classRule = classSkillRules[selectedClass];

  if (selectedRace === "Human") {
    return unique([...classRule.options, ...allSkillOptions]);
  }

  return classRule.options;
}

function cleanClassSkillSelectionsForBuild(args: {
  selectedClass: ClassName | "";
  selectedRace: RaceName | "";
  selectedClassSkills: Skill[];
  unavailableClassSkillProficiencies: Skill[];
}): Skill[] {
  const {
    selectedClass,
    selectedRace,
    selectedClassSkills,
    unavailableClassSkillProficiencies,
  } = args;

  if (!selectedClass) return [];

  const classRule = classSkillRules[selectedClass];
  const allowedOptions = getClassSkillOptionsForBuild(selectedClass, selectedRace);
  const unavailable = new Set(unavailableClassSkillProficiencies);

  const maxClassSkills = classRule.choose + (selectedRace === "Human" ? 1 : 0);

  const cleaned: Skill[] = [];
  let outsideClassOptionCount = 0;

  for (const skill of selectedClassSkills) {
    if (cleaned.includes(skill)) continue;
    if (!allowedOptions.includes(skill)) continue;
    if (unavailable.has(skill)) continue;

    const outsideClassOptions = !classRule.options.includes(skill);

    if (outsideClassOptions) {
      if (selectedRace !== "Human") continue;
      if (outsideClassOptionCount >= 1) continue;

      outsideClassOptionCount += 1;
    }

    if (cleaned.length >= maxClassSkills) break;

    cleaned.push(skill);
  }

  return cleaned;
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

function getSavedBuildTitle(savedBuild: SavedBuild | null | undefined) {
  if (!savedBuild) return "Empty slot";

  return (
    savedBuild.label ||
    savedBuild.snapshot.buildName ||
    savedBuild.snapshot.characterName ||
    savedBuild.snapshot.selectedSubclass ||
    savedBuild.snapshot.selectedClass ||
    "Untitled Build"
  );
}

function getFixedClassFeatureIdsForSnapshot(snapshot: BuildEditorSnapshot) {
  const classFeaturesOnly = getAvailableClassFeaturesForBuild(
    bg3ClassFeatures,
    snapshot.selectedClass,
    snapshot.selectedSubclass,
    snapshot.selectedLevel,
    snapshot.selectedClassFeatureIds,
    snapshot.rangerFavouredEnemy,
    snapshot.rangerNaturalExplorer
  );

  const raceFeatures = getAvailableRaceFeaturesForBuild(
    snapshot.selectedRace,
    snapshot.selectedSubrace,
    snapshot.selectedLevel
  );

  return getFixedClassFeatureIds([...raceFeatures, ...classFeaturesOnly]);
}

function getVisualizedItemsForSnapshot(snapshot: BuildEditorSnapshot) {
  return getVisualizedBuildItems({
    selectedSpellIds: snapshot.selectedSpellIds,
    fixedClassFeatureIds: getFixedClassFeatureIdsForSnapshot(snapshot),
    selectedClassFeatureIds: snapshot.selectedClassFeatureIds,
    activeClassFeatureIds: snapshot.activeClassFeatureIds,
  });
}

function createUpdatedSavedBuild(
  savedBuild: SavedBuild,
  snapshot: BuildEditorSnapshot
): SavedBuild {
  return {
    ...savedBuild,
    label: getDefaultSavedBuildLabel(snapshot),
    updatedAt: new Date().toISOString(),
    snapshot,
  };
}

function BuildPlanner() {
  const [simulatorStatus, setSimulatorStatus] =
  useState<Bg3SimulatorStatus>("idle");

const [simulatorError, setSimulatorError] = useState<string | null>(null);

const [simulatorDprRounds, setSimulatorDprRounds] = useState<DprRound[]>([]);

const simulatorAverageDpr = useMemo(
  () => getAverageDpr(simulatorDprRounds),
  [simulatorDprRounds]
);
  const [showPartyPlanner, setShowPartyPlanner] = useState(true);
  const [focusedDataCircle, setFocusedDataCircle] =
    useState<DataCircleFocusSource>("editor");
const [dataCircleFocus, setDataCircleFocus] =
  useState<DataCircleFocus>(null);
  const [isProcessSpiralExpanded, setIsProcessSpiralExpanded] =
    useState(false);

  const [focusedSavedBuild, setFocusedSavedBuild] =
    useState<SavedBuild | null>(null);

  const [editingPartySlotIndex, setEditingPartySlotIndex] = useState<
    number | null
  >(null);

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

  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() =>
    loadSavedBuildsFromStorage()
  );

  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>(() =>
    loadBuildHistoryFromStorage()
  );

  const [partySlots, setPartySlots] = useState<Array<SavedBuild | null>>([
    null,
    null,
    null,
  ]);

  const [hasEvaluatedBuild, setHasEvaluatedBuild] = useState(false);

  const isAggregateFocused = focusedDataCircle === "aggregate";
  const isEditingPartySlot = editingPartySlotIndex !== null;

  const focusedLabel = isAggregateFocused
    ? "Aggregate"
    : isEditingPartySlot
      ? `Member ${editingPartySlotIndex + 1}`
      : focusedSavedBuild
        ? getSavedBuildTitle(focusedSavedBuild)
        : "Current Editor";

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
      ? { "paladin-prepared-spells": paladinPreparedSpellLimit }
      : {}),

    ...(selectedClass === "Cleric" &&
    clericOrDruidPreparedSpellLimit !== undefined
      ? { "cleric-prepared-spells": clericOrDruidPreparedSpellLimit }
      : {}),

    ...(selectedClass === "Druid" &&
    clericOrDruidPreparedSpellLimit !== undefined
      ? { "druid-prepared-spells": clericOrDruidPreparedSpellLimit }
      : {}),

    ...(druidCantripLimit !== undefined
      ? { "druid-cantrips": druidCantripLimit }
      : {}),
  };

  const lockedSkills: Skill[] = unique([
    ...lockedBackgroundSkills,
    ...lockedRaceSkills,
    ...(rangerEnemySkill ? [rangerEnemySkill] : []),
    ...(rangerEnvironmentSkill ? [rangerEnvironmentSkill] : []),
    ...warlockInvocationSkills,
  ]);

  const unavailableClassSkillProficiencies: Skill[] = unique([
    ...lockedSkills,
    ...loreBardSkills,
    ...featSkillProficiencies,
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

  const classAvailableSpellIds = getAvailableSpellIdsForBuild(
    bg3Spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  );

  const featAvailableSpellIds = getFeatAvailableSpellIds(featSelections);

  const availableSpellIds = unique([
    ...classAvailableSpellIds,
    ...featAvailableSpellIds,
  ]);

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

  const currentEditorSnapshot: BuildEditorSnapshot = useMemo(
    () => ({
      buildName,
      characterName,

      selectedRace,
      selectedSubrace,
      selectedBackground,

      selectedClass,
      selectedSubclass,
      selectedLevel,

      baseAbilityScores,
      bonusPlusTwo,
      bonusPlusOne,
      featSelections,

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
    }),
    [
      buildName,
      characterName,
      selectedRace,
      selectedSubrace,
      selectedBackground,
      selectedClass,
      selectedSubclass,
      selectedLevel,
      baseAbilityScores,
      bonusPlusTwo,
      bonusPlusOne,
      featSelections,
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
    ]
  );

  const partyAggregateItems = useMemo(
    () => [
      ...getVisualizedItemsForSnapshot(currentEditorSnapshot),
      ...partySlots.flatMap((slot) =>
        slot ? getVisualizedItemsForSnapshot(slot.snapshot) : []
      ),
    ],
    [currentEditorSnapshot, partySlots]
  );

  function logCurrentBuildEdit(
    field: string,
    oldValue: unknown,
    newValue: unknown,
    extraPayload: Record<string, unknown> = {}
  ) {
    if (areLogValuesEqual(oldValue, newValue)) return;

    logStudyEvent({
      eventCategory: "build_edit",
      eventType: "build_edit",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeView: activeTab,
      payload: {
        field,
        oldValue,
        newValue,
        focusedLabel,
        isAggregateFocused,
        editingPartySlotIndex,
        buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
        ...extraPayload,
      },
    });
  }

  function createLoggedSetter<T>(
    field: string,
    currentValue: T,
    setter: Dispatch<SetStateAction<T>>,
    extraPayload: Record<string, unknown> = {}
  ): Dispatch<SetStateAction<T>> {
    return (nextValueOrUpdater) => {
      const nextValue =
        typeof nextValueOrUpdater === "function"
          ? (nextValueOrUpdater as (previousValue: T) => T)(currentValue)
          : nextValueOrUpdater;

      logCurrentBuildEdit(field, currentValue, nextValue, extraPayload);
      setter(nextValue);
    };
  }

  useEffect(() => {
    saveSavedBuildsToStorage(savedBuilds);
  }, [savedBuilds]);

  useEffect(() => {
    saveBuildHistoryToStorage(buildHistory);
  }, [buildHistory]);

  useEffect(() => {
    setSelectedSpellIds((current) =>
      cleanSelectedSpellIds(current, availableSpellIds)
    );
  }, [availableSpellIds.join("|")]);

  useEffect(() => {
    setSelectedClassSkills((current) =>
      cleanClassSkillSelectionsForBuild({
        selectedClass,
        selectedRace,
        selectedClassSkills: current,
        unavailableClassSkillProficiencies,
      })
    );
  }, [
    selectedClass,
    selectedRace,
    unavailableClassSkillProficiencies.join("|"),
  ]);

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
  setSimulatorStatus("idle");
  setSimulatorError(null);
  setSimulatorDprRounds([]);
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

  function appendBuildHistory(
    savedBuild: SavedBuild,
    eventType: "created" | "updated"
  ) {
    const historyEntry = createBuildHistoryEntry(savedBuild, eventType);

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "history_entry_created",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activeView: "build-history",
      payload: {
        historyEntryId: historyEntry.id,
        savedBuildId: savedBuild.id,
        historyEventType: eventType,
        label: savedBuild.label,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
      },
    });

    setBuildHistory((current) => [historyEntry, ...current]);
  }

  function upsertSavedBuild(nextBuild: SavedBuild) {
    setSavedBuilds((current) => {
      const alreadyExists = current.some((item) => item.id === nextBuild.id);

      if (!alreadyExists) return [nextBuild, ...current];

      return current.map((item) =>
        item.id === nextBuild.id ? nextBuild : item
      );
    });
  }

  function updatePartySlotCopies(nextBuild: SavedBuild) {
    setPartySlots((current) =>
      current.map((slot) => (slot?.id === nextBuild.id ? nextBuild : slot))
    );
  }

  function getCurrentEditorAsSavedBuild() {
    if (focusedSavedBuild) {
      return createUpdatedSavedBuild(focusedSavedBuild, currentEditorSnapshot);
    }

    return createSavedBuild(currentEditorSnapshot);
  }

  function persistFocusedBuildIfSaved() {
    if (!focusedSavedBuild) return;

    const updatedBuild = createUpdatedSavedBuild(
      focusedSavedBuild,
      currentEditorSnapshot
    );

    upsertSavedBuild(updatedBuild);
    updatePartySlotCopies(updatedBuild);
    setFocusedSavedBuild(updatedBuild);
  }

  function handleRaceChange(value: string) {
    const race = value as RaceName | "";

    logCurrentBuildEdit("selectedRace", selectedRace, race, {
      resetFields: [
        "selectedSubrace",
        "selectedClassFeatureIds",
        "activeClassFeatureIds",
      ],
    });

    setSelectedRace(race);
    setSelectedSubrace("");
    setSelectedClassFeatureIds([]);
    setActiveClassFeatureIds([]);
  }

  function handleClassChange(value: string) {
    const className = value as ClassName | "";

    logCurrentBuildEdit("selectedClass", selectedClass, className, {
      resetFields: [
        "selectedSubclass",
        "selectedClassSkills",
        "bardExpertise",
        "rogueExpertise",
        "loreBardSkills",
        "knowledgeClericExpertise",
        "rangerFavouredEnemy",
        "rangerNaturalExplorer",
        "selectedWarlockInvocations",
        "selectedSpellIds",
        "selectedClassFeatureIds",
        "activeClassFeatureIds",
      ],
    });

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

  async function handleEvaluateBuild() {
  if (isAggregateFocused || simulatorStatus === "loading") return;

  const simulatorBuildName = getSimulatorBuildNameForSnapshot(
    currentEditorSnapshot
  );

  logStudyEvent({
    eventCategory: "evaluation",
    eventType: "evaluation_requested",
    activeBuildId: focusedSavedBuild?.id,
    activeBuildLabel: focusedLabel,
    activeView: "main-data-circle",
    payload: {
      resultSource: "bg3_simulator_api",
      simulatorBuildName,
      buildSnapshot: currentEditorSnapshot,
      buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
    },
  });

  setHasEvaluatedBuild(true);
  setSimulatorStatus("loading");
  setSimulatorError(null);

  try {
    const response = await runBg3PrioritySimulation({
      build: simulatorBuildName,
      max_rounds: 10,
      rotation: [],
      charname: characterName || "Player",
      include_history: true,
    });

    const rounds = mapBg3SimulationToDprRounds(response);

    if (!rounds.some((round) => round.damage > 0)) {
      throw new Error(
        "The simulator returned a response, but no round damage could be extracted yet. Check the response shape in the console."
      );
    }

    setSimulatorDprRounds(rounds);
    setSimulatorStatus("success");

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "evaluation_completed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeView: "main-data-circle",
      payload: {
        resultSource: "bg3_simulator_api",
        simulatorBuildName,
        averageDpr: getAverageDpr(rounds),
        rounds,
        buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown simulator error.";

    console.error("BG3 simulator evaluation failed:", error);

    setSimulatorStatus("error");
    setSimulatorError(message);
    setSimulatorDprRounds([]);

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "evaluation_failed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeView: "main-data-circle",
      payload: {
        resultSource: "bg3_simulator_api",
        simulatorBuildName,
        errorMessage: message,
        buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      },
    });
  }
}

  function applyEditorSnapshot(
    snapshot: BuildEditorSnapshot,
    sourceSavedBuild: SavedBuild | null = null,
    sourcePartySlotIndex: number | null = null
  ) {
    setBuildName(snapshot.buildName);
    setCharacterName(snapshot.characterName);

    setSelectedRace(snapshot.selectedRace);
    setSelectedSubrace(snapshot.selectedSubrace);
    setSelectedBackground(snapshot.selectedBackground);

    setSelectedClass(snapshot.selectedClass);
    setSelectedSubclass(snapshot.selectedSubclass);
    setSelectedLevel(snapshot.selectedLevel);

    setBaseAbilityScores(snapshot.baseAbilityScores);
    setBonusPlusTwo(snapshot.bonusPlusTwo);
    setBonusPlusOne(snapshot.bonusPlusOne);
    setFeatSelections(snapshot.featSelections);

    setSelectedClassSkills(snapshot.selectedClassSkills);
    setBardExpertise(snapshot.bardExpertise);
    setRogueExpertise(snapshot.rogueExpertise);
    setLoreBardSkills(snapshot.loreBardSkills);
    setKnowledgeClericExpertise(snapshot.knowledgeClericExpertise);

    setRangerFavouredEnemy(snapshot.rangerFavouredEnemy);
    setRangerNaturalExplorer(snapshot.rangerNaturalExplorer);
    setSelectedWarlockInvocations(snapshot.selectedWarlockInvocations);

    setSelectedSpellIds(snapshot.selectedSpellIds);
    setSelectedClassFeatureIds(snapshot.selectedClassFeatureIds);
    setActiveClassFeatureIds(snapshot.activeClassFeatureIds);

    setFocusedSavedBuild(sourceSavedBuild);
    setEditingPartySlotIndex(sourcePartySlotIndex);
    setFocusedDataCircle("editor");
    setHasEvaluatedBuild(false);
  }

  function handleSaveNewBuild() {
    const savedBuild = createSavedBuild(currentEditorSnapshot);

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_saved",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activeView: activeTab,
      payload: {
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        snapshot: savedBuild.snapshot,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
      },
    });

    setSavedBuilds((current) => [savedBuild, ...current]);
    setFocusedSavedBuild(savedBuild);
    setEditingPartySlotIndex(null);
    appendBuildHistory(savedBuild, "created");
  }

  function handleOverwriteSavedBuild(buildId: string) {
    const partySlotBuild =
      partySlots.find((slot) => slot?.id === buildId) ?? null;

    const existingBuild =
      savedBuilds.find((savedBuild) => savedBuild.id === buildId) ??
      partySlotBuild ??
      (focusedSavedBuild?.id === buildId ? focusedSavedBuild : null);

    if (!existingBuild) return;

    const updatedBuild = createUpdatedSavedBuild(
      existingBuild,
      currentEditorSnapshot
    );

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_overwritten",
      activeBuildId: updatedBuild.id,
      activeBuildLabel: updatedBuild.label,
      activeView: activeTab,
      payload: {
        savedBuildId: updatedBuild.id,
        label: updatedBuild.label,
        previousSnapshotSummary: getSnapshotSummary(existingBuild.snapshot),
        nextSnapshot: updatedBuild.snapshot,
        nextSnapshotSummary: getSnapshotSummary(updatedBuild.snapshot),
      },
    });

    upsertSavedBuild(updatedBuild);
    updatePartySlotCopies(updatedBuild);

    if (focusedSavedBuild?.id === buildId) {
      setFocusedSavedBuild(updatedBuild);
    }

    appendBuildHistory(updatedBuild, "updated");
  }

  function handleLoadSavedBuild(buildId: string) {
    const savedBuild = savedBuilds.find((item) => item.id === buildId);

    if (!savedBuild) return;

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_loaded",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activeView: "saved-builds-panel",
      payload: {
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        previousFocusedLabel: focusedLabel,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
      },
    });

    persistFocusedBuildIfSaved();
    applyEditorSnapshot(savedBuild.snapshot, savedBuild, null);
  }

  function handleLoadSavedBuildIntoPartySlot(
    buildId: string,
    slotIndex: number
  ) {
    const savedBuild = savedBuilds.find((item) => item.id === buildId);

    if (!savedBuild) return;

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_assigned",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activeView: "saved-builds-panel",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
      },
    });

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? savedBuild : slot))
    );
  }

  function handleEditPartySlot(slotIndex: number) {
    const selectedSlotBuild = partySlots[slotIndex];

    if (!selectedSlotBuild || isAggregateFocused) return;

    const outgoingFocusedBuild = getCurrentEditorAsSavedBuild();

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_focused",
      activeBuildId: selectedSlotBuild.id,
      activeBuildLabel: selectedSlotBuild.label,
      activeView: "party-dock",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        incomingBuildId: selectedSlotBuild.id,
        incomingBuildLabel: selectedSlotBuild.label,
        outgoingBuildId: outgoingFocusedBuild.id,
        outgoingBuildLabel: outgoingFocusedBuild.label,
        interactionMode: "swap_focused_build_with_party_slot",
      },
    });

    upsertSavedBuild(outgoingFocusedBuild);

    setPartySlots((current) =>
      current.map((slot, index) =>
        index === slotIndex ? outgoingFocusedBuild : slot
      )
    );

    applyEditorSnapshot(
      selectedSlotBuild.snapshot,
      selectedSlotBuild,
      slotIndex
    );
  }

  function handleFocusAggregate() {
    logStudyEvent({
      eventCategory: "party",
      eventType: "aggregate_focused",
      activeView: "focus-selector",
      payload: {
        focusedBuildSummary: getSnapshotSummary(currentEditorSnapshot),
        assignedPartySlots: partySlots.map((slot, index) => ({
          slotIndex: index,
          slotNumber: index + 1,
          savedBuildId: slot?.id ?? null,
          label: slot?.label ?? null,
        })),
      },
    });

    persistFocusedBuildIfSaved();
    setFocusedDataCircle("aggregate");
    setEditingPartySlotIndex(null);
    setDataCircleFocus(null);
  }

  function handleFocusCurrentEditor() {
    logStudyEvent({
      eventCategory: "party",
      eventType: "editable_focused",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeView: "focus-selector",
      payload: {
        focusedLabel,
        snapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      },
    });

    setFocusedDataCircle("editor");
        setDataCircleFocus(null);
  }

  function handleClearPartySlot(slotIndex: number) {
    const clearedSlot = partySlots[slotIndex];

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_cleared",
      activeBuildId: clearedSlot?.id,
      activeBuildLabel: clearedSlot?.label,
      activeView: "saved-builds-panel",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        clearedBuildId: clearedSlot?.id ?? null,
        clearedBuildLabel: clearedSlot?.label ?? null,
      },
    });

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? null : slot))
    );
  }

  function handleDeleteSavedBuild(buildId: string) {
    const deletedBuild =
      savedBuilds.find((savedBuild) => savedBuild.id === buildId) ?? null;

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_deleted",
      activeBuildId: buildId,
      activeBuildLabel: deletedBuild?.label,
      activeView: "saved-builds-panel",
      payload: {
        savedBuildId: buildId,
        label: deletedBuild?.label ?? null,
        snapshotSummary: deletedBuild
          ? getSnapshotSummary(deletedBuild.snapshot)
          : null,
      },
    });

    setSavedBuilds((current) =>
      current.filter((savedBuild) => savedBuild.id !== buildId)
    );

    setPartySlots((current) =>
      current.map((slot) => (slot?.id === buildId ? null : slot))
    );

    if (focusedSavedBuild?.id === buildId) {
      setFocusedSavedBuild(null);
      setEditingPartySlotIndex(null);
    }
  }

  function handleLoadHistoryEntry(historyEntryId: string) {
    const historyEntry = buildHistory.find(
      (entry) => entry.id === historyEntryId
    );

    if (!historyEntry) return;

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_loaded",
      activeBuildId: historyEntry.savedBuildId,
      activeBuildLabel: historyEntry.label,
      activeView: "process-spiral",
      payload: {
        source: "history-entry",
        historyEntryId: historyEntry.id,
        savedBuildId: historyEntry.savedBuildId,
        label: historyEntry.label,
        snapshotSummary: getSnapshotSummary(historyEntry.snapshot),
      },
    });

    applyEditorSnapshot(historyEntry.snapshot, null, null);
  }

  function handleRestoreHistoryEntryAsSavedBuild(historyEntryId: string) {
    const historyEntry = buildHistory.find(
      (entry) => entry.id === historyEntryId
    );

    if (!historyEntry) return;

    const restoredBuild = createSavedBuild(
      historyEntry.snapshot,
      `${historyEntry.label} · restored`
    );

    logStudyEvent({
      eventCategory: "build_lifecycle",
      eventType: "build_restored_from_history",
      activeBuildId: restoredBuild.id,
      activeBuildLabel: restoredBuild.label,
      activeView: "process-spiral",
      payload: {
        restoredBuildId: restoredBuild.id,
        restoredLabel: restoredBuild.label,
        sourceHistoryEntryId: historyEntry.id,
        sourceSavedBuildId: historyEntry.savedBuildId,
        snapshot: restoredBuild.snapshot,
        snapshotSummary: getSnapshotSummary(restoredBuild.snapshot),
      },
    });

    setSavedBuilds((current) => [restoredBuild, ...current]);
    setFocusedSavedBuild(restoredBuild);
    setEditingPartySlotIndex(null);
    appendBuildHistory(restoredBuild, "created");
  }

  function handleLoadHistoryEntryIntoPartySlot(
    historyEntryId: string,
    slotIndex: number
  ) {
    const historyEntry = buildHistory.find(
      (entry) => entry.id === historyEntryId
    );

    if (!historyEntry) return;

    const restoredBuild = createSavedBuild(
      historyEntry.snapshot,
      `${historyEntry.label} · restored`
    );

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_assigned",
      activeBuildId: restoredBuild.id,
      activeBuildLabel: restoredBuild.label,
      activeView: "process-spiral",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        restoredBuildId: restoredBuild.id,
        restoredLabel: restoredBuild.label,
        sourceHistoryEntryId: historyEntry.id,
        sourceSavedBuildId: historyEntry.savedBuildId,
        snapshotSummary: getSnapshotSummary(restoredBuild.snapshot),
      },
    });

    setSavedBuilds((current) => [restoredBuild, ...current]);

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? restoredBuild : slot))
    );

    appendBuildHistory(restoredBuild, "created");
  }

  const partyDockItems: PartyDockItem[] = [
    {
      label: "Aggregate",
      fallbackLabel: "Aggregate",
      modifier: "aggregate",
      savedBuild: null,
      isFocused: isAggregateFocused,
      onFocus: handleFocusAggregate,
    },
    ...partySlots.map((slot, index): PartyDockItem => ({
      label: slot ? getSavedBuildTitle(slot) : `Member ${index + 1}`,
      fallbackLabel: `Member ${index + 1}`,
      modifier: slot ? "member-filled" : "member-empty",
      savedBuild: slot,
      isFocused: !isAggregateFocused && editingPartySlotIndex === index,
      onFocus: () => handleEditPartySlot(index),
    })),
  ];

  return (
    <main className="workspace-page">
      <section
        className={`workspace-half planner-half ${
          isAggregateFocused ? "planner-half--readonly-focus" : ""
        } ${isProcessSpiralExpanded ? "planner-half--process-expanded" : ""}`}
      >
        {isProcessSpiralExpanded ? (
          <ProcessSpiralPanel
            buildHistory={buildHistory}
            isExpanded
            onCollapse={() => setIsProcessSpiralExpanded(false)}
            onLoadHistoryEntry={(historyEntryId) => {
              handleLoadHistoryEntry(historyEntryId);
              setIsProcessSpiralExpanded(false);
            }}
            onLoadHistoryEntryIntoPartySlot={handleLoadHistoryEntryIntoPartySlot}
            onRestoreHistoryEntryAsSavedBuild={
              handleRestoreHistoryEntryAsSavedBuild
            }
          />
        ) : (
          <>
            <header className="workspace-header">
              <div>
                <p className="eyebrow">BG3 Build Planner</p>
                <h1>Build Creation</h1>
              </div>

              <button
                className="evaluate-button"
                type="button"
                onClick={handleEvaluateBuild}
                disabled={isAggregateFocused}
                title={
                  isAggregateFocused
                    ? "Aggregate is a read-only calculated preview."
                    : "Evaluate the current editable build."
                }
              >
                {simulatorStatus === "loading"
  ? "Running Simulator..."
  : hasEvaluatedBuild
    ? "Re-evaluate Build"
    : "Evaluate Build"}
              </button>
            </header>

            <nav className="tab-bar" aria-label="Build creation sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "tab active" : "tab"}
                  onClick={() => {
                    if (activeTab === tab.id) return;

                    logStudyEvent({
                      eventCategory: "visualization",
                      eventType: "planner_tab_changed",
                      activeView: "build-planner",
                      payload: {
                        previousTab: activeTab,
                        nextTab: tab.id,
                      },
                    });

                    setActiveTab(tab.id);
                  }}
                  type="button"
                  disabled={isAggregateFocused}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="planner-content-layout">
              <aside className="summary-card summary-card--compact">
                <div className="summary-compact-header">
                  <h2>Current Build</h2>
                  <strong>{selectedLevel}</strong>
                </div>

                <div className="summary-compact-grid">
                  <div className="summary-row">
                    <span>Focus</span>
                    <strong>{focusedLabel}</strong>
                  </div>

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
                </div>

                <section
                  className="focus-selector"
                  aria-label="Focused data circle"
                >
                  <div className="focus-selector-header">
                    <span>Big circle focus</span>
                    <strong>{focusedLabel}</strong>
                  </div>

                  <div className="focus-selector-grid">
                    <button
                      type="button"
                      className={
                        !isAggregateFocused
                          ? "focus-selector-button focus-selector-button--active"
                          : "focus-selector-button"
                      }
                      onClick={handleFocusCurrentEditor}
                    >
                      Editable
                    </button>

                    <button
                      type="button"
                      className={
                        isAggregateFocused
                          ? "focus-selector-button focus-selector-button--active focus-selector-button--aggregate"
                          : "focus-selector-button focus-selector-button--aggregate"
                      }
                      onClick={handleFocusAggregate}
                    >
                      Aggregate
                    </button>

                    {partySlots.map((slot, index) => {
                      const isFocused =
                        !isAggregateFocused && editingPartySlotIndex === index;

                      return (
                        <button
                          key={`focus-party-${index}`}
                          type="button"
                          className={
                            isFocused
                              ? "focus-selector-button focus-selector-button--active"
                              : "focus-selector-button"
                          }
                          onClick={() => handleEditPartySlot(index)}
                          disabled={!slot || isAggregateFocused}
                          title={
                            slot
                              ? `Swap focused build with ${getSavedBuildTitle(
                                  slot
                                )}`
                              : `Member ${index + 1} has no assigned build.`
                          }
                        >
                          Slot {index + 1}
                        </button>
                      );
                    })}
                  </div>

                  {isAggregateFocused ? (
                    <p className="focus-selector-note">
                      Aggregate combines the focused build with party slots 1–3.
                    </p>
                  ) : focusedSavedBuild ? (
                    <p className="focus-selector-note">
                      Editing {getSavedBuildTitle(focusedSavedBuild)}.
                    </p>
                  ) : (
                    <p className="focus-selector-note">
                      The focused build is the fourth party member.
                    </p>
                  )}
                </section>

                <ProcessSpiralPanel
                  buildHistory={buildHistory}
                  onExpand={() => setIsProcessSpiralExpanded(true)}
                  onLoadHistoryEntry={handleLoadHistoryEntry}
                  onLoadHistoryEntryIntoPartySlot={
                    handleLoadHistoryEntryIntoPartySlot
                  }
                  onRestoreHistoryEntryAsSavedBuild={
                    handleRestoreHistoryEntryAsSavedBuild
                  }
                />

                <StudyLoggingPanel
                  currentSnapshot={currentEditorSnapshot}
                  partySlots={partySlots}
                  focusedLabel={focusedLabel}
                />

                <SavedBuildsPanel
                  currentSnapshot={currentEditorSnapshot}
                  savedBuilds={savedBuilds}
                  partySlots={partySlots}
                  onSaveNew={handleSaveNewBuild}
                  onOverwrite={handleOverwriteSavedBuild}
                  onLoad={handleLoadSavedBuild}
                  onLoadIntoPartySlot={handleLoadSavedBuildIntoPartySlot}
                  onClearPartySlot={handleClearPartySlot}
                  onDelete={handleDeleteSavedBuild}
                />
              </aside>

              <section
                className={`main-panel ${
                  isAggregateFocused ? "main-panel--readonly-preview" : ""
                }`}
                aria-disabled={isAggregateFocused}
              >
                {isAggregateFocused ? (
                  <div className="main-panel-readonly-overlay">
                    Viewing Aggregate. Select Editable or a party member to
                    edit.
                  </div>
                ) : null}

                {activeTab === "character" && (
                  <CharacterTab
                    buildName={buildName}
                    setBuildName={createLoggedSetter(
                      "buildName",
                      buildName,
                      setBuildName
                    )}
                    characterName={characterName}
                    setCharacterName={createLoggedSetter(
                      "characterName",
                      characterName,
                      setCharacterName
                    )}
                    selectedRace={selectedRace}
                    selectedSubrace={selectedSubrace}
                    selectedBackground={selectedBackground}
                    selectedClass={selectedClass}
                    selectedClassSkills={selectedClassSkills}
                    lockedSkills={lockedSkills}
                    unavailableClassSkillProficiencies={
                      unavailableClassSkillProficiencies
                    }
                    allProficiencies={allProficiencies}
                    allExpertise={allExpertise}
                    onRaceChange={handleRaceChange}
                    setSelectedSubrace={(value) => {
                      logCurrentBuildEdit(
                        "selectedSubrace",
                        selectedSubrace,
                        value,
                        {
                          resetFields: [
                            "selectedClassFeatureIds",
                            "activeClassFeatureIds",
                          ],
                        }
                      );

                      setSelectedSubrace(value);
                      setSelectedClassFeatureIds([]);
                      setActiveClassFeatureIds([]);
                    }}
                    setSelectedBackground={createLoggedSetter(
                      "selectedBackground",
                      selectedBackground,
                      setSelectedBackground
                    )}
                    onClassChange={handleClassChange}
                    setSelectedClassSkills={createLoggedSetter(
                      "selectedClassSkills",
                      selectedClassSkills,
                      setSelectedClassSkills
                    )}
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
                    setSelectedSubclass={createLoggedSetter(
                      "selectedSubclass",
                      selectedSubclass,
                      setSelectedSubclass
                    )}
                    setSelectedLevel={createLoggedSetter(
                      "selectedLevel",
                      selectedLevel,
                      setSelectedLevel
                    )}
                    setBardExpertise={createLoggedSetter(
                      "bardExpertise",
                      bardExpertise,
                      setBardExpertise
                    )}
                    setRogueExpertise={createLoggedSetter(
                      "rogueExpertise",
                      rogueExpertise,
                      setRogueExpertise
                    )}
                    setLoreBardSkills={createLoggedSetter(
                      "loreBardSkills",
                      loreBardSkills,
                      setLoreBardSkills
                    )}
                    setKnowledgeClericExpertise={createLoggedSetter(
                      "knowledgeClericExpertise",
                      knowledgeClericExpertise,
                      setKnowledgeClericExpertise
                    )}
                    setRangerFavouredEnemy={createLoggedSetter(
                      "rangerFavouredEnemy",
                      rangerFavouredEnemy,
                      setRangerFavouredEnemy
                    )}
                    setRangerNaturalExplorer={createLoggedSetter(
                      "rangerNaturalExplorer",
                      rangerNaturalExplorer,
                      setRangerNaturalExplorer
                    )}
                    setSelectedWarlockInvocations={createLoggedSetter(
                      "selectedWarlockInvocations",
                      selectedWarlockInvocations,
                      setSelectedWarlockInvocations
                    )}
                    setBaseAbilityScores={createLoggedSetter(
                      "baseAbilityScores",
                      baseAbilityScores,
                      setBaseAbilityScores
                    )}
                    setBonusPlusTwo={createLoggedSetter(
                      "bonusPlusTwo",
                      bonusPlusTwo,
                      setBonusPlusTwo
                    )}
                    setBonusPlusOne={createLoggedSetter(
                      "bonusPlusOne",
                      bonusPlusOne,
                      setBonusPlusOne
                    )}
                    setFeatSelections={createLoggedSetter(
                      "featSelections",
                      featSelections,
                      setFeatSelections
                    )}
                  />
                )}

                {activeTab === "spellsAbilities" && (
                  <SpellsAbilitiesTab
  selectedClass={selectedClass}
  featSelections={featSelections}
  selectedSubclass={selectedSubclass}
  selectedLevel={selectedLevel}
  selectedWarlockInvocations={selectedWarlockInvocations}
  selectedSpellIds={selectedSpellIds}
  setSelectedSpellIds={createLoggedSetter(
    "selectedSpellIds",
    selectedSpellIds,
    setSelectedSpellIds
  )}
  availableClassFeatures={availableClassFeatures}
  selectedClassFeatureIds={selectedClassFeatureIds}
  fixedClassFeatureIds={fixedClassFeatureIds}
  setSelectedClassFeatureIds={createLoggedSetter(
    "selectedClassFeatureIds",
    selectedClassFeatureIds,
    setSelectedClassFeatureIds
  )}
  activeClassFeatureIds={activeClassFeatureIds}
  setActiveClassFeatureIds={createLoggedSetter(
    "activeClassFeatureIds",
    activeClassFeatureIds,
    setActiveClassFeatureIds
  )}
  spellChoiceMaxOverrides={spellChoiceMaxOverrides}
  dataCircleFocus={dataCircleFocus}
/>
                )}
              </section>
            </div>
          </>
        )}
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
            onClick={() => {
              const nextValue = !showPartyPlanner;

              logStudyEvent({
                eventCategory: "visualization",
                eventType: "party_planner_toggled",
                activeView: "visualisation-panel",
                payload: {
                  previousValue: showPartyPlanner,
                  nextValue,
                },
              });

              setShowPartyPlanner(nextValue);
            }}
          >
            {showPartyPlanner ? "Hide party planner" : "Show party planner"}
          </button>

          <div className="main-data-circle-frame">
            {isAggregateFocused ? (
              <DataCircle
                buildName="Party Aggregate"
                characterName="Combined Party"
                selectedClass=""
                selectedSubclass="Aggregate"
                selectedLevel={12}
                selectedSpellIds={[]}
                fixedClassFeatureIds={[]}
                selectedClassFeatureIds={[]}
                activeClassFeatureIds={[]}
                showDprLayer={false}
                visualizedItemsOverride={partyAggregateItems}
              />
            ) : (
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
  dprRounds={simulatorDprRounds}
  averageDpr={simulatorAverageDpr}
  dprStatus={simulatorStatus}
  dprError={simulatorError}
  setLinkedFocus={setDataCircleFocus}
/>
            )}
          </div>

          {showPartyPlanner && (
            <section className="party-dock" aria-label="Party planner preview">
              <div className="party-dock-track">
                {partyDockItems.map((slot, index) => {
                  const isDisabled = index > 0 && !slot.savedBuild;

                  return (
                    <article
                      className={`party-node party-node--${slot.modifier} ${
                        slot.isFocused ? "party-node--focused" : ""
                      }`}
                      key={slot.fallbackLabel}
                      title={
                        slot.savedBuild
                          ? `${slot.fallbackLabel}: ${getSavedBuildTitle(
                              slot.savedBuild
                            )}`
                          : slot.label
                      }
                    >
                      <button
                        type="button"
                        className="party-node-side-label"
                        onClick={slot.onFocus}
                        disabled={isDisabled}
                        title={
                          isDisabled
                            ? "Assign a saved build to this slot first."
                            : index === 0
                              ? "Focus aggregate preview"
                              : `Swap focused build with ${slot.fallbackLabel}`
                        }
                      >
                        {slot.label}
                      </button>

                      <div className="party-node-orb-shell">
                        {index === 0 ? (
                          <div className="party-node-circle">
                            <DataCircle
                              buildName="Party Aggregate"
                              characterName="Combined Party"
                              selectedClass=""
                              selectedSubclass="Aggregate"
                              selectedLevel={12}
                              selectedSpellIds={[]}
                              fixedClassFeatureIds={[]}
                              selectedClassFeatureIds={[]}
                              activeClassFeatureIds={[]}
                              showDprLayer={false}
                              visualizedItemsOverride={partyAggregateItems}
                              variant="aggregate"
                            />
                          </div>
                        ) : slot.savedBuild ? (
                          <div className="party-node-circle">
                            <DataCircle
                              buildName={slot.savedBuild.snapshot.buildName}
                              characterName={
                                slot.savedBuild.snapshot.characterName
                              }
                              selectedClass={
                                slot.savedBuild.snapshot.selectedClass
                              }
                              selectedSubclass={
                                slot.savedBuild.snapshot.selectedSubclass
                              }
                              selectedLevel={
                                slot.savedBuild.snapshot.selectedLevel
                              }
                              selectedSpellIds={
                                slot.savedBuild.snapshot.selectedSpellIds
                              }
                              fixedClassFeatureIds={getFixedClassFeatureIdsForSnapshot(
                                slot.savedBuild.snapshot
                              )}
                              selectedClassFeatureIds={
                                slot.savedBuild.snapshot.selectedClassFeatureIds
                              }
                              activeClassFeatureIds={
                                slot.savedBuild.snapshot.activeClassFeatureIds
                              }
                              showDprLayer={false}
                              variant="party"
                            />
                          </div>
                        ) : (
                          <div className="party-node-empty">
                            <span>Empty</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default BuildPlanner;