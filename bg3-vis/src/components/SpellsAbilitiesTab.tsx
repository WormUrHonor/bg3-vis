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

type FeatureDisplayGroup = {
  id: string;
  label: string;
  order: number;
  features: BG3ClassFeature[];
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

  if (selectedClass === "Fighter") return "Fighter Features";
  if (selectedClass === "Barbarian") return "Rage Actions & Barbarian Features";
  if (selectedClass === "Warlock") return "Spells, Invocations & Features";
  if (selectedClass === "Monk") return "Ki Actions & Monk Features";
  if (selectedClass === "Rogue") return "Rogue Actions & Features";
  if (selectedClass === "Bard") return "Spells, Inspirations & Bard Features";
  if (selectedClass === "Cleric") return "Spells, Channel Divinity & Cleric Features";
  if (selectedClass === "Druid") return "Spells, Wild Shape & Druid Features";
  if (selectedClass === "Paladin") return "Spells, Smites & Paladin Features";
  if (selectedClass === "Ranger") return "Spells & Ranger Features";
  if (selectedClass === "Sorcerer") return "Spells, Metamagic & Sorcerer Features";
  if (selectedClass === "Wizard") return "Spells & Wizard Features";

  return `${selectedClass} Spells & Features`;
}

function formatCost(actions: string[], resources: string[]): string {
  const items = [...actions, ...resources].filter((item) => item !== "none");

  if (items.length === 0) return "none";

  return items.join(", ");
}

function getKindBadge(feature: BG3ClassFeature): string {
  if (feature.isInformational) return "i";
  if (feature.kind === "passive") return "P";
  if (feature.kind === "reaction") return "R";
  if (feature.kind === "manoeuvre") return "M";
  if (feature.kind === "bonus-action") return "B";
  return "A";
}

function getFallbackDisplayGroup(feature: BG3ClassFeature): {
  id: string;
  label: string;
  order: number;
} {
  if (feature.isInformational) {
    return {
      id: "informational-effects",
      label: "Possible Effects",
      order: 850,
    };
  }

  if (feature.isFixed) {
    return {
      id: "granted-features",
      label: "Granted Features",
      order: 900,
    };
  }

  return {
    id: feature.choiceGroupId ?? "class-choices",
    label: feature.choiceGroupLabel ?? "Class Choices",
    order: 950,
  };
}

