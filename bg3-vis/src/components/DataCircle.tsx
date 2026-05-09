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
}[] = [
  { key: "Bludgeoning", short: "BLD", label: "Bludgeoning", color: "#8f7963" },
  { key: "Piercing", short: "PRC", label: "Piercing", color: "#a78b68" },
  { key: "Slashing", short: "SLS", label: "Slashing", color: "#b99a72" },
  { key: "Physical", short: "PHY", label: "Physical / Weapon", color: "#c6aa7d" },
  { key: "Acid", short: "ACD", label: "Acid", color: "#86a945" },
  { key: "Cold", short: "CLD", label: "Cold", color: "#86bed6" },
  { key: "Fire", short: "FIR", label: "Fire", color: "#c95d31" },
  { key: "Force", short: "FRC", label: "Force", color: "#8d6ed0" },
  { key: "Lightning", short: "LGT", label: "Lightning", color: "#d9c447" },
  { key: "Necrotic", short: "NEC", label: "Necrotic", color: "#6e4b82" },
  { key: "Poison", short: "POI", label: "Poison", color: "#5f8d45" },
  { key: "Psychic", short: "PSY", label: "Psychic", color: "#b45aa7" },
  { key: "Radiant", short: "RAD", label: "Radiant", color: "#e1c76b" },
  { key: "Thunder", short: "THN", label: "Thunder", color: "#6d82c2" },
  { key: "Variable", short: "VAR", label: "Variable", color: "#8d857a" },
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
      inlayOpacity: 0.055,
      rimOpacity: 0.13,
      moteOpacity: 0,
      moteGlowOpacity: 0,
      moteRadius: 0,
    };
  }

  const ratio = Math.min(1, value / maxValue);
  const eased = Math.sqrt(ratio);

  return {
    smokeOpacity: 0.045 + eased * 0.075,
    inlayOpacity: 0.09 + eased * 0.12,
    rimOpacity: 0.19 + eased * 0.2,
    moteOpacity: 0.72 + eased * 0.17,
    moteGlowOpacity: 0.09 + eased * 0.18,
    moteRadius: 3.8 + eased * 0.75,
  };
}

function getDamageTypeIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return {
      sealOpacity: 0,
      glowOpacity: 0,
      labelOpacity: 0,
      gemOpacity: 0,
      gemRadius: 0,
    };
  }

  const ratio = Math.min(1, value / maxValue);
  const eased = Math.sqrt(ratio);

  return {
    sealOpacity: 0.38 + eased * 0.24,
    glowOpacity: 0.04 + eased * 0.1,
    labelOpacity: 0.42 + eased * 0.34,
    gemOpacity: 0.38 + eased * 0.36,
    gemRadius: 3.3 + eased * 1.2,
  };
}

