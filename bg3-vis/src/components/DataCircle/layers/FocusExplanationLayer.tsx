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
import { getSpellById } from "../../../data/bg3Spells";
import { getSpellIcon } from "../../../logic/spellIconLogic";
import { DAMAGE_TYPES } from "../dataCircleConfig";
import { CX, CY, polarToCartesian } from "../dataCircleGeometry";
import {
  getFocusedAbilityIds,
  getFocusSummary,
  type DataCircleFocus,
  type LayerRelationshipIndex,
} from "../dataCircleInteraction";
import type { DamageRingKey } from "../dataCircleTypes";

type FocusExplanationLayerProps = {
  focus: DataCircleFocus;
  relationshipIndex: LayerRelationshipIndex;
};

type IconBadgeProps = {
  x: number;
  y: number;
  size: number;
  href?: string;
  label?: string;
  fill?: string;
  stroke?: string;
  clipId: string;
};

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

  Physical: bludgeoningIcon,
  Variable: forceIcon,
};

const DAMAGE_TYPE_SHORT_LABELS: Record<DamageRingKey, string> = {
  Bludgeoning: "BL",
  Piercing: "PI",
  Slashing: "SL",
  Physical: "PH",
  Acid: "AC",
  Cold: "CO",
  Fire: "FI",
  Force: "FO",
  Lightning: "LI",
  Necrotic: "NE",
  Poison: "PO",
  Psychic: "PS",
  Radiant: "RA",
  Thunder: "TH",
  Variable: "VA",
};

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
}

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

function getDamageTypeVisual(damageType: DamageRingKey) {
  const visual = DAMAGE_TYPES.find((type) => type.key === damageType);

  return {
    href: DAMAGE_TYPE_ICONS[damageType],
    fill: visual?.color ?? "rgba(176,119,214,1)",
    stroke: visual?.glowColor ?? "rgba(255,239,185,0.68)",
    label: DAMAGE_TYPE_SHORT_LABELS[damageType],
  };
}

function getAbilityIconHref(abilityId: string) {
  const spell = getSpellById(abilityId);

  if (!spell) return undefined;

  return getSpellIcon(spell);
}

function getFocusKindLabel(focus: DataCircleFocus) {
  if (!focus) return "TRACE";

  if (focus.type === "ability") return "ABILITY";
  if (focus.type === "damageType") return "DAMAGE";
  if (focus.type === "role") return "ROLE";
  if (focus.type === "range") return "RANGE";
  if (focus.type === "round") return "ROUND";

  return "TRACE";
}

