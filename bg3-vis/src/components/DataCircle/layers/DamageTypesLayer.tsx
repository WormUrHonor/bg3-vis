import type { Dispatch, SetStateAction } from "react";
import acidIcon from "../../../assets/Damage Types/Acid_Damage_Icon.png";
import bludgeoningIcon from "../../../assets/Damage Types/Bludgeoning_Damage_Icon.png";
import coldIcon from "../../../assets/Damage Types/Cold_Damage_Icon.png";
import fireIcon from "../../../assets/Damage Types/Fire_Damage_Icon.png";
import forceIcon from "../../../assets/Damage Types/Force_Damage_Icon.png";
import lightningIcon from "../../../assets/Damage Types/Lightning_Damage_Icon.png";
import necroticIcon from "../../../assets/Damage Types/Necrotic_Damage_Icon.png";
import piercingIcon from "../../../assets/Damage Types/Piercing_Damage_Icon.png";
import poisonIcon from "../../../assets/Damage Types/Poison_Damage_Icon.png";
import psychicIcon from "../../../assets/Damage Types/Psychic_Damage_Icon.png";
import radiantIcon from "../../../assets/Damage Types/Radiant_Damage_Icon.png";
import slashingIcon from "../../../assets/Damage Types/Slashing_Damage_Icon.png";
import thunderIcon from "../../../assets/Damage Types/Thunder_Damage_Icon.png";
import weaponIcon from "../../../assets/Damage Types/weapon.webp";
import { DAMAGE_TYPES } from "../dataCircleConfig";
import {
  CX,
  CY,
  describeDonutSegment,
  describeTextArc,
  getArcTextTransform,
  polarToCartesian,
} from "../dataCircleGeometry";
import type {
  DataCircleFocus,
  DataCircleFocusItem,
  LayerRelationshipIndex,
} from "../dataCircleInteraction";
import {
  getFocusedAbilityIds,
  hasActiveFocus,
} from "../dataCircleInteraction";
import type { DamageRingKey } from "../dataCircleTypes";

type DamageTypesLayerProps = {
  damageTypeCounts: Record<DamageRingKey, number>;
  damageTypeTotal: number;
  focus: DataCircleFocus;
  setFocus: Dispatch<SetStateAction<DataCircleFocus>>;
  relationshipIndex: LayerRelationshipIndex;
  onToggleSelection?: (focus: DataCircleFocusItem) => void;
  selectedFocuses?: DataCircleFocusItem[];
  showSelectionMarks?: boolean;
};

type DamageLabelMode = "full" | "short" | "hidden";

type DamageDisplayPlan = {
  labelMode: DamageLabelMode;
  labelText: string;
  iconAngles: number[];
  iconSize: number;
  iconRadius: number;
};

const DAMAGE_RING_INNER_RADIUS = 292;
const DAMAGE_RING_OUTER_RADIUS = 336;
const DAMAGE_RING_LABEL_RADIUS = 314;

const DAMAGE_ICON_RADIUS = 314;
const DAMAGE_ICON_TEXT_GAP = 8;
const DAMAGE_SEGMENT_EDGE_PADDING = 3.4;

const FULL_LABEL_FONT_SIZE = 9.8;
const SHORT_LABEL_FONT_SIZE = 10.8;

const DAMAGE_TYPE_ICONS: Partial<Record<DamageRingKey, string>> = {
  Acid: acidIcon,
  Bludgeoning: bludgeoningIcon,
  Cold: coldIcon,
  Fire: fireIcon,
  Force: forceIcon,
  Lightning: lightningIcon,
  Necrotic: necroticIcon,
  Piercing: piercingIcon,
  Poison: poisonIcon,
  Psychic: psychicIcon,
  Radiant: radiantIcon,
  Slashing: slashingIcon,
  Thunder: thunderIcon,
  Weapon : weaponIcon,
  Variable: forceIcon,
};

function getFocusItems(focus: DataCircleFocus): DataCircleFocusItem[] {
  if (!focus) return [];
  return Array.isArray(focus) ? focus : [focus];
}

function getSelectedDamageTypes(focus: DataCircleFocus) {
  return getFocusItems(focus)
    .filter(
      (item): item is Extract<DataCircleFocusItem, { type: "damageType" }> =>
        item.type === "damageType"
    )
    .map((item) => item.damageType);
}

function isDamageTypeSelected(
  damageType: DamageRingKey,
  selectedFocuses: DataCircleFocusItem[] = []
) {
  return selectedFocuses.some(
    (item) => item.type === "damageType" && item.damageType === damageType
  );
}

