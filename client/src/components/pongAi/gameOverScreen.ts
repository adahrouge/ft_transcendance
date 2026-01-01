import { i18n } from "../../services/i18n";

export function createGameOverScreen(won: boolean, scorePlayer: number, scoreAI: number): string {
  return `
    <div class="pong-over-overlay">
      <div class="pong-over-box">
        <h1 class="pong-over-title">${won ? i18n.t('you_win') : i18n.t('you_lose')}</h1>
        <p class="pong-over-score">${scorePlayer} - ${scoreAI}</p>
        <div class="pong-over-actions">
          <button class="pong-btn" id="btn-rematch">REMATCH</button>
          <button class="pong-btn pong-btn-secondary" id="btn-back">BACK</button>
        </div>
      </div>
    </div>
  `;
}
