import { profileService } from "../services/profile";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import type { ProfileUser } from "../types/profile";
import "../styles/profile.css";
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
          <div class="text-center text-white">Loading profile...</div>
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
        <h2 class="profile-title">MY PROFILE</h2>
        
        <div class="profile-avatar-section">
          <div class="relative mx-auto mb-2 group cursor-pointer" id="avatar-container" style="width: 6rem; height: 6rem;">
            <img id="avatar-img" src="${getAvatarUrl(user)}" 
                 class="profile-avatar" style="width: 100%; height: 100%;">
            <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="text-xs text-white font-['Pixel_Game']">CHANGE</span>
            </div>
            <input type="file" id="avatar-input" accept="image/*" class="hidden">
          </div>
          <div class="profile-display-name">${user.display_name || user.username}</div>
          <div class="profile-username">@${user.username}</div>
        </div>

        <form id="profile-form" class="profile-form">
          <div class="profile-form-group">
            <label class="profile-label">DISPLAY NAME</label>
            <input type="text" id="display-name" value="${user.display_name || user.username}" 
                   class="profile-input">
          </div>
          <div class="profile-form-group">
            <label class="profile-label">EMAIL</label>
            <input type="email" id="email" value="${user.email}" 
                   class="profile-input">
          </div>
          
          <div class="profile-password-section">
            <h4 class="profile-password-title">CHANGE PASSWORD</h4>
            <input type="password" id="current-password" placeholder="Current Password" 
                   class="profile-input mb-2">
            <input type="password" id="new-password" placeholder="New Password" 
                   class="profile-input">
          </div>

          <div id="profile-msg" class="profile-message"></div>

          <button type="submit" class="profile-btn">SAVE CHANGES</button>
        </form>

        <div class="profile-footer">
          <button id="btn-back" class="profile-back-btn">BACK</button>
        </div>
        
        <div class="mt-4 text-center">
          <button id="btn-logout" class="profile-logout-btn">LOGOUT</button>
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
        alert("Failed to upload avatar");
      }
    });

    document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("profile-msg");
      if (msgEl) msgEl.textContent = "Saving...";
      
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
          msgEl.textContent = "Saved successfully!";
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-green-400";
        }
        setTimeout(() => { if(msgEl) msgEl.textContent = ""; }, 2000);
      } catch (err: any) {
        if (msgEl) {
          msgEl.textContent = err.message || "Error saving profile";
          msgEl.className = "text-center font-['Pixel_Game'] text-sm h-5 text-red-400";
        }
      }
    });

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load profile.</div>';
  }
}
