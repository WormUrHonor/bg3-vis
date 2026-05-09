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

type RangeBandKey = "self" | "melee" | "close" | "mid" | "long";

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
  { key: "close", label: "Close-range", innerRadius: 162, outerRadius: 184, labelRadius: 173 },
  { key: "mid", label: "Mid-range", innerRadius: 190, outerRadius: 212, labelRadius: 201 },
  { key: "long", label: "Long-range", innerRadius: 218, outerRadius: 240, labelRadius: 229 },
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

const DAMAGE_TYPES: {
  key: DamageRingKey;
  short: string;
  label: string;
  color: string;
  darkColor: string;
  lightColor: string;
}[] = [
  {
    key: "Bludgeoning",
    short: "BLD",
    label: "Bludgeoning",
    color: "#9b8068",
    darkColor: "#3f3128",
    lightColor: "#d2b89a",
  },
  {
    key: "Piercing",
    short: "PRC",
    label: "Piercing",
    color: "#aa8e68",
    darkColor: "#463623",
    lightColor: "#e0c38f",
  },
  {
    key: "Slashing",
    short: "SLS",
    label: "Slashing",
    color: "#bf9b6d",
    darkColor: "#4a3422",
    lightColor: "#e7c591",
  },
  {
    key: "Physical",
    short: "PHY",
    label: "Physical / Weapon",
    color: "#c5aa82",
    darkColor: "#4d3b2b",
    lightColor: "#f0d6a5",
  },
  {
    key: "Acid",
    short: "ACD",
    label: "Acid",
    color: "#7e9f55",
    darkColor: "#28351e",
    lightColor: "#b9d17b",
  },
  {
    key: "Cold",
    short: "CLD",
    label: "Cold",
    color: "#83a8bd",
    darkColor: "#243645",
    lightColor: "#c8e3eb",
  },
  {
    key: "Fire",
    short: "FIR",
    label: "Fire",
    color: "#c6673d",
    darkColor: "#471c12",
    lightColor: "#f0a05e",
  },
  {
    key: "Force",
    short: "FRC",
    label: "Force",
    color: "#9a7dcc",
    darkColor: "#33274d",
    lightColor: "#d7bfff",
  },
  {
    key: "Lightning",
    short: "LGT",
    label: "Lightning",
    color: "#d0b94e",
    darkColor: "#473a14",
    lightColor: "#f3e483",
  },
  {
    key: "Necrotic",
    short: "NEC",
    label: "Necrotic",
    color: "#775984",
    darkColor: "#201522",
    lightColor: "#b58bbd",
  },
  {
    key: "Poison",
    short: "POI",
    label: "Poison",
    color: "#648b4d",
    darkColor: "#1d2b17",
    lightColor: "#a7c77d",
  },
  {
    key: "Psychic",
    short: "PSY",
    label: "Psychic",
    color: "#a864a8",
    darkColor: "#341f36",
    lightColor: "#e1a5df",
  },
  {
    key: "Radiant",
    short: "RAD",
    label: "Radiant",
    color: "#d9c778",
    darkColor: "#53461b",
    lightColor: "#fff0aa",
  },
  {
    key: "Thunder",
    short: "THN",
    label: "Thunder",
    color: "#687eb8",
    darkColor: "#1c263f",
    lightColor: "#aebff0",
  },
  {
    key: "Variable",
    short: "VAR",
    label: "Variable",
    color: "#85817a",
    darkColor: "#2a2927",
    lightColor: "#c8c2b8",
  },
];

