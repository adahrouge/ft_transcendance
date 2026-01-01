import { i18n } from "../../services/i18n";

export function createModeSelection(): string {
  return `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('choose_mode')}</p>

      <div class="tictactoe-mode-buttons">
        <button class="tictactoe-mode-btn" id="btn-vs-ai">
          <span class="tictactoe-mode-title">${i18n.t('vs_ai')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-vs-friend">
          <span class="tictactoe-mode-title">${i18n.t('vs_friend')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-find-game">
          <span class="tictactoe-mode-title">${i18n.t('find_game') || 'FIND GAME'}</span>
          <span class="tictactoe-mode-desc">${i18n.t('play_online') || 'Play against another player online'}</span>
        </button>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;
}
