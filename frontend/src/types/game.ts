export type GameMode = 'pvp' | 'pvc';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ViewState = 'home' | 'setup' | 'game' | 'results';

export interface WordEntry {
  word: string;
  valid: boolean;
  length: number;
  points: number;
}

export interface GameState {
  id: string;
  main_word: string;
  player1_name: string;
  player2_name: string;
  current_player: number; // 1 or 2
  player1_words: WordEntry[];
  player2_words: WordEntry[];
  player1_score: number;
  player2_score: number;
  time_limit: number;
  status: 'active' | 'finished';
  round: number;
  mode: GameMode;
  difficulty?: Difficulty;
  created_at: string;
}

export interface WordSubmitResult {
  valid: boolean;
  reason: string;
  word?: string;
  length?: number;
  word_count?: number;
  base_points?: number;
  total_score?: number;
  points?: number;
}
