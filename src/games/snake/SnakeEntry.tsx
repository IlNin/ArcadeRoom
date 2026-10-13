import type { GameProps } from '../../core/game';
import { SnakeGame } from './SnakeGame';
import { SnakeVersus } from './SnakeVersus';

export function SnakeEntry(props: GameProps) {
  if (props.config.mode === 'versus') {
    return <SnakeVersus {...props} />;
  }
  return <SnakeGame {...props} />;
}
