import { useEffect, useMemo, useState } from "react";
import "./BuildPlanner.css";

import { getAvailableRaceFeaturesForBuild } from "../data/raceFeatures";
import CharacterTab from "./CharacterTab";
import ClassScoresTab from "./ClassScoresTab";
import SpellsAbilitiesTab from "./SpellsAbilitiesTab";
import DataCircle from "./DataCircle";
import SavedBuildsPanel from "./SavedBuildsPanel";
import ProcessSpiralPanel from "./ProcessSpiralPanel";

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
  const [showPartyPlanner, setShowPartyPlanner] = useState(true);
  const [focusedDataCircle, setFocusedDataCircle] =
    useState<DataCircleFocusSource>("editor");

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

  function appendBuildHistory(
    savedBuild: SavedBuild,
    eventType: "created" | "updated"
  ) {
    const historyEntry = createBuildHistoryEntry(savedBuild, eventType);
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
    if (isAggregateFocused) return;

    setHasEvaluatedBuild(true);
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

    persistFocusedBuildIfSaved();
    applyEditorSnapshot(savedBuild.snapshot, savedBuild, null);
  }

  function handleLoadSavedBuildIntoPartySlot(
    buildId: string,
    slotIndex: number
  ) {
    const savedBuild = savedBuilds.find((item) => item.id === buildId);

    if (!savedBuild) return;

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? savedBuild : slot))
    );
  }

  function handleEditPartySlot(slotIndex: number) {
    const selectedSlotBuild = partySlots[slotIndex];

    if (!selectedSlotBuild || isAggregateFocused) return;

    const outgoingFocusedBuild = getCurrentEditorAsSavedBuild();

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
    persistFocusedBuildIfSaved();
    setFocusedDataCircle("aggregate");
    setEditingPartySlotIndex(null);
  }

  function handleFocusCurrentEditor() {
    setFocusedDataCircle("editor");
  }

  function handleClearPartySlot(slotIndex: number) {
    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? null : slot))
    );
  }

  function handleDeleteSavedBuild(buildId: string) {
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
                    setSelectedWarlockInvocations={
                      setSelectedWarlockInvocations
                    }
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
            onClick={() => setShowPartyPlanner((current) => !current)}
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