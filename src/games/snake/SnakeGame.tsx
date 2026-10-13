import { useCallback, useEffect, useRef, useState } from 'react';
import { getDifficultyLabel } from '../../core/difficulty';
import type { GameProps } from '../../core/game';
import { Dpad } from './Dpad';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE, MAX_FRAME_DELTA_MS } from './snakeConfig';
import { ScoreHeader } from './ScoreHeader';
import { SNAKE_SETTINGS } from './snakeDifficulty';
import { createPlayerEngine, type SnakeEngine } from './snakeEngine';
import type { Direction } from './snakeLogic';
import { renderScene } from './snakeRenderer';
import { useSnakeControls } from './useSnakeControls';

export function SnakeGame({ context, config }: GameProps) {
  const difficulty = config.difficulty;
  const [engine] = useState<SnakeEngine>(() => createPlayerEngine(SNAKE_SETTINGS[difficulty], config.animations));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(context.getHighScore());
  const [status, setStatus] = useState(engine.status);
  const [paused, setPaused] = useState(false);

  const restart = useCallback(() => {
    engine.reset();
    setPaused(false);
    setScore(0);
    setStatus(engine.status);
  }, [engine]);

  const togglePause = useCallback(() => {
    if (!engine.isRunning) {
      return;
    }
    engine.paused = !engine.paused;
    setPaused(engine.paused);
  }, [engine]);

  const requestDirection = useCallback(
    (direction: Direction) => {
      engine.requestDirection(direction);
    },
    [engine],
  );

  useSnakeControls(requestDirection, togglePause);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_FRAME_DELTA_MS);
      lastTime = now;
      const wasRunning = engine.isRunning;
      engine.update(delta);
      setScore(engine.score);
      setStatus(engine.status);
      const hasJustFinished = wasRunning && !engine.isRunning;
      if (hasJustFinished) {
        context.submitScore(engine.score);
        setHighScore(context.getHighScore());
      }
      renderScene(ctx, engine.getView(now), CELL_SIZE);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [engine, context]);

  const isOver = status !== 'running';
  const overlayText = status === 'won' ? 'Hai vinto!' : 'Game over';

  return (
    <div className="snake">
      <div className="board-side">
        <ScoreHeader
          name="Punti"
          score={score}
          meta={`Record ${getDifficultyLabel(difficulty)}: ${Math.max(highScore, score)}`}
        />
        <div className="snake__board">
          <canvas ref={canvasRef} width={BOARD_COLS * CELL_SIZE} height={BOARD_ROWS * CELL_SIZE} />
          {isOver && (
            <div className="overlay">
              <p>{overlayText}</p>
              <button onClick={restart}>Rigioca</button>
            </div>
          )}
          {paused && !isOver && (
            <div className="overlay">
              <p>Pausa</p>
              <button onClick={togglePause}>Riprendi</button>
            </div>
          )}
        </div>
      </div>
      <p className="hint">Frecce o WASD per muoverti · Spazio per la pausa</p>
      <Dpad onDirection={requestDirection} />
    </div>
  );
}
