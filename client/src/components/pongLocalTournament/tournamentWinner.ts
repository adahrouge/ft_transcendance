import { i18n } from "../../services/i18n";
import type { LocalTournamentPlayer } from "../../types/pongLocalTournament";

export function createTournamentWinner(winner: LocalTournamentPlayer): string {
  return `
    <div class="pong-over-overlay tournament-winner-overlay">
      <div class="pong-over-box tournament-winner-box">
        <div class="fifa-winner-crown large"></div>
        <h1 class="pong-over-title tournament-winner-title">${i18n.t('tournament_winner')}</h1>
        <p class="tournament-winner-name">${winner.name}</p>
        <div class="pong-over-actions">
          <button class="pong-btn" id="btn-finish">${i18n.t('back_to_menu')}</button>
        </div>
      </div>
    </div>
  `;
}
