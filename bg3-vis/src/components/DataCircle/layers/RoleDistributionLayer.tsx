import type { Dispatch, SetStateAction } from "react";
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
  normalizeAngle,
  polarToCartesian,
} from "../dataCircleGeometry";
import type {
  DataCircleFocus,
  DataCircleFocusItem,
  LayerRelationshipIndex,
  RoleGroupKey,
} from "../dataCircleInteraction";
import {
  getFocusedAbilityIds,
  hasActiveFocus,
} from "../dataCircleInteraction";
import type { RoleData } from "../dataCircleTypes";

type RoleDistributionLayerProps = {
  roleData: RoleData;
  focus: DataCircleFocus;
  setFocus: Dispatch<SetStateAction<DataCircleFocus>>;
  relationshipIndex: LayerRelationshipIndex;
  onToggleSelection?: (focus: DataCircleFocusItem) => void;
  selectedFocuses?: DataCircleFocusItem[];
  showSelectionMarks?: boolean;
};

type PrimaryRoleSegment = {
  key: RoleGroupKey;
  label: string;
  shortLabel: string;
  color: string;
  accentColor: string;
  glowColor: string;
  lineColor: string;
  value: number;
  startAngle: number;
  endAngle: number;
  subKeys: AbilityRole[];
};

type SubcategorySegment = {
  key: AbilityRole;
  label: string;
  shortLabel: string;
  value: number;
  startAngle: number;
  endAngle: number;
};

const ROLE_INNER_RADIUS = 232;
const ROLE_OUTER_RADIUS = 272;
const ROLE_MIDDLE_RADIUS = 252;

const SUBCATEGORY_INNER_RADIUS = 235;
const SUBCATEGORY_OUTER_RADIUS = 248;
const SUBCATEGORY_LABEL_RADIUS = 242;

const PRIMARY_LABEL_RADIUS = 260;

const SUBCATEGORY_LABELS: Record<
  AbilityRole,
  {
    label: string;
    shortLabel: string;
  }
> = {
  "single-target-damage": {
    label: "Single-target",
    shortLabel: "ST",
  },
  "area-damage": {
    label: "Area damage",
    shortLabel: "AOE",
  },
  control: {
    label: "Control",
    shortLabel: "CTL",
  },
  "support-buff": {
    label: "Support",
    shortLabel: "SUP",
  },
  "defense-protection": {
    label: "Defense",
    shortLabel: "DEF",
  },
  healing: {
    label: "Healing",
    shortLabel: "HEAL",
  },
  "mobility-positioning": {
    label: "Mobility",
    shortLabel: "MOV",
  },
  "narrative-interaction": {
    label: "Narrative",
    shortLabel: "NAR",
  },
  "investigation-world-interaction": {
    label: "Investigation",
    shortLabel: "INV",
  },
  summon: {
    label: "Summon",
    shortLabel: "SUM",
  },
};

const SUBCATEGORY_SHADE_COLORS: Record<AbilityRole, string> = {
  "single-target-damage": "rgba(255, 108, 93, 1)",
  "area-damage": "rgba(255, 143, 74, 1)",

  control: "rgba(91, 154, 255, 1)",
  "support-buff": "rgba(86, 199, 255, 1)",
  "defense-protection": "rgba(113, 181, 235, 1)",
  healing: "rgba(96, 222, 218, 1)",
  "mobility-positioning": "rgba(126, 166, 255, 1)",
  "narrative-interaction": "rgba(151, 188, 255, 1)",
  "investigation-world-interaction": "rgba(107, 214, 255, 1)",
  summon: "rgba(135, 143, 255, 1)",
};

function getSafeId(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "-");
}

function getFocusItems(focus: DataCircleFocus): DataCircleFocusItem[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
}

function roleBelongsToGroup(role: AbilityRole, roleGroup: RoleGroupKey) {
  if (roleGroup === "damage") return DAMAGE_ROLE_KEYS.includes(role);
  return UTILITY_ROLE_KEYS.includes(role);
}

function getSelectedRoleFilters(focus: DataCircleFocus) {
  return getFocusItems(focus).filter(
    (item): item is
      | Extract<DataCircleFocusItem, { type: "role" }>
      | Extract<DataCircleFocusItem, { type: "roleGroup" }> =>
      item.type === "role" || item.type === "roleGroup"
  );
}

