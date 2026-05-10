import { RESOURCE_SECTORS } from "../dataCircleConfig";
import {
  CX,
  CY,
  describeDonutSegment,
  describeTextArc,
  normalizeAngle,
  polarToCartesian,
} from "../dataCircleGeometry";
import type { ResourceSectorKey } from "../dataCircleTypes";

type ResourceLayerProps = {
  resourceCounts: Record<ResourceSectorKey, number>;
  maxResourceCount: number;
};

const RESOURCE_INNER_RADIUS = 354;
const RESOURCE_OUTER_RADIUS = 422;
const RESOURCE_MIDDLE_RADIUS = 388;

const HEATMAP_INNER_RADIUS = 363;
const HEATMAP_OUTER_RADIUS = 412;

const LABEL_RADIUS = 389;
const VALUE_DOT_RADIUS = 417;

function getResourceIntensity(value: number, maxValue: number) {
  if (value <= 0) {
    return {
      fillOpacity: 0.07,
      glowOpacity: 0,
      strokeOpacity: 0.1,
      detailOpacity: 0.055,
      dotOpacity: 0.1,
      dotRadius: 1.45,
    };
  }

  const ratio = Math.min(1, value / Math.max(1, maxValue));
  const eased = Math.pow(ratio, 0.72);

  return {
    fillOpacity: 0.15 + eased * 0.58,
    glowOpacity: 0.035 + eased * 0.14,
    strokeOpacity: 0.2 + eased * 0.42,
    detailOpacity: 0.12 + eased * 0.22,
    dotOpacity: 0.34 + eased * 0.46,
    dotRadius: 2.1 + eased * 2.25,
  };
}

function getLabelText(label: string, short: string, sectorAngle: number) {
  if (sectorAngle >= 24) return label.toUpperCase();
  if (sectorAngle >= 13) return short;
  return "";
}

function getLabelFontSize(text: string) {
  if (text.length >= 20) return 5.5;
  if (text.length >= 16) return 5.9;
  if (text.length >= 12) return 6.4;
  if (text.length >= 8) return 7.1;
  return 8.2;
}

function getLabelLetterSpacing(text: string) {
  if (text.length >= 20) return "0.005em";
  if (text.length >= 16) return "0.015em";
  if (text.length >= 12) return "0.03em";
  if (text.length >= 8) return "0.055em";
  return "0.085em";
}

function getLabelArcPath(radius: number, startAngle: number, endAngle: number) {
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const normalizedMid = normalizeAngle(midAngle);
  const shouldFlip = normalizedMid > 90 && normalizedMid < 270;

  return shouldFlip
    ? describeTextArc(CX, CY, radius, endAngle, startAngle)
    : describeTextArc(CX, CY, radius, startAngle, endAngle);
}

function renderIntensityStripes(
  key: ResourceSectorKey,
  color: string,
  startAngle: number,
  endAngle: number,
  value: number,
  maxValue: number
) {
  const ratio = value <= 0 ? 0 : Math.min(1, value / Math.max(1, maxValue));
  const activeStripes = Math.round(ratio * 5);
  const sweep = endAngle - startAngle;
  const stripeStart = startAngle + Math.min(1.2, sweep * 0.08);
  const stripeEnd = endAngle - Math.min(1.2, sweep * 0.08);

  return Array.from({ length: 5 }, (_, index) => {
    const radius = HEATMAP_INNER_RADIUS + 7 + index * 7;
    const opacity = index < activeStripes ? 0.28 + index * 0.045 : 0.05;

    return (
      <path
        key={`${key}-resource-stripe-${index}`}
        d={describeTextArc(CX, CY, radius, stripeStart, stripeEnd)}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    );
  });
}

