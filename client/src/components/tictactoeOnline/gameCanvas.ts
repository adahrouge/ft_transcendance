import { i18n } from "../../services/i18n";
import type { Player } from "../../types/tictactoe";
import type { XoBoardCustomization } from "../../types/boardCustomization";

export function createOnlineGameCanvas(
  mySymbol: Player,
  opponentName: string,
  isMyTurn: boolean,
  customization: XoBoardCustomization
): string {
  return `
    <div class="tictactoe-box">
      <div class="tictactoe-scoreboard">
        <div>
          <div class="tictactoe-score-label">${i18n.t('you')} (${mySymbol})</div>
          <div class="tictactoe-score-value" id="status-me" style="color: ${mySymbol === 'X' ? customization.colors.xColor : customization.colors.oColor}">
            ${isMyTurn ? i18n.t('your_turn') : ''}
          </div>
        </div>
        <div class="tictactoe-score-divider">VS</div>
        <div>
          <div class="tictactoe-score-label">${opponentName} (${mySymbol === 'X' ? 'O' : 'X'})</div>
          <div class="tictactoe-score-value" id="status-opponent" style="color: ${mySymbol === 'X' ? customization.colors.oColor : customization.colors.xColor}">
            ${!isMyTurn ? i18n.t('their_turn') || 'THEIR TURN' : ''}
          </div>
        </div>
      </div>

      <div class="tictactoe-canvas-wrapper">
        <canvas id="game-canvas" width="400" height="400" class="tictactoe-canvas"></canvas>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary" id="btn-quit">QUIT</button>
      </div>
    </div>
  `;
}
