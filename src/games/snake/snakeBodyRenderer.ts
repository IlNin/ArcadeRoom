import type { Point, SnakeState } from './snakeLogic';

type Ctx = CanvasRenderingContext2D;

export interface SnakePalette {
  outline: string;
  body: string;
  pattern: string;
  head: string;
}

export interface SceneView {
  state: SnakeState;
  previousSnake: Point[];
  progress: number;
  timeMs: number;
  palette?: SnakePalette;
  animated?: boolean;
}

interface BodySample {
  x: number;
  y: number;
  radius: number;
  distance: number;
}

const SAMPLE_SPACING = 3;
const BODY_RADIUS_RATIO = 0.42;
const OUTLINE_WIDTH = 2.5;
const TAIL_TAPER_START = 0.5;
const TAIL_TAPER_AMOUNT = 0.55;
const PATTERN_BAND_RATIO = 0.55;
const TONGUE_PERIOD_MS = 250;
const STATIC_TONGUE_EXTENSION = 0.6;

export const PLAYER_PALETTE: SnakePalette = {
  outline: '#14532d',
  body: '#3fae49',
  pattern: '#2d8a3b',
  head: '#4cc35a',
};

export const CPU_PALETTE: SnakePalette = {
  outline: '#1e2a78',
  body: '#5b7cf0',
  pattern: '#3f5bd1',
  head: '#7b97ff',
};

const COLOR_GLOSS = 'rgba(200,255,180,0.3)';
const COLOR_TONGUE = '#e0263d';

function lerp(from: number, to: number, amount: number): number {
  const value = from + (to - from) * amount;
  return value;
}

function toPixelCenter(cell: Point, cellSize: number): Point {
  const center: Point = { x: (cell.x + 0.5) * cellSize, y: (cell.y + 0.5) * cellSize };
  return center;
}

function getVisualProgress(view: SceneView): number {
  const isRunning = view.state.status === 'running';
  const progress = isRunning ? view.progress : 1;
  return progress;
}

function computeVisualPoints(view: SceneView, cellSize: number): Point[] {
  const progress = getVisualProgress(view);
  const points = view.state.snake.map((cell, index) => {
    const hasPrevious = index < view.previousSnake.length;
    const fromCell = hasPrevious ? view.previousSnake[index] : cell;
    const from = toPixelCenter(fromCell, cellSize);
    const to = toPixelCenter(cell, cellSize);
    const point: Point = { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress) };
    return point;
  });
  return points;
}

function computePathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

function computeRadius(distance: number, totalLength: number, baseRadius: number): number {
  const ratio = totalLength > 0 ? distance / totalLength : 0;
  const taperProgress = Math.max(0, (ratio - TAIL_TAPER_START) / (1 - TAIL_TAPER_START));
  const radius = baseRadius * (1 - TAIL_TAPER_AMOUNT * taperProgress);
  return radius;
}

function sampleBody(points: Point[], baseRadius: number): BodySample[] {
  const totalLength = computePathLength(points);
  const samples: BodySample[] = [];
  let travelled = 0;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const segmentLength = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(segmentLength / SAMPLE_SPACING));
    for (let step = 0; step < steps; step++) {
      const amount = step / steps;
      const distance = travelled + segmentLength * amount;
      const radius = computeRadius(distance, totalLength, baseRadius);
      const sample: BodySample = { x: lerp(from.x, to.x, amount), y: lerp(from.y, to.y, amount), radius, distance };
      samples.push(sample);
    }
    travelled += segmentLength;
  }
  return samples;
}

function fillSamples(ctx: Ctx, samples: BodySample[], color: string, radiusScale: number, extra: number): void {
  ctx.fillStyle = color;
  for (let i = samples.length - 1; i >= 0; i--) {
    const sample = samples[i];
    ctx.beginPath();
    ctx.arc(sample.x, sample.y, sample.radius * radiusScale + extra, 0, Math.PI * 2);
    ctx.fill();
  }
}

function isPatternBand(sample: BodySample, bandLength: number): boolean {
  const bandIndex = Math.floor(sample.distance / bandLength);
  const isEven = bandIndex % 2 === 0;
  return isEven;
}

function drawBodyPattern(ctx: Ctx, samples: BodySample[], cellSize: number, palette: SnakePalette): void {
  const bandLength = cellSize * PATTERN_BAND_RATIO;
  const bandSamples = samples.filter((sample) => isPatternBand(sample, bandLength));
  fillSamples(ctx, bandSamples, palette.pattern, 0.62, 0);
}

