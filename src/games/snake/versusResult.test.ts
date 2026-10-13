import { describe, expect, it } from 'vitest';
import { describeVersusProgress, isVersusFinished, resolveVersusResult } from './versusResult';

describe('versusResult', () => {
  it('vince chi ha più punti', () => {
    expect(resolveVersusResult(12, 9)).toBe('win');
    expect(resolveVersusResult(9, 12)).toBe('lose');
  });

  it('con gli stessi punti è pareggio', () => {
    expect(resolveVersusResult(7, 7)).toBe('draw');
  });

  it('la partita finisce solo quando entrambi hanno terminato', () => {
    expect(isVersusFinished({ playerRunning: true, cpuRunning: true, playerScore: 0, cpuScore: 0 })).toBe(false);
    expect(isVersusFinished({ playerRunning: false, cpuRunning: true, playerScore: 3, cpuScore: 1 })).toBe(false);
    expect(isVersusFinished({ playerRunning: true, cpuRunning: false, playerScore: 3, cpuScore: 1 })).toBe(false);
    expect(isVersusFinished({ playerRunning: false, cpuRunning: false, playerScore: 3, cpuScore: 1 })).toBe(true);
  });

  it('descrive il risultato finale con i punteggi', () => {
    const message = describeVersusProgress({ playerRunning: false, cpuRunning: false, playerScore: 5, cpuScore: 8 });

    expect(message).toContain('Hai perso');
    expect(message).toContain('5 – 8');
  });

  it('segnala quando la CPU sta completando la partita dopo la fine del giocatore', () => {
    const message = describeVersusProgress({ playerRunning: false, cpuRunning: true, playerScore: 4, cpuScore: 2 });

    expect(message).toContain('la CPU sta completando');
  });
});
