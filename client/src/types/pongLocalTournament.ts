
// Local tournament participant (real human player)
export interface LocalTournamentPlayer {
  name: string;
  id: number; // Simple numeric ID for tracking
}

// Single match in the local tournament bracket
export interface LocalTournamentMatchup {
  p1: LocalTournamentPlayer | null;
  p2: LocalTournamentPlayer | null;
  winner: LocalTournamentPlayer | null;
  p1Score: number;
  p2Score: number;
}

// Full local tournament state with human players
export interface HumanLocalTournament {
  size: 4 | 8;
  players: LocalTournamentPlayer[];
  bracket: LocalTournamentMatchup[][];
  currentRound: number;
  currentMatch: number;
  isActive: boolean;
}
