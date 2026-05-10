import { useMemo } from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import {
  getSpellById,
  type AbilityRole,
  type BG3Spell,
} from "../data/bg3Spells";
import { mockDataCircleBuild, mockSelectedSpellIds } from "../data/mockDataCircle";
import "./DataCircle.css";

type DataCircleProps = {
  buildName: string;
  characterName: string;
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedSpellIds: string[];
};

type RangeBandKey = "self" | "melee" | "mid" | "long";

type DamageRingKey =
  | "Bludgeoning"
  | "Piercing"
  | "Slashing"
  | "Physical"
  | "Acid"
  | "Cold"
  | "Fire"
  | "Force"
  | "Lightning"
  | "Necrotic"
  | "Poison"
  | "Psychic"
  | "Radiant"
  | "Thunder"
  | "Variable";

type ResourceSectorKey =
  | "action"
  | "bonus-action"
  | "reaction"
  | "passive-conditional"
  | "concentration"
  | "cantrip"
  | "slot-1"
  | "slot-2"
  | "slot-3"
  | "slot-4"
  | "slot-5"
  | "slot-6"
  | "pact"
  | "short-rest"
  | "long-rest"
  | "class-resource";

const CX = 500;
const CY = 500;

const RANGE_BANDS: {
  key: RangeBandKey;
  label: string;
  innerRadius: number;
  outerRadius: number;
  labelRadius: number;
}[] = [
  { key: "self", label: "Self", innerRadius: 106, outerRadius: 128, labelRadius: 117 },
  { key: "melee", label: "Melee", innerRadius: 134, outerRadius: 156, labelRadius: 145 },
  { key: "mid", label: "Mid-range", innerRadius: 162, outerRadius: 184, labelRadius: 173 },
  { key: "long", label: "Long-range", innerRadius: 190, outerRadius: 212, labelRadius: 201 },
];

const RANGE_LABEL_ARC_START = -36;
const RANGE_LABEL_ARC_END = 36;

const DAMAGE_ROLE_KEYS: AbilityRole[] = ["single-target-damage", "area-damage"];

const UTILITY_ROLE_KEYS: AbilityRole[] = [
  "control",
  "support-buff",
  "defense-protection",
  "healing",
  "mobility-positioning",
  "narrative-interaction",
  "investigation-world-interaction",
  "summon",
];

const ROLE_VISUALS = {
  damage: {
    label: "Damage",
    shortLabel: "DMG",
    color: "#c66a3d",
    accentColor: "#ffb56f",
    glowColor: "#ff9a4f",
    lineColor: "rgba(255,190,118,0.5)",
  },
  utility: {
    label: "Utility",
    shortLabel: "UTL",
    color: "#3f9f8a",
    accentColor: "#8ae6c8",
    glowColor: "#7fe0c0",
    lineColor: "rgba(153,232,205,0.48)",
  },
};

const DAMAGE_TYPES: {
  key: DamageRingKey;
  short: string;
  label: string;
  color: string;
  glowColor: string;
}[] = [
  {
    key: "Bludgeoning",
    short: "BLD",
    label: "Bludgeoning",
    color: "#8c7863",
    glowColor: "#d3b488",
  },
  {
    key: "Piercing",
    short: "PRC",
    label: "Piercing",
    color: "#a48963",
    glowColor: "#e0bf8b",
  },
  {
    key: "Slashing",
    short: "SLS",
    label: "Slashing",
    color: "#b69568",
    glowColor: "#edc98a",
  },
  {
    key: "Physical",
    short: "PHY",
    label: "Physical",
    color: "#c3aa7c",
    glowColor: "#f0d49a",
  },
  {
    key: "Acid",
    short: "ACD",
    label: "Acid",
    color: "#8abf36",
    glowColor: "#b7f05a",
  },
  {
    key: "Cold",
    short: "CLD",
    label: "Cold",
    color: "#7bc9e8",
    glowColor: "#bdeeff",
  },
  {
    key: "Fire",
    short: "FIR",
    label: "Fire",
    color: "#db5a28",
    glowColor: "#ff9858",
  },
  {
    key: "Force",
    short: "FRC",
    label: "Force",
    color: "#c44b62",
    glowColor: "#ff8190",
  },
  {
    key: "Lightning",
    short: "LGT",
    label: "Lightning",
    color: "#d9c731",
    glowColor: "#fff072",
  },
  {
    key: "Necrotic",
    short: "NEC",
    label: "Necrotic",
    color: "#6e9b45",
    glowColor: "#a9d45d",
  },
  {
    key: "Poison",
    short: "POI",
    label: "Poison",
    color: "#4f8f35",
    glowColor: "#8fd85a",
  },
  {
    key: "Psychic",
    short: "PSY",
    label: "Psychic",
    color: "#b05ac4",
    glowColor: "#eaa4ff",
  },
  {
    key: "Radiant",
    short: "RAD",
    label: "Radiant",
    color: "#e4c956",
    glowColor: "#fff0a0",
  },
  {
    key: "Thunder",
    short: "THN",
    label: "Thunder",
    color: "#7377d0",
    glowColor: "#a9b0ff",
  },
  {
    key: "Variable",
    short: "VAR",
    label: "Variable",
    color: "#8d857a",
    glowColor: "#c8beb0",
  },
];

