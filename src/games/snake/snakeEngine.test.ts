import { describe, expect, it } from 'vitest';
import { SNAKE_SETTINGS } from './snakeDifficulty';
import { createPlayerEngine } from './snakeEngine';

describe('snakeEngine', () => {
  it('con le animazioni attive il movimento avanza in modo fluido tra un passo e l\'altro', () => {
    const engine = createPlayerEngine(SNAKE_SETTINGS.normal, true);
    const halfTick = SNAKE_SETTINGS.normal.baseTickMs / 2;

    engine.update(halfTick);
    const view = engine.getView(0);

    expect(view.progress).toBeGreaterThan(0.3);
    expect(view.progress).toBeLessThan(0.7);
    expect(view.animated).toBe(true);
  });

  it('con le animazioni disattivate la testa è sempre sulla cella logica', () => {
    const engine = createPlayerEngine(SNAKE_SETTINGS.normal, false);
    const halfTick = SNAKE_SETTINGS.normal.baseTickMs / 2;

    engine.update(halfTick);
    const view = engine.getView(0);

    expect(view.progress).toBe(1);
    expect(view.animated).toBe(false);
  });

  it('le animazioni non cambiano il ritmo di gioco', () => {
    const animated = createPlayerEngine(SNAKE_SETTINGS.normal, true);
    const stepped = createPlayerEngine(SNAKE_SETTINGS.normal, false);
    const tick = SNAKE_SETTINGS.normal.baseTickMs;
    const headXBefore = animated.state.snake[0].x;

    animated.update(tick + 1);
    stepped.update(tick + 1);

    expect(animated.state.snake[0].x).toBe(headXBefore + 1);
    expect(stepped.state.snake[0].x).toBe(headXBefore + 1);
  });
});
