import type { Dispatch, SetStateAction } from "react";
import { bg3Spells } from "../data/bg3Spells";
import type { BG3ClassFeature } from "../data/bg3ClassFeatures";
import { getAvailableSpellsForBuild } from "../data/bg3SpellAvailability";
import { toggleSpellSelection } from "../logic/spellSelectionLogic";
import { toggleClassFeatureSelection } from "../logic/classFeatureSelectionLogic";
import type { ClassName, WarlockInvocation } from "../types/buildPlannerTypes";
import { getSpellIcon } from "../logic/spellIconLogic";
import { getClassFeatureIcon } from "../logic/classFeatureIconLogic";
import concentrationIcon from "../assets/UI Icons/20px-Concentration_Icon.png.webp";

type SpellsAbilitiesTabProps = {
  selectedClass: ClassName | "";
  selectedSubclass: string;
  selectedLevel: number;
  selectedWarlockInvocations: WarlockInvocation[];
  selectedSpellIds: string[];
  setSelectedSpellIds: Dispatch<SetStateAction<string[]>>;
  availableClassFeatures: BG3ClassFeature[];
  selectedClassFeatureIds: string[];
  fixedClassFeatureIds: string[];
  setSelectedClassFeatureIds: Dispatch<SetStateAction<string[]>>;
};

function toRoman(value: number): string {
  if (value === 0) return "C";

  const romanByNumber: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
  };

  return romanByNumber[value] ?? String(value);
}

function getClassAbilityTabTitle(
  selectedClass: ClassName | "",
  selectedSubclass: string
): string {
  if (!selectedClass) return "Spells & Abilities";

  if (selectedClass === "Fighter" && selectedSubclass === "Battle Master") {
    return "Manoeuvres & Fighter Features";
  }

  if (selectedClass === "Fighter") {
    return "Fighter Features";
  }

  if (selectedClass === "Warlock") {
    return "Spells, Invocations & Features";
  }

  if (selectedClass === "Monk") {
    return "Ki Actions & Monk Features";
  }

  if (selectedClass === "Barbarian") {
    return "Rage Actions & Barbarian Features";
  }

  if (selectedClass === "Rogue") {
    return "Rogue Actions & Features";
  }

  if (selectedClass === "Bard") {
    return "Spells, Inspirations & Bard Features";
  }

  if (selectedClass === "Cleric") {
    return "Spells, Channel Divinity & Cleric Features";
  }

  if (selectedClass === "Druid") {
    return "Spells, Wild Shape & Druid Features";
  }

  if (selectedClass === "Paladin") {
    return "Spells, Smites & Paladin Features";
  }

  if (selectedClass === "Ranger") {
    return "Spells & Ranger Features";
  }

  if (selectedClass === "Sorcerer") {
    return "Spells, Metamagic & Sorcerer Features";
  }

  if (selectedClass === "Wizard") {
    return "Spells & Wizard Features";
  }

  return `${selectedClass} Spells & Features`;
}

function formatCost(actions: string[], resources: string[]): string {
  const items = [...actions, ...resources].filter((item) => item !== "none");

  if (items.length === 0) return "none";

  return items.join(", ");
}

