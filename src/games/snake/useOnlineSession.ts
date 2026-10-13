import { useEffect, useRef } from 'react';
import type { OnlineMatch } from '../../core/gameMode';
import { leaveMatch, registerDisconnectFlag, watchOpponent } from '../../online/matchService';

export function useOnlineSession(
  online: OnlineMatch,
  onOpponentData: (raw: unknown) => void,
  onOpponentError: (error: Error) => void,
): void {
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    registerDisconnectFlag(online);
    const unsubscribe = watchOpponent(online, onOpponentData, onOpponentError);
    return () => {
      unsubscribe();
      leaveTimer.current = window.setTimeout(() => leaveMatch(online), 0);
    };
  }, [online, onOpponentData, onOpponentError]);
}
