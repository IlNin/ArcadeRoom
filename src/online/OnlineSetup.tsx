import { useCallback, useEffect, useRef, useState } from 'react';
import { getDifficultyLabel, type Difficulty } from '../core/difficulty';
import type { Game } from '../core/game';
import type { OnlineMatch } from '../core/gameMode';
import { loadNickname, NICKNAME_MAX_LENGTH, saveNickname } from '../core/storage';
import { AnimationSection } from '../menu/AnimationSection';
import { SpeedSection } from '../menu/SpeedSection';
import type { LobbyGame } from './lobbyEntry';
import { createLobbyGame, joinLobbyGame, removeLobbyGame, watchOwnGame } from './lobbyService';
import { OpenGamesPanel } from './OpenGamesPanel';
import { useOnlineConnection } from './useOnlineConnection';

export interface OnlineStart {
  difficulty: Difficulty;
  animations: boolean;
  online: OnlineMatch;
}

interface OnlineSetupProps {
  game: Game;
  difficulty: Difficulty;
  onDifficultyChange(difficulty: Difficulty): void;
  animations: boolean;
  onAnimationsChange(enabled: boolean): void;
  onStart(start: OnlineStart): void;
}

interface HostedSettings {
  difficulty: Difficulty;
  animations: boolean;
}

function buildHostMatch(uid: string, nickname: string, guest: { uid: string; name: string }): OnlineMatch {
  const online: OnlineMatch = {
    role: 'host',
    hostUid: uid,
    playerUid: uid,
    playerName: nickname,
    opponentUid: guest.uid,
    opponentName: guest.name,
  };
  return online;
}

function buildGuestMatch(uid: string, nickname: string, lobbyGame: LobbyGame): OnlineMatch {
  const online: OnlineMatch = {
    role: 'guest',
    hostUid: lobbyGame.hostUid,
    playerUid: uid,
    playerName: nickname,
    opponentUid: lobbyGame.hostUid,
    opponentName: lobbyGame.hostName,
  };
  return online;
}

function NicknamePanel({ nickname, onChange }: { nickname: string; onChange(value: string): void }) {
  return (
    <section className="setup__panel" aria-labelledby="nickname-title">
      <h2 className="setup__panel-title" id="nickname-title">
        <span aria-hidden="true">👤</span> Giocatore
      </h2>
      <label className="lobby__field">
        <span className="lobby__label">Il tuo nome</span>
        <input
          className="lobby__input"
          type="text"
          value={nickname}
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder="Scegli un nickname"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </section>
  );
}

function WaitingPanel({ settings, onCancel }: { settings: HostedSettings; onCancel(): void }) {
  const animationsLabel = settings.animations ? 'animazioni attive' : 'animazioni spente';
  return (
    <section className="setup__panel lobby__waiting" aria-live="polite">
      <h2 className="setup__panel-title">
        <span aria-hidden="true">⏳</span> In attesa
      </h2>
      <div className="lobby__spinner" aria-hidden="true" />
      <p className="lobby__waiting-title">In attesa di un avversario…</p>
      <p className="lobby__empty">
        Partita {getDifficultyLabel(settings.difficulty).toLowerCase()}, {animationsLabel}. Compare nell&apos;elenco di chi
        apre il portale.
      </p>
      <button type="button" onClick={onCancel}>
        Annulla
      </button>
    </section>
  );
}

function ConnectionError({ onRetry }: { onRetry(): void }) {
  return (
    <section className="setup__panel">
      <p className="lobby__empty">Impossibile collegarsi al servizio online. Controlla la connessione e riprova.</p>
      <div className="setup__actions">
        <button type="button" onClick={onRetry}>
          Riprova
        </button>
      </div>
    </section>
  );
}

