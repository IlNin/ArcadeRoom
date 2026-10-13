import type { Direction } from './snakeLogic';

interface DpadProps {
  onDirection(direction: Direction): void;
}

export function Dpad({ onDirection }: DpadProps) {
  return (
    <div className="dpad">
      <button aria-label="Su" onClick={() => onDirection('up')}>▲</button>
      <button aria-label="Sinistra" onClick={() => onDirection('left')}>◀</button>
      <button aria-label="Giù" onClick={() => onDirection('down')}>▼</button>
      <button aria-label="Destra" onClick={() => onDirection('right')}>▶</button>
    </div>
  );
}
