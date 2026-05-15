import {
  getFocusSummary,
  type DataCircleFocus,
  type LayerRelationshipIndex,
} from "../dataCircleInteraction";
import { CX, CY } from "../dataCircleGeometry";

type FocusExplanationLayerProps = {
  focus: DataCircleFocus;
  relationshipIndex: LayerRelationshipIndex;
};

function splitText(text: string, maxLength: number) {
  if (text.length <= maxLength) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 3);
}

export function FocusExplanationLayer({
  focus,
  relationshipIndex,
}: FocusExplanationLayerProps) {
  const summary = getFocusSummary(focus, relationshipIndex);
  const bodyLines = splitText(summary.body, 42);

  return (
    <g className="data-circle-focus-explanation" pointerEvents="none">
      <rect
        x={CX - 150}
        y={CY + 103}
        width="300"
        height={52 + bodyLines.length * 12}
        rx="16"
        fill="rgba(7,5,8,0.76)"
        stroke="rgba(230,188,112,0.24)"
        strokeWidth="1"
        filter="url(#fineInkShadow)"
      />

      <text
        x={CX}
        y={CY + 126}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9.2"
        fontWeight="950"
        letterSpacing="0.08em"
        fill="rgba(255,244,218,0.94)"
        paintOrder="stroke"
        stroke="rgba(3,2,4,0.92)"
        strokeWidth="2.2"
      >
        {summary.title.toUpperCase()}
      </text>

      {bodyLines.map((line, index) => (
        <text
          key={line}
          x={CX}
          y={CY + 148 + index * 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="700"
          letterSpacing="0.015em"
          fill="rgba(255,236,200,0.76)"
          paintOrder="stroke"
          stroke="rgba(3,2,4,0.9)"
          strokeWidth="1.65"
        >
          {line}
        </text>
      ))}
    </g>
  );
}