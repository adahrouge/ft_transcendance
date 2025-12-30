import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import "../styles/tictactoe.css";

export function renderTicTacToePage(): string {
  setTimeout(() => {
    setupGame();
  }, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

function setupGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    root.innerHTML = `
      <div class="tictactoe-start-box">
        <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
        <p class="tictactoe-subtitle">${i18n.t('must_login')}</p>
        <div class="tictactoe-controls">
          <button class="tictactoe-btn tictactoe-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
        </div>
        <div class="tictactoe-controls">
          <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
        </div>
      </div>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    return;
  }

  showModeSelection(root);
}

function showModeSelection(root: HTMLElement) {
  root.innerHTML = `
    <div class="tictactoe-start-box">
      <h1 class="tictactoe-title">${i18n.t('play_tictactoe_title')}</h1>
      <p class="tictactoe-subtitle">${i18n.t('choose_mode')}</p>

      <div class="tictactoe-mode-buttons">
        <button class="tictactoe-mode-btn" id="btn-vs-ai">
          <span class="tictactoe-mode-title">${i18n.t('vs_ai')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-vs-friend">
          <span class="tictactoe-mode-title">${i18n.t('vs_friend')}</span>
          <span class="tictactoe-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="tictactoe-mode-btn" id="btn-find-game">
          <span class="tictactoe-mode-title">${i18n.t('find_game') || 'FIND GAME'}</span>
          <span class="tictactoe-mode-desc">${i18n.t('play_online') || 'Play against another player online'}</span>
        </button>
      </div>

      <div class="tictactoe-controls">
        <button class="tictactoe-btn tictactoe-btn-secondary tictactoe-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    navigateTo("/tictactoe-ai");
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    navigateTo("/tictactoe-friend");
  });

  document.getElementById("btn-find-game")?.addEventListener("click", () => {
    navigateTo("/tictactoe-online");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