const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "action", short: "A", label: "Action", color: "#b47d3b" },
  { key: "bonus-action", short: "BA", label: "Bonus Action", color: "#c58e4c" },
  { key: "reaction", short: "R", label: "Reaction", color: "#d0a45a" },
  { key: "concentration", short: "CON", label: "Concentration", color: "#8567ad" },
  { key: "cantrip", short: "CAN", label: "Cantrip use", color: "#6c9fa4" },
  { key: "slot-1", short: "I", label: "Spell slot level 1", color: "#8f4d55" },
  { key: "slot-2", short: "II", label: "Spell slot level 2", color: "#a05a61" },
  { key: "slot-3", short: "III", label: "Spell slot level 3", color: "#b1686d" },
  { key: "slot-4", short: "IV", label: "Spell slot level 4", color: "#bf797b" },
  { key: "slot-5", short: "V", label: "Spell slot level 5", color: "#cc8b88" },
  { key: "slot-6", short: "VI", label: "Spell slot level 6", color: "#d89d95" },
  { key: "pact", short: "PACT", label: "Pact Magic slot use", color: "#935aa0" },
  { key: "short-rest", short: "SR", label: "Short-rest reliance", color: "#5aa087" },
  { key: "long-rest", short: "LR", label: "Long-rest reliance", color: "#7aa563" },
  { key: "class-resource", short: "CLS", label: "Class-specific pool reliance", color: "#5a80a0" },
  { key: "passive-conditional", short: "P/C", label: "Passive / conditional", color: "#9a774b" },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function describeDonutSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const safeEndAngle =
    endAngle - startAngle >= 360 ? startAngle + 359.999 : endAngle;

  const outerStart = polarToCartesian(cx, cy, outerRadius, safeEndAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, safeEndAngle);
  const largeArcFlag = safeEndAngle - startAngle > 180 ? 1 : 0;

  return [
    "M",
    outerStart.x,
    outerStart.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    outerEnd.x,
    outerEnd.y,
    "L",
    innerStart.x,
    innerStart.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    innerEnd.x,
    innerEnd.y,
    "Z",
  ].join(" ");
}

function describeTextArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y,
  ].join(" ");
}

function getOpacity(value: number, maxValue: number, minOpacity = 0.08, maxOpacity = 0.96) {
  if (value <= 0 || maxValue <= 0) return minOpacity;
  return minOpacity + (value / maxValue) * (maxOpacity - minOpacity);
}

function getSelectedSpells(selectedSpellIds: string[]): BG3Spell[] {
  return selectedSpellIds
    .map((id) => getSpellById(id))
    .filter((spell): spell is BG3Spell => Boolean(spell));
}

function getRangeDotAngles(count: number) {
  if (count <= 0) return [];

  const blockedArc = 78;
  const availableSweep = 360 - blockedArc;
  const startAngle = blockedArc / 2;
  const step = availableSweep / count;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + step * index + step / 2;
    return angle % 360;
  });
}

function getRangeBandIntensity(value: number, _maxValue: number) {
  if (value <= 0) {
    return {
      smokeOpacity: 0.022,
      inlayOpacity: 0.035,
      rimOpacity: 0.09,
      moteOpacity: 0,
      moteGlowOpacity: 0,
      moteRadius: 0,
    };
  }

  const ratio = Math.min(1, value / 14);
  const eased = Math.pow(ratio, 0.92);

  return {
    smokeOpacity: 0.025 + eased * 0.07,
    inlayOpacity: 0.045 + eased * 0.12,
    rimOpacity: 0.11 + eased * 0.22,
    moteOpacity: 0.38 + eased * 0.38,
    moteGlowOpacity: 0.035 + eased * 0.16,
    moteRadius: 3.25 + eased * 1.05,
  };
}

function getDamageLabelMode(label: string, sweep: number) {
  const fullLabelRequiredSweep = Math.max(26, label.length * 4.6);
  const shortLabelRequiredSweep = 10;

  if (sweep >= fullLabelRequiredSweep) return "full";
  if (sweep >= shortLabelRequiredSweep) return "short";
  return "hidden";
}

function getArcTextTransform(cx: number, cy: number, radius: number, angle: number) {
  const point = polarToCartesian(cx, cy, radius, angle);
  const normalized = normalizeAngle(angle);
  const rotation = normalized > 90 && normalized < 270 ? angle + 180 : angle;

  return `translate(${point.x} ${point.y}) rotate(${rotation})`;
}

function getSubcategoryBoundaries(
  keys: AbilityRole[],
  counts: Record<AbilityRole, number>,
  startAngle: number,
  sweep: number,
  total: number
) {
  if (total <= 0 || sweep <= 0) return [];

  let accumulated = 0;

  return keys.flatMap((key, index) => {
    accumulated += counts[key];

    if (index >= keys.length - 1 || accumulated <= 0 || accumulated >= total) {
      return [];
    }

    return [startAngle + (accumulated / total) * sweep];
  });
}

