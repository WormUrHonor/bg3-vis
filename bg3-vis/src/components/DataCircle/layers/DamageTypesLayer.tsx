import { DAMAGE_TYPES } from "../dataCircleConfig";
import {
  CX,
  CY,
  describeDonutSegment,
  describeTextArc,
  getArcTextTransform,
  polarToCartesian,
} from "../dataCircleGeometry";
import type { DamageRingKey } from "../dataCircleTypes";

type DamageTypesLayerProps = {
  damageTypeCounts: Record<DamageRingKey, number>;
  damageTypeTotal: number;
};

function getDamageLabelMode(label: string, sweep: number) {
  const fullLabelRequiredSweep = Math.max(26, label.length * 4.6);
  const shortLabelRequiredSweep = 10;

  if (sweep >= fullLabelRequiredSweep) return "full";
  if (sweep >= shortLabelRequiredSweep) return "short";
  return "hidden";
}

function renderDamageTextureMarks(
  type: (typeof DAMAGE_TYPES)[number],
  startAngle: number,
  endAngle: number,
  value: number
) {
  const sweep = Math.max(0, endAngle - startAngle);
  const safeCount = Math.min(6, Math.max(2, value + 1));
  const sampleAngle = (index: number, count: number) =>
    startAngle + sweep * ((index + 0.5) / count);

  const threadLines = Array.from({ length: Math.min(3, safeCount) }, (_, index) => {
    const angle = sampleAngle(index, Math.min(3, safeCount));
    const inner = polarToCartesian(CX, CY, 300, angle);
    const outer = polarToCartesian(CX, CY, 328, angle);

    return (
      <line
        key={`${type.key}-thread-${index}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={type.glowColor}
        strokeOpacity="0.18"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    );
  });

  if (type.key === "Poison" || type.key === "Acid") {
    return (
      <>
        {threadLines}
        {Array.from({ length: safeCount }, (_, index) => {
          const angle = sampleAngle(index, safeCount);
          const radius = index % 2 === 0 ? 304 : 324;
          const point = polarToCartesian(CX, CY, radius, angle);

          return (
            <circle
              key={`${type.key}-bubble-${index}`}
              cx={point.x}
              cy={point.y}
              r={1.8 + (index % 3) * 0.55}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.52"
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
        {Array.from({ length: Math.min(4, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(4, safeCount));
          const p1 = polarToCartesian(CX, CY, 300, angle - 1.2);
          const p2 = polarToCartesian(CX, CY, 314, angle + 1.4);
          const p3 = polarToCartesian(CX, CY, 328, angle - 0.8);

          return (
            <polyline
              key={`${type.key}-bolt-${index}`}
              points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.55"
              strokeWidth="1.15"
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
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const point = polarToCartesian(CX, CY, index % 2 === 0 ? 306 : 322, angle);

          return (
            <g
              key={`${type.key}-star-${index}`}
              transform={`translate(${point.x} ${point.y}) rotate(${angle})`}
              opacity="0.52"
            >
              <line x1="-3" y1="0" x2="3" y2="0" stroke={type.glowColor} strokeWidth="0.9" strokeLinecap="round" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke={type.glowColor} strokeWidth="0.9" strokeLinecap="round" />
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
          const start = polarToCartesian(CX, CY, 302, angle - 0.9);
          const end = polarToCartesian(CX, CY, 327, angle + 0.9);

          return (
            <path
              key={`${type.key}-ember-${index}`}
              d={`M ${start.x} ${start.y} Q ${CX} ${CY} ${end.x} ${end.y}`}
              fill="none"
              stroke={type.glowColor}
              strokeOpacity="0.42"
              strokeWidth="1.05"
              strokeLinecap="round"
            />
          );
        })}
      </>
    );
  }

  if (type.key === "Necrotic" || type.key === "Psychic" || type.key === "Force") {
    return (
      <>
        {threadLines}
        {Array.from({ length: Math.min(5, safeCount) }, (_, index) => {
          const angle = sampleAngle(index, Math.min(5, safeCount));
          const point = polarToCartesian(CX, CY, index % 2 === 0 ? 306 : 323, angle);

          return (
            <circle
              key={`${type.key}-orb-${index}`}
              cx={point.x}
              cy={point.y}
              r="2.2"
              fill={type.glowColor}
              fillOpacity="0.34"
              stroke={type.glowColor}
              strokeOpacity="0.34"
              strokeWidth="1.1"
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      {threadLines}
      {Array.from({ length: Math.min(4, safeCount) }, (_, index) => {
        const angle = sampleAngle(index, Math.min(4, safeCount));
        const inner = polarToCartesian(CX, CY, 302, angle - 1.8);
        const outer = polarToCartesian(CX, CY, 326, angle + 1.8);

        return (
          <line
            key={`${type.key}-physical-cut-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={type.glowColor}
            strokeOpacity="0.38"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

export function DamageTypesLayer({
  damageTypeCounts,
  damageTypeTotal,
}: DamageTypesLayerProps) {
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

              const segmentGap = Math.min(1.8, sweep * 0.13);
              const visualStartAngle = startAngle + segmentGap;
              const visualEndAngle = endAngle - segmentGap;
              const midAngle = startAngle + sweep / 2;
              const labelMode = getDamageLabelMode(type.label, sweep);
              const labelText =
                labelMode === "full"
                  ? type.label.toUpperCase()
                  : labelMode === "short"
                    ? type.short
                    : "";

              return (
                <g key={type.key}>
                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      314,
                      visualStartAngle,
                      visualEndAngle
                    )}
                    fill="none"
                    stroke={type.glowColor}
                    strokeOpacity="0.16"
                    strokeWidth="52"
                    strokeLinecap="butt"
                    filter="url(#elementalBloom)"
                  />

                  <path
                    d={describeDonutSegment(
                      CX,
                      CY,
                      292,
                      336,
                      visualStartAngle,
                      visualEndAngle
                    )}
                    fill={type.color}
                    fillOpacity="0.48"
                    stroke={type.glowColor}
                    strokeOpacity="0.42"
                    strokeWidth="1.05"
                  />

                  <path
                    d={describeDonutSegment(
                      CX,
                      CY,
                      303,
                      325,
                      visualStartAngle + 0.8,
                      visualEndAngle - 0.8
                    )}
                    fill="rgba(7,5,8,0.42)"
                    stroke="rgba(255,242,213,0.1)"
                    strokeWidth="0.7"
                  />

                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      314,
                      visualStartAngle + 1.2,
                      visualEndAngle - 1.2
                    )}
                    fill="none"
                    stroke={type.glowColor}
                    strokeOpacity="0.3"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {renderDamageTextureMarks(type, visualStartAngle, visualEndAngle, value)}

                  {labelMode !== "hidden" ? (
                    <text
                      transform={getArcTextTransform(CX, CY, 314, midAngle)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={labelMode === "full" ? 7.4 : 8.3}
                      fontWeight="900"
                      letterSpacing={labelMode === "full" ? "0.08em" : "0.12em"}
                      fill="rgba(255,244,218,0.92)"
                      paintOrder="stroke"
                      stroke="rgba(4,3,5,0.9)"
                      strokeWidth="2.4"
                      filter="url(#fineInkShadow)"
                    >
                      {labelText}
                    </text>
                  ) : null}
                </g>
              );
            });
          })()
        : (
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
