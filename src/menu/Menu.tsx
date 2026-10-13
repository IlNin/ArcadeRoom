import { useRef, type KeyboardEvent } from 'react';
import type { Game, GameInfo } from '../core/game';
import { GameCard } from './GameCard';
import { UpcomingCard } from './UpcomingCard';

interface MenuProps {
  games: Game[];
  upcoming: GameInfo[];
  onSelect(gameId: string): void;
}

const FORWARD_KEYS = ['ArrowRight', 'ArrowDown'];
const BACKWARD_KEYS = ['ArrowLeft', 'ArrowUp'];

function resolveStep(key: string): number {
  if (FORWARD_KEYS.includes(key)) {
    return 1;
  }
  if (BACKWARD_KEYS.includes(key)) {
    return -1;
  }
  return 0;
}

function moveFocus(container: HTMLElement, step: number): void {
  const cards = Array.from(container.querySelectorAll<HTMLButtonElement>('button.card:not([disabled])'));
  if (cards.length === 0) {
    return;
  }
  const currentIndex = cards.indexOf(document.activeElement as HTMLButtonElement);
  const nextIndex = (currentIndex + step + cards.length) % cards.length;
  cards[nextIndex].focus();
}

export function Menu({ games, upcoming, onSelect }: MenuProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = resolveStep(event.key);
    if (step === 0 || gridRef.current === null) {
      return;
    }
    event.preventDefault();
    moveFocus(gridRef.current, step);
  };

  return (
    <main className="menu">
      <header className="menu__header">
        <h1 className="menu__title">ARCADE</h1>
        <p className="menu__subtitle">Scegli un gioco</p>
      </header>
      <div className="menu__grid" ref={gridRef} onKeyDown={handleKeyDown}>
        {games.map((game, index) => (
          <GameCard key={game.id} game={game} index={index} onSelect={() => onSelect(game.id)} />
        ))}
        {upcoming.map((game, index) => (
          <UpcomingCard key={game.id} game={game} index={games.length + index} />
        ))}
      </div>
    </main>
  );
}
