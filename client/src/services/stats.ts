import { apiRequest } from "../api";
import type {
  StatsUser,
  PlayerStats,
  StatsResponse,
  MatchHistoryItem,
  MatchHistoryResponse,
} from "../types/stats";

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
};

export type { StatsUser, PlayerStats, MatchHistoryItem };
