import { isAuthenticated, getToken } from "../utils/auth";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import defaultAvatar from "../assets/images/profile.png";

interface UserInfo {
  username: string;
  display_name?: string;
  avatar_url?: string;
}

let cachedUser: UserInfo | null = null;
let dropdownOpen = false;

export function renderNavbar(): string {
  if (!isAuthenticated()) {
    return '';
  }

  return `
    <nav class="navbar" id="main-navbar">
      <div class="navbar-container">
        <div class="navbar-left">
          <a href="/home" class="navbar-home-btn" data-navlink>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </a>
        </div>
        
        <div class="navbar-center">
          <a href="/home" class="navbar-title" data-navlink>TRANSCENDENCE</a>
        </div>
        
        <div class="navbar-right">
          <div class="navbar-profile" id="navbar-profile">
            <button class="navbar-profile-btn" id="navbar-profile-btn">
              <img src="${defaultAvatar}" alt="Profile" class="navbar-avatar" id="navbar-avatar">
              <span class="navbar-username" id="navbar-username">${i18n.t('loading')}</span>
              <svg class="navbar-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div class="navbar-dropdown" id="navbar-dropdown">
              <a href="/profile" class="navbar-dropdown-item" data-navlink>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${i18n.t('my_profile') || 'My Profile'}</span>
              </a>
              <a href="/stats" class="navbar-dropdown-item" data-navlink>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>${i18n.t('statistics') || 'Statistics'}</span>
              </a>
              <a href="/friend" class="navbar-dropdown-item" data-navlink>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>${i18n.t('friends') || 'Friends'}</span>
              </a>
              <a href="/customize-board" class="navbar-dropdown-item" data-navlink>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5"></circle>
                  <circle cx="17.5" cy="10.5" r=".5"></circle>
                  <circle cx="8.5" cy="7.5" r=".5"></circle>
                  <circle cx="6.5" cy="12.5" r=".5"></circle>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                </svg>
                <span>${i18n.t('customize_board') || 'Customize'}</span>
              </a>
              <div class="navbar-dropdown-divider"></div>
              <button class="navbar-dropdown-item navbar-logout" id="navbar-logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>${i18n.t('logout') || 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

export async function initializeNavbar() {
  if (!isAuthenticated()) return;

  try {
    // Fetch user info
    const response = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      cachedUser = data.user;
      updateNavbarUI();
    }
  } catch (error) {
    console.error('Failed to fetch user for navbar:', error);
  }

  setupNavbarEvents();
}

function updateNavbarUI() {
  if (!cachedUser) return;

  const avatarEl = document.getElementById('navbar-avatar') as HTMLImageElement;
  const usernameEl = document.getElementById('navbar-username');

  if (avatarEl) {
    if (cachedUser.avatar_url && cachedUser.avatar_url.trim() !== '') {
      avatarEl.src = cachedUser.avatar_url;
    }
    avatarEl.onerror = () => {
      avatarEl.src = defaultAvatar;
    };
  }

  if (usernameEl) {
    usernameEl.textContent = cachedUser.display_name || cachedUser.username;
  }
}

function setupNavbarEvents() {
  const profileBtn = document.getElementById('navbar-profile-btn');
  const dropdown = document.getElementById('navbar-dropdown');
  const logoutBtn = document.getElementById('navbar-logout');

  // Toggle dropdown
  profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    dropdown?.classList.toggle('open', dropdownOpen);
    profileBtn.classList.toggle('active', dropdownOpen);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const navbar = document.getElementById('main-navbar');
    if (navbar && !navbar.contains(e.target as Node)) {
      dropdownOpen = false;
      dropdown?.classList.remove('open');
      profileBtn?.classList.remove('active');
    }
  });

  // Handle navigation links
  document.querySelectorAll('[data-navlink]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (href) {
        dropdownOpen = false;
        dropdown?.classList.remove('open');
        profileBtn?.classList.remove('active');
        navigateTo(href);
      }
    });
  });

  // Logout handler
  logoutBtn?.addEventListener('click', () => {
    cachedUser = null;
    dropdownOpen = false;
    authService.logout();
  });
}

export function clearNavbarCache() {
  cachedUser = null;
}
