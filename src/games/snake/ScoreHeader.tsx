interface ScoreHeaderProps {
  name: string;
  score: number;
  meta: string;
  variant?: 'player' | 'cpu';
}

export function ScoreHeader({ name, score, meta, variant = 'player' }: ScoreHeaderProps) {
  const className = variant === 'cpu' ? 'score-header score-header--cpu' : 'score-header';
  return (
    <div className={className}>
      <div className="score-header__row">
        <span className="score-header__name">{name}</span>
        <span className="score-header__score">{score}</span>
      </div>
      <p className="score-header__meta">{meta}</p>
    </div>
  );
}
