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
  { key: "Bludgeoning", short: "BLD", label: "Bludgeoning", color: "#a58e78" },
  { key: "Piercing", short: "PRC", label: "Piercing", color: "#b39c77" },
  { key: "Slashing", short: "SLS", label: "Slashing", color: "#c7a77b" },
  { key: "Physical", short: "PHY", label: "Physical / Weapon", color: "#d3b58b" },
  { key: "Acid", short: "ACD", label: "Acid", color: "#76a855" },
  { key: "Cold", short: "CLD", label: "Cold", color: "#74a9d8" },
  { key: "Fire", short: "FIR", label: "Fire", color: "#d06a47" },
  { key: "Force", short: "FRC", label: "Force", color: "#9f86d1" },
  { key: "Lightning", short: "LGT", label: "Lightning", color: "#d9c14e" },
  { key: "Necrotic", short: "NEC", label: "Necrotic", color: "#7d5f8c" },
  { key: "Poison", short: "POI", label: "Poison", color: "#5b8c4d" },
  { key: "Psychic", short: "PSY", label: "Psychic", color: "#b86bb8" },
  { key: "Radiant", short: "RAD", label: "Radiant", color: "#e0cf86" },
  { key: "Thunder", short: "THN", label: "Thunder", color: "#6b87c7" },
  { key: "Variable", short: "VAR", label: "Variable", color: "#8b8b8b" },
];

