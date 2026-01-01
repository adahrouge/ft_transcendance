import { i18n } from "../../services/i18n";
import { getDifficultyLabel } from "../../utils/tictactoeAi/config";

export function createMatchSetup(selectedDifficulty: number): string {
  return `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_vs_ai')}</h1>

      <div class="tictactoe-settings">
        <div class="tictactoe-setting-row">
          <span class="tictactoe-setting-label">${i18n.t('ai_difficulty')}: <span id="difficulty-label">${getDifficultyLabel(selectedDifficulty)}</span></span>
          <div class="tictactoe-slider-container">
            <span class="tictactoe-slider-label">${i18n.t('easy')}</span>
            <input type="range" id="difficulty-slider" class="tictactoe-slider" min="0" max="100" value="${selectedDifficulty}">
            <span class="tictactoe-slider-label">${i18n.t('hard')}</span>
          </div>
        </div>
      </div>

      <div class="tictactoe-divider"></div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-start">START MATCH</button>
      </div>
      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;
}
