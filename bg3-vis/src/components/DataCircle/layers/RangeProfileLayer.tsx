import type { Dispatch, SetStateAction } from "react";
import type { AbilityRole } from "../../../data/bg3Spells";
import { getSpellById } from "../../../data/bg3Spells";
import { getSpellIcon } from "../../../logic/spellIconLogic";
import {
  DAMAGE_ROLE_KEYS,
  DAMAGE_TYPES,
  RANGE_BANDS,
  UTILITY_ROLE_KEYS,
} from "../dataCircleConfig";
import { CX, CY, polarToCartesian } from "../dataCircleGeometry";
import type {
  DataCircleFocus,
  DataCircleFocusItem,
  LayerRelationshipIndex,
} from "../dataCircleInteraction";
import {
  hasActiveFocus,
  isAbilityRelatedToFocus,
  isRangeRelatedToFocus,
} from "../dataCircleInteraction";
import type { DamageRingKey, RangeBandKey, RoleData } from "../dataCircleTypes";

type RangeProfileLayerProps = {
  rangeCounts: Record<RangeBandKey, number>;
  maxRangeCount: number;
  roleData: RoleData;
  focus: DataCircleFocus;
  setFocus: Dispatch<SetStateAction<DataCircleFocus>>;
  relationshipIndex: LayerRelationshipIndex;
  onToggleSelection?: (focus: DataCircleFocusItem) => void;
  selectedFocuses?: DataCircleFocusItem[];
  showSelectionMarks?: boolean;
};

type RangeMote = {
  key: string;
  abilityId?: string;
  label: string;
  angle: number;
  fillColors: string[];
  glowColors: string[];
  strokeColors: string[];
};

type AbilityAngleTarget = {
  abilityId: string;
  targetAngle: number;
};

const DAMAGE_GLOW_COLOR = "rgba(255,122,82,0.95)";
const UTILITY_GLOW_COLOR = "rgba(93,178,255,0.95)";
const MIXED_GLOW_COLOR = "rgba(176,119,214,0.95)";

const FALLBACK_DOT_FILL = "rgba(176,119,214,1)";
const FALLBACK_DOT_STROKE = "rgba(255,239,185,0.58)";

const ROLE_COLORS: Record<AbilityRole, string> = {
  "single-target-damage": "rgba(255,108,93,1)",
  "area-damage": "rgba(255,143,74,1)",
  control: "rgba(91,154,255,1)",
  "support-buff": "rgba(86,199,255,1)",
  "defense-protection": "rgba(113,181,235,1)",
  healing: "rgba(96,222,218,1)",
  "mobility-positioning": "rgba(126,166,255,1)",
  "narrative-interaction": "rgba(151,188,255,1)",
  "investigation-world-interaction": "rgba(107,214,255,1)",
  summon: "rgba(135,143,255,1)",
};

const ROLE_STROKES: Record<AbilityRole, string> = {
  "single-target-damage": "rgba(255,205,166,0.88)",
  "area-damage": "rgba(255,205,166,0.88)",
  control: "rgba(207,234,255,0.82)",
  "support-buff": "rgba(207,244,255,0.82)",
  "defense-protection": "rgba(207,234,255,0.82)",
  healing: "rgba(206,255,248,0.82)",
  "mobility-positioning": "rgba(214,226,255,0.82)",
  "narrative-interaction": "rgba(222,232,255,0.82)",
  "investigation-world-interaction": "rgba(207,244,255,0.82)",
  summon: "rgba(220,220,255,0.82)",
};

const FALLBACK_ROLE_ANGLES: Record<AbilityRole, number> = {
  "single-target-damage": -130,
  "area-damage": -92,
  control: -26,
  "support-buff": 18,
  "defense-protection": 58,
  healing: 98,
  "mobility-positioning": 138,
  "narrative-interaction": 180,
  "investigation-world-interaction": 220,
  summon: 260,
};

function isAbilitySelected(
  abilityId: string | undefined,
  selectedFocuses: DataCircleFocusItem[] = []
) {
  if (!abilityId) return false;

  return selectedFocuses.some(
    (item) => item.type === "ability" && item.abilityId === abilityId
  );
}

