import type { AbilityRole } from "../../../data/bg3Spells";
import {
  DAMAGE_ROLE_KEYS,
  ROLE_VISUALS,
  UTILITY_ROLE_KEYS,
} from "../dataCircleConfig";
import {
  CX,
  CY,
  describeDonutSegment,
  describeTextArc,
  getArcTextTransform,
  polarToCartesian,
} from "../dataCircleGeometry";
import type { RoleData } from "../dataCircleTypes";

type RoleDistributionLayerProps = {
  roleData: RoleData;
};

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

export function RoleDistributionLayer({ roleData }: RoleDistributionLayerProps) {
  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

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
        const percentage =
          roleData.total > 0 ? Math.round((segment.value / roleData.total) * 100) : 50;
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
  );
}
