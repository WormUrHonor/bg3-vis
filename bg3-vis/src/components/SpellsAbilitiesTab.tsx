import { bg3Spells } from "../data/bg3Spells";
import placeholderSpellIcon from "../assets/Damage Types/Radiant_Damage_Icon.png";

function SpellsAbilitiesTab() {
  const spellRanks = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="tab-content">
      <h2>Spells & Abilities</h2>
      <p className="panel-intro">
        Spells are shown as compact BG3-style icons. Hover over an icon to inspect its range,
        role, damage type, and resource requirements.
      </p>

      <div className="section-block">
        <h3>Spells by level</h3>

        <div className="spell-book">
          {spellRanks.map((rank) => {
            const spellsForRank = bg3Spells.filter((spell) => spell.rank === rank);

            return (
              <section key={rank} className="spell-rank-section">
                <h4>Level {rank}</h4>

                <div className="spell-icon-grid">
                  {spellsForRank.map((spell) => (
                    <button key={spell.id} className="spell-icon-button" type="button">
                      <img src={placeholderSpellIcon} alt={spell.name} className="spell-icon-image" />

                      <span className="spell-rank-badge">{spell.rank}</span>

                      {spell.costs.requiresConcentration && (
                        <span className="spell-concentration-badge">C</span>
                      )}

                      <span className="spell-tooltip">
                        <strong>{spell.name}</strong>

                        <span>
                          <b>Range:</b> {spell.range.label}
                        </span>

                        <span>
                          <b>Role:</b>{" "}
                          {spell.roles.length > 0
                            ? spell.roles.map((role) => role.replaceAll("-", " ")).join(", ")
                            : "None"}
                        </span>

                        <span>
                          <b>Damage:</b>{" "}
                          {spell.damageTypes.length > 0 ? spell.damageTypes.join(", ") : "None"}
                        </span>

                        <span>
                          <b>Cost:</b> {spell.costs.actions.join(", ")}
                          {spell.costs.resources.length > 0
                            ? ` + ${spell.costs.resources.join(", ")}`
                            : ""}
                        </span>

                        {spell.costs.requiresConcentration && <span>Requires concentration</span>}
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