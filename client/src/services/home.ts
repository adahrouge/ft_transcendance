import { apiRequest } from "../api";
import type { UserProfile, ProfileUpdateData } from "../types/home";

export const homeService = {
  async getCurrentUser(): Promise<UserProfile> {
    const data = await apiRequest<{ user: UserProfile }>("/api/users/me");
    return data.user;
  },

  async updateProfile(updates: ProfileUpdateData): Promise<UserProfile> {
    const data = await apiRequest<{ user: UserProfile }>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return data.user;
  },

  async uploadAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("/api/users/me/avatar", {
      method: "POST",
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.user;
  },
};
