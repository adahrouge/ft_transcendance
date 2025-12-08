import { apiRequest } from "../api";
import { setToken } from "../utils/auth";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "../types/auth";
import { navigateTo } from "../router";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      setToken(data.token);
    }

    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      setToken(data.token);
    }

    return data;
  },

  async googleAuth(idToken: string, email: string, name: string, googleId: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/google-auth", {
      method: "POST",
      body: JSON.stringify({ idToken, email, name, googleId }),
    });

    if (data.token) {
      setToken(data.token);
    }

    return data;
  },

  logout(): void {
    setToken(null);
    // Optional: Redirect to login page or clear other state
    navigateTo('/auth');
  },

  async getCurrentUser(): Promise<User> {
    const data = await apiRequest<{ user: User }>("/api/users/me");
    return data.user;
  },
};

