import { profileService } from "../services/profile";
import { authService } from "../services/auth";
import { navigateTo } from "../router";
import type { ProfileUser, MatchHistoryItem, Friend } from "../types/profile";
import "../styles/profile.css";
import backgroundImage from "../assets/images/background.jpg";

export function renderProfilePage(): string {
  setTimeout(() => {
    loadProfile();
  }, 0);

  return `
    <div class="home-container" style="background-image: url('${backgroundImage}')">
      <div class="home-overlay"></div>
      <div class="home-content" style="max-width: 800px; width: 100%;">
        <div id="profile-root" class="w-full">
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

    let matchHistory: MatchHistoryItem[] = [];
    try {
      const historyResponse = await profileService.getMatchHistory();
      matchHistory = historyResponse.matches || [];
    } catch (e) { console.error(e); }

    let friends: Friend[] = [];
    try {
      const friendsResponse = await profileService.getFriends();
      friends = friendsResponse.friends || [];
    } catch (e) { console.error(e); }

    root.innerHTML = `
      <div class="bg-[#0a1929]/95 p-6 border-4 border-[#3d8aa8] text-center relative">
        <h2 class="text-[#e0f7ff] font-['Pixel_Game'] text-3xl mb-6">MY PROFILE</h2>
        
        <div class="flex flex-col md:flex-row gap-6 text-left">
          <!-- Left Col: Info & Edit -->
          <div class="flex-1">
            <div class="mb-6 text-center">
              <div class="relative w-24 h-24 mx-auto mb-2 group cursor-pointer" id="avatar-container">
                <img id="avatar-img" src="${user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzJjNmI4NyIvPjwvc3ZnPg=='}" 
                     class="w-full h-full rounded-full border-2 border-[#5db3d1] object-cover">
                <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-xs text-white font-['Pixel_Game']">CHANGE</span>
                </div>
                <input type="file" id="avatar-input" accept="image/*" class="hidden">
              </div>
              <div class="text-[#e0f7ff] font-['Pixel_Game'] text-xl">${user.display_name || user.username}</div>
              <div class="text-[#5db3d1] font-['Pixel_Game'] text-sm">@${user.username}</div>
            </div>

            <form id="profile-form" class="space-y-4">
              <div>
                <label class="block text-[#5db3d1] font-['Pixel_Game'] text-sm mb-1">DISPLAY NAME</label>
                <input type="text" id="display-name" value="${user.display_name || user.username}" 
                       class="w-full bg-[#0d1a28] border border-[#2c6b87] text-[#e0f7ff] px-3 py-2 font-['Pixel_Game'] focus:outline-none focus:border-[#4a9dc0]">
              </div>
              <div>
                <label class="block text-[#5db3d1] font-['Pixel_Game'] text-sm mb-1">EMAIL</label>
                <input type="email" id="email" value="${user.email}" 
                       class="w-full bg-[#0d1a28] border border-[#2c6b87] text-[#e0f7ff] px-3 py-2 font-['Pixel_Game'] focus:outline-none focus:border-[#4a9dc0]">
              </div>
              
              <div class="pt-4 border-t border-[#2c6b87]">
                <h4 class="text-[#e0f7ff] font-['Pixel_Game'] mb-2">CHANGE PASSWORD</h4>
                <input type="password" id="current-password" placeholder="Current Password" 
                       class="w-full bg-[#0d1a28] border border-[#2c6b87] text-[#e0f7ff] px-3 py-2 font-['Pixel_Game'] mb-2 focus:outline-none focus:border-[#4a9dc0]">
                <input type="password" id="new-password" placeholder="New Password" 
                       class="w-full bg-[#0d1a28] border border-[#2c6b87] text-[#e0f7ff] px-3 py-2 font-['Pixel_Game'] focus:outline-none focus:border-[#4a9dc0]">
              </div>

              <div id="profile-msg" class="text-center font-['Pixel_Game'] text-sm h-5"></div>

              <button type="submit" class="w-full bg-[#2c6b87] text-white font-['Pixel_Game'] py-2 hover:bg-[#3d8aa8] transition-colors">SAVE CHANGES</button>
            </form>
          </div>

          <!-- Right Col: Stats & Friends -->
          <div class="flex-1 space-y-6">
            <div>
              <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2 border-b border-[#2c6b87] pb-1">MATCH HISTORY</h3>
              <div class="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                ${matchHistory.length === 0 ? '<p class="text-gray-500 text-sm">No matches yet.</p>' : matchHistory.map(m => `
                  <div class="bg-[#0d1a28] p-2 border border-[#2c6b87] flex justify-between items-center">
                    <span class="text-[#e0f7ff] text-sm">vs ${m.opponent_username || 'Unknown'}</span>
                    <span class="${m.result === 'win' ? 'text-green-400' : 'text-red-400'} font-['Pixel_Game']">${m.user_score}-${m.opponent_score}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <h3 class="text-[#5db3d1] font-['Pixel_Game'] text-lg mb-2 border-b border-[#2c6b87] pb-1">FRIENDS</h3>
              <div class="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                ${friends.length === 0 ? '<p class="text-gray-500 text-sm">No friends yet.</p>' : friends.map(f => `
                  <div class="bg-[#0d1a28] p-2 border border-[#2c6b87] flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    <span class="text-[#e0f7ff] text-sm">${f.username}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-between">
          <button id="btn-back" class="text-[#5db3d1] hover:text-white font-['Pixel_Game']">← BACK</button>
          <button id="btn-logout" class="text-red-400 hover:text-red-300 font-['Pixel_Game']">LOGOUT</button>
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
        if (res.user && res.user.avatar_url) {
          avatarImg.src = res.user.avatar_url;
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
