// Tournament participant (player or bot)
export interface TournamentParticipant {
  name: string;
  isPlayer: boolean;
  difficulty: number;
}

// Single match in the bracket
export interface TournamentMatchup {
  p1: TournamentParticipant | null;
  p2: TournamentParticipant | null;
  winner: TournamentParticipant | null;
  p1Score: number;
  p2Score: number;
}

// Full local tournament state
export interface LocalTournament {
  size: 4 | 8;
  participants: TournamentParticipant[];
  bracket: TournamentMatchup[][];
  currentRound: number;
  currentMatch: number;
  isActive: boolean;
}
