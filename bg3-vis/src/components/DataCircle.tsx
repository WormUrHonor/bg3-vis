import { useMemo } from "react";
import type { ClassName } from "../types/buildPlannerTypes";
import {
  getSpellById,
  type AbilityRole,
  type BG3Spell,
} from "../data/bg3Spells";
import { mockDataCircleBuild, mockSelectedSpellIds } from "../data/mockDataCircle";

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

const RANGE_BANDS: { key: RangeBandKey; label: string; distance: string; radius: number }[] = [
  { key: "self", label: "Self", distance: "0m", radius: 70 },
  { key: "melee", label: "Melee", distance: "1.5–3m", radius: 82 },
  { key: "close", label: "Close", distance: "6–9m", radius: 94 },
  { key: "mid", label: "Mid", distance: "12–18m", radius: 106 },
  { key: "long", label: "Long", distance: "18–27m", radius: 118 },
];

const DAMAGE_ROLE_KEYS: AbilityRole[] = [
  "single-target-damage",
  "area-damage",
];

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

const ROLE_LABELS: Record<AbilityRole, { short: string; label: string }> = {
  "single-target-damage": { short: "ST", label: "Single-target damage" },
  "area-damage": { short: "AOE", label: "Area damage" },
  control: { short: "CTL", label: "Control" },
  "support-buff": { short: "SUP", label: "Support / buffing" },
  "defense-protection": { short: "DEF", label: "Defense / protection" },
  healing: { short: "HEAL", label: "Healing" },
  "mobility-positioning": { short: "MOB", label: "Mobility / positioning" },
  "narrative-interaction": { short: "NAR", label: "Narrative / interaction utility" },
  "investigation-world-interaction": {
    short: "INV",
    label: "Investigation / world interaction utility",
  },
  summon: { short: "SUM", label: "Summon" },
};

const DAMAGE_TYPES: {
  key: DamageRingKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "Bludgeoning", short: "Bld", label: "Bludgeoning", color: "#a58e78" },
  { key: "Piercing", short: "Prc", label: "Piercing", color: "#b39c77" },
  { key: "Slashing", short: "Sls", label: "Slashing", color: "#c7a77b" },
  { key: "Physical", short: "Phy", label: "Physical / Weapon", color: "#d3b58b" },
  { key: "Acid", short: "Acd", label: "Acid", color: "#6da85c" },
  { key: "Cold", short: "Cld", label: "Cold", color: "#74a9d8" },
  { key: "Fire", short: "Fir", label: "Fire", color: "#d06a47" },
  { key: "Force", short: "Frc", label: "Force", color: "#9f86d1" },
  { key: "Lightning", short: "Lgt", label: "Lightning", color: "#d9c14e" },
  { key: "Necrotic", short: "Nec", label: "Necrotic", color: "#7d5f8c" },
  { key: "Poison", short: "Poi", label: "Poison", color: "#5b8c4d" },
  { key: "Psychic", short: "Psy", label: "Psychic", color: "#b86bb8" },
  { key: "Radiant", short: "Rad", label: "Radiant", color: "#e0cf86" },
  { key: "Thunder", short: "Thn", label: "Thunder", color: "#6b87c7" },
  { key: "Variable", short: "Var", label: "Variable", color: "#8b8b8b" },
];

