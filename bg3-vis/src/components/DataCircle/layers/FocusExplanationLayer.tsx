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
import weaponIcon from "../../../assets/Damage Types/weapon.webp";
import variableIcon from "../../../assets/Damage Types/variableIcon.webp";
import { getClassFeatureById } from "../../../data/bg3ClassFeatures";
import { getSpellById } from "../../../data/bg3Spells";
import { getClassFeatureIcon } from "../../../logic/classFeatureIconLogic";
import { getSpellIcon } from "../../../logic/spellIconLogic";

import { DAMAGE_TYPES } from "../dataCircleConfig";
import { CX, CY, polarToCartesian } from "../dataCircleGeometry";
import {
  getFocusedAbilityIds,
  getFocusItems,
  getFocusSummary,
  type DataCircleFocus,
  type DataCircleFocusItem,
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

type AbilityTextDetails = {
  title: string;
  description: string;
};

type WrappedText = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
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
  Weapon: weaponIcon,
  Variable: variableIcon,
};

const DAMAGE_TYPE_SHORT_LABELS: Record<DamageRingKey, string> = {
  Bludgeoning: "BL",
  Piercing: "PI",
  Slashing: "SL",
  Weapon: "WP",
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

function cleanDescription(description?: string) {
  if (!description) return "";

  return description
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function wrapText(
  rawText: string,
  options: {
    maxLines: number;
    maxCharsPerLine: number;
    fontSize: number;
    lineHeight: number;
  }
): WrappedText {
  const text = cleanDescription(rawText);

  if (!text) {
    return {
      lines: [],
      fontSize: options.fontSize,
      lineHeight: options.lineHeight,
    };
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > options.maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(truncateLabel(word, options.maxCharsPerLine));
        currentLine = "";
      }
    } else {
      currentLine = nextLine;
    }

    if (lines.length >= options.maxLines) break;
  }

  if (currentLine && lines.length < options.maxLines) {
    lines.push(currentLine);
  }

  if (lines.length > 0) {
    const consumedText = lines.join(" ");
    if (consumedText.length < text.length) {
      lines[lines.length - 1] = `${lines[lines.length - 1]
        .replace(/…$/, "")
        .slice(0, options.maxCharsPerLine - 1)
        .trim()}…`;
    }
  }

  return {
    lines,
    fontSize: options.fontSize,
    lineHeight: options.lineHeight,
  };
}

function getTitleLines(rawTitle: string): WrappedText {
  const title = cleanDescription(rawTitle).toUpperCase();

  if (title.length <= 13) {
    return {
      lines: [title],
      fontSize: 13.6,
      lineHeight: 13.8,
    };
  }

  if (title.length <= 22) {
    return wrapText(title, {
      maxLines: 2,
      maxCharsPerLine: 13,
      fontSize: 11.8,
      lineHeight: 12.4,
    });
  }

  return wrapText(truncateLabel(title, 31), {
    maxLines: 2,
    maxCharsPerLine: 15,
    fontSize: 10.6,
    lineHeight: 11.5,
  });
}

function getBodyLines(rawBody: string): WrappedText {
  const body = cleanDescription(rawBody);

  if (body.length <= 58) {
    return wrapText(body, {
      maxLines: 3,
      maxCharsPerLine: 23,
      fontSize: 10.4,
      lineHeight: 11.8,
    });
  }

  if (body.length <= 115) {
    return wrapText(body, {
      maxLines: 4,
      maxCharsPerLine: 25,
      fontSize: 9.7,
      lineHeight: 10.9,
    });
  }

  return wrapText(body, {
    maxLines: 5,
    maxCharsPerLine: 27,
    fontSize: 8.9,
    lineHeight: 9.9,
  });
}

function renderCenteredLines(args: {
  lines: string[];
  startY: number;
  fontSize: number;
  lineHeight: number;
  fill: string;
  stroke: string;
  strokeWidth: string;
  fontWeight: string;
  letterSpacing?: string;
}) {
  const {
    lines,
    startY,
    fontSize,
    lineHeight,
    fill,
    stroke,
    strokeWidth,
    fontWeight,
    letterSpacing = "0.01em",
  } = args;

  return lines.map((line, index) => (
    <text
      key={`${line}-${index}`}
      x={CX}
      y={startY + index * lineHeight}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fontSize}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      fill={fill}
      paintOrder="stroke"
      stroke={stroke}
      strokeWidth={strokeWidth}
      filter="url(#fineInkShadow)"
    >
      {line}
    </text>
  ));
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

  if (spell) {
    return getSpellIcon(spell);
  }

  const feature = getClassFeatureById(abilityId);

  if (feature) {
    return getClassFeatureIcon(feature);
  }

  return undefined;
}

function getAbilityTextDetails(abilityId: string): AbilityTextDetails | null {
  const spell = getSpellById(abilityId);

  if (spell) {
    return {
      title: spell.name,
      description: cleanDescription(spell.description),
    };
  }

  const feature = getClassFeatureById(abilityId);

  if (feature) {
    return {
      title: feature.name,
      description: cleanDescription(feature.description),
    };
  }

  return null;
}

