import { apiRequest } from "../api";

export const tournamentGameService = {
  async getOrCreateGameForMatch(tournamentId: number, matchId: number): Promise<{ gameId: string }> {
    return apiRequest<{ gameId: string }>(`/api/tournaments/${tournamentId}/matches/${matchId}/game`, {
      method: "POST"
    });
  }
};
