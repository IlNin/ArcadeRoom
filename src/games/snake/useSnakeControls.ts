import { useEffect } from 'react';
import type { Direction } from './snakeLogic';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

export function useSnakeControls(onDirection: (direction: Direction) => void, onTogglePause: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction !== undefined) {
        event.preventDefault();
        onDirection(direction);
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        onTogglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDirection, onTogglePause]);
}
