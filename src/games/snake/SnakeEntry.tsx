import { lazy, Suspense } from 'react';
import type { GameProps } from '../../core/game';
import { SnakeGame } from './SnakeGame';
import { SnakeVersus } from './SnakeVersus';

const SnakeOnline = lazy(() => import('./SnakeOnline'));

export function SnakeEntry(props: GameProps) {
  if (props.config.mode === 'online') {
    return (
      <Suspense fallback={<p className="hint">Connessione in corso…</p>}>
        <SnakeOnline {...props} />
      </Suspense>
    );
  }
  if (props.config.mode === 'versus') {
    return <SnakeVersus {...props} />;
  }
  return <SnakeGame {...props} />;
}
