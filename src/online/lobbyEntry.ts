import { isDifficulty, type Difficulty } from '../core/difficulty';

export const LOBBY_TTL_MS = 15 * 60 * 1000;

export interface LobbyGuest {
  uid: string;
  name: string;
}

export interface LobbyGame {
  hostUid: string;
  hostName: string;
  difficulty: Difficulty;
  animations: boolean;
  createdAt: number;
  guest: LobbyGuest | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === 'object' && value !== null;
  return isObject;
}

function parseGuest(raw: unknown): LobbyGuest | null {
  if (!isRecord(raw)) {
    return null;
  }
  const hasValidUid = typeof raw.uid === 'string';
  const hasValidName = typeof raw.name === 'string';
  if (!hasValidUid || !hasValidName) {
    return null;
  }
  const guest: LobbyGuest = { uid: String(raw.uid), name: String(raw.name) };
  return guest;
}

function hasValidFields(raw: Record<string, unknown>): boolean {
  const hasName = typeof raw.hostName === 'string';
  const hasSpeed = typeof raw.speed === 'string' && isDifficulty(raw.speed);
  const hasAnimations = typeof raw.animations === 'boolean';
  const hasCreatedAt = typeof raw.createdAt === 'number';
  const isValid = hasName && hasSpeed && hasAnimations && hasCreatedAt;
  return isValid;
}

export function parseLobbyEntry(hostUid: string, raw: unknown): LobbyGame | null {
  if (!isRecord(raw) || !hasValidFields(raw)) {
    return null;
  }
  const game: LobbyGame = {
    hostUid,
    hostName: String(raw.hostName),
    difficulty: raw.speed as Difficulty,
    animations: raw.animations === true,
    createdAt: Number(raw.createdAt),
    guest: parseGuest(raw.guest),
  };
  return game;
}

export function parseLobby(raw: unknown): LobbyGame[] {
  if (!isRecord(raw)) {
    return [];
  }
  const games: LobbyGame[] = [];
  for (const hostUid of Object.keys(raw)) {
    const game = parseLobbyEntry(hostUid, raw[hostUid]);
    if (game !== null) {
      games.push(game);
    }
  }
  return games;
}

export function isLobbyGameExpired(game: LobbyGame, now: number): boolean {
  const age = now - game.createdAt;
  const isExpired = age > LOBBY_TTL_MS;
  return isExpired;
}

export function isLobbyGameOpen(game: LobbyGame, now: number): boolean {
  const isFree = game.guest === null;
  const isFresh = !isLobbyGameExpired(game, now);
  const isOpen = isFree && isFresh;
  return isOpen;
}

export function sortNewestFirst(games: LobbyGame[]): LobbyGame[] {
  const sorted = [...games].sort((a, b) => b.createdAt - a.createdAt);
  return sorted;
}
