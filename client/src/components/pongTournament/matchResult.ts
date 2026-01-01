import { i18n } from "../../services/i18n";

export function createMatchResult(playerWon: boolean, scorePlayer: number, scoreAI: number): string {
  return `
    <div class="pong-over-overlay">
      <div class="pong-over-box">
        <h1 class="pong-over-title">${playerWon ? i18n.t('you_win') : i18n.t('you_lose')}</h1>
        <p class="pong-over-score">${scorePlayer} - ${scoreAI}</p>
        <div class="pong-over-actions">
          <button class="pong-btn" id="btn-continue">${i18n.t('continue')}</button>
        </div>
      </div>
    </div>
  `;
}
