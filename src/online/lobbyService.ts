import {
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  type DatabaseReference,
  type DataSnapshot,
  type Unsubscribe,
} from 'firebase/database';
import type { Difficulty } from '../core/difficulty';
import { getOnlineDatabase } from './firebaseClient';
import {
  isLobbyGameExpired,
  isLobbyGameOpen,
  parseLobby,
  parseLobbyEntry,
  sortNewestFirst,
  type LobbyGame,
} from './lobbyEntry';

let serverOffsetMs: number | null = null;

function lobbyRef(hostUid: string): DatabaseReference {
  const reference = ref(getOnlineDatabase(), `lobby/${hostUid}`);
  return reference;
}

function matchRootRef(hostUid: string): DatabaseReference {
  const reference = ref(getOnlineDatabase(), `match/${hostUid}`);
  return reference;
}

function readServerOffset(): Promise<number> {
  const offsetPromise = new Promise<number>((resolve) => {
    const offsetRef = ref(getOnlineDatabase(), '.info/serverTimeOffset');
    const onOffset = (snapshot: DataSnapshot) => {
      const offset = Number(snapshot.val());
      resolve(Number.isFinite(offset) ? offset : 0);
    };
    onValue(offsetRef, onOffset, () => resolve(0), { onlyOnce: true });
  });
  return offsetPromise;
}

async function getServerNow(): Promise<number> {
  if (serverOffsetMs === null) {
    serverOffsetMs = await readServerOffset();
  }
  const now = Date.now() + serverOffsetMs;
  return now;
}

async function clearStaleMatch(hostUid: string): Promise<void> {
  try {
    await remove(matchRootRef(hostUid));
  } catch {
    return;
  }
}

export async function createLobbyGame(
  hostUid: string,
  hostName: string,
  difficulty: Difficulty,
  animations: boolean,
): Promise<void> {
  await clearStaleMatch(hostUid);
  const reference = lobbyRef(hostUid);
  await onDisconnect(reference).remove();
  await onDisconnect(matchRootRef(hostUid)).remove();
  const entry = {
    hostName,
    speed: difficulty,
    animations,
    createdAt: serverTimestamp(),
  };
  await set(reference, entry);
}

export async function removeLobbyGame(hostUid: string): Promise<void> {
  try {
    await remove(lobbyRef(hostUid));
  } catch {
    return;
  }
}

export async function joinLobbyGame(game: LobbyGame, guestUid: string, guestName: string): Promise<void> {
  const guestRef = ref(getOnlineDatabase(), `lobby/${game.hostUid}/guest`);
  const guest = { uid: guestUid, name: guestName };
  await set(guestRef, guest);
}

async function removeExpiredGames(games: LobbyGame[]): Promise<void> {
  const now = await getServerNow();
  for (const game of games) {
    const isAbandoned = game.guest === null && isLobbyGameExpired(game, now);
    if (isAbandoned) {
      await removeLobbyGame(game.hostUid);
    }
  }
}

async function publishOpenGames(raw: unknown, onChange: (games: LobbyGame[]) => void): Promise<void> {
  const now = await getServerNow();
  const all = parseLobby(raw);
  const open = all.filter((game) => isLobbyGameOpen(game, now));
  onChange(sortNewestFirst(open));
  void removeExpiredGames(all);
}

export function watchOpenGames(onChange: (games: LobbyGame[]) => void, onError: (error: Error) => void): Unsubscribe {
  const lobby = ref(getOnlineDatabase(), 'lobby');
  const unsubscribe = onValue(
    lobby,
    (snapshot) => {
      void publishOpenGames(snapshot.val(), onChange);
    },
    onError,
  );
  return unsubscribe;
}

export function watchOwnGame(
  hostUid: string,
  onChange: (game: LobbyGame | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const unsubscribe = onValue(
    lobbyRef(hostUid),
    (snapshot) => {
      const game = parseLobbyEntry(hostUid, snapshot.val());
      onChange(game);
    },
    onError,
  );
  return unsubscribe;
}
