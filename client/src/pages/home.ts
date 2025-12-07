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
        <div id="profile-section" class="profile-section">
          <img id="profile-avatar" class="profile-avatar" src="" alt="Avatar">
          <div>
            <div id="profile-name" class="profile-name">Loading...</div>
            <div class="profile-edit-hint">Click to edit profile</div>
          </div>
        </div>

        <div class="game-buttons">
          <button id="btn-offline" class="game-btn game-btn-offline">PLAY OFFLINE</button>
          <button id="btn-online" class="game-btn game-btn-online">PLAY ONLINE</button>
        </div>
        
        <div class="game-buttons" style="margin-top: 10px;">
          <button id="btn-tournament" class="game-btn" style="background: #1a4558;">TOURNAMENTS</button>
          <button id="btn-friends" class="game-btn" style="background: #1a4558;">FRIENDS</button>
        </div>
      </div>
      <div id="modal-container"></div>
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

function setupEventListeners() {
  const profileSection = document.getElementById("profile-section");
  profileSection?.addEventListener("click", () => navigateTo("/profile"));

  const btnOffline = document.getElementById("btn-offline");
  const btnOnline = document.getElementById("btn-online");
  const btnTournament = document.getElementById("btn-tournament");
  const btnFriends = document.getElementById("btn-friends");

  btnOffline?.addEventListener("click", () => {
    navigateTo("/game");
  });

  btnOnline?.addEventListener("click", () => {
    navigateTo("/online-game");
  });

  btnTournament?.addEventListener("click", () => {
    navigateTo("/tournament");
  });

  btnFriends?.addEventListener("click", () => {
    navigateTo("/friend");
  });
}

