import { i18n } from "../../services/i18n";

export function createModeSelection(): string {
  return `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
      <p class="pong-subtitle">${i18n.t('choose_mode')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-vs-ai">
          <span class="pong-mode-title">${i18n.t('vs_ai')}</span>
          <span class="pong-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-vs-friend">
          <span class="pong-mode-title">${i18n.t('vs_friend')}</span>
          <span class="pong-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-tournament">
          <span class="pong-mode-title">${i18n.t('local_tournament')}</span>
          <span class="pong-mode-desc">${i18n.t('local_tournament_desc')}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;
}
