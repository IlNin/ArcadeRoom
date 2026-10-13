import type { Difficulty } from '../../core/difficulty';
import {
  ALL_DIRECTIONS,
  listSafeDirections,
  pickClosestToFood,
} from './snakeAutoPilot';
import { changeDirection, getNextHead, type Direction, type Point, type RandomFn, type SnakeState } from './snakeLogic';

export type CpuStrategy = 'greedy' | 'safeGreedy' | 'pathfinding';

export interface CpuProfile {
  blunderChance: number;
  randomMoveChance: number;
  strategy: CpuStrategy;
}

export const CPU_PROFILES: Record<Difficulty, CpuProfile> = {
  easy: { blunderChance: 0.04, randomMoveChance: 0.25, strategy: 'greedy' },
  normal: { blunderChance: 0.01, randomMoveChance: 0.1, strategy: 'safeGreedy' },
  hard: { blunderChance: 0, randomMoveChance: 0, strategy: 'pathfinding' },
};

function buildKey(point: Point): string {
  const key = `${point.x},${point.y}`;
  return key;
}

function isInsideBoard(point: Point, state: SnakeState): boolean {
  const isInsideHorizontally = point.x >= 0 && point.x < state.cols;
  const isInsideVertically = point.y >= 0 && point.y < state.rows;
  const isInside = isInsideHorizontally && isInsideVertically;
  return isInside;
}

function listNeighbors(point: Point): Point[] {
  const neighbors: Point[] = [
    { x: point.x, y: point.y - 1 },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
    { x: point.x + 1, y: point.y },
  ];
  return neighbors;
}

function isFoodAt(state: SnakeState, point: Point): boolean {
  const food = state.food;
  if (food === null) {
    return false;
  }
  const isFood = food.x === point.x && food.y === point.y;
  return isFood;
}

function simulateSnakeAfterMove(state: SnakeState, direction: Direction): Point[] {
  const turned = changeDirection(state, direction);
  const newHead = getNextHead(turned);
  const willEat = isFoodAt(state, newHead);
  const grown = [newHead, ...state.snake];
  const moved = willEat ? grown : grown.slice(0, -1);
  return moved;
}

function countReachableCells(state: SnakeState, snake: Point[], limit: number): number {
  const blocked = new Set<string>(snake.map(buildKey));
  const visited = new Set<string>([buildKey(snake[0])]);
  const queue: Point[] = [snake[0]];
  let reachable = 0;
  while (queue.length > 0 && reachable < limit) {
    const current = queue.shift() as Point;
    for (const neighbor of listNeighbors(current)) {
      const key = buildKey(neighbor);
      const isUsable = isInsideBoard(neighbor, state) && !blocked.has(key) && !visited.has(key);
      if (!isUsable) {
        continue;
      }
      visited.add(key);
      queue.push(neighbor);
      reachable++;
    }
  }
  return reachable;
}

function measureRoomAfterMove(state: SnakeState, direction: Direction): number {
  const snakeAfter = simulateSnakeAfterMove(state, direction);
  const room = countReachableCells(state, snakeAfter, state.cols * state.rows);
  return room;
}

function hasEnoughRoom(state: SnakeState, direction: Direction): boolean {
  const snakeAfter = simulateSnakeAfterMove(state, direction);
  const room = countReachableCells(state, snakeAfter, snakeAfter.length);
  const hasRoom = room >= snakeAfter.length;
  return hasRoom;
}

function pickMostRoomy(state: SnakeState, candidates: Direction[]): Direction {
  let best = candidates[0];
  let bestRoom = measureRoomAfterMove(state, best);
  for (const candidate of candidates) {
    const room = measureRoomAfterMove(state, candidate);
    if (room > bestRoom) {
      best = candidate;
      bestRoom = room;
    }
  }
  return best;
}

function chooseGreedy(state: SnakeState, safe: Direction[]): Direction {
  const direction = pickClosestToFood(state, safe);
  return direction;
}

function chooseSafeGreedy(state: SnakeState, safe: Direction[]): Direction {
  const roomy = safe.filter((direction) => hasEnoughRoom(state, direction));
  if (roomy.length === 0) {
    return pickMostRoomy(state, safe);
  }
  const direction = pickClosestToFood(state, roomy);
  return direction;
}

function findFirstStepToFood(state: SnakeState): Direction | null {
  if (state.food === null) {
    return null;
  }
  const bodyWithoutTail = state.snake.slice(0, -1);
  const blocked = new Set<string>(bodyWithoutTail.map(buildKey));
  const visited = new Set<string>([buildKey(state.snake[0])]);
  const queue: { point: Point; firstStep: Direction | null }[] = [{ point: state.snake[0], firstStep: null }];
  while (queue.length > 0) {
    const current = queue.shift() as { point: Point; firstStep: Direction | null };
    for (const direction of ALL_DIRECTIONS) {
      const neighbor = getNeighborInDirection(current.point, direction);
      const key = buildKey(neighbor);
      const isUsable = isInsideBoard(neighbor, state) && !blocked.has(key) && !visited.has(key);
      if (!isUsable) {
        continue;
      }
      const firstStep = current.firstStep === null ? direction : current.firstStep;
      if (isFoodAt(state, neighbor)) {
        return firstStep;
      }
      visited.add(key);
      queue.push({ point: neighbor, firstStep });
    }
  }
  return null;
}

function getNeighborInDirection(point: Point, direction: Direction): Point {
  const index = ALL_DIRECTIONS.indexOf(direction);
  const neighbor = listNeighbors(point)[index];
  return neighbor;
}

function choosePathfinding(state: SnakeState, safe: Direction[]): Direction {
  const pathStep = findFirstStepToFood(state);
  const isPathStepUsable = pathStep !== null && safe.includes(pathStep);
  if (isPathStepUsable && hasEnoughRoom(state, pathStep)) {
    return pathStep;
  }
  const fallback = chooseSafeGreedy(state, safe);
  return fallback;
}

function pickRandom(directions: Direction[], random: RandomFn): Direction {
  const index = Math.floor(random() * directions.length);
  const direction = directions[index];
  return direction;
}

function applyStrategy(strategy: CpuStrategy, state: SnakeState, safe: Direction[]): Direction {
  if (strategy === 'greedy') {
    return chooseGreedy(state, safe);
  }
  if (strategy === 'safeGreedy') {
    return chooseSafeGreedy(state, safe);
  }
  return choosePathfinding(state, safe);
}

export function chooseCpuDirection(state: SnakeState, profile: CpuProfile, random: RandomFn): Direction {
  const isBlunder = random() < profile.blunderChance;
  if (isBlunder) {
    return pickRandom(ALL_DIRECTIONS, random);
  }
  const safe = listSafeDirections(state);
  if (safe.length === 0) {
    return state.direction;
  }
  const isRandomMove = random() < profile.randomMoveChance;
  if (isRandomMove) {
    return pickRandom(safe, random);
  }
  const direction = applyStrategy(profile.strategy, state, safe);
  return direction;
}
