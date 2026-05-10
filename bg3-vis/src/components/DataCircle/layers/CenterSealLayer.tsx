import { CX, CY, polarToCartesian } from "../dataCircleGeometry";

type CenterSealLayerProps = {
  buildLabel: string;
  characterLabel: string;
  archetypeLabel: string;
  displayLevel: number;
  spellCount: number;
};

export function CenterSealLayer({
  buildLabel,
  characterLabel,
  archetypeLabel,
  displayLevel,
  spellCount,
}: CenterSealLayerProps) {
  return (
    <>
      <circle
        cx={CX}
        cy={CY}
        r="88"
        fill="url(#sealGradient)"
        stroke="rgba(230,190,112,0.88)"
        strokeWidth="3"
        filter="url(#arcaneSoftGlow)"
      />

      <circle
        cx={CX}
        cy={CY}
        r="76"
        fill="none"
        stroke="rgba(22,13,5,0.65)"
        strokeWidth="1.3"
        strokeDasharray="3 8"
      />

      {Array.from({ length: 12 }, (_, index) => {
        const angle = index * 30;
        const end = polarToCartesian(CX, CY, 88, angle);

        return (
          <line
            key={`seal-line-${index}`}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="1"
          />
        );
      })}

      {characterLabel ? (
        <text x={CX} y="462" className="data-circle-character-name">
          {characterLabel.length > 18
            ? `${characterLabel.slice(0, 18)}…`
            : characterLabel}
        </text>
      ) : null}

      <text x={CX} y="488" className="data-circle-build-name">
        {buildLabel.length > 20 ? `${buildLabel.slice(0, 20)}…` : buildLabel}
      </text>

      <text x={CX} y="513" className="data-circle-archetype">
        {archetypeLabel.length > 22
          ? `${archetypeLabel.slice(0, 22)}…`
          : archetypeLabel}
      </text>

      <text x={CX} y="540" className="data-circle-plate-text">
        L{displayLevel} · {spellCount} abilities
      </text>
    </>
  );
}
