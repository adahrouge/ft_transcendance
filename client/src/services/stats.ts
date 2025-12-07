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
};

export type { StatsUser, PlayerStats, MatchHistoryItem };
