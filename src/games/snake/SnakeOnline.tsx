import { useCallback, useEffect, useRef, useState } from 'react';
import { getDifficultyLabel } from '../../core/difficulty';
import type { GameProps } from '../../core/game';
import type { OnlineMatch } from '../../core/gameMode';
import { publishSnapshot } from '../../online/matchService';
import { BoardOverlay } from './BoardOverlay';
import { Dpad } from './Dpad';
import { OPPONENT_SILENCE_TIMEOUT_MS, OpponentTracker } from './opponentTracker';
import {
  describeOnlineProgress,
  isOnlineFinished,
  resolveOnlineResult,
  type ForfeitState,
  type OnlineProgress,
} from './onlineResult';
import { ScoreHeader } from './ScoreHeader';
import { BOARD_COLS, BOARD_ROWS, CELL_SIZE, MAX_FRAME_DELTA_MS } from './snakeConfig';
import { SNAKE_SETTINGS } from './snakeDifficulty';
import { createPlayerEngine, type SnakeEngine } from './snakeEngine';
import type { Direction, SnakeState } from './snakeLogic';
import { renderScene } from './snakeRenderer';
import { decodeSnapshot, encodeSnapshot } from './snakeSnapshot';
import { useOnlineSession } from './useOnlineSession';
import { useSnakeControls } from './useSnakeControls';

const COUNTDOWN_MS = 3000;
const WATCHDOG_INTERVAL_MS = 1000;

function ignorePause(): void {
  return;
}

interface OnlineBoardProps extends GameProps {
  online: OnlineMatch;
}

function CountdownOverlay({ seconds }: { seconds: number }) {
  if (seconds <= 0) {
    return null;
  }
  return (
    <div className="overlay">
      <p>{seconds}</p>
    </div>
  );
}

