import { i18n } from "../../services/i18n";
import { getAvatarUrl } from "../../utils/home";
import type { ProfileUser } from "../../types/profile";

export function createProfileHeader(user: ProfileUser): string {
  return `
    <div class="profile-header">
      <div class="profile-avatar-wrapper">
        <div class="profile-avatar-container" id="avatar-container">
          <img id="avatar-img" src="${getAvatarUrl(user)}" 
               class="profile-avatar" alt="Profile Avatar">
          <div class="profile-avatar-overlay">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span>${i18n.t("change")}</span>
          </div>
          <input type="file" id="avatar-input" accept="image/*" class="hidden">
        </div>
      </div>
      <div class="profile-header-info">
        <div class="profile-display-name">${
          user.display_name || user.username
        }</div>
        <div class="profile-username">@${user.username}</div>
      </div>
    </div>
  `;
}
