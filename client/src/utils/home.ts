import { homeService } from "../services/home";
import { navigateTo } from "../router";
import type { UserProfile } from "../types/home";
import defaultProfileImage from "../assets/images/profile.png";

export const DEFAULT_AVATAR = defaultProfileImage;

// ============ Avatar & Display ============

interface AvatarUser {
  username: string;
  avatar_url?: string;
}

export function getAvatarUrl(user: UserProfile | AvatarUser): string {
  if (user.avatar_url && user.avatar_url.trim() !== "") {
    return user.avatar_url;
  }
  return DEFAULT_AVATAR;
}

export function getDisplayName(user: UserProfile): string {
  return user.display_name || user.username;
}

// ============ Page Setup ============

export async function setupHomePage() {
  try {
    const user = await homeService.getCurrentUser();
    updateProfileDisplay(user);
    setupEventListeners();
  } catch {
    navigateTo("/auth");
  }
}

function updateProfileDisplay(user: UserProfile) {
  const avatarEl = document.getElementById("profile-avatar") as HTMLImageElement;
  const nameEl = document.getElementById("profile-name");

  if (avatarEl) {
    avatarEl.src = getAvatarUrl(user);
    avatarEl.onerror = () => { avatarEl.src = DEFAULT_AVATAR; };
  }
  if (nameEl) {
    nameEl.textContent = getDisplayName(user);
  }
}

function setupEventListeners() {
  const routes: Record<string, string> = {
    "btn-profile": "/profile",
    "btn-stats": "/stats",
    "btn-friends": "/friend",
    "btn-customize": "/customize-board",
    "btn-pong": "/pong",
    "btn-tictactoe": "/tictactoe",
  };

  for (const [id, path] of Object.entries(routes)) {
    document.getElementById(id)?.addEventListener("click", () => navigateTo(path));
  }
}
