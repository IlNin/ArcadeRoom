import { BOARD_COLS, BOARD_ROWS } from './snakeConfig';
import { FOOD_KINDS, type FoodKind, type Point, type SnakeState, type SnakeStatus } from './snakeLogic';

export interface SnakeSnapshot {
  snake: Point[];
  food: Point | null;
  foodKind: FoodKind;
  score: number;
  status: SnakeStatus;
  left: boolean;
  forfeit: boolean;
}

export interface RawSnakeSnapshot {
  snake: string;
  food: number;
  kind: string;
  score: number;
  status: string;
  left: boolean;
  forfeit: boolean;
}

const NO_FOOD = -1;
const STATUSES: SnakeStatus[] = ['running', 'gameOver', 'won'];

function toIndex(point: Point, cols: number): number {
  const index = point.y * cols + point.x;
  return index;
}

function toPoint(index: number, cols: number): Point {
  const point: Point = { x: index % cols, y: Math.floor(index / cols) };
  return point;
}

export function encodeSnapshot(state: SnakeState, forfeit: boolean): RawSnakeSnapshot {
  const cells = state.snake.map((cell) => toIndex(cell, state.cols));
  const food = state.food === null ? NO_FOOD : toIndex(state.food, state.cols);
  const raw: RawSnakeSnapshot = {
    snake: cells.join(','),
    food,
    kind: state.foodKind,
    score: state.score,
    status: state.status,
    left: false,
    forfeit,
  };
  return raw;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === 'object' && value !== null;
  return isObject;
}

function isValidIndex(value: number, cellCount: number): boolean {
  const isInteger = Number.isInteger(value);
  const isInRange = value >= 0 && value < cellCount;
  const isValid = isInteger && isInRange;
  return isValid;
}

function parseSnake(raw: unknown, cols: number, rows: number): Point[] | null {
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  const cellCount = cols * rows;
  const indexes = raw.split(',').map(Number);
  const allValid = indexes.every((index) => isValidIndex(index, cellCount));
  if (!allValid) {
    return null;
  }
  const snake = indexes.map((index) => toPoint(index, cols));
  return snake;
}

function parseFood(raw: unknown, cols: number, rows: number): Point | null | undefined {
  if (typeof raw !== 'number') {
    return undefined;
  }
  if (raw === NO_FOOD) {
    return null;
  }
  const isValid = isValidIndex(raw, cols * rows);
  const food = isValid ? toPoint(raw, cols) : undefined;
  return food;
}

function parseKind(raw: unknown): FoodKind | null {
  const found = FOOD_KINDS.find((kind) => kind === raw);
  const kind = found === undefined ? null : found;
  return kind;
}

function parseStatus(raw: unknown): SnakeStatus | null {
  const found = STATUSES.find((status) => status === raw);
  const status = found === undefined ? null : found;
  return status;
}

function parseScore(raw: unknown): number | null {
  const isScore = typeof raw === 'number' && Number.isInteger(raw) && raw >= 0;
  const score = isScore ? raw : null;
  return score;
}

export function decodeSnapshot(raw: unknown, cols = BOARD_COLS, rows = BOARD_ROWS): SnakeSnapshot | null {
  if (!isRecord(raw)) {
    return null;
  }
  const snake = parseSnake(raw.snake, cols, rows);
  const food = parseFood(raw.food, cols, rows);
  const foodKind = parseKind(raw.kind);
  const status = parseStatus(raw.status);
  const score = parseScore(raw.score);
  const isComplete = snake !== null && food !== undefined && foodKind !== null && status !== null && score !== null;
  if (!isComplete) {
    return null;
  }
  const snapshot: SnakeSnapshot = {
    snake,
    food,
    foodKind,
    score,
    status,
    left: raw.left === true,
    forfeit: raw.forfeit === true,
  };
  return snapshot;
}
