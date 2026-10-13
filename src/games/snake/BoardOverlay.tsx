import type { SnakeStatus } from './snakeLogic';

interface BoardOverlayProps {
  status: SnakeStatus;
  paused: boolean;
  onResume?: () => void;
}

export function BoardOverlay({ status, paused, onResume }: BoardOverlayProps) {
  if (status !== 'running') {
    const text = status === 'won' ? 'Completato!' : 'Game over';
    return (
      <div className="overlay overlay--soft">
        <p>{text}</p>
      </div>
    );
  }
  if (!paused) {
    return null;
  }
  return (
    <div className="overlay">
      <p>Pausa</p>
      {onResume !== undefined && <button onClick={onResume}>Riprendi</button>}
    </div>
  );
}
