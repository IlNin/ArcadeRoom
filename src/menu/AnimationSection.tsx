import type { Game } from '../core/game';

interface AnimationSectionProps {
  game: Game;
  enabled: boolean;
  onChange(enabled: boolean): void;
}

interface AnimationChoice {
  value: boolean;
  label: string;
  hint: string;
}

function buildChoices(game: Game): AnimationChoice[] {
  const hints = game.animationHints;
  const onHint = hints === undefined ? '' : hints.on;
  const offHint = hints === undefined ? '' : hints.off;
  const choices: AnimationChoice[] = [
    { value: true, label: 'Attive', hint: onHint },
    { value: false, label: 'Disattivate', hint: offHint },
  ];
  return choices;
}

export function AnimationSection({ game, enabled, onChange }: AnimationSectionProps) {
  const Preview = game.AnimationPreview;
  if (Preview === undefined) {
    return null;
  }
  return (
    <section className="setup__panel" aria-labelledby="animations-title">
      <h2 className="setup__panel-title" id="animations-title">
        <span aria-hidden="true">✨</span> Animazioni
      </h2>
      <div className="toggles" role="radiogroup" aria-label="Animazioni">
        {buildChoices(game).map((choice) => {
          const isSelected = choice.value === enabled;
          const className = isSelected ? 'toggle toggle--selected' : 'toggle';
          return (
            <button
              key={String(choice.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={className}
              onClick={() => onChange(choice.value)}
            >
              <span className="toggle__media">
                <Preview enabled={choice.value} />
              </span>
              <span className="toggle__content">
                <span className="toggle__label">{choice.label}</span>
                <span className="toggle__hint">{choice.hint}</span>
              </span>
              <span className="toggle__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
