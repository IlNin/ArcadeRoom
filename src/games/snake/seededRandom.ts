import type { RandomFn } from './snakeLogic';

export function createSeededRandom(seed: number): RandomFn {
  let value = seed;
  const random = () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  };
  return random;
}
