import type { Dispatch, SetStateAction } from "react";
import { bg3Spells } from "../data/bg3Spells";
import { getAvailableSpellsForBuild } from "../data/bg3SpellAvailability";
import { toggleSpellSelection } from "../logic/spellSelectionLogic";
import type { ClassName, WarlockInvocation } from "../types/buildPlannerTypes";
import { getSpellIcon } from "../logic/spellIconLogic";

type SpellsAbilitiesTabProps = {
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedWarlockInvocations: WarlockInvocation[];
  selectedSpellIds: string[];
  setSelectedSpellIds: Dispatch<SetStateAction<string[]>>;
};

function SpellsAbilitiesTab({
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedWarlockInvocations,
  selectedSpellIds,
  setSelectedSpellIds,
}: SpellsAbilitiesTabProps) {
  const spellRanks = [1, 2, 3, 4, 5, 6] as const;

  const availableSpells = getAvailableSpellsForBuild(
    bg3Spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  );

  const availableSpellIds = availableSpells.map((spell) => spell.id);

  return (
    <div className="tab-content">
      <h2>Spells & Abilities</h2>
      <p className="panel-intro">
        Spells are shown as compact BG3-style icons. Hover over an icon to inspect its range,
        role, damage type, and resource requirements.
      </p>

      {!selectedClass && (
        <div className="placeholder-box">
          Select a class first to see available spells.
        </div>
      )}

      {selectedClass && availableSpells.length === 0 && (
        <div className="placeholder-box">
          No spells are currently available for this class, subclass, and level combination.
        </div>
      )}

      <div className="section-block">
        <h3>Spells by level</h3>

        <div className="spell-book">
          {spellRanks.map((rank) => {
            const spellsForRank = availableSpells.filter((spell) => spell.rank === rank);

            if (spellsForRank.length === 0) return null;

            return (
              <section key={rank} className="spell-rank-section">
                <h4>Level {rank}</h4>

                <div className="spell-icon-grid">
                  {spellsForRank.map((spell) => (
                    <button
                      key={spell.id}
                      className={[
                        "spell-icon-button",
                        selectedSpellIds.includes(spell.id) ? "selected-spell" : "",
                      ].join(" ")}
                      type="button"
                      onClick={() =>
                        setSelectedSpellIds((current) =>
                          toggleSpellSelection(spell.id, current, availableSpellIds)
                        )
                      }
                    >
                      <img
  src={getSpellIcon(spell)}
  alt={spell.name}
  className="spell-icon-image"
/>

                      <span className="spell-rank-badge">{spell.rank}</span>

                      {spell.costs.requiresConcentration && (
                        <span className="spell-concentration-badge">C</span>
                      )}

                      <span className="spell-tooltip">
                        <strong>{spell.name}</strong>

                        {spell.description && (
                          <span className="spell-description">
                            {spell.description}
                          </span>
                        )}

                        {spell.range && (
                          <span>
                            <b>Range:</b> {spell.range.label}
                          </span>
                        )}

                        {spell.roles.length > 0 && (
                          <span>
                            <b>Role:</b>{" "}
                            {spell.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
                          </span>
                        )}

                        {spell.damageTypes.length > 0 && (
                          <span>
                            <b>Damage:</b> {spell.damageTypes.join(", ")}
                          </span>
                        )}

                        {(spell.costs.actions.length > 0 ||
                          spell.costs.resources.length > 0) && (
                          <span>
                            <b>Cost:</b>{" "}
                            {[...spell.costs.actions, ...spell.costs.resources].join(", ")}
                          </span>
                        )}

                        {spell.costs.requiresConcentration && (
                          <span>Requires concentration</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <h3>Selected spells</h3>
        <div className="chip-grid">
          {selectedSpellIds.length === 0 && (
            <span className="muted-text">No spells selected yet.</span>
          )}

          {selectedSpellIds.map((spellId) => {
            const spell = bg3Spells.find((item) => item.id === spellId);
            if (!spell) return null;

            return (
              <span key={spell.id} className="choice-chip summary-chip">
                {spell.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <h3>Class abilities and passives</h3>
        <div className="placeholder-box">
          Class and subclass abilities can be shown here once the selected class and level are connected
          to the ability data.
        </div>
      </div>
    </div>
  );
}

export default SpellsAbilitiesTab;