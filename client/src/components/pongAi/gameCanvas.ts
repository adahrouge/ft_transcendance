import { i18n } from "../../services/i18n";
import type { GameConfig } from "../../types/pong";

export function createGameCanvas(config: GameConfig): string {
  return `
    <div class="pong-box">
      <div class="pong-scoreboard">
        <div>
          <div class="pong-score-label">${i18n.t('you')}</div>
          <div class="pong-score-value" id="score-player">0</div>
        </div>
        <div class="pong-score-divider">:</div>
        <div>
          <div class="pong-score-label">${i18n.t('ai')}</div>
          <div class="pong-score-value" id="score-ai">0</div>
        </div>
      </div>
      <div class="pong-canvas-wrapper">
        <canvas id="game-canvas" width="${config.width}" height="${config.height}" class="pong-canvas"></canvas>
        <div class="pong-countdown" id="countdown">
          <span class="pong-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <!-- Touch controls for mobile -->
      <div class="pong-touch-controls pong-touch-controls-single" id="ai-touch-controls">
        <div class="pong-touch-section pong-touch-single">
          <span class="pong-touch-label">${i18n.t('you')}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="ai-player-left">◄</button>
            <button class="pong-touch-btn" id="ai-player-right">►</button>
          </div>
        </div>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary" id="btn-pause">PAUSE</button>
        <button class="pong-btn pong-btn-secondary" id="btn-quit">QUIT</button>
      </div>
    </div>
  `;
}