function getRangeDotAngles(count: number) {
  if (count <= 0) return [];

  const blockedArc = 25;
  const availableSweep = 360 - blockedArc;
  const startAngle = blockedArc / 2;
  const step = availableSweep / count;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + step * index + step / 2;
    return normalizeAngle(angle);
  });
}

function getRangeBandIntensity(value: number, maxValue: number) {
  if (value <= 0) {
    return {
      smokeOpacity: 0.018,
      inlayOpacity: 0.026,
      rimOpacity: 0.09,
      moteOpacity: 0,
      moteGlowOpacity: 0,
      moteRadius: 0,
    };
  }

  const ratio = Math.min(1, value / Math.max(1, maxValue));
  const eased = Math.pow(ratio, 0.72);

  return {
    smokeOpacity: 0.025 + eased * 0.07,
    inlayOpacity: 0.045 + eased * 0.12,
    rimOpacity: 0.11 + eased * 0.22,
    moteOpacity: 0.38 + eased * 0.38,
    moteGlowOpacity: 0.035 + eased * 0.16,
    moteRadius: 3.25 + eased * 1.05,
    colorPower: eased,
  };
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

function circularDistance(a: number, b: number) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function getPrimaryRole(roles: AbilityRole[]) {
  if (roles.length <= 0) return undefined;

  const damageRole = roles.find((role) => DAMAGE_ROLE_KEYS.includes(role));
  if (damageRole) return damageRole;

  const utilityRole = roles.find((role) => UTILITY_ROLE_KEYS.includes(role));
  if (utilityRole) return utilityRole;

  return roles[0];
}

function getRoleMidAngles(roleData: RoleData): Record<AbilityRole, number> {
  const result = { ...FALLBACK_ROLE_ANGLES };

  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  function assignAngles(
    keys: AbilityRole[],
    startAngle: number,
    endAngle: number
  ) {
    const total = keys.reduce((sum, key) => sum + roleData.counts[key], 0);
    const sweep = endAngle - startAngle;

    if (total <= 0 || sweep <= 0) return;

    let currentAngle = startAngle;

    keys.forEach((key) => {
      const value = roleData.counts[key];

      if (value <= 0) return;

      const segmentSweep = (value / total) * sweep;
      result[key] = normalizeAngle(currentAngle + segmentSweep / 2);
      currentAngle += segmentSweep;
    });
  }

  assignAngles(
    DAMAGE_ROLE_KEYS,
    roleStartAngle,
    roleStartAngle + clampedDamageAngle
  );

  assignAngles(UTILITY_ROLE_KEYS, utilityStartAngle, roleStartAngle + 360);

  return result;
}

function getDamageTypeVisual(damageType: DamageRingKey) {
  const damageTypeVisual = DAMAGE_TYPES.find((type) => type.key === damageType);

  return {
    fillColor: damageTypeVisual?.color ?? FALLBACK_DOT_FILL,
    strokeColor: damageTypeVisual?.glowColor ?? FALLBACK_DOT_STROKE,
  };
}

function describeCircleSegment(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function SegmentedCircle({
  x,
  y,
  radius,
  colors,
  opacity,
  filter,
}: {
  x: number;
  y: number;
  radius: number;
  colors: string[];
  opacity: number;
  filter?: string;
}) {
  const safeColors = colors.length > 0 ? colors : [FALLBACK_DOT_FILL];

  if (safeColors.length === 1) {
    return (
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={safeColors[0]}
        fillOpacity={opacity}
        filter={filter}
      />
    );
  }

  const segmentAngle = 360 / safeColors.length;

  return (
    <g filter={filter}>
      {safeColors.map((color, index) => {
        const startAngle = -90 + index * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        return (
          <path
            key={`${color}-${index}`}
            d={describeCircleSegment(x, y, radius, startAngle, endAngle)}
            fill={color}
            fillOpacity={opacity}
          />
        );
      })}
    </g>
  );
}

function SegmentedStrokeCircle({
  x,
  y,
  radius,
  colors,
  opacity,
  strokeWidth,
}: {
  x: number;
  y: number;
  radius: number;
  colors: string[];
  opacity: number;
  strokeWidth: number;
}) {
  const safeColors = colors.length > 0 ? colors : [FALLBACK_DOT_STROKE];

  if (safeColors.length === 1) {
    return (
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke={safeColors[0]}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
      />
    );
  }

  const segmentAngle = 360 / safeColors.length;

  return (
    <g>
      {safeColors.map((color, index) => {
        const startAngle = -90 + index * segmentAngle + 1.2;
        const endAngle = -90 + (index + 1) * segmentAngle - 1.2;
        const start = polarToCartesian(x, y, radius, startAngle);
        const end = polarToCartesian(x, y, radius, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return (
          <path
            key={`${color}-${index}`}
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function getMoteVisuals(
  roles: AbilityRole[],
  damageTypes: DamageRingKey[]
): {
  fillColors: string[];
  glowColors: string[];
  strokeColors: string[];
} {
  const hasDamageRole = roles.some((role) => DAMAGE_ROLE_KEYS.includes(role));
  const hasUtilityRole = roles.some((role) => UTILITY_ROLE_KEYS.includes(role));

  const damageVisuals = damageTypes.map(getDamageTypeVisual);

  const damageFillColors = unique(
    damageVisuals.map((visual) => visual.fillColor)
  );

  const damageStrokeColors = unique(
    damageVisuals.map((visual) => visual.strokeColor)
  );

  const utilityRoles = roles.filter((role) => UTILITY_ROLE_KEYS.includes(role));
  const damageRoles = roles.filter((role) => DAMAGE_ROLE_KEYS.includes(role));

  const utilityFillColors = unique(
    utilityRoles.map((role) => ROLE_COLORS[role])
  );

  const utilityStrokeColors = unique(
    utilityRoles.map((role) => ROLE_STROKES[role])
  );

  const damageRoleFillColors = unique(
    damageRoles.map((role) => ROLE_COLORS[role])
  );

  const damageRoleStrokeColors = unique(
    damageRoles.map((role) => ROLE_STROKES[role])
  );

  const fillColors =
    damageFillColors.length > 0
      ? damageFillColors
      : utilityFillColors.length > 0
        ? utilityFillColors
        : damageRoleFillColors.length > 0
          ? damageRoleFillColors
          : [FALLBACK_DOT_FILL];

  const strokeColors =
    damageStrokeColors.length > 0
      ? damageStrokeColors
      : utilityStrokeColors.length > 0
        ? utilityStrokeColors
        : damageRoleStrokeColors.length > 0
          ? damageRoleStrokeColors
          : [FALLBACK_DOT_STROKE];

  const glowColors =
    hasDamageRole && hasUtilityRole
      ? [DAMAGE_GLOW_COLOR, UTILITY_GLOW_COLOR]
      : hasDamageRole
        ? [DAMAGE_GLOW_COLOR]
        : utilityFillColors.length > 1
          ? utilityFillColors
          : hasUtilityRole
            ? [UTILITY_GLOW_COLOR]
            : [MIXED_GLOW_COLOR];

  return {
    fillColors,
    glowColors,
    strokeColors,
  };
}

function assignAnglesToClosestRoleSlots(
  abilityIds: string[],
  slots: number[],
  roleData: RoleData,
  relationshipIndex: LayerRelationshipIndex
): Record<string, number> {
  const roleAngles = getRoleMidAngles(roleData);

  const targets: AbilityAngleTarget[] = abilityIds.map((abilityId) => {
    const roles = relationshipIndex.abilityToRoles[abilityId] ?? [];
    const primaryRole = getPrimaryRole(roles);

    return {
      abilityId,
      targetAngle:
        primaryRole !== undefined
          ? roleAngles[primaryRole]
          : slots[abilityIds.indexOf(abilityId)] ?? 0,
    };
  });

  const availableSlots = [...slots];
  const assignedAngles: Record<string, number> = {};

  targets
    .sort((a, b) => a.targetAngle - b.targetAngle)
    .forEach((target) => {
      let bestSlotIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      availableSlots.forEach((slot, slotIndex) => {
        const distance = circularDistance(target.targetAngle, slot);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestSlotIndex = slotIndex;
        }
      });

      const [assignedSlot] = availableSlots.splice(bestSlotIndex, 1);

      assignedAngles[target.abilityId] =
        assignedSlot ?? slots[abilityIds.indexOf(target.abilityId)] ?? 0;
    });

  return assignedAngles;
}

function getRangeMotes(
  range: RangeBandKey,
  fallbackCount: number,
  roleData: RoleData,
  relationshipIndex: LayerRelationshipIndex
): RangeMote[] {
  const abilityIds = relationshipIndex.rangeToAbilities[range] ?? [];
  const count = Math.max(fallbackCount, abilityIds.length);
  const angles = getRangeDotAngles(count);

  if (abilityIds.length <= 0) {
    return angles.map((angle, index) => ({
      key: `${range}-fallback-${index}`,
      label: `${range} ability ${index + 1}`,
      angle,
      fillColors: [FALLBACK_DOT_FILL],
      glowColors: [MIXED_GLOW_COLOR],
      strokeColors: [FALLBACK_DOT_STROKE],
    }));
  }

  const assignedAngles = assignAnglesToClosestRoleSlots(
    abilityIds,
    angles,
    roleData,
    relationshipIndex
  );

  return abilityIds.map((abilityId) => {
    const roles = relationshipIndex.abilityToRoles[abilityId] ?? [];
    const damageTypes = relationshipIndex.abilityToDamageTypes[abilityId] ?? [];

    const visuals = getMoteVisuals(roles, damageTypes);

    return {
      key: `${range}-${abilityId}`,
      abilityId,
      label: relationshipIndex.abilityNames[abilityId] ?? abilityId,
      angle: assignedAngles[abilityId] ?? 0,
      ...visuals,
    };
  });
}

function getAbilityIconHref(abilityId?: string) {
  if (!abilityId) return undefined;

  const spell = getSpellById(abilityId);

  if (!spell) return undefined;

  return getSpellIcon(spell);
}

function IconMarker({
  x,
  y,
  size,
  mote,
  isRelated,
  focusBoost,
}: {
  x: number;
  y: number;
  size: number;
  mote: RangeMote;
  isRelated: boolean;
  focusBoost: number;
}) {
  const iconHref = getAbilityIconHref(mote.abilityId);
  const radius = (size / 2) * focusBoost;
  const clipId = `range-icon-clip-${mote.key}`;

  if (!iconHref) {
    return (
      <>
        <SegmentedCircle
          x={x}
          y={y}
          radius={radius + 4}
          colors={mote.glowColors}
          opacity={0.24}
          filter="url(#moteGlow)"
        />

        <SegmentedCircle
          x={x}
          y={y}
          radius={radius}
          colors={mote.fillColors}
          opacity={0.92}
        />

        <SegmentedStrokeCircle
          x={x}
          y={y}
          radius={radius}
          colors={mote.strokeColors}
          opacity={0.78}
          strokeWidth={isRelated ? 1.25 : 0.8}
        />
      </>
    );
  }

  return (
    <>
      <SegmentedCircle
        x={x}
        y={y}
        radius={radius + 5.5}
        colors={mote.glowColors}
        opacity={isRelated ? 0.22 : 0.08}
        filter="url(#moteGlow)"
      />

      <circle
        cx={x}
        cy={y}
        r={radius + 2}
        fill="rgba(8,5,9,0.92)"
        stroke={mote.strokeColors[0] ?? FALLBACK_DOT_STROKE}
        strokeOpacity={isRelated ? 0.62 : 0.28}
        strokeWidth={isRelated ? 1.2 : 0.8}
      />

      <defs>
        <clipPath id={clipId}>
          <circle cx={x} cy={y} r={radius} />
        </clipPath>
      </defs>

      <image
        href={iconHref}
        x={x - radius}
        y={y - radius}
        width={radius * 2}
        height={radius * 2}
        opacity={isRelated ? 0.98 : 0.56}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${clipId})`}
      />

      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke="rgba(255,246,218,0.34)"
        strokeWidth="0.65"
      />
    </>
  );
}

export function RangeProfileLayer({
  rangeCounts,
  maxRangeCount,
  roleData,
  focus,
  setFocus,
  relationshipIndex,
  onToggleSelection,
  selectedFocuses = [],
  showSelectionMarks = false,
}: RangeProfileLayerProps) {
  return (
    <>
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
        <circle cx={CX} cy={CY} r="216" fill="rgba(8,6,7,0.96)" />

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

        const motes = getRangeMotes(
          band.key,
          value,
          roleData,
          relationshipIndex
        );

        const intensity = getRangeBandIntensity(value, maxRangeCount);

        const isRelated = isRangeRelatedToFocus(
          band.key,
          focus,
          relationshipIndex
        );

        const active = hasActiveFocus(focus);
        const groupOpacity = active && !isRelated ? 0.28 : 1;
        const focusBoost = active && isRelated ? 1.35 : 1;

        return (
          <g
            key={band.key}
            opacity={groupOpacity}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setFocus({ type: "range", range: band.key })}
          >
            <circle
              cx={CX}
              cy={CY}
              r={middleRadius}
              fill="none"
              stroke="#9b6fd0"
              strokeOpacity={intensity.smokeOpacity * focusBoost}
              strokeWidth={bandWidth + 3}
              filter={value > 0 ? "url(#arcaneSoftGlow)" : undefined}
            />

            <circle
              cx={CX}
              cy={CY}
              r={middleRadius}
              fill="none"
              stroke="#69496f"
              strokeOpacity={intensity.inlayOpacity * focusBoost}
              strokeWidth={bandWidth}
            />

            <circle
              cx={CX}
              cy={CY}
              r={band.innerRadius}
              fill="none"
              stroke="rgba(218,178,104,0.9)"
              strokeOpacity={intensity.rimOpacity * focusBoost}
              strokeWidth={isRelated && active ? 1.35 : 0.85}
            />

            <circle
              cx={CX}
              cy={CY}
              r={band.outerRadius}
              fill="none"
              stroke="rgba(218,178,104,0.9)"
              strokeOpacity={intensity.rimOpacity * focusBoost}
              strokeWidth={isRelated && active ? 1.35 : 0.85}
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

            {motes.map((mote) => {
              const { x, y } = polarToCartesian(
                CX,
                CY,
                middleRadius,
                mote.angle
              );

              const moteIsRelated =
                !mote.abilityId ||
                isAbilityRelatedToFocus(
                  mote.abilityId,
                  focus,
                  relationshipIndex
                );

              const moteIsSelected = isAbilitySelected(
                mote.abilityId,
                selectedFocuses
              );

              const moteOpacity = active && !moteIsRelated ? 0.22 : 1;
              const moteFocusBoost = active && moteIsRelated ? 1.28 : 1;
              const moteRadius =
                intensity.moteRadius + (mote.abilityId ? 0.35 : 0);

              const iconSize = Math.max(14, moteRadius * 3.15);

              return (
                <g
                  key={mote.key}
                  opacity={moteOpacity}
                  style={{ cursor: mote.abilityId ? "pointer" : "default" }}
                  onMouseEnter={(event) => {
                    if (!mote.abilityId) return;

                    event.stopPropagation();
                    setFocus({
                      type: "ability",
                      abilityId: mote.abilityId,
                    });
                  }}
                  onClick={(event) => {
                    if (!mote.abilityId) return;

                    event.stopPropagation();
                    onToggleSelection?.({
                      type: "ability",
                      abilityId: mote.abilityId,
                    });
                  }}
                >
                  <title>{mote.label}</title>

                  {moteIsSelected && showSelectionMarks ? (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r={iconSize * 0.72}
                        fill="rgba(255,232,176,0.14)"
                        stroke="rgba(255,250,232,0.96)"
                        strokeOpacity="0.92"
                        strokeWidth="2"
                        filter="url(#elementalBloom)"
                        pointerEvents="none"
                      />

                      <circle
                        cx={x}
                        cy={y}
                        r={iconSize * 0.55}
                        fill="none"
                        stroke="rgba(255,250,232,0.9)"
                        strokeOpacity="0.88"
                        strokeWidth="1.4"
                        pointerEvents="none"
                      />
                    </>
                  ) : null}

                  <IconMarker
                    x={x}
                    y={y}
                    size={iconSize}
                    mote={mote}
                    isRelated={moteIsRelated}
                    focusBoost={moteFocusBoost}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
}