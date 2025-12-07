export interface UserProfile {
  id: number;
  username: string;
  email: string;
  display_name: string;
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

export type GameMode = 'offline' | 'online' | 'tournament';
