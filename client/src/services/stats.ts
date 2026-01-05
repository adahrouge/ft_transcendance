import { apiRequest } from "../api";
import type {
  StatsUser,
  PlayerStats,
  StatsResponse,
  MatchHistoryItem,
  MatchHistoryResponse,
} from "../types/stats";
import type { Player } from "../types/tictactoe";

export const statsService = {
  async getStats(): Promise<StatsResponse> {
    return apiRequest<StatsResponse>("/api/users/me/stats");
  },

  async getMatchHistory(): Promise<MatchHistoryResponse> {
    return apiRequest<MatchHistoryResponse>("/api/users/me/match-history");
  },

  async getUserProfile(): Promise<{ user: StatsUser }> {
    return apiRequest<{ user: StatsUser }>("/api/users/me");
  },

  async saveOfflineMatch(data: { playerScore: number; aiScore: number; result: 'win' | 'loss' | 'draw'; difficulty: string; gameType?: string }): Promise<void> {
    return apiRequest<void>("/api/users/me/offline-match", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async saveTournamentWin(data: { size: 4 | 8; rounds: number }): Promise<void> {
    return apiRequest<void>("/api/users/me/tournament-win", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Pong AI match
  async savePongAiMatch(playerScore: number, aiScore: number, difficulty: string): Promise<void> {
    const result = playerScore > aiScore ? 'win' : 'loss';
    return this.saveOfflineMatch({
      playerScore,
      aiScore,
      result,
      difficulty,
      gameType: 'pong'
    });
  },

  // Pong friend (local) match
  async savePongFriendMatch(player1Score: number, player2Score: number): Promise<void> {
    const result = player1Score > player2Score ? 'win' : 'loss';
    return this.saveOfflineMatch({
      playerScore: player1Score,
      aiScore: player2Score,
      result,
      difficulty: 'FRIEND',
      gameType: 'pong'
    });
  },

  // TicTacToe AI match
  async saveTictactoeAiMatch(winner: Player | 'draw' | null, difficulty: string): Promise<void> {
    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (winner === 'X') result = 'win';
    if (winner === 'O') result = 'loss';

    return this.saveOfflineMatch({
      playerScore: winner === 'X' ? 1 : 0,
      aiScore: winner === 'O' ? 1 : 0,
      result,
      difficulty,
      gameType: 'tictactoe'
    });
  },

  // TicTacToe friend (local) match
  async saveTictactoeFriendMatch(winner: Player | 'draw' | null): Promise<void> {
    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (winner === 'X') result = 'win';
    if (winner === 'O') result = 'loss';

    return this.saveOfflineMatch({
      playerScore: winner === 'X' ? 1 : 0,
      aiScore: winner === 'O' ? 1 : 0,
      result,
      difficulty: 'FRIEND',
      gameType: 'tictactoe'
    });
  },
};

export type { StatsUser, PlayerStats, MatchHistoryItem };