function OnlineBoard({ context, config, online }: OnlineBoardProps) {
  const settings = SNAKE_SETTINGS[config.difficulty];
  const [engine] = useState<SnakeEngine>(() => createPlayerEngine(settings, config.animations));
  const [tracker] = useState<OpponentTracker>(() => new OpponentTracker(performance.now()));
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const opponentCanvasRef = useRef<HTMLCanvasElement>(null);
  const forfeitRef = useRef<ForfeitState>('none');
  const lastPublishedRef = useRef<SnakeState | null>(null);
  const startAtRef = useRef(performance.now() + COUNTDOWN_MS);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerStatus, setPlayerStatus] = useState(engine.status);
  const [opponentRunning, setOpponentRunning] = useState(true);
  const [opponentStatus, setOpponentStatus] = useState(engine.status);
  const [forfeit, setForfeit] = useState<ForfeitState>('none');
  const [countdown, setCountdown] = useState(Math.ceil(COUNTDOWN_MS / 1000));

  const publishIfChanged = useCallback(() => {
    const state = engine.state;
    const last = lastPublishedRef.current;
    const hasChanged = last === null || last.snake !== state.snake || last.status !== state.status;
    if (!hasChanged) {
      return;
    }
    lastPublishedRef.current = state;
    const claimsOpponentForfeit = forfeitRef.current === 'opponent';
    publishSnapshot(online, encodeSnapshot(state, claimsOpponentForfeit));
  }, [engine, online]);

  const declareForfeit = useCallback(
    (next: ForfeitState) => {
      if (forfeitRef.current !== 'none') {
        return;
      }
      forfeitRef.current = next;
      setForfeit(next);
      lastPublishedRef.current = null;
      publishIfChanged();
    },
    [publishIfChanged],
  );

  const handleOpponentData = useCallback(
    (raw: unknown) => {
      const snapshot = decodeSnapshot(raw);
      tracker.receive(snapshot, performance.now());
      const isForfeitClaimedAgainstMe = tracker.claimsForfeit && engine.isRunning;
      if (isForfeitClaimedAgainstMe) {
        declareForfeit('me');
      }
    },
    [tracker, engine, declareForfeit],
  );

  const handleOpponentError = useCallback(() => {
    tracker.receive(null, performance.now());
  }, [tracker]);

  useOnlineSession(online, handleOpponentData, handleOpponentError);

  const requestDirection = useCallback(
    (direction: Direction) => {
      engine.requestDirection(direction);
    },
    [engine],
  );

  useSnakeControls(requestDirection, ignorePause);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const isStillPlaying = forfeitRef.current === 'none';
      const isDropped = tracker.isDropped(performance.now(), OPPONENT_SILENCE_TIMEOUT_MS);
      if (isStillPlaying && isDropped) {
        declareForfeit('opponent');
      }
    }, WATCHDOG_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [tracker, declareForfeit]);

  useEffect(() => {
    const playerCtx = playerCanvasRef.current?.getContext('2d');
    const opponentCtx = opponentCanvasRef.current?.getContext('2d');
    if (!playerCtx || !opponentCtx) {
      return;
    }
    let frameId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const delta = Math.min(now - lastTime, MAX_FRAME_DELTA_MS);
      lastTime = now;
      const remaining = startAtRef.current - now;
      const isCounting = remaining > 0;
      engine.paused = isCounting || forfeitRef.current !== 'none';
      engine.update(delta);
      publishIfChanged();
      setCountdown(isCounting ? Math.ceil(remaining / 1000) : 0);
      setPlayerScore(engine.score);
      setPlayerStatus(engine.status);
      setOpponentScore(tracker.snapshot === null ? 0 : tracker.snapshot.score);
      setOpponentRunning(tracker.isRunning);
      setOpponentStatus(tracker.snapshot === null ? 'running' : tracker.snapshot.status);
      renderScene(playerCtx, engine.getView(now), CELL_SIZE);
      renderScene(opponentCtx, tracker.getView(now, settings, config.animations), CELL_SIZE);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [engine, tracker, settings, config.animations, publishIfChanged]);

  const progress: OnlineProgress = {
    playerRunning: playerStatus === 'running',
    opponentRunning,
    playerScore,
    opponentScore,
    forfeit,
    opponentName: online.opponentName,
  };
  const isFinished = isOnlineFinished(progress);
  const result = isFinished ? resolveOnlineResult(progress) : null;
  const message = describeOnlineProgress(progress);
  const statusClassName = result === null ? 'versus__status' : `versus__status versus__status--${result}`;
  const canvasWidth = BOARD_COLS * CELL_SIZE;
  const canvasHeight = BOARD_ROWS * CELL_SIZE;

  return (
    <div className="versus">
      <div className={statusClassName} role="status" aria-live="polite">
        <span>{message}</span>
        {isFinished && <button onClick={context.exitToMenu}>Torna al menu</button>}
      </div>
      <div className="versus__boards">
        <section className="board-side" aria-label="La tua griglia">
          <ScoreHeader name={online.playerName} score={playerScore} meta={`Online · ${getDifficultyLabel(config.difficulty)}`} />
          <div className="snake__board">
            <canvas ref={playerCanvasRef} width={canvasWidth} height={canvasHeight} />
            <BoardOverlay status={playerStatus} paused={false} />
            <CountdownOverlay seconds={countdown} />
          </div>
        </section>
        <section className="board-side" aria-label="Griglia dell'avversario">
          <ScoreHeader name={online.opponentName} score={opponentScore} meta="Avversario" variant="cpu" />
          <div className="snake__board">
            <canvas ref={opponentCanvasRef} width={canvasWidth} height={canvasHeight} />
            <BoardOverlay status={opponentStatus} paused={false} />
          </div>
        </section>
      </div>
      <p className="hint">Frecce o WASD per muoverti · Niente pausa online · Vince chi fa più punti</p>
      <Dpad onDirection={requestDirection} />
    </div>
  );
}

export function SnakeOnline(props: GameProps) {
  const online = props.config.online;
  if (online === undefined) {
    return <p className="hint">Partita online non valida: torna alla scelta della modalità.</p>;
  }
  return <OnlineBoard {...props} online={online} />;
}

export default SnakeOnline;
