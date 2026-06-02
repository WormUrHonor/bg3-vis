import type { Dispatch, SetStateAction } from "react";
import {
  CX,
  CY,
  describeDonutSegment,
  describeTextArc,
  polarToCartesian,
} from "../dataCircleGeometry";
import type {
  DataCircleFocus,
  DataCircleFocusItem,
  LayerRelationshipIndex,
} from "../dataCircleInteraction";
import {
  hasActiveFocus,
  isAbilityRelatedToFocus,
} from "../dataCircleInteraction";

export type SpellDamagePreviewItem = {
  id: string;
  name: string;
  min: number;
  average: number;
  max: number;
  rollText: string;
  damageTypes: string[];
  saveLabel: string | null;
  deliveryLabel: string | null;
  iconHref?: string;
};

type SpellDamagePreviewLayerProps = {
  items: SpellDamagePreviewItem[];
  focus: DataCircleFocus;
  setFocus: Dispatch<SetStateAction<DataCircleFocus>>;
  relationshipIndex: LayerRelationshipIndex;
  onToggleSelection?: (focus: DataCircleFocusItem) => void;
  selectedFocuses?: DataCircleFocusItem[];
  showSelectionMarks?: boolean;
};

type PreviewColor = {
  fill: string;
  stroke: string;
  glow: string;
};

type DiceTerm = {
  diceCount: number;
  diceSize: number;
};

type OutcomeProbability = {
  value: number;
  probability: number;
};

type DamageUncertaintyModel = {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  distributionAvailable: boolean;
  volatility: number;
};

const PREVIEW_INNER_RADIUS = 339;
const PREVIEW_OUTER_RADIUS = 473;

const BAR_BASE_RADIUS = 360;
const BAR_MAX_RADIUS = 455;
const BAR_SPAN = BAR_MAX_RADIUS - BAR_BASE_RADIUS;

const STABILITY_LABEL_RADIUS = 370;

const GRID_VALUES = [10, 20, 40, 60, 80, 100, 120, 150];

const DAMAGE_COLOR_BY_TYPE: Record<string, PreviewColor> = {
  Acid: { fill: "#9FA60D", stroke: "#DDE548", glow: "#F7FF69" },
  Bludgeoning: { fill: "#5B5146", stroke: "#968776", glow: "#BBA789" },
  Cold: { fill: "#2F91B0", stroke: "#6CCFE9", glow: "#A8EEFF" },
  Fire: { fill: "#974A08", stroke: "#D37A32", glow: "#FFA24D" },
  Force: { fill: "#992729", stroke: "#D05A5C", glow: "#FF7477" },
  Lightning: { fill: "#002F80", stroke: "#386DD2", glow: "#5F91FF" },
  Necrotic: { fill: "#2D8A68", stroke: "#58C99C", glow: "#9DFFD9" },
  Piercing: { fill: "#545B60", stroke: "#94A0A8", glow: "#B3C0C9" },
  Poison: { fill: "#647234", stroke: "#95A653", glow: "#C5D96E" },
  Psychic: { fill: "#A94691", stroke: "#DC83C8", glow: "#FFB8F0" },
  Radiant: { fill: "#A88720", stroke: "#DFC15A", glow: "#FFE891" },
  Slashing: { fill: "#5D504C", stroke: "#98847F", glow: "#B99B94" },
  Thunder: { fill: "#6230A6", stroke: "#9665D9", glow: "#C79AFF" },
  Physical: { fill: "#625944", stroke: "#A99A75", glow: "#CDBB8B" },
  Weapon: { fill: "#625944", stroke: "#A99A75", glow: "#CDBB8B" },
  Variable: { fill: "#56515D", stroke: "#9891A5", glow: "#B8B0C6" },
};

