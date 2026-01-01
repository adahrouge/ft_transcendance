import { i18n } from "../../services/i18n";

export function createTournamentSetup(): string {
  return `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('local_tournament')}</h1>
      <p class="pong-subtitle">${i18n.t('local_tournament_desc')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-4man">
          <span class="pong-mode-title">${i18n.t('tournament_4_players')}</span>
          <span class="pong-mode-desc">${i18n.t('tournament_4_desc')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-8man">
          <span class="pong-mode-title">${i18n.t('tournament_8_players')}</span>
          <span class="pong-mode-desc">${i18n.t('tournament_8_desc')}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}
