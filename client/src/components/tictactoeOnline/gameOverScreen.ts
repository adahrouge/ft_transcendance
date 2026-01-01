import { i18n } from "../../services/i18n";

export function createOnlineGameOverScreen(title: string): string {
  return `
    <div class="tictactoe-over-overlay">
      <div class="tictactoe-over-box">
        <h1 class="tictactoe-over-title">${title}</h1>
        <div class="tictactoe-over-actions">
          <button class="tictactoe-btn" id="btn-find-again">${i18n.t('find_another') || 'FIND ANOTHER GAME'}</button>
          <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-back-menu">BACK</button>
        </div>
      </div>
    </div>
  `;
}
