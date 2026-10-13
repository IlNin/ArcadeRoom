import type { ComponentType } from 'react';
import type { Difficulty } from './difficulty';
import type { GameConfig, GameMode } from './gameMode';

export interface GameContext {
  getHighScore(): number;
  submitScore(score: number): void;
  exitToMenu(): void;
}

export interface GameProps {
  context: GameContext;
  config: GameConfig;
}

export interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
}

export interface AnimationHints {
  on: string;
  off: string;
}

export interface Game extends GameInfo {
  Component: ComponentType<GameProps>;
  Preview?: ComponentType;
  DifficultyPreview?: ComponentType<{ difficulty: Difficulty }>;
  AnimationPreview?: ComponentType<{ enabled: boolean }>;
  animationHints?: AnimationHints;
  modes?: GameMode[];
  difficultyHints?: Record<Difficulty, string>;
  opponentHints?: Record<Difficulty, string>;
}

export function getSupportedModes(game: Game): GameMode[] {
  const modes: GameMode[] = game.modes === undefined ? ['solo'] : game.modes;
  return modes;
}
