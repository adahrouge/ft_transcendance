import { i18n } from "../services/i18n";

export function renderLoginForm(): string {
  return `
    <form id="login-form" class="auth-form active flex flex-col gap-2">
      <div class="form-group">
        <label for="login-username">${i18n.t("username")}</label>
        <input type="text" id="login-username" class="pixel-input" placeholder="${i18n.t(
          "enter_username"
        )}" required autocomplete="username">
      </div>
      <div class="form-group">
        <label for="login-password">${i18n.t("password")}</label>
        <div class="password-wrapper">
          <input type="password" id="login-password" class="pixel-input" placeholder="${i18n.t(
            "enter_password"
          )}" required autocomplete="current-password">
          <button type="button" class="password-toggle" data-target="login-password">
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
      <div id="login-error" class="error-message"></div>
      <button type="submit" class="submit-btn pixel-btn">
        ${i18n.t("login")}
      </button>

      <div class="divider">${i18n.t("or")}</div>

      <button type="button" class="google-btn" id="google-login">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        <span>${i18n.t("continue_with_google")}</span>
      </button>
    </form>
  `;
}

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
