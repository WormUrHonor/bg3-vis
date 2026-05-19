import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { getSpellById } from "../../../data/bg3Spells";
import { getSpellIcon } from "../../../logic/spellIconLogic";
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
  DprContribution,
  DprRound,
  LayerRelationshipIndex,
} from "../dataCircleInteraction";
import {
  hasActiveFocus,
  isAbilityRelatedToFocus,
  isRoundRelatedToFocus,
} from "../dataCircleInteraction";

type DprByRoundLayerProps = {
  rounds: DprRound[];
  averageDpr: number;
  focus: DataCircleFocus;
  setFocus: Dispatch<SetStateAction<DataCircleFocus>>;
  relationshipIndex: LayerRelationshipIndex;
  onToggleSelection?: (focus: DataCircleFocusItem) => void;
};

type AbilityColor = {
  fill: string;
  stroke: string;
  glow: string;
};

const DPR_INNER_RADIUS = 339;
const DPR_OUTER_RADIUS = 473;

const BAR_BASE_RADIUS = 357;
const BAR_MAX_RADIUS = 460;
const BAR_SPAN = BAR_MAX_RADIUS - BAR_BASE_RADIUS;

const ROUND_LABEL_RADIUS = 344;
const VALUE_LABEL_RADIUS = 467;

const DPR_SCALE_MAX = 100;
const DPR_GRID_VALUES = [20, 40, 60, 80, 100];

const GRID_LABEL_ANGLES = [
  -90, -54, -18, 18, 54, 90, 126, 162, 198, 234, 270,
];

const FALLBACK_COLORS: AbilityColor[] = [
  { fill: "#b97855", stroke: "#e7b184", glow: "#f1c095" },
  { fill: "#7f75b8", stroke: "#bcb3ee", glow: "#c9c1f6" },
  { fill: "#5f9c89", stroke: "#9fd6c6", glow: "#ace4d3" },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function damageToRadius(value: number) {
  const ratio = clamp(value / DPR_SCALE_MAX, 0, 1);
  return BAR_BASE_RADIUS + ratio * BAR_SPAN;
}

function getRoundTotal(round: DprRound) {
  if (typeof round.damage === "number") return round.damage;

  return (
    round.contributions?.reduce(
      (sum, contribution) => sum + contribution.damage,
      0
    ) ?? 0
  );
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const value = parseInt(cleanHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixWithWhite(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

function mixWithBlack(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);

  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function normalizeIconColor(r: number, g: number, b: number): AbilityColor {
  const brightness = (r + g + b) / 3;

  let adjustedR = r;
  let adjustedG = g;
  let adjustedB = b;

  if (brightness < 70) {
    adjustedR = r + 55;
    adjustedG = g + 55;
    adjustedB = b + 55;
  }

  const fill = rgbToHex(adjustedR, adjustedG, adjustedB);

  return {
    fill: mixWithBlack(fill, 0.08),
    stroke: mixWithWhite(fill, 0.42),
    glow: mixWithWhite(fill, 0.28),
  };
}

async function getAverageIconColor(imageSrc: string): Promise<AbilityColor> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load icon image."));
  });

  const canvas = document.createElement("canvas");
  const size = 32;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) throw new Error("Could not create canvas context.");

  context.drawImage(image, 0, 0, size, size);

  const imageData = context.getImageData(0, 0, size, size).data;

  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let weightTotal = 0;

  for (let index = 0; index < imageData.length; index += 4) {
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const a = imageData[index + 3];

    if (a < 80) continue;

    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness < 34) continue;

    const weight = (a / 255) * (1 + saturation / 255);

    redTotal += r * weight;
    greenTotal += g * weight;
    blueTotal += b * weight;
    weightTotal += weight;
  }

  if (weightTotal <= 0) return FALLBACK_COLORS[0];

  return normalizeIconColor(
    redTotal / weightTotal,
    greenTotal / weightTotal,
    blueTotal / weightTotal
  );
}

function getRoundIntensity(value: number) {
  if (value <= 0) {
    return {
      glowOpacity: 0,
      outerStrokeOpacity: 0.1,
    };
  }

  const ratio = clamp(value / DPR_SCALE_MAX, 0, 1);
  const eased = Math.pow(ratio, 0.72);

  return {
    glowOpacity: 0.01 + eased * 0.045,
    outerStrokeOpacity: 0.24 + eased * 0.34,
  };
}

function getContributionOpacity(value: number, isRelated: boolean) {
  const ratio = clamp(value / DPR_SCALE_MAX, 0, 1);
  const base = 0.42 + Math.pow(ratio, 0.62) * 0.24;

  return isRelated ? Math.min(0.82, base + 0.18) : base * 0.36;
}

