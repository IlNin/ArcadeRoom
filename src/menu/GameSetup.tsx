import { useEffect, useState, type CSSProperties } from 'react';
import type { Difficulty } from '../core/difficulty';
import { getSupportedModes, type Game } from '../core/game';
import { GAME_MODES, type GameConfig, type GameMode } from '../core/gameMode';
import { prefersReducedMotion } from '../core/motion';
import { loadLastAnimations, loadLastDifficulty, loadLastMode, loadLastOpponent } from '../core/storage';
import { AnimationSection } from './AnimationSection';
import { BackButton } from './BackButton';
import { OpponentSection } from './OpponentSection';
import { SegmentedControl } from './SegmentedControl';
import { SpeedSection } from './SpeedSection';

interface GameSetupProps {
  game: Game;
  onSelect(config: GameConfig): void;
  onBack(): void;
}

function buildModeOptions(modes: GameMode[]) {
  const options = GAME_MODES.filter((info) => modes.includes(info.id)).map((info) => ({ id: info.id, label: info.label }));
  return options;
}

function resolveInitialAnimations(gameId: string): boolean {
  const stored = loadLastAnimations(gameId);
  if (stored !== null) {
    return stored;
  }
  const enabled = !prefersReducedMotion();
  return enabled;
}

export function GameSetup({ game, onSelect, onBack }: GameSetupProps) {
  const modes = getSupportedModes(game);
  const [mode, setMode] = useState<GameMode>(() => loadLastMode(game.id, modes));
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadLastDifficulty(game.id));
  const [opponent, setOpponent] = useState<Difficulty>(() => loadLastOpponent(game.id));
  const [animations, setAnimations] = useState<boolean>(() => resolveInitialAnimations(game.id));
  const style = { '--accent': game.accent } as CSSProperties;
  const isVersus = mode === 'versus';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  const startGame = () => {
    const config: GameConfig = { mode, difficulty, opponent, animations };
    onSelect(config);
  };

  return (
    <main className="setup" style={style}>
      <BackButton label="Menù" onClick={onBack} />

      <header className="setup__header">
        <span className="setup__icon">{game.icon}</span>
        <h1 className="setup__title">{game.title}</h1>
        {modes.length > 1 && (
          <SegmentedControl<GameMode>
            label="Modalità"
            options={buildModeOptions(modes)}
            value={mode}
            onChange={(value) => setMode(value)}
          />
        )}
      </header>
      {isVersus && <OpponentSection game={game} opponent={opponent} onChange={setOpponent} />}
      <SpeedSection game={game} difficulty={difficulty} onChange={setDifficulty} />
      <AnimationSection game={game} enabled={animations} onChange={setAnimations} />
      <div className="setup__actions">
        <button type="button" className="start-button" onClick={startGame}>
          <span className="start-button__icon" aria-hidden="true">
            ▶
          </span>
          Avvia gioco
        </button>
      </div>
    </main>
  );
}