function isRoleSelected(
  role: AbilityRole,
  selectedFocuses: DataCircleFocusItem[] = []
) {
  return selectedFocuses.some((item) => {
    if (item.type === "role") return item.role === role;
    if (item.type === "roleGroup") {
      return roleBelongsToGroup(role, item.roleGroup);
    }

    return false;
  });
}

function isRoleGroupSelected(
  roleGroup: RoleGroupKey,
  selectedFocuses: DataCircleFocusItem[] = []
) {
  return selectedFocuses.some(
    (item) => item.type === "roleGroup" && item.roleGroup === roleGroup
  );
}

function isRoleVisuallyRelated(
  role: AbilityRole,
  focus: DataCircleFocus,
  relationshipIndex: LayerRelationshipIndex
) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length <= 0) return true;

  const selectedRoleFilters = getSelectedRoleFilters(focus);

  if (selectedRoleFilters.length > 0) {
    const directlySelected = selectedRoleFilters.some((focusItem) => {
      if (focusItem.type === "role") {
        return focusItem.role === role;
      }

      return roleBelongsToGroup(role, focusItem.roleGroup);
    });

    if (!directlySelected) return false;

    const filteredAbilityIds = getFocusedAbilityIds(focus, relationshipIndex);
    const roleAbilityIds = relationshipIndex.roleToAbilities[role] ?? [];

    return roleAbilityIds.some((abilityId) =>
      filteredAbilityIds.includes(abilityId)
    );
  }

  const filteredAbilityIds = getFocusedAbilityIds(focus, relationshipIndex);
  const roleAbilityIds = relationshipIndex.roleToAbilities[role] ?? [];

  return roleAbilityIds.some((abilityId) =>
    filteredAbilityIds.includes(abilityId)
  );
}

function isRoleGroupVisuallyRelated(
  roleGroup: RoleGroupKey,
  subRoles: AbilityRole[],
  focus: DataCircleFocus,
  relationshipIndex: LayerRelationshipIndex
) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length <= 0) return true;

  const selectedRoleFilters = getSelectedRoleFilters(focus);

  if (selectedRoleFilters.length > 0) {
    const directlySelected = selectedRoleFilters.some((focusItem) => {
      if (focusItem.type === "roleGroup") {
        return focusItem.roleGroup === roleGroup;
      }

      return subRoles.includes(focusItem.role);
    });

    if (!directlySelected) return false;
  }

  return subRoles.some((role) =>
    isRoleVisuallyRelated(role, focus, relationshipIndex)
  );
}

function getLabelArcPath(
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const normalizedMid = normalizeAngle(midAngle);
  const shouldFlip = normalizedMid > 90 && normalizedMid < 270;

  return shouldFlip
    ? describeTextArc(CX, CY, radius, endAngle, startAngle)
    : describeTextArc(CX, CY, radius, startAngle, endAngle);
}

function getArcLength(radius: number, sweepDegrees: number) {
  return (Math.PI * radius * Math.max(0, sweepDegrees)) / 180;
}

function getApproxTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.56;
}

function getSubcategorySegments(
  keys: AbilityRole[],
  counts: Record<AbilityRole, number>,
  startAngle: number,
  endAngle: number
): SubcategorySegment[] {
  const total = keys.reduce((sum, key) => sum + counts[key], 0);
  const sweep = endAngle - startAngle;

  if (total <= 0 || sweep <= 0) return [];

  let currentAngle = startAngle;

  return keys.flatMap((key) => {
    const value = counts[key];

    if (value <= 0) {
      return [];
    }

    const segmentSweep = (value / total) * sweep;

    const segment: SubcategorySegment = {
      key,
      value,
      startAngle: currentAngle,
      endAngle: currentAngle + segmentSweep,
      ...SUBCATEGORY_LABELS[key],
    };

    currentAngle += segmentSweep;

    return [segment];
  });
}

function getPrimaryLabel(segment: PrimaryRoleSegment) {
  const sweep = segment.endAngle - segment.startAngle;
  const arcLength = getArcLength(PRIMARY_LABEL_RADIUS, sweep);

  const fullLabel = segment.label.toUpperCase();
  const shortLabel = segment.shortLabel;

  const fullLabelWidth = getApproxTextWidth(fullLabel, 9.6);
  const shortLabelWidth = getApproxTextWidth(shortLabel, 8.8);

  if (arcLength >= fullLabelWidth * 1.04) {
    return fullLabel;
  }

  if (arcLength >= shortLabelWidth * 1.02) {
    return shortLabel;
  }

  return "";
}

