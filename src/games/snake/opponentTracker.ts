import { BOARD_COLS, BOARD_ROWS } from './snakeConfig';
import { CPU_PALETTE, type SceneView } from './snakeBodyRenderer';
import type { SnakeSettings } from './snakeDifficulty';
import { createInitialState, getTickInterval, type Direction, type Point, type SnakeState } from './snakeLogic';
import type { SnakeSnapshot } from './snakeSnapshot';

export const OPPONENT_SILENCE_TIMEOUT_MS = 10000;

function inferDirection(snake: Point[]): Direction {
  const head = snake[0];
  const neck = snake.length > 1 ? snake[1] : head;
  if (head.x > neck.x) {
    return 'right';
  }
  if (head.x < neck.x) {
    return 'left';
  }
  if (head.y < neck.y) {
    return 'up';
  }
  return 'down';
}

function isSameSnake(a: Point[], b: Point[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const isSame = a.every((cell, index) => cell.x === b[index].x && cell.y === b[index].y);
  return isSame;
}

function buildState(snapshot: SnakeSnapshot): SnakeState {
  const direction = inferDirection(snapshot.snake);
  const state: SnakeState = {
    cols: BOARD_COLS,
    rows: BOARD_ROWS,
    snake: snapshot.snake,
    direction,
    nextDirection: direction,
    food: snapshot.food,
    foodKind: snapshot.foodKind,
    score: snapshot.score,
    status: snapshot.status,
  };
  return state;
}

export class OpponentTracker {
  snapshot: SnakeSnapshot | null = null;
  hasVanished = false;
  private previousSnake: Point[] = [];
  private lastSeenAt: number;
  private movedAt: number;
  private placeholder: SnakeState;

  constructor(now: number) {
    this.lastSeenAt = now;
    this.movedAt = now;
    this.placeholder = createInitialState(BOARD_COLS, BOARD_ROWS, () => 0.5);
  }

  receive(snapshot: SnakeSnapshot | null, now: number): void {
    if (snapshot === null) {
      this.hasVanished = this.snapshot !== null;
      return;
    }
    this.lastSeenAt = now;
    const hasMoved = this.snapshot === null || !isSameSnake(this.snapshot.snake, snapshot.snake);
    if (hasMoved) {
      this.previousSnake = this.snapshot === null ? snapshot.snake : this.snapshot.snake;
      this.movedAt = now;
    }
    this.snapshot = snapshot;
  }

  get isRunning(): boolean {
    const isRunning = this.snapshot === null || this.snapshot.status === 'running';
    return isRunning;
  }

  get claimsForfeit(): boolean {
    const claims = this.snapshot !== null && this.snapshot.forfeit;
    return claims;
  }

  isDropped(now: number, timeoutMs: number): boolean {
    if (!this.isRunning) {
      return false;
    }
    const hasLeft = this.snapshot !== null && this.snapshot.left;
    if (hasLeft || this.hasVanished) {
      return true;
    }
    const isSilent = now - this.lastSeenAt > timeoutMs;
    return isSilent;
  }

  getView(now: number, settings: SnakeSettings, animated: boolean): SceneView {
    const state = this.snapshot === null ? this.placeholder : buildState(this.snapshot);
    const interval = getTickInterval(state.score, settings);
    const elapsed = now - this.movedAt;
    const progress = animated ? Math.min(elapsed / interval, 1) : 1;
    const view: SceneView = {
      state,
      previousSnake: this.previousSnake.length === 0 ? state.snake : this.previousSnake,
      progress,
      timeMs: now,
      palette: CPU_PALETTE,
      animated,
    };
    return view;
  }
}