function SpellsAbilitiesTab({
  selectedClass,
  selectedSubclass,
  selectedLevel,
  selectedWarlockInvocations,
  selectedSpellIds,
  setSelectedSpellIds,
  availableClassFeatures,
  selectedClassFeatureIds,
  fixedClassFeatureIds,
  setSelectedClassFeatureIds,
}: SpellsAbilitiesTabProps) {
  const spellRanks = [0, 1, 2, 3, 4, 5, 6] as const;

  const availableSpells = getAvailableSpellsForBuild(
    bg3Spells,
    selectedClass,
    selectedSubclass,
    selectedLevel,
    selectedWarlockInvocations
  );

  const availableSpellIds = availableSpells.map((spell) => spell.id);

  const selectedSpellCount = selectedSpellIds.length;
  const fixedFeatureCount = fixedClassFeatureIds.length;
  const selectedFeatureCount = selectedClassFeatureIds.length;

  const fixedFeatures = availableClassFeatures.filter((feature) => feature.isFixed);
  const selectableFeatures = availableClassFeatures.filter((feature) => !feature.isFixed);

  const choiceGroups = Array.from(
    new Map(
      selectableFeatures
        .filter((feature) => feature.choiceGroupId)
        .map((feature) => [
          feature.choiceGroupId,
          {
            id: feature.choiceGroupId as string,
            label: feature.choiceGroupLabel ?? "Choices",
            max: feature.choiceGroupMax ?? 1,
          },
        ])
    ).values()
  );

  const ungroupedSelectableFeatures = selectableFeatures.filter(
    (feature) => !feature.choiceGroupId
  );

  return (
    <div className="tab-content">
      <div className="section-heading-row">
        <div>
          <h2>{getClassAbilityTabTitle(selectedClass, selectedSubclass)}</h2>
          <p className="panel-intro compact-intro">
            Select available spells, cantrips, class actions, passives, and subclass-specific
            choices. Fixed features are shown as already granted.
          </p>
        </div>

        {selectedClass && (
          <span className="section-count-pill">
            {selectedSpellCount + selectedFeatureCount + fixedFeatureCount}
          </span>
        )}
      </div>

      {!selectedClass && (
        <div className="placeholder-box">
          Select a class first to see available spells and class features.
        </div>
      )}

      {selectedClass && availableSpells.length === 0 && availableClassFeatures.length === 0 && (
        <div className="placeholder-box">
          No spells or class features are currently available for this class, subclass, and level
          combination.
        </div>
      )}

      {fixedFeatures.length > 0 && (
        <div className="section-block">
          <div className="ability-section-heading">
            <h3>Granted features</h3>
            <span>Fixed</span>
          </div>

          <div className="ability-icon-grid">
            {fixedFeatures.map((feature) => (
              <button
                key={feature.id}
                className="spell-icon-button fixed-ability"
                type="button"
                disabled
              >
                <img
                  src={getClassFeatureIcon(feature)}
                  alt={feature.name}
                  className="spell-icon-image"
                />

                <span className="ability-kind-badge">
                  {feature.kind === "passive" ? "P" : "A"}
                </span>

                <span className="spell-tooltip">
                  <strong>{feature.name}</strong>

                  {feature.description && (
                    <span className="spell-description">{feature.description}</span>
                  )}

                  <span>
                    <b>Type:</b> {feature.kind.replaceAll("-", " ")}
                  </span>

                  {feature.roles.length > 0 && (
                    <span>
                      <b>Role:</b>{" "}
                      {feature.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
                    </span>
                  )}

                  {feature.damageTypes.length > 0 && (
                    <span>
                      <b>Damage:</b> {feature.damageTypes.join(", ")}
                    </span>
                  )}

                  <span>
                    <b>Cost:</b>{" "}
                    {formatCost(feature.costs.actions, feature.costs.resources)}
                  </span>

                  <span>Granted automatically</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {choiceGroups.map((group) => {
        const featuresForGroup = selectableFeatures.filter(
          (feature) => feature.choiceGroupId === group.id
        );

        const selectedInGroup = featuresForGroup.filter((feature) =>
          selectedClassFeatureIds.includes(feature.id)
        ).length;

        return (
          <div key={group.id} className="section-block">
            <div className="ability-section-heading">
              <h3>{group.label}</h3>
              <span>
                {selectedInGroup}/{group.max}
              </span>
            </div>

            <div className="ability-icon-grid">
              {featuresForGroup.map((feature) => {
                const isSelected = selectedClassFeatureIds.includes(feature.id);
                const groupFull = selectedInGroup >= group.max && !isSelected;

                return (
                  <button
                    key={feature.id}
                    className={[
                      "spell-icon-button",
                      isSelected ? "selected-spell" : "",
                      groupFull ? "choice-disabled-soft" : "",
                    ].join(" ")}
                    type="button"
                    disabled={groupFull}
                    onClick={() =>
                      setSelectedClassFeatureIds((current) =>
                        toggleClassFeatureSelection(
                          feature.id,
                          current,
                          availableClassFeatures
                        )
                      )
                    }
                  >
                    <img
                      src={getClassFeatureIcon(feature)}
                      alt={feature.name}
                      className="spell-icon-image"
                    />

                    <span className="ability-kind-badge">M</span>

                    <span className="spell-tooltip">
                      <strong>{feature.name}</strong>

                      {feature.description && (
                        <span className="spell-description">{feature.description}</span>
                      )}

                      <span>
                        <b>Type:</b> {feature.kind.replaceAll("-", " ")}
                      </span>

                      {feature.range && (
                        <span>
                          <b>Range:</b> {feature.range.label}
                        </span>
                      )}

                      {feature.roles.length > 0 && (
                        <span>
                          <b>Role:</b>{" "}
                          {feature.roles.map((role) => role.replaceAll("-", " ")).join(", ")}
                        </span>
                      )}

                      {feature.damageTypes.length > 0 && (
                        <span>
                          <b>Damage:</b> {feature.damageTypes.join(", ")}
                        </span>
                      )}

                      <span>
                        <b>Cost:</b>{" "}
                        {formatCost(feature.costs.actions, feature.costs.resources)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {ungroupedSelectableFeatures.length > 0 && (
        <div className="section-block">
          <div className="ability-section-heading">
            <h3>Class choices</h3>
            <span>{ungroupedSelectableFeatures.length}</span>
          </div>

          <div className="ability-icon-grid">
            {ungroupedSelectableFeatures.map((feature) => {
              const isSelected = selectedClassFeatureIds.includes(feature.id);

              return (
                <button
                  key={feature.id}
                  className={["spell-icon-button", isSelected ? "selected-spell" : ""].join(
                    " "
                  )}
                  type="button"
                  onClick={() =>
                    setSelectedClassFeatureIds((current) =>
                      toggleClassFeatureSelection(
                        feature.id,
                        current,
                        availableClassFeatures
                      )
                    )
                  }
                >
                  <img
                    src={getClassFeatureIcon(feature)}
                    alt={feature.name}
                    className="spell-icon-image"
                  />

                  <span className="ability-kind-badge">
                    {feature.kind === "passive" ? "P" : "A"}
                  </span>

                  <span className="spell-tooltip">
                    <strong>{feature.name}</strong>

                    {feature.description && (
                      <span className="spell-description">{feature.description}</span>
                    )}

                    <span>
                      <b>Type:</b> {feature.kind.replaceAll("-", " ")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableSpells.length > 0 && (
        <div className="section-block">
          <div className="ability-section-heading">
            <h3>Spells and cantrips</h3>
            <span>{selectedSpellIds.length}/{availableSpells.length}</span>
          </div>

          <div className="spell-book">
            {spellRanks.map((rank) => {
              const spellsForRank = availableSpells.filter(
                (spell) => spell.rank === rank
              );

              if (spellsForRank.length === 0) return null;

              return (
                <section key={rank} className="spell-rank-section">
                  <h4>{rank === 0 ? "Cantrips" : `Level ${toRoman(rank)}`}</h4>

                  <div className="spell-icon-grid">
                    {spellsForRank.map((spell) => {
                      const isSelected = selectedSpellIds.includes(spell.id);
                      const isFixed = spell.tags?.includes("fixed") ?? false;

                      return (
                        <button
                          key={spell.id}
                          className={[
                            "spell-icon-button",
                            isSelected ? "selected-spell" : "",
                            isFixed ? "fixed-ability" : "",
                          ].join(" ")}
                          type="button"
                          disabled={isFixed}
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

                          <span className="spell-rank-badge">
                            {spell.rank === 0 ? "C" : toRoman(spell.rank)}
                          </span>

                          {spell.costs.requiresConcentration && (
                            <span
                              className="spell-concentration-badge"
                              title="Requires concentration"
                            >
                              <img src={concentrationIcon} alt="Concentration" />
                            </span>
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
                                {spell.roles
                                  .map((role) => role.replaceAll("-", " "))
                                  .join(", ")}
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
                                {formatCost(
                                  spell.costs.actions,
                                  spell.costs.resources
                                )}
                              </span>
                            )}

                            {spell.costs.requiresConcentration && (
                              <span>Requires concentration</span>
                            )}

                            {isFixed && <span>Granted automatically</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpellsAbilitiesTab;