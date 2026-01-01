import { i18n } from "../../services/i18n";

export function createFindGame(): string {
  return `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('find_game')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('matchmaking_desc')}</p>

      <div class="tictactoe-queue-info">
        <div class="tictactoe-queue-count">
          <span id="queue-count">-</span>
          <span class="tictactoe-queue-label">${i18n.t('players_waiting')}</span>
        </div>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-join-queue">
          ${i18n.t('join_queue')}
        </button>
      </div>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}
