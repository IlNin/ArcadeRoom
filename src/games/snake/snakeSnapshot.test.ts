import { describe, expect, it } from 'vitest';
import { decodeSnapshot, encodeSnapshot } from './snakeSnapshot';
import { createInitialState } from './snakeLogic';

describe('snakeSnapshot', () => {
  it('codifica e decodifica lo stato senza perdere informazioni', () => {
    const state = createInitialState(20, 20, () => 0.3);
    const raw = encodeSnapshot(state, false);
    const decoded = decodeSnapshot(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.snake).toEqual(state.snake);
    expect(decoded?.food).toEqual(state.food);
    expect(decoded?.foodKind).toBe(state.foodKind);
    expect(decoded?.status).toBe('running');
    expect(decoded?.left).toBe(false);
  });

  it('gestisce il cibo assente', () => {
    const state = { ...createInitialState(20, 20, () => 0.3), food: null };
    const decoded = decodeSnapshot(encodeSnapshot(state, false));
    expect(decoded?.food).toBeNull();
  });

  it('riporta i flag di abbandono e resa', () => {
    const state = createInitialState(20, 20, () => 0.3);
    const raw = { ...encodeSnapshot(state, true), left: true };
    const decoded = decodeSnapshot(raw);
    expect(decoded?.forfeit).toBe(true);
    expect(decoded?.left).toBe(true);
  });

  it('scarta dati non validi', () => {
    const state = createInitialState(20, 20, () => 0.3);
    const valid = encodeSnapshot(state, false);
    expect(decodeSnapshot(null)).toBeNull();
    expect(decodeSnapshot({ ...valid, snake: '1,2,999' })).toBeNull();
    expect(decodeSnapshot({ ...valid, snake: '' })).toBeNull();
    expect(decodeSnapshot({ ...valid, status: 'boom' })).toBeNull();
    expect(decodeSnapshot({ ...valid, kind: 'pizza' })).toBeNull();
    expect(decodeSnapshot({ ...valid, score: -1 })).toBeNull();
    expect(decodeSnapshot({ ...valid, food: 400 })).toBeNull();
  });
});
