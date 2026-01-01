import { i18n } from "../../services/i18n";
import type { XoBoardCustomization } from "../../types/boardCustomization";

export function createGameCanvas(customization: XoBoardCustomization): string {
  return `
    <div class="tictactoe-box">
      <div class="tictactoe-scoreboard">
        <div>
          <div class="tictactoe-score-label">${i18n.t('player_x')}</div>
          <div class="tictactoe-score-value" id="status-p1" style="color: ${customization.colors.xColor}">YOUR TURN</div>
        </div>
        <div class="tictactoe-score-divider">VS</div>
        <div>
          <div class="tictactoe-score-label">${i18n.t('player_o')}</div>
          <div class="tictactoe-score-value" id="status-p2"></div>
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
