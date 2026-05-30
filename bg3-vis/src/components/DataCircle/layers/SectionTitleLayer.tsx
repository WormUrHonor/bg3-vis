type SectionTitleLayerProps = {
  outerTitle?: string;
  svgInstanceId?: string;
};

export function SectionTitleLayer({
  outerTitle = "DPR BY ROUND",
  svgInstanceId = "data-circle",
}: SectionTitleLayerProps) {
  return (
    <g
      className="data-circle-section-title-layer"
      data-study-region="data-circle-section-title-layer"
      data-study-element="data-circle-section-titles"
      data-study-id={`${svgInstanceId}-section-title-layer`}
      pointerEvents="none"
    >
      <text
        className="data-circle-curved-title"
        data-study-element="data-circle-section-title"
        data-study-id={`${svgInstanceId}-section-title-range`}
      >
        <textPath href="#rangeTitlePath" startOffset="50%" textAnchor="middle">
          COMBAT RANGE PROFILE
        </textPath>
      </text>

      <text
        className="data-circle-curved-title"
        data-study-element="data-circle-section-title"
        data-study-id={`${svgInstanceId}-section-title-role`}
      >
        <textPath href="#roleTitlePath" startOffset="50%" textAnchor="middle">
          ABILITY ROLE DISTRIBUTION
        </textPath>
      </text>

      <text
        className="data-circle-curved-title"
        data-study-element="data-circle-section-title"
        data-study-id={`${svgInstanceId}-section-title-damage`}
      >
        <textPath href="#damageTitlePath" startOffset="50%" textAnchor="middle">
          DAMAGE TYPE PROFILE
        </textPath>
      </text>

      {outerTitle ? (
        <text
          className="data-circle-curved-title"
          data-study-element="data-circle-section-title"
          data-study-id={`${svgInstanceId}-section-title-outer`}
        >
          <textPath
            href="#resourceTitlePath"
            startOffset="50%"
            textAnchor="middle"
          >
            {outerTitle}
          </textPath>
        </text>
      ) : null}
    </g>
  );
}