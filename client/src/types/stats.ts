export interface StatsUser {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface MatchHistoryItem {
  id: number;
  opponent_username: string;
  opponent_display_name?: string;
  user_score: number;
  opponent_score: number;
  result: "win" | "loss" | "draw";
  played_at: string;
  game_type: "online" | "tournament";
}

export interface PlayerStats {
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  longest_win_streak: number;
  current_win_streak: number;
}

export interface StatsResponse {
  user: StatsUser;
  stats: PlayerStats;
}

export interface MatchHistoryResponse {
  matches: MatchHistoryItem[];
}
