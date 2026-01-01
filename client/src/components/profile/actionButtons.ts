import { i18n } from "../../services/i18n";

export function createActionButtons(): string {
  return `
    <div id="profile-msg" class="profile-message"></div>

    <div class="profile-actions">
      <button type="button" id="btn-back" class="profile-back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        ${i18n.t("back")}
      </button>
      <button type="submit" class="profile-save-btn">${i18n.t(
        "save_changes"
      )}</button>
      <button type="button" id="btn-logout" class="profile-logout-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        ${i18n.t("logout")}
      </button>
    </div>
  `;
}
