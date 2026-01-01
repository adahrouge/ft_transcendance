import { i18n } from "../../services/i18n";

export function createLoginPrompt(): string {
  return `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
      <p class="pong-subtitle">${i18n.t('must_login')}</p>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;
}
