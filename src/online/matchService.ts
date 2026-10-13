import { onDisconnect, onValue, ref, remove, set, update, type DatabaseReference, type Unsubscribe } from 'firebase/database';
import type { OnlineMatch } from '../core/gameMode';
import { getOnlineDatabase } from './firebaseClient';
import { removeLobbyGame } from './lobbyService';

function playerRef(hostUid: string, playerUid: string): DatabaseReference {
  const reference = ref(getOnlineDatabase(), `match/${hostUid}/${playerUid}`);
  return reference;
}

export function publishSnapshot(online: OnlineMatch, raw: object): void {
  const reference = playerRef(online.hostUid, online.playerUid);
  set(reference, raw).catch(() => undefined);
}

export function registerDisconnectFlag(online: OnlineMatch): void {
  const reference = playerRef(online.hostUid, online.playerUid);
  onDisconnect(reference)
    .update({ left: true })
    .catch(() => undefined);
}

export function watchOpponent(
  online: OnlineMatch,
  onSnapshot: (raw: unknown) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const reference = playerRef(online.hostUid, online.opponentUid);
  const unsubscribe = onValue(reference, (snapshot) => onSnapshot(snapshot.val()), onError);
  return unsubscribe;
}

async function leaveAsHost(online: OnlineMatch): Promise<void> {
  const root = ref(getOnlineDatabase(), `match/${online.hostUid}`);
  await removeLobbyGame(online.hostUid);
  await remove(root);
}

async function leaveAsGuest(online: OnlineMatch): Promise<void> {
  const reference = playerRef(online.hostUid, online.playerUid);
  await onDisconnect(reference).cancel();
  await update(reference, { left: true });
}

export function leaveMatch(online: OnlineMatch): void {
  const leaving = online.role === 'host' ? leaveAsHost(online) : leaveAsGuest(online);
  leaving.catch(() => undefined);
}
