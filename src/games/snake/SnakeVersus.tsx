import { useCallback, useEffect, useRef, useState } from 'react';
import { getDifficultyLabel } from '../../core/difficulty';
import type { GameProps } from '../../core/game';
import { BoardOverlay } from './BoardOverlay';
import { CPU_PROFILES } from './cpuPlayer';
import { Dpad } from './Dpad';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE, MAX_FRAME_DELTA_MS } from './snakeConfig';
import { ScoreHeader } from './ScoreHeader';
import { SNAKE_SETTINGS } from './snakeDifficulty';
import { createCpuEngine, createPlayerEngine, type SnakeEngine } from './snakeEngine';
import type { Direction } from './snakeLogic';
import { renderScene } from './snakeRenderer';
import { useSnakeControls } from './useSnakeControls';
import { describeVersusProgress, isVersusFinished, resolveVersusResult } from './versusResult';

export function SnakeVersus({ context, config }: GameProps) {
  const settings = SNAKE_SETTINGS[config.difficulty];
  const profile = CPU_PROFILES[config.opponent];
  const [playerEngine] = useState<SnakeEngine>(() => createPlayerEngine(settings, config.animations));
  const [cpuEngine] = useState<SnakeEngine>(() => createCpuEngine(settings, profile, config.animations));
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [playerStatus, setPlayerStatus] = useState(playerEngine.status);
  const [cpuStatus, setCpuStatus] = useState(cpuEngine.status);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(context.getHighScore());

  const progress = {
    playerRunning: playerStatus === 'running',
    cpuRunning: cpuStatus === 'running',
    playerScore,
    cpuScore,
  };
  const isFinished = isVersusFinished(progress);
  const result = isFinished ? resolveVersusResult(playerScore, cpuScore) : null;
  const message = describeVersusProgress(progress);

  const restart = useCallback(() => {
    playerEngine.reset();
    cpuEngine.reset();
    setPaused(false);
    setPlayerScore(0);
    setCpuScore(0);
    setPlayerStatus(playerEngine.status);
    setCpuStatus(cpuEngine.status);
  }, [playerEngine, cpuEngine]);

  const togglePause = useCallback(() => {
    const isAnyoneRunning = playerEngine.isRunning || cpuEngine.isRunning;
    if (!isAnyoneRunning) {
      return;
    }
    const nextPaused = !playerEngine.paused;
    playerEngine.paused = nextPaused;
    cpuEngine.paused = nextPaused;
    setPaused(nextPaused);
  }, [playerEngine, cpuEngine]);

  const requestDirection = useCallback(
    (direction: Direction) => {
      playerEngine.requestDirection(direction);
    },
    [playerEngine],
  );

  useSnakeControls(requestDirection, togglePause);

  useEffect(() => {
    const playerCtx = playerCanvasRef.current?.getContext('2d');
    const cpuCtx = cpuCanvasRef.current?.getContext('2d');
    if (!playerCtx || !cpuCtx) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_FRAME_DELTA_MS);
      lastTime = now;
      const playerWasRunning = playerEngine.isRunning;
      cpuEngine.turbo = !playerEngine.isRunning;
      playerEngine.update(delta);
      cpuEngine.update(delta);
      setPlayerScore(playerEngine.score);
      setCpuScore(cpuEngine.score);
      setPlayerStatus(playerEngine.status);
      setCpuStatus(cpuEngine.status);
      const playerHasJustFinished = playerWasRunning && !playerEngine.isRunning;
      if (playerHasJustFinished) {
        context.submitScore(playerEngine.score);
        setHighScore(context.getHighScore());
      }
      renderScene(playerCtx, playerEngine.getView(now), CELL_SIZE);
      renderScene(cpuCtx, cpuEngine.getView(now), CELL_SIZE);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [playerEngine, cpuEngine, context]);

  const statusClassName = result === null ? 'versus__status' : `versus__status versus__status--${result}`;
  const canvasWidth = BOARD_COLS * CELL_SIZE;
  const canvasHeight = BOARD_ROWS * CELL_SIZE;

  return (
    <div className="versus">
      <div className={statusClassName} role="status" aria-live="polite">
        <span>{message}</span>
        {result !== null && <button onClick={restart}>Rigioca</button>}
      </div>
      <div className="versus__boards">
        <section className="board-side" aria-label="Griglia del giocatore">
          <ScoreHeader
            name="Tu"
            score={playerScore}
            meta={`Record ${getDifficultyLabel(config.difficulty)}: ${Math.max(highScore, playerScore)}`}
          />
          <div className="snake__board">
            <canvas ref={playerCanvasRef} width={canvasWidth} height={canvasHeight} />
            <BoardOverlay status={playerStatus} paused={paused} onResume={togglePause} />
          </div>
        </section>
        <section className="board-side" aria-label="Griglia della CPU">
          <ScoreHeader
            name="CPU"
            score={cpuScore}
            meta={`Avversario ${getDifficultyLabel(config.opponent)}`}
            variant="cpu"
          />
          <div className="snake__board">
            <canvas ref={cpuCanvasRef} width={canvasWidth} height={canvasHeight} />
            <BoardOverlay status={cpuStatus} paused={paused} />
          </div>
        </section>
      </div>
      <p className="hint">Frecce o WASD per muoverti · Spazio per la pausa · Vince chi fa più punti</p>
      <Dpad onDirection={requestDirection} />
    </div>
  );
}
