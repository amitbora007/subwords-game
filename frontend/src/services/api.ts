import axios from 'axios';
import { GameState, GameMode, Difficulty, WordSubmitResult } from '../types/game';

const getBaseURL = (): string => {
  const raw = import.meta.env.VITE_BACKEND_URL;
  if (!raw || !raw.trim()) return '/api';
  let formatted = raw.trim().replace(/\/+$/, '');

  // Handle Render internal service names (e.g., "subwords-backend" or "https://subwords-backend")
  const hostOnly = formatted.replace(/^https?:\/\//, '').split('/')[0];
  if (!hostOnly.includes('.') && !hostOnly.includes('localhost') && !hostOnly.startsWith('/')) {
    formatted = `https://${hostOnly}.onrender.com`;
  } else if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
    formatted = `https://${formatted}`;
  }

  formatted = formatted.replace(/\/+$/, '');
  return formatted.endsWith('/api') ? formatted : `${formatted}/api`;
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const gameApi = {
  // Check API health
  checkHealth: async () => {
    const res = await api.get('/');
    return res.data;
  },

  // Create new game session
  createGame: async (params: {
    player1_name: string;
    player2_name: string;
    mode: GameMode;
    difficulty?: Difficulty;
    time_limit?: number;
  }): Promise<GameState> => {
    const res = await api.post<GameState>('/game/create', params);
    return res.data;
  },

  // Fetch game by ID
  getGame: async (gameId: string): Promise<GameState> => {
    const res = await api.get<GameState>(`/game/${gameId}`);
    return res.data;
  },

  // Submit subword
  submitWord: async (gameId: string, word: string, player: number): Promise<WordSubmitResult> => {
    const res = await api.post<WordSubmitResult>('/game/submit-word', {
      game_id: gameId,
      word,
      player,
    });
    return res.data;
  },

  // Switch turn
  switchTurn: async (gameId: string): Promise<{ success: boolean; next_player: number; round: number; status: string }> => {
    const res = await api.post('/game/switch-turn', { game_id: gameId });
    return res.data;
  },

  // Trigger computer AI turn
  computerTurn: async (gameId: string, difficulty: Difficulty = 'medium'): Promise<{
    words: Array<{ word: string; valid: boolean; length: number; points: number }>;
    word_count: number;
    base_points: number;
    total_score: number;
  }> => {
    const res = await api.post('/game/computer-turn', {
      game_id: gameId,
      difficulty,
    });
    return res.data;
  },

  // Standalone word validation
  validateWord: async (word: string, mainWord: string): Promise<{ valid: boolean; reason: string }> => {
    const res = await api.post('/validate-word', {
      word,
      main_word: mainWord,
    });
    return res.data;
  },
};

export default api;
