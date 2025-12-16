import { homeService } from "../services/home";
import { getAvatarUrl, getDisplayName, DEFAULT_AVATAR } from "../utils/home";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { getToken } from "../utils/auth";
import type { UserProfile } from "../types/home";
import "../styles/home.css";
import backgroundImage from "../assets/images/background.jpg";

let currentUser: UserProfile | null = null;

export function renderHomePage(): string {
  setTimeout(() => {
    loadUserAndSetup();
  }, 0);

  return `
    <div class="home-container" style="background-image: url('${backgroundImage}')">
      <div class="home-overlay"></div>
      <div class="home-content">
        <!-- Main Menu -->
        <div id="home-main" class="flex flex-col gap-4 w-full max-w-[500px]">
          
            <!-- Profile Bar -->
            <div class="home-profile-bar">
              <div class="home-profile-info">
                <img id="profile-avatar" class="home-avatar" src="${DEFAULT_AVATAR}" alt="Avatar">
                <div id="profile-name" class="home-username">${i18n.t('loading')}</div>
              </div>
              <div class="home-quick-actions">
                <button id="btn-profile" class="home-action-btn" title="${i18n.t('edit_profile')}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                <button id="btn-stats" class="home-action-btn" title="${i18n.t('statistics')}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </button>
                <button id="btn-friends" class="home-action-btn" title="${i18n.t('friends')}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>
                <button id="btn-customize" class="home-action-btn" title="${i18n.t('customize_board')}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5"></circle>
                    <circle cx="17.5" cy="10.5" r=".5"></circle>
                    <circle cx="8.5" cy="7.5" r=".5"></circle>
                    <circle cx="6.5" cy="12.5" r=".5"></circle>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="home-controls">
              <button id="btn-pong" class="home-btn home-btn-fullwidth">${i18n.t('play_pong')}</button>
            </div>
            <div class="home-controls">
              <button id="btn-tictactoe" class="home-btn home-btn-fullwidth">${i18n.t('play_tictactoe')}</button>
            </div>
        </div>
      </div>
    </div>
  `;
}

async function loadUserAndSetup() {
  try {
    currentUser = await homeService.getCurrentUser();
    updateProfileDisplay();
    setupEventListeners();
  } catch (error) {
    console.error("Failed to load user:", error);
    navigateTo("/auth");
  }
}

function updateProfileDisplay() {
  if (!currentUser) return;

  const avatarEl = document.getElementById("profile-avatar") as HTMLImageElement;
  const nameEl = document.getElementById("profile-name");

  if (avatarEl) {
    const avatarSrc = getAvatarUrl(currentUser);
    avatarEl.src = avatarSrc;
    avatarEl.onerror = () => {
      avatarEl.src = DEFAULT_AVATAR;
    };
  }
  if (nameEl) {
    nameEl.textContent = getDisplayName(currentUser);
  }
}

function setupEventListeners() {
  // Profile bar actions
  document.getElementById("btn-profile")?.addEventListener("click", () => navigateTo("/profile"));
  document.getElementById("btn-stats")?.addEventListener("click", () => navigateTo("/stats"));
  document.getElementById("btn-friends")?.addEventListener("click", () => navigateTo("/friend"));
  document.getElementById("btn-customize")?.addEventListener("click", () => navigateTo("/customize-board"));

  // Game buttons
  document.getElementById("btn-pong")?.addEventListener("click", () => navigateTo("/pong"));
  document.getElementById("btn-tictactoe")?.addEventListener("click", () => navigateTo("/tictactoe"));
}

