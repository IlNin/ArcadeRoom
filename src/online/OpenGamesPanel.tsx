import { useEffect, useState } from 'react';
import { getDifficultyLabel } from '../core/difficulty';
import type { LobbyGame } from './lobbyEntry';
import { watchOpenGames } from './lobbyService';

interface OpenGamesPanelProps {
  ownUid: string;
  canJoin: boolean;
  isBusy: boolean;
  onJoin(game: LobbyGame): void;
}

function useOpenGames(ownUid: string): { games: LobbyGame[]; hasError: boolean } {
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const unsubscribe = watchOpenGames(
      (open) => {
        setHasError(false);
        setGames(open);
      },
      () => setHasError(true),
    );
    return unsubscribe;
  }, []);

  const others = games.filter((game) => game.hostUid !== ownUid);
  return { games: others, hasError };
}

function GameRow({ game, canJoin, isBusy, onJoin }: { game: LobbyGame; canJoin: boolean; isBusy: boolean; onJoin(game: LobbyGame): void }) {
  const animationsLabel = game.animations ? 'Animazioni attive' : 'Animazioni spente';
  const isDisabled = !canJoin || isBusy;
  return (
    <li className="lobby__row">
      <span className="lobby__host">{game.hostName}</span>
      <span className="lobby__chip">{getDifficultyLabel(game.difficulty)}</span>
      <span className="lobby__chip lobby__chip--muted">{animationsLabel}</span>
      <button type="button" className="lobby__join" disabled={isDisabled} onClick={() => onJoin(game)}>
        Unisciti
      </button>
    </li>
  );
}

export function OpenGamesPanel({ ownUid, canJoin, isBusy, onJoin }: OpenGamesPanelProps) {
  const { games, hasError } = useOpenGames(ownUid);
  return (
    <section className="setup__panel" aria-labelledby="open-games-title">
      <h2 className="setup__panel-title" id="open-games-title">
        <span aria-hidden="true">🌐</span> Partite aperte
      </h2>
      {hasError && <p className="lobby__empty">Impossibile leggere l&apos;elenco delle partite.</p>}
      {!hasError && games.length === 0 && (
        <p className="lobby__empty">Nessuna partita aperta: creane una qui sotto e aspetta un avversario.</p>
      )}
      {games.length > 0 && (
        <ul className="lobby__list">
          {games.map((game) => (
            <GameRow key={game.hostUid} game={game} canJoin={canJoin} isBusy={isBusy} onJoin={onJoin} />
          ))}
        </ul>
      )}
    </section>
  );
}
