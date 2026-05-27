import type { AbilityRole } from "../../../data/bg3Spells";
import {
  DAMAGE_ROLE_KEYS,
  DAMAGE_TYPES,
  RANGE_BANDS,
  UTILITY_ROLE_KEYS,
} from "../dataCircleConfig";
import {
  CX,
  CY,
  describeTextArc,
  polarToCartesian,
} from "../dataCircleGeometry";
import type {
  DataCircleFocus,
  DataCircleFocusItem,
  DprRound,
  LayerRelationshipIndex,
} from "../dataCircleInteraction";
import { getFocusedAbilityIds } from "../dataCircleInteraction";
import type { DamageRingKey, RangeBandKey, RoleData } from "../dataCircleTypes";

type ConnectivityLayerProps = {
  focus: DataCircleFocus;
  relationshipIndex: LayerRelationshipIndex;
  roleData: RoleData;
  damageTypeCounts: Record<DamageRingKey, number>;
  damageTypeTotal: number;
  rounds: DprRound[];
};

type ConnectorPoint = {
  angle: number;
  radius: number;
};

const ROLE_RADIUS = 242;
const DAMAGE_RADIUS = 314;
const RANGE_RADIUS = 206;
const DPR_RADIUS = 440;

function getFocusItems(focus: DataCircleFocus): DataCircleFocusItem[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
}

function focusIncludesType(
  focus: DataCircleFocus,
  type: DataCircleFocusItem["type"]
) {
  return getFocusItems(focus).some((item) => item.type === type);
}

function getSegmentMidAngles(
  keys: AbilityRole[],
  counts: Record<AbilityRole, number>,
  startAngle: number,
  endAngle: number
) {
  const result: Partial<Record<AbilityRole, number>> = {};
  const total = keys.reduce((sum, key) => sum + counts[key], 0);
  const sweep = endAngle - startAngle;

  if (total <= 0 || sweep <= 0) return result;

  let currentAngle = startAngle;

  keys.forEach((key) => {
    const value = counts[key];

    if (value <= 0) return;

    const segmentSweep = (value / total) * sweep;
    result[key] = currentAngle + segmentSweep / 2;
    currentAngle += segmentSweep;
  });

  return result;
}

function getRoleMidAngles(roleData: RoleData) {
  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  return {
    ...getSegmentMidAngles(
      DAMAGE_ROLE_KEYS,
      roleData.counts,
      roleStartAngle,
      roleStartAngle + clampedDamageAngle
    ),
    ...getSegmentMidAngles(
      UTILITY_ROLE_KEYS,
      roleData.counts,
      utilityStartAngle,
      roleStartAngle + 360
    ),
  };
}

function getDamageTypeMidAngles(
  damageTypeCounts: Record<DamageRingKey, number>,
  damageTypeTotal: number
) {
  const result: Partial<Record<DamageRingKey, number>> = {};

  if (damageTypeTotal <= 0) return result;

  let currentAngle = -90;

  DAMAGE_TYPES.forEach((type) => {
    const value = damageTypeCounts[type.key];

    if (value <= 0) return;

    const sweep = (value / damageTypeTotal) * 360;
    result[type.key] = currentAngle + sweep / 2;
    currentAngle += sweep;
  });

  return result;
}

function getRangeRepresentativeAngles() {
  const result: Partial<Record<RangeBandKey, number>> = {};

  RANGE_BANDS.forEach((band, index) => {
    result[band.key] = -90 + index * (360 / RANGE_BANDS.length);
  });

  return result;
}

function getRoundMidAngles(rounds: DprRound[]) {
  const safeRounds = rounds.length > 0 ? rounds : [{ round: 1, damage: 0 }];
  const sectorAngle = 360 / safeRounds.length;

  return Object.fromEntries(
    safeRounds.map((round, index) => [
      round.round,
      -90 + index * sectorAngle + sectorAngle / 2,
    ])
  ) as Record<number, number>;
}

