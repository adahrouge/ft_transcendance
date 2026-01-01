import { i18n } from "../../services/i18n";
import type { BallSpeedLevel } from "../../types/pong";

export function createMatchSetup(
  scoreToWin: number,
  selectedBallSpeed: BallSpeedLevel,
  selectedAIDifficulty: number,
  difficultyLabel: string
): string {
  return `
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_vs_ai')}</h1>
      <p class="pong-subtitle">${i18n.t('controls_ai').replace('5', String(scoreToWin))}</p>

      <div class="pong-settings">
        <div class="pong-setting-row">
          <span class="pong-setting-label">BALL SPEED</span>
          <div class="pong-setting-options">
            <button class="pong-setting-btn ${selectedBallSpeed === "slow" ? "active" : ""}" data-speed="slow">SLOW</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "normal" ? "active" : ""}" data-speed="normal">NORMAL</button>
            <button class="pong-setting-btn ${selectedBallSpeed === "fast" ? "active" : ""}" data-speed="fast">FAST</button>
          </div>
        </div>

        <div class="pong-setting-row">
          <span class="pong-setting-label">${i18n.t('ai_difficulty')}: <span id="difficulty-label">${difficultyLabel}</span></span>
          <div class="pong-slider-container">
            <span class="pong-slider-label">${i18n.t('easy')}</span>
            <input type="range" id="difficulty-slider" class="pong-slider" min="0" max="100" value="${selectedAIDifficulty}">
            <span class="pong-slider-label">${i18n.t('hard')}</span>
          </div>
        </div>
      </div>

      <div class="pong-divider"></div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
      <p class="pong-info">Press SPACE to pause</p>
    </div>
  `;
}
