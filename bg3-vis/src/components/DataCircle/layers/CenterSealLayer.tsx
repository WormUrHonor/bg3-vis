import { CX, CY, polarToCartesian } from "../dataCircleGeometry";

type CenterSealLayerProps = {
  buildLabel: string;
  characterLabel: string;
  archetypeLabel: string;
  displayLevel: number;
  spellCount: number;
  averageDpr?: number;
  totalDamage?: number;
};

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
}

export function CenterSealLayer({
  buildLabel,
  characterLabel,
  archetypeLabel,
  averageDpr,
  totalDamage,
}: CenterSealLayerProps) {
  const hasDamageSummary =
    typeof averageDpr === "number" && typeof totalDamage === "number";

  return (
    <g className="data-circle-center-seal">
      <circle
        cx={CX}
        cy={CY}
        r="92"
        fill="rgba(9,6,8,0.96)"
        stroke="rgba(230,190,112,0.42)"
        strokeWidth="2.4"
        filter="url(#arcaneSoftGlow)"
      />

      <circle
        cx={CX}
        cy={CY}
        r="82"
        fill="url(#sealGradient)"
        fillOpacity="0.34"
        stroke="rgba(255,226,164,0.55)"
        strokeWidth="1.4"
      />

      <circle
        cx={CX}
        cy={CY}
        r="72"
        fill="none"
        stroke="rgba(255,226,164,0.2)"
        strokeWidth="1"
        strokeDasharray="2 7"
      />

      <circle
        cx={CX}
        cy={CY}
        r="56"
        fill="rgba(5,4,6,0.42)"
        stroke="rgba(255,226,164,0.16)"
        strokeWidth="1"
      />

      {Array.from({ length: 16 }, (_, index) => {
        const angle = index * 22.5;
        const inner = polarToCartesian(CX, CY, 74, angle);
        const outer = polarToCartesian(CX, CY, 90, angle);

        return (
          <line
            key={`seal-outer-tick-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,226,164,0.22)"
            strokeWidth={index % 2 === 0 ? 1.1 : 0.7}
            strokeLinecap="round"
          />
        );
      })}

      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * 45;
        const inner = polarToCartesian(CX, CY, 58, angle);
        const outer = polarToCartesian(CX, CY, 70, angle);

        return (
          <line
            key={`seal-inner-tick-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,226,164,0.16)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        );
      })}

      {hasDamageSummary ? (
        <>
          <text
            x={CX}
            y={CY - 44}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8.6"
            fontWeight="900"
            letterSpacing="0.15em"
            fill="rgba(229,202,152,0.78)"
            paintOrder="stroke"
            stroke="rgba(4,3,5,0.9)"
            strokeWidth="2"
          >
            AVG DPR
          </text>

          <text
            x={CX}
            y={CY - 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="31"
            fontWeight="950"
            letterSpacing="0.02em"
            fill="rgba(255,248,226,0.98)"
            paintOrder="stroke"
            stroke="rgba(3,2,4,0.96)"
            strokeWidth="4"
            filter="url(#fineInkShadow)"
          >
            {averageDpr.toFixed(1)}
          </text>

          <text
            x={CX}
            y={CY + 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8.2"
            fontWeight="900"
            letterSpacing="0.12em"
            fill="rgba(229,202,152,0.72)"
            paintOrder="stroke"
            stroke="rgba(4,3,5,0.9)"
            strokeWidth="1.8"
          >
            TOTAL DAMAGE
          </text>

          <text
            x={CX}
            y={CY + 34}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16.5"
            fontWeight="950"
            letterSpacing="0.04em"
            fill="rgba(255,226,164,0.92)"
            paintOrder="stroke"
            stroke="rgba(3,2,4,0.94)"
            strokeWidth="3"
            filter="url(#fineInkShadow)"
          >
            {Math.round(totalDamage)}
          </text>
        </>
      ) : (
        <>
          <text
            x={CX}
            y={CY - 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="15"
            fontWeight="950"
            letterSpacing="0.04em"
            fill="rgba(255,248,226,0.96)"
            paintOrder="stroke"
            stroke="rgba(3,2,4,0.96)"
            strokeWidth="3"
            filter="url(#fineInkShadow)"
          >
            {truncateLabel(buildLabel, 16)}
          </text>

          <text
            x={CX}
            y={CY + 13}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10.5"
            fontWeight="900"
            letterSpacing="0.06em"
            fill="rgba(229,202,152,0.82)"
            paintOrder="stroke"
            stroke="rgba(4,3,5,0.9)"
            strokeWidth="2"
          >
            {truncateLabel(archetypeLabel, 18)}
          </text>
        </>
      )}

      <text
        x={CX}
        y={CY + 66}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fontWeight="850"
        letterSpacing="0.08em"
        fill="rgba(229,202,152,0.52)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.84)"
        strokeWidth="1.6"
      >
        {characterLabel
          ? truncateLabel(characterLabel, 18).toUpperCase()
          : truncateLabel(buildLabel, 18).toUpperCase()}
      </text>
    </g>
  );
}