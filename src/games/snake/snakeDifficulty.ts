import type { Difficulty } from '../../core/difficulty';
import type { AnimationHints } from '../../core/game';

export interface SnakeSettings {
  baseTickMs: number;
  tickStepMs: number;
  minTickMs: number;
  graceTickRatio: number;
}

export const SNAKE_SETTINGS: Record<Difficulty, SnakeSettings> = {
  easy: { baseTickMs: 180, tickStepMs: 2, minTickMs: 100, graceTickRatio: 1.5 },
  normal: { baseTickMs: 140, tickStepMs: 3, minTickMs: 60, graceTickRatio: 1 },
  hard: { baseTickMs: 110, tickStepMs: 4, minTickMs: 45, graceTickRatio: 0.25 },
};

export const SNAKE_OPPONENT_HINTS: Record<Difficulty, string> = {
  easy: 'Insegue il cibo ma sbaglia spesso e può schiantarsi.',
  normal: 'Evita le trappole e gioca con giudizio.',
  hard: 'Pianifica il percorso più breve: quasi senza errori.',
};

export const SNAKE_DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: 'Più lento, con molta tolleranza sugli schianti.',
  normal: 'Il ritmo classico di Snake.',
  hard: 'Parte veloce e quasi nessuna tolleranza.',
};

export const SNAKE_ANIMATION_HINTS: AnimationHints = {
  on: 'Il serpente scorre fluido e la lingua guizza.',
  off: 'Movimento a scatti, cella per cella, come nel Snake classico.',
};