export function ResourceLayer({
  resourceCounts,
  maxResourceCount,
}: ResourceLayerProps) {
  const sectorAngle = 360 / RESOURCE_SECTORS.length;

  return (
    <g className="data-circle-resource-heatmap">
      <circle
        cx={CX}
        cy={CY}
        r={RESOURCE_MIDDLE_RADIUS}
        fill="none"
        stroke="rgba(6,5,7,0.96)"
        strokeWidth={RESOURCE_OUTER_RADIUS - RESOURCE_INNER_RADIUS}
      />

      <circle
        cx={CX}
        cy={CY}
        r={RESOURCE_OUTER_RADIUS}
        fill="none"
        stroke="rgba(230,188,112,0.16)"
        strokeWidth="1.1"
      />

      <circle
        cx={CX}
        cy={CY}
        r={RESOURCE_INNER_RADIUS}
        fill="none"
        stroke="rgba(230,188,112,0.12)"
        strokeWidth="1"
      />

      <circle
        cx={CX}
        cy={CY}
        r={RESOURCE_MIDDLE_RADIUS}
        fill="none"
        stroke="rgba(255,232,180,0.035)"
        strokeWidth="48"
        strokeDasharray="1 13"
      />

      {RESOURCE_SECTORS.map((sector, index) => {
        const startAngle = -90 + index * sectorAngle;
        const endAngle = startAngle + sectorAngle;
        const midAngle = startAngle + sectorAngle / 2;

        const visualGap = 0.9;
        const visualStartAngle = startAngle + visualGap;
        const visualEndAngle = endAngle - visualGap;

        const value = resourceCounts[sector.key];
        const intensity = getResourceIntensity(value, maxResourceCount);

        const labelText = getLabelText(
          sector.label,
          sector.short,
          sectorAngle
        );

        const labelPathId = `resource-label-path-${sector.key}`;
        const valuePoint = polarToCartesian(
          CX,
          CY,
          VALUE_DOT_RADIUS,
          midAngle
        );

        const dividerInner = polarToCartesian(
          CX,
          CY,
          RESOURCE_INNER_RADIUS,
          startAngle
        );

        const dividerOuter = polarToCartesian(
          CX,
          CY,
          RESOURCE_OUTER_RADIUS,
          startAngle
        );

        return (
          <g key={sector.key}>
            <title>
              {`${sector.label}: ${value} ${
                value === 1 ? "ability" : "abilities"
              }`}
            </title>

            <line
              x1={dividerInner.x}
              y1={dividerInner.y}
              x2={dividerOuter.x}
              y2={dividerOuter.y}
              stroke="rgba(255,244,218,0.28)"
              strokeOpacity="0.32"
              strokeWidth="0.8"
              strokeLinecap="round"
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                RESOURCE_MIDDLE_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill="none"
              stroke={sector.glowColor}
              strokeOpacity={intensity.glowOpacity}
              strokeWidth="66"
              strokeLinecap="butt"
              filter={value > 0 ? "url(#elementalBloom)" : undefined}
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                HEATMAP_INNER_RADIUS,
                HEATMAP_OUTER_RADIUS,
                visualStartAngle,
                visualEndAngle
              )}
              fill={sector.color}
              fillOpacity={intensity.fillOpacity}
              stroke={sector.glowColor}
              strokeOpacity={intensity.strokeOpacity}
              strokeWidth="1"
            />

            <path
              d={describeDonutSegment(
                CX,
                CY,
                HEATMAP_INNER_RADIUS + 7,
                HEATMAP_OUTER_RADIUS - 7,
                visualStartAngle + 0.35,
                visualEndAngle - 0.35
              )}
              fill="rgba(8,6,10,0.28)"
              stroke="rgba(255,244,218,0.07)"
              strokeWidth="0.6"
            />

            {renderIntensityStripes(
              sector.key,
              sector.glowColor,
              visualStartAngle + 0.8,
              visualEndAngle - 0.8,
              value,
              maxResourceCount
            )}

            <path
              d={describeTextArc(
                CX,
                CY,
                HEATMAP_OUTER_RADIUS,
                visualStartAngle + 0.6,
                visualEndAngle - 0.6
              )}
              fill="none"
              stroke={sector.glowColor}
              strokeOpacity={intensity.detailOpacity}
              strokeWidth="1.7"
              strokeLinecap="round"
            />

            <circle
              cx={valuePoint.x}
              cy={valuePoint.y}
              r={intensity.dotRadius}
              fill={sector.glowColor}
              fillOpacity={intensity.dotOpacity}
              stroke="rgba(5,4,6,0.86)"
              strokeWidth="0.75"
            />

            {labelText ? (
              <>
                <path
                  id={labelPathId}
                  d={getLabelArcPath(
                    LABEL_RADIUS,
                    visualStartAngle + 1,
                    visualEndAngle - 1
                  )}
                  fill="none"
                  stroke="none"
                />

                <text
                  fontSize={getLabelFontSize(labelText)}
                  fontWeight="900"
                  letterSpacing={getLabelLetterSpacing(labelText)}
                  fill="rgba(255,244,218,0.9)"
                  paintOrder="stroke"
                  stroke="rgba(4,3,5,0.92)"
                  strokeWidth="2"
                  dominantBaseline="middle"
                  filter="url(#fineInkShadow)"
                >
                  <textPath
                    href={`#${labelPathId}`}
                    startOffset="50%"
                    textAnchor="middle"
                    dy="0.32em"
                  >
                    {labelText}
                  </textPath>
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {(() => {
        const finalAngle = -90 + RESOURCE_SECTORS.length * sectorAngle;

        const dividerInner = polarToCartesian(
          CX,
          CY,
          RESOURCE_INNER_RADIUS,
          finalAngle
        );

        const dividerOuter = polarToCartesian(
          CX,
          CY,
          RESOURCE_OUTER_RADIUS,
          finalAngle
        );

        return (
          <line
            x1={dividerInner.x}
            y1={dividerInner.y}
            x2={dividerOuter.x}
            y2={dividerOuter.y}
            stroke="rgba(255,244,218,0.28)"
            strokeOpacity="0.32"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        );
      })()}
    </g>
  );
}