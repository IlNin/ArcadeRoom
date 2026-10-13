import type { Game } from '../../core/game';
import { SnakeEntry } from './SnakeEntry';
import { SNAKE_ANIMATION_HINTS, SNAKE_DIFFICULTY_HINTS, SNAKE_OPPONENT_HINTS } from './snakeDifficulty';
import { SnakeAnimationPreview, SnakePreview, SnakeSpeedPreview } from './SnakePreview';

export const snakeGame: Game = {
  id: 'snake',
  title: 'Snake',
  description: 'Mangia, cresci, non toccare i muri né te stesso.',
  icon: '🐍',
  accent: '#7cfc9a',
  Component: SnakeEntry,
  Preview: SnakePreview,
  DifficultyPreview: SnakeSpeedPreview,
  AnimationPreview: SnakeAnimationPreview,
  animationHints: SNAKE_ANIMATION_HINTS,
  modes: ['solo', 'versus', 'online'],
  difficultyHints: SNAKE_DIFFICULTY_HINTS,
  opponentHints: SNAKE_OPPONENT_HINTS,
};
