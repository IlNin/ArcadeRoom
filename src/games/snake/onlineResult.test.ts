import { describe, expect, it } from 'vitest';
import { describeOnlineProgress, isOnlineFinished, resolveOnlineResult, type OnlineProgress } from './onlineResult';

function build(overrides: Partial<OnlineProgress>): OnlineProgress {
  const base: OnlineProgress = {
    playerRunning: true,
    opponentRunning: true,
    playerScore: 0,
    opponentScore: 0,
    forfeit: 'none',
    opponentName: 'Anna',
  };
  const progress = { ...base, ...overrides };
  return progress;
}

describe('onlineResult', () => {
  it('finisce solo quando nessuno gioca più', () => {
    expect(isOnlineFinished(build({}))).toBe(false);
    expect(isOnlineFinished(build({ playerRunning: false }))).toBe(false);
    expect(isOnlineFinished(build({ playerRunning: false, opponentRunning: false }))).toBe(true);
  });

  it('assegna la vittoria in base ai punti', () => {
    const finished = { playerRunning: false, opponentRunning: false };
    expect(resolveOnlineResult(build({ ...finished, playerScore: 5, opponentScore: 3 }))).toBe('win');
    expect(resolveOnlineResult(build({ ...finished, playerScore: 3, opponentScore: 5 }))).toBe('lose');
    expect(resolveOnlineResult(build({ ...finished, playerScore: 4, opponentScore: 4 }))).toBe('draw');
  });

  it('la resa dell avversario vince a tavolino anche con meno punti', () => {
    const progress = build({ forfeit: 'opponent', playerScore: 1, opponentScore: 20 });
    expect(isOnlineFinished(progress)).toBe(true);
    expect(resolveOnlineResult(progress)).toBe('win');
    expect(describeOnlineProgress(progress)).toContain('Anna');
  });

  it('la propria resa perde a tavolino', () => {
    const progress = build({ forfeit: 'me', playerScore: 20, opponentScore: 1 });
    expect(resolveOnlineResult(progress)).toBe('lose');
  });

  it('descrive i punti intermedi', () => {
    expect(describeOnlineProgress(build({}))).toBe('Partita in corso');
    expect(describeOnlineProgress(build({ playerRunning: false, playerScore: 7 }))).toContain('7 punti');
    expect(describeOnlineProgress(build({ opponentRunning: false, opponentScore: 2 }))).toContain('Anna');
  });
});