function getRoleBandIntensity(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return {
      arcOpacity: 0.12,
      glowOpacity: 0,
      markerOpacity: 0.1,
      markerRadius: 2,
    };
  }

  const ratio = Math.min(1, value / maxValue);
  const eased = Math.sqrt(ratio);

  return {
    arcOpacity: 0.46 + eased * 0.22,
    glowOpacity: 0.04 + eased * 0.09,
    markerOpacity: 0.34 + eased * 0.28,
    markerRadius: 2.2 + eased * 1,
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
  const maxRoleCount = Math.max(
    ...Object.values(roleData.counts),
    roleData.damageTotal,
    roleData.utilityTotal,
    1
  );

  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  const damageTypeTotal = Object.values(damageTypeCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const damageRoleIntensity = getRoleBandIntensity(roleData.damageTotal, maxRoleCount);
  const utilityRoleIntensity = getRoleBandIntensity(roleData.utilityTotal, maxRoleCount);

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
              <stop offset="34%" stopColor="#f0cf7e" />
              <stop offset="68%" stopColor="#b577da" />
              <stop offset="100%" stopColor="#4a2d66" />
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
            <path id="resourceTitlePath" d={describeTextArc(CX, CY, 450, -56, 56)} />
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

          <circle
            cx={CX}
            cy={CY}
            r={365}
            fill="none"
            stroke="rgba(8,6,8,0.96)"
            strokeWidth="50"
          />

          <circle
            cx={CX}
            cy={CY}
            r={365}
            fill="none"
            stroke="rgba(220,178,104,0.12)"
            strokeWidth="44"
          />

          <circle
            cx={CX}
            cy={CY}
            r={390}
            fill="none"
            stroke="rgba(230,188,112,0.18)"
            strokeWidth="1"
          />

          <circle
            cx={CX}
            cy={CY}
            r={340}
            fill="none"
            stroke="rgba(230,188,112,0.14)"
            strokeWidth="1"
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

                  const pad = Math.min(1.7, sweep / 5);
                  const visualStartAngle = startAngle + pad;
                  const visualEndAngle = endAngle - pad;
                  const labelAngle = startAngle + sweep / 2;
                  const labelPoint = polarToCartesian(CX, CY, 365, labelAngle);
                  const gemPoint = polarToCartesian(CX, CY, 391, labelAngle);
                  const showLabel = sweep >= 13;
                  const showGem = sweep >= 7;
                  const intensity = getDamageTypeIntensity(value, maxDamageTypeCount);

                  return (
                    <g key={type.key}>
                      <path
                        d={describeDonutSegment(
                          CX,
                          CY,
                          338,
                          392,
                          visualStartAngle,
                          visualEndAngle
                        )}
                        fill={type.color}
                        fillOpacity={intensity.glowOpacity}
                        filter="url(#sigilGlow)"
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
                        fill={type.color}
                        fillOpacity={intensity.sealOpacity}
                        stroke="rgba(5,3,5,0.92)"
                        strokeWidth="2.2"
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
                        fill="rgba(0,0,0,0.44)"
                      />

                      <path
                        d={describeDonutSegment(
                          CX,
                          CY,
                          377,
                          380,
                          visualStartAngle,
                          visualEndAngle
                        )}
                        fill="rgba(231,196,122,0.13)"
                      />

                      {showGem ? (
                        <g>
                          <circle
                            cx={gemPoint.x}
                            cy={gemPoint.y}
                            r={intensity.gemRadius + 2.8}
                            fill={type.color}
                            fillOpacity="0.08"
                            filter="url(#sigilGlow)"
                          />
                          <circle
                            cx={gemPoint.x}
                            cy={gemPoint.y}
                            r={intensity.gemRadius}
                            fill={type.color}
                            fillOpacity={intensity.gemOpacity}
                            stroke="rgba(244,220,165,0.48)"
                            strokeWidth="0.85"
                          />
                          <circle
                            cx={gemPoint.x - 1}
                            cy={gemPoint.y - 1.1}
                            r="0.9"
                            fill="rgba(255,255,232,0.62)"
                          />
                        </g>
                      ) : null}

                      {showLabel ? (
                        <text
                          x={labelPoint.x}
                          y={labelPoint.y + 3}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="900"
                          letterSpacing="0.08em"
                          fill="rgba(248,238,211,0.82)"
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
            : null}

          <circle
            cx={CX}
            cy={CY}
            r={302}
            fill="none"
            stroke="rgba(8,6,7,0.96)"
            strokeWidth="44"
          />

          <circle
            cx={CX}
            cy={CY}
            r={302}
            fill="none"
            stroke="rgba(220,178,104,0.1)"
            strokeWidth="40"
          />

          <circle
            cx={CX}
            cy={CY}
            r={324}
            fill="none"
            stroke="rgba(230,188,112,0.16)"
            strokeWidth="1"
          />

          <circle
            cx={CX}
            cy={CY}
            r={280}
            fill="none"
            stroke="rgba(230,188,112,0.14)"
            strokeWidth="1"
          />

          {roleData.damageTotal > 0 ? (
            <g>
              <path
                d={describeTextArc(
                  CX,
                  CY,
                  302,
                  roleStartAngle,
                  roleStartAngle + clampedDamageAngle
                )}
                fill="none"
                stroke="#a75f36"
                strokeOpacity={damageRoleIntensity.glowOpacity}
                strokeWidth="34"
                strokeLinecap="round"
                filter="url(#sigilGlow)"
              />

              <path
                d={describeTextArc(
                  CX,
                  CY,
                  302,
                  roleStartAngle,
                  roleStartAngle + clampedDamageAngle
                )}
                fill="none"
                stroke="#a75f36"
                strokeOpacity={damageRoleIntensity.arcOpacity}
                strokeWidth="24"
                strokeLinecap="round"
              />

              <path
                d={describeTextArc(
                  CX,
                  CY,
                  318,
                  roleStartAngle,
                  roleStartAngle + clampedDamageAngle
                )}
                fill="none"
                stroke="rgba(230,188,112,0.13)"
                strokeWidth="1"
              />
            </g>
          ) : null}

          {roleData.utilityTotal > 0 ? (
            <g>
              <path
                d={describeTextArc(
                  CX,
                  CY,
                  302,
                  utilityStartAngle,
                  roleStartAngle + 360
                )}
                fill="none"
                stroke="#5a947f"
                strokeOpacity={utilityRoleIntensity.glowOpacity}
                strokeWidth="34"
                strokeLinecap="round"
                filter="url(#sigilGlow)"
              />

              <path
                d={describeTextArc(
                  CX,
                  CY,
                  302,
                  utilityStartAngle,
                  roleStartAngle + 360
                )}
                fill="none"
                stroke="#5a947f"
                strokeOpacity={utilityRoleIntensity.arcOpacity}
                strokeWidth="24"
                strokeLinecap="round"
              />

              <path
                d={describeTextArc(
                  CX,
                  CY,
                  286,
                  utilityStartAngle,
                  roleStartAngle + 360
                )}
                fill="none"
                stroke="rgba(230,188,112,0.12)"
                strokeWidth="1"
              />
            </g>
          ) : null}

          {roleData.total === 0 ? (
            <>
              <path
                d={describeTextArc(CX, CY, 302, -90, 90)}
                fill="none"
                stroke="#a75f36"
                strokeOpacity="0.16"
                strokeWidth="24"
                strokeLinecap="round"
              />
              <path
                d={describeTextArc(CX, CY, 302, 90, 270)}
                fill="none"
                stroke="#5a947f"
                strokeOpacity="0.16"
                strokeWidth="24"
                strokeLinecap="round"
              />
            </>
          ) : null}

          {(() => {
            const damageTotal = roleData.damageTotal || 1;
            let currentAngle = roleStartAngle;

            return DAMAGE_ROLE_KEYS.map((role) => {
              const count = roleData.counts[role];
              const sliceAngle = (count / damageTotal) * clampedDamageAngle;
              const startAngle = currentAngle;
              const endAngle = currentAngle + sliceAngle;
              currentAngle = endAngle;

              if (count <= 0 || roleData.damageTotal <= 0) {
                return null;
              }

              const markerAngle = startAngle + sliceAngle / 2;
              const markerPoint = polarToCartesian(CX, CY, 302, markerAngle);
              const intensity = getRoleBandIntensity(count, maxRoleCount);

              return (
                <g
                  key={`damage-role-marker-${role}`}
                  transform={`translate(${markerPoint.x} ${markerPoint.y}) rotate(${markerAngle})`}
                >
                  <rect
                    x={-(intensity.markerRadius + 2.5)}
                    y={-(intensity.markerRadius + 2.5)}
                    width={(intensity.markerRadius + 2.5) * 2}
                    height={(intensity.markerRadius + 2.5) * 2}
                    rx="2"
                    transform="rotate(45)"
                    fill="#c8783d"
                    fillOpacity="0.08"
                    filter="url(#sigilGlow)"
                  />
                  <rect
                    x={-intensity.markerRadius}
                    y={-intensity.markerRadius}
                    width={intensity.markerRadius * 2}
                    height={intensity.markerRadius * 2}
                    rx="1.5"
                    transform="rotate(45)"
                    fill="#e8b16b"
                    fillOpacity={intensity.markerOpacity}
                    stroke="rgba(44,18,8,0.72)"
                    strokeWidth="0.75"
                  />
                </g>
              );
            });
          })()}

          {(() => {
            const utilityTotal = roleData.utilityTotal || 1;
            let currentAngle = utilityStartAngle;
            const utilitySweep = 360 - clampedDamageAngle;

            return UTILITY_ROLE_KEYS.map((role) => {
              const count = roleData.counts[role];
              const sliceAngle = (count / utilityTotal) * utilitySweep;
              const startAngle = currentAngle;
              const endAngle = currentAngle + sliceAngle;
              currentAngle = endAngle;

              if (count <= 0 || roleData.utilityTotal <= 0) {
                return null;
              }

              const markerAngle = startAngle + sliceAngle / 2;
              const markerPoint = polarToCartesian(CX, CY, 302, markerAngle);
              const intensity = getRoleBandIntensity(count, maxRoleCount);

              return (
                <g
                  key={`utility-role-marker-${role}`}
                  transform={`translate(${markerPoint.x} ${markerPoint.y}) rotate(${markerAngle})`}
                >
                  <rect
                    x={-(intensity.markerRadius + 2.5)}
                    y={-(intensity.markerRadius + 2.5)}
                    width={(intensity.markerRadius + 2.5) * 2}
                    height={(intensity.markerRadius + 2.5) * 2}
                    rx="2"
                    transform="rotate(45)"
                    fill="#69a88e"
                    fillOpacity="0.08"
                    filter="url(#sigilGlow)"
                  />
                  <rect
                    x={-intensity.markerRadius}
                    y={-intensity.markerRadius}
                    width={intensity.markerRadius * 2}
                    height={intensity.markerRadius * 2}
                    rx="1.5"
                    transform="rotate(45)"
                    fill="#aad1bd"
                    fillOpacity={intensity.markerOpacity}
                    stroke="rgba(8,32,26,0.72)"
                    strokeWidth="0.75"
                  />
                </g>
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
                  stroke="rgba(219,178,105,0.055)"
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