import { DEFAULT_DIFFICULTY, isDifficulty, type Difficulty } from './difficulty';
import { DEFAULT_MODE, isGameMode, type GameMode } from './gameMode';

const HIGH_SCORE_PREFIX = 'arcade.highscore.';
const LAST_DIFFICULTY_PREFIX = 'arcade.difficulty.';
const LAST_MODE_PREFIX = 'arcade.mode.';
const LAST_OPPONENT_PREFIX = 'arcade.opponent.';
const LAST_ANIMATIONS_PREFIX = 'arcade.animations.';

function readItem(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key);
    return value;
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function buildHighScoreKey(gameId: string, difficulty: Difficulty): string {
  const key = `${HIGH_SCORE_PREFIX}${gameId}.${difficulty}`;
  return key;
}

function buildLegacyVersusKey(gameId: string, difficulty: Difficulty): string {
  const key = `${HIGH_SCORE_PREFIX}${gameId}.versus.${difficulty}`;
  return key;
}

function parseScore(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  if (parsed < 0) {
    return 0;
  }
  return parsed;
}

export function loadHighScore(gameId: string, difficulty: Difficulty): number {
  const current = parseScore(readItem(buildHighScoreKey(gameId, difficulty)));
  const legacyVersus = parseScore(readItem(buildLegacyVersusKey(gameId, difficulty)));
  const score = Math.max(current, legacyVersus);
  return score;
}

export function saveHighScore(gameId: string, difficulty: Difficulty, score: number): void {
  writeItem(buildHighScoreKey(gameId, difficulty), String(score));
}

export function loadLastDifficulty(gameId: string): Difficulty {
  const raw = readItem(LAST_DIFFICULTY_PREFIX + gameId);
  const difficulty = isDifficulty(raw) ? raw : DEFAULT_DIFFICULTY;
  return difficulty;
}

export function saveLastDifficulty(gameId: string, difficulty: Difficulty): void {
  writeItem(LAST_DIFFICULTY_PREFIX + gameId, difficulty);
}

export function loadLastOpponent(gameId: string): Difficulty {
  const raw = readItem(LAST_OPPONENT_PREFIX + gameId);
  const opponent = isDifficulty(raw) ? raw : DEFAULT_DIFFICULTY;
  return opponent;
}

export function saveLastOpponent(gameId: string, opponent: Difficulty): void {
  writeItem(LAST_OPPONENT_PREFIX + gameId, opponent);
}

export function loadLastMode(gameId: string, supportedModes: GameMode[]): GameMode {
  const raw = readItem(LAST_MODE_PREFIX + gameId);
  if (!isGameMode(raw)) {
    return DEFAULT_MODE;
  }
  const isSupported = supportedModes.includes(raw);
  const mode = isSupported ? raw : DEFAULT_MODE;
  return mode;
}

export function saveLastMode(gameId: string, mode: GameMode): void {
  writeItem(LAST_MODE_PREFIX + gameId, mode);
}

export function loadLastAnimations(gameId: string): boolean | null {
  const raw = readItem(LAST_ANIMATIONS_PREFIX + gameId);
  if (raw === 'on') {
    return true;
  }
  if (raw === 'off') {
    return false;
  }
  return null;
}

export function saveLastAnimations(gameId: string, enabled: boolean): void {
  writeItem(LAST_ANIMATIONS_PREFIX + gameId, enabled ? 'on' : 'off');
}
