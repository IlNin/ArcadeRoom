import type { FoodKind } from './snakeLogic';

type FillStyle = string | CanvasGradient;
type Ctx = CanvasRenderingContext2D;
type FruitPainter = (ctx: Ctx, x: number, y: number, size: number) => void;

const LEAF_GREEN = '#3c9a3a';
const STEM_BROWN = '#6b4423';
const BOB_PERIOD_MS = 300;
const BOB_AMPLITUDE = 0.03;

function fillCircle(ctx: Ctx, x: number, y: number, radius: number, style: FillStyle): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function fillEllipse(ctx: Ctx, x: number, y: number, radiusX: number, radiusY: number, rotation: number, style: FillStyle): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function createBallGradient(ctx: Ctx, x: number, y: number, radius: number, light: string, dark: string): CanvasGradient {
  const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, radius * 0.1, x, y, radius * 1.1);
  gradient.addColorStop(0, light);
  gradient.addColorStop(1, dark);
  return gradient;
}

function drawGloss(ctx: Ctx, x: number, y: number, radius: number): void {
  fillEllipse(ctx, x - radius * 0.35, y - radius * 0.4, radius * 0.28, radius * 0.16, -0.7, 'rgba(255,255,255,0.55)');
}

function drawLeaf(ctx: Ctx, x: number, y: number, length: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = LEAF_GREEN;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.5, -length * 0.45, length, 0);
  ctx.quadraticCurveTo(length * 0.5, length * 0.45, 0, 0);
  ctx.fill();
  ctx.restore();
}

function strokeCurve(ctx: Ctx, from: number[], control: number[], to: number[], color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.quadraticCurveTo(control[0], control[1], to[0], to[1]);
  ctx.stroke();
}

function drawStem(ctx: Ctx, fromX: number, fromY: number, toX: number, toY: number, width: number): void {
  const controlX = (fromX + toX) / 2 + width * 2;
  const controlY = (fromY + toY) / 2;
  strokeCurve(ctx, [fromX, fromY], [controlX, controlY], [toX, toY], STEM_BROWN, width);
}

function drawShadow(ctx: Ctx, x: number, y: number, radius: number): void {
  fillEllipse(ctx, x, y, radius, radius * 0.35, 0, 'rgba(0,0,0,0.22)');
}

function drawApple(ctx: Ctx, x: number, y: number, size: number): void {
  const radius = size * 0.34;
  const bodyY = y + size * 0.04;
  const gradient = createBallGradient(ctx, x, bodyY, radius, '#ff7a7a', '#b3101c');
  fillEllipse(ctx, x - radius * 0.35, bodyY, radius * 0.72, radius * 0.95, 0, gradient);
  fillEllipse(ctx, x + radius * 0.35, bodyY, radius * 0.72, radius * 0.95, 0, gradient);
  drawGloss(ctx, x, bodyY, radius);
  drawStem(ctx, x, bodyY - radius * 0.8, x + size * 0.04, y - size * 0.4, size * 0.04);
  drawLeaf(ctx, x + size * 0.03, y - size * 0.3, size * 0.22, -0.5);
}

function drawCherry(ctx: Ctx, x: number, y: number, size: number): void {
  const radius = size * 0.17;
  const jointX = x + size * 0.02;
  const jointY = y - size * 0.32;
  const leftX = x - size * 0.15;
  const leftY = y + size * 0.17;
  const rightX = x + size * 0.15;
  const rightY = y + size * 0.22;
  drawStem(ctx, jointX, jointY, leftX, leftY - radius, size * 0.03);
  drawStem(ctx, jointX, jointY, rightX, rightY - radius, size * 0.03);
  drawLeaf(ctx, jointX, jointY, size * 0.22, -0.2);
  fillCircle(ctx, leftX, leftY, radius, createBallGradient(ctx, leftX, leftY, radius, '#ff5a6e', '#9c0a1f'));
  fillCircle(ctx, rightX, rightY, radius, createBallGradient(ctx, rightX, rightY, radius, '#ff5a6e', '#9c0a1f'));
  drawGloss(ctx, leftX, leftY, radius);
  drawGloss(ctx, rightX, rightY, radius);
}

