import type { Difficulty } from './difficulty';

export type GameMode = 'solo' | 'versus' | 'online';

export type OnlineRole = 'host' | 'guest';

export interface OnlineMatch {
  role: OnlineRole;
  hostUid: string;
  playerUid: string;
  playerName: string;
  opponentUid: string;
  opponentName: string;
}

export interface GameModeInfo {
  id: GameMode;
  label: string;
  description: string;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  opponent: Difficulty;
  animations: boolean;
  online?: OnlineMatch;
}

export const DEFAULT_MODE: GameMode = 'solo';

export const GAME_MODES: GameModeInfo[] = [
  { id: 'solo', label: 'Giocatore singolo', description: 'Una partita per battere il tuo record.' },
  { id: 'versus', label: 'Sfida la CPU', description: 'Due griglie, vince chi fa più punti.' },
  { id: 'online', label: 'Online', description: 'Sfida un altro giocatore in rete.' },
];

export function isGameMode(value: string | null): value is GameMode {
  const found = GAME_MODES.some((info) => info.id === value);
  return found;
}
