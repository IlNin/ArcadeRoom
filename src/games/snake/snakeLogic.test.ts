import { describe, expect, it } from 'vitest';
import {
  changeDirection,
  createInitialState,
  getGraceDuration,
  getTickInterval,
  isNextStepFatal,
  placeFood,
  step,
  type SnakeState,
} from './snakeLogic';
import { SNAKE_SETTINGS } from './snakeDifficulty';

const fixedRandom = () => 0;

function createState(): SnakeState {
  const state = createInitialState(10, 10, fixedRandom);
  return state;
}

describe('snakeLogic', () => {
  it('muove il serpente di una cella nella direzione corrente', () => {
    const state = createState();
    const head = state.snake[0];

    const next = step(state, fixedRandom);

    expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.snake).toHaveLength(state.snake.length);
  });

  it('ignora l\'inversione di direzione di 180 gradi', () => {
    const state = createState();

    const next = changeDirection(state, 'left');

    expect(next.nextDirection).toBe('right');
  });

  it('cresce e aumenta il punteggio quando mangia il cibo', () => {
    const state = createState();
    const head = state.snake[0];
    const withFoodAhead: SnakeState = { ...state, food: { x: head.x + 1, y: head.y } };

    const next = step(withFoodAhead, fixedRandom);

    expect(next.score).toBe(1);
    expect(next.snake).toHaveLength(state.snake.length + 1);
  });

  it('termina la partita contro il muro', () => {
    const state = createState();
    const nearWall: SnakeState = { ...state, snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }] };

    const next = step(nearWall, fixedRandom);

    expect(next.status).toBe('gameOver');
  });

  it('termina la partita se il serpente si morde', () => {
    const state = createState();
    const curled: SnakeState = {
      ...state,
      direction: 'up',
      nextDirection: 'left',
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
      ],
    };

    const next = step(curled, fixedRandom);

    expect(next.status).toBe('gameOver');
  });

  it('permette di seguire la coda che si sta spostando', () => {
    const state = createState();
    const chasingTail: SnakeState = {
      ...state,
      direction: 'up',
      nextDirection: 'left',
      food: { x: 0, y: 0 },
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
    };

    const next = step(chasingTail, fixedRandom);

    expect(next.status).toBe('running');
  });

  it('non piazza il cibo sul serpente', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];

    const food = placeFood(2, 1, snake, fixedRandom);

    expect(food).toBeNull();
  });

  it('riconosce che il prossimo passo è fatale contro il muro', () => {
    const state = createState();
    const nearWall: SnakeState = { ...state, snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }] };

    expect(isNextStepFatal(nearWall)).toBe(true);
  });

  it('non considera fatale un passo verso una cella libera', () => {
    const state = createState();

    expect(isNextStepFatal(state)).toBe(false);
  });

  it('non considera fatale seguire la coda che si sposta', () => {
    const state = createState();
    const chasingTail: SnakeState = {
      ...state,
      direction: 'up',
      nextDirection: 'left',
      food: { x: 0, y: 0 },
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
    };

    expect(isNextStepFatal(chasingTail)).toBe(false);
  });

  it('dopo aver cambiato direzione verso una cella libera il passo non è più fatale', () => {
    const state = createState();
    const nearWall: SnakeState = { ...state, snake: [{ x: 9, y: 5 }, { x: 8, y: 5 }] };

    const turned = changeDirection(nearWall, 'up');

    expect(isNextStepFatal(turned)).toBe(false);
  });

  it('ha una durata di grazia positiva che segue la velocità', () => {
    expect(getGraceDuration(0, SNAKE_SETTINGS.normal)).toBeGreaterThan(0);
    expect(getGraceDuration(0, SNAKE_SETTINGS.normal)).toBeGreaterThan(getGraceDuration(1000, SNAKE_SETTINGS.normal));
  });

  it('parte più lento in facile e più veloce in difficile', () => {
    const easyInterval = getTickInterval(0, SNAKE_SETTINGS.easy);
    const normalInterval = getTickInterval(0, SNAKE_SETTINGS.normal);
    const hardInterval = getTickInterval(0, SNAKE_SETTINGS.hard);

    expect(easyInterval).toBeGreaterThan(normalInterval);
    expect(normalInterval).toBeGreaterThan(hardInterval);
  });

  it('concede più tempo di grazia in facile che in difficile', () => {
    const easyGrace = getGraceDuration(0, SNAKE_SETTINGS.easy);
    const normalGrace = getGraceDuration(0, SNAKE_SETTINGS.normal);
    const hardGrace = getGraceDuration(0, SNAKE_SETTINGS.hard);

    expect(easyGrace).toBeGreaterThan(normalGrace);
    expect(normalGrace).toBeGreaterThan(hardGrace);
  });

  it('rispetta la velocità massima di ogni difficoltà', () => {
    expect(getTickInterval(1000, SNAKE_SETTINGS.easy)).toBe(SNAKE_SETTINGS.easy.minTickMs);
    expect(getTickInterval(1000, SNAKE_SETTINGS.hard)).toBe(SNAKE_SETTINGS.hard.minTickMs);
  });

  it('accelera con il punteggio fino a un minimo', () => {
    expect(getTickInterval(0, SNAKE_SETTINGS.normal)).toBeGreaterThan(getTickInterval(10, SNAKE_SETTINGS.normal));
    expect(getTickInterval(1000, SNAKE_SETTINGS.normal)).toBe(60);
  });
});
