export interface TournamentPlayer {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bracket_position: number;
  is_bot: boolean;
  eliminated: boolean;
}

export interface TournamentMatch {
  id: number;
  round: number;
  match_number: number;
  player1_id?: number;
  player2_id?: number;
  player1_username?: string;
  player2_username?: string;
  player1_score?: number;
  player2_score?: number;
  winner_id?: number;
  status: "pending" | "playing" | "finished";
}

export interface Tournament {
  id: number;
  creator_id: number;
  creator_username: string;
  max_players: 4 | 8;
  current_players: number;
  status: "waiting" | "in_progress" | "finished";
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  winner_id?: number;
  winner_username?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface TournamentListItem {
  id: number;
  creator_username: string;
  max_players: 4 | 8;
  current_players: number;
  status: "waiting" | "in_progress" | "finished";
}

export interface CreateTournamentResponse {
  tournament: Tournament;
}

export interface TournamentListResponse {
  tournaments: TournamentListItem[];
}

export interface TournamentDetailResponse {
  tournament: Tournament;
}