function getSubcategoryLabel(segment: SubcategorySegment) {
  const sweep = segment.endAngle - segment.startAngle;
  const arcLength = getArcLength(SUBCATEGORY_LABEL_RADIUS, sweep);

  const fullLabel = segment.label.toUpperCase();
  const shortLabel = segment.shortLabel;

  const fullLabelWidth = getApproxTextWidth(fullLabel, 7.4);
  const shortLabelWidth = getApproxTextWidth(shortLabel, 8.2);

  if (arcLength >= fullLabelWidth * 1.02) {
    return fullLabel;
  }

  if (arcLength >= shortLabelWidth * 1.04) {
    return shortLabel;
  }

  return "";
}

function getSubcategoryFontSize(label: string) {
  if (label.length >= 14) return 8.4;
  if (label.length >= 10) return 8.8;
  if (label.length >= 6) return 9.2;
  return 8.8;
}

function getSubcategoryLetterSpacing(label: string) {
  if (label.length >= 14) return "0.005em";
  if (label.length >= 10) return "0.018em";
  if (label.length >= 6) return "0.03em";
  return "0.055em";
}

function getSubcategoryShadeColor(subcategoryKey: AbilityRole) {
  return SUBCATEGORY_SHADE_COLORS[subcategoryKey];
}

function getSubcategoryFillOpacity(
  index: number,
  totalSubcategories: number,
  roleDataTotal: number
) {
  if (roleDataTotal <= 0) return 0.1;
  if (totalSubcategories <= 1) return 0.42;

  return index % 2 === 0 ? 0.48 : 0.38;
}

