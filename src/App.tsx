import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Game, GameContext } from './core/game';
import type { GameConfig } from './core/gameMode';
import {
  loadHighScore,
  saveHighScore,
  saveLastAnimations,
  saveLastDifficulty,
  saveLastMode,
  saveLastOpponent,
} from './core/storage';
import { games } from './games';
import { upcomingGames } from './games/upcoming';
import { AppBackground } from './menu/AppBackground';
import { BackButton } from './menu/BackButton';
import { GameSetup } from './menu/GameSetup';
import { Menu } from './menu/Menu';

interface Selection {
  gameId: string;
  config: GameConfig | null;
}

function createContext(game: Game, config: GameConfig, exitToMenu: () => void): GameContext {
  const context: GameContext = {
    getHighScore: () => loadHighScore(game.id, config.difficulty),
    submitScore: (score) => {
      if (score > loadHighScore(game.id, config.difficulty)) {
        saveHighScore(game.id, config.difficulty, score);
      }
    },
    exitToMenu,
  };
  return context;
}

interface GameScreenProps {
  game: Game;
  config: GameConfig;
  onExit(): void;
  onBack(): void;
}

function GameScreen({ game, config, onExit, onBack }: GameScreenProps) {
  const context = useMemo(() => createContext(game, config, onExit), [game, config, onExit]);
  const GameComponent = game.Component;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const style = { '--accent': game.accent } as CSSProperties;
  const isTwoBoards = config.mode !== 'solo';
  const className = isTwoBoards ? 'game-screen game-screen--wide' : 'game-screen';

  return (
    <div className={className} style={style}>
      <header className="game-screen__header">
        <BackButton label="Indietro" onClick={onBack} showEscHint />
        <h2 className="game-screen__title">
          <span className="game-screen__icon">{game.icon}</span>
          {game.title}
        </h2>
      </header>
      <GameComponent context={context} config={config} />
    </div>
  );
}

function buildScreenKey(selection: Selection | null): string {
  if (selection === null) {
    return 'menu';
  }
  const config = selection.config;
  if (config === null) {
    return `${selection.gameId}-setup`;
  }
  const key = `${selection.gameId}-${config.mode}-${config.difficulty}-${config.opponent}-${config.animations}`;
  return key;
}

export function App() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedGame = games.find((game) => game.id === selection?.gameId);

  const goToMenu = useCallback(() => setSelection(null), []);

  const goToSetup = useCallback(() => {
    setSelection((current) => (current === null ? null : { gameId: current.gameId, config: null }));
  }, []);

  const startGame = (gameId: string, config: GameConfig) => {
    saveLastDifficulty(gameId, config.difficulty);
    saveLastMode(gameId, config.mode);
    saveLastOpponent(gameId, config.opponent);
    saveLastAnimations(gameId, config.animations);
    setSelection({ gameId, config });
  };

  const isPlaying = selection !== null && selection.config !== null && selectedGame !== undefined;

  const renderScreen = () => {
    if (selection === null || selectedGame === undefined) {
      return <Menu games={games} upcoming={upcomingGames} onSelect={(gameId) => setSelection({ gameId, config: null })} />;
    }
    if (selection.config === null) {
      return (
        <GameSetup
          game={selectedGame}
          onSelect={(config) => startGame(selectedGame.id, config)}
          onBack={goToMenu}
        />
      );
    }
    return <GameScreen game={selectedGame} config={selection.config} onExit={goToMenu} onBack={goToSetup} />;
  };

  return (
    <>
      <AppBackground calm={isPlaying} />
      <div className="screen" key={buildScreenKey(selection)}>
        {renderScreen()}
      </div>
    </>
  );
}
