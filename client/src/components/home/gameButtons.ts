import { i18n } from "../../services/i18n";

export function renderGameButtons(): string {
  return `
    <div class="home-controls">
      <button id="btn-pong" class="home-btn home-btn-fullwidth">${i18n.t('play_pong')}</button>
    </div>
    <div class="home-controls">
      <button id="btn-tictactoe" class="home-btn home-btn-fullwidth">${i18n.t('play_tictactoe')}</button>
    </div>
  `;
}
