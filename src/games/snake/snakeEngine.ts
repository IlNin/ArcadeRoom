import { CPU_PALETTE, type SceneView, type SnakePalette } from './snakeBodyRenderer';
import { chooseCpuDirection, type CpuProfile } from './cpuPlayer';
import { BOARD_COLS, BOARD_ROWS } from './snakeConfig';
import type { SnakeSettings } from './snakeDifficulty';
import {
  changeDirection,
  createInitialState,
  getGraceDuration,
  getTickInterval,
  isNextStepFatal,
  step,
  type Direction,
  type Point,
  type RandomFn,
  type SnakeState,
  type SnakeStatus,
} from './snakeLogic';

export interface EngineOptions {
  cols: number;
  rows: number;
  settings: SnakeSettings;
  random: RandomFn;
  graceEnabled: boolean;
  chooseDirection?: (state: SnakeState) => Direction;
  stallLimit?: number;
  palette?: SnakePalette;
  animated?: boolean;
}

const TURBO_STEPS_PER_FRAME = 12;
const CPU_STALL_LIMIT = BOARD_COLS * BOARD_ROWS * 2;

export class SnakeEngine {
  state: SnakeState;
  previousSnake: Point[];
  paused = false;
  turbo = false;
  private options: EngineOptions;
  private accumulator = 0;
  private graceElapsed = 0;
  private stepsSinceFood = 0;

  constructor(options: EngineOptions) {
    this.options = options;
    this.state = createInitialState(options.cols, options.rows, options.random);
    this.previousSnake = this.state.snake;
  }

  get score(): number {
    return this.state.score;
  }

  get status(): SnakeStatus {
    return this.state.status;
  }

  get isRunning(): boolean {
    const running = this.state.status === 'running';
    return running;
  }

  reset(): void {
    this.state = createInitialState(this.options.cols, this.options.rows, this.options.random);
    this.previousSnake = this.state.snake;
    this.paused = false;
    this.turbo = false;
    this.accumulator = 0;
    this.graceElapsed = 0;
    this.stepsSinceFood = 0;
  }

  requestDirection(direction: Direction): void {
    this.state = changeDirection(this.state, direction);
  }

  update(deltaMs: number): void {
    if (!this.isRunning) {
      this.accumulator = 0;
      return;
    }
    if (this.paused) {
      return;
    }
    if (this.turbo) {
      this.runTurbo();
      return;
    }
    this.accumulator += deltaMs;
    this.advance(deltaMs);
  }

  getView(timeMs: number): SceneView {
    const view: SceneView = {
      state: this.state,
      previousSnake: this.previousSnake,
      progress: this.computeProgress(),
      timeMs,
      palette: this.options.palette,
      animated: this.options.animated,
    };
    return view;
  }

  private computeProgress(): number {
    const isAnimated = this.options.animated !== false;
    if (this.turbo || !isAnimated) {
      return 1;
    }
    const interval = getTickInterval(this.state.score, this.options.settings);
    const progress = Math.min(this.accumulator / interval, 1);
    return progress;
  }

  private advance(deltaMs: number): void {
    while (this.isRunning) {
      const interval = getTickInterval(this.state.score, this.options.settings);
      if (this.accumulator < interval) {
        return;
      }
      if (this.shouldHoldForGrace()) {
        this.graceElapsed += deltaMs;
        this.accumulator = interval;
        return;
      }
      this.performStep();
      this.accumulator -= interval;
    }
  }

  private runTurbo(): void {
    for (let i = 0; i < TURBO_STEPS_PER_FRAME && this.isRunning; i++) {
      this.performStep();
    }
    this.accumulator = 0;
  }

  private shouldHoldForGrace(): boolean {
    if (!this.options.graceEnabled) {
      return false;
    }
    const isFatal = isNextStepFatal(this.state);
    const isGraceLeft = this.graceElapsed < getGraceDuration(this.state.score, this.options.settings);
    const shouldHold = isFatal && isGraceLeft;
    return shouldHold;
  }

  private applyChosenDirection(): void {
    const chooseDirection = this.options.chooseDirection;
    if (chooseDirection === undefined) {
      return;
    }
    const direction = chooseDirection(this.state);
    this.state = changeDirection(this.state, direction);
  }

  private performStep(): void {
    this.applyChosenDirection();
    this.previousSnake = this.state.snake;
    const scoreBefore = this.state.score;
    this.state = step(this.state, this.options.random);
    this.graceElapsed = 0;
    this.trackStall(scoreBefore);
  }

  private trackStall(scoreBefore: number): void {
    const hasEaten = this.state.score !== scoreBefore;
    this.stepsSinceFood = hasEaten ? 0 : this.stepsSinceFood + 1;
    const stallLimit = this.options.stallLimit;
    if (stallLimit === undefined) {
      return;
    }
    const isStalled = this.stepsSinceFood >= stallLimit;
    if (isStalled && this.isRunning) {
      this.state = { ...this.state, status: 'gameOver' };
    }
  }
}

export function createPlayerEngine(settings: SnakeSettings, animated: boolean): SnakeEngine {
  const engine = new SnakeEngine({
    cols: BOARD_COLS,
    rows: BOARD_ROWS,
    settings,
    random: Math.random,
    graceEnabled: true,
    animated,
  });
  return engine;
}

export function createCpuEngine(settings: SnakeSettings, profile: CpuProfile, animated: boolean): SnakeEngine {
  const engine = new SnakeEngine({
    cols: BOARD_COLS,
    rows: BOARD_ROWS,
    settings,
    random: Math.random,
    graceEnabled: false,
    chooseDirection: (state) => chooseCpuDirection(state, profile, Math.random),
    stallLimit: CPU_STALL_LIMIT,
    palette: CPU_PALETTE,
    animated,
  });
  return engine;
}