export function OnlineSetup({
  game,
  difficulty,
  onDifficultyChange,
  animations,
  onAnimationsChange,
  onStart,
}: OnlineSetupProps) {
  const connection = useOnlineConnection();
  const [nickname, setNickname] = useState(() => loadNickname());
  const [hosting, setHosting] = useState<HostedSettings | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const hostedUidRef = useRef<string | null>(null);
  const handedOverRef = useRef(false);
  const trimmedName = nickname.trim();
  const hasName = trimmedName.length > 0;
  const isReady = connection.status === 'ready';

  const handOver = useCallback(
    (start: OnlineStart) => {
      handedOverRef.current = true;
      saveNickname(trimmedName);
      onStart(start);
    },
    [onStart, trimmedName],
  );

  useEffect(() => {
    return () => {
      const hostedUid = hostedUidRef.current;
      if (hostedUid !== null && !handedOverRef.current) {
        void removeLobbyGame(hostedUid);
      }
    };
  }, []);

  useEffect(() => {
    if (hosting === null || !isReady) {
      return;
    }
    const unsubscribe = watchOwnGame(
      connection.uid,
      (lobbyGame) => {
        if (lobbyGame === null) {
          hostedUidRef.current = null;
          setHosting(null);
          setMessage('La partita non è più disponibile.');
          return;
        }
        if (lobbyGame.guest !== null) {
          const online = buildHostMatch(connection.uid, trimmedName, lobbyGame.guest);
          handOver({ difficulty: hosting.difficulty, animations: hosting.animations, online });
        }
      },
      () => setMessage('Connessione persa.'),
    );
    return unsubscribe;
  }, [hosting, isReady, connection.uid, trimmedName, handOver]);

  const createGame = async () => {
    if (!hasName) {
      setMessage('Scegli un nickname prima di creare una partita.');
      return;
    }
    setIsBusy(true);
    setMessage('');
    try {
      saveNickname(trimmedName);
      await createLobbyGame(connection.uid, trimmedName, difficulty, animations);
      hostedUidRef.current = connection.uid;
      setHosting({ difficulty, animations });
    } catch {
      setMessage('Impossibile creare la partita. Riprova.');
    }
    setIsBusy(false);
  };

  const cancelHosting = () => {
    void removeLobbyGame(connection.uid);
    hostedUidRef.current = null;
    setHosting(null);
  };

  const joinGame = async (lobbyGame: LobbyGame) => {
    if (!hasName) {
      setMessage('Scegli un nickname prima di unirti a una partita.');
      return;
    }
    setIsBusy(true);
    setMessage('');
    try {
      await joinLobbyGame(lobbyGame, connection.uid, trimmedName);
      const online = buildGuestMatch(connection.uid, trimmedName, lobbyGame);
      handOver({ difficulty: lobbyGame.difficulty, animations: lobbyGame.animations, online });
    } catch {
      setMessage('La partita non è più disponibile: qualcuno è entrato prima di te.');
      setIsBusy(false);
    }
  };

  if (connection.status === 'error') {
    return <ConnectionError onRetry={connection.retry} />;
  }
  if (!isReady) {
    return <p className="lobby__empty">Connessione in corso…</p>;
  }
  if (hosting !== null) {
    return <WaitingPanel settings={hosting} onCancel={cancelHosting} />;
  }
  return (
    <>
      <NicknamePanel nickname={nickname} onChange={setNickname} />
      <OpenGamesPanel ownUid={connection.uid} canJoin={hasName} isBusy={isBusy} onJoin={joinGame} />
      <p className="lobby__note">Oppure crea la tua partita: scegli velocità e animazioni, poi attendi un avversario.</p>
      <SpeedSection game={game} difficulty={difficulty} onChange={onDifficultyChange} />
      <AnimationSection game={game} enabled={animations} onChange={onAnimationsChange} />
      {message !== '' && (
        <p className="lobby__message" role="alert">
          {message}
        </p>
      )}
      <div className="setup__actions">
        <button type="button" className="start-button" disabled={isBusy} onClick={createGame}>
          <span className="start-button__icon" aria-hidden="true">
            ＋
          </span>
          Crea partita
        </button>
      </div>
    </>
  );
}

export default OnlineSetup;
