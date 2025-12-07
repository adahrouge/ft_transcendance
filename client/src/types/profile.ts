export interface ProfileUser {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  display_name?: string;
  email?: string;
  avatar_url?: string;
  password?: string;
  current_password?: string;
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

export interface Friend {
  id: number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: "online" | "offline" | "in_game";
}

export interface ProfileResponse {
  user: ProfileUser;
}

export interface MatchHistoryResponse {
  matches: MatchHistoryItem[];
}

export interface FriendsResponse {
  friends: Friend[];
}
