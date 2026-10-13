import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadHighScore, saveHighScore } from './storage';

function createFakeStorage(initial: Record<string, string>) {
  const data = new Map<string, string>(Object.entries(initial));
  const storage = {
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    snapshot: () => Object.fromEntries(data),
  };
  return storage;
}

function installStorage(initial: Record<string, string>) {
  const storage = createFakeStorage(initial);
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

describe('storage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('il record dipende solo dalla velocità', () => {
    installStorage({ 'arcade.highscore.snake.normal': '12' });

    expect(loadHighScore('snake', 'normal')).toBe(12);
    expect(loadHighScore('snake', 'easy')).toBe(0);
  });

  it('unisce i vecchi record della sfida prendendo il più alto', () => {
    installStorage({
      'arcade.highscore.snake.hard': '32',
      'arcade.highscore.snake.versus.hard': '31',
      'arcade.highscore.snake.versus.easy': '9',
      'arcade.highscore.snake.easy': '4',
    });

    expect(loadHighScore('snake', 'hard')).toBe(32);
    expect(loadHighScore('snake', 'easy')).toBe(9);
  });

  it('salva il nuovo record nella chiave unica della velocità', () => {
    const storage = installStorage({});

    saveHighScore('snake', 'normal', 15);

    expect(storage.snapshot()).toEqual({ 'arcade.highscore.snake.normal': '15' });
    expect(loadHighScore('snake', 'normal')).toBe(15);
  });

  it('ignora valori non validi', () => {
    installStorage({ 'arcade.highscore.snake.normal': 'abc', 'arcade.highscore.snake.versus.normal': '-3' });

    expect(loadHighScore('snake', 'normal')).toBe(0);
  });
});
