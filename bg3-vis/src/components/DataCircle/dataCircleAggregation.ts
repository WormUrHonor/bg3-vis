import type { AbilityRole, BG3Spell } from "../../data/bg3Spells";
import { DAMAGE_ROLE_KEYS, UTILITY_ROLE_KEYS } from "./dataCircleConfig";
import type {
  DamageRingKey,
  RangeBandKey,
  ResourceSectorKey,
  RoleData,
} from "./dataCircleTypes";

export function getRangeCounts(selectedSpells: BG3Spell[]) {
  const counts: Record<RangeBandKey, number> = {
    self: 0,
    melee: 0,
    mid: 0,
    long: 0,
  };

  selectedSpells.forEach((spell) => {
    switch (spell.range.category) {
      case "self":
        counts.self += 1;
        break;
      case "melee":
      case "weapon-range":
        counts.melee += 1;
        break;
      case "mid":
        counts.mid += 1;
        break;
      case "long":
        counts.long += 1;
        break;
    }
  });

  return counts;
}

export function getRoleData(selectedSpells: BG3Spell[]): RoleData {
  const counts: Record<AbilityRole, number> = {
    "single-target-damage": 0,
    "area-damage": 0,
    control: 0,
    "support-buff": 0,
    "defense-protection": 0,
    healing: 0,
    "mobility-positioning": 0,
    "narrative-interaction": 0,
    "investigation-world-interaction": 0,
    summon: 0,
  };

  selectedSpells.forEach((spell) => {
    spell.roles.forEach((role) => {
      counts[role] += 1;
    });
  });

  const damageTotal = DAMAGE_ROLE_KEYS.reduce(
    (sum, key) => sum + counts[key],
    0
  );

  const utilityTotal = UTILITY_ROLE_KEYS.reduce(
    (sum, key) => sum + counts[key],
    0
  );

  return {
    counts,
    damageTotal,
    utilityTotal,
    total: damageTotal + utilityTotal,
  };
}

export function getDamageTypeCounts(selectedSpells: BG3Spell[]) {
  const counts: Record<DamageRingKey, number> = {
    Bludgeoning: 0,
    Piercing: 0,
    Slashing: 0,
    Physical: 0,
    Acid: 0,
    Cold: 0,
    Fire: 0,
    Force: 0,
    Lightning: 0,
    Necrotic: 0,
    Poison: 0,
    Psychic: 0,
    Radiant: 0,
    Thunder: 0,
    Variable: 0,
  };

  selectedSpells.forEach((spell) => {
    spell.damageTypes.forEach((type) => {
      if (type === "Weapon" || type === "Physical") {
        counts.Physical += 1;
      } else if (type in counts) {
        counts[type as DamageRingKey] += 1;
      }
    });
  });

  return counts;
}

export function getResourceCounts(selectedSpells: BG3Spell[]) {
  const counts: Record<ResourceSectorKey, number> = {
    action: 0,
    "bonus-action": 0,
    reaction: 0,
    concentration: 0,
    cantrip: 0,
    "slot-1": 0,
    "slot-2": 0,
    "slot-3": 0,
    "slot-4": 0,
    "slot-5": 0,
    "slot-6": 0,
    pact: 0,
    "short-rest": 0,
    "long-rest": 0,
    "class-resource": 0,
    "passive-conditional": 0,
  };

  selectedSpells.forEach((spell) => {
    const actions = spell.costs.actions;
    const resources = spell.costs.resources;

    if (actions.includes("action")) {
      counts.action += 1;
    }

    if (actions.includes("bonus-action")) {
      counts["bonus-action"] += 1;
    }

    if (actions.includes("reaction")) {
      counts.reaction += 1;
    }

    /*
      This relies only on the action type, because your ResourceCost type
      does not currently include "passive" or "conditional".
    */
    if (
      actions.includes("passive") ||
      actions.includes("conditional")
    ) {
      counts["passive-conditional"] += 1;
    }

    if (spell.costs.requiresConcentration) {
      counts.concentration += 1;
    }

    if (spell.rank === 0 || resources.includes("cantrip")) {
      counts.cantrip += 1;
    }

    if (
      resources.includes("spell-slot") &&
      spell.costs.spellSlotLevel &&
      spell.costs.spellSlotLevel >= 1 &&
      spell.costs.spellSlotLevel <= 6
    ) {
      counts[`slot-${spell.costs.spellSlotLevel}` as ResourceSectorKey] += 1;
    }

    /*
      Use only "pact-magic-slot" here.
      Your ResourceCost type does not include plain "pact".
    */
    if (resources.includes("pact-magic-slot")) {
      counts.pact += 1;
    }

    if (resources.includes("short-rest")) {
      counts["short-rest"] += 1;
    }

    if (resources.includes("long-rest")) {
      counts["long-rest"] += 1;
    }

    /*
      Use only "class-resource" here.
      Your ResourceCost type does not include "class-pool".
    */
    if (resources.includes("class-resource")) {
      counts["class-resource"] += 1;
    }
  });

  return counts;
}