function getPrimaryFocusItem(focus: DataCircleFocus): DataCircleFocusItem | null {
  const focusItems = getFocusItems(focus);
  return focusItems[0] ?? null;
}

function getFocusKindLabel(focus: DataCircleFocus) {
  const focusItems = getFocusItems(focus);

  if (focusItems.length === 0) return "TRACE";
  if (focusItems.length > 1) return "FILTER";

  const focusItem = focusItems[0];

  if (focusItem.type === "ability") return "ABILITY";
  if (focusItem.type === "damageType") return "DAMAGE";
  if (focusItem.type === "role") return "ROLE";
  if (focusItem.type === "roleGroup") return "ROLE";
  if (focusItem.type === "range") return "RANGE";
  if (focusItem.type === "round") return "ROUND";

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
          fontSize={size <= 15 ? "5.8" : "7.2"}
          fontWeight="950"
          letterSpacing="0.02em"
          fill="rgba(255,248,226,0.96)"
          paintOrder="stroke"
          stroke="rgba(3,2,4,0.82)"
          strokeWidth="1.35"
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
  const primaryFocus = getPrimaryFocusItem(focus);

  if (!primaryFocus) return null;

  if (primaryFocus.type === "ability") {
    const iconHref = getAbilityIconHref(primaryFocus.abilityId);

    return (
      <IconBadge
        x={CX}
        y={CY - 37}
        size={31}
        href={iconHref}
        label={!iconHref ? "?" : undefined}
        stroke="rgba(230,188,112,0.72)"
        clipId={`focus-main-ability-${primaryFocus.abilityId}`}
      />
    );
  }

  if (primaryFocus.type === "damageType") {
    const visual = getDamageTypeVisual(primaryFocus.damageType);

    return (
      <IconBadge
        x={CX}
        y={CY - 37}
        size={31}
        href={visual.href}
        label={!visual.href ? visual.label : undefined}
        fill={visual.fill}
        stroke={visual.stroke}
        clipId={`focus-main-damage-${primaryFocus.damageType}`}
      />
    );
  }

  const linkedAbilityIds = getFocusedAbilityIds(focus, relationshipIndex).slice(
    0,
    5
  );

  if (linkedAbilityIds.length <= 0) return null;

  const iconSize = linkedAbilityIds.length > 4 ? 16.5 : 18.5;
  const spacing = linkedAbilityIds.length > 4 ? 18 : 20.5;
  const startX = CX - ((linkedAbilityIds.length - 1) * spacing) / 2;

  return (
    <g>
      {linkedAbilityIds.map((abilityId, index) => {
        const iconHref = getAbilityIconHref(abilityId);

        return (
          <IconBadge
            key={abilityId}
            x={startX + index * spacing}
            y={CY - 38}
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
  const primaryFocus = getPrimaryFocusItem(focus);

  const abilityText =
    primaryFocus?.type === "ability"
      ? getAbilityTextDetails(primaryFocus.abilityId)
      : null;

  const title = abilityText?.title || summary.title;
  const body = abilityText?.description || summary.body;

  const titleText = getTitleLines(title);
  const bodyText = getBodyLines(body);
  const kindLabel = getFocusKindLabel(focus);

  const titleStartY =
    titleText.lines.length > 1 ? CY - 7 : CY - 4;

  const bodyStartY =
    titleText.lines.length > 1
      ? CY + 19
      : CY + 16;

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
        r="62"
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
        const inner = polarToCartesian(CX, CY, 61, angle);
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
        y={CY - 67}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontWeight="950"
        letterSpacing="0.16em"
        fill="rgba(229,202,152,0.82)"
        paintOrder="stroke"
        stroke="rgba(4,3,5,0.9)"
        strokeWidth="1.9"
      >
        {kindLabel}
      </text>

      <FocusIconRow focus={focus} relationshipIndex={relationshipIndex} />

      {renderCenteredLines({
        lines: titleText.lines,
        startY: titleStartY,
        fontSize: titleText.fontSize,
        lineHeight: titleText.lineHeight,
        fill: "rgba(255,244,218,0.98)",
        stroke: "rgba(3,2,4,0.94)",
        strokeWidth: "2.8",
        fontWeight: "950",
        letterSpacing: "0.035em",
      })}

      {bodyText.lines.length > 0 ? (
        <g>
          {renderCenteredLines({
            lines: bodyText.lines,
            startY: bodyStartY,
            fontSize: bodyText.fontSize,
            lineHeight: bodyText.lineHeight,
            fill: "rgba(255,236,200,0.88)",
            stroke: "rgba(3,2,4,0.9)",
            strokeWidth: "1.45",
            fontWeight: "820",
            letterSpacing: "0em",
          })}
        </g>
      ) : null}
    </g>
  );
}