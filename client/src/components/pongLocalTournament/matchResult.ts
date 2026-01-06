import { i18n } from "../../services/i18n";
import type { LocalTournamentPlayer } from "../../types/pongLocalTournament";

export function createLocalMatchResult(
  winner: LocalTournamentPlayer,
  scoreP1: number,
  scoreP2: number,
  isFinal: boolean
): string {
  return `
    <div class="pong-over-overlay">
      <div class="pong-over-box">
        <h1 class="pong-over-title">${i18n.t('player_wins').replace('{name}', winner.name)}</h1>
        <p class="pong-over-score">${scoreP1} - ${scoreP2}</p>
        <div class="pong-over-actions">
          <button class="pong-btn" id="btn-continue">
            ${isFinal ? i18n.t('back_to_menu') : i18n.t('continue')}
          </button>
        </div>
      </div>
    </div>
  `;
}
