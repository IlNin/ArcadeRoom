import { describe, expect, it } from 'vitest';
import { isLobbyGameOpen, LOBBY_TTL_MS, parseLobby, sortNewestFirst } from './lobbyEntry';

const validEntry = { hostName: 'Anna', speed: 'hard', animations: true, createdAt: 1000 };

describe('lobbyEntry', () => {
  it('legge le partite valide e ignora quelle malformate', () => {
    const raw = {
      uidA: validEntry,
      uidB: { ...validEntry, speed: 'turbo' },
      uidC: 'spazzatura',
    };
    const games = parseLobby(raw);
    expect(games).toHaveLength(1);
    expect(games[0].hostUid).toBe('uidA');
    expect(games[0].difficulty).toBe('hard');
    expect(games[0].guest).toBeNull();
  });

  it('legge il guest quando presente', () => {
    const games = parseLobby({ uidA: { ...validEntry, guest: { uid: 'g1', name: 'Bob' } } });
    expect(games[0].guest).toEqual({ uid: 'g1', name: 'Bob' });
  });

  it('considera aperta solo una partita libera e recente', () => {
    const [free] = parseLobby({ uidA: validEntry });
    const [taken] = parseLobby({ uidA: { ...validEntry, guest: { uid: 'g1', name: 'Bob' } } });
    expect(isLobbyGameOpen(free, 2000)).toBe(true);
    expect(isLobbyGameOpen(taken, 2000)).toBe(false);
    expect(isLobbyGameOpen(free, 1000 + LOBBY_TTL_MS + 1)).toBe(false);
  });

  it('ordina dalla più recente', () => {
    const games = parseLobby({
      old: { ...validEntry, createdAt: 1 },
      recent: { ...validEntry, createdAt: 9 },
    });
    expect(sortNewestFirst(games).map((game) => game.hostUid)).toEqual(['recent', 'old']);
  });
});