function renderDamageTextureMarks(
  type: (typeof DAMAGE_TYPES)[number],
  startAngle: number,
  endAngle: number,
  value: number
) {
  const sweep = Math.max(0, endAngle - startAngle);
  const midAngle = startAngle + sweep / 2;
  const safeCount = Math.min(6, Math.max(2, value + 1));
  const sampleAngle = (index: number, count: number) =>
    startAngle + sweep * ((index + 0.5) / count);

  const threadLines = Array.from({ length: Math.min(3, safeCount) }, (_, index) => {
    const angle = sampleAngle(index, Math.min(3, safeCount));
    const inner = polarToCartesian(CX, CY, 300, angle);
    const outer = polarToCartesian(CX, CY, 328, angle);

    return (
      <line
        key={`${type.key}-thread-${index}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={type.glowColor}
        strokeOpacity="0.18"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    );
  });

  if (type.key === "Poison" || type.key === "Acid") {
    return (
      <>
        {threadLines}
        {Array.from({ length: safeCount }, (_, index) => {
          const angle = sampleAngle(index, safeCount);
          const radius = index % 2 === 0 ? 304 : 324;
          const point = polarToCartesian(CX, CY, radius, angle);

          return (
            <circle
              key={`${type.key}-bubble-${index}`}
              cx={point.x}
              cy={point.y}
              r={1.8 + (index % 3) * 0.55}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.52"
              strokeWidth="1"
            />
          );
        })}
      </>
    );
  }

  if (type.key === "Lightning" || type.key === "Thunder") {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(4, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(4, safeCount));
          const p1 = polarToCartesian(CX, CY, 300, angle - 1.2);
          const p2 = polarToCartesian(CX, CY, 314, angle + 1.4);
          const p3 = polarToCartesian(CX, CY, 328, angle - 0.8);

          return (
            <polyline
              key={`${type.key}-bolt-${index}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.55"
              strokeWidth="1.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </>
    );
  }

  if (type.key === "Cold" || type.key === "Radiant") {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const point = polarToCartesian(CX, CY, index % 2 === 0 ? 306 : 322, angle);

          return (
            <g
              key={`${type.key}-star-${index}`}
              transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
              opacity="0.52"
            >
              <line x1="-3" y1="0" x2="3" y2="0" stroke={type.glowColor} strokeWidth="0.9" strokeLinecap="round" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke={type.glowColor} strokeWidth="0.9" strokeLinecap="round" />
            </g>
          );
        })}
      </>
    );
  }

  if (type.key === "Fire") {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const start = polarToCartesian(CX, CY, 302, angle - 0.9);
          const end = polarToCartesian(CX, CY, 327, angle + 0.9);

          return (
            <path
              key={`${type.key}-ember-${index}`}
              d={`M ${start.x} ${start.y} Q ${CX} ${CY} ${end.x} ${end.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.42"
              strokeWidth="1.05"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  }

  if (type.key === "Necrotic" || type.key === "Psychic" || type.key === "Force") {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const point = polarToCartesian(CX, CY, index % 2 === 0 ? 306 : 323, angle);

          return (
            <circle
              key={`${type.key}-orb-${index}`}
              cx={point.x}
              cy={point.y}
              r="2.2"
              fill={type.glowColor}
              fillOpacity="0.34"
              stroke={type.glowColor}
              strokeOpacity="0.34"
              strokeWidth="1.1"
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      {threadLines}
      {Array.from({ length: Math.min(4, safeCount) }, (_, index) => {
        const angle = sampleAngle(index, Math.min(4, safeCount));
        const inner = polarToCartesian(CX, CY, 302, angle - 1.8);
        const outer = polarToCartesian(CX, CY, 326, angle + 1.8);

        return (
          <line
            key={`${type.key}-physical-cut-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={type.glowColor}
            strokeOpacity="0.38"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

export default function DataCircle({
  buildName,
  characterName,
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedSpellIds,
}: DataCircleProps) {
  const isUsingMockData = selectedSpellIds.length === 0;
  const displaySpellIds = isUsingMockData ? mockSelectedSpellIds : selectedSpellIds;

  const displayBuildName = isUsingMockData ? mockDataCircleBuild.buildName : buildName;
  const displayCharacterName = isUsingMockData
    ? mockDataCircleBuild.characterName
    : characterName;
  const displayClass = isUsingMockData ? mockDataCircleBuild.selectedClass : selectedClass;
  const displaySubclass = isUsingMockData
    ? mockDataCircleBuild.selectedSubclass
    : selectedSubclass;
  const displayLevel = isUsingMockData ? mockDataCircleBuild.selectedLevel : selectedLevel;

  const selectedSpells = useMemo(
    () => getSelectedSpells(displaySpellIds),
    [displaySpellIds]
  );

  const buildLabel = displayBuildName.trim() || "Untitled Build";
  const characterLabel = displayCharacterName.trim();
  const archetypeLabel = displaySubclass || displayClass || "Unassigned";
  const spellCount = selectedSpells.length;

  const rangeCounts = useMemo(() => {
    const counts: Record<RangeBandKey, number> = {
      self: 0,
      melee: 0,
      mid: 0,
      long: 0,
    };

    selectedSpells.forEach((spell) => {
      switch (spell.range.category) {
        case "self":
          counts.self += 1;
          break;
        case "melee":
        case "weapon-range":
          counts.melee += 1;
          break;
        case "mid":
          counts.mid += 1;
          break;
        case "long":
          counts.long += 1;
          break;
      }
    });

    return counts;
  }, [selectedSpells]);

  const roleData = useMemo(() => {
    const counts: Record<AbilityRole, number> = {
      "single-target-damage": 0,
      "area-damage": 0,
      control: 0,
      "support-buff": 0,
      "defense-protection": 0,
      healing: 0,
      "mobility-positioning": 0,
      "narrative-interaction": 0,
      "investigation-world-interaction": 0,
      summon: 0,
    };

    selectedSpells.forEach((spell) => {
      spell.roles.forEach((role) => {
        counts[role] += 1;
      });
    });

    const damageTotal = DAMAGE_ROLE_KEYS.reduce((sum, key) => sum + counts[key], 0);
    const utilityTotal = UTILITY_ROLE_KEYS.reduce((sum, key) => sum + counts[key], 0);
    const total = damageTotal + utilityTotal;

    return { counts, damageTotal, utilityTotal, total };
  }, [selectedSpells]);

  const damageTypeCounts = useMemo(() => {
    const counts: Record<DamageRingKey, number> = {
      Bludgeoning: 0,
      Piercing: 0,
      Slashing: 0,
      Physical: 0,
      Acid: 0,
      Cold: 0,
      Fire: 0,
      Force: 0,
      Lightning: 0,
      Necrotic: 0,
      Poison: 0,
      Psychic: 0,
      Radiant: 0,
      Thunder: 0,
      Variable: 0,
    };

    selectedSpells.forEach((spell) => {
      spell.damageTypes.forEach((type) => {
        if (type === "Weapon" || type === "Physical") {
          counts.Physical += 1;
        } else if (type in counts) {
          counts[type as DamageRingKey] += 1;
        }
      });
    });

    return counts;
  }, [selectedSpells]);

  const resourceCounts = useMemo(() => {
    const counts: Record<ResourceSectorKey, number> = {
      action: 0,
      "bonus-action": 0,
      reaction: 0,
      "passive-conditional": 0,
      concentration: 0,
      cantrip: 0,
      "slot-1": 0,
      "slot-2": 0,
      "slot-3": 0,
      "slot-4": 0,
      "slot-5": 0,
      "slot-6": 0,
      pact: 0,
      "short-rest": 0,
      "long-rest": 0,
      "class-resource": 0,
    };

    selectedSpells.forEach((spell) => {
      if (spell.costs.actions.includes("action")) counts.action += 1;
      if (spell.costs.actions.includes("bonus-action")) counts["bonus-action"] += 1;
      if (spell.costs.actions.includes("reaction")) counts.reaction += 1;

      if (
        spell.costs.actions.includes("passive") ||
        spell.costs.actions.includes("conditional")
      ) {
        counts["passive-conditional"] += 1;
      }

      if (spell.costs.requiresConcentration) counts.concentration += 1;
      if (spell.rank === 0 || spell.costs.resources.includes("cantrip")) {
        counts.cantrip += 1;
      }

      if (
        spell.costs.resources.includes("spell-slot") &&
        spell.costs.spellSlotLevel &&
        spell.costs.spellSlotLevel >= 1 &&
        spell.costs.spellSlotLevel <= 6
      ) {
        counts[`slot-${spell.costs.spellSlotLevel}` as ResourceSectorKey] += 1;
      }

      if (spell.costs.resources.includes("pact-magic-slot")) counts.pact += 1;
      if (spell.costs.resources.includes("short-rest")) counts["short-rest"] += 1;
      if (spell.costs.resources.includes("long-rest")) counts["long-rest"] += 1;
      if (spell.costs.resources.includes("class-resource")) counts["class-resource"] += 1;
    });

    return counts;
  }, [selectedSpells]);

  const maxRangeCount = Math.max(...Object.values(rangeCounts), 1);
  const maxResourceCount = Math.max(...Object.values(resourceCounts), 1);

  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const roleSegments =
    roleData.total > 0
      ? [
          {
            key: "damage" as const,
            ...ROLE_VISUALS.damage,
            value: roleData.damageTotal,
            startAngle: roleStartAngle,
            endAngle: roleStartAngle + clampedDamageAngle,
            subKeys: DAMAGE_ROLE_KEYS,
          },
          {
            key: "utility" as const,
            ...ROLE_VISUALS.utility,
            value: roleData.utilityTotal,
            startAngle: utilityStartAngle,
            endAngle: roleStartAngle + 360,
            subKeys: UTILITY_ROLE_KEYS,
          },
        ]
      : [
          {
            key: "damage" as const,
            ...ROLE_VISUALS.damage,
            value: 0,
            startAngle: -90,
            endAngle: 90,
            subKeys: DAMAGE_ROLE_KEYS,
          },
          {
            key: "utility" as const,
            ...ROLE_VISUALS.utility,
            value: 0,
            startAngle: 90,
            endAngle: 270,
            subKeys: UTILITY_ROLE_KEYS,
          },
        ];

  return (
    <div className="data-circle-panel">
      <div className="data-circle-stage">
        <svg
          viewBox="0 0 1000 1000"
          className="data-circle-svg"
          role="img"
          aria-label="Overview Data Circle visualization"
        >
          <defs>
            <radialGradient id="arcaneBackground" cx="50%" cy="50%" r="58%">
              <stop offset="0%" stopColor="rgba(111, 70, 122, 0.13)" />
              <stop offset="42%" stopColor="rgba(29, 21, 32, 0.76)" />
              <stop offset="76%" stopColor="rgba(10, 8, 10, 0.96)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <radialGradient id="innerVellumGradient" cx="50%" cy="44%" r="58%">
              <stop offset="0%" stopColor="rgba(82, 54, 88, 0.32)" />
              <stop offset="58%" stopColor="rgba(24, 17, 27, 0.86)" />
              <stop offset="100%" stopColor="rgba(7, 5, 8, 0.98)" />
            </radialGradient>

            <radialGradient id="sealGradient" cx="50%" cy="42%" r="70%">
              <stop offset="0%" stopColor="#e9c469" />
              <stop offset="42%" stopColor="#9b672d" />
              <stop offset="78%" stopColor="#3b2613" />
              <stop offset="100%" stopColor="#15100c" />
            </radialGradient>

            <radialGradient id="moteGradient" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#fff9de" />
              <stop offset="34%" stopColor="#d6b86a" />
              <stop offset="72%" stopColor="#7f4a96" />
              <stop offset="100%" stopColor="#251631" />
            </radialGradient>

            <filter id="arcaneSoftGlow">
              <feGaussianBlur stdDeviation="4.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0.95 0 0 0 0.12
                  0 0.72 0 0 0.06
                  0 0 0.85 0 0.16
                  0 0 0 0.48 0
                "
                result="warmArcaneGlow"
              />
              <feMerge>
                <feMergeNode in="warmArcaneGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="moteGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0.95 0 0 0 0.14
                  0 0.72 0 0 0.08
                  0 0 0.88 0 0.18
                  0 0 0 0.62 0
                "
                result="moteGlowColor"
              />
              <feMerge>
                <feMergeNode in="moteGlowColor" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="damageSpellGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5.4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  1.00 0 0 0 0.08
                  0 0.86 0 0 0.06
                  0 0 0.88 0 0.10
                  0 0 0 0.56 0
                "
                result="coloredGlow"
              />
              <feMerge>
                <feMergeNode in="coloredGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="sigilGlow">
              <feGaussianBlur stdDeviation="4.8" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0.90 0 0 0 0.12
                  0 0.72 0 0 0.07
                  0 0 0.64 0 0.08
                  0 0 0 0.42 0
                "
                result="sigilGlowColor"
              />
              <feMerge>
                <feMergeNode in="sigilGlowColor" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="engravedNoise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.92"
                numOctaves="2"
                seed="27"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values="
                  0 0 0 0 0.68
                  0 0 0 0 0.55
                  0 0 0 0 0.82
                  0 0 0 0.04 0
                "
                result="softNoise"
              />
              <feBlend in="SourceGraphic" in2="softNoise" mode="screen" />
            </filter>


            <clipPath id="innerOrreryClip">
              <circle cx={CX} cy={CY} r="216" />
            </clipPath>

            {RANGE_BANDS.map((band) => (
              <path
                key={`range-label-path-${band.key}`}
                id={`rangeLabelPath-${band.key}`}
                d={describeTextArc(
                  CX,
                  CY,
                  band.labelRadius,
                  RANGE_LABEL_ARC_START,
                  RANGE_LABEL_ARC_END
                )}
              />
            ))}

            <path id="rangeTitlePath" d={describeTextArc(CX, CY, 230, -50, 50)} />
            <path id="roleTitlePath" d={describeTextArc(CX, CY, 284, -50, 50)} />
            <path id="damageTitlePath" d={describeTextArc(CX, CY, 350, -52, 52)} />
            <path id="resourceTitlePath" d={describeTextArc(CX, CY, 406, -56, 56)} />
          </defs>

          <circle cx={CX} cy={CY} r={480} fill="url(#arcaneBackground)" />

          <circle
            cx={CX}
            cy={CY}
            r={470}
            fill="none"
            stroke="rgba(214,174,103,0.18)"
            strokeWidth="1.6"
          />

          <circle
            cx={CX}
            cy={CY}
            r={452}
            fill="none"
            stroke="rgba(214,174,103,0.08)"
            strokeWidth="1"
          />

          {Array.from({ length: 56 }, (_, index) => {
            const angle = index * (360 / 56);
            const outer = polarToCartesian(CX, CY, 468, angle);
            const inner = polarToCartesian(CX, CY, index % 4 === 0 ? 458 : 462, angle);

            return (
              <line
                key={`outer-rune-tick-${index}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(218,178,104,0.18)"
                strokeWidth={index % 4 === 0 ? 1.25 : 0.65}
              />
            );
          })}


          {RESOURCE_SECTORS.map((sector, index) => {
            const sectorAngle = 360 / RESOURCE_SECTORS.length;
            const angle = -180 + index * sectorAngle + sectorAngle / 2;
            const value = resourceCounts[sector.key];
            const ratio = value <= 0 ? 0 : value / maxResourceCount;
            const height = value <= 0 ? 17 : 24 + ratio * 66;
            const width = 18;
            const baseRadius = 382;
            const center = polarToCartesian(CX, CY, baseRadius + height / 2, angle);
            const capOpacity = value <= 0 ? 0.16 : 0.44 + ratio * 0.34;

            return (
              <g
                key={sector.key}
                transform={`translate(${center.x} ${center.y}) rotate(${angle})`}
              >
                <rect
                  x={-width / 2}
                  y={-height / 2}
                  width={width}
                  height={height}
                  rx="4"
                  fill="rgba(16,12,13,0.88)"
                  stroke="rgba(219,178,105,0.25)"
                  strokeWidth="1"
                />

                <rect
                  x={-width / 2 + 2}
                  y={-height / 2 + 2}
                  width={width - 4}
                  height={height - 4}
                  rx="3"
                  fill={sector.color}
                  fillOpacity={getOpacity(value, maxResourceCount, 0.12, 0.72)}
                />

                <rect
                  x={-width / 2 + 2}
                  y={-height / 2 + 2}
                  width={width - 4}
                  height={Math.max(4, height * 0.16)}
                  rx="3"
                  fill="rgba(255,226,165,0.52)"
                  fillOpacity={capOpacity}
                />
              </g>
            );
          })}

          <g className="data-circle-damage-spellwheel">
            <circle
              cx={CX}
              cy={CY}
              r={314}
              fill="none"
              stroke="rgba(6,5,7,0.98)"
              strokeWidth="52"
            />

            <circle
              cx={CX}
              cy={CY}
              r={340}
              fill="none"
              stroke="rgba(230,188,112,0.18)"
              strokeWidth="1.1"
            />

            <circle
              cx={CX}
              cy={CY}
              r={288}
              fill="none"
              stroke="rgba(230,188,112,0.14)"
              strokeWidth="1"
            />

            <circle
              cx={CX}
              cy={CY}
              r={314}
              fill="none"
              stroke="rgba(255,232,180,0.04)"
              strokeWidth="34"
              strokeDasharray="1 11"
            />

            {damageTypeTotal > 0
              ? (() => {
                  let currentAngle = -90;

                  return DAMAGE_TYPES.map((type) => {
                    const value = damageTypeCounts[type.key];

                    if (value <= 0) {
                      return null;
                    }

                    const sweep = (value / damageTypeTotal) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + sweep;
                    currentAngle = endAngle;

                    const segmentGap = Math.min(1.8, sweep * 0.13);
                    const visualStartAngle = startAngle + segmentGap;
                    const visualEndAngle = endAngle - segmentGap;
                    const midAngle = startAngle + sweep / 2;
                    const labelMode = getDamageLabelMode(type.label, sweep);
                    const labelText =
                      labelMode === "full"
                        ? type.label.toUpperCase()
                        : labelMode === "short"
                          ? type.short
                          : "";

                    return (
                      <g key={type.key}>
                        <path
                          d={describeTextArc(
                            CX,
                            CY,
                            314,
                            visualStartAngle,
                            visualEndAngle
                          )}
                          fill="none"
                          stroke={type.glowColor}
                          strokeOpacity="0.16"
                          strokeWidth="52"
                          strokeLinecap="butt"
                          filter="url(#elementalBloom)"
                        />

                        <path
                          d={describeDonutSegment(
                            CX,
                            CY,
                            292,
                            336,
                            visualStartAngle,
                            visualEndAngle
                          )}
                          fill={type.color}
                          fillOpacity="0.48"
                          stroke={type.glowColor}
                          strokeOpacity="0.42"
                          strokeWidth="1.05"
                        />

                        <path
                          d={describeDonutSegment(
                            CX,
                            CY,
                            303,
                            325,
                            visualStartAngle + 0.8,
                            visualEndAngle - 0.8
                          )}
                          fill="rgba(7,5,8,0.42)"
                          stroke="rgba(255,242,213,0.1)"
                          strokeWidth="0.7"
                        />

                        <path
                          d={describeTextArc(
                            CX,
                            CY,
                            314,
                            visualStartAngle + 1.2,
                            visualEndAngle - 1.2
                          )}
                          fill="none"
                          stroke={type.glowColor}
                          strokeOpacity="0.3"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />

                        {renderDamageTextureMarks(type, visualStartAngle, visualEndAngle, value)}

                        {labelMode !== "hidden" ? (
                          <text
                            transform={getArcTextTransform(CX, CY, 314, midAngle)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={labelMode === "full" ? 7.4 : 8.3}
                            fontWeight="900"
                            letterSpacing={labelMode === "full" ? "0.08em" : "0.12em"}
                            fill="rgba(255,244,218,0.92)"
                            paintOrder="stroke"
                            stroke="rgba(4,3,5,0.9)"
                            strokeWidth="2.4"
                            filter="url(#fineInkShadow)"
                          >
                            {labelText}
                          </text>
                        ) : null}
                      </g>
                    );
                  });
                })()
              : (
                <circle
                  cx={CX}
                  cy={CY}
                  r={314}
                  fill="none"
                  stroke="rgba(230,188,112,0.1)"
                  strokeWidth="34"
                  strokeDasharray="2 12"
                />
              )}
          </g>

          <g className="data-circle-role-sigil">
            <circle
              cx={CX}
              cy={CY}
              r={252}
              fill="none"
              stroke="rgba(6,5,7,0.98)"
              strokeWidth="44"
            />

            <circle
              cx={CX}
              cy={CY}
              r={274}
              fill="none"
              stroke="rgba(230,188,112,0.18)"
              strokeWidth="1.1"
            />

            <circle
              cx={CX}
              cy={CY}
              r={230}
              fill="none"
              stroke="rgba(230,188,112,0.15)"
              strokeWidth="1"
            />

            {roleSegments.map((segment) => {
              const sweep = segment.endAngle - segment.startAngle;

              if (sweep <= 0.2 || (roleData.total > 0 && segment.value <= 0)) {
                return null;
              }

              const visualStartAngle = segment.startAngle + 1.25;
              const visualEndAngle = segment.endAngle - 1.25;
              const midAngle = segment.startAngle + sweep / 2;
              const percentage = roleData.total > 0 ? Math.round((segment.value / roleData.total) * 100) : 50;
              const boundaries = getSubcategoryBoundaries(
                segment.subKeys,
                roleData.counts,
                segment.startAngle,
                sweep,
                segment.value
              );

              return (
                <g key={segment.key}>
                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      252,
                      visualStartAngle,
                      visualEndAngle
                    )}
                    fill="none"
                    stroke={segment.glowColor}
                    strokeOpacity={roleData.total > 0 ? 0.13 : 0.05}
                    strokeWidth="48"
                    strokeLinecap="butt"
                    filter="url(#elementalBloom)"
                  />

                  <path
                    d={describeDonutSegment(
                      CX,
                      CY,
                      234,
                      270,
                      visualStartAngle,
                      visualEndAngle
                    )}
                    fill={segment.color}
                    fillOpacity={roleData.total > 0 ? 0.56 : 0.2}
                    stroke={segment.accentColor}
                    strokeOpacity={roleData.total > 0 ? 0.34 : 0.12}
                    strokeWidth="1"
                  />

                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      252,
                      visualStartAngle + 1,
                      visualEndAngle - 1
                    )}
                    fill="none"
                    stroke={segment.accentColor}
                    strokeOpacity="0.24"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      252,
                      visualStartAngle + 2,
                      visualEndAngle - 2
                    )}
                    fill="none"
                    stroke="rgba(255,238,199,0.1)"
                    strokeWidth="16"
                    strokeDasharray="1 12"
                    strokeLinecap="round"
                  />

                  {boundaries.map((angle) => {
                    const inner = polarToCartesian(CX, CY, 234, angle);
                    const outer = polarToCartesian(CX, CY, 270, angle);

                    return (
                      <line
                        key={`${segment.key}-subcategory-${angle}`}
                        x1={inner.x}
                        y1={inner.y}
                        x2={outer.x}
                        y2={outer.y}
                        stroke={segment.lineColor}
                        strokeOpacity="0.5"
                        strokeWidth="1.05"
                      />
                    );
                  })}

                  {boundaries.map((angle) => {
                    const point = polarToCartesian(CX, CY, 252, angle);

                    return (
                      <circle
                        key={`${segment.key}-subcategory-dot-${angle}`}
                        cx={point.x}
                        cy={point.y}
                        r="2.1"
                        fill={segment.accentColor}
                        fillOpacity="0.52"
                        stroke="rgba(5,4,6,0.9)"
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  <g transform={getArcTextTransform(CX, CY, 252, midAngle)}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8.6"
                      fontWeight="950"
                      letterSpacing="0.13em"
                      fill="rgba(255,244,218,0.94)"
                      paintOrder="stroke"
                      stroke="rgba(4,3,5,0.88)"
                      strokeWidth="2.4"
                    >
                      {sweep > 35 ? segment.label.toUpperCase() : segment.shortLabel}
                    </text>

                    <text
                      y="11"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="6.8"
                      fontWeight="850"
                      letterSpacing="0.08em"
                      fill="rgba(229,202,152,0.76)"
                      paintOrder="stroke"
                      stroke="rgba(4,3,5,0.84)"
                      strokeWidth="2"
                    >
                      {roleData.total > 0 ? `${percentage}% · ${segment.value}` : "NO DATA"}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          <circle
            cx={CX}
            cy={CY}
            r="223"
            fill="none"
            stroke="rgba(8,6,7,0.96)"
            strokeWidth="18"
          />

          <circle
            cx={CX}
            cy={CY}
            r="216"
            fill="none"
            stroke="rgba(230,188,112,0.12)"
            strokeWidth="1"
          />

          <circle
            cx={CX}
            cy={CY}
            r="232"
            fill="none"
            stroke="rgba(230,188,112,0.13)"
            strokeWidth="1"
          />

          <g clipPath="url(#innerOrreryClip)">
            <circle
              cx={CX}
              cy={CY}
              r="216"
              fill="rgba(8,6,7,0.96)"
              //filter="url(#engravedNoise)"
            />

            {Array.from({ length: 16 }, (_, index) => {
              const angle = index * 22.5;
              const start = polarToCartesian(CX, CY, 92, angle);
              const end = polarToCartesian(CX, CY, 215, angle);

              return (
                <line
                  key={`constellation-spoke-${index}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(219,178,105,0.055)"
                  strokeWidth={index % 2 === 0 ? 1 : 0.65}
                />
              );
            })}

            {Array.from({ length: 4 }, (_, index) => {
              const radius = 112 + index * 24;

              return (
                <circle
                  key={`engraved-range-subring-${index}`}
                  cx={CX}
                  cy={CY}
                  r={radius}
                  fill="none"
                  stroke="rgba(218,178,104,0.055)"
                  strokeWidth="0.9"
                  strokeDasharray="2 9"
                />
              );
            })}
          </g>

          {RANGE_BANDS.map((band) => {
            const value = rangeCounts[band.key];
            const middleRadius = (band.innerRadius + band.outerRadius) / 2;
            const bandWidth = band.outerRadius - band.innerRadius;
            const angles = getRangeDotAngles(value);
            const intensity = getRangeBandIntensity(value, maxRangeCount);

            return (
              <g key={band.key}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={middleRadius}
                  fill="none"
                  stroke="#9b6fd0"
                  strokeOpacity={intensity.smokeOpacity}
                  strokeWidth={bandWidth + 3}
                  filter={value > 0 ? "url(#arcaneSoftGlow)" : undefined}
                />

                <circle
                  cx={CX}
                  cy={CY}
                  r={middleRadius}
                  fill="none"
                  stroke="#69496f"
                  strokeOpacity={intensity.inlayOpacity}
                  strokeWidth={bandWidth}
                />

                <circle
                  cx={CX}
                  cy={CY}
                  r={band.innerRadius}
                  fill="none"
                  stroke="rgba(218,178,104,0.9)"
                  strokeOpacity={intensity.rimOpacity}
                  strokeWidth="0.85"
                />

                <circle
                  cx={CX}
                  cy={CY}
                  r={band.outerRadius}
                  fill="none"
                  stroke="rgba(218,178,104,0.9)"
                  strokeOpacity={intensity.rimOpacity}
                  strokeWidth="0.85"
                />

                <text className="data-circle-range-band-label">
                  <textPath
                    href={`#rangeLabelPath-${band.key}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {band.label}
                  </textPath>
                </text>

                {angles.map((angle, index) => {
                  const { x, y } = polarToCartesian(CX, CY, middleRadius, angle);
                  const dotKey = `${band.key}-mote-${index}`;

                  return (
                    <g key={dotKey}>
                      <circle
                        cx={x}
                        cy={y}
                        r={intensity.moteRadius + 6}
                        fill="#b077d6"
                        fillOpacity={intensity.moteGlowOpacity}
                        filter="url(#moteGlow)"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={intensity.moteRadius + 2.3}
                        fill="rgba(10,7,10,0.84)"
                        stroke="rgba(220,178,104,0.36)"
                        strokeWidth="1"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={intensity.moteRadius}
                        fill="url(#moteGradient)"
                        fillOpacity={intensity.moteOpacity}
                        stroke="rgba(255,239,185,0.58)"
                        strokeWidth="0.7"
                      />
                      <circle
                        cx={x - 1.25}
                        cy={y - 1.35}
                        r="1"
                        fill="rgba(255,255,230,0.76)"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          <text className="data-circle-curved-title">
            <textPath href="#rangeTitlePath" startOffset="50%" textAnchor="middle">
              COMBAT RANGE PROFILE
            </textPath>
          </text>

          <text className="data-circle-curved-title">
            <textPath href="#roleTitlePath" startOffset="50%" textAnchor="middle">
              ABILITY ROLE DISTRIBUTION
            </textPath>
          </text>

          <text className="data-circle-curved-title">
            <textPath href="#damageTitlePath" startOffset="50%" textAnchor="middle">
              DAMAGE TYPE DISTRIBUTION
            </textPath>
          </text>

          <text className="data-circle-curved-title">
            <textPath href="#resourceTitlePath" startOffset="50%" textAnchor="middle">
              ACTION RESOURCES AND REQUIREMENTS
            </textPath>
          </text>

          <circle
            cx={CX}
            cy={CY}
            r="88"
            fill="url(#sealGradient)"
            stroke="rgba(230,190,112,0.88)"
            strokeWidth="3"
            filter="url(#arcaneSoftGlow)"
          />

          <circle
            cx={CX}
            cy={CY}
            r="76"
            fill="none"
            stroke="rgba(22,13,5,0.65)"
            strokeWidth="1.3"
            strokeDasharray="3 8"
          />

          {Array.from({ length: 12 }, (_, index) => {
            const angle = index * 30;
            const end = polarToCartesian(CX, CY, 88, angle);

            return (
              <line
                key={`seal-line-${index}`}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke="rgba(0,0,0,0.28)"
                strokeWidth="1"
              />
            );
          })}

          {characterLabel ? (
            <text x={CX} y="462" className="data-circle-character-name">
              {characterLabel.length > 18
                ? `${characterLabel.slice(0, 18)}…`
                : characterLabel}
            </text>
          ) : null}

          <text x={CX} y="488" className="data-circle-build-name">
            {buildLabel.length > 20 ? `${buildLabel.slice(0, 20)}…` : buildLabel}
          </text>

          <text x={CX} y="513" className="data-circle-archetype">
            {archetypeLabel.length > 22
              ? `${archetypeLabel.slice(0, 22)}…`
              : archetypeLabel}
          </text>

          <text x={CX} y="540" className="data-circle-plate-text">
            L{displayLevel} · {spellCount} abilities
          </text>
        </svg>
      </div>

      {isUsingMockData ? (
        <p className="data-circle-empty">
          Mock data is shown until spells are selected.
        </p>
      ) : null}
    </div>
  );
}
