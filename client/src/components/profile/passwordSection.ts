import { i18n } from "../../services/i18n";

export function createPasswordSection(): string {
  return `
    <div class="profile-section">
      <h3 class="profile-section-title">${i18n.t("change_password")}</h3>
      <div class="profile-form-row">
        <div class="profile-form-group">
          <label class="profile-label">${i18n.t(
            "current_password"
          )}</label>
          <div class="profile-password-wrapper">
            <input type="password" id="current-password" placeholder="••••••••"
                    class="profile-input">
            <button type="button" class="profile-password-toggle" data-target="current-password">
              <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg class="eye-off-icon hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
          <div id="current-password-error" class="profile-field-error"></div>
        </div>
        <div class="profile-form-group">
          <label class="profile-label">${i18n.t("new_password")}</label>
          <div class="profile-password-wrapper">
            <input type="password" id="new-password" placeholder="••••••••"
                    class="profile-input">
            <button type="button" class="profile-password-toggle" data-target="new-password">
              <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg class="eye-off-icon hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
          <div id="new-password-error" class="profile-field-error"></div>
        </div>
      </div>
    </div>
  `;
}
