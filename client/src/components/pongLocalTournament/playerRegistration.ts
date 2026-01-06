import { i18n } from "../../services/i18n";

export function createPlayerRegistration(size: 4 | 8): string {
  const playerInputs = Array.from({ length: size }, (_, i) => `
    <div class="pong-setting-row">
      <input 
        type="text" 
        id="player-name-${i + 1}" 
        class="pong-input player-name-input" 
        placeholder="${i18n.t('player_name_placeholder').replace('{n}', String(i + 1))}"
        maxlength="12"
        autocomplete="off"
      />
    </div>
  `).join('');

  return `
    <div class="pong-start-box local-tournament-registration">
      <h1 class="pong-title">${i18n.t('local_tournament')}</h1>
      <p class="pong-subtitle">${i18n.t('enter_player_names')}</p>

      <div class="pong-settings player-names-container">
        ${playerInputs}
      </div>

      <div id="registration-error" class="pong-error-message"></div>

      <div class="pong-divider"></div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-fullwidth" id="btn-start-tournament">
          ${i18n.t('start_tournament')}
        </button>
      </div>
      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">
          ${i18n.t('back')}
        </button>
      </div>
    </div>
  `;
}
