export const mockSelectedSpellIds: string[] = [
  "magic-missile",
  "fireball",
  "ice-knife",
  "misty-step",
  "shield",
  "counterspell",
  "haste",
  "spirit-guardians",
  "guiding-bolt",
  "healing-word",
  "hex",
  "hunger-of-hadar",
  "lightning-bolt",
  "cloud-of-daggers",
  "wall-of-fire",
  "chain-lightning",
];

export const mockDataCircleBuild = {
  buildName: "Stormblade Herald",
  characterName: "Test Build",
  selectedClass: "Wizard",
  selectedSubclass: "Evocation School",
  selectedLevel: 12,
};

export type MockDprContribution = {
  abilityId: string;
  abilityName: string;
  damage: number;
};

export type MockDprRound = {
  round: number;
  damage: number;
  contributions: MockDprContribution[];
};

export const mockDprByRound: MockDprRound[] = [
  {
    round: 1,
    damage: 42,
    contributions: [
      { abilityId: "guiding-bolt", abilityName: "Guiding Bolt", damage: 26 },
      { abilityId: "hex", abilityName: "Hex", damage: 8 },
      { abilityId: "magic-missile", abilityName: "Magic Missile", damage: 8 },
    ],
  },
  {
    round: 2,
    damage: 68,
    contributions: [
      { abilityId: "fireball", abilityName: "Fireball", damage: 44 },
      { abilityId: "cloud-of-daggers", abilityName: "Cloud of Daggers", damage: 16 },
      { abilityId: "hex", abilityName: "Hex", damage: 8 },
    ],
  },
  {
    round: 3,
    damage: 61,
    contributions: [
      { abilityId: "lightning-bolt", abilityName: "Lightning Bolt", damage: 43 },
      { abilityId: "ice-knife", abilityName: "Ice Knife", damage: 12 },
      { abilityId: "hex", abilityName: "Hex", damage: 6 },
    ],
  },
  {
    round: 4,
    damage: 54,
    contributions: [
      { abilityId: "wall-of-fire", abilityName: "Wall of Fire", damage: 32 },
      { abilityId: "spirit-guardians", abilityName: "Spirit Guardians", damage: 22 },
    ],
  },
  {
    round: 5,
    damage: 47,
    contributions: [
      { abilityId: "hunger-of-hadar", abilityName: "Hunger of Hadar", damage: 27 },
      { abilityId: "cloud-of-daggers", abilityName: "Cloud of Daggers", damage: 20 },
    ],
  },
  {
    round: 6,
    damage: 86,
    contributions: [
      { abilityId: "chain-lightning", abilityName: "Chain Lightning", damage: 58 },
      { abilityId: "fireball", abilityName: "Fireball", damage: 28 },
    ],
  },
  {
    round: 7,
    damage: 73,
    contributions: [
      { abilityId: "lightning-bolt", abilityName: "Lightning Bolt", damage: 43 },
      { abilityId: "wall-of-fire", abilityName: "Wall of Fire", damage: 22 },
      { abilityId: "hex", abilityName: "Hex", damage: 8 },
    ],
  },
  {
    round: 8,
    damage: 58,
    contributions: [
      { abilityId: "spirit-guardians", abilityName: "Spirit Guardians", damage: 34 },
      { abilityId: "cloud-of-daggers", abilityName: "Cloud of Daggers", damage: 16 },
      { abilityId: "hex", abilityName: "Hex", damage: 8 },
    ],
  },
  {
    round: 9,
    damage: 91,
    contributions: [
      { abilityId: "chain-lightning", abilityName: "Chain Lightning", damage: 61 },
      { abilityId: "fireball", abilityName: "Fireball", damage: 30 },
    ],
  },
  {
    round: 10,
    damage: 64,
    contributions: [
      { abilityId: "wall-of-fire", abilityName: "Wall of Fire", damage: 34 },
      { abilityId: "hunger-of-hadar", abilityName: "Hunger of Hadar", damage: 22 },
      { abilityId: "hex", abilityName: "Hex", damage: 8 },
    ],
  },
];

export const mockAverageDpr =
  mockDprByRound.reduce((sum, round) => sum + round.damage, 0) /
  mockDprByRound.length;