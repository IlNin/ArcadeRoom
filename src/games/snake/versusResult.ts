export type VersusResult = 'win' | 'lose' | 'draw';

export interface VersusProgress {
  playerRunning: boolean;
  cpuRunning: boolean;
  playerScore: number;
  cpuScore: number;
}

export function resolveVersusResult(playerScore: number, cpuScore: number): VersusResult {
  if (playerScore > cpuScore) {
    return 'win';
  }
  if (playerScore < cpuScore) {
    return 'lose';
  }
  return 'draw';
}

export function isVersusFinished(progress: VersusProgress): boolean {
  const isAnyoneRunning = progress.playerRunning || progress.cpuRunning;
  return !isAnyoneRunning;
}

function describeFinalResult(progress: VersusProgress): string {
  const result = resolveVersusResult(progress.playerScore, progress.cpuScore);
  const scores = `${progress.playerScore} – ${progress.cpuScore}`;
  if (result === 'win') {
    return `Hai vinto! ${scores}`;
  }
  if (result === 'lose') {
    return `Hai perso. ${scores}`;
  }
  return `Pareggio! ${scores}`;
}

export function describeVersusProgress(progress: VersusProgress): string {
  if (isVersusFinished(progress)) {
    return describeFinalResult(progress);
  }
  if (!progress.playerRunning) {
    return `Hai finito con ${progress.playerScore} punti: la CPU sta completando la partita…`;
  }
  if (!progress.cpuRunning) {
    return `La CPU ha finito con ${progress.cpuScore} punti: continua a giocare!`;
  }
  return 'Partita in corso';
}