function groupClassFeatures(features: BG3ClassFeature[]): FeatureDisplayGroup[] {
  const groups = new Map<string, FeatureDisplayGroup>();

  for (const feature of features) {
    const fallback = getFallbackDisplayGroup(feature);

    const id = feature.displayGroupId ?? fallback.id;
    const label = feature.displayGroupLabel ?? fallback.label;
    const order = feature.displayGroupOrder ?? fallback.order;

    const existingGroup = groups.get(id);

    if (existingGroup) {
      existingGroup.features.push(feature);
    } else {
      groups.set(id, {
        id,
        label,
        order,
        features: [feature],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label);
  });
}

function getChoiceGroupsInDisplayGroup(features: BG3ClassFeature[]) {
  return Array.from(
    new Map(
      features
        .filter((feature) => feature.choiceGroupId)
        .map((feature) => [
          feature.choiceGroupId,
          {
            id: feature.choiceGroupId as string,
            label: feature.choiceGroupLabel ?? "Choices",
            max: feature.choiceGroupMax ?? 1,
            features: features.filter(
              (item) => item.choiceGroupId === feature.choiceGroupId
            ),
          },
        ])
    ).values()
  );
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
  const featureDisplayGroups = groupClassFeatures(availableClassFeatures);

  const selectedSpellCount = selectedSpellIds.length;
  const selectedFeatureCount = selectedClassFeatureIds.length;
  const fixedFeatureCount = fixedClassFeatureIds.length;

  function renderFeatureButton(feature: BG3ClassFeature, groupFull = false) {
    const isInformational = feature.isInformational ?? false;
    const isFixed =
      !isInformational &&
      (fixedClassFeatureIds.includes(feature.id) || feature.isFixed);
    const isSelected = selectedClassFeatureIds.includes(feature.id);
    const isDisabled = isInformational || isFixed || groupFull;

    return (
      <button
        key={feature.id}
        className={[
          "spell-icon-button",
          isSelected ? "selected-spell" : "",
          isFixed ? "fixed-ability" : "",
          isInformational ? "informational-ability" : "",
          groupFull ? "choice-disabled-soft" : "",
        ].join(" ")}
        type="button"
        disabled={isDisabled}
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

        <span className="ability-kind-badge">{getKindBadge(feature)}</span>

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

          {feature.requiredFeatureIds && feature.requiredFeatureIds.length > 0 && (
            <span>Granted by selected feature</span>
          )}

          {isInformational && <span>Possible effect</span>}
          {isFixed && <span>Granted automatically</span>}
        </span>
      </button>
    );
  }

  return (
    <div className="tab-content">
      <div className="section-heading-row">
        <div>
          <h2>{getClassAbilityTabTitle(selectedClass, selectedSubclass)}</h2>
          <p className="panel-intro compact-intro">
            Select available spells, cantrips, class actions, passives, and
            subclass-specific choices. Fixed features are shown as already
            granted, while informational entries describe possible outcomes.
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

      {selectedClass &&
        availableSpells.length === 0 &&
        availableClassFeatures.length === 0 && (
          <div className="placeholder-box">
            No spells or class features are currently available for this class,
            subclass, and level combination.
          </div>
        )}

      {featureDisplayGroups.map((displayGroup) => {
        const choiceGroups = getChoiceGroupsInDisplayGroup(displayGroup.features);
        const nonChoiceFeatures = displayGroup.features.filter(
          (feature) => !feature.choiceGroupId
        );

        const selectedOrGrantedInDisplayGroup = displayGroup.features.filter(
          (feature) =>
            !feature.isInformational &&
            (selectedClassFeatureIds.includes(feature.id) ||
              fixedClassFeatureIds.includes(feature.id))
        ).length;

        const countableFeaturesInDisplayGroup = displayGroup.features.filter(
          (feature) => !feature.isInformational
        ).length;

        return (
          <div key={displayGroup.id} className="section-block feature-group-block">
            <div className="ability-section-heading">
              <h3>{displayGroup.label}</h3>
              <span>
                {countableFeaturesInDisplayGroup > 0
                  ? `${selectedOrGrantedInDisplayGroup}/${countableFeaturesInDisplayGroup}`
                  : "Info"}
              </span>
            </div>

            {nonChoiceFeatures.length > 0 && (
              <div className="ability-icon-grid">
                {nonChoiceFeatures.map((feature) => renderFeatureButton(feature))}
              </div>
            )}

            {choiceGroups.map((choiceGroup) => {
              const selectedInChoiceGroup = choiceGroup.features.filter((feature) =>
                selectedClassFeatureIds.includes(feature.id)
              ).length;

              return (
                <div key={choiceGroup.id} className="choice-subgroup">
                  <div className="choice-subgroup-header">
                    <strong>{choiceGroup.label}</strong>
                    <span>
                      {selectedInChoiceGroup}/{choiceGroup.max}
                    </span>
                  </div>

                  <div className="ability-icon-grid">
                    {choiceGroup.features.map((feature) => {
                      const isSelected = selectedClassFeatureIds.includes(feature.id);
                      const groupFull =
                        selectedInChoiceGroup >= choiceGroup.max && !isSelected;

                      return renderFeatureButton(feature, groupFull);
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {availableSpells.length > 0 && (
        <div className="section-block">
          <div className="ability-section-heading">
            <h3>Spells and cantrips</h3>
            <span>
              {selectedSpellIds.length}/{availableSpells.length}
            </span>
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
                              toggleSpellSelection(
                                spell.id,
                                current,
                                availableSpellIds
                              )
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