import { apiRequest } from "../api";
import type {
  CreateTournamentResponse,
  TournamentListResponse,
  TournamentDetailResponse,
} from "../types/tournament";

export const tournamentService = {
  async createTournament(maxPlayers: 4 | 8): Promise<CreateTournamentResponse> {
    return apiRequest<CreateTournamentResponse>("/api/tournaments", {
      method: "POST",
      body: JSON.stringify({ max_players: maxPlayers }),
    });
  },

  async getActiveTournaments(): Promise<TournamentListResponse> {
    return apiRequest<TournamentListResponse>("/api/tournaments/active");
  },

  async getTournament(tournamentId: number): Promise<TournamentDetailResponse> {
    return apiRequest<TournamentDetailResponse>(`/api/tournaments/${tournamentId}`);
  },

  async joinTournament(tournamentId: number): Promise<void> {
    await apiRequest<void>(`/api/tournaments/${tournamentId}/join`, {
      method: "POST",
    });
  },

  async fillTournamentWithBots(tournamentId: number): Promise<void> {
    await apiRequest<void>(`/api/tournaments/${tournamentId}/fill-bots`, {
      method: "POST",
    });
  },

  async startTournament(tournamentId: number): Promise<void> {
    await apiRequest<void>(`/api/tournaments/${tournamentId}/start`, {
      method: "POST",
    });
  },

  async deleteTournament(tournamentId: number): Promise<void> {
    await apiRequest<void>(`/api/tournaments/${tournamentId}`, {
      method: "DELETE",
    });
  },
};
