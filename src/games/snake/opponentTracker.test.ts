import { describe, expect, it } from 'vitest';
import { OpponentTracker } from './opponentTracker';
import { createInitialState } from './snakeLogic';
import { decodeSnapshot, encodeSnapshot } from './snakeSnapshot';

function buildSnapshot(overrides: Record<string, unknown> = {}) {
  const state = createInitialState(20, 20, () => 0.3);
  const raw = { ...encodeSnapshot(state, false), ...overrides };
  const snapshot = decodeSnapshot(raw);
  return snapshot;
}

const TIMEOUT = 10000;

describe('OpponentTracker', () => {
  it('non considera caduto un avversario che si è appena connesso', () => {
    const tracker = new OpponentTracker(0);
    expect(tracker.isDropped(5000, TIMEOUT)).toBe(false);
  });

  it('considera caduto chi tace oltre il timeout mentre gioca', () => {
    const tracker = new OpponentTracker(0);
    tracker.receive(buildSnapshot(), 1000);
    expect(tracker.isDropped(10999, TIMEOUT)).toBe(false);
    expect(tracker.isDropped(11001, TIMEOUT)).toBe(true);
  });

  it('considera caduto chi non ha mai pubblicato oltre il timeout', () => {
    const tracker = new OpponentTracker(0);
    expect(tracker.isDropped(10001, TIMEOUT)).toBe(true);
  });

  it('non considera caduto chi ha già finito e poi tace o esce', () => {
    const tracker = new OpponentTracker(0);
    tracker.receive(buildSnapshot({ status: 'gameOver', left: true }), 1000);
    expect(tracker.isDropped(60000, TIMEOUT)).toBe(false);
  });

  it('considera caduto chi segnala di essere uscito mentre gioca', () => {
    const tracker = new OpponentTracker(0);
    tracker.receive(buildSnapshot({ left: true }), 1000);
    expect(tracker.isDropped(1001, TIMEOUT)).toBe(true);
  });

  it('considera caduto chi sparisce dal database mentre gioca', () => {
    const tracker = new OpponentTracker(0);
    tracker.receive(buildSnapshot(), 1000);
    tracker.receive(null, 2000);
    expect(tracker.isDropped(2001, TIMEOUT)).toBe(true);
  });

  it('riporta la resa dichiarata dall avversario', () => {
    const tracker = new OpponentTracker(0);
    tracker.receive(buildSnapshot({ forfeit: true }), 1000);
    expect(tracker.claimsForfeit).toBe(true);
  });
});
