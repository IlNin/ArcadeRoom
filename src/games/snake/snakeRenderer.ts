import { drawFood } from './fruitRenderer';
import { drawSnake, type SceneView } from './snakeBodyRenderer';

type Ctx = CanvasRenderingContext2D;

const COLOR_GRASS_LIGHT = '#a8da6e';
const COLOR_GRASS_DARK = '#9bcf60';

function drawBoard(ctx: Ctx, cols: number, rows: number, cellSize: number): void {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isDark = (x + y) % 2 === 0;
      ctx.fillStyle = isDark ? COLOR_GRASS_DARK : COLOR_GRASS_LIGHT;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function drawFoodItem(ctx: Ctx, view: SceneView, cellSize: number): void {
  const food = view.state.food;
  if (food === null) {
    return;
  }
  const centerX = (food.x + 0.5) * cellSize;
  const centerY = (food.y + 0.5) * cellSize;
  drawFood(ctx, view.state.foodKind, centerX, centerY, cellSize, view.timeMs);
}

export function renderScene(ctx: Ctx, view: SceneView, cellSize: number): void {
  drawBoard(ctx, view.state.cols, view.state.rows, cellSize);
  drawFoodItem(ctx, view, cellSize);
  drawSnake(ctx, view, cellSize);
}
