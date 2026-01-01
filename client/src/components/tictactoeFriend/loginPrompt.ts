import { i18n } from "../../services/i18n";

export function createLoginPrompt(): string {
  return `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('must_login')}</p>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
      </div>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;
}
