
export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserStats {
  totalGamesPlayed: number;
  lifetimeCorrectAnswers: number;
  currentStreak: number;
  highestScore: number;
  highestRound: number;
  gradeLevel: number; // New field: 1-12
  gamesHistory: { date: string; score: number }[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
  rounds: number;
}

export enum GameState {
  MENU = 'MENU',
  INTRO_FRUIT = 'INTRO_FRUIT',
  PLAYING = 'PLAYING',
  FEEDBACK_CORRECT = 'FEEDBACK_CORRECT',
  FEEDBACK_WRONG = 'FEEDBACK_WRONG',
  REWARD = 'REWARD',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export enum WeaponType {
  BASIC_KATANA = 'Basic Katana',
  GOLD_SWORD = 'Gold Sword',
  DIAMOND_SWORD = 'Diamond Sword',
}