function IconBadge({
  x,
  y,
  size,
  href,
  label,
  fill = "rgba(176,119,214,1)",
  stroke = "rgba(255,239,185,0.68)",
  clipId,
}: IconBadgeProps) {
  const radius = size / 2;

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={radius + 4}
        fill={stroke}
        fillOpacity="0.18"
        filter="url(#moteGlow)"
      />

      <circle
        cx={x}
        cy={y}
        r={radius + 1.8}
        fill="rgba(8,5,9,0.94)"
        stroke={stroke}
        strokeOpacity="0.52"
        strokeWidth="1"
      />

      {href ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={x} cy={y} r={radius} />
            </clipPath>
          </defs>

          <circle
            cx={x}
            cy={y}
            r={radius}
            fill="rgba(7,5,8,0.88)"
            stroke={stroke}
            strokeOpacity="0.56"
            strokeWidth="0.7"
          />

          <image
            href={href}
            x={x - radius}
            y={y - radius}
            width={size}
            height={size}
            opacity="0.96"
            preserveAspectRatio="xMidYMid meet"
            clipPath={`url(#${clipId})`}
          />
        </>
      ) : (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill={fill}
          stroke={stroke}
          strokeOpacity="0.82"
          strokeWidth="0.85"
        />
      )}

      {!href && label ? (
        <text
          x={x}
          y={y + 0.4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size <= 15 ? "5.2" : "6.4"}
          fontWeight="950"
          letterSpacing="0.02em"
          fill="rgba(255,248,226,0.96)"
          paintOrder="stroke"
          stroke="rgba(3,2,4,0.82)"
          strokeWidth="1.3"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function FocusIconRow({
  focus,
  relationshipIndex,
}: FocusExplanationLayerProps) {
  if (!focus) return null;

  if (focus.type === "ability") {
    const iconHref = getAbilityIconHref(focus.abilityId);

    return (
      <IconBadge
        x={CX}
        y={CY - 32}
        size={26}
        href={iconHref}
        label={!iconHref ? "?" : undefined}
        stroke="rgba(230,188,112,0.72)"
        clipId={`focus-main-ability-${focus.abilityId}`}
      />
    );
  }

  if (focus.type === "damageType") {
    const visual = getDamageTypeVisual(focus.damageType);

    return (
      <IconBadge
        x={CX}
        y={CY - 32}
        size={26}
        href={visual.href}
        label={!visual.href ? visual.label : undefined}
        fill={visual.fill}
        stroke={visual.stroke}
        clipId={`focus-main-damage-${focus.damageType}`}
      />
    );
  }

  const linkedAbilityIds = getFocusedAbilityIds(focus, relationshipIndex).slice(
    0,
    5
  );

  if (linkedAbilityIds.length <= 0) return null;

  const iconSize = linkedAbilityIds.length > 4 ? 14 : 16;
  const spacing = linkedAbilityIds.length > 4 ? 15.5 : 18;
  const startX = CX - ((linkedAbilityIds.length - 1) * spacing) / 2;

  return (
    <g>
      {linkedAbilityIds.map((abilityId, index) => {
        const iconHref = getAbilityIconHref(abilityId);

        return (
          <IconBadge
            key={abilityId}
            x={startX + index * spacing}
            y={CY - 34}
            size={iconSize}
            href={iconHref}
            label={!iconHref ? "?" : undefined}
            stroke="rgba(230,188,112,0.58)"
            clipId={`focus-linked-ability-${abilityId}-${index}`}
          />
        );
      })}
    </g>
  );
}

export function FocusExplanationLayer({
  focus,
  relationshipIndex,
}: FocusExplanationLayerProps) {
  const summary = getFocusSummary(focus, relationshipIndex);
  const bodyLines = splitText(summary.body, 28);
  const kindLabel = getFocusKindLabel(focus);

  return (
    <g className="data-circle-focus-explanation" pointerEvents="none">
      <circle
        cx={CX}
        cy={CY}
        r="92"
        fill="rgba(9,6,8,0.97)"
        stroke="rgba(230,190,112,0.46)"
        strokeWidth="2.4"
        filter="url(#arcaneSoftGlow)"
      />

      <circle
        cx={CX}
        cy={CY}
        r="82"
        fill="url(#sealGradient)"
        fillOpacity="0.28"
        stroke="rgba(255,226,164,0.52)"
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
        fill="rgba(5,4,6,0.44)"
        stroke="rgba(255,226,164,0.16)"
        strokeWidth="1"
      />

      {Array.from({ length: 16 }, (_, index) => {
        const angle = index * 22.5;
        const inner = polarToCartesian(CX, CY, 74, angle);
        const outer = polarToCartesian(CX, CY, 90, angle);

        return (
          <line
            key={`focus-seal-outer-tick-${index}`}
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
            key={`focus-seal-inner-tick-${index}`}
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

      <text
        x={CX}
        y={CY - 64}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7.2"
        fontWeight="950"
        letterSpacing="0.16em"
        fill="rgba(229,202,152,0.78)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.9)"
        strokeWidth="1.8"
      >
        {kindLabel}
      </text>

      <FocusIconRow focus={focus} relationshipIndex={relationshipIndex} />

      <text
        x={CX}
        y={CY - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="950"
        letterSpacing="0.045em"
        fill="rgba(255,244,218,0.96)"
        paintOrder="stroke"
        stroke="rgba(3,2,4,0.94)"
        strokeWidth="2.6"
        filter="url(#fineInkShadow)"
      >
        {truncateLabel(summary.title.toUpperCase(), 26)}
      </text>

      {bodyLines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={CX}
          y={CY + 20 + index * 11}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7.2"
          fontWeight="760"
          letterSpacing="0.01em"
          fill="rgba(255,236,200,0.78)"
          paintOrder="stroke"
          stroke="rgba(3,2,4,0.9)"
          strokeWidth="1.55"
        >
          {line}
        </text>
      ))}

      <rect
        x={CX - 48}
        y={CY + 55}
        width="96"
        height="18"
        rx="9"
        fill="rgba(8,6,8,0.72)"
        stroke="rgba(255,226,164,0.2)"
        strokeWidth="1"
      />

      <text
        x={CX}
        y={CY + 64.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7.2"
        fontWeight="900"
        letterSpacing="0.08em"
        fill="rgba(255,238,199,0.82)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.92)"
        strokeWidth="1.5"
      >
        CROSS-LAYER TRACE
      </text>
    </g>
  );
}