const FALLBACK_COLOR: PreviewColor = {
  fill: "#78685a",
  stroke: "#c2a782",
  glow: "#e0c99e",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getPreviewColor(item: SpellDamagePreviewItem): PreviewColor {
  const firstDamageType = item.damageTypes[0];
  if (!firstDamageType) return FALLBACK_COLOR;

  return DAMAGE_COLOR_BY_TYPE[firstDamageType] ?? FALLBACK_COLOR;
}

function getDamageRadius(value: number, scaleMax: number) {
  const ratio = scaleMax <= 0 ? 0 : clamp(value / scaleMax, 0, 1);
  return BAR_BASE_RADIUS + ratio * BAR_SPAN;
}

function isAbilitySelected(
  abilityId: string,
  selectedFocuses: DataCircleFocusItem[] = []
) {
  return selectedFocuses.some(
    (item) => item.type === "ability" && item.abilityId === abilityId
  );
}

function parseDiceTerms(rollText: string): DiceTerm[] {
  const dicePattern = /(\d*)d(\d+)/gi;
  const terms: DiceTerm[] = [];
  let match: RegExpExecArray | null = dicePattern.exec(rollText);

  while (match) {
    const diceCount = match[1] ? Number(match[1]) : 1;
    const diceSize = Number(match[2]);

    if (
      Number.isFinite(diceCount) &&
      Number.isFinite(diceSize) &&
      diceCount > 0 &&
      diceSize > 0 &&
      diceCount <= 30 &&
      diceSize <= 100
    ) {
      terms.push({ diceCount, diceSize });
    }

    match = dicePattern.exec(rollText);
  }

  return terms;
}

function convolveDistribution(
  current: Map<number, number>,
  diceSize: number
): Map<number, number> {
  const next = new Map<number, number>();

  current.forEach((count, currentSum) => {
    for (let face = 1; face <= diceSize; face += 1) {
      const nextSum = currentSum + face;
      next.set(nextSum, (next.get(nextSum) ?? 0) + count);
    }
  });

  return next;
}

function buildDiceDistribution(terms: DiceTerm[]): OutcomeProbability[] {
  let distribution = new Map<number, number>([[0, 1]]);

  terms.forEach((term) => {
    for (let index = 0; index < term.diceCount; index += 1) {
      distribution = convolveDistribution(distribution, term.diceSize);
    }
  });

  const totalCount = Array.from(distribution.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalCount <= 0) return [];

  return Array.from(distribution.entries())
    .map(([value, count]) => ({
      value,
      probability: count / totalCount,
    }))
    .sort((first, second) => first.value - second.value);
}

function getWeightedMean(distribution: OutcomeProbability[]) {
  return distribution.reduce(
    (sum, outcome) => sum + outcome.value * outcome.probability,
    0
  );
}

function getWeightedVariance(
  distribution: OutcomeProbability[],
  mean: number
) {
  return distribution.reduce(
    (sum, outcome) =>
      sum + Math.pow(outcome.value - mean, 2) * outcome.probability,
    0
  );
}

function getQuantile(
  distribution: OutcomeProbability[],
  probability: number
): number {
  if (distribution.length <= 0) return 0;

  const target = clamp(probability, 0, 1);
  let cumulative = 0;

  for (const outcome of distribution) {
    cumulative += outcome.probability;

    if (cumulative >= target) {
      return outcome.value;
    }
  }

  return distribution[distribution.length - 1].value;
}

function getFallbackUncertaintyModel(
  item: SpellDamagePreviewItem
): DamageUncertaintyModel {
  const range = Math.max(0, item.max - item.min);
  const likelyPadding = range * 0.22;

  const p10 = clamp(item.min + range * 0.1, item.min, item.max);
  const p25 = clamp(item.average - likelyPadding, item.min, item.max);
  const p50 = item.average;
  const p75 = clamp(item.average + likelyPadding, item.min, item.max);
  const p90 = clamp(item.min + range * 0.9, item.min, item.max);

  return {
    p10,
    p25,
    p50,
    p75,
    p90,
    distributionAvailable: false,
    volatility: range / Math.max(1, item.average * 3.2),
  };
}

function getDamageUncertaintyModel(
  item: SpellDamagePreviewItem
): DamageUncertaintyModel {
  const terms = parseDiceTerms(item.rollText);

  if (terms.length <= 0) {
    return getFallbackUncertaintyModel(item);
  }

  const diceDistribution = buildDiceDistribution(terms);

  if (diceDistribution.length <= 0) {
    return getFallbackUncertaintyModel(item);
  }

  const diceMin = diceDistribution[0].value;
  const shift = item.min - diceMin;

  const shiftedDistribution = diceDistribution.map((outcome) => ({
    value: outcome.value + shift,
    probability: outcome.probability,
  }));

  const mean = getWeightedMean(shiftedDistribution);
  const variance = getWeightedVariance(shiftedDistribution, mean);
  const standardDeviation = Math.sqrt(Math.max(0, variance));

  return {
    p10: getQuantile(shiftedDistribution, 0.1),
    p25: getQuantile(shiftedDistribution, 0.25),
    p50: getQuantile(shiftedDistribution, 0.5),
    p75: getQuantile(shiftedDistribution, 0.75),
    p90: getQuantile(shiftedDistribution, 0.9),
    distributionAvailable: true,
    volatility: clamp(standardDeviation / Math.max(1, item.average), 0, 1),
  };
}

function getIconRadius(averageRadius: number) {
  const barLength = Math.max(0, averageRadius - BAR_BASE_RADIUS);

  if (barLength < 22) {
    return BAR_BASE_RADIUS + 18;
  }

  return clamp(
    BAR_BASE_RADIUS + barLength * 0.58,
    BAR_BASE_RADIUS + 20,
    BAR_MAX_RADIUS - 18
  );
}

function getVolatilityLabel(volatility: number) {
  if (volatility >= 0.42) return "swingy";
  return "stable";
}

type TangentialLabelLayout = {
  point: { x: number; y: number };
  rotation: number;
  width: number;
  height: number;
};

function getReadableTangentialRotation(angle: number) {
  let rotation = angle + 90;
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  if (normalizedRotation > 90 && normalizedRotation < 270) {
    rotation += 180;
  }

  return rotation;
}

function estimateLabelWidth(text: string, fontSize: number) {
  return Math.max(fontSize * 2.35, text.length * fontSize * 0.58 + 10);
}

function getAngularDistanceForWidth(width: number, radius: number) {
  return (width / Math.max(radius, 1)) * (180 / Math.PI);
}

function getTangentialLabelLayout(
  angle: number,
  radius: number,
  direction: -1 | 1,
  iconSize: number,
  text: string,
  fontSize: number,
  sectorAngle: number
): TangentialLabelLayout {
  const width = estimateLabelWidth(text, fontSize);
  const height = fontSize + 7;

  const iconHalfAngle = getAngularDistanceForWidth(iconSize + 10, radius) / 2;
  const textHalfAngle = getAngularDistanceForWidth(width + 4, radius) / 2;
  const sectorHalfAngle = sectorAngle / 2;
  const centerOffset = clamp(
    iconHalfAngle + textHalfAngle + 1.2,
    3.1,
    Math.max(3.1, sectorHalfAngle - 1.15)
  );

  const labelAngle = angle + direction * centerOffset;

  return {
    point: polarToCartesian(CX, CY, radius, labelAngle),
    rotation: getReadableTangentialRotation(labelAngle),
    width,
    height,
  };
}

function renderTangentialLabel(
  layout: TangentialLabelLayout,
  text: string,
  fontSize: number,
  color: PreviewColor,
  isRelated: boolean,
  shouldShowSelected: boolean,
  emphasis: "average" | "range"
) {
  const fillOpacity = emphasis === "average" ? 0.92 : 0.82;
  const strokeOpacity = shouldShowSelected
    ? 0.94
    : emphasis === "average"
      ? isRelated
        ? 0.62
        : 0.28
      : isRelated
        ? 0.44
        : 0.2;

  return (
    <g
      transform={`translate(${layout.point.x} ${layout.point.y}) rotate(${layout.rotation})`}
      pointerEvents="none"
    >
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={String(fontSize)}
        fontWeight={emphasis === "average" ? "950" : "900"}
        letterSpacing={emphasis === "average" ? "0.01em" : "0.005em"}
        fill={
          shouldShowSelected
            ? "rgba(255,250,232,1)"
            : emphasis === "average"
              ? `rgba(255,236,205,${fillOpacity})`
              : "rgba(255,244,218,0.86)"
        }
      >
        {text}
      </text>
    </g>
  );
}


function renderScaleGrid(scaleMax: number) {
  const visibleGridValues = GRID_VALUES.filter((value) => value <= scaleMax);

  return (
    <g className="data-circle-spell-damage-grid">
      {visibleGridValues.map((value) => {
        const radius = getDamageRadius(value, scaleMax);

        return (
          <g key={`spell-damage-grid-${value}`}>
            <circle
              cx={CX}
              cy={CY}
              r={radius}
              fill="none"
              stroke="rgba(255,244,218,0.09)"
              strokeOpacity="0.25"
              strokeWidth="0.85"
              strokeDasharray="2 9"
            />

            <text
              x={CX}
              y={CY - radius}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="5.8"
              fontWeight="850"
              fill="rgba(255,244,218,0.34)"
              paintOrder="stroke"
              stroke="rgba(4,3,5,0.92)"
              strokeWidth="1.6"
            >
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function renderItemIcon(
  item: SpellDamagePreviewItem,
  angle: number,
  radius: number,
  color: PreviewColor,
  isRelated: boolean,
  shouldShowSelected: boolean
) {
  if (!item.iconHref) return null;

  const point = polarToCartesian(CX, CY, radius, angle);
  const iconSize = shouldShowSelected ? 24 : 22;

  return (
    <g pointerEvents="none" opacity={isRelated ? 1 : 0.35}>
      <circle
        cx={point.x}
        cy={point.y}
        r={iconSize * 0.82}
        fill="rgba(6,5,7,0.84)"
        stroke={shouldShowSelected ? "rgba(255,250,232,0.96)" : color.stroke}
        strokeOpacity={shouldShowSelected ? 0.88 : isRelated ? 0.54 : 0.22}
        strokeWidth={shouldShowSelected ? 1.3 : 0.95}
        filter="url(#fineInkShadow)"
      />

      <circle
        cx={point.x}
        cy={point.y}
        r={iconSize}
        fill="none"
        stroke={color.glow}
        strokeOpacity={shouldShowSelected ? 0.42 : isRelated ? 0.22 : 0.07}
        strokeWidth="1"
        filter="url(#elementalBloom)"
      />

      <image
        href={item.iconHref}
        x={point.x - iconSize / 2}
        y={point.y - iconSize / 2}
        width={iconSize}
        height={iconSize}
        opacity="0.98"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function renderRangeLabels(
  item: SpellDamagePreviewItem,
  uncertainty: DamageUncertaintyModel,
  angle: number,
  color: PreviewColor,
  isRelated: boolean,
  shouldShowSelected: boolean
) {
  const stabilityPoint = polarToCartesian(
    CX,
    CY,
    STABILITY_LABEL_RADIUS,
    angle
  );

  return (
    <g pointerEvents="none">
      <text
        x={stabilityPoint.x}
        y={stabilityPoint.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5.8"
        fontWeight="900"
        fill={
          shouldShowSelected
            ? color.glow
            : isRelated
              ? "rgba(255,226,182,0.58)"
              : "rgba(255,226,182,0.2)"
        }
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.94)"
        strokeWidth="1.45"
      >
        {getVolatilityLabel(uncertainty.volatility)}
      </text>
    </g>
  );
}

export function SpellDamagePreviewLayer({
  items,
  focus,
  setFocus,
  relationshipIndex,
  onToggleSelection,
  selectedFocuses = [],
  showSelectionMarks = false,
}: SpellDamagePreviewLayerProps) {
  const safeItems = items.slice(0, 14);
  const sectorAngle = 360 / Math.max(1, safeItems.length);
  const active = hasActiveFocus(focus);

  const scaleMax = Math.max(
    20,
    Math.ceil(Math.max(...safeItems.map((item) => item.max), 0) / 10) * 10
  );

  return (
<g
  className="data-circle-spell-damage-preview-layer"
  data-study-region="data-circle-damage-preview-layer"
  data-study-element="damage-preview-layer"
  data-study-id="data-circle-damage-preview-layer"
  data-layer-kind="local-damage-forecast"
  data-uncertainty-encoding="full-range-middle-80-middle-50"
  data-item-count={safeItems.length}
  opacity={focus ? 0.98 : 0.9}
      style={{
        filter: focus
          ? "saturate(1.06) brightness(0.98)"
          : "saturate(0.92) brightness(0.86)",
        transition: "opacity 180ms ease, filter 180ms ease",
      }}
    >
      <circle
        cx={CX}
        cy={CY}
        r={(PREVIEW_INNER_RADIUS + PREVIEW_OUTER_RADIUS) / 2}
        fill="none"
        stroke="rgba(6,5,7,0.96)"
        strokeWidth={PREVIEW_OUTER_RADIUS - PREVIEW_INNER_RADIUS}
      />

      <circle
        cx={CX}
        cy={CY}
        r={PREVIEW_OUTER_RADIUS}
        fill="none"
        stroke="rgba(230,188,112,0.14)"
        strokeWidth="1.2"
      />

      <circle
        cx={CX}
        cy={CY}
        r={PREVIEW_INNER_RADIUS}
        fill="none"
        stroke="rgba(230,188,112,0.1)"
        strokeWidth="1"
      />

      <circle
        cx={CX}
        cy={CY}
        r={BAR_BASE_RADIUS}
        fill="none"
        stroke="rgba(255,244,218,0.1)"
        strokeWidth="1"
        strokeDasharray="2 8"
      />

      {renderScaleGrid(scaleMax)}

      {safeItems.map((item, index) => {
        const color = getPreviewColor(item);
        const uncertainty = getDamageUncertaintyModel(item);

        const midAngle = -90 + index * sectorAngle;
        const startAngle = midAngle - sectorAngle / 2;
        const endAngle = midAngle + sectorAngle / 2;

        const gap = Math.min(2.2, sectorAngle * 0.14);
        const visualStartAngle = startAngle + gap;
        const visualEndAngle = endAngle - gap;

        const minRadius = getDamageRadius(item.min, scaleMax);
        const p10Radius = getDamageRadius(uncertainty.p10, scaleMax);
        const p25Radius = getDamageRadius(uncertainty.p25, scaleMax);
        const p75Radius = getDamageRadius(uncertainty.p75, scaleMax);
        const p90Radius = getDamageRadius(uncertainty.p90, scaleMax);
        const averageRadius = getDamageRadius(item.average, scaleMax);
        const maxRadius = getDamageRadius(item.max, scaleMax);
        const iconRadius = getIconRadius(averageRadius);

        const isRelated = isAbilityRelatedToFocus(
          item.id,
          focus,
          relationshipIndex
        );

        const isSelected = isAbilitySelected(item.id, selectedFocuses);
        const shouldShowSelected = isSelected && showSelectionMarks;

        const opacity = active && !isRelated ? 0.28 : 1;

        const iconSize = shouldShowSelected ? 24 : 22;
        const iconPoint = polarToCartesian(CX, CY, iconRadius, midAngle);
        const averageText = formatNumber(item.average);
        const rangeText = `${formatNumber(item.min)}–${formatNumber(item.max)}`;
        const averageFontSize = shouldShowSelected
          ? sectorAngle >= 20
            ? 12.4
            : 11.4
          : sectorAngle >= 20
            ? 11.6
            : 10.6;
        const rangeFontSize = sectorAngle >= 20 ? 10.1 : 9.3;
        const averageLabelLayout = getTangentialLabelLayout(
          midAngle,
          iconRadius,
          -1,
          iconSize,
          averageText,
          averageFontSize,
          sectorAngle
        );
        const rangeLabelLayout = getTangentialLabelLayout(
          midAngle,
          iconRadius,
          1,
          iconSize,
          rangeText,
          rangeFontSize,
          sectorAngle
        );

        return (
          <g
            key={item.id}
            opacity={opacity}
            style={{ cursor: "pointer" }}
            data-study-region="data-circle-spell-damage-preview-layer"
            data-study-element="spell-damage-preview-bar"
            data-study-id={`spell-damage-preview-${item.id}`}
            data-ability-id={item.id}
            data-ability-name={item.name}
            data-damage-average={item.average}
            data-damage-min={item.min}
            data-damage-max={item.max}
            data-damage-p10={uncertainty.p10}
            data-damage-p25={uncertainty.p25}
            data-damage-p50={uncertainty.p50}
            data-damage-p75={uncertainty.p75}
            data-damage-p90={uncertainty.p90}
            data-damage-volatility={uncertainty.volatility}
            data-damage-distribution-available={
              uncertainty.distributionAvailable ? "true" : "false"
            }
            onMouseEnter={() => setFocus({ type: "ability", abilityId: item.id })}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelection?.({ type: "ability", abilityId: item.id });
            }}
          >
            <title>
              {`${item.name}
Roll: ${item.rollText}
Average: ${formatNumber(item.average)}
Middle 50%: ${formatNumber(uncertainty.p25)}–${formatNumber(uncertainty.p75)}
Middle 80%: ${formatNumber(uncertainty.p10)}–${formatNumber(uncertainty.p90)}
Full possible range: ${formatNumber(item.min)}–${formatNumber(item.max)}${
                item.saveLabel ? `\nResolution: ${item.saveLabel}` : ""
              }${item.deliveryLabel ? `\nDelivery: ${item.deliveryLabel}` : ""}`}
            </title>

            <line
              x1={polarToCartesian(CX, CY, PREVIEW_INNER_RADIUS, startAngle).x}
              y1={polarToCartesian(CX, CY, PREVIEW_INNER_RADIUS, startAngle).y}
              x2={polarToCartesian(CX, CY, PREVIEW_OUTER_RADIUS, startAngle).x}
              y2={polarToCartesian(CX, CY, PREVIEW_OUTER_RADIUS, startAngle).y}
              stroke="rgba(255,244,218,0.14)"
              strokeOpacity="0.24"
              strokeWidth="0.75"
              strokeLinecap="round"
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                minRadius,
                maxRadius,
                visualStartAngle,
                visualEndAngle
              )}
              fill={color.fill}
              fillOpacity={shouldShowSelected ? 0.18 : isRelated ? 0.11 : 0.065}
              stroke={color.stroke}
              strokeOpacity={shouldShowSelected ? 0.3 : isRelated ? 0.18 : 0.08}
              strokeWidth="0.75"
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                p10Radius,
                p90Radius,
                visualStartAngle + 0.18,
                visualEndAngle - 0.18
              )}
              fill={color.fill}
              fillOpacity={shouldShowSelected ? 0.18 : isRelated ? 0.11 : 0.04}
              stroke={color.glow}
              strokeOpacity={shouldShowSelected ? 0.34 : isRelated ? 0.17 : 0.055}
              strokeWidth="0.75"
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                p25Radius,
                p75Radius,
                visualStartAngle + 0.38,
                visualEndAngle - 0.38
              )}
              fill={color.glow}
              fillOpacity={shouldShowSelected ? 0.23 : isRelated ? 0.14 : 0.052}
              stroke={color.glow}
              strokeOpacity={shouldShowSelected ? 0.5 : isRelated ? 0.24 : 0.075}
              strokeWidth={shouldShowSelected ? 1.05 : 0.72}
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                BAR_BASE_RADIUS,
                averageRadius,
                visualStartAngle,
                visualEndAngle
              )}
              fill={color.fill}
              fillOpacity={shouldShowSelected ? 0.56 : isRelated ? 0.42 : 0.2}
              stroke={shouldShowSelected ? "rgba(255,250,232,0.92)" : color.stroke}
              strokeOpacity={shouldShowSelected ? 0.88 : isRelated ? 0.5 : 0.18}
              strokeWidth={shouldShowSelected ? 1.65 : 1}
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                averageRadius,
                visualStartAngle + 0.35,
                visualEndAngle - 0.35
              )}
              fill="none"
              stroke={shouldShowSelected ? "rgba(255,250,232,0.96)" : color.glow}
              strokeOpacity={shouldShowSelected ? 0.86 : isRelated ? 0.5 : 0.17}
              strokeWidth={shouldShowSelected ? 2.35 : 1.45}
              strokeLinecap="round"
              filter="url(#elementalBloom)"
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                minRadius,
                visualStartAngle + 0.5,
                visualEndAngle - 0.5
              )}
              fill="none"
              stroke="rgba(255,244,218,0.34)"
              strokeOpacity={isRelated ? 0.22 : 0.075}
              strokeWidth="0.7"
              strokeDasharray="2 5"
              strokeLinecap="round"
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                maxRadius,
                visualStartAngle + 0.5,
                visualEndAngle - 0.5
              )}
              fill="none"
              stroke="rgba(255,244,218,0.34)"
              strokeOpacity={isRelated ? 0.28 : 0.095}
              strokeWidth="0.75"
              strokeDasharray="2 5"
              strokeLinecap="round"
            />

            {renderItemIcon(
              item,
              midAngle,
              iconRadius,
              color,
              isRelated,
              shouldShowSelected
            )}

            <g pointerEvents="none">
              <circle
                cx={iconPoint.x}
                cy={iconPoint.y}
                r={iconSize * 0.88}
                fill="none"
                stroke={color.glow}
                strokeOpacity={shouldShowSelected ? 0.22 : isRelated ? 0.12 : 0.04}
                strokeWidth="0.9"
                strokeDasharray="1.5 3.5"
              />

              {renderTangentialLabel(
                averageLabelLayout,
                averageText,
                averageFontSize,
                color,
                isRelated,
                shouldShowSelected,
                "average"
              )}

              {renderTangentialLabel(
                rangeLabelLayout,
                rangeText,
                rangeFontSize,
                color,
                isRelated,
                shouldShowSelected,
                "range"
              )}
            </g>

            {sectorAngle >= 23
              ? renderRangeLabels(
                  item,
                  uncertainty,
                  midAngle,
                  color,
                  isRelated,
                  shouldShowSelected
                )
              : null}
          </g>
        );
      })}

      <text
        x={CX}
        y={CY - PREVIEW_OUTER_RADIUS - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8.2"
        fontWeight="950"
        letterSpacing="0.1em"
        fill="rgba(255,244,218,0.58)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.92)"
        strokeWidth="2"
      >
        DAMAGE FORECAST · AVG + ROLL SPREAD
      </text>

      <text
        x={CX}
        y={CY - PREVIEW_OUTER_RADIUS + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5.8"
        fontWeight="850"
        letterSpacing="0.055em"
        fill="rgba(255,226,182,0.4)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.9)"
        strokeWidth="1.4"
      >
        SOFT BAND = POSSIBLE RANGE · OUTER BAND = MIDDLE 80% · BRIGHT BAND = MIDDLE 50%
      </text>
    </g>
  );
}