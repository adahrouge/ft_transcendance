import { apiRequest } from "../api";
import { setAuthenticated } from "../utils/auth";
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "../types/auth";
import type { GoogleUserInfo } from "../utils/auth/googleOAuth";
import { navigateTo } from "../router";
import { presenceService } from "./presence";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setAuthenticated(true);
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setAuthenticated(true);
    return data;
  },

  async googleAuth(userInfo: GoogleUserInfo): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>("/api/users/google-auth", {
      method: "POST",
      body: JSON.stringify({
        idToken: userInfo.accessToken,
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.googleId
      }),
    });
    setAuthenticated(true);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/api/users/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    }
    presenceService.disconnect();
    setAuthenticated(false);
    navigateTo('/auth');
  },

  async getCurrentUser(): Promise<User> {
    const data = await apiRequest<{ user: User }>("/api/users/me");
    return data.user;
  },
};

