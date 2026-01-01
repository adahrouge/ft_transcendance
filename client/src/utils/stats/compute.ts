import type { MatchHistoryItem, PlayerStats } from "../../types/stats";

export interface ComputedStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tournamentsWon: number;
  currentStreak: number;
  longestStreak: number;
  pongStats: { played: number; wins: number; losses: number };
  tttStats: { played: number; wins: number; losses: number };
  recentForm: string[];
  avgScore: number;
  avgOpponentScore: number;
}

export function computeStats(stats: PlayerStats | null, matches: MatchHistoryItem[]): ComputedStats {
  const totalGames = stats?.total_games ?? matches.length;
  const wins = stats?.wins ?? matches.filter(m => m.result === 'win').length;
  const losses = stats?.losses ?? matches.filter(m => m.result === 'loss').length;
  const draws = stats?.draws ?? matches.filter(m => m.result === 'draw').length;
  const winRate = stats?.win_rate ?? (totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0);
  const tournamentsWon = stats?.tournaments_won ?? matches.filter(m => m.game_type === 'tournament' && m.result === 'win').length;
  const currentStreak = stats?.current_win_streak ?? calculateCurrentStreak(matches);
  const longestStreak = stats?.longest_win_streak ?? calculateLongestStreak(matches);

  const pongMatches = matches.filter(m => m.game_type === 'pong' || m.game_type === 'online');
  const tttMatches = matches.filter(m => m.game_type === 'tictactoe');

  const pongStats = {
    played: pongMatches.length,
    wins: pongMatches.filter(m => m.result === 'win').length,
    losses: pongMatches.filter(m => m.result === 'loss').length
  };

  const tttStats = {
    played: tttMatches.length,
    wins: tttMatches.filter(m => m.result === 'win').length,
    losses: tttMatches.filter(m => m.result === 'loss').length
  };

  const recentForm = matches.slice(0, 5).map(m => m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D');

  const scoredMatches = matches.filter(m => m.game_type !== 'tournament');
  const totalScored = scoredMatches.reduce((sum, m) => sum + m.user_score, 0);
  const totalConceded = scoredMatches.reduce((sum, m) => sum + m.opponent_score, 0);
  const avgScore = scoredMatches.length > 0 ? Math.round((totalScored / scoredMatches.length) * 10) / 10 : 0;
  const avgOpponentScore = scoredMatches.length > 0 ? Math.round((totalConceded / scoredMatches.length) * 10) / 10 : 0;

  return { totalGames, wins, losses, draws, winRate, tournamentsWon, currentStreak, longestStreak, pongStats, tttStats, recentForm, avgScore, avgOpponentScore };
}

function calculateCurrentStreak(matches: MatchHistoryItem[]): number {
  let streak = 0;
  for (const m of matches) {
    if (m.result === 'win') streak++;
    else break;
  }
  return streak;
}

function calculateLongestStreak(matches: MatchHistoryItem[]): number {
  let longest = 0, current = 0;
  for (const m of matches) {
    if (m.result === 'win') {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}
