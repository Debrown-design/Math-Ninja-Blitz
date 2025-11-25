
import { UserStats } from "../types";

const STATS_KEY = 'math_ninja_stats';
const LIVES_TIMESTAMP_KEY = 'math_ninja_lives_timestamp';
const REMAINING_LIVES_KEY = 'math_ninja_lives_count';

const REGEN_TIME_MS = 2 * 60 * 1000; // 2 minutes per life

const DEFAULT_STATS: UserStats = {
  totalGamesPlayed: 0,
  lifetimeCorrectAnswers: 0,
  currentStreak: 0,
  highestScore: 0,
  highestRound: 0,
  gradeLevel: 1, // Default to Grade 1
  gamesHistory: [
    { date: '2023-10-20', score: 120 },
    { date: '2023-10-21', score: 240 },
    { date: '2023-10-22', score: 180 },
    { date: '2023-10-23', score: 350 },
    { date: '2023-10-24', score: 90 },
  ]
};

export const getStats = (): UserStats => {
  const stored = localStorage.getItem(STATS_KEY);
  // Merge with default stats to ensure new fields exist
  return stored ? { ...DEFAULT_STATS, ...JSON.parse(stored) } : DEFAULT_STATS;
};

export const saveStats = (newStats: Partial<UserStats>) => {
  const current = getStats();
  const updated = { ...current, ...newStats };
  localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
};

export const updateGameHistory = (score: number, correctAnswers: number, round: number) => {
    const current = getStats();
    const today = new Date().toISOString().split('T')[0];
    
    const newHistory = [...current.gamesHistory, { date: today, score }];
    // Keep last 7 days approx
    if (newHistory.length > 10) newHistory.shift();

    const updated: UserStats = {
        ...current,
        totalGamesPlayed: current.totalGamesPlayed + 1,
        lifetimeCorrectAnswers: current.lifetimeCorrectAnswers + correctAnswers,
        highestScore: Math.max(current.highestScore, score),
        highestRound: Math.max(current.highestRound || 0, round),
        gamesHistory: newHistory
    };
    
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
    return updated;
};

export const getLives = (): number => {
    const countStr = localStorage.getItem(REMAINING_LIVES_KEY);
    const lastUpdateStr = localStorage.getItem(LIVES_TIMESTAMP_KEY);
    
    let lives = countStr ? parseInt(countStr, 10) : 3;
    
    if (lives < 3 && lastUpdateStr) {
        const lastUpdate = parseInt(lastUpdateStr, 10);
        const now = Date.now();
        const elapsed = now - lastUpdate;
        
        const livesToRestore = Math.floor(elapsed / REGEN_TIME_MS);
        
        if (livesToRestore > 0) {
            lives = Math.min(3, lives + livesToRestore);
            
            // Update timestamp to current relative time (preserving progress toward next life)
            const remainder = elapsed % REGEN_TIME_MS;
            const newLastUpdate = now - remainder;
            
            localStorage.setItem(REMAINING_LIVES_KEY, lives.toString());
            
            if (lives < 3) {
                localStorage.setItem(LIVES_TIMESTAMP_KEY, newLastUpdate.toString());
            } else {
                localStorage.removeItem(LIVES_TIMESTAMP_KEY);
            }
        }
    } else if (lives >= 3) {
        localStorage.removeItem(LIVES_TIMESTAMP_KEY);
    }
    
    return lives;
};

export const loseLife = (currentLives: number): number => {
    const newLives = Math.max(0, currentLives - 1);
    localStorage.setItem(REMAINING_LIVES_KEY, newLives.toString());
    
    // If we were at full lives (or somehow lost a life without a timestamp), start the timer
    if (!localStorage.getItem(LIVES_TIMESTAMP_KEY)) {
        localStorage.setItem(LIVES_TIMESTAMP_KEY, Date.now().toString());
    }
    
    return newLives;
}

export const resetLives = () => {
  localStorage.setItem(REMAINING_LIVES_KEY, '3');
  localStorage.removeItem(LIVES_TIMESTAMP_KEY);
}
