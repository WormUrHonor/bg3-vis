import type { ClassName, RaceName } from "../types/buildPlannerTypes";

type BuildSummaryProps = {
  buildName: string;
  selectedRace: RaceName | "";
  selectedClass: ClassName | "";
  selectedLevel: number;
};

function BuildSummary({
  buildName,
  selectedRace,
  selectedClass,
  selectedLevel,
}: BuildSummaryProps) {
  return (
    <aside className="summary-card">
      <h2>Current Build</h2>

      <div className="summary-row">
        <span>Name</span>
        <strong>{buildName || "Untitled Build"}</strong>
      </div>

      <div className="summary-row">
        <span>Race</span>
        <strong>{selectedRace || "Not selected"}</strong>
      </div>

      <div className="summary-row">
        <span>Class</span>
        <strong>{selectedClass || "Not selected"}</strong>
      </div>

      <div className="summary-row">
        <span>Level</span>
        <strong>{selectedLevel}</strong>
      </div>
    </aside>
  );
}

export default BuildSummary;