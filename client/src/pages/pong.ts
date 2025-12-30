import { navigateTo } from "../router";
import { isAuthenticated } from "../utils/auth";
import { i18n } from "../services/i18n";
import "../styles/pong.css";

// ============ Page Entry ============

export function renderGamePage(): string {
  setTimeout(() => {
    setupGame();
  }, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

function setupGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  // Check auth
  if (!isAuthenticated()) {
    root.innerHTML = `
      <div class="pong-start-box">
        <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
        <p class="pong-subtitle">${i18n.t('must_login')}</p>
        <div class="pong-controls">
          <button class="pong-btn pong-btn-fullwidth" id="btn-login">${i18n.t('login')}</button>
        </div>
        <div class="pong-controls">
          <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
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
    <div class="pong-start-box">
      <h1 class="pong-title">${i18n.t('play_pong_title')}</h1>
      <p class="pong-subtitle">${i18n.t('choose_mode')}</p>

      <div class="pong-mode-buttons">
        <button class="pong-mode-btn" id="btn-vs-ai">
          <span class="pong-mode-title">${i18n.t('vs_ai')}</span>
          <span class="pong-mode-desc">${i18n.t('challenge_computer')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-vs-friend">
          <span class="pong-mode-title">${i18n.t('vs_friend')}</span>
          <span class="pong-mode-desc">${i18n.t('local_2_player')}</span>
        </button>
        <button class="pong-mode-btn" id="btn-tournament">
          <span class="pong-mode-title">${i18n.t('local_tournament')}</span>
          <span class="pong-mode-desc">${i18n.t('local_tournament_desc')}</span>
        </button>
      </div>

      <div class="pong-controls">
        <button class="pong-btn pong-btn-secondary pong-btn-fullwidth" id="btn-back">BACK</button>
      </div>
    </div>
  `;

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    navigateTo("/pong-ai");
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    navigateTo("/pong-friend");
  });

  document.getElementById("btn-tournament")?.addEventListener("click", () => {
    navigateTo("/tournament");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
