import { useCallback, useEffect, useState } from 'react';
import { ensureSignedIn } from './firebaseClient';

export type ConnectionStatus = 'connecting' | 'ready' | 'error';

export interface OnlineConnection {
  status: ConnectionStatus;
  uid: string;
  retry(): void;
}

export function useOnlineConnection(): OnlineConnection {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [uid, setUid] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setStatus('connecting');
    ensureSignedIn()
      .then((signedUid) => {
        if (isCancelled) {
          return;
        }
        setUid(signedUid);
        setStatus('ready');
      })
      .catch(() => {
        if (!isCancelled) {
          setStatus('error');
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const connection: OnlineConnection = { status, uid, retry };
  return connection;
}