const RESOURCE_SECTORS: {
  key: ResourceSectorKey;
  short: string;
  label: string;
  color: string;
}[] = [
  { key: "action", short: "A", label: "Action", color: "#b8863b" },
  { key: "bonus-action", short: "BA", label: "Bonus Action", color: "#ca9451" },
  { key: "reaction", short: "R", label: "Reaction", color: "#d7aa65" },
  { key: "passive-conditional", short: "P/C", label: "Passive / conditional", color: "#a07e4f" },
  { key: "concentration", short: "Conc", label: "Concentration", color: "#7c65ae" },
  { key: "cantrip", short: "Ctr", label: "Cantrip use", color: "#5e9bb2" },
  { key: "slot-1", short: "S1", label: "Spell slot level 1", color: "#8d4f57" },
  { key: "slot-2", short: "S2", label: "Spell slot level 2", color: "#a55b63" },
  { key: "slot-3", short: "S3", label: "Spell slot level 3", color: "#b76870" },
  { key: "slot-4", short: "S4", label: "Spell slot level 4", color: "#c6787f" },
  { key: "slot-5", short: "S5", label: "Spell slot level 5", color: "#d28a8f" },
  { key: "slot-6", short: "S6", label: "Spell slot level 6", color: "#df9ca0" },
  { key: "pact", short: "Pact", label: "Pact Magic slot use", color: "#9357a2" },
  { key: "short-rest", short: "SR", label: "Short-rest reliance", color: "#4f9d88" },
  { key: "long-rest", short: "LR", label: "Long-rest reliance", color: "#67a36c" },
  { key: "class-resource", short: "Cls", label: "Class-specific pool reliance", color: "#4c7da6" },
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

function getOpacity(value: number, maxValue: number, minOpacity = 0.12, maxOpacity = 0.95) {
  if (value <= 0 || maxValue <= 0) {
    return minOpacity;
  }
  return minOpacity + (value / maxValue) * (maxOpacity - minOpacity);
}

function getFilledDotCount(value: number, maxValue: number, slotCount: number) {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }
  return Math.max(1, Math.round((value / maxValue) * slotCount));
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((value / total) * 100)}%`;
}

function getSelectedSpells(selectedSpellIds: string[]): BG3Spell[] {
  return selectedSpellIds
    .map((id) => getSpellById(id))
    .filter((spell): spell is BG3Spell => Boolean(spell));
}

function sortEntriesDescending<T extends string>(
  record: Record<T, number>
): Array<[T, number]> {
  return (Object.entries(record) as Array<[T, number]>)
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0);
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

  const displayBuildName = isUsingMockData
    ? mockDataCircleBuild.buildName
    : buildName;

  const displayCharacterName = isUsingMockData
    ? mockDataCircleBuild.characterName
    : characterName;

  const displayClass = isUsingMockData
    ? mockDataCircleBuild.selectedClass
    : selectedClass;

  const displaySubclass = isUsingMockData
    ? mockDataCircleBuild.selectedSubclass
    : selectedSubclass;

  const displayLevel = isUsingMockData
    ? mockDataCircleBuild.selectedLevel
    : selectedLevel;

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
          counts.long += 1;
          break;
        case "weapon-range":
          counts.long += 1;
          break;
        case "special":
          counts.close += 1;
          break;
        default:
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

    return {
      counts,
      damageTotal,
      utilityTotal,
      total,
    };
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
          return;
        }

        if (type in counts) {
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
  const maxDamageTypeCount = Math.max(...Object.values(damageTypeCounts), 1);
  const maxResourceCount = Math.max(...Object.values(resourceCounts), 1);

  const damageAngle =
    roleData.total > 0
      ? (roleData.damageTotal / roleData.total) * 360
      : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  const topDamageTypes = sortEntriesDescending(damageTypeCounts).slice(0, 6);
  const activeResources = sortEntriesDescending(resourceCounts).slice(0, 8);

  const cx = 220;
  const cy = 220;
  const rangeDotAngles = Array.from({ length: 18 }, (_, index) => (360 / 18) * index);

  return (
    <div className="data-circle-panel">
      <div className="data-circle-frame">
        <svg
          viewBox="0 0 440 440"
          className="data-circle-svg"
          role="img"
          aria-label="Overview Data Circle visualization"
        >
          <defs>
            <radialGradient id="sealGradient" cx="50%" cy="42%" r="68%">
              <stop offset="0%" stopColor="#5f4a2f" />
              <stop offset="75%" stopColor="#2b2117" />
              <stop offset="100%" stopColor="#17120e" />
            </radialGradient>
          </defs>

          <circle cx={cx} cy={cy} r={222} fill="rgba(0,0,0,0.14)" />
          <circle cx={cx} cy={cy} r={220} fill="none" stroke="rgba(216,178,104,0.12)" />
          <circle cx={cx} cy={cy} r={194} fill="none" stroke="rgba(216,178,104,0.08)" />
          <circle cx={cx} cy={cy} r={160} fill="none" stroke="rgba(216,178,104,0.06)" />
          <circle cx={cx} cy={cy} r={126} fill="none" stroke="rgba(216,178,104,0.06)" />

          <text x="26" y="212" className="data-circle-layer-label">
            C2
          </text>
          <text x="26" y="150" className="data-circle-layer-label">
            C3
          </text>
          <text x="26" y="114" className="data-circle-layer-label">
            C4
          </text>
          <text x="26" y="84" className="data-circle-layer-label">
            C5
          </text>

          <circle
            cx={cx}
            cy={cy}
            r={52}
            fill="url(#sealGradient)"
            stroke="rgba(216,178,104,0.5)"
            strokeWidth="2"
          />
          <circle
            cx={cx}
            cy={cy}
            r={45}
            fill="none"
            stroke="rgba(216,178,104,0.18)"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r={39}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />

          {characterLabel ? (
            <text x={cx} y={190} className="data-circle-character-name">
              {characterLabel}
            </text>
          ) : null}

          <text x={cx} y={206} className="data-circle-build-name">
            {buildLabel.length > 18 ? `${buildLabel.slice(0, 18)}…` : buildLabel}
          </text>

          <text x={cx} y={223} className="data-circle-archetype">
            {archetypeLabel.length > 18 ? `${archetypeLabel.slice(0, 18)}…` : archetypeLabel}
          </text>

          <rect
            x={171}
            y={235}
            width={98}
            height={24}
            rx={12}
            fill="rgba(10, 8, 6, 0.72)"
            stroke="rgba(216,178,104,0.36)"
          />
          <text x={cx} y={251} className="data-circle-plate-text">
            L{displayLevel} · {spellCount} spells
          </text>

          {RANGE_BANDS.map((band) => {
            const value = rangeCounts[band.key];
            const filledCount = getFilledDotCount(value, maxRangeCount, rangeDotAngles.length);

            return (
              <g key={band.key}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={band.radius}
                  fill="none"
                  stroke="rgba(216,178,104,0.15)"
                  strokeWidth="1"
                />
                {rangeDotAngles.map((angle, index) => {
                  const { x, y } = polarToCartesian(cx, cy, band.radius, angle);
                  const active = index < filledCount;

                  return (
                    <circle
                      key={`${band.key}-${angle}`}
                      cx={x}
                      cy={y}
                      r={active ? 2.6 : 1.9}
                      fill="#d6ad63"
                      fillOpacity={active ? getOpacity(value, maxRangeCount, 0.35, 0.95) : 0.12}
                    />
                  );
                })}
              </g>
            );
          })}

          {roleData.damageTotal > 0 && (
            <path
              d={describeDonutSegment(cx, cy, 128, 154, roleStartAngle, roleStartAngle + clampedDamageAngle)}
              fill="#8f5449"
              fillOpacity="0.88"
              stroke="rgba(255,255,255,0.06)"
            />
          )}

          {roleData.utilityTotal > 0 && (
            <path
              d={describeDonutSegment(cx, cy, 128, 154, utilityStartAngle, roleStartAngle + 360)}
              fill="#4f766d"
              fillOpacity="0.88"
              stroke="rgba(255,255,255,0.06)"
            />
          )}

          {roleData.total === 0 && (
            <>
              <path
                d={describeDonutSegment(cx, cy, 128, 154, -90, 90)}
                fill="#8f5449"
                fillOpacity="0.18"
                stroke="rgba(255,255,255,0.05)"
              />
              <path
                d={describeDonutSegment(cx, cy, 128, 154, 90, 270)}
                fill="#4f766d"
                fillOpacity="0.18"
                stroke="rgba(255,255,255,0.05)"
              />
            </>
          )}

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

              const innerPoint = polarToCartesian(cx, cy, 128, currentAngle);
              const outerPoint = polarToCartesian(cx, cy, 154, currentAngle);

              return (
                <line
                  key={`damage-divider-${role}`}
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
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

              const innerPoint = polarToCartesian(cx, cy, 128, currentAngle);
              const outerPoint = polarToCartesian(cx, cy, 154, currentAngle);

              return (
                <line
                  key={`utility-divider-${role}`}
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
              );
            });
          })()}

          {(() => {
            const damageMidAngle = roleStartAngle + clampedDamageAngle / 2;
            const utilityMidAngle = utilityStartAngle + (360 - clampedDamageAngle) / 2;
            const damageLabelPos = polarToCartesian(cx, cy, 166, damageMidAngle);
            const utilityLabelPos = polarToCartesian(cx, cy, 166, utilityMidAngle);

            return (
              <>
                <text x={damageLabelPos.x} y={damageLabelPos.y} className="data-circle-ring-label">
                  D
                </text>
                <text x={utilityLabelPos.x} y={utilityLabelPos.y} className="data-circle-ring-label">
                  U
                </text>
              </>
            );
          })()}

          {DAMAGE_TYPES.map((type, index) => {
            const startAngle = -90 + index * (360 / DAMAGE_TYPES.length);
            const endAngle = startAngle + 360 / DAMAGE_TYPES.length;
            const value = damageTypeCounts[type.key];
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelPoint = polarToCartesian(cx, cy, 201, midAngle);

            return (
              <g key={type.key}>
                <path
                  d={describeDonutSegment(cx, cy, 166, 190, startAngle, endAngle)}
                  fill={type.color}
                  fillOpacity={getOpacity(value, maxDamageTypeCount, 0.08, 0.92)}
                  stroke="rgba(16, 12, 9, 0.35)"
                  strokeWidth="1"
                />
                <text x={labelPoint.x} y={labelPoint.y} className="data-circle-mini-label">
                  {type.short}
                </text>
              </g>
            );
          })}

          {RESOURCE_SECTORS.map((sector, index) => {
            const startAngle = -90 + index * (360 / RESOURCE_SECTORS.length);
            const endAngle = startAngle + 360 / RESOURCE_SECTORS.length;
            const value = resourceCounts[sector.key];
            const midAngle = startAngle + (endAngle - startAngle) / 2;
            const labelPoint = polarToCartesian(cx, cy, 228, midAngle);

            return (
              <g key={sector.key}>
                <path
                  d={describeDonutSegment(cx, cy, 198, 222, startAngle, endAngle)}
                  fill={sector.color}
                  fillOpacity={getOpacity(value, maxResourceCount, 0.08, 0.95)}
                  stroke="rgba(12, 10, 8, 0.55)"
                  strokeWidth="1"
                />
                <text x={labelPoint.x} y={labelPoint.y} className="data-circle-micro-label">
                  {sector.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

{isUsingMockData ? (
  <p className="data-circle-empty">
    Mock data is currently being shown because no spells have been selected yet. Once the build has selected spells, the Data Circle will switch to real build data automatically.
  </p>
) : null}

      <div className="data-circle-legend-grid">
        <section className="data-circle-legend-block">
          <h3>Combat Range</h3>
          <div className="data-circle-legend-list">
            {RANGE_BANDS.map((band) => (
              <div key={band.key} className="data-circle-legend-item">
                <div className="data-circle-legend-main">
                  <span className="data-circle-legend-name">{band.label}</span>
                  <span className="data-circle-legend-meta">{band.distance}</span>
                </div>
                <strong>{rangeCounts[band.key]}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="data-circle-legend-block">
          <h3>Role Split</h3>
          <div className="data-circle-role-summary">
            <div className="data-circle-role-pill damage">
              Damage {formatPercent(roleData.damageTotal, roleData.total)}
            </div>
            <div className="data-circle-role-pill utility">
              Utility {formatPercent(roleData.utilityTotal, roleData.total)}
            </div>
          </div>

          <div className="data-circle-legend-list">
            {[...DAMAGE_ROLE_KEYS, ...UTILITY_ROLE_KEYS].map((role) => (
              <div key={role} className="data-circle-legend-item">
                <div className="data-circle-legend-main">
                  <span className="data-circle-legend-name">{ROLE_LABELS[role].label}</span>
                  <span className="data-circle-legend-meta">{ROLE_LABELS[role].short}</span>
                </div>
                <strong>{roleData.counts[role]}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="data-circle-legend-block">
          <h3>Damage Types</h3>
          <div className="data-circle-legend-list">
            {topDamageTypes.length > 0 ? (
              topDamageTypes.map(([key, value]) => {
                const type = DAMAGE_TYPES.find((entry) => entry.key === key)!;
                return (
                  <div key={key} className="data-circle-legend-item">
                    <div className="data-circle-legend-main">
                      <span className="data-circle-swatch" style={{ background: type.color }} />
                      <span className="data-circle-legend-name">{type.label}</span>
                    </div>
                    <strong>{value}</strong>
                  </div>
                );
              })
            ) : (
              <p className="data-circle-muted">No damaging ability types selected yet.</p>
            )}
          </div>
        </section>

        <section className="data-circle-legend-block">
          <h3>Action / Resource Profile</h3>
          <div className="data-circle-legend-list">
            {activeResources.length > 0 ? (
              activeResources.map(([key, value]) => {
                const entry = RESOURCE_SECTORS.find((sector) => sector.key === key)!;
                return (
                  <div key={key} className="data-circle-legend-item">
                    <div className="data-circle-legend-main">
                      <span className="data-circle-swatch" style={{ background: entry.color }} />
                      <span className="data-circle-legend-name">{entry.label}</span>
                    </div>
                    <strong>{value}</strong>
                  </div>
                );
              })
            ) : (
              <p className="data-circle-muted">No action or resource dependencies available yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}