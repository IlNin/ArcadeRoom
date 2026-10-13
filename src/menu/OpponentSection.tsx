import { DIFFICULTIES, type Difficulty } from '../core/difficulty';
import type { Game } from '../core/game';

interface OpponentSectionProps {
  game: Game;
  opponent: Difficulty;
  onChange(opponent: Difficulty): void;
}

function resolveHint(game: Game, difficulty: Difficulty, fallback: string): string {
  if (game.opponentHints === undefined) {
    return fallback;
  }
  const hint = game.opponentHints[difficulty];
  return hint;
}

export function OpponentSection({ game, opponent, onChange }: OpponentSectionProps) {
  return (
    <section className="setup__panel" aria-labelledby="opponent-title">
      <h2 className="setup__panel-title" id="opponent-title">
        <span aria-hidden="true">🤖</span> Avversario
      </h2>
      <div className="setup__options" role="radiogroup" aria-label="Difficoltà dell'avversario">
        {DIFFICULTIES.map((info) => {
          const isSelected = info.id === opponent;
          const className = isSelected ? `option option--${info.id} option--selected` : `option option--${info.id}`;
          return (
            <button
              key={info.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={className}
              onClick={() => onChange(info.id)}
            >
              <span className="option__content">
                <span className="option__label">{info.label}</span>
                <span className="option__hint">{resolveHint(game, info.id, info.description)}</span>
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