function drawBodyGloss(ctx: Ctx, samples: BodySample[]): void {
  ctx.fillStyle = COLOR_GLOSS;
  for (let i = samples.length - 1; i >= 0; i--) {
    const sample = samples[i];
    ctx.beginPath();
    ctx.arc(sample.x - sample.radius * 0.28, sample.y - sample.radius * 0.32, sample.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTongue(ctx: Ctx, radius: number, timeMs: number, isAnimated: boolean): void {
  const flicker = isAnimated ? Math.sin(timeMs / TONGUE_PERIOD_MS) : STATIC_TONGUE_EXTENSION;
  if (flicker <= 0) {
    return;
  }
  const baseX = radius * 1.3;
  const length = radius * 0.9 * flicker;
  ctx.strokeStyle = COLOR_TONGUE;
  ctx.lineWidth = Math.max(2, radius * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, 0);
  ctx.lineTo(baseX + length, 0);
  ctx.moveTo(baseX + length, 0);
  ctx.lineTo(baseX + length + radius * 0.3, -radius * 0.25);
  ctx.moveTo(baseX + length, 0);
  ctx.lineTo(baseX + length + radius * 0.3, radius * 0.25);
  ctx.stroke();
}

function drawHeadShape(ctx: Ctx, radius: number, palette: SnakePalette): void {
  ctx.fillStyle = palette.outline;
  ctx.beginPath();
  ctx.ellipse(radius * 0.3, 0, radius * 1.25 + OUTLINE_WIDTH, radius * 1.05 + OUTLINE_WIDTH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.head;
  ctx.beginPath();
  ctx.ellipse(radius * 0.3, 0, radius * 1.25, radius * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOR_GLOSS;
  ctx.beginPath();
  ctx.ellipse(radius * 0.1, -radius * 0.35, radius * 0.6, radius * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAliveEye(ctx: Ctx, x: number, y: number, radius: number): void {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(x + radius * 0.08, y, radius * 0.17, 0, Math.PI * 2);
  ctx.fill();
}

function drawDeadEye(ctx: Ctx, x: number, y: number, radius: number): void {
  const reach = radius * 0.22;
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(2, radius * 0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - reach, y - reach);
  ctx.lineTo(x + reach, y + reach);
  ctx.moveTo(x + reach, y - reach);
  ctx.lineTo(x - reach, y + reach);
  ctx.stroke();
}

function drawEyes(ctx: Ctx, radius: number, isAlive: boolean): void {
  const eyeX = radius * 0.55;
  const eyeOffset = radius * 0.6;
  if (isAlive) {
    drawAliveEye(ctx, eyeX, -eyeOffset, radius);
    drawAliveEye(ctx, eyeX, eyeOffset, radius);
    return;
  }
  drawDeadEye(ctx, eyeX, -eyeOffset, radius);
  drawDeadEye(ctx, eyeX, eyeOffset, radius);
}

function drawNostrils(ctx: Ctx, radius: number, palette: SnakePalette): void {
  ctx.fillStyle = palette.outline;
  ctx.beginPath();
  ctx.arc(radius * 1.2, -radius * 0.28, radius * 0.07, 0, Math.PI * 2);
  ctx.arc(radius * 1.2, radius * 0.28, radius * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(ctx: Ctx, points: Point[], view: SceneView, baseRadius: number, palette: SnakePalette): void {
  const head = points[0];
  const neck = points[1];
  const angle = Math.atan2(head.y - neck.y, head.x - neck.x);
  const isAlive = view.state.status !== 'gameOver';
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(angle);
  if (isAlive) {
    drawTongue(ctx, baseRadius, view.timeMs, view.animated !== false);
  }
  drawHeadShape(ctx, baseRadius, palette);
  drawNostrils(ctx, baseRadius, palette);
  drawEyes(ctx, baseRadius, isAlive);
  ctx.restore();
}

export function drawSnake(ctx: Ctx, view: SceneView, cellSize: number): void {
  const points = computeVisualPoints(view, cellSize);
  const baseRadius = cellSize * BODY_RADIUS_RATIO;
  const palette = view.palette === undefined ? PLAYER_PALETTE : view.palette;
  const samples = sampleBody(points, baseRadius);
  fillSamples(ctx, samples, palette.outline, 1, OUTLINE_WIDTH);
  fillSamples(ctx, samples, palette.body, 1, 0);
  drawBodyPattern(ctx, samples, cellSize, palette);
  drawBodyGloss(ctx, samples);
  drawHead(ctx, points, view, baseRadius, palette);
}