const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "action", short: "A", label: "Action", color: "#b8863b" },
  { key: "bonus-action", short: "BA", label: "Bonus Action", color: "#c89452" },
  { key: "reaction", short: "R", label: "Reaction", color: "#d7aa65" },
  { key: "concentration", short: "CON", label: "Concentration", color: "#7c65ae" },
  { key: "cantrip", short: "CAN", label: "Cantrip use", color: "#5e9bb2" },
  { key: "slot-1", short: "I", label: "Spell slot level 1", color: "#8d4f57" },
  { key: "slot-2", short: "II", label: "Spell slot level 2", color: "#a55b63" },
  { key: "slot-3", short: "III", label: "Spell slot level 3", color: "#b76870" },
  { key: "slot-4", short: "IV", label: "Spell slot level 4", color: "#c6787f" },
  { key: "slot-5", short: "V", label: "Spell slot level 5", color: "#d28a8f" },
  { key: "slot-6", short: "VI", label: "Spell slot level 6", color: "#df9ca0" },
  { key: "pact", short: "PACT", label: "Pact Magic slot use", color: "#9357a2" },
  { key: "short-rest", short: "SR", label: "Short-rest reliance", color: "#4f9d88" },
  { key: "long-rest", short: "LR", label: "Long-rest reliance", color: "#67a36c" },
  { key: "class-resource", short: "CLS", label: "Class-specific pool reliance", color: "#4c7da6" },
  { key: "passive-conditional", short: "P/C", label: "Passive / conditional", color: "#a07e4f" },
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

  const blockedArc = 72;
  const availableSweep = 360 - blockedArc;
  const startAngle = blockedArc / 2;
  const step = availableSweep / count;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + step * index + step / 2;
    return angle % 360;
  });
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
            <radialGradient id="sealGradient" cx="50%" cy="42%" r="70%">
              <stop offset="0%" stopColor="#d9b562" />
              <stop offset="62%" stopColor="#7b5525" />
              <stop offset="100%" stopColor="#21170e" />
            </radialGradient>

            <radialGradient id="circleBackground" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(216,178,104,0.18)" />
              <stop offset="48%" stopColor="rgba(18,14,10,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            <filter id="dataCircleGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

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

          <circle cx={CX} cy={CY} r={480} fill="url(#circleBackground)" />

          {Array.from({ length: 18 }, (_, index) => (
            <circle
              key={`outer-guide-${index}`}
              cx={CX}
              cy={CY}
              r={340 + index * 8}
              fill="none"
              stroke="rgba(216,178,104,0.055)"
              strokeWidth="1"
            />
          ))}

          <circle
            cx={CX}
            cy={CY}
            r={470}
            fill="none"
            stroke="rgba(216,178,104,0.18)"
            strokeWidth="1.5"
          />
          <circle cx={CX} cy={CY} r={452} fill="none" stroke="rgba(216,178,104,0.08)" />
          <circle cx={CX} cy={CY} r={420} fill="none" stroke="rgba(216,178,104,0.12)" />
          <circle cx={CX} cy={CY} r={388} fill="none" stroke="rgba(216,178,104,0.11)" />
          <circle cx={CX} cy={CY} r={356} fill="none" stroke="rgba(216,178,104,0.11)" />
          <circle cx={CX} cy={CY} r={324} fill="none" stroke="rgba(216,178,104,0.11)" />
          <circle cx={CX} cy={CY} r={292} fill="none" stroke="rgba(216,178,104,0.11)" />
          <circle cx={CX} cy={CY} r={260} fill="none" stroke="rgba(216,178,104,0.11)" />

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
            const height = value <= 0 ? 14 : 22 + (value / maxResourceCount) * 76;
            const width = 20;
            const baseRadius = 444;
            const center = polarToCartesian(CX, CY, baseRadius + height / 2, angle);

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
                  rx="2"
                  fill={sector.color}
                  fillOpacity={getOpacity(value, maxResourceCount, 0.13, 0.95)}
                  stroke="rgba(8,6,4,0.72)"
                  strokeWidth="1"
                />
                {value > 0 ? (
                  <rect
                    x={-width / 2}
                    y={-height / 2}
                    width={width}
                    height={Math.max(5, height * 0.18)}
                    rx="2"
                    fill="rgba(255,135,45,0.55)"
                  />
                ) : null}
              </g>
            );
          })}

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

                return (
                  <path
                    key={type.key}
                    d={describeDonutSegment(CX, CY, 350, 380, startAngle, endAngle)}
                    fill={type.color}
                    fillOpacity="0.78"
                    stroke="rgba(0,0,0,0.82)"
                    strokeWidth="3"
                  />
                );
              });
            })()
          ) : (
            <circle
              cx={CX}
              cy={CY}
              r={365}
              fill="none"
              stroke="rgba(216,178,104,0.08)"
              strokeWidth="30"
            />
          )}

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
              fill="#ff980d"
              fillOpacity="0.95"
              stroke="rgba(0,0,0,0.85)"
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
              fill="#00d4b8"
              fillOpacity="0.9"
              stroke="rgba(0,0,0,0.85)"
              strokeWidth="3"
            />
          )}

          {roleData.total === 0 ? (
            <>
              <path
                d={describeDonutSegment(CX, CY, 286, 318, -90, 90)}
                fill="#ff980d"
                fillOpacity="0.2"
                stroke="rgba(0,0,0,0.85)"
                strokeWidth="3"
              />
              <path
                d={describeDonutSegment(CX, CY, 286, 318, 90, 270)}
                fill="#00d4b8"
                fillOpacity="0.2"
                stroke="rgba(0,0,0,0.85)"
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

          {RANGE_BANDS.map((band) => {
            const value = rangeCounts[band.key];
            const middleRadius = (band.innerRadius + band.outerRadius) / 2;
            const bandWidth = band.outerRadius - band.innerRadius;
            const angles = getRangeDotAngles(value);
            const opacity = getOpacity(value, maxRangeCount, 0.35, 0.95);

            return (
              <g key={band.key}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={middleRadius}
                  fill="none"
                  stroke="rgba(74,55,136,0.15)"
                  strokeWidth={bandWidth}
                />

                <circle
                  cx={CX}
                  cy={CY}
                  r={band.innerRadius}
                  fill="none"
                  stroke="rgba(91,79,210,0.28)"
                  strokeWidth="1"
                />

                <circle
                  cx={CX}
                  cy={CY}
                  r={band.outerRadius}
                  fill="none"
                  stroke="rgba(91,79,210,0.28)"
                  strokeWidth="1"
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

                  return (
                    <circle
                      key={`${band.key}-dot-${index}`}
                      cx={x}
                      cy={y}
                      r={5}
                      fill="#7d49d8"
                      fillOpacity={opacity}
                    />
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
            stroke="rgba(216,178,104,0.84)"
            strokeWidth="3"
            filter="url(#dataCircleGlow)"
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