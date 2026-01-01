import { i18n } from "../../services/i18n";

export function renderRegisterForm(): string {
  return `
    <form id="register-form" class="auth-form hidden flex-col gap-2">
      <div class="form-group">
        <label for="register-username">${i18n.t("username")}</label>
        <input type="text" id="register-username" class="pixel-input" placeholder="${i18n.t(
          "choose_username"
        )}" required autocomplete="username" minlength="3" maxlength="20">
      </div>
      <div class="form-group">
        <label for="register-email">${i18n.t("email")}</label>
        <input type="email" id="register-email" class="pixel-input" placeholder="${i18n.t(
          "enter_email"
        )}" required autocomplete="email">
      </div>
      <div class="form-group">
        <label for="register-password">${i18n.t("password")}</label>
        <div class="password-wrapper">
          <input type="password" id="register-password" class="pixel-input" placeholder="${i18n.t(
            "create_password"
          )}" required autocomplete="new-password" minlength="8">
          <button type="button" class="password-toggle" data-target="register-password">
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
      </div>
      <div id="register-error" class="error-message"></div>
      <button type="submit" class="submit-btn pixel-btn">
        ${i18n.t("sign_up")}
      </button>
    </form>
  `;
}
