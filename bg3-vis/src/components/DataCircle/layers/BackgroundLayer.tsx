import { CX, CY, polarToCartesian } from "../dataCircleGeometry";

export function BackgroundLayer() {
  return (
    <>
      <circle cx={CX} cy={CY} r={480} fill="url(#arcaneBackground)" />

      <circle
        cx={CX}
        cy={CY}
        r={470}
        fill="none"
        stroke="rgba(214,174,103,0.18)"
        strokeWidth="1.6"
      />

      <circle
        cx={CX}
        cy={CY}
        r={452}
        fill="none"
        stroke="rgba(214,174,103,0.08)"
        strokeWidth="1"
      />

      {Array.from({ length: 56 }, (_, index) => {
        const angle = index * (360 / 56);
        const outer = polarToCartesian(CX, CY, 468, angle);
        const inner = polarToCartesian(CX, CY, index % 4 === 0 ? 458 : 462, angle);

        return (
          <line
            key={`outer-rune-tick-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(218,178,104,0.18)"
            strokeWidth={index % 4 === 0 ? 1.25 : 0.65}
          />
        );
      })}
    </>
  );
}
