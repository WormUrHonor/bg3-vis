import type { Ability } from "../types/data";

export const abilities: Ability[] = [
  {
    id: "guiding-bolt",
    name: "Guiding Bolt",
    damageTypes: ["Radiant"],
    roleCategory: "Damage",
    damageSubtype: "Single-target",
    rangeCategory: "Long-range",
    actionCost: "Action",
    requiresConcentration: false,
    spellSlotLevel: 1,
    usesPactMagic: false,
    restDependency: "Long-rest"
  },
  {
    id: "fireball",
    name: "Fireball",
    damageTypes: ["Fire"],
    roleCategory: "Damage",
    damageSubtype: "Area",
    rangeCategory: "Long-range",
    actionCost: "Action",
    requiresConcentration: false,
    spellSlotLevel: 3,
    usesPactMagic: false,
    restDependency: "Long-rest"
  },
  {
    id: "misty-step",
    name: "Misty Step",
    damageTypes: [],
    roleCategory: "Utility",
    utilitySubtype: "Mobility",
    rangeCategory: "Self",
    actionCost: "Bonus Action",
    requiresConcentration: false,
    spellSlotLevel: 2,
    usesPactMagic: false,
    restDependency: "Long-rest"
  }
];