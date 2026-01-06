import { i18n } from "../../services/i18n";
import type { GameConfig } from "../../types/pong";
import type { LocalTournamentPlayer } from "../../types/pongLocalTournament";

export function createLocalMatchCanvas(
  config: GameConfig,
  p1: LocalTournamentPlayer,
  p2: LocalTournamentPlayer
): string {
  return `
    <div class="pong-box">
      <div class="pong-scoreboard">
        <div>
          <div class="pong-score-label">${p1.name}</div>
          <div class="pong-score-value" id="score-p1">0</div>
        </div>
        <div class="pong-score-divider">:</div>
        <div>
          <div class="pong-score-label">${p2.name}</div>
          <div class="pong-score-value" id="score-p2">0</div>
        </div>
      </div>
      <div class="pong-canvas-wrapper">
        <canvas id="game-canvas" width="${config.width}" height="${config.height}" class="pong-canvas"></canvas>
        <div class="pong-countdown" id="countdown">
          <span class="pong-countdown-text" id="countdown-text">3</span>
        </div>
      </div>
      <div class="pong-touch-controls" id="local-tournament-touch-controls">
        <div class="pong-touch-section">
          <span class="pong-touch-label">${p1.name}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="local-p1-left">◄</button>
            <button class="pong-touch-btn" id="local-p1-right">►</button>
          </div>
        </div>
        <div class="pong-touch-section">
          <span class="pong-touch-label">${p2.name}</span>
          <div class="pong-touch-buttons">
            <button class="pong-touch-btn" id="local-p2-left">◄</button>
            <button class="pong-touch-btn" id="local-p2-right">►</button>
          </div>
        </div>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary" id="btn-pause">PAUSE</button>
        <button class="pong-btn pong-btn-secondary" id="btn-quit-match">${i18n.t('quit_tournament')}</button>
      </div>
    </div>
  `;
}
