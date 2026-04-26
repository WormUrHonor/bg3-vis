import type { RaceName, Skill } from "../types/buildPlannerTypes";

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function getRaceSkills(race: RaceName | "", subrace: string): Skill[] {
  const result: Skill[] = [];

  if (race === "Elf") result.push("Perception");
  if (race === "Drow") result.push("Perception");
  if (race === "Half-Orc") result.push("Intimidation");

  if (subrace === "Wood Elf") result.push("Stealth");
  if (subrace === "Wood Half-Elf") result.push("Stealth");

  return unique(result);
}

export function getRaceExpertise(race: RaceName | "", subrace: string): Skill[] {
  if (race === "Gnome" && subrace === "Rock Gnome") {
    return ["History"];
  }

  return [];
}