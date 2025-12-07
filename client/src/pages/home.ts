import { homeService } from "../services/home";
import { getAvatarUrl, getDisplayName } from "../utils/home";
import { navigateTo } from "../router";
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
                <img id="profile-avatar" class="home-avatar" src="" alt="Avatar">
                <div id="profile-name" class="home-username">Loading...</div>
              </div>
              <div class="home-quick-actions">
                <button id="btn-profile" class="home-action-btn" title="Edit Profile">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
                <button id="btn-stats" class="home-action-btn" title="Statistics">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </button>
                <button id="btn-friends" class="home-action-btn" title="Friends">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="home-controls">
              <button id="btn-offline" class="home-btn home-btn-fullwidth">PLAY OFFLINE</button>
            </div>
            <div class="home-controls">
              <button id="btn-online" class="home-btn home-btn-fullwidth">PLAY ONLINE</button>
            </div>  
        </div>

        <!-- Online Mode Selection (hidden by default) -->
        <div id="home-online" class="home-box hidden">
          <h1 class="home-title">PLAY ONLINE</h1>
          <p class="home-subtitle">Choose your game mode</p>

          <div class="home-controls">
            <button id="btn-vs-friend" class="home-btn home-btn-fullwidth">VS FRIEND</button>
          </div>
          <div class="home-controls">
            <button id="btn-random" class="home-btn home-btn-fullwidth">RANDOM MATCH</button>
          </div>
          <div class="home-controls">
            <button id="btn-tournament" class="home-btn home-btn-fullwidth">TOURNAMENT</button>
          </div>
          <div class="home-controls">
            <button id="btn-back" class="home-btn home-btn-secondary home-btn-fullwidth">BACK</button>
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
    avatarEl.src = getAvatarUrl(currentUser);
  }
  if (nameEl) {
    nameEl.textContent = getDisplayName(currentUser);
  }
}

function showOnlineView() {
  const mainView = document.getElementById("home-main");
  const onlineView = document.getElementById("home-online");
  if (mainView && onlineView) {
    mainView.classList.add("hidden");
    onlineView.classList.remove("hidden");
  }
}

function showMainView() {
  const mainView = document.getElementById("home-main");
  const onlineView = document.getElementById("home-online");
  if (mainView && onlineView) {
    onlineView.classList.add("hidden");
    mainView.classList.remove("hidden");
  }
}

function setupEventListeners() {
  // Profile bar actions
  document.getElementById("btn-profile")?.addEventListener("click", () => navigateTo("/profile"));
  document.getElementById("btn-stats")?.addEventListener("click", () => navigateTo("/stats"));
  document.getElementById("btn-friends")?.addEventListener("click", () => navigateTo("/friend"));

  // Game buttons
  document.getElementById("btn-offline")?.addEventListener("click", () => navigateTo("/game"));
  document.getElementById("btn-online")?.addEventListener("click", () => showOnlineView());

  // Online view options
  document.getElementById("btn-vs-friend")?.addEventListener("click", () => navigateTo("/friend"));
  document.getElementById("btn-random")?.addEventListener("click", () => navigateTo("/online-game"));
  document.getElementById("btn-tournament")?.addEventListener("click", () => navigateTo("/tournament"));

  // Back button
  document.getElementById("btn-back")?.addEventListener("click", () => showMainView());
}