export function RoleDistributionLayer({
  roleData,
  focus,
  setFocus,
  relationshipIndex,
  onToggleSelection,
  selectedFocuses = [],
  showSelectionMarks = false,
}: RoleDistributionLayerProps) {
  const damageAngle =
    roleData.total > 0 ? (roleData.damageTotal / roleData.total) * 360 : 180;

  const roleStartAngle = -90;
  const clampedDamageAngle = Math.max(0.001, Math.min(359.999, damageAngle));
  const utilityStartAngle = roleStartAngle + clampedDamageAngle;

  const roleSegments: PrimaryRoleSegment[] =
    roleData.total > 0
      ? [
          {
            key: "damage",
            ...ROLE_VISUALS.damage,
            value: roleData.damageTotal,
            startAngle: roleStartAngle,
            endAngle: roleStartAngle + clampedDamageAngle,
            subKeys: DAMAGE_ROLE_KEYS,
          },
          {
            key: "utility",
            ...ROLE_VISUALS.utility,
            value: roleData.utilityTotal,
            startAngle: utilityStartAngle,
            endAngle: roleStartAngle + 360,
            subKeys: UTILITY_ROLE_KEYS,
          },
        ]
      : [
          {
            key: "damage",
            ...ROLE_VISUALS.damage,
            value: 0,
            startAngle: -90,
            endAngle: 90,
            subKeys: DAMAGE_ROLE_KEYS,
          },
          {
            key: "utility",
            ...ROLE_VISUALS.utility,
            value: 0,
            startAngle: 90,
            endAngle: 270,
            subKeys: UTILITY_ROLE_KEYS,
          },
        ];

  const activeFocus = hasActiveFocus(focus);

  return (
    <g className="data-circle-role-sigil">
      <circle
        cx={CX}
        cy={CY}
        r={ROLE_MIDDLE_RADIUS}
        fill="none"
        stroke="rgba(6,5,7,0.98)"
        strokeWidth="46"
      />

      <circle
        cx={CX}
        cy={CY}
        r={ROLE_OUTER_RADIUS + 3}
        fill="none"
        stroke="rgba(230,188,112,0.17)"
        strokeWidth="1.1"
      />

      <circle
        cx={CX}
        cy={CY}
        r={ROLE_INNER_RADIUS - 3}
        fill="none"
        stroke="rgba(230,188,112,0.14)"
        strokeWidth="1"
      />

      <circle
        cx={CX}
        cy={CY}
        r={ROLE_MIDDLE_RADIUS}
        fill="none"
        stroke="rgba(255,238,199,0.04)"
        strokeWidth="34"
        strokeDasharray="1 12"
      />

      {roleSegments.map((segment) => {
        const sweep = segment.endAngle - segment.startAngle;

        if (sweep <= 0.2 || (roleData.total > 0 && segment.value <= 0)) {
          return null;
        }

        const outerGap = Math.min(1.2, sweep * 0.06);
        const visualStartAngle = segment.startAngle + outerGap;
        const visualEndAngle = segment.endAngle - outerGap;

        const primaryLabel = getPrimaryLabel(segment);
        const primaryLabelPathId = `role-primary-label-${segment.key}`;

        const subcategorySegments = getSubcategorySegments(
          segment.subKeys,
          roleData.counts,
          visualStartAngle,
          visualEndAngle
        );

        const primarySegmentIsRelated = isRoleGroupVisuallyRelated(
          segment.key,
          segment.subKeys,
          focus,
          relationshipIndex
        );

        const primaryIsSelected = isRoleGroupSelected(
          segment.key,
          selectedFocuses
        );

        const primaryOpacity = activeFocus && !primarySegmentIsRelated ? 0.34 : 1;
        const primaryFocusBoost =
          activeFocus && primarySegmentIsRelated ? 1.14 : 1;
        const primarySelectionBoost =
          primaryIsSelected && showSelectionMarks ? 1.14 : 1;

        const primaryFocus: DataCircleFocusItem = {
          type: "roleGroup",
          roleGroup: segment.key,
        };

        return (
          <g key={segment.key} opacity={primaryOpacity}>
            <title>
              {`${segment.label}: ${segment.value} ${
                segment.value === 1 ? "ability" : "abilities"
              }`}
            </title>

            {primaryIsSelected && showSelectionMarks ? (
              <path
                d={describeDonutSegment(
                  CX,
                  CY,
                  ROLE_OUTER_RADIUS + 5,
                  ROLE_OUTER_RADIUS + 14,
                  visualStartAngle - 0.35,
                  visualEndAngle + 0.35
                )}
                fill={segment.accentColor}
                fillOpacity={0.2}
                stroke="rgba(255,250,232,0.98)"
                strokeOpacity={0.82}
                strokeWidth={1.7}
                filter="url(#elementalBloom)"
                pointerEvents="none"
              />
            ) : null}

            <path
              d={describeTextArc(
                CX,
                CY,
                ROLE_MIDDLE_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill="none"
              stroke={segment.glowColor}
              strokeOpacity={
                (roleData.total > 0 ? 0.1 : 0.04) *
                primaryFocusBoost *
                primarySelectionBoost
              }
              strokeWidth="48"
              strokeLinecap="butt"
              filter="url(#elementalBloom)"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setFocus(primaryFocus)}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelection?.(primaryFocus);
              }}
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                ROLE_INNER_RADIUS,
                ROLE_OUTER_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill={segment.color}
              fillOpacity={
                (roleData.total > 0 ? 0.38 : 0.16) *
                primaryFocusBoost *
                primarySelectionBoost
              }
              stroke={
                primaryIsSelected && showSelectionMarks
                  ? "rgba(255,250,232,0.98)"
                  : segment.accentColor
              }
              strokeOpacity={
                primaryIsSelected && showSelectionMarks
                  ? 0.9
                  : (roleData.total > 0 ? 0.26 : 0.1) * primaryFocusBoost
              }
              strokeWidth={
                primaryIsSelected && showSelectionMarks
                  ? 2.2
                  : activeFocus && primarySegmentIsRelated
                    ? 1.35
                    : 1
              }
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setFocus(primaryFocus)}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelection?.(primaryFocus);
              }}
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                ROLE_OUTER_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill="none"
              stroke={
                primaryIsSelected && showSelectionMarks
                  ? "rgba(255,250,232,1)"
                  : segment.accentColor
              }
              strokeOpacity={
                primaryIsSelected && showSelectionMarks
                  ? 0.86
                  : 0.3 * primaryFocusBoost
              }
              strokeWidth={
                primaryIsSelected && showSelectionMarks
                  ? 3.1
                  : activeFocus && primarySegmentIsRelated
                    ? 2
                    : 1.5
              }
              strokeLinecap="round"
              pointerEvents="none"
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                ROLE_INNER_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill="none"
              stroke={segment.accentColor}
              strokeOpacity={0.16 * primaryFocusBoost}
              strokeWidth="1.1"
              strokeLinecap="round"
              pointerEvents="none"
            />

            {subcategorySegments.map((subcategory, index) => {
              const subSweep = subcategory.endAngle - subcategory.startAngle;
              const subGap = Math.min(0.4, subSweep * 0.08);
              const subStartAngle = subcategory.startAngle + subGap;
              const subEndAngle = subcategory.endAngle - subGap;
              const subMidAngle = subcategory.startAngle + subSweep / 2;
              const subLabel = getSubcategoryLabel(subcategory);
              const subcategoryShadeColor = getSubcategoryShadeColor(
                subcategory.key
              );

              const subcategoryIsRelated = isRoleVisuallyRelated(
                subcategory.key,
                focus,
                relationshipIndex
              );

              const subcategoryIsSelected = isRoleSelected(
                subcategory.key,
                selectedFocuses
              );

              const subcategoryOpacity =
                activeFocus && !subcategoryIsRelated ? 0.3 : 1;

              const subcategoryFocusBoost =
                activeFocus && subcategoryIsRelated ? 1.32 : 1;

              const subcategorySelectionBoost =
                subcategoryIsSelected && showSelectionMarks ? 1.16 : 1;

              const subLabelPathId = `role-sub-label-${segment.key}-${getSafeId(
                subcategory.key
              )}`;

              const markerPoint = polarToCartesian(
                CX,
                CY,
                SUBCATEGORY_LABEL_RADIUS,
                subMidAngle
              );

              const subcategoryFocus: DataCircleFocusItem = {
                type: "role",
                role: subcategory.key,
              };

              return (
                <g
                  key={`${segment.key}-${subcategory.key}`}
                  opacity={subcategoryOpacity}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(event) => {
                    event.stopPropagation();
                    setFocus(subcategoryFocus);
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSelection?.(subcategoryFocus);
                  }}
                >
                  <title>
                    {`${subcategory.label}: ${subcategory.value} ${
                      subcategory.value === 1 ? "ability" : "abilities"
                    }`}
                  </title>

                  {subcategoryIsSelected && showSelectionMarks ? (
                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        SUBCATEGORY_INNER_RADIUS - 5,
                        SUBCATEGORY_OUTER_RADIUS + 5,
                        subStartAngle - 0.3,
                        subEndAngle + 0.3
                      )}
                      fill={subcategoryShadeColor}
                      fillOpacity={0.26}
                      stroke="rgba(255,250,232,0.98)"
                      strokeOpacity={0.86}
                      strokeWidth={1.9}
                      filter="url(#elementalBloom)"
                      pointerEvents="none"
                    />
                  ) : null}

                  <path
                    d={describeDonutSegment(
                      CX,
                      CY,
                      SUBCATEGORY_INNER_RADIUS,
                      SUBCATEGORY_OUTER_RADIUS,
                      subStartAngle,
                      subEndAngle
                    )}
                    fill={subcategoryShadeColor}
                    fillOpacity={
                      getSubcategoryFillOpacity(
                        index,
                        subcategorySegments.length,
                        roleData.total
                      ) *
                      subcategoryFocusBoost *
                      subcategorySelectionBoost
                    }
                    stroke={
                      subcategoryIsSelected && showSelectionMarks
                        ? "rgba(255,250,232,0.98)"
                        : subcategoryShadeColor
                    }
                    strokeOpacity={
                      subcategoryIsSelected && showSelectionMarks
                        ? 0.9
                        : 0.42 * subcategoryFocusBoost
                    }
                    strokeWidth={
                      subcategoryIsSelected && showSelectionMarks
                        ? 2.25
                        : activeFocus && subcategoryIsRelated
                          ? 1.25
                          : 0.75
                    }
                  />

                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      SUBCATEGORY_LABEL_RADIUS,
                      subStartAngle + 0.2,
                      subEndAngle - 0.2
                    )}
                    fill="none"
                    stroke={
                      subcategoryIsSelected && showSelectionMarks
                        ? "rgba(255,250,232,1)"
                        : subcategoryShadeColor
                    }
                    strokeOpacity={
                      subcategoryIsSelected && showSelectionMarks
                        ? 0.9
                        : 0.45 * subcategoryFocusBoost
                    }
                    strokeWidth={
                      subcategoryIsSelected && showSelectionMarks
                        ? 2.7
                        : activeFocus && subcategoryIsRelated
                          ? 1.75
                          : 1.15
                    }
                    strokeLinecap="round"
                  />

                  <circle
                    cx={markerPoint.x}
                    cy={markerPoint.y}
                    r={
                      subcategoryIsSelected && showSelectionMarks
                        ? 2.3
                        : subSweep >= 42
                          ? 1.55
                          : 1.05
                    }
                    fill={
                      subcategoryIsSelected && showSelectionMarks
                        ? "rgba(255,250,232,1)"
                        : subcategoryShadeColor
                    }
                    fillOpacity={
                      activeFocus && subcategoryIsRelated ? 1 : 0.82
                    }
                    stroke="rgba(5,4,6,0.86)"
                    strokeWidth="0.7"
                  />

                  {subLabel ? (
                    <>
                      <path
                        id={subLabelPathId}
                        d={getLabelArcPath(
                          SUBCATEGORY_LABEL_RADIUS,
                          subStartAngle + 0.45,
                          subEndAngle - 0.45
                        )}
                        fill="none"
                        stroke="none"
                      />

                      <text
                        fontSize={getSubcategoryFontSize(subLabel)}
                        fontWeight="850"
                        letterSpacing={getSubcategoryLetterSpacing(subLabel)}
                        fill={
                          subcategoryIsSelected && showSelectionMarks
                            ? "rgba(255,250,232,0.98)"
                            : activeFocus && subcategoryIsRelated
                              ? "rgba(255,250,232,0.98)"
                              : "rgba(255,244,218,0.84)"
                        }
                        paintOrder="stroke"
                        stroke="rgba(4,3,5,0.92)"
                        strokeWidth={
                          subcategoryIsSelected && showSelectionMarks
                            ? 2.75
                            : activeFocus && subcategoryIsRelated
                              ? 2.25
                              : 1.85
                        }
                        dominantBaseline="middle"
                      >
                        <textPath
                          href={`#${subLabelPathId}`}
                          startOffset="50%"
                          textAnchor="middle"
                          dy="0.32em"
                        >
                          {subLabel}
                        </textPath>
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}

            {subcategorySegments.slice(1).map((subcategory) => {
              const angle = subcategory.startAngle;
              const inner = polarToCartesian(CX, CY, ROLE_INNER_RADIUS, angle);
              const outer = polarToCartesian(CX, CY, ROLE_OUTER_RADIUS, angle);

              return (
                <line
                  key={`${segment.key}-divider-${subcategory.key}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(255,244,218,0.68)"
                  strokeOpacity="0.42"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              );
            })}

            {primaryLabel ? (
              <>
                <path
                  id={primaryLabelPathId}
                  d={getLabelArcPath(
                    PRIMARY_LABEL_RADIUS,
                    visualStartAngle + 1.4,
                    visualEndAngle - 1.4
                  )}
                  fill="none"
                  stroke="none"
                />

                <text
                  fontSize={sweep >= 44 ? 10.6 : 8.8}
                  fontWeight="950"
                  letterSpacing="0.085em"
                  fill={
                    primaryIsSelected && showSelectionMarks
                      ? "rgba(255,250,232,0.98)"
                      : activeFocus && primarySegmentIsRelated
                        ? "rgba(255,250,232,0.98)"
                        : "rgba(255,244,218,0.96)"
                  }
                  paintOrder="stroke"
                  stroke="rgba(4,3,5,0.94)"
                  strokeWidth={
                    primaryIsSelected && showSelectionMarks
                      ? 3.5
                      : activeFocus && primarySegmentIsRelated
                        ? 3.1
                        : 2.7
                  }
                  dominantBaseline="middle"
                  filter="url(#fineInkShadow)"
                  pointerEvents="none"
                >
                  <textPath
                    href={`#${primaryLabelPathId}`}
                    startOffset="50%"
                    textAnchor="middle"
                    dy="0.34em"
                  >
                    {primaryLabel}
                  </textPath>
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}