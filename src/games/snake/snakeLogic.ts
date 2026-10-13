import type { SnakeSettings } from './snakeDifficulty';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'running' | 'gameOver' | 'won';
export type RandomFn = () => number;
export type FoodKind = 'apple' | 'cherry' | 'orange' | 'banana' | 'strawberry' | 'grapes';

export interface Point {
  x: number;
  y: number;
}

export interface SnakeState {
  cols: number;
  rows: number;
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point | null;
  foodKind: FoodKind;
  score: number;
  status: SnakeStatus;
}

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const FOOD_KINDS: FoodKind[] = ['apple', 'cherry', 'orange', 'banana', 'strawberry', 'grapes'];

const INITIAL_LENGTH = 3;

export function createInitialState(cols: number, rows: number, random: RandomFn): SnakeState {
  const headX = Math.floor(cols / 2);
  const headY = Math.floor(rows / 2);
  const snake: Point[] = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    snake.push({ x: headX - i, y: headY });
  }
  const food = placeFood(cols, rows, snake, random);
  const foodKind = pickFoodKind(random);
  const state: SnakeState = {
    cols,
    rows,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food,
    foodKind,
    score: 0,
    status: 'running',
  };
  return state;
}

export function placeFood(cols: number, rows: number, snake: Point[], random: RandomFn): Point | null {
  const freeCells: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell: Point = { x, y };
      if (!containsPoint(snake, cell)) {
        freeCells.push(cell);
      }
    }
  }
  if (freeCells.length === 0) {
    return null;
  }
  const index = Math.floor(random() * freeCells.length);
  const food = freeCells[index];
  return food;
}

export function pickFoodKind(random: RandomFn): FoodKind {
  const index = Math.floor(random() * FOOD_KINDS.length);
  const kind = FOOD_KINDS[index];
  return kind;
}

export function changeDirection(state: SnakeState, requested: Direction): SnakeState {
  const isReverse = OPPOSITES[state.direction] === requested;
  if (isReverse) {
    return state;
  }
  const updated: SnakeState = { ...state, nextDirection: requested };
  return updated;
}

export function step(state: SnakeState, random: RandomFn): SnakeState {
  if (state.status !== 'running') {
    return state;
  }
  const direction = state.nextDirection;
  const newHead = getNextHead(state);
  const willEat = isSamePoint(newHead, state.food);
  const isDead = isFatalMove(state, newHead, willEat);
  if (isDead) {
    const dead: SnakeState = { ...state, direction, status: 'gameOver' };
    return dead;
  }
  const grownSnake = [newHead, ...state.snake];
  const movedSnake = willEat ? grownSnake : grownSnake.slice(0, -1);
  const food = willEat ? placeFood(state.cols, state.rows, movedSnake, random) : state.food;
  const foodKind = willEat ? pickFoodKind(random) : state.foodKind;
  const score = willEat ? state.score + 1 : state.score;
  const hasFilledBoard = food === null;
  const status: SnakeStatus = hasFilledBoard ? 'won' : 'running';
  const next: SnakeState = { ...state, snake: movedSnake, direction, food, foodKind, score, status };
  return next;
}

export function isNextStepFatal(state: SnakeState): boolean {
  if (state.status !== 'running') {
    return false;
  }
  const newHead = getNextHead(state);
  const willEat = isSamePoint(newHead, state.food);
  const isFatal = isFatalMove(state, newHead, willEat);
  return isFatal;
}

export function getTickInterval(score: number, settings: SnakeSettings): number {
  const interval = settings.baseTickMs - score * settings.tickStepMs;
  const clamped = Math.max(settings.minTickMs, interval);
  return clamped;
}

export function getGraceDuration(score: number, settings: SnakeSettings): number {
  const tickInterval = getTickInterval(score, settings);
  const grace = tickInterval * settings.graceTickRatio;
  return grace;
}

export function getNextHead(state: SnakeState): Point {
  const nextHead = movePoint(state.snake[0], state.nextDirection);
  return nextHead;
}

function isFatalMove(state: SnakeState, newHead: Point, willEat: boolean): boolean {
  const hitWall = isOutOfBounds(newHead, state.cols, state.rows);
  if (hitWall) {
    return true;
  }
  const hitSelf = isBodyHit(state, newHead, willEat);
  return hitSelf;
}

function isBodyHit(state: SnakeState, newHead: Point, willEat: boolean): boolean {
  const collidableBody = willEat ? state.snake : state.snake.slice(0, -1);
  const isHit = containsPoint(collidableBody, newHead);
  return isHit;
}

function movePoint(point: Point, direction: Direction): Point {
  const delta = DELTAS[direction];
  const moved: Point = { x: point.x + delta.x, y: point.y + delta.y };
  return moved;
}

function isOutOfBounds(point: Point, cols: number, rows: number): boolean {
  const isOutHorizontally = point.x < 0 || point.x >= cols;
  const isOutVertically = point.y < 0 || point.y >= rows;
  const isOut = isOutHorizontally || isOutVertically;
  return isOut;
}

function isSamePoint(a: Point, b: Point | null): boolean {
  if (b === null) {
    return false;
  }
  const isSame = a.x === b.x && a.y === b.y;
  return isSame;
}

function containsPoint(points: Point[], target: Point): boolean {
  const found = points.some((p) => isSamePoint(p, target));
  return found;
}
