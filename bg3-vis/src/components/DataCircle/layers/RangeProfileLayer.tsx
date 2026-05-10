import { RANGE_BANDS } from "../dataCircleConfig";
import { CX, CY, polarToCartesian } from "../dataCircleGeometry";
import type { RangeBandKey } from "../dataCircleTypes";

type RangeProfileLayerProps = {
  rangeCounts: Record<RangeBandKey, number>;
  maxRangeCount: number;
};

function getRangeDotAngles(count: number) {
  if (count <= 0) return [];

  /*
    This value controls the protected label zone near the top of the circle.
    It was 78. Reducing it to 66 lets the motes come closer to the curved
    range labels while still avoiding direct overlap.
  */
  const blockedArc = 66;
  const availableSweep = 360 - blockedArc;
  const startAngle = blockedArc / 2;
  const step = availableSweep / count;

  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + step * index + step / 2;
    return angle % 360;
  });
}

function getRangeBandIntensity(value: number, _maxValue: number) {
  if (value <= 0) {
    return {
      smokeOpacity: 0.022,
      inlayOpacity: 0.035,
      rimOpacity: 0.09,
      moteOpacity: 0,
      moteGlowOpacity: 0,
      moteRadius: 0,
    };
  }

  const ratio = Math.min(1, value / 14);
  const eased = Math.pow(ratio, 0.92);

  return {
    smokeOpacity: 0.025 + eased * 0.07,
    inlayOpacity: 0.045 + eased * 0.12,
    rimOpacity: 0.11 + eased * 0.22,
    moteOpacity: 0.38 + eased * 0.38,
    moteGlowOpacity: 0.035 + eased * 0.16,
    moteRadius: 3.25 + eased * 1.05,
  };
}

export function RangeProfileLayer({
  rangeCounts,
  maxRangeCount,
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
        <circle
          cx={CX}
          cy={CY}
          r="216"
          fill="rgba(8,6,7,0.96)"
        />

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
        const angles = getRangeDotAngles(value);
        const intensity = getRangeBandIntensity(value, maxRangeCount);

        return (
          <g key={band.key}>
            <circle
              cx={CX}
              cy={CY}
              r={middleRadius}
              fill="none"
              stroke="#9b6fd0"
              strokeOpacity={intensity.smokeOpacity}
              strokeWidth={bandWidth + 3}
              filter={value > 0 ? "url(#arcaneSoftGlow)" : undefined}
            />

            <circle
              cx={CX}
              cy={CY}
              r={middleRadius}
              fill="none"
              stroke="#69496f"
              strokeOpacity={intensity.inlayOpacity}
              strokeWidth={bandWidth}
            />

            <circle
              cx={CX}
              cy={CY}
              r={band.innerRadius}
              fill="none"
              stroke="rgba(218,178,104,0.9)"
              strokeOpacity={intensity.rimOpacity}
              strokeWidth="0.85"
            />

            <circle
              cx={CX}
              cy={CY}
              r={band.outerRadius}
              fill="none"
              stroke="rgba(218,178,104,0.9)"
              strokeOpacity={intensity.rimOpacity}
              strokeWidth="0.85"
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
              const dotKey = `${band.key}-mote-${index}`;

              return (
                <g key={dotKey}>
                  <circle
                    cx={x}
                    cy={y}
                    r={intensity.moteRadius + 6}
                    fill="#b077d6"
                    fillOpacity={intensity.moteGlowOpacity}
                    filter="url(#moteGlow)"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={intensity.moteRadius + 2.3}
                    fill="rgba(10,7,10,0.84)"
                    stroke="rgba(220,178,104,0.36)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={intensity.moteRadius}
                    fill="url(#moteGradient)"
                    fillOpacity={intensity.moteOpacity}
                    stroke="rgba(255,239,185,0.58)"
                    strokeWidth="0.7"
                  />
                  <circle
                    cx={x - 1.25}
                    cy={y - 1.35}
                    r="1"
                    fill="rgba(255,255,230,0.76)"
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
