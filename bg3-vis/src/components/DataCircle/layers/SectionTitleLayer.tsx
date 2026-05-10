type SectionTitleLayerProps = {
  outerTitle?: string;
};

export function SectionTitleLayer({
  outerTitle = "DPR BY ROUND",
}: SectionTitleLayerProps) {
  return (
    <>
      <text className="data-circle-curved-title">
        <textPath href="#rangeTitlePath" startOffset="50%" textAnchor="middle">
          COMBAT RANGE PROFILE
        </textPath>
      </text>

      <text className="data-circle-curved-title">
        <textPath href="#roleTitlePath" startOffset="50%" textAnchor="middle">
          ABILITY ROLE DISTRIBUTION
        </textPath>
      </text>

      <text className="data-circle-curved-title">
        <textPath href="#damageTitlePath" startOffset="50%" textAnchor="middle">
          DAMAGE TYPE PROFILE
        </textPath>
      </text>

      {outerTitle ? (
        <text className="data-circle-curved-title">
          <textPath
            href="#resourceTitlePath"
            startOffset="50%"
            textAnchor="middle"
          >
            {outerTitle}
          </textPath>
        </text>
      ) : null}
    </>
  );
}