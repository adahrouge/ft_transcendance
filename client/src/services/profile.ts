import { apiRequest } from "../api";
import { getToken } from "../utils/auth";
import type {
  ProfileUser,
  ProfileUpdateData,
  ProfileResponse,
  MatchHistoryResponse,
  FriendsResponse,
} from "../types/profile";

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    return apiRequest<ProfileResponse>("/api/users/me");
  },

  async updateProfile(updates: ProfileUpdateData): Promise<ProfileResponse> {
    return apiRequest<ProfileResponse>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async getMatchHistory(): Promise<MatchHistoryResponse> {
    return apiRequest<MatchHistoryResponse>("/api/users/me/match-history");
  },

  async getFriends(): Promise<FriendsResponse> {
    return apiRequest<FriendsResponse>("/api/users/me/friends");
  },

  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append("avatar", file);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/users/me/avatar", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
};

export type { ProfileUser, ProfileUpdateData };
