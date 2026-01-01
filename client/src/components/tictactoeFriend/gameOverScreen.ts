import { i18n } from "../../services/i18n";
import type { Player } from "../../types/tictactoe";

export function createGameOverScreen(winner: Player | 'draw' | null): string {
  const title = winner === 'draw' 
    ? i18n.t('draw') 
    : (winner === 'X' ? i18n.t('x_wins') : i18n.t('o_wins'));

  return `
    <div class="tictactoe-over-overlay">
      <div class="tictactoe-over-box">
        <h1 class="tictactoe-over-title">${title}</h1>
        <div class="tictactoe-over-actions">
          <button class="tictactoe-btn" id="btn-rematch">REMATCH</button>
          <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-back-menu">BACK</button>
        </div>
      </div>
    </div>
  `;
}
