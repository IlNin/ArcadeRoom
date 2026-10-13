import type { GameInfo } from '../core/game';

export const upcomingGames: GameInfo[] = [
  { id: 'tetris', title: 'Tetris', description: 'Incastra i blocchi e completa le righe.', icon: '🧱', accent: '#4fd8ff' },
  { id: 'solitaire', title: 'Solitario', description: 'Il classico gioco di carte, in solitaria.', icon: '🃏', accent: '#ffd24f' },
  { id: 'scopa', title: 'Scopa', description: 'Sfida il computer al gioco di carte italiano.', icon: '🎴', accent: '#ff8a4f' },
  { id: 'battleship', title: 'Battaglia navale', description: 'Affonda la flotta nemica prima che affondi la tua.', icon: '🚢', accent: '#6f8bff' },
];
