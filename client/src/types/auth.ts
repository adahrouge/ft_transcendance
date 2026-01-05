export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  auth_provider?: string;
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
  token?: string; // Optional or deprecated
}

export interface AuthError {
  error: string;
}

export interface GoogleOAuthResponse {
  credential: string;
  userInfo?: {
    email: string;
    name: string;
    sub: string;
    given_name?: string;
    picture?: string;
  };
}

export interface GoogleTokenPayload {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}
