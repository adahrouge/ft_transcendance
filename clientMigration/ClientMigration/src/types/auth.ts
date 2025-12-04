export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthError {
  error: string;
}
