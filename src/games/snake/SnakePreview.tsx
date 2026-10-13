import { useEffect, useRef } from 'react';
import type { Difficulty } from '../../core/difficulty';
import { prefersReducedMotion } from '../../core/motion';
import { createSeededRandom } from './seededRandom';
import { chooseAutoDirection } from './snakeAutoPilot';
import type { SceneView } from './snakeBodyRenderer';
import { SNAKE_SETTINGS } from './snakeDifficulty';
import { changeDirection, createInitialState, step, type Point, type RandomFn, type SnakeState } from './snakeLogic';
import { renderScene } from './snakeRenderer';

const COLS = 12;
const ROWS = 7;
const CELL_SIZE = 24;
const MENU_STEP_INTERVAL_MS = 130;
const MAX_FRAME_DELTA_MS = 250;
const MAX_PREVIEW_LENGTH = 16;
const SPEED_PREVIEW_SEED = 11;
const ANIMATION_PREVIEW_STEP_MS = 280;

interface PreviewCanvasProps {
  stepIntervalMs: number;
  createRandom(): RandomFn;
  animated?: boolean;
}

function shouldRestart(state: SnakeState): boolean {
  const isOver = state.status !== 'running';
  const isTooLong = state.snake.length >= MAX_PREVIEW_LENGTH;
  const restart = isOver || isTooLong;
  return restart;
}

function createMenuRandom(): RandomFn {
  return Math.random;
}

function createSpeedRandom(): RandomFn {
  const random = createSeededRandom(SPEED_PREVIEW_SEED);
  return random;
}

function SnakePreviewCanvas({ stepIntervalMs, createRandom, animated = true }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const random = createRandom();
    const newPreviewState = () => createInitialState(COLS, ROWS, random);
    let state = newPreviewState();
    let previousSnake: Point[] = state.snake;
    let accumulator = 0;
    let lastTime = performance.now();
    let frameId = 0;

    const advanceOneStep = () => {
      previousSnake = state.snake;
      const direction = chooseAutoDirection(state);
      state = changeDirection(state, direction);
      state = step(state, random);
      if (shouldRestart(state)) {
        state = newPreviewState();
        previousSnake = state.snake;
      }
    };

    const draw = (now: number) => {
      const progress = animated ? Math.min(accumulator / stepIntervalMs, 1) : 1;
      const view: SceneView = { state, previousSnake, progress, timeMs: now, animated };
      renderScene(ctx, view, CELL_SIZE);
    };

    if (prefersReducedMotion()) {
      draw(0);
      return;
    }

    const frame = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_FRAME_DELTA_MS);
      lastTime = now;
      accumulator += delta;
      while (accumulator >= stepIntervalMs) {
        advanceOneStep();
        accumulator -= stepIntervalMs;
      }
      draw(now);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [stepIntervalMs, createRandom, animated]);

  return <canvas ref={canvasRef} className="preview-canvas" width={COLS * CELL_SIZE} height={ROWS * CELL_SIZE} aria-hidden="true" />;
}

export function SnakePreview() {
  return <SnakePreviewCanvas stepIntervalMs={MENU_STEP_INTERVAL_MS} createRandom={createMenuRandom} />;
}

interface SnakeSpeedPreviewProps {
  difficulty: Difficulty;
}

export function SnakeSpeedPreview({ difficulty }: SnakeSpeedPreviewProps) {
  const stepIntervalMs = SNAKE_SETTINGS[difficulty].baseTickMs;
  return <SnakePreviewCanvas stepIntervalMs={stepIntervalMs} createRandom={createSpeedRandom} />;
}

interface SnakeAnimationPreviewProps {
  enabled: boolean;
}

export function SnakeAnimationPreview({ enabled }: SnakeAnimationPreviewProps) {
  return <SnakePreviewCanvas stepIntervalMs={ANIMATION_PREVIEW_STEP_MS} createRandom={createSpeedRandom} animated={enabled} />;
}
