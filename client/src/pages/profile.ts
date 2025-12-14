import { profileService } from "../services/profile";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import { i18n } from "../services/i18n";
import { showNotification } from "../utils/notifications";
import { onlineGameService } from "../services/onlineGame";
import { getToken } from "../utils/auth";
import type { ProfileUser } from "../types/profile";
import "../styles/profile.css";

// Add styles for language buttons if not present
const style = document.createElement('style');
style.textContent = `
  .lang-select-btn {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid #2c6b87;
    color: #5db3d1;
    padding: 5px 15px;
    font-family: 'Pixel Game', monospace;
    cursor: pointer;
    transition: all 0.2s;
  }
  .lang-select-btn:hover {
    background: rgba(44, 107, 135, 0.3);
    color: white;
  }
  .lang-select-btn.active {
    background: #2c6b87;
    color: white;
    border-color: #5db3d1;
  }
`;
document.head.appendChild(style);

import backgroundImage from "../assets/images/background.jpg";

export function renderProfilePage(): string {
  setTimeout(() => {
    loadProfile();
  }, 0);

  return `
    <div class="profile-container" style="background-image: url('${backgroundImage}')">
      <div class="profile-overlay"></div>
      <div class="profile-content">
        <div id="profile-root" class="w-full max-w-[800px]">
          <div class="text-center text-white">${i18n.t('loading')}</div>
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
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <!-- Left Column: Avatar & Basic Info -->
          <div class="w-full md:w-1/3 flex flex-col items-center">
            <div class="relative group cursor-pointer mb-2" id="avatar-container" style="width: 6rem; height: 6rem;">
              <img id="avatar-img" src="${getAvatarUrl(user)}" 
                   class="profile-avatar" style="width: 100%; height: 100%;">
              <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-xs text-white font-['Pixel_Game']">${i18n.t('change')}</span>
              </div>
              <input type="file" id="avatar-input" accept="image/*" class="hidden">
            </div>
            <div class="profile-display-name text-center">${user.display_name || user.username}</div>
            <div class="profile-username text-center mb-4">@${user.username}</div>
            
            <div class="w-full">
              <label class="profile-label text-center">${i18n.t('language')}</label>
              <div class="flex gap-2 justify-center">
                <button type="button" class="lang-select-btn ${i18n.getLanguage() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
                <button type="button" class="lang-select-btn ${i18n.getLanguage() === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
                <button type="button" class="lang-select-btn ${i18n.getLanguage() === 'ar' ? 'active' : ''}" data-lang="ar">AR</button>
              </div>
            </div>
          </div>

          <!-- Right Column: Form -->
          <div class="w-full md:w-2/3">
            <form id="profile-form" class="profile-form space-y-3">
              <div class="grid grid-cols-1 gap-3">
                <div class="profile-form-group">
                  <label class="profile-label">${i18n.t('display_name')}</label>
                  <input type="text" id="display-name" value="${user.display_name || user.username}" 
                          class="profile-input">
                </div>
                <div class="profile-form-group">
                  <label class="profile-label">${i18n.t('email')}</label>
                  <input type="email" id="email" value="${user.email}" 
                          class="profile-input">
                </div>
              </div>
              
              <div class="profile-password-section pt-3 mt-3 border-t-2 border-[#2c6b87]">
                <h4 class="profile-password-title text-sm mb-2">${i18n.t('change_password')}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="password" id="current-password" placeholder="${i18n.t('current_password')}" 
                          class="profile-input">
                  <input type="password" id="new-password" placeholder="${i18n.t('new_password')}" 
                          class="profile-input">
                </div>
              </div>

              <div id="profile-msg" class="profile-message my-2"></div>

              <button type="submit" class="profile-btn py-2 text-lg">${i18n.t('save_changes')}</button>
            </form>
          </div>
        </div>

        <div class="flex justify-between items-center mt-6 pt-4 border-t-2 border-[#2c6b87]">
          <button id="btn-back" class="text-[#5db3d1] hover:text-white font-['Pixel_Game'] text-lg">← ${i18n.t('back')}</button>
          <button id="btn-logout" class="text-red-400 hover:text-red-300 font-['Pixel_Game'] text-lg">${i18n.t('logout')}</button>
        </div>
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

    document.querySelectorAll('.lang-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang;
        if (lang) {
          i18n.setLanguage(lang as any);
        }
      });
    });

    document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("profile-msg");
      if (msgEl) msgEl.textContent = i18n.t('saving');
      
      const displayName = (document.getElementById("display-name") as HTMLInputElement).value;
      const email = (document.getElementById("email") as HTMLInputElement).value;
      const currentPass = (document.getElementById("current-password") as HTMLInputElement).value;
      const newPass = (document.getElementById("new-password") as HTMLInputElement).value;

      const updates: any = { display_name: displayName, email };
      if (newPass) {
        updates.password = newPass;
        updates.current_password = currentPass;
      }

      try {
        await profileService.updateProfile(updates);
        if (msgEl) {
          msgEl.textContent = i18n.t('saved_successfully');
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-green-400";
        }
        setTimeout(() => { if(msgEl) msgEl.textContent = ""; }, 2000);
      } catch (err: any) {
        if (msgEl) {
          msgEl.textContent = err.message || i18n.t('error_saving');
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
        }
      }
    });

    // Connect to WebSocket to register as online
    const token = getToken();
    if (token) {
      onlineGameService.connect(token);
    }

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load profile.</div>';
  }
}
