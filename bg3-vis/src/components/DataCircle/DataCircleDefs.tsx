import {
  CX,
  CY,
  describeTextArc,
} from "./dataCircleGeometry";
import {
  RANGE_BANDS,
  RANGE_LABEL_ARC_END,
  RANGE_LABEL_ARC_START,
} from "./dataCircleConfig";

export function DataCircleDefs() {
  return (
    <defs>
      <radialGradient id="arcaneBackground" cx="50%" cy="50%" r="58%">
        <stop offset="0%" stopColor="rgba(111, 70, 122, 0.13)" />
        <stop offset="42%" stopColor="rgba(29, 21, 32, 0.76)" />
        <stop offset="76%" stopColor="rgba(10, 8, 10, 0.96)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      <radialGradient id="sealGradient" cx="50%" cy="42%" r="70%">
        <stop offset="0%" stopColor="#e9c469" />
        <stop offset="42%" stopColor="#9b672d" />
        <stop offset="78%" stopColor="#3b2613" />
        <stop offset="100%" stopColor="#15100c" />
      </radialGradient>

      <radialGradient id="moteGradient" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#fff9de" />
        <stop offset="34%" stopColor="#d6b86a" />
        <stop offset="72%" stopColor="#7f4a96" />
        <stop offset="100%" stopColor="#251631" />
      </radialGradient>

      <filter id="arcaneSoftGlow">
        <feGaussianBlur stdDeviation="4.2" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="
            0.95 0 0 0 0.12
            0 0.72 0 0 0.06
            0 0 0.85 0 0.16
            0 0 0 0.48 0
          "
          result="warmArcaneGlow"
        />
        <feMerge>
          <feMergeNode in="warmArcaneGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="moteGlow">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="
            0.95 0 0 0 0.14
            0 0.72 0 0 0.08
            0 0 0.88 0 0.18
            0 0 0 0.62 0
          "
          result="moteGlowColor"
        />
        <feMerge>
          <feMergeNode in="moteGlowColor" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="elementalBloom" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.6" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="
            1 0 0 0 0.08
            0 0.9 0 0 0.06
            0 0 0.95 0 0.10
            0 0 0 0.5 0
          "
          result="coloredGlow"
        />
        <feMerge>
          <feMergeNode in="coloredGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="fineInkShadow">
        <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#050306" floodOpacity="0.8" />
      </filter>

      <filter id="engravedNoise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.92"
          numOctaves="2"
          seed="27"
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="
            0 0 0 0 0.68
            0 0 0 0 0.55
            0 0 0 0 0.82
            0 0 0 0.04 0
          "
          result="softNoise"
        />
        <feBlend in="SourceGraphic" in2="softNoise" mode="screen" />
      </filter>

      <clipPath id="innerOrreryClip">
        <circle cx={CX} cy={CY} r="216" />
      </clipPath>

      {RANGE_BANDS.map((band) => (
        <path
          key={`range-label-path-${band.key}`}
          id={`rangeLabelPath-${band.key}`}
          d={describeTextArc(
            CX,
            CY,
            band.labelRadius,
            RANGE_LABEL_ARC_START,
            RANGE_LABEL_ARC_END
          )}
        />
      ))}

      <path id="rangeTitlePath" d={describeTextArc(CX, CY, 230, -50, 50)} />
      <path id="roleTitlePath" d={describeTextArc(CX, CY, 284, -50, 50)} />
      <path id="damageTitlePath" d={describeTextArc(CX, CY, 350, -52, 52)} />
      <path id="resourceTitlePath" d={describeTextArc(CX, CY, 406, -56, 56)} />
    </defs>
  );
}
