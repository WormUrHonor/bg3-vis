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
  Variable: forceIcon,
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

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
}

function splitText(text: string, maxLength: number, maxLines = 3) {
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

  if (lines.length <= maxLines) return lines;

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].replace(
    /…$/,
    ""
  )}…`;

  return visibleLines;
}

function cleanDescription(description?: string) {
  if (!description) return "";

  return description
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
        y={CY - 33}
        size={27}
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
        y={CY - 33}
        size={27}
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

  const iconSize = linkedAbilityIds.length > 4 ? 15 : 17;
  const spacing = linkedAbilityIds.length > 4 ? 16.5 : 19;
  const startX = CX - ((linkedAbilityIds.length - 1) * spacing) / 2;

  return (
    <g>
      {linkedAbilityIds.map((abilityId, index) => {
        const iconHref = getAbilityIconHref(abilityId);

        return (
          <IconBadge
            key={abilityId}
            x={startX + index * spacing}
            y={CY - 35}
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

  const bodyLines = splitText(body, 24, 4);
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
        fontSize="8.4"
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

      <text
        x={CX}
        y={CY - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10.4"
        fontWeight="950"
        letterSpacing="0.045em"
        fill="rgba(255,244,218,0.98)"
        paintOrder="stroke"
        stroke="rgba(3,2,4,0.94)"
        strokeWidth="2.8"
        filter="url(#fineInkShadow)"
      >
        {truncateLabel(title.toUpperCase(), 23)}
      </text>

      {bodyLines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={CX}
          y={CY + 18 + index * 10.8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.9"
          fontWeight="800"
          letterSpacing="0.01em"
          fill="rgba(255,236,200,0.82)"
          paintOrder="stroke"
          stroke="rgba(3,2,4,0.9)"
          strokeWidth="1.45"
        >
          {line}
        </text>
      ))}
    </g>
  );
}