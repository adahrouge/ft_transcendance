import { renderLoginForm, renderRegisterForm } from "../components/auth";
import { initGoogleOAuth, setupAuthPage } from "../utils/auth";
import { i18n } from "../services/i18n";
import "../styles/auth.css";

export function renderAuthPage(): string {
  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  if (googleClientId) {
    initGoogleOAuth(googleClientId).catch(() => {});
  }

  setTimeout(setupAuthPage, 0);

  return `
    <div class="auth-container">
      <div class="auth-overlay"></div>
      <div class="auth-box">
        <h1 class="auth-title">TRANSCENDENCE</h1>

        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">${i18n.t('login')}</button>
          <button class="tab-btn" data-tab="register">${i18n.t('register')}</button>
        </div>

        <div class="auth-form-container">
          ${renderLoginForm()}
          ${renderRegisterForm()}
        </div>
      </div>
    </div>
  `;
}