function isDamageTypeVisuallyRelated(
  damageType: DamageRingKey,
  focus: DataCircleFocus,
  relationshipIndex: LayerRelationshipIndex
) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length <= 0) return true;

  const selectedDamageTypes = getSelectedDamageTypes(focus);
  const filteredAbilityIds = getFocusedAbilityIds(focus, relationshipIndex);
  const damageTypeAbilityIds =
    relationshipIndex.damageTypeToAbilities[damageType] ?? [];

  if (selectedDamageTypes.length > 0) {
    if (!selectedDamageTypes.includes(damageType)) return false;

    return damageTypeAbilityIds.some((abilityId) =>
      filteredAbilityIds.includes(abilityId)
    );
  }

  return damageTypeAbilityIds.some((abilityId) =>
    filteredAbilityIds.includes(abilityId)
  );
}

function getArcLength(radius: number, sweepDegrees: number) {
  return (Math.PI * radius * Math.max(0, sweepDegrees)) / 180;
}

function getAngleForArcLength(radius: number, arcLength: number) {
  return (arcLength / (Math.PI * radius)) * 180;
}

function getApproxTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.58;
}

function getIconSize(sweep: number) {
  if (sweep >= 72) return 25;
  if (sweep >= 44) return 23;
  if (sweep >= 24) return 21;
  return 19;
}

function getDamageLabelMode(label: string, shortLabel: string, sweep: number) {
  const iconSize = getIconSize(sweep);
  const availableArc = getArcLength(
    DAMAGE_RING_LABEL_RADIUS,
    Math.max(0, sweep - DAMAGE_SEGMENT_EDGE_PADDING * 2)
  );

  const reservedForSideIcons = iconSize * 2 + DAMAGE_ICON_TEXT_GAP * 2;
  const textArc = Math.max(0, availableArc - reservedForSideIcons);

  const fullLabel = label.toUpperCase();
  const shortText = shortLabel;

  const fullTextWidth = getApproxTextWidth(fullLabel, FULL_LABEL_FONT_SIZE);
  const shortTextWidth = getApproxTextWidth(shortText, SHORT_LABEL_FONT_SIZE);

  if (textArc >= fullTextWidth * 1.08) return "full";
  if (textArc >= shortTextWidth * 1.06) return "short";
  return "hidden";
}

function getDamageDisplayPlan(
  label: string,
  shortLabel: string,
  startAngle: number,
  endAngle: number,
  value: number
): DamageDisplayPlan {
  const sweep = Math.max(0, endAngle - startAngle);
  const midAngle = startAngle + sweep / 2;
  const iconSize = getIconSize(sweep);
  const labelMode = getDamageLabelMode(label, shortLabel, sweep);
  const labelText =
    labelMode === "full"
      ? label.toUpperCase()
      : labelMode === "short"
        ? shortLabel
        : "";

  const edgePadding = Math.min(DAMAGE_SEGMENT_EDGE_PADDING, sweep * 0.22);
  const safeStart = startAngle + edgePadding;
  const safeEnd = endAngle - edgePadding;
  const safeSweep = Math.max(0, safeEnd - safeStart);

  if (safeSweep <= 0.1) {
    return {
      labelMode: "hidden",
      labelText: "",
      iconAngles: [midAngle],
      iconSize,
      iconRadius: DAMAGE_ICON_RADIUS,
    };
  }

  const labelFontSize =
    labelMode === "full" ? FULL_LABEL_FONT_SIZE : SHORT_LABEL_FONT_SIZE;

  const labelArcWidth =
    labelMode === "hidden"
      ? 0
      : getAngleForArcLength(
          DAMAGE_RING_LABEL_RADIUS,
          getApproxTextWidth(labelText, labelFontSize)
        );

  const iconAngularWidth = getAngleForArcLength(DAMAGE_ICON_RADIUS, iconSize);
  const textGapAngle = getAngleForArcLength(
    DAMAGE_ICON_RADIUS,
    DAMAGE_ICON_TEXT_GAP
  );

  const minimumSideOffset =
    labelMode === "hidden"
      ? 0
      : labelArcWidth / 2 + iconAngularWidth / 2 + textGapAngle;

  const maxSideOffset = safeSweep / 2 - iconAngularWidth / 2;

  if (labelMode !== "hidden" && maxSideOffset >= minimumSideOffset) {
    const iconAngles = [
      midAngle - minimumSideOffset,
      midAngle + minimumSideOffset,
    ];

    const secondOffset =
      minimumSideOffset + iconAngularWidth + textGapAngle * 0.85;

    if (value >= 2 && sweep >= 56 && secondOffset <= maxSideOffset) {
      iconAngles.unshift(midAngle - secondOffset);
      iconAngles.push(midAngle + secondOffset);
    }

    return {
      labelMode,
      labelText,
      iconAngles,
      iconSize,
      iconRadius: DAMAGE_ICON_RADIUS,
    };
  }

  const textlessIconCount =
    safeSweep >= iconAngularWidth * 3.4
      ? 3
      : safeSweep >= iconAngularWidth * 2.2
        ? 2
        : 1;

  const iconAngles = Array.from({ length: textlessIconCount }, (_, index) => {
    if (textlessIconCount === 1) return midAngle;

    const step = safeSweep / textlessIconCount;
    return safeStart + step * index + step / 2;
  });

  return {
    labelMode: "hidden",
    labelText: "",
    iconAngles,
    iconSize,
    iconRadius: DAMAGE_ICON_RADIUS,
  };
}

