import { apiRequest } from "../api";
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

    const response = await fetch("/api/users/me/avatar", {
      method: "POST",
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async deleteAccount(): Promise<void> {
    return apiRequest<void>("/api/users/me", {
      method: "DELETE",
    });
  },
};

export type { ProfileUser, ProfileUpdateData };