function focusIncludesType(focus: DataCircleFocus, type: DataCircleFocusItem["type"]) {
  if (!focus) return false;
  const focusItems = Array.isArray(focus) ? focus : [focus];
  return focusItems.some((item) => item.type === type);
}

function getDprLayerOpacity(focus: DataCircleFocus) {
  if (!focus) return 0.58;

  if (focusIncludesType(focus, "round") || focusIncludesType(focus, "ability")) {
    return 1;
  }

  return 0.68;
}

function getDprLayerFilter(focus: DataCircleFocus) {
  if (!focus) return "saturate(0.78) brightness(0.86)";

  if (focusIncludesType(focus, "round") || focusIncludesType(focus, "ability")) {
    return "saturate(1.08) brightness(1)";
  }

  return "saturate(0.9) brightness(0.9)";
}

function getContributionIconSize(radialThickness: number, sectorAngle: number) {
  if (radialThickness >= 22 && sectorAngle >= 30) return 20;
  if (radialThickness >= 17 && sectorAngle >= 28) return 17;
  if (radialThickness >= 12 && sectorAngle >= 24) return 14;
  return 0;
}

function getContributionIcon(
  contribution: DprContribution,
  iconSize: number,
  x: number,
  y: number,
  color: string,
  isRelated: boolean
) {
  const spell = getSpellById(contribution.abilityId);

  if (!spell || iconSize <= 0) return null;

  const iconHref = getSpellIcon(spell);

  return (
    <g pointerEvents="none" opacity={isRelated ? 1 : 0.3}>
      <circle
        cx={x}
        cy={y}
        r={iconSize * 0.62}
        fill="rgba(6,5,7,0.54)"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="0.75"
      />

      <image
        href={iconHref}
        x={x - iconSize / 2}
        y={y - iconSize / 2}
        width={iconSize}
        height={iconSize}
        opacity="0.94"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function getFallbackColor(index: number) {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function renderScaleGrid() {
  return (
    <g className="data-circle-dpr-grid">
      {DPR_GRID_VALUES.map((value) => {
        const radius = damageToRadius(value);
        const isMax = value === DPR_SCALE_MAX;

        return (
          <g key={`dpr-grid-ring-${value}`}>
            <circle
              cx={CX}
              cy={CY}
              r={radius}
              fill="none"
              stroke="rgba(255,244,218,0.09)"
              strokeOpacity={isMax ? 0.34 : 0.2}
              strokeWidth={isMax ? 1.15 : 0.85}
              strokeDasharray={isMax ? "4 8" : "2 9"}
            />

            {GRID_LABEL_ANGLES.map((angle) => {
              const labelPoint = polarToCartesian(CX, CY, radius, angle);

              return (
                <text
                  key={`dpr-grid-label-${value}-${angle}`}
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={value === DPR_SCALE_MAX ? "5.7" : "5.1"}
                  fontWeight="800"
                  letterSpacing="0.015em"
                  fill="rgba(255,244,218,0.24)"
                  paintOrder="stroke"
                  stroke="rgba(4,3,5,0.92)"
                  strokeWidth="1.45"
                  filter="url(#fineInkShadow)"
                >
                  {value}
                </text>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function renderAverageReference(
  averageDpr: number,
  sectorAngle: number,
  roundCount: number
) {
  const averageRadius = damageToRadius(averageDpr);

  return (
    <g className="data-circle-dpr-average-reference">
      {Array.from({ length: roundCount }, (_, index) => {
        const midAngle = -90 + index * sectorAngle;
        const startAngle = midAngle - sectorAngle / 2;
        const endAngle = midAngle + sectorAngle / 2;
        const gap = Math.min(2.1, sectorAngle * 0.15);

        return (
          <path
            key={`dpr-average-background-${index}`}
            d={describeDonutSegment(
              CX,
              CY,
              BAR_BASE_RADIUS,
              averageRadius,
              startAngle + gap,
              endAngle - gap
            )}
            fill="#e7c887"
            fillOpacity="0.018"
            stroke="none"
          />
        );
      })}

      <circle
        cx={CX}
        cy={CY}
        r={averageRadius}
        fill="none"
        stroke="#e7c887"
        strokeOpacity="0.18"
        strokeWidth="1.25"
        strokeDasharray="5 9"
      />
    </g>
  );
}

export function DprByRoundLayer({
  rounds,
  averageDpr,
  focus,
  setFocus,
  relationshipIndex,
  onToggleSelection,
}: DprByRoundLayerProps) {
  const safeRounds = rounds.length > 0 ? rounds : [{ round: 1, damage: 0 }];
  const sectorAngle = 360 / safeRounds.length;

  const abilityIds = useMemo(() => {
    const ids = new Set<string>();

    safeRounds.forEach((round) => {
      round.contributions?.forEach((contribution) => {
        ids.add(contribution.abilityId);
      });
    });

    return [...ids];
  }, [safeRounds]);

  const [abilityColors, setAbilityColors] = useState<
    Record<string, AbilityColor>
  >({});

  useEffect(() => {
    let isCancelled = false;

    async function loadAbilityColors() {
      const nextColors: Record<string, AbilityColor> = {};

      await Promise.all(
        abilityIds.map(async (abilityId, index) => {
          const spell = getSpellById(abilityId);

          if (!spell) {
            nextColors[abilityId] = getFallbackColor(index);
            return;
          }

          const iconHref = getSpellIcon(spell);

          try {
            nextColors[abilityId] = await getAverageIconColor(iconHref);
          } catch {
            nextColors[abilityId] = getFallbackColor(index);
          }
        })
      );

      if (!isCancelled) setAbilityColors(nextColors);
    }

    loadAbilityColors();

    return () => {
      isCancelled = true;
    };
  }, [abilityIds]);

  return (
    <g
      className="data-circle-dpr-layer"
      opacity={getDprLayerOpacity(focus)}
      style={{
        filter: getDprLayerFilter(focus),
        transition: "opacity 180ms ease, filter 180ms ease",
      }}
    >
      <circle
        cx={CX}
        cy={CY}
        r={(DPR_INNER_RADIUS + DPR_OUTER_RADIUS) / 2}
        fill="none"
        stroke="rgba(6,5,7,0.95)"
        strokeWidth={DPR_OUTER_RADIUS - DPR_INNER_RADIUS}
      />

      <circle
        cx={CX}
        cy={CY}
        r={DPR_OUTER_RADIUS}
        fill="none"
        stroke="rgba(230,188,112,0.14)"
        strokeWidth="1.2"
      />

      <circle
        cx={CX}
        cy={CY}
        r={DPR_INNER_RADIUS}
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

      {renderAverageReference(averageDpr, sectorAngle, safeRounds.length)}
      {renderScaleGrid()}

      {safeRounds.map((round, index) => {
        const roundTotal = getRoundTotal(round);
        const contributions =
          round.contributions && round.contributions.length > 0
            ? round.contributions.slice(0, 3)
            : [
                {
                  abilityId: "unknown",
                  abilityName: "Unassigned damage",
                  damage: roundTotal,
                },
              ];

        const midAngle = -90 + index * sectorAngle;
        const startAngle = midAngle - sectorAngle / 2;
        const endAngle = midAngle + sectorAngle / 2;

        const visualGap = Math.min(2.05, sectorAngle * 0.14);
        const visualStartAngle = startAngle + visualGap;
        const visualEndAngle = endAngle - visualGap;

        const roundIntensity = getRoundIntensity(roundTotal);
        const roundIsRelated = isRoundRelatedToFocus(
          round.round,
          focus,
          relationshipIndex
        );
        const active = hasActiveFocus(focus);
        const roundOpacity = active && !roundIsRelated ? 0.32 : 1;

        const dividerInner = polarToCartesian(
          CX,
          CY,
          DPR_INNER_RADIUS,
          startAngle
        );

        const dividerOuter = polarToCartesian(
          CX,
          CY,
          DPR_OUTER_RADIUS,
          startAngle
        );

        const roundLabelPoint = polarToCartesian(
          CX,
          CY,
          ROUND_LABEL_RADIUS,
          midAngle
        );

        const valueLabelPoint = polarToCartesian(
          CX,
          CY,
          VALUE_LABEL_RADIUS,
          midAngle
        );

        let cumulativeDamage = 0;

        return (
          <g
            key={`dpr-round-${round.round}`}
            opacity={roundOpacity}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setFocus({ type: "round", round: round.round })}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelection?.({
                type: "round",
                round: round.round,
              });
            }}
          >
            <title>{`Round ${round.round}: ${roundTotal} damage`}</title>

            <line
              x1={dividerInner.x}
              y1={dividerInner.y}
              x2={dividerOuter.x}
              y2={dividerOuter.y}
              stroke="rgba(255,244,218,0.15)"
              strokeOpacity="0.28"
              strokeWidth="0.75"
              strokeLinecap="round"
            />

            <path
              d={describeTextArc(
                CX,
                CY,
                (BAR_BASE_RADIUS + BAR_MAX_RADIUS) / 2,
                visualStartAngle,
                visualEndAngle
              )}
              fill="none"
              stroke="#e4b375"
              strokeOpacity={roundIntensity.glowOpacity}
              strokeWidth={BAR_MAX_RADIUS - BAR_BASE_RADIUS + 14}
              strokeLinecap="butt"
              filter="url(#elementalBloom)"
            />

            {contributions.map((contribution, contributionIndex) => {
              const innerDamage = cumulativeDamage;
              const outerDamage = cumulativeDamage + contribution.damage;
              cumulativeDamage = outerDamage;

              const clippedInnerDamage = clamp(innerDamage, 0, DPR_SCALE_MAX);
              const clippedOuterDamage = clamp(outerDamage, 0, DPR_SCALE_MAX);

              if (
                clippedOuterDamage <= 0 ||
                clippedOuterDamage <= clippedInnerDamage
              ) {
                return null;
              }

              const innerRadius = damageToRadius(clippedInnerDamage);
              const outerRadius = damageToRadius(clippedOuterDamage);
              const radialThickness = outerRadius - innerRadius;

              const color =
                abilityColors[contribution.abilityId] ??
                getFallbackColor(contributionIndex);

              const iconSize = getContributionIconSize(
                radialThickness,
                sectorAngle
              );

              const iconPoint = polarToCartesian(
                CX,
                CY,
                (innerRadius + outerRadius) / 2,
                midAngle
              );

              const contributionIsRelated = isAbilityRelatedToFocus(
                contribution.abilityId,
                focus,
                relationshipIndex
              );

              return (
                <g
                  key={`${round.round}-${contribution.abilityId}-${contributionIndex}`}
                  onMouseEnter={(event) => {
                    event.stopPropagation();
                    setFocus({
                      type: "ability",
                      abilityId: contribution.abilityId,
                    });
                  }}
                  onClick={(event) => {
                    event.stopPropagation();

                    if (contribution.abilityId === "unknown") return;

                    onToggleSelection?.({
                      type: "ability",
                      abilityId: contribution.abilityId,
                    });
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <title>
                    {`Round ${round.round} · ${contribution.abilityName}: ${contribution.damage} damage`}
                  </title>

                  <path
                    d={describeDonutSegment(
                      CX,
                      CY,
                      innerRadius,
                      outerRadius,
                      visualStartAngle,
                      visualEndAngle
                    )}
                    fill={color.fill}
                    fillOpacity={getContributionOpacity(
                      contribution.damage,
                      contributionIsRelated
                    )}
                    stroke={color.stroke}
                    strokeOpacity={contributionIsRelated ? 0.58 : 0.16}
                    strokeWidth={contributionIsRelated ? 1.25 : 0.8}
                  />

                  <path
                    d={describeTextArc(
                      CX,
                      CY,
                      outerRadius,
                      visualStartAngle + 0.35,
                      visualEndAngle - 0.35
                    )}
                    fill="none"
                    stroke={color.stroke}
                    strokeOpacity={contributionIsRelated ? 0.4 : 0.12}
                    strokeWidth="1"
                    strokeLinecap="round"
                  />

                  {getContributionIcon(
                    contribution,
                    iconSize,
                    iconPoint.x,
                    iconPoint.y,
                    color.stroke,
                    contributionIsRelated
                  )}
                </g>
              );
            })}

            <path
              d={describeTextArc(
                CX,
                CY,
                damageToRadius(roundTotal),
                visualStartAngle + 0.35,
                visualEndAngle - 0.35
              )}
              fill="none"
              stroke="#f1d5a8"
              strokeOpacity={
                roundIsRelated
                  ? Math.min(0.9, roundIntensity.outerStrokeOpacity + 0.24)
                  : roundIntensity.outerStrokeOpacity
              }
              strokeWidth={roundIsRelated ? 1.9 : 1.35}
              strokeLinecap="round"
            />

            <text
              x={roundLabelPoint.x}
              y={roundLabelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7.5"
              fontWeight="950"
              letterSpacing="0.03em"
              fill="rgba(255,244,218,0.82)"
              paintOrder="stroke"
              stroke="rgba(4,3,5,0.92)"
              strokeWidth="2"
              filter="url(#fineInkShadow)"
            >
              {`R${round.round}`}
            </text>

            <text
              x={valueLabelPoint.x}
              y={valueLabelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7.2"
              fontWeight="950"
              letterSpacing="0.01em"
              fill="rgba(255,226,182,0.74)"
              paintOrder="stroke"
              stroke="rgba(4,3,5,0.94)"
              strokeWidth="1.9"
              filter="url(#fineInkShadow)"
            >
              {Math.round(roundTotal)}
            </text>
          </g>
        );
      })}

      <text
        x={CX}
        y={CY - DPR_OUTER_RADIUS - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8.2"
        fontWeight="950"
        letterSpacing="0.1em"
        fill="rgba(255,244,218,0.56)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.92)"
        strokeWidth="2"
      >
        {`AVG ${averageDpr.toFixed(1)} DPR · FIXED SCALE 100`}
      </text>
    </g>
  );
}