import {
  changeDirection,
  getNextHead,
  isNextStepFatal,
  type Direction,
  type Point,
  type SnakeState,
} from './snakeLogic';

export const ALL_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

function isSafeDirection(state: SnakeState, direction: Direction): boolean {
  const turned = changeDirection(state, direction);
  const isAccepted = turned.nextDirection === direction;
  if (!isAccepted) {
    return false;
  }
  const isFatal = isNextStepFatal(turned);
  return !isFatal;
}

export function distanceToFood(state: SnakeState, direction: Direction): number {
  const food = state.food;
  if (food === null) {
    return 0;
  }
  const turned = changeDirection(state, direction);
  const head: Point = getNextHead(turned);
  const distance = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
  return distance;
}

export function listSafeDirections(state: SnakeState): Direction[] {
  const others = ALL_DIRECTIONS.filter((direction) => direction !== state.direction);
  const ordered = [state.direction, ...others];
  const safe = ordered.filter((direction) => isSafeDirection(state, direction));
  return safe;
}

export function pickClosestToFood(state: SnakeState, candidates: Direction[]): Direction {
  let best = candidates[0];
  let bestDistance = distanceToFood(state, best);
  for (const candidate of candidates) {
    const distance = distanceToFood(state, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function chooseAutoDirection(state: SnakeState): Direction {
  const candidates = listSafeDirections(state);
  if (candidates.length === 0) {
    return state.direction;
  }
  const best = pickClosestToFood(state, candidates);
  return best;
}