const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "action", short: "A", label: "Action", color: "#c18a45" },
  { key: "bonus-action", short: "BA", label: "Bonus Action", color: "#d19a5b" },
  { key: "reaction", short: "R", label: "Reaction", color: "#d7b06a" },
  { key: "concentration", short: "CON", label: "Concentration", color: "#8f72bd" },
  { key: "cantrip", short: "CAN", label: "Cantrip use", color: "#6fa4ad" },
  { key: "slot-1", short: "I", label: "Spell slot level 1", color: "#955760" },
  { key: "slot-2", short: "II", label: "Spell slot level 2", color: "#a8656b" },
  { key: "slot-3", short: "III", label: "Spell slot level 3", color: "#b87678" },
  { key: "slot-4", short: "IV", label: "Spell slot level 4", color: "#c78987" },
  { key: "slot-5", short: "V", label: "Spell slot level 5", color: "#d39b97" },
  { key: "slot-6", short: "VI", label: "Spell slot level 6", color: "#dfada8" },
  { key: "pact", short: "PACT", label: "Pact Magic slot use", color: "#9b63a7" },
  { key: "short-rest", short: "SR", label: "Short-rest reliance", color: "#5da891" },
  { key: "long-rest", short: "LR", label: "Long-rest reliance", color: "#7bad72" },
  { key: "class-resource", short: "CLS", label: "Class-specific pool reliance", color: "#5a86a8" },
  { key: "passive-conditional", short: "P/C", label: "Passive / conditional", color: "#a88354" },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
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

  const blockedArc = 82;
  const availableSweep = 360 - blockedArc;
  const startAngle = blockedArc / 2;
  const step = availableSweep / count;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + step * index + step / 2;
    return angle % 360;
  });
}

function getRangeBandIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return {
      smokeOpacity: 0.035,
      inlayOpacity: 0.06,
      rimOpacity: 0.14,
      moteOpacity: 0,
      moteGlowOpacity: 0,
      moteRadius: 0,
    };
  }

  const ratio = Math.min(1, value / maxValue);
  const eased = Math.sqrt(ratio);

  return {
    smokeOpacity: 0.05 + eased * 0.08,
    inlayOpacity: 0.1 + eased * 0.13,
    rimOpacity: 0.2 + eased * 0.22,
    moteOpacity: 0.74 + eased * 0.18,
    moteGlowOpacity: 0.1 + eased * 0.2,
    moteRadius: 3.9 + eased * 0.8,
  };
}

function getDamageTypeIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return {
      glowOpacity: 0,
      fillOpacity: 0,
      labelOpacity: 0,
      highlightOpacity: 0,
    };
  }

  const ratio = Math.min(1, value / maxValue);
  const eased = Math.sqrt(ratio);

  return {
    glowOpacity: 0.06 + eased * 0.13,
    fillOpacity: 0.58 + eased * 0.25,
    labelOpacity: 0.48 + eased * 0.36,
    highlightOpacity: 0.09 + eased * 0.14,
  };
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
      close: 0,
      mid: 0,
      long: 0,
    };

    selectedSpells.forEach((spell) => {
      switch (spell.range.category) {
        case "self":
          counts.self += 1;
          break;
        case "melee":
          counts.melee += 1;
          break;
        case "close":
          counts.close += 1;
          break;
        case "mid":
          counts.mid += 1;
          break;
        case "long":
        case "weapon-range":
          counts.long += 1;
          break;
        case "special":
          counts.close += 1;
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
  const maxDamageTypeCount = Math.max(...Object.values(damageTypeCounts), 1);

  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

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
              <stop offset="0%" stopColor="rgba(132,92,170,0.16)" />
              <stop offset="36%" stopColor="rgba(34,25,43,0.72)" />
              <stop offset="74%" stopColor="rgba(12,9,12,0.94)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <radialGradient id="innerVellumGradient" cx="50%" cy="44%" r="58%">
              <stop offset="0%" stopColor="rgba(87,58,92,0.34)" />
              <stop offset="58%" stopColor="rgba(25,18,28,0.86)" />
              <stop offset="100%" stopColor="rgba(7,5,8,0.98)" />
            </radialGradient>

            <radialGradient id="sealGradient" cx="50%" cy="42%" r="70%">
              <stop offset="0%" stopColor="#f0cd76" />
              <stop offset="42%" stopColor="#9b672d" />
              <stop offset="78%" stopColor="#3b2613" />
              <stop offset="100%" stopColor="#15100c" />
            </radialGradient>

            <radialGradient id="moteGradient" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#fff9de" />
              <stop offset="34%" stopColor="#f0cf7e" />
              <stop offset="68%" stopColor="#b577da" />
              <stop offset="100%" stopColor="#4a2d66" />
            </radialGradient>

            <linearGradient id="damageRoleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd18a" />
              <stop offset="52%" stopColor="#c56f38" />
              <stop offset="100%" stopColor="#3a160d" />
            </linearGradient>

            <linearGradient id="utilityRoleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5f0dc" />
              <stop offset="50%" stopColor="#65a994" />
              <stop offset="100%" stopColor="#15342f" />
            </linearGradient>

            {DAMAGE_TYPES.map((type) => (
              <linearGradient
                key={`damage-gradient-${type.key}`}
                id={`damageGradient-${type.key}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={type.lightColor} />
                <stop offset="38%" stopColor={type.color} />
                <stop offset="100%" stopColor={type.darkColor} />
              </linearGradient>
            ))}

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
                  1.00 0 0 0 0.20
                  0 0.72 0 0 0.10
                  0 0 0.95 0 0.25
                  0 0 0 0.68 0
                "
                result="moteGlowColor"
              />
              <feMerge>
                <feMergeNode in="moteGlowColor" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="damageEnamelGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0.92 0 0 0 0.10
                  0 0.74 0 0 0.07
                  0 0 0.58 0 0.04
                  0 0 0 0.44 0
                "
                result="damageGlow"
              />
              <feMerge>
                <feMergeNode in="damageGlow" />
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
                  0 0 0 0.08 0
                "
                result="softNoise"
              />
              <feBlend in="SourceGraphic" in2="softNoise" mode="screen" />
            </filter>

            <clipPath id="innerOrreryClip">
              <circle cx={CX} cy={CY} r="248" />
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

            <path id="rangeTitlePath" d={describeTextArc(CX, CY, 266, -50, 50)} />
            <path id="roleTitlePath" d={describeTextArc(CX, CY, 326, -50, 50)} />
            <path id="damageTitlePath" d={describeTextArc(CX, CY, 392, -52, 52)} />
            <path
              id="resourceTitlePath"
              d={describeTextArc(CX, CY, 450, -56, 56)}
            />
          </defs>

          <circle cx={CX} cy={CY} r={480} fill="url(#arcaneBackground)" />

          <circle
            cx={CX}
            cy={CY}
            r={470}
            fill="none"
            stroke="rgba(214, 174, 103, 0.18)"
            strokeWidth="1.6"
          />

          <circle
            cx={CX}
            cy={CY}
            r={452}
            fill="none"
            stroke="rgba(214, 174, 103, 0.08)"
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

          {RESOURCE_SECTORS.map((sector, index) => {
            const sectorAngle = 360 / RESOURCE_SECTORS.length;
            const angle = -180 + index * sectorAngle + sectorAngle / 2;
            const value = resourceCounts[sector.key];
            const ratio = value <= 0 ? 0 : value / maxResourceCount;
            const height = value <= 0 ? 17 : 24 + ratio * 66;
            const width = 18;
            const baseRadius = 438;
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
                  fill="rgba(16, 12, 13, 0.88)"
                  stroke="rgba(219, 178, 105, 0.25)"
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
                  fill="rgba(255, 226, 165, 0.52)"
                  fillOpacity={capOpacity}
                />
              </g>
            );
          })}

          <circle
            cx={CX}
            cy={CY}
            r={365}
            fill="none"
            stroke="rgba(9, 7, 8, 0.96)"
            strokeWidth="44"
          />

          <circle
            cx={CX}
            cy={CY}
            r={365}
            fill="none"
            stroke="rgba(220, 178, 104, 0.11)"
            strokeWidth="44"
          />

          {damageTypeTotal > 0 ? (
            (() => {
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

                const pad = Math.min(1.4, sweep / 5);
                const visualStartAngle = startAngle + pad;
                const visualEndAngle = endAngle - pad;
                const labelAngle = startAngle + sweep / 2;
                const labelPoint = polarToCartesian(CX, CY, 365, labelAngle);
                const showLabel = sweep >= 12;
                const intensity = getDamageTypeIntensity(value, maxDamageTypeCount);

                return (
                  <g key={type.key}>
                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        340,
                        390,
                        visualStartAngle,
                        visualEndAngle
                      )}
                      fill={type.color}
                      fillOpacity={intensity.glowOpacity}
                      filter="url(#damageEnamelGlow)"
                    />

                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        350,
                        380,
                        visualStartAngle,
                        visualEndAngle
                      )}
                      fill={`url(#damageGradient-${type.key})`}
                      fillOpacity={intensity.fillOpacity}
                      stroke="rgba(4,3,4,0.92)"
                      strokeWidth="2.3"
                    />

                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        376,
                        380,
                        visualStartAngle,
                        visualEndAngle
                      )}
                      fill="rgba(255,246,218,0.25)"
                      fillOpacity={intensity.highlightOpacity}
                    />

                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        350,
                        353,
                        visualStartAngle,
                        visualEndAngle
                      )}
                      fill="rgba(0,0,0,0.45)"
                    />

                    {showLabel ? (
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y + 3}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="900"
                        letterSpacing="0.08em"
                        fill="rgba(247,238,211,0.86)"
                        opacity={intensity.labelOpacity}
                        paintOrder="stroke"
                        stroke="rgba(0,0,0,0.76)"
                        strokeWidth="2"
                      >
                        {type.short}
                      </text>
                    ) : null}
                  </g>
                );
              });
            })()
          ) : null}

          {roleData.damageTotal > 0 && (
            <path
              d={describeDonutSegment(
                CX,
                CY,
                286,
                318,
                roleStartAngle,
                roleStartAngle + clampedDamageAngle
              )}
              fill="url(#damageRoleGradient)"
              fillOpacity="0.9"
              stroke="rgba(5,3,3,0.82)"
              strokeWidth="3"
            />
          )}

          {roleData.utilityTotal > 0 && (
            <path
              d={describeDonutSegment(
                CX,
                CY,
                286,
                318,
                utilityStartAngle,
                roleStartAngle + 360
              )}
              fill="url(#utilityRoleGradient)"
              fillOpacity="0.86"
              stroke="rgba(5,3,3,0.82)"
              strokeWidth="3"
            />
          )}

          {roleData.total === 0 ? (
            <>
              <path
                d={describeDonutSegment(CX, CY, 286, 318, -90, 90)}
                fill="url(#damageRoleGradient)"
                fillOpacity="0.16"
                stroke="rgba(5,3,3,0.82)"
                strokeWidth="3"
              />
              <path
                d={describeDonutSegment(CX, CY, 286, 318, 90, 270)}
                fill="url(#utilityRoleGradient)"
                fillOpacity="0.16"
                stroke="rgba(5,3,3,0.82)"
                strokeWidth="3"
              />
            </>
          ) : null}

          {(() => {
            const damageTotal = roleData.damageTotal || 1;
            let currentAngle = roleStartAngle;

            return DAMAGE_ROLE_KEYS.map((role, index) => {
              const count = roleData.counts[role];
              const sliceAngle = (count / damageTotal) * clampedDamageAngle;
              currentAngle += sliceAngle;

              if (index === DAMAGE_ROLE_KEYS.length - 1 || count <= 0) {
                return null;
              }

              const innerPoint = polarToCartesian(CX, CY, 286, currentAngle);
              const outerPoint = polarToCartesian(CX, CY, 318, currentAngle);

              return (
                <line
                  key={`damage-role-divider-${role}`}
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="2"
                />
              );
            });
          })()}

          {(() => {
            const utilityTotal = roleData.utilityTotal || 1;
            let currentAngle = utilityStartAngle;
            const utilitySweep = 360 - clampedDamageAngle;

            return UTILITY_ROLE_KEYS.map((role, index) => {
              const count = roleData.counts[role];
              const sliceAngle = (count / utilityTotal) * utilitySweep;
              currentAngle += sliceAngle;

              if (index === UTILITY_ROLE_KEYS.length - 1 || count <= 0) {
                return null;
              }

              const innerPoint = polarToCartesian(CX, CY, 286, currentAngle);
              const outerPoint = polarToCartesian(CX, CY, 318, currentAngle);

              return (
                <line
                  key={`utility-role-divider-${role}`}
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth="2"
                />
              );
            });
          })()}

          <g clipPath="url(#innerOrreryClip)">
            <circle
              cx={CX}
              cy={CY}
              r="248"
              fill="url(#innerVellumGradient)"
              filter="url(#engravedNoise)"
            />

            {Array.from({ length: 16 }, (_, index) => {
              const angle = index * 22.5;
              const start = polarToCartesian(CX, CY, 92, angle);
              const end = polarToCartesian(CX, CY, 247, angle);

              return (
                <line
                  key={`constellation-spoke-${index}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(219, 178, 105, 0.055)"
                  strokeWidth={index % 2 === 0 ? 1 : 0.65}
                />
              );
            })}

            {Array.from({ length: 5 }, (_, index) => {
              const radius = 116 + index * 28;

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
                  strokeWidth={bandWidth + 7}
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