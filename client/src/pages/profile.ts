import { profileService } from "../services/profile";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import { i18n } from "../services/i18n";
import { showNotification } from "../utils/notifications";
import type { ProfileUser } from "../types/profile";
import "../styles/profile.css";

export function renderProfilePage(): string {
  setTimeout(() => {
    loadProfile();
  }, 0);

  return `
    <div class="profile-container">
      <div class="profile-overlay"></div>
      <div class="profile-content">
        <div id="profile-root" class="w-full flex justify-center items-center min-h-[300px]">
          <svg style="color: #5db3d1; animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
        </div>
      </div>
    </div>
  `;
}

async function loadProfile() {
  const root = document.getElementById("profile-root");
  if (!root) return;

  try {
    const profileResponse = await profileService.getProfile();
    const user: ProfileUser = profileResponse.user;

    root.innerHTML = `
      <div class="profile-box">
        <h2 class="profile-title">${i18n.t('my_profile')}</h2>
        
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar-container" id="avatar-container">
              <img id="avatar-img" src="${getAvatarUrl(user)}" 
                   class="profile-avatar" alt="Profile Avatar">
              <div class="profile-avatar-overlay">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>${i18n.t('change')}</span>
              </div>
              <input type="file" id="avatar-input" accept="image/*" class="hidden">
            </div>
          </div>
          <div class="profile-header-info">
            <div class="profile-display-name">${user.display_name || user.username}</div>
            <div class="profile-username">@${user.username}</div>
          </div>
        </div>

        <!-- Profile Form -->
        <form id="profile-form" class="profile-form">
          <div class="profile-section">
            <h3 class="profile-section-title">${i18n.t('account_details')}</h3>
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t('display_name')}</label>
                <input type="text" id="display-name" value="${user.display_name || user.username}" 
                        class="profile-input" placeholder="${i18n.t('display_name')}">
              </div>
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t('email')}</label>
                <input type="email" id="email" value="${user.email}" 
                        class="profile-input" placeholder="${i18n.t('email')}">
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <h3 class="profile-section-title">${i18n.t('language')}</h3>
            <div class="profile-language-buttons">
              <button type="button" class="profile-lang-btn ${i18n.getLanguage() === 'en' ? 'active' : ''}" data-lang="en">English</button>
              <button type="button" class="profile-lang-btn ${i18n.getLanguage() === 'fr' ? 'active' : ''}" data-lang="fr">Français</button>
              <button type="button" class="profile-lang-btn ${i18n.getLanguage() === 'ar' ? 'active' : ''}" data-lang="ar">العربية</button>
            </div>
          </div>

          <div class="profile-section">
            <h3 class="profile-section-title">${i18n.t('change_password')}</h3>
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t('current_password')}</label>
                <input type="password" id="current-password" placeholder="••••••••" 
                        class="profile-input">
              </div>
              <div class="profile-form-group">
                <label class="profile-label">${i18n.t('new_password')}</label>
                <input type="password" id="new-password" placeholder="••••••••" 
                        class="profile-input">
              </div>
            </div>
            <div class="profile-password-hint">${i18n.t('leave_blank_to_keep')}</div>
          </div>

          <div id="profile-msg" class="profile-message"></div>

          <div class="profile-actions">
            <button type="button" id="btn-back" class="profile-back-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              ${i18n.t('back')}
            </button>
            <button type="submit" class="profile-save-btn">${i18n.t('save_changes')}</button>
            <button type="button" id="btn-logout" class="profile-logout-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              ${i18n.t('logout')}
            </button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      authService.logout();
      navigateTo("/auth");
    });

    // Avatar Upload
    const avatarContainer = document.getElementById("avatar-container");
    const avatarInput = document.getElementById("avatar-input") as HTMLInputElement;
    const avatarImg = document.getElementById("avatar-img") as HTMLImageElement;

    avatarContainer?.addEventListener("click", () => avatarInput?.click());

    avatarInput?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const res = await profileService.uploadAvatar(file);
        if (res.user) {
          avatarImg.src = getAvatarUrl(res.user);
        }
      } catch (err) {
        showNotification("Failed to upload avatar", { type: 'error' });
      }
    });

    document.querySelectorAll('.profile-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("profile-msg");

      const displayName = (document.getElementById("display-name") as HTMLInputElement).value;
      const email = (document.getElementById("email") as HTMLInputElement).value;
      const currentPass = (document.getElementById("current-password") as HTMLInputElement).value;
      const newPass = (document.getElementById("new-password") as HTMLInputElement).value;
      const activeLangBtn = document.querySelector('.profile-lang-btn.active') as HTMLElement;
      const newLang = activeLangBtn?.dataset.lang;

      // Check if anything changed
      const hasProfileChanges = displayName !== (user.display_name || user.username) || email !== user.email || newPass;
      const hasLangChange = newLang && newLang !== i18n.getLanguage();

      if (!hasProfileChanges && !hasLangChange) {
        if (msgEl) {
          msgEl.textContent = i18n.t('no_changes');
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-[#5db3d1]";
          setTimeout(() => { if(msgEl) msgEl.textContent = ""; }, 2000);
        }
        return;
      }

      // Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (msgEl) {
          msgEl.textContent = i18n.t('invalid_email');
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
        }
        return;
      }

      if (newPass) {
        if (newPass.length < 8) {
          if (msgEl) {
            msgEl.textContent = i18n.t('password_too_short');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
          }
          return;
        }
        if (newPass.length > 64) {
          if (msgEl) {
            msgEl.textContent = i18n.t('password_too_long');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
          }
          return;
        }
        if (!/[0-9]/.test(newPass)) {
          if (msgEl) {
            msgEl.textContent = i18n.t('password_needs_number');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
          }
          return;
        }
        if (!/[A-Z]/.test(newPass)) {
          if (msgEl) {
            msgEl.textContent = i18n.t('password_needs_uppercase');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
          }
          return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPass)) {
          if (msgEl) {
            msgEl.textContent = i18n.t('password_needs_special');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
          }
          return;
        }
      }

      const profileBox = document.querySelector('.profile-box') as HTMLElement;

      // Show loading overlay with spinner
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'profile-loading-overlay';
      loadingOverlay.innerHTML = `
        <svg class="profile-spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      `;
      profileBox?.appendChild(loadingOverlay);
      if (msgEl) msgEl.textContent = '';

      const updates: any = { display_name: displayName, email };
      if (newPass) {
        updates.password = newPass;
        updates.current_password = currentPass;
      }

      try {
        // Run API call and minimum delay in parallel
        await Promise.all([
          profileService.updateProfile(updates),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);

        if (hasLangChange) {
          i18n.setLanguage(newLang as any);
        } else {
          loadingOverlay.remove();
          if (msgEl) {
            msgEl.textContent = i18n.t('saved_successfully');
            msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-green-400";
          }
          setTimeout(() => { if(msgEl) msgEl.textContent = ""; }, 2000);
        }
      } catch (err: any) {
        loadingOverlay.remove();
        if (msgEl) {
          msgEl.textContent = err.message || i18n.t('error_saving');
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
        }
      }
    });

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load profile.</div>';
  }
}
