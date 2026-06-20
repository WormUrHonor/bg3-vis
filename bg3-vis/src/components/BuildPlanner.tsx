import ToolTutorialOverlay from "./ToolTutorialOverlay";
import StudyHeatmapCapture from "./StudyHeatmapCapture";
import {
  useEffect,
  useMemo,
  useRef,
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
  BG3_SIMULATOR_UNAVAILABLE_MESSAGE,
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

import {
  createBuildEditLoggingPayload,
  createBuildSnapshotSummary,
  createPartyCoverageForLogging,
  createPartySnapshotSummary,
  createStableHash,
  createVisualProfileSummary,
  logFrictionEvent,
  logStudyEvent,
} from "../logic/studyLogger";
import type { VisualizedItemForLogging } from "../types/loggingTypes";

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

type RecentVisualizationFocusContext = {
  focus: DataCircleFocus;
  focusKey: string | null;
  focusSource: DataCircleFocusSource;
  activeView: string;
  focusedLabel: string;
  partySnapshotHash: string;
  startedAtMs: number;
};

type RecentPartyGapContext = {
  partySnapshotHash: string;
  partyGaps: unknown[];
  redundancyScore: number;
  detectedAtMs: number;
};

type RecentEvaluationContext = {
  status: "started" | "completed" | "failed";
  requestedAtMs: number;
  completedAtMs?: number;
  simulatorBuildName: string;
  buildSnapshotHash: string;
  partySnapshotHash: string;
  averageDpr?: number;
  totalDamage?: number;
  roundCount?: number;
  errorMessage?: string;
};

type RecentAggregateFocusContext = {
  focusedAtMs: number;
  partySnapshotHash: string;
  partyGaps: unknown[];
  redundancyScore: number;
};
const USE_BG3_LOCAL_MOCK_BUILD_JSON = false;

const BG3_LOCAL_MOCK_BUILD_JSON_PATH =
  "bg3-simulator-test/BG3_Warlock_Level12_StdEquip (gorKjan.5019).json";
  const BG3_REMOTE_TEST_BUILD_NAME =
  "BG3_Monk_Level12_StdEquip (gorKjan.5019)";

async function loadBg3LocalMockBuildJson(): Promise<unknown> {
  const url = encodeURI(
    `${import.meta.env.BASE_URL}${BG3_LOCAL_MOCK_BUILD_JSON_PATH}`
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Could not load local BG3 mock build JSON from ${url}. Status: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
const FOCUS_TO_ACTION_WINDOW_MS = 30_000;
const PARTY_GAP_RESPONSE_WINDOW_MS = 90_000;
const EVALUATION_RESPONSE_WINDOW_MS = 120_000;
const AGGREGATE_TO_MEMBER_REVISION_WINDOW_MS = 120_000;

function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function areLogValuesEqual(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function getSnapshotSummary(snapshot: BuildEditorSnapshot) {
  return createBuildSnapshotSummary(
    snapshot as unknown as Record<string, unknown>
  );
}

function getPartyMemberLabel(index: number | null) {
  return index === null ? null : `Member ${index + 1}`;
}

function getDataCircleFocusKey(focus: DataCircleFocus) {
  if (!focus) return null;

  if (typeof focus === "string") return focus;

  if (typeof focus === "object") {
    const focusRecord = focus as Record<string, unknown>;
    const readableParts = [
      focusRecord.type,
      focusRecord.itemId,
      focusRecord.itemName,
      focusRecord.label,
      focusRecord.key,
    ].filter((part): part is string => typeof part === "string" && part.length > 0);

    if (readableParts.length > 0) return readableParts.join(":");
  }

  return "data-circle-focus";
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
  const allowedOptions = getClassSkillOptionsForBuild(
    selectedClass,
    selectedRace
  );
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
  if (selectedClass === "Paladin") return "Spells & Features";
  if (selectedClass === "Ranger") return "Spells & Ranger";
  if (selectedClass === "Sorcerer") return "Spells & Metamagic";
  if (selectedClass === "Wizard") return "Spells & Features";

  return "Actions & Passives";
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
  const [selectedBackground, setSelectedBackground] = useState<
    Background | ""
  >("");
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

  const latestVisualizationFocusRef =
    useRef<RecentVisualizationFocusContext | null>(null);
  const latestPartyGapRef = useRef<RecentPartyGapContext | null>(null);
  const latestEvaluationRef = useRef<RecentEvaluationContext | null>(null);
  const latestAggregateFocusRef = useRef<RecentAggregateFocusContext | null>(null);
  const firstPostEvaluationEditLoggedRef = useRef(false);
  const lastLoggedPartySnapshotHashRef = useRef<string | null>(null);

  const isAggregateFocused = focusedDataCircle === "aggregate";
  const isEditingPartySlot = editingPartySlotIndex !== null;
  const activePartyMemberLabel = getPartyMemberLabel(editingPartySlotIndex);

  const focusedLabel = isAggregateFocused
    ? "Aggregate"
    : isEditingPartySlot
      ? `Member ${editingPartySlotIndex + 1}`
      : focusedSavedBuild
        ? getSavedBuildTitle(focusedSavedBuild)
        : "Current Editor";

  const tabs: { id: TabId; label: string }[] = [
    { id: "character", label: "Character" },
    { id: "classScores", label: "(Sub)Class & Scores" },
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
      selectedSpellIds,
      selectedClassFeatureIds,
      activeClassFeatureIds,
    ]
  );

  const currentEditorVisualItems = useMemo(
    () => getVisualizedItemsForSnapshot(currentEditorSnapshot),
    [currentEditorSnapshot]
  );

  const partyAggregateItems = useMemo(
    () => [
      ...currentEditorVisualItems,
      ...partySlots.flatMap((slot) =>
        slot ? getVisualizedItemsForSnapshot(slot.snapshot) : []
      ),
    ],
    [currentEditorVisualItems, partySlots]
  );

  const partySlotsForLogging = useMemo(
    () =>
      partySlots.map((slot) =>
        slot
          ? {
              id: slot.id,
              label: slot.label,
              snapshot: slot.snapshot as unknown as Record<string, unknown>,
            }
          : null
      ),
    [partySlots]
  );

  const partySnapshotSummary = useMemo(
    () =>
      createPartySnapshotSummary({
        focusedBuild:
          currentEditorSnapshot as unknown as Record<string, unknown>,
        focusedBuildId: focusedSavedBuild?.id ?? null,
        focusedBuildLabel: focusedLabel,
        partySlots: partySlotsForLogging,
      }),
    [
      currentEditorSnapshot,
      focusedSavedBuild?.id,
      focusedLabel,
      partySlotsForLogging,
    ]
  );

  const partyVisualProfile = useMemo(
    () =>
      createVisualProfileSummary(
        partyAggregateItems as unknown as VisualizedItemForLogging[]
      ),
    [partyAggregateItems]
  );

  const partyCoverageForLogging = useMemo(
    () =>
      createPartyCoverageForLogging({
        partySnapshotSummary,
        partyVisualProfile,
      }),
    [partySnapshotSummary, partyVisualProfile]
  );

  const finalPartyReady =
    selectedClass !== "" && partySlots.every((slot) => Boolean(slot));
const heatmapActiveView = isProcessSpiralExpanded
  ? "process-spiral-expanded"
  : isAggregateFocused
    ? "aggregate-view"
    : activeTab;
  function createFocusToActionContext(nowMs: number) {
    const context = latestVisualizationFocusRef.current;

    if (!context) return null;

    const latencyMs = nowMs - context.startedAtMs;

    if (latencyMs < 0 || latencyMs > FOCUS_TO_ACTION_WINDOW_MS) {
      return null;
    }

    return {
      focus: context.focus,
      focusKey: context.focusKey,
      focusSource: context.focusSource,
      focusActiveView: context.activeView,
      focusStartedAtMs: context.startedAtMs,
      focusToActionLatencyMs: latencyMs,
      focusPartySnapshotHash: context.partySnapshotHash,
    };
  }

  function createPartyGapResponseContext(nowMs: number) {
    const context = latestPartyGapRef.current;

    if (!context || context.partyGaps.length === 0) return null;

    const latencyMs = nowMs - context.detectedAtMs;

    if (latencyMs < 0 || latencyMs > PARTY_GAP_RESPONSE_WINDOW_MS) {
      return null;
    }

    return {
      partyGapSnapshotHash: context.partySnapshotHash,
      partyGapsAtLastDetection: context.partyGaps,
      partyGapCountAtLastDetection: context.partyGaps.length,
      partyGapDetectedAtMs: context.detectedAtMs,
      gapToEditLatencyMs: latencyMs,
      redundancyScoreAtLastDetection: context.redundancyScore,
    };
  }

  function createEvaluationResponseContext(nowMs: number) {
    const context = latestEvaluationRef.current;

    if (!context || context.status !== "completed" || !context.completedAtMs) {
      return null;
    }

    const latencyMs = nowMs - context.completedAtMs;

    if (latencyMs < 0 || latencyMs > EVALUATION_RESPONSE_WINDOW_MS) {
      return null;
    }

    return {
      simulatorBuildName: context.simulatorBuildName,
      evaluatedBuildSnapshotHash: context.buildSnapshotHash,
      evaluatedPartySnapshotHash: context.partySnapshotHash,
      evaluationRequestedAtMs: context.requestedAtMs,
      evaluationCompletedAtMs: context.completedAtMs,
      evaluationToEditLatencyMs: latencyMs,
      averageDpr: context.averageDpr ?? null,
      totalDamage: context.totalDamage ?? null,
      roundCount: context.roundCount ?? null,
      isFirstPostEvaluationEdit: !firstPostEvaluationEditLoggedRef.current,
    };
  }

  function createAggregateToMemberRevisionContext(nowMs: number) {
    const context = latestAggregateFocusRef.current;

    if (!context || isAggregateFocused) return null;

    const latencyMs = nowMs - context.focusedAtMs;

    if (
      latencyMs < 0 ||
      latencyMs > AGGREGATE_TO_MEMBER_REVISION_WINDOW_MS
    ) {
      return null;
    }

    return {
      aggregateFocusedAtMs: context.focusedAtMs,
      aggregateToMemberRevisionLatencyMs: latencyMs,
      aggregatePartySnapshotHash: context.partySnapshotHash,
      aggregatePartyGaps: context.partyGaps,
      aggregatePartyGapCount: context.partyGaps.length,
      aggregateRedundancyScore: context.redundancyScore,
    };
  }

  function logCurrentBuildEdit(
    field: string,
    oldValue: unknown,
    newValue: unknown,
    extraPayload: Record<string, unknown> = {}
  ) {
    if (areLogValuesEqual(oldValue, newValue)) return;

    const nextSnapshotPatch =
      extraPayload.nextSnapshotPatch &&
      typeof extraPayload.nextSnapshotPatch === "object"
        ? (extraPayload.nextSnapshotPatch as Partial<BuildEditorSnapshot>)
        : {};

    const nextSnapshot = {
      ...currentEditorSnapshot,
      [field]: newValue,
      ...nextSnapshotPatch,
    } as BuildEditorSnapshot;

    const nextItems = getVisualizedItemsForSnapshot(nextSnapshot);
    const nowMs = Date.now();
    const focusToActionContext = createFocusToActionContext(nowMs);
    const partyGapResponseContext = createPartyGapResponseContext(nowMs);
    const evaluationResponseContext = createEvaluationResponseContext(nowMs);
    const aggregateToMemberRevisionContext =
      createAggregateToMemberRevisionContext(nowMs);
    const { nextSnapshotPatch: _discardedPatch, ...loggingExtraPayload } =
      extraPayload;

    const detailedPayload = createBuildEditLoggingPayload({
      field,
      oldValue,
      newValue,
      previousSnapshot:
        currentEditorSnapshot as unknown as Record<string, unknown>,
      nextSnapshot: nextSnapshot as unknown as Record<string, unknown>,
      previousItems:
        currentEditorVisualItems as unknown as VisualizedItemForLogging[],
      nextItems: nextItems as unknown as VisualizedItemForLogging[],
      extraPayload: {
        focusedLabel,
        isAggregateFocused,
        editingPartySlotIndex,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        activeDataCircleFocus: dataCircleFocus,
        activeDataCircleFocusKey: getDataCircleFocusKey(dataCircleFocus),
        focusToActionContext,
        partyGapResponseContext,
        evaluationResponseContext,
        aggregateToMemberRevisionContext,
        ...loggingExtraPayload,
      },
    });

    logStudyEvent({
      eventCategory: "build_edit",
      eventType: "build_edit",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: activeTab,
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      payload: detailedPayload,
    });

    if (detailedPayload.visualProfileDelta) {
      logStudyEvent({
        eventCategory: "build_edit",
        eventType: "build_semantic_delta",
        activeBuildId: focusedSavedBuild?.id,
        activeBuildLabel: focusedLabel,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        activeView: activeTab,
        activeFocusSource: focusedDataCircle,
        activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
        payload: {
          field,
          previousSnapshotHash: detailedPayload.previousSnapshotHash,
          nextSnapshotHash: detailedPayload.nextSnapshotHash,
          snapshotDiff: detailedPayload.snapshotDiff,
          visualProfileDelta: detailedPayload.visualProfileDelta,
          focusToActionContext,
          partyGapResponseContext,
          evaluationResponseContext,
          aggregateToMemberRevisionContext,
          partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        },
      });
    }

    if (focusToActionContext) {
      logStudyEvent({
        eventCategory: "visualization",
        eventType: "data_circle_focus_to_action",
        activeBuildId: focusedSavedBuild?.id,
        activeBuildLabel: focusedLabel,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        activeView: activeTab,
        activeFocusSource: focusedDataCircle,
        activeVisualizationFocus: focusToActionContext.focusKey,
        payload: {
          actionType: "build_edit",
          field,
          previousSnapshotHash: detailedPayload.previousSnapshotHash,
          nextSnapshotHash: detailedPayload.nextSnapshotHash,
          visualProfileDelta: detailedPayload.visualProfileDelta,
          ...focusToActionContext,
        },
      });
    }

    if (partyGapResponseContext) {
      logStudyEvent({
        eventCategory: "party",
        eventType: "party_gap_response_edit",
        activeBuildId: focusedSavedBuild?.id,
        activeBuildLabel: focusedLabel,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        activeView: activeTab,
        activeFocusSource: focusedDataCircle,
        activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
        payload: {
          actionType: "build_edit",
          field,
          previousSnapshotHash: detailedPayload.previousSnapshotHash,
          nextSnapshotHash: detailedPayload.nextSnapshotHash,
          visualProfileDelta: detailedPayload.visualProfileDelta,
          ...partyGapResponseContext,
        },
      });
    }

    if (aggregateToMemberRevisionContext) {
      logStudyEvent({
        eventCategory: "party",
        eventType: "aggregate_to_member_revision",
        activeBuildId: focusedSavedBuild?.id,
        activeBuildLabel: focusedLabel,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        activeView: activeTab,
        activeFocusSource: focusedDataCircle,
        activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
        payload: {
          actionType: "build_edit",
          field,
          previousSnapshotHash: detailedPayload.previousSnapshotHash,
          nextSnapshotHash: detailedPayload.nextSnapshotHash,
          visualProfileDelta: detailedPayload.visualProfileDelta,
          ...aggregateToMemberRevisionContext,
        },
      });
    }

    if (evaluationResponseContext) {
      logStudyEvent({
        eventCategory: "evaluation",
        eventType: "post_evaluation_edit",
        activeBuildId: focusedSavedBuild?.id,
        activeBuildLabel: focusedLabel,
        activePartyMemberIndex: editingPartySlotIndex,
        activePartyMemberLabel,
        activeView: activeTab,
        activeFocusSource: focusedDataCircle,
        activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
        payload: {
          actionType: "build_edit",
          field,
          previousSnapshotHash: detailedPayload.previousSnapshotHash,
          nextSnapshotHash: detailedPayload.nextSnapshotHash,
          visualProfileDelta: detailedPayload.visualProfileDelta,
          ...evaluationResponseContext,
        },
      });

      firstPostEvaluationEditLoggedRef.current = true;
    }
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
function logBlockedUiAction(
  targetType: string,
  targetId: string,
  reason: string,
  extraPayload: Record<string, unknown> = {}
) {
  logFrictionEvent(
    "invalid_selection_attempted",
    {
      sourceComponent: "BuildPlanner",
      targetType,
      targetId,
      reason,
      focusedLabel,
      isAggregateFocused,
      editingPartySlotIndex,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeTab,
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      partySnapshotSummary,
      partyVisualProfile,
      partyGaps: partyCoverageForLogging.partyGaps,
      redundancyScore: partyCoverageForLogging.redundancyScore,
      ...extraPayload,
    },
    {
      activeView: activeTab,
      activeBuildId: focusedSavedBuild?.id ?? null,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    }
  );
}
function handleCreateNewBlankBuild() {
  const previousSnapshotHash = createStableHash(currentEditorSnapshot, "build");

  logStudyEvent({
    eventCategory: "build_lifecycle",
    eventType: "new_blank_build_started",
    activeView: "workspace-header",
    activeBuildId: focusedSavedBuild?.id ?? null,
    activeBuildLabel: focusedLabel,
    activePartyMemberIndex: editingPartySlotIndex,
    activePartyMemberLabel,
    activeFocusSource: focusedDataCircle,
    activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
    partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    payload: {
      sourceComponent: "BuildPlanner",
      action: "create_new_blank_build",
      previousFocusedLabel: focusedLabel,
      previousFocusedBuildId: focusedSavedBuild?.id ?? null,
      previousEditingPartySlotIndex: editingPartySlotIndex,
      previousSnapshotHash,
      previousSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      note: "Clears the editor only. Saved builds and assigned party slots are preserved.",
    },
  });

  setBuildName("");
  setCharacterName("");

  setSelectedRace("");
  setSelectedSubrace("");
  setSelectedBackground("");

  setSelectedClass("");
  setSelectedSubclass("");
  setSelectedLevel(12);

  setBaseAbilityScores(defaultAbilityScores);
  setBonusPlusTwo("");
  setBonusPlusOne("");
  setFeatSelections([]);

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

  setFocusedSavedBuild(null);
  setEditingPartySlotIndex(null);
  setFocusedDataCircle("editor");
  setDataCircleFocus(null);
  latestVisualizationFocusRef.current = null;

  setHasEvaluatedBuild(false);
  setSimulatorStatus("idle");
  setSimulatorError(null);
  setSimulatorDprRounds([]);

  setActiveTab("character");
}
  function handleDataCircleFocusChange(
    nextValueOrUpdater: SetStateAction<DataCircleFocus>
  ) {
    const nextFocus =
      typeof nextValueOrUpdater === "function"
        ? (nextValueOrUpdater as (previousValue: DataCircleFocus) => DataCircleFocus)(
            dataCircleFocus
          )
        : nextValueOrUpdater;

    if (areLogValuesEqual(dataCircleFocus, nextFocus)) {
      setDataCircleFocus(nextFocus);
      return;
    }

    const nextFocusKey = getDataCircleFocusKey(nextFocus);

    const activeCircleView = isAggregateFocused
      ? "aggregate-data-circle"
      : "main-data-circle";

    logStudyEvent({
      eventCategory: "visualization",
      eventType: nextFocus ? "data_circle_focus_selected" : "data_circle_focus_cleared",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: activeCircleView,
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: nextFocusKey,
      payload: {
        previousFocus: dataCircleFocus,
        previousFocusKey: getDataCircleFocusKey(dataCircleFocus),
        nextFocus,
        nextFocusKey,
        focusedLabel,
        focusSource: focusedDataCircle,
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      },
    });

    if (nextFocus) {
      latestVisualizationFocusRef.current = {
        focus: nextFocus,
        focusKey: nextFocusKey,
        focusSource: focusedDataCircle,
        activeView: activeCircleView,
        focusedLabel,
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        startedAtMs: Date.now(),
      };
    } else {
      latestVisualizationFocusRef.current = null;
    }

    setDataCircleFocus(nextFocus);
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
  }, [currentEditorSnapshot]);

  useEffect(() => {
    if (
      lastLoggedPartySnapshotHashRef.current ===
      partySnapshotSummary.partySnapshotHash
    ) {
      return;
    }

    lastLoggedPartySnapshotHashRef.current =
      partySnapshotSummary.partySnapshotHash;

    const nowMs = Date.now();
    const partyGaps = partyCoverageForLogging.partyGaps;

    logStudyEvent({
  eventCategory: "party",
  eventType: "party_coverage_updated",
  activeView: "party-aggregate",
  activeBuildId: focusedSavedBuild?.id,
  activeBuildLabel: focusedLabel,
  activePartyMemberIndex: editingPartySlotIndex,
  activePartyMemberLabel,
  activeFocusSource: focusedDataCircle,
  partySnapshotHash: partySnapshotSummary.partySnapshotHash,
  payload: {
    partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    partySnapshotSummary,
    partyVisualProfile,
    partyGaps,
    partyGapCount: partyGaps.length,
    redundancyScore: partyCoverageForLogging.redundancyScore,
    filledPartySlotCount: partySnapshotSummary.filledSlotCount,
    totalPartyMemberCount: partySnapshotSummary.partySize,
  },
});

    if (partyGaps.length > 0) {
      latestPartyGapRef.current = {
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partyGaps,
        redundancyScore: partyCoverageForLogging.redundancyScore,
        detectedAtMs: nowMs,
      };

    logStudyEvent({
  eventCategory: "party",
  eventType: "party_gap_detected",
  activeView: "party-aggregate",
  activeBuildId: focusedSavedBuild?.id,
  activeBuildLabel: focusedLabel,
  activePartyMemberIndex: editingPartySlotIndex,
  activePartyMemberLabel,
  activeFocusSource: focusedDataCircle,
  partySnapshotHash: partySnapshotSummary.partySnapshotHash,
  payload: {
          partySnapshotHash: partySnapshotSummary.partySnapshotHash,
          partyGaps,
          partyGapCount: partyGaps.length,
          partyVisualProfile,
          redundancyScore: partyCoverageForLogging.redundancyScore,
        },
      });
    } else {
      latestPartyGapRef.current = null;
    }
  }, [
    partySnapshotSummary.partySnapshotHash,
    partyVisualProfile,
    partyCoverageForLogging,
    focusedSavedBuild?.id,
    focusedLabel,
    editingPartySlotIndex,
    activePartyMemberLabel,
    focusedDataCircle,
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
      nextSnapshotPatch: {
        selectedRace: race,
        selectedSubrace: "",
        selectedClassFeatureIds: [],
        activeClassFeatureIds: [],
      },
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
      nextSnapshotPatch: {
        selectedClass: className,
        selectedSubclass: "",
        selectedClassSkills: [],
        bardExpertise: [],
        rogueExpertise: [],
        loreBardSkills: [],
        knowledgeClericExpertise: [],
        rangerFavouredEnemy: "",
        rangerNaturalExplorer: "",
        selectedWarlockInvocations: [],
        selectedSpellIds: [],
        selectedClassFeatureIds: [],
        activeClassFeatureIds: [],
      },
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
  if (isAggregateFocused || simulatorStatus === "loading") {
    logBlockedUiAction(
      "evaluate-build",
      "evaluate-build-button",
      isAggregateFocused
        ? "aggregate_view_is_readonly"
        : "simulator_already_running",
      {
        simulatorStatus,
        hasEvaluatedBuild,
      }
    );

    return;
  }

  const usingLocalMockBuildJson = USE_BG3_LOCAL_MOCK_BUILD_JSON;

const simulatorBuildName = usingLocalMockBuildJson
  ? "BG3_Warlock_Level12_StdEquip (local buildJson mock)"
  : BG3_REMOTE_TEST_BUILD_NAME;

  const requestedAtMs = Date.now();
  const buildSnapshotHash = createStableHash(currentEditorSnapshot, "build");
  const focusKey = getDataCircleFocusKey(dataCircleFocus);

  latestEvaluationRef.current = {
    status: "started",
    requestedAtMs,
    simulatorBuildName,
    buildSnapshotHash,
    partySnapshotHash: partySnapshotSummary.partySnapshotHash,
  };
  firstPostEvaluationEditLoggedRef.current = false;

  const requestPayload = {
    resultSource: "bg3_simulator_api",
    simulatorEndpoint: "/api/bg3/runWithPriority",
    simulatorBuildName,
    usingLocalMockBuildJson,
    localMockBuildJsonPath: usingLocalMockBuildJson
      ? BG3_LOCAL_MOCK_BUILD_JSON_PATH
      : null,
    buildSnapshot: currentEditorSnapshot,
    buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
    buildSnapshotHash,
    partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    partySnapshotSummary,
    partyVisualProfile,
    partyGaps: partyCoverageForLogging.partyGaps,
    focusToActionContext: createFocusToActionContext(requestedAtMs),
  };

  logStudyEvent({
    eventCategory: "evaluation",
    eventType: "evaluation_requested",
    activeBuildId: focusedSavedBuild?.id,
    activeBuildLabel: focusedLabel,
    activePartyMemberIndex: editingPartySlotIndex,
    activePartyMemberLabel,
    activeView: "main-data-circle",
    activeFocusSource: focusedDataCircle,
    activeVisualizationFocus: focusKey,
    taskPhase: "evaluation",
    payload: requestPayload,
  });

  logStudyEvent({
    eventCategory: "evaluation",
    eventType: "simulator_request_started",
    activeBuildId: focusedSavedBuild?.id,
    activeBuildLabel: focusedLabel,
    activePartyMemberIndex: editingPartySlotIndex,
    activePartyMemberLabel,
    activeView: "main-data-circle",
    activeFocusSource: focusedDataCircle,
    activeVisualizationFocus: focusKey,
    taskPhase: "evaluation",
    payload: requestPayload,
  });

  setHasEvaluatedBuild(true);
  setSimulatorStatus("loading");
  setSimulatorError(null);

  try {
    const mockBuildJson = usingLocalMockBuildJson
      ? await loadBg3LocalMockBuildJson()
      : null;

    const response = await runBg3PrioritySimulation(
      usingLocalMockBuildJson
        ? {
            buildJson: mockBuildJson,
            max_rounds: 10,
            rotation: [],
            charname: characterName || "Player",
            include_history: true,
          }
        : {
            build: simulatorBuildName,
            max_rounds: 10,
            rotation: [],
            charname: characterName || "Player",
            include_history: true,
          }
    );

    console.log("BG3 simulator raw response:", response);

    const rounds = mapBg3SimulationToDprRounds(response);

    if (!rounds.some((round) => round.damage > 0)) {
      throw new Error(
        "The simulator returned a response, but I could not extract any damage data. ."
      );
    }

    const completedAtMs = Date.now();
    const totalDamage = rounds.reduce((sum, round) => sum + round.damage, 0);
    const averageDpr = getAverageDpr(rounds);
    const roundDamages = rounds.map((round) => round.damage);
    const resultSummary = {
      averageDpr,
      totalDamage,
      roundCount: rounds.length,
      maxRoundDamage: Math.max(...roundDamages),
      minRoundDamage: Math.min(...roundDamages),
    };

    latestEvaluationRef.current = {
      status: "completed",
      requestedAtMs,
      completedAtMs,
      simulatorBuildName,
      buildSnapshotHash,
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      averageDpr,
      totalDamage,
      roundCount: rounds.length,
    };
    firstPostEvaluationEditLoggedRef.current = false;

    setSimulatorDprRounds(rounds);
    setSimulatorStatus("success");

    const completedPayload = {
      resultSource: "bg3_simulator_api",
      simulatorEndpoint: "/api/bg3/runWithPriority",
      simulatorBuildName,
      usingLocalMockBuildJson,
      localMockBuildJsonPath: usingLocalMockBuildJson
        ? BG3_LOCAL_MOCK_BUILD_JSON_PATH
        : null,
      averageDpr,
      totalDamage,
      rounds,
      resultSummary,
      requestToCompletionMs: completedAtMs - requestedAtMs,
      buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      buildSnapshotHash,
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      partySnapshotSummary,
      partyVisualProfile,
      partyGaps: partyCoverageForLogging.partyGaps,
      rawResponse: response,
    };

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "evaluation_completed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: "main-data-circle",
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: focusKey,
      taskPhase: "evaluation",
      payload: completedPayload,
    });

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "simulator_request_succeeded",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: "main-data-circle",
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: focusKey,
      taskPhase: "evaluation",
      payload: completedPayload,
    });
  } catch (error) {
    const failedAtMs = Date.now();
    const message =
      error instanceof Error ? error.message : "Unknown simulator error.";

    console.error("BG3 simulator evaluation failed:", error);

    latestEvaluationRef.current = {
      status: "failed",
      requestedAtMs,
      completedAtMs: failedAtMs,
      simulatorBuildName,
      buildSnapshotHash,
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      errorMessage: message,
    };

setSimulatorStatus("error");
setSimulatorError(BG3_SIMULATOR_UNAVAILABLE_MESSAGE);
setSimulatorDprRounds([]);

window.setTimeout(() => {
  setSimulatorStatus((currentStatus) =>
    currentStatus === "error" ? "idle" : currentStatus
  );

  setSimulatorError((currentError) =>
    currentError === BG3_SIMULATOR_UNAVAILABLE_MESSAGE ? null : currentError
  );
}, 3000);

    const failedPayload = {
      resultSource: "bg3_simulator_api",
      simulatorEndpoint: "/api/bg3/runWithPriority",
      simulatorBuildName,
      usingLocalMockBuildJson,
      localMockBuildJsonPath: usingLocalMockBuildJson
        ? BG3_LOCAL_MOCK_BUILD_JSON_PATH
        : null,
      errorMessage: message,
      requestToFailureMs: failedAtMs - requestedAtMs,
      buildSnapshotSummary: getSnapshotSummary(currentEditorSnapshot),
      buildSnapshotHash,
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      partySnapshotSummary,
      partyVisualProfile,
      partyGaps: partyCoverageForLogging.partyGaps,
    };

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "evaluation_failed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: "main-data-circle",
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: focusKey,
      taskPhase: "evaluation",
      payload: failedPayload,
    });

    logStudyEvent({
      eventCategory: "evaluation",
      eventType: "simulator_request_failed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: "main-data-circle",
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: focusKey,
      taskPhase: "evaluation",
      payload: failedPayload,
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
    setDataCircleFocus(null);
    latestVisualizationFocusRef.current = null;
    firstPostEvaluationEditLoggedRef.current = false;
    setHasEvaluatedBuild(false);
  }

  function handleSaveNewBuild() {
    const savedBuild = createSavedBuild(currentEditorSnapshot);

    logStudyEvent({
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      eventCategory: "build_lifecycle",
      eventType: "build_saved",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: activeTab,
      payload: {
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        snapshot: savedBuild.snapshot,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
        snapshotHash: createStableHash(savedBuild.snapshot, "build"),
        parentBuildId: focusedSavedBuild?.id ?? null,
        parentBuildLabel: focusedSavedBuild?.label ?? null,
        parentSnapshotHash: focusedSavedBuild?.snapshot
          ? createStableHash(focusedSavedBuild.snapshot, "build")
          : null,
        createdFromPartySlotIndex: editingPartySlotIndex,
        createdFromPartySlotLabel: activePartyMemberLabel,
        focusToActionContext: createFocusToActionContext(Date.now()),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      eventCategory: "build_lifecycle",
      eventType: "build_overwritten",
      activeBuildId: updatedBuild.id,
      activeBuildLabel: updatedBuild.label,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeView: activeTab,
      payload: {
        savedBuildId: updatedBuild.id,
        label: updatedBuild.label,
        previousSnapshotSummary: getSnapshotSummary(existingBuild.snapshot),
        previousSnapshotHash: createStableHash(existingBuild.snapshot, "build"),
        nextSnapshot: updatedBuild.snapshot,
        nextSnapshotSummary: getSnapshotSummary(updatedBuild.snapshot),
        nextSnapshotHash: createStableHash(updatedBuild.snapshot, "build"),
        parentBuildId: existingBuild.id,
        parentBuildLabel: existingBuild.label,
        editDistanceSource: "overwrite_saved_build",
        focusToActionContext: createFocusToActionContext(Date.now()),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      payload: {
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        previousFocusedLabel: focusedLabel,
        previousPartySnapshotHash: partySnapshotSummary.partySnapshotHash,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
        snapshotHash: createStableHash(savedBuild.snapshot, "build"),
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
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      eventCategory: "party",
      eventType: "party_slot_assigned",
      activeBuildId: savedBuild.id,
      activeBuildLabel: savedBuild.label,
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: getPartyMemberLabel(slotIndex),
      activeView: "saved-builds-panel",
      payload: {
        previousFocusSource: focusedDataCircle,
        nextFocusSource: "editor",
        focusTarget: "party-slot",
        slotIndex,
        slotNumber: slotIndex + 1,
        savedBuildId: savedBuild.id,
        label: savedBuild.label,
        snapshotSummary: getSnapshotSummary(savedBuild.snapshot),
        snapshotHash: createStableHash(savedBuild.snapshot, "build"),
        previousPartySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
      },
    });

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? savedBuild : slot))
    );
  }

  function handleEditPartySlot(slotIndex: number) {
    const selectedSlotBuild = partySlots[slotIndex];

if (!selectedSlotBuild) {
  logBlockedUiAction(
    "party-slot-focus",
    `party-slot-${slotIndex + 1}`,
    "party_slot_empty",
    {
      slotIndex,
      slotNumber: slotIndex + 1,
    }
  );

  return;
}

if (isAggregateFocused) {
  logBlockedUiAction(
    "party-slot-focus",
    `party-slot-${slotIndex + 1}`,
    "aggregate_view_is_readonly",
    {
      slotIndex,
      slotNumber: slotIndex + 1,
      targetBuildId: selectedSlotBuild.id,
      targetBuildLabel: selectedSlotBuild.label,
    }
  );

  return;
}

    const outgoingFocusedBuild = getCurrentEditorAsSavedBuild();

    logStudyEvent({
      eventCategory: "party",
      eventType: "party_focus_changed",
      activeBuildId: selectedSlotBuild.id,
      activeBuildLabel: selectedSlotBuild.label,
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: getPartyMemberLabel(slotIndex),
      activeView: "party-dock",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        incomingBuildId: selectedSlotBuild.id,
        incomingBuildLabel: selectedSlotBuild.label,
        incomingSnapshotHash: createStableHash(
          selectedSlotBuild.snapshot,
          "build"
        ),
        outgoingBuildId: outgoingFocusedBuild.id,
        outgoingBuildLabel: outgoingFocusedBuild.label,
        outgoingSnapshotHash: createStableHash(
          outgoingFocusedBuild.snapshot,
          "build"
        ),
        interactionMode: "swap_focused_build_with_party_slot",
        previousPartySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
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
  if (isAggregateFocused) return;

  logStudyEvent({
      eventCategory: "party",
      eventType: "party_focus_changed",
      activeView: "focus-selector",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeFocusSource: "aggregate",
      payload: {
        previousFocusSource: focusedDataCircle,
        nextFocusSource: "aggregate",
        focusTarget: "aggregate",
        focusedBuildSummary: getSnapshotSummary(currentEditorSnapshot),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partySnapshotSummary,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
        redundancyScore: partyCoverageForLogging.redundancyScore,
        assignedPartySlots: partySlots.map((slot, index) => ({
          slotIndex: index,
          slotNumber: index + 1,
          savedBuildId: slot?.id ?? null,
          label: slot?.label ?? null,
          snapshotHash: slot?.snapshot
            ? createStableHash(slot.snapshot, "build")
            : null,
        })),
      },
    });

    latestAggregateFocusRef.current = {
      focusedAtMs: Date.now(),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      partyGaps: partyCoverageForLogging.partyGaps,
      redundancyScore: partyCoverageForLogging.redundancyScore,
    };

    persistFocusedBuildIfSaved();
    setFocusedDataCircle("aggregate");
    setEditingPartySlotIndex(null);
    setDataCircleFocus(null);
    latestVisualizationFocusRef.current = null;
  }

function handleFocusCurrentEditor() {
  if (!isAggregateFocused && editingPartySlotIndex === null) return;

  logStudyEvent({
      eventCategory: "party",
      eventType: "party_focus_changed",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activeView: "focus-selector",
      activeFocusSource: "editor",
      payload: {
        previousFocusSource: focusedDataCircle,
        nextFocusSource: "editor",
        focusTarget: "editable",
        focusedLabel,
        snapshotSummary: getSnapshotSummary(currentEditorSnapshot),
        snapshotHash: createStableHash(currentEditorSnapshot, "build"),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      },
    });

    setFocusedDataCircle("editor");
    setDataCircleFocus(null);
    latestVisualizationFocusRef.current = null;
  }

function handleClearPartySlot(slotIndex: number) {
  const clearedSlot = partySlots[slotIndex];

  if (!clearedSlot) {
    logBlockedUiAction(
      "party-slot-clear",
      `party-slot-${slotIndex + 1}`,
      "party_slot_already_empty",
      {
        slotIndex,
        slotNumber: slotIndex + 1,
      }
    );

    return;
  }

  logStudyEvent({
      eventCategory: "party",
      eventType: "party_slot_cleared",
      activeFocusSource: focusedDataCircle,
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      activeBuildId: clearedSlot?.id,
      activeBuildLabel: clearedSlot?.label,
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: getPartyMemberLabel(slotIndex),
      activeView: "saved-builds-panel",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        clearedBuildId: clearedSlot?.id ?? null,
        clearedBuildLabel: clearedSlot?.label ?? null,
        clearedSnapshotHash: clearedSlot?.snapshot
          ? createStableHash(clearedSlot.snapshot, "build")
          : null,
        previousPartySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
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
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
        snapshotHash: deletedBuild?.snapshot
          ? createStableHash(deletedBuild.snapshot, "build")
          : null,
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
        snapshotHash: createStableHash(historyEntry.snapshot, "build"),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
      activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
        snapshotHash: createStableHash(restoredBuild.snapshot, "build"),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
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
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      eventCategory: "party",
      eventType: "party_slot_assigned",
      activeBuildId: restoredBuild.id,
      activeBuildLabel: restoredBuild.label,
      activePartyMemberIndex: slotIndex,
      activePartyMemberLabel: getPartyMemberLabel(slotIndex),
      activeView: "process-spiral",
      payload: {
        slotIndex,
        slotNumber: slotIndex + 1,
        restoredBuildId: restoredBuild.id,
        restoredLabel: restoredBuild.label,
        sourceHistoryEntryId: historyEntry.id,
        sourceSavedBuildId: historyEntry.savedBuildId,
        snapshotSummary: getSnapshotSummary(restoredBuild.snapshot),
        snapshotHash: createStableHash(restoredBuild.snapshot, "build"),
        previousPartySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
      },
    });

    setSavedBuilds((current) => [restoredBuild, ...current]);

    setPartySlots((current) =>
      current.map((slot, index) => (index === slotIndex ? restoredBuild : slot))
    );

    appendBuildHistory(restoredBuild, "created");
  }

  function handleSubmitFinalParty() {
    logStudyEvent({
      eventCategory: "task",
      eventType: "final_party_submitted",
      activeView: "study-logging-panel",
      activeBuildId: focusedSavedBuild?.id,
      activeBuildLabel: focusedLabel,
      activePartyMemberIndex: editingPartySlotIndex,
      activePartyMemberLabel,
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
      taskPhase: "submission",
      payload: {
        focusedBuild: currentEditorSnapshot,
        focusedBuildSummary: getSnapshotSummary(currentEditorSnapshot),
        focusedBuildHash: createStableHash(currentEditorSnapshot, "build"),
        partySlots: partySlots.map((slot, index) => ({
          slotIndex: index,
          slotNumber: index + 1,
          savedBuildId: slot?.id ?? null,
          label: slot?.label ?? null,
          snapshot: slot?.snapshot ?? null,
          snapshotHash: slot?.snapshot
            ? createStableHash(slot.snapshot, "build")
            : null,
          snapshotSummary: slot?.snapshot
            ? getSnapshotSummary(slot.snapshot)
            : null,
        })),
        partySnapshotHash: partySnapshotSummary.partySnapshotHash,
        partySnapshotSummary,
        partyVisualProfile,
        partyGaps: partyCoverageForLogging.partyGaps,
        redundancyScore: partyCoverageForLogging.redundancyScore,
        simulatorStatus,
        simulatorAverageDpr,
        simulatorDprRounds,
      },
    });
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
    <main className="workspace-page" data-study-region="workspace-page">
      <StudyHeatmapCapture
  activeView={heatmapActiveView}
  activeBuildId={focusedSavedBuild?.id ?? null}
  activeBuildLabel={focusedLabel}
  activePartyMemberIndex={editingPartySlotIndex}
  activePartyMemberLabel={activePartyMemberLabel}
  activeFocusSource={focusedDataCircle}
  activeVisualizationFocus={getDataCircleFocusKey(dataCircleFocus)}
  partySnapshotHash={partySnapshotSummary.partySnapshotHash}
/>
      <section
        className={`workspace-half planner-half ${
          isAggregateFocused ? "planner-half--readonly-focus" : ""
        } ${isProcessSpiralExpanded ? "planner-half--process-expanded" : ""}`}
        data-study-region="planner-half"
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
<header
  className="workspace-header workspace-header--compact"
  data-study-region="workspace-header"
>
  <div className="workspace-title-lockup">
    <div className="workspace-title-copy">
      <p>Baldur&apos;s Gate 3</p>
      <h1>Build Planner</h1>
    </div>
  </div>

<div
  className="workspace-header-actions"
  data-study-region="workspace-header-actions"
>
  <ToolTutorialOverlay
    activeView={heatmapActiveView}
    activeBuildLabel={focusedLabel}
    activeFocusSource={focusedDataCircle}
    partySnapshotHash={partySnapshotSummary.partySnapshotHash}
    onRequestTab={(tabId) => {
      if (!isAggregateFocused) {
        setActiveTab(tabId);
      }
    }}
    onRequestEditableFocus={() => {
      if (isAggregateFocused) {
        handleFocusCurrentEditor();
      }
    }}
  />

  <button
    className="new-blank-build-button"
    type="button"
    onClick={handleCreateNewBlankBuild}
    data-study-id="new-blank-build-button"
    title="Clear the editor and start a new build. Saved builds and party slots are preserved."
  >
    New blank build
  </button>

  <button
    className="evaluate-button"
    type="button"
    onClick={handleEvaluateBuild}
    aria-disabled={isAggregateFocused || simulatorStatus === "loading"}
    data-study-id="evaluate-build-button"
    title={
      isAggregateFocused
        ? "Aggregate is a read-only calculated preview."
        : "Evaluate the current editable build."
    }
  >
    {simulatorStatus === "loading"
      ? "Running Simulator..."
      : hasEvaluatedBuild
        ? "Re-simulate Build"
        : "Simulate Rotation & DPR"}
  </button>
</div>
            </header>

            <nav
              className="tab-bar"
              aria-label="Build creation sections"
              data-study-region="planner-tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "tab active" : "tab"}
onClick={() => {
  if (isAggregateFocused) {
    logBlockedUiAction(
      "planner-tab",
      `planner-tab-${tab.id}`,
      "aggregate_view_is_readonly",
      {
        attemptedTab: tab.id,
        currentTab: activeTab,
      }
    );

    return;
  }

  if (activeTab === tab.id) return;

  logStudyEvent({
    eventCategory: "navigation",
    eventType: "tab_changed",
    activeView: "build-planner",
    activeBuildId: focusedSavedBuild?.id,
    activeBuildLabel: focusedLabel,
    activePartyMemberIndex: editingPartySlotIndex,
    activePartyMemberLabel,
    activeFocusSource: focusedDataCircle,
activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    payload: {
      previousTab: activeTab,
      nextTab: tab.id,
      activeFocusSource: focusedDataCircle,
      activeVisualizationFocus: getDataCircleFocusKey(dataCircleFocus),
      partySnapshotHash: partySnapshotSummary.partySnapshotHash,
    },
  });

  setActiveTab(tab.id);
}}
                  type="button"
                  aria-disabled={isAggregateFocused}
                  data-study-id={`planner-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div
              className="planner-content-layout"
              data-study-region="planner-content-layout"
            >
              <aside
                className="summary-card summary-card--compact"
                data-study-region="current-build-summary"
              >
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
                  data-study-region="focus-selector"
                >
                  <div className="focus-selector-header">
                    <span>Focus Selector</span>
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
                      data-study-id="party-editable-focus"
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
                      data-study-id="party-aggregate-focus"
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
aria-disabled={!slot || isAggregateFocused}
                          data-study-id={`party-member-${index + 1}-focus`}
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
<SavedBuildsPanel
  currentSnapshot={currentEditorSnapshot}
  savedBuilds={savedBuilds}
  partySlots={partySlots}
  onSaveNew={handleSaveNewBuild}
  onOverwrite={handleOverwriteSavedBuild}
  onLoad={handleLoadSavedBuild}
  onLoadIntoPartySlot={handleLoadSavedBuildIntoPartySlot}
  onClearPartySlot={handleClearPartySlot}
  onClearCurrentBuild={handleCreateNewBlankBuild}
  onFocusCurrentBuild={handleFocusCurrentEditor}
  onDelete={handleDeleteSavedBuild}
  activeView="saved-builds-panel"
  activeBuildId={focusedSavedBuild?.id ?? null}
  activeBuildLabel={focusedLabel}
  activePartyMemberIndex={editingPartySlotIndex}
  activePartyMemberLabel={activePartyMemberLabel}
  activeFocusSource={focusedDataCircle}
  partySnapshotHash={partySnapshotSummary.partySnapshotHash}
/>

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
                  isPartyComplete={finalPartyReady}
                  getFinalPayload={() => {
                    handleSubmitFinalParty();

                    return {
                      finalPartyComplete: finalPartyReady,
                      finalPartySnapshotSummary: partySnapshotSummary,
                      finalPartyVisualProfile: partyVisualProfile,
                      finalPartyGaps: partyCoverageForLogging.partyGaps,
                      finalRedundancyScore: partyCoverageForLogging.redundancyScore,
                      simulatorStatus,
                      simulatorAverageDpr,
                      simulatorDprRounds,
                    };
                  }}
                  finalPartySnapshotSummary={partySnapshotSummary}
                  finalPartyVisualProfile={partyVisualProfile}
                  finalPartyGaps={partyCoverageForLogging.partyGaps}
                  finalRedundancyScore={partyCoverageForLogging.redundancyScore}
                />
              </aside>

              <section
                className={`main-panel ${
                  isAggregateFocused ? "main-panel--readonly-preview" : ""
                }`}
                aria-disabled={isAggregateFocused}
                data-study-region="build-editor-panel"
              >
                {isAggregateFocused ? (
                  <div className="main-panel-readonly-overlay">
                    Viewing Aggregate. Select Editable or a party member to edit.
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
                          nextSnapshotPatch: {
                            selectedSubrace: value,
                            selectedClassFeatureIds: [],
                            activeClassFeatureIds: [],
                          },
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
  activeView="spells-abilities-tab"
  activeBuildId={focusedSavedBuild?.id ?? null}
  activeBuildLabel={focusedLabel}
  activePartyMemberIndex={editingPartySlotIndex}
  activePartyMemberLabel={activePartyMemberLabel}
  activeFocusSource={focusedDataCircle}
  partySnapshotHash={partySnapshotSummary.partySnapshotHash}
/>
                )}
              </section>
            </div>
          </>
        )}
      </section>

      <section
        className="workspace-half visualisation-half visualisation-half--immersive"
        data-study-region="visualisation-half"
      >
        <div
          className={`visualisation-panel visualisation-panel--with-party-dock ${
            showPartyPlanner ? "" : "visualisation-panel--party-hidden"
          }`}
          data-study-region="visualisation-panel"
        >
          <button
            type="button"
            className={`party-dock-toggle ${
              showPartyPlanner ? "party-dock-toggle--active" : ""
            }`}
            data-study-id="party-dock-toggle"
            onClick={() => {
              const nextValue = !showPartyPlanner;

              logStudyEvent({
                eventCategory: "visualization",
                eventType: "party_planner_toggled",
                activeView: "visualisation-panel",
                activeBuildId: focusedSavedBuild?.id,
                activeBuildLabel: focusedLabel,
                activePartyMemberIndex: editingPartySlotIndex,
                activePartyMemberLabel,
                payload: {
                  previousValue: showPartyPlanner,
                  nextValue,
                  partySnapshotHash: partySnapshotSummary.partySnapshotHash,
                },
              });

              setShowPartyPlanner(nextValue);
            }}
          >
            {showPartyPlanner ? "Enlarge Focus Circle" : "Show party planner"}
          </button>

          <div
            className="main-data-circle-frame"
            data-study-region="main-data-circle-frame"
          >
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
  showDprLayer={true}
  visualizedItemsOverride={partyAggregateItems}
  activePartyMemberIndex={null}
  activePartyMemberLabel="Aggregate"
  partySnapshotHash={partySnapshotSummary.partySnapshotHash}
  setLinkedFocus={handleDataCircleFocusChange}
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
  showDprLayer={true}
  dprRounds={simulatorDprRounds}
  averageDpr={simulatorAverageDpr}
  dprStatus={simulatorStatus}
  dprError={simulatorError}
  activePartyMemberIndex={editingPartySlotIndex}
  activePartyMemberLabel={activePartyMemberLabel}
  partySnapshotHash={partySnapshotSummary.partySnapshotHash}
  setLinkedFocus={handleDataCircleFocusChange}
/>
            )}
          </div>

          {showPartyPlanner && (
            <section
              className="party-dock"
              aria-label="Party planner"
              data-study-region="party-dock"
            >
              <div className="party-dock-track">
                {partyDockItems.map((slot, index) => {
                  const isDisabled = index > 0 && !slot.savedBuild;

                  return (
                    <article
                      className={`party-node party-node--${slot.modifier} ${
                        slot.isFocused ? "party-node--focused" : ""
                      }`}
                      key={slot.fallbackLabel}
                      data-study-region={
                        index === 0 ? "party-aggregate-node" : "party-member-node"
                      }
                      data-study-id={
                        index === 0
                          ? "party-node-aggregate"
                          : `party-node-member-${index}`
                      }
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
                        aria-disabled={isDisabled}
                        data-study-id={
                          index === 0
                            ? "party-aggregate-focus-dock"
                            : `party-member-${index}-focus-dock`
                        }
title={
  isDisabled
    ? "Assign a saved build to this slot first."
    : index === 0
      ? "Focus combined party view"
      : `Swap focused build with ${slot.fallbackLabel}`
}
                      >
                        {slot.label}
                      </button>

                      <div
  className="party-node-orb-shell"
  data-study-region="party-node-orb-shell"
  data-study-id={
    index === 0 ? "party-orb-aggregate" : `party-orb-member-${index}`
  }
>
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
        activePartyMemberIndex={null}
        activePartyMemberLabel="Aggregate"
        partySnapshotHash={partySnapshotSummary.partySnapshotHash}
      />
    </div>
  ) : slot.savedBuild ? (
    <div className="party-node-circle">
      <DataCircle
        buildName={slot.savedBuild.snapshot.buildName}
        characterName={slot.savedBuild.snapshot.characterName}
        selectedClass={slot.savedBuild.snapshot.selectedClass}
        selectedSubclass={slot.savedBuild.snapshot.selectedSubclass}
        selectedLevel={slot.savedBuild.snapshot.selectedLevel}
        selectedSpellIds={slot.savedBuild.snapshot.selectedSpellIds}
        fixedClassFeatureIds={getFixedClassFeatureIdsForSnapshot(
          slot.savedBuild.snapshot
        )}
        selectedClassFeatureIds={
          slot.savedBuild.snapshot.selectedClassFeatureIds
        }
        activeClassFeatureIds={slot.savedBuild.snapshot.activeClassFeatureIds}
        showDprLayer={false}
        variant="party"
        activePartyMemberIndex={index - 1}
        activePartyMemberLabel={`Member ${index}`}
        partySnapshotHash={partySnapshotSummary.partySnapshotHash}
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
