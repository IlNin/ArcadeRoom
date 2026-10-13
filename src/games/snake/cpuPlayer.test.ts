import { describe, expect, it } from 'vitest';
import { CPU_PROFILES, chooseCpuDirection, type CpuProfile } from './cpuPlayer';
import { createSeededRandom } from './seededRandom';
import { changeDirection, createInitialState, step, type SnakeState } from './snakeLogic';

const COLS = 20;
const ROWS = 20;
const MAX_STEPS = 6000;
const STALL_LIMIT = COLS * ROWS * 2;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LONG_TEST_TIMEOUT_MS = 60000;

function playMatch(profile: CpuProfile, seed: number): number {
  const random = createSeededRandom(seed);
  let state = createInitialState(COLS, ROWS, random);
  let stepsSinceFood = 0;
  for (let i = 0; i < MAX_STEPS && state.status === 'running'; i++) {
    const direction = chooseCpuDirection(state, profile, random);
    const scoreBefore = state.score;
    state = changeDirection(state, direction);
    state = step(state, random);
    stepsSinceFood = state.score === scoreBefore ? stepsSinceFood + 1 : 0;
    if (stepsSinceFood >= STALL_LIMIT) {
      break;
    }
  }
  return state.score;
}

function averageScore(profile: CpuProfile): number {
  const scores = SEEDS.map((seed) => playMatch(profile, seed));
  const total = scores.reduce((sum, score) => sum + score, 0);
  const average = total / scores.length;
  return average;
}

function createStateWithFood(headX: number, headY: number, foodX: number, foodY: number): SnakeState {
  const base = createInitialState(COLS, ROWS, createSeededRandom(1));
  const snake = [
    { x: headX, y: headY },
    { x: headX - 1, y: headY },
    { x: headX - 2, y: headY },
  ];
  const state: SnakeState = { ...base, snake, food: { x: foodX, y: foodY } };
  return state;
}

describe('cpuPlayer', () => {
  it('a livello difficile punta al cibo seguendo il percorso più breve', () => {
    const state = createStateWithFood(5, 5, 5, 10);

    const direction = chooseCpuDirection(state, CPU_PROFILES.hard, createSeededRandom(1));

    expect(direction).toBe('down');
  });

  it('a livello difficile e normale non si schianta contro il muro', () => {
    const state = createStateWithFood(19, 5, 19, 10);

    const hardDirection = chooseCpuDirection(state, CPU_PROFILES.hard, createSeededRandom(1));
    const normalDirection = chooseCpuDirection(state, CPU_PROFILES.normal, createSeededRandom(7));

    expect(hardDirection).not.toBe('right');
    expect(normalDirection).not.toBe('right');
  });

  it('i livelli sono ordinati per forza: facile < normale < difficile', () => {
    const easy = averageScore(CPU_PROFILES.easy);
    const normal = averageScore(CPU_PROFILES.normal);
    const hard = averageScore(CPU_PROFILES.hard);

    expect(normal).toBeGreaterThan(easy * 1.5);
    expect(hard).toBeGreaterThan(normal * 1.5);
  }, LONG_TEST_TIMEOUT_MS);

  it('a livello difficile mangia molto prima di morire', () => {
    const hard = averageScore(CPU_PROFILES.hard);

    expect(hard).toBeGreaterThan(40);
  }, LONG_TEST_TIMEOUT_MS);
});
