import { DIFFICULTIES, type Difficulty } from '../core/difficulty';
import type { Game } from '../core/game';
import { loadHighScore } from '../core/storage';

interface SpeedSectionProps {
  game: Game;
  difficulty: Difficulty;
  onChange(difficulty: Difficulty): void;
}

function resolveHint(game: Game, difficulty: Difficulty, fallback: string): string {
  if (game.difficultyHints === undefined) {
    return fallback;
  }
  const hint = game.difficultyHints[difficulty];
  return hint;
}

export function SpeedSection({ game, difficulty, onChange }: SpeedSectionProps) {
  const DifficultyPreview = game.DifficultyPreview;
  return (
    <section className="setup__panel" aria-labelledby="speed-title">
      <h2 className="setup__panel-title" id="speed-title">
        <span aria-hidden="true">⚡</span> Velocità
      </h2>
      <div className="setup__options" role="radiogroup" aria-label="Velocità">
        {DIFFICULTIES.map((info) => {
          const isSelected = info.id === difficulty;
          const className = isSelected ? `option option--${info.id} option--selected` : `option option--${info.id}`;
          const record = loadHighScore(game.id, info.id);
          return (
            <button
              key={info.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={className}
              onClick={() => onChange(info.id)}
            >
              {DifficultyPreview !== undefined && (
                <span className="option__media">
                  <DifficultyPreview difficulty={info.id} />
                </span>
              )}
              <span className="option__content">
                <span className="option__label">{info.label}</span>
                <span className="option__hint">{resolveHint(game, info.id, info.description)}</span>
                <span className="option__record">
                  Record: <strong>{record}</strong>
                </span>
              </span>
              <span className="option__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
