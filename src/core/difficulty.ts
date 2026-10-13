export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyInfo {
  id: Difficulty;
  label: string;
  description: string;
}

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export const DIFFICULTIES: DifficultyInfo[] = [
  { id: 'easy', label: 'Facile', description: 'Ritmo rilassato e più tolleranza.' },
  { id: 'normal', label: 'Normale', description: "L'esperienza classica." },
  { id: 'hard', label: 'Difficile', description: 'Veloce e senza sconti.' },
];

export function isDifficulty(value: string | null): value is Difficulty {
  const found = DIFFICULTIES.some((info) => info.id === value);
  return found;
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const info = DIFFICULTIES.find((item) => item.id === difficulty);
  const label = info === undefined ? difficulty : info.label;
  return label;
}
