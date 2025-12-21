import { navigateTo } from '../router';
import { authService } from '../services/auth';

export async function initializeProfileIndicator(): Promise<void> {
  const backBtn = document.getElementById('profile-indicator-back');
  const homeBtn = document.getElementById('profile-indicator-home');
  const logoutBtn = document.getElementById('profile-indicator-logout');
  const profileContainer = document.getElementById('profile-indicator-user');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      navigateTo('/home');
    });
  }

  if (profileContainer) {
    profileContainer.addEventListener('click', () => {
      navigateTo('/profile');
    });
    profileContainer.style.cursor = 'pointer';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authService.logout();
      navigateTo('/');
    });
  }

  await loadUserData();
}

async function loadUserData(): Promise<void> {
  try {
    const response = await fetch('/api/users/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    updateProfileIndicator(userData);
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

function updateProfileIndicator(userData: any): void {
  const avatarElement = document.getElementById('profile-indicator-avatar') as HTMLImageElement;
  const usernameElement = document.getElementById('profile-indicator-username');

  if (avatarElement && userData.avatar) {
    avatarElement.src = userData.avatar;
  }

  if (usernameElement && userData.display_name) {
    usernameElement.textContent = userData.display_name;
  }
}

export function renderProfileIndicator(): string {
  return `
    <div class="profile-indicator">
      <div class="profile-indicator-left">
        <button id="profile-indicator-back" class="profile-indicator-btn" title="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <button id="profile-indicator-home" class="profile-indicator-btn" title="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>
      <div class="profile-indicator-center" id="profile-indicator-user">
        <img id="profile-indicator-avatar" class="profile-indicator-avatar" src="/default-avatar.png" alt="Avatar">
        <span id="profile-indicator-username" class="profile-indicator-username">Loading...</span>
      </div>
      <div class="profile-indicator-right">
        <button id="profile-indicator-logout" class="profile-indicator-logout-btn" title="Logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  `;
}
