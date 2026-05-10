type SectionTitleLayerProps = {
  showResourceTitle?: boolean;
};

export function SectionTitleLayer({
  showResourceTitle = true,
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

      {showResourceTitle ? (
        <text className="data-circle-curved-title">
          <textPath
            href="#resourceTitlePath"
            startOffset="50%"
            textAnchor="middle"
          >
            ACTION RESOURCES AND REQUIREMENTS
          </textPath>
        </text>
      ) : null}
    </>
  );
}