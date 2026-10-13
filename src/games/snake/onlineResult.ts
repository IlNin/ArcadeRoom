import { resolveVersusResult, type VersusResult } from './versusResult';

export type ForfeitState = 'none' | 'opponent' | 'me';

export interface OnlineProgress {
  playerRunning: boolean;
  opponentRunning: boolean;
  playerScore: number;
  opponentScore: number;
  forfeit: ForfeitState;
  opponentName: string;
}

export function isOnlineFinished(progress: OnlineProgress): boolean {
  if (progress.forfeit !== 'none') {
    return true;
  }
  const isAnyoneRunning = progress.playerRunning || progress.opponentRunning;
  return !isAnyoneRunning;
}

export function resolveOnlineResult(progress: OnlineProgress): VersusResult {
  if (progress.forfeit === 'opponent') {
    return 'win';
  }
  if (progress.forfeit === 'me') {
    return 'lose';
  }
  const result = resolveVersusResult(progress.playerScore, progress.opponentScore);
  return result;
}

function describeForfeit(progress: OnlineProgress): string {
  if (progress.forfeit === 'opponent') {
    return `${progress.opponentName} si è disconnesso: hai vinto a tavolino!`;
  }
  return 'Sei rimasto inattivo troppo a lungo: partita persa a tavolino.';
}

function describeFinalResult(progress: OnlineProgress): string {
  const result = resolveOnlineResult(progress);
  const scores = `${progress.playerScore} – ${progress.opponentScore}`;
  if (result === 'win') {
    return `Hai vinto! ${scores}`;
  }
  if (result === 'lose') {
    return `Hai perso. ${scores}`;
  }
  return `Pareggio! ${scores}`;
}

export function describeOnlineProgress(progress: OnlineProgress): string {
  if (progress.forfeit !== 'none') {
    return describeForfeit(progress);
  }
  if (isOnlineFinished(progress)) {
    return describeFinalResult(progress);
  }
  if (!progress.playerRunning) {
    return `Hai finito con ${progress.playerScore} punti: ${progress.opponentName} sta ancora giocando…`;
  }
  if (!progress.opponentRunning) {
    return `${progress.opponentName} ha finito con ${progress.opponentScore} punti: continua a giocare!`;
  }
  return 'Partita in corso';
}
