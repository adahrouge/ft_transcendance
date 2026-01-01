import { profileService } from "../../services/profile";
import type { ProfileUser } from "../../types/profile";
import { createProfileBox } from "../../components/profile";
import { setupAvatarUpload } from "./avatar";
import { setupLanguageButtons, setupPasswordToggles, setupInputClearing } from "./interactions";
import { setupNavigationButtons, setupFormSubmission, setupDeleteAccount } from "./actions";

export async function loadProfile() {
  const root = document.getElementById("profile-root");
  if (!root) return;

  try {
    const profileResponse = await profileService.getProfile();
    const user: ProfileUser = profileResponse.user;

    root.innerHTML = createProfileBox(user);

    setupEventListeners(user);
  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load profile.</div>';
  }
}

function setupEventListeners(user: ProfileUser) {
  setupNavigationButtons();
  setupAvatarUpload();
  setupLanguageButtons();
  setupPasswordToggles();
  setupInputClearing();
  setupFormSubmission(user);
  setupDeleteAccount();
}
