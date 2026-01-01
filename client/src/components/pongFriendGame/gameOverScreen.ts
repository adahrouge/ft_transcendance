import { i18n } from "../../services/i18n";

export function createGameOverScreen(won: boolean, scoreP1: number, scoreP2: number): string {
  return `
    <div class="pong-over-overlay">
      <div class="pong-over-box">
        <h1 class="pong-over-title">${won ? i18n.t('player_1_wins') : i18n.t('player_2_wins')}</h1>
        <p class="pong-over-score">${scoreP1} - ${scoreP2}</p>
        <div class="pong-over-actions">
          <button class="pong-btn" id="btn-rematch">REMATCH</button>
          <button class="pong-btn pong-btn-secondary" id="btn-back">BACK</button>
        </div>
      </div>
    </div>
  `;
}
