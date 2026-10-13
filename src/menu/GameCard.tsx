import type { CSSProperties, PointerEvent } from 'react';
import { DIFFICULTIES } from '../core/difficulty';
import type { Game } from '../core/game';
import { loadHighScore } from '../core/storage';
import { RecordTicker, type TickerRecord } from './RecordTicker';

interface GameCardProps {
  game: Game;
  index: number;
  onSelect(): void;
}

const MAX_TILT_DEG = 6;

function updateSpotlight(event: PointerEvent<HTMLButtonElement>): void {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const ratioX = (event.clientX - rect.left) / rect.width;
  const ratioY = (event.clientY - rect.top) / rect.height;
  card.style.setProperty('--mx', `${ratioX * 100}%`);
  card.style.setProperty('--my', `${ratioY * 100}%`);
  card.style.setProperty('--rx', `${(0.5 - ratioY) * MAX_TILT_DEG}deg`);
  card.style.setProperty('--ry', `${(ratioX - 0.5) * MAX_TILT_DEG}deg`);
}

function resetSpotlight(event: PointerEvent<HTMLButtonElement>): void {
  const card = event.currentTarget;
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
}

function loadTickerRecords(gameId: string): TickerRecord[] {
  const records = DIFFICULTIES.map((info) => {
    const record: TickerRecord = {
      difficulty: info.id,
      label: info.label,
      value: loadHighScore(gameId, info.id),
    };
    return record;
  });
  return records;
}

export function GameCard({ game, index, onSelect }: GameCardProps) {
  const records = loadTickerRecords(game.id);
  const style = { '--accent': game.accent, '--i': index } as CSSProperties;
  const Preview = game.Preview;
  return (
    <button
      className="card"
      style={style}
      onClick={onSelect}
      onPointerMove={updateSpotlight}
      onPointerLeave={resetSpotlight}
    >
      <span className="card__media">
        {Preview === undefined ? <span className="card__icon">{game.icon}</span> : <Preview />}
      </span>
      <span className="card__body">
        <span className="card__title">
          {game.icon} {game.title}
        </span>
        <span className="card__desc">{game.description}</span>
        <RecordTicker records={records} />
      </span>
    </button>
  );
}
