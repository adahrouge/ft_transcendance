import { homeService } from "../../services/home";
import { navigateTo } from "../../router";
import type { UserProfile } from "../../types/home";
import { getAvatarUrl, getDisplayName, DEFAULT_AVATAR } from "./avatar";

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