function getConnectionPath(from: ConnectorPoint, to: ConnectorPoint) {
  const start = polarToCartesian(CX, CY, from.radius, from.angle);
  const end = polarToCartesian(CX, CY, to.radius, to.angle);

  const controlA = polarToCartesian(
    CX,
    CY,
    (from.radius + to.radius) / 2,
    from.angle
  );

  const controlB = polarToCartesian(
    CX,
    CY,
    (from.radius + to.radius) / 2,
    to.angle
  );

  return `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`;
}

function getAbilityConnectorColor(index: number) {
  const colors = [
    "rgba(118,190,255,0.72)",
    "rgba(255,158,112,0.72)",
    "rgba(151,220,190,0.72)",
    "rgba(198,171,255,0.72)",
    "rgba(255,218,132,0.72)",
  ];

  return colors[index % colors.length];
}

export function ConnectivityLayer({
  focus,
  relationshipIndex,
  roleData,
  damageTypeCounts,
  damageTypeTotal,
  rounds,
}: ConnectivityLayerProps) {
  if (!focus) return null;

  const focusedAbilityIds = getFocusedAbilityIds(
    focus,
    relationshipIndex
  ).slice(0, 12);

  if (focusedAbilityIds.length === 0) return null;

  const roleMidAngles = getRoleMidAngles(roleData);
  const damageMidAngles = getDamageTypeMidAngles(
    damageTypeCounts,
    damageTypeTotal
  );
  const rangeAngles = getRangeRepresentativeAngles();
  const roundAngles = getRoundMidAngles(rounds);

  const paths = focusedAbilityIds.flatMap((abilityId, abilityIndex) => {
    const roles = relationshipIndex.abilityToRoles[abilityId] ?? [];
    const damageTypes = relationshipIndex.abilityToDamageTypes[abilityId] ?? [];
    const ranges = relationshipIndex.abilityToRanges[abilityId] ?? [];
    const abilityRounds = relationshipIndex.abilityToRounds[abilityId] ?? [];

    const points: ConnectorPoint[] = [];

    roles.slice(0, 1).forEach((role) => {
      const angle = roleMidAngles[role];

      if (typeof angle === "number") {
        points.push({ angle, radius: ROLE_RADIUS });
      }
    });

    damageTypes.slice(0, 1).forEach((damageType) => {
      const angle = damageMidAngles[damageType];

      if (typeof angle === "number") {
        points.push({ angle, radius: DAMAGE_RADIUS });
      }
    });

    ranges.slice(0, 1).forEach((range) => {
      const angle = rangeAngles[range];

      if (typeof angle === "number") {
        const band = RANGE_BANDS.find((item) => item.key === range);
        const radius = band
          ? (band.innerRadius + band.outerRadius) / 2
          : RANGE_RADIUS;

        points.push({ angle, radius });
      }
    });

    abilityRounds.slice(0, 2).forEach((round) => {
      const angle = roundAngles[round];

      if (typeof angle === "number") {
        points.push({ angle, radius: DPR_RADIUS });
      }
    });

    if (points.length < 2) return [];

    return points.slice(0, -1).map((point, index) => ({
      key: `${abilityId}-${index}`,
      d: getConnectionPath(point, points[index + 1]),
      color: getAbilityConnectorColor(abilityIndex),
    }));
  });

  return (
    <g className="data-circle-connectivity-layer" pointerEvents="none">
      {paths.map((path) => (
        <path
          key={path.key}
          d={path.d}
          fill="none"
          stroke={path.color}
          strokeOpacity="0.36"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeDasharray="4 7"
          filter="url(#elementalBloom)"
        />
      ))}

      {paths.map((path) => (
        <path
          key={`${path.key}-core`}
          d={path.d}
          fill="none"
          stroke={path.color}
          strokeOpacity="0.72"
          strokeWidth="0.55"
          strokeLinecap="round"
        />
      ))}

      {focusIncludesType(focus, "round") ? (
        <path
          d={describeTextArc(CX, CY, DPR_RADIUS + 8, -90, 270)}
          fill="none"
          stroke="rgba(255,244,218,0.08)"
          strokeWidth="1"
          strokeDasharray="2 10"
        />
      ) : null}
    </g>
  );
}