function renderDamageTextureMarks(
  type: (typeof DAMAGE_TYPES)[number],
  startAngle: number,
  endAngle: number,
  value: number,
  opacityMultiplier = 1
) {
  const sweep = Math.max(0, endAngle - startAngle);
  const safeCount = Math.min(7, Math.max(2, value + 1));
  const sampleAngle = (index: number, count: number) =>
    startAngle + sweep * ((index + 0.5) / count);

  const threadLines = Array.from(
    { length: Math.min(4, safeCount) },
    (_, index) => {
      const angle = sampleAngle(index, Math.min(4, safeCount));
      const inner = polarToCartesian(CX, CY, 298, angle);
      const outer = polarToCartesian(CX, CY, 330, angle);

      return (
        <line
          key={`${type.key}-thread-${index}`}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke={type.glowColor}
          strokeOpacity={0.13 * opacityMultiplier}
          strokeWidth="1"
          strokeLinecap="round"
        />
      );
    }
  );

  if (type.key === "Poison" || type.key === "Acid") {
    return (
      <>
        {threadLines}
        {Array.from({ length: safeCount }, (_, index) => {
          const angle = sampleAngle(index, safeCount);
          const radius = index % 2 === 0 ? 302 : 324;
          const point = polarToCartesian(CX, CY, radius, angle);

          return (
            <circle
              key={`${type.key}-bubble-${index}`}
              cx={point.x}
              cy={point.y}
              r={2 + (index % 3) * 0.7}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity={0.31 * opacityMultiplier}
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
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const p1 = polarToCartesian(CX, CY, 300, angle - 1.15);
          const p2 = polarToCartesian(CX, CY, 314, angle + 1.25);
          const p3 = polarToCartesian(CX, CY, 329, angle - 0.7);

          return (
            <polyline
              key={`${type.key}-bolt-${index}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity={0.38 * opacityMultiplier}
              strokeWidth="1.2"
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
        {Array.from({ length: Math.min(6, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(6, safeCount));
          const point = polarToCartesian(
            CX,
            CY,
            index % 2 === 0 ? 304 : 323,
            angle
          );

          return (
            <g
              key={`${type.key}-spark-${index}`}
              transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
              opacity={0.38 * opacityMultiplier}
            >
              <line
                x1="-3.4"
                y1="0"
                x2="3.4"
                y2="0"
                stroke={type.glowColor}
                strokeWidth="1"
                strokeLinecap="round"
              />
              <line
                x1="0"
                y1="-3.4"
                x2="0"
                y2="3.4"
                stroke={type.glowColor}
                strokeWidth="1"
                strokeLinecap="round"
              />
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
          const start = polarToCartesian(CX, CY, 300, angle - 0.8);
          const control = polarToCartesian(CX, CY, 312, angle + 0.9);
          const end = polarToCartesian(CX, CY, 330, angle + 0.3);

          return (
            <path
              key={`${type.key}-ember-${index}`}
              d={`M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity={0.32 * opacityMultiplier}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  }

  if (
    type.key === "Necrotic" ||
    type.key === "Psychic" ||
    type.key === "Force"
  ) {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(6, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(6, safeCount));
          const point = polarToCartesian(
            CX,
            CY,
            index % 2 === 0 ? 304 : 323,
            angle
          );

          return (
            <circle
              key={`${type.key}-orb-${index}`}
              cx={point.x}
              cy={point.y}
              r="2.4"
              fill={type.glowColor}
              fillOpacity={0.2 * opacityMultiplier}
              stroke={type.glowColor}
              strokeOpacity={0.24 * opacityMultiplier}
              strokeWidth="1"
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      {threadLines}
      {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
        const angle = sampleAngle(index, Math.min(5, safeCount));
        const inner = polarToCartesian(CX, CY, 302, angle - 1.5);
        const outer = polarToCartesian(CX, CY, 327, angle + 1.5);

        return (
          <line
            key={`${type.key}-physical-cut-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={type.glowColor}
            strokeOpacity={0.26 * opacityMultiplier}
            strokeWidth="1.15"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

function renderDamageIcons(
  type: (typeof DAMAGE_TYPES)[number],
  displayPlan: DamageDisplayPlan,
  clipPathId: string,
  opacity = 0.97
) {
  const iconHref = DAMAGE_TYPE_ICONS[type.key];

  if (!iconHref) {
    return null;
  }

  return (
    <g clipPath={`url(#${clipPathId})`}>
      {displayPlan.iconAngles.map((angle, index) => {
        const point = polarToCartesian(
          CX,
          CY,
          displayPlan.iconRadius,
          angle
        );

        return (
          <g
            key={`${type.key}-icon-${index}`}
            transform={`translate(${point.x} ${point.y})`}
            opacity={opacity}
          >
            <circle
              cx="0"
              cy="0"
              r={displayPlan.iconSize * 0.6}
              fill={type.glowColor}
              fillOpacity="0.045"
            />

            <circle
              cx="0"
              cy="0"
              r={displayPlan.iconSize * 0.5}
              fill="rgba(8,6,10,0.34)"
              stroke={type.glowColor}
              strokeOpacity="0.14"
              strokeWidth="0.65"
            />

            <image
              href={iconHref}
              x={-displayPlan.iconSize / 2}
              y={-displayPlan.iconSize / 2}
              width={displayPlan.iconSize}
              height={displayPlan.iconSize}
              opacity="0.96"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        );
      })}
    </g>
  );
}

export function DamageTypesLayer({
  damageTypeCounts,
  damageTypeTotal,
  focus,
  setFocus,
  relationshipIndex,
  onToggleSelection,
  selectedFocuses = [],
  showSelectionMarks = false,
}: DamageTypesLayerProps) {
  const activeFocus = hasActiveFocus(focus);

  return (
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

            const segmentGap = Math.min(1.4, sweep * 0.08);
            const visualStartAngle = startAngle + segmentGap;
            const visualEndAngle = endAngle - segmentGap;
            const midAngle = startAngle + sweep / 2;

            const displayPlan = getDamageDisplayPlan(
              type.label,
              type.short,
              visualStartAngle,
              visualEndAngle,
              value
            );

            const clipPathId = `damage-segment-clip-${type.key}`;

            const isRelated = isDamageTypeVisuallyRelated(
              type.key,
              focus,
              relationshipIndex
            );

            const isSelected = isDamageTypeSelected(type.key, selectedFocuses);

            const groupOpacity = activeFocus && !isRelated ? 0.28 : 1;
            const focusBoost = activeFocus && isRelated ? 1.18 : 1;
            const selectionBoost = isSelected && showSelectionMarks ? 1.16 : 1;
            const reviewBoost = isSelected && showSelectionMarks ? 1.35 : 1;

            const textureOpacityMultiplier =
              activeFocus && !isRelated ? 0.38 : focusBoost;
            const iconOpacity =
              activeFocus && !isRelated
                ? 0.32
                : isSelected && showSelectionMarks
                  ? 1
                  : 0.97;

            return (
              <g
                key={type.key}
                opacity={groupOpacity}
                style={{ cursor: "pointer" }}
                onMouseEnter={() =>
                  setFocus({ type: "damageType", damageType: type.key })
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSelection?.({
                    type: "damageType",
                    damageType: type.key,
                  });
                }}
              >
                <defs>
                  <clipPath id={clipPathId}>
                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        DAMAGE_RING_INNER_RADIUS + 1,
                        DAMAGE_RING_OUTER_RADIUS - 1,
                        visualStartAngle,
                        visualEndAngle
                      )}
                    />
                  </clipPath>
                </defs>

                {isSelected && showSelectionMarks ? (
                  <>
                    <path
                      d={describeDonutSegment(
                        CX,
                        CY,
                        DAMAGE_RING_OUTER_RADIUS + 5,
                        DAMAGE_RING_OUTER_RADIUS + 13,
                        visualStartAngle - 0.45,
                        visualEndAngle + 0.45
                      )}
                      fill={type.glowColor}
                      fillOpacity="0.24"
                      stroke={type.glowColor}
                      strokeOpacity="0.72"
                      strokeWidth="1.5"
                      filter="url(#elementalBloom)"
                      pointerEvents="none"
                    />

                    <path
                      d={describeTextArc(
                        CX,
                        CY,
                        DAMAGE_RING_OUTER_RADIUS + 16,
                        visualStartAngle + 0.2,
                        visualEndAngle - 0.2
                      )}
                      fill="none"
                      stroke="rgba(255,248,220,0.98)"
                      strokeOpacity="0.88"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                <path
                  d={describeTextArc(
                    CX,
                    CY,
                    DAMAGE_RING_LABEL_RADIUS,
                    visualStartAngle,
                    visualEndAngle
                  )}
                  fill="none"
                  stroke={type.glowColor}
                  strokeOpacity={0.11 * focusBoost * reviewBoost}
                  strokeWidth="56"
                  strokeLinecap="butt"
                  filter="url(#elementalBloom)"
                />

                <path
                  d={describeDonutSegment(
                    CX,
                    CY,
                    DAMAGE_RING_INNER_RADIUS,
                    DAMAGE_RING_OUTER_RADIUS,
                    visualStartAngle,
                    visualEndAngle
                  )}
                  fill={type.color}
                  fillOpacity={0.22 * focusBoost * selectionBoost}
                  stroke={
                    isSelected && showSelectionMarks
                      ? "rgba(255,250,232,0.98)"
                      : type.glowColor
                  }
                  strokeOpacity={
                    isSelected && showSelectionMarks
                      ? 0.95
                      : 0.3 * focusBoost
                  }
                  strokeWidth={
                    isSelected && showSelectionMarks
                      ? 2.35
                      : activeFocus && isRelated
                        ? 1.7
                        : 1.1
                  }
                />

                <path
                  d={describeDonutSegment(
                    CX,
                    CY,
                    300,
                    328,
                    visualStartAngle + 0.7,
                    visualEndAngle - 0.7
                  )}
                  fill="rgba(7,5,8,0.36)"
                  stroke="rgba(255,242,213,0.08)"
                  strokeWidth="0.7"
                />

                <path
                  d={describeTextArc(
                    CX,
                    CY,
                    DAMAGE_RING_LABEL_RADIUS,
                    visualStartAngle + 0.9,
                    visualEndAngle - 0.9
                  )}
                  fill="none"
                  stroke={
                    isSelected && showSelectionMarks
                      ? "rgba(255,250,232,1)"
                      : type.glowColor
                  }
                  strokeOpacity={
                    isSelected && showSelectionMarks
                      ? 0.86
                      : 0.2 * focusBoost
                  }
                  strokeWidth={
                    isSelected && showSelectionMarks
                      ? 3.4
                      : activeFocus && isRelated
                        ? 2.8
                        : 2.1
                  }
                  strokeLinecap="round"
                />

                <path
                  d={describeTextArc(
                    CX,
                    CY,
                    304,
                    visualStartAngle + 0.9,
                    visualEndAngle - 0.9
                  )}
                  fill="none"
                  stroke={type.glowColor}
                  strokeOpacity={0.09 * focusBoost}
                  strokeWidth="1.05"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                />

                {renderDamageTextureMarks(
                  type,
                  visualStartAngle,
                  visualEndAngle,
                  value,
                  textureOpacityMultiplier
                )}

                {renderDamageIcons(type, displayPlan, clipPathId, iconOpacity)}

                {displayPlan.labelMode !== "hidden" ? (
                  <text
                    transform={getArcTextTransform(
                      CX,
                      CY,
                      DAMAGE_RING_LABEL_RADIUS,
                      midAngle
                    )}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={
                      displayPlan.labelMode === "full"
                        ? FULL_LABEL_FONT_SIZE
                        : SHORT_LABEL_FONT_SIZE
                    }
                    fontWeight="950"
                    letterSpacing={
                      displayPlan.labelMode === "full" ? "0.045em" : "0.075em"
                    }
                    fill={
                      isSelected && showSelectionMarks
                        ? "rgba(255,250,232,1)"
                        : activeFocus && isRelated
                          ? "rgba(255,250,232,1)"
                          : "rgba(255,248,226,0.98)"
                    }
                    paintOrder="stroke"
                    stroke="rgba(3,2,4,0.96)"
                    strokeWidth={
                      isSelected && showSelectionMarks
                        ? 4.3
                        : activeFocus && isRelated
                          ? 3.6
                          : 3.2
                    }
                    filter="url(#fineInkShadow)"
                  >
                    {displayPlan.labelText}
                  </text>
                ) : null}
              </g>
            );
          });
        })()
      ) : (
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
  );
}