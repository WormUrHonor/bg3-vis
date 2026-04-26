function SpellsAbilitiesTab() {
  return (
    <div className="tab-content">
      <h2>Spells & Abilities</h2>
      <p className="panel-intro">
        Next implementation step: restrict available cantrips, spells, and class abilities by
        selected class and level.
      </p>

      <div className="section-block">
        <h3>Cantrips</h3>
        <div className="chip-grid">
          {["Fire Bolt", "Guidance", "Mage Hand", "Ray of Frost", "Eldritch Blast"].map((spell) => (
            <button key={spell} className="choice-chip" type="button">
              {spell}
            </button>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Spells by level</h3>
        <div className="spell-levels">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="spell-level-card">
              <h4>Level {level}</h4>
              <button className="small-button" type="button">
                Add spell
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Class abilities and passives</h3>
        <div className="placeholder-box">
          Class and subclass abilities can be shown here once the selected class and level are known.
        </div>
      </div>
    </div>
  );
}

export default SpellsAbilitiesTab;