function drawOrange(ctx: Ctx, x: number, y: number, size: number): void {
  const radius = size * 0.36;
  fillCircle(ctx, x, y, radius, createBallGradient(ctx, x, y, radius, '#ffbe55', '#e56b00'));
  const dimples = [[-0.15, -0.1], [0.12, -0.15], [0.05, 0.1], [-0.2, 0.15], [0.2, 0.08], [-0.02, -0.22]];
  dimples.forEach((offset) => {
    fillCircle(ctx, x + offset[0] * size, y + offset[1] * size, size * 0.016, 'rgba(160,60,0,0.35)');
  });
  drawGloss(ctx, x, y, radius);
  drawLeaf(ctx, x, y - radius * 0.92, size * 0.2, -0.9);
}

function drawBanana(ctx: Ctx, x: number, y: number, size: number): void {
  const start = [x - size * 0.32, y - size * 0.12];
  const control = [x, y + size * 0.3];
  const end = [x + size * 0.32, y - size * 0.2];
  strokeCurve(ctx, start, control, end, '#a67c00', size * 0.25);
  strokeCurve(ctx, start, control, end, '#f9d948', size * 0.19);
  const glossStart = [x - size * 0.27, y - size * 0.15];
  const glossControl = [x, y + size * 0.22];
  const glossEnd = [x + size * 0.27, y - size * 0.23];
  strokeCurve(ctx, glossStart, glossControl, glossEnd, 'rgba(255,255,255,0.5)', size * 0.035);
  fillCircle(ctx, start[0] - size * 0.01, start[1] - size * 0.01, size * 0.03, STEM_BROWN);
  fillCircle(ctx, end[0] + size * 0.01, end[1] - size * 0.01, size * 0.03, '#4a3018');
}

function drawStrawberry(ctx: Ctx, x: number, y: number, size: number): void {
  const radius = size * 0.38;
  ctx.fillStyle = createBallGradient(ctx, x, y, radius, '#ff6a6a', '#c4122b');
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.38);
  ctx.bezierCurveTo(x - size * 0.42, y + size * 0.1, x - size * 0.34, y - size * 0.28, x, y - size * 0.22);
  ctx.bezierCurveTo(x + size * 0.34, y - size * 0.28, x + size * 0.42, y + size * 0.1, x, y + size * 0.38);
  ctx.fill();
  const seeds = [[-0.12, -0.08], [0.1, -0.1], [0, 0], [-0.16, 0.08], [0.14, 0.07], [-0.05, 0.16], [0.06, 0.2]];
  seeds.forEach((offset) => {
    fillEllipse(ctx, x + offset[0] * size, y + offset[1] * size, size * 0.018, size * 0.028, 0, '#ffe89a');
  });
  const calyxY = y - size * 0.2;
  drawLeaf(ctx, x, calyxY, size * 0.2, -2.5);
  drawLeaf(ctx, x, calyxY, size * 0.2, -0.65);
  drawLeaf(ctx, x, calyxY, size * 0.22, -1.57);
}

function drawGrapes(ctx: Ctx, x: number, y: number, size: number): void {
  const radius = size * 0.125;
  const positions = [[-0.19, -0.13], [0, -0.15], [0.19, -0.13], [-0.1, 0.03], [0.1, 0.03], [0, 0.2]];
  drawStem(ctx, x, y - size * 0.25, x + size * 0.04, y - size * 0.4, size * 0.035);
  drawLeaf(ctx, x + size * 0.03, y - size * 0.33, size * 0.22, -0.4);
  positions.forEach((offset) => {
    const grapeX = x + offset[0] * size;
    const grapeY = y + offset[1] * size;
    fillCircle(ctx, grapeX, grapeY, radius, createBallGradient(ctx, grapeX, grapeY, radius, '#c58cf0', '#5a1f8f'));
    drawGloss(ctx, grapeX, grapeY, radius);
  });
}

const PAINTERS: Record<FoodKind, FruitPainter> = {
  apple: drawApple,
  cherry: drawCherry,
  orange: drawOrange,
  banana: drawBanana,
  strawberry: drawStrawberry,
  grapes: drawGrapes,
};

export function drawFood(ctx: Ctx, kind: FoodKind, centerX: number, centerY: number, cellSize: number, timeMs: number): void {
  const bob = Math.sin(timeMs / BOB_PERIOD_MS) * cellSize * BOB_AMPLITUDE;
  const painter = PAINTERS[kind];
  drawShadow(ctx, centerX, centerY + cellSize * 0.34, cellSize * 0.3);
  painter(ctx, centerX, centerY + bob, cellSize);
}
