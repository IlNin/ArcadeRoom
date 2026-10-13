import type { CSSProperties } from 'react';
import type { GameInfo } from '../core/game';

interface UpcomingCardProps {
  game: GameInfo;
  index: number;
}

export function UpcomingCard({ game, index }: UpcomingCardProps) {
  const style = { '--accent': game.accent, '--i': index } as CSSProperties;
  return (
    <button className="card card--upcoming" style={style} disabled aria-label={`${game.title}, in arrivo`}>
      <span className="card__media">
        <span className="card__icon">{game.icon}</span>
      </span>
      <span className="card__body">
        <span className="card__title">{game.title}</span>
        <span className="card__desc">{game.description}</span>
        <span className="card__badge">In arrivo</span>
      </span>
    </button>
  );
}
