// src/views/Profile.ts
import { navigate } from '../router.js';
import { authAPI, userAPI } from '../services/api.js';
import { escapeHTML } from '../utils/utils.js';
import { setCurrentUser, getUserAvatar } from '../utils/user.js';

// Helper to escape attribute values
function escapeAttr(s: string | null | undefined): string {
  if (!s) return '';
  return escapeHTML(s).replace(/"/g, '&quot;');
}

export const ProfileView = async () => {
  const wrap = document.createElement('div');

  // Check if user is authenticated
  const isAuthenticated = authAPI.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to home page if not authenticated
    navigate('/');
    return wrap;
  }

  // Load user profile data
  let profileData = null;
  let matchHistory = [];
  let friends = [];

  try {
    const profileResponse = await userAPI.getProfile();
    profileData = profileResponse.user;

    try {
      const historyResponse = await userAPI.getMatchHistory();
      matchHistory = historyResponse.matches || [];
    } catch (err) {
      console.error('Error loading match history:', err);
    }

    try {
      const friendsResponse = await userAPI.getFriends();
      friends = friendsResponse.friends || [];
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  } catch (err: any) {
    wrap.innerHTML = `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
        <h2>Error</h2>
        <p class="mt-2 text-sm text-red-400">Failed to load profile: ${err.message}</p>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70 mt-4" id="logout-btn">Logout</button>
      </div>
    `;
    setTimeout(() => {
      const logoutBtn = wrap.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          authAPI.logout();
          window.location.reload();
        });
      }
    }, 0);
    return wrap;
  }

  // Render profile with user data
  wrap.innerHTML = `
    <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65">
      <div class="flex justify-between items-center mb-6">
        <h2>My Profile</h2>
        <button class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px" id="logout-btn">Logout</button>
      </div>

      <div class="flex items-start gap-5 mt-4 flex-wrap">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 flex-1">
          <h3>Account Settings</h3>
          <form id="profile-form">
            <label class="block mb-2 text-gray-300">Display Name</label>
            <input type="text" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900" id="display-name" value="${escapeAttr(profileData?.display_name || profileData?.username)}" placeholder="Display Name">

            <label class="block mb-2 text-gray-300 mt-4">Email</label>
            <input type="email" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900" id="email" value="${escapeAttr(profileData?.email)}" placeholder="Email">

            <label class="block mb-2 text-gray-300 mt-4">Avatar</label>
            <div class="flex gap-3 items-center mb-3">
              <img id="avatar-preview" src="${getUserAvatar(profileData)}" alt="Avatar" class="w-20 h-20 rounded-full object-cover border-2 border-indigo-500">
              <div class="flex-1">
                <input type="file" id="avatar-upload" accept="image/*" class="hidden">
                <button type="button" class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px w-full mb-2" id="upload-avatar-btn">Upload Image</button>
                <input type="url" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900" id="avatar-url" value="${escapeAttr(profileData?.avatar_url)}" placeholder="Or enter avatar URL">
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-slate-700">
              <h4 class="mb-4">Change Password</h4>
              <label class="block mb-2 text-gray-300">Current Password</label>
              <input type="password" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900" id="current-password" placeholder="Current Password">

              <label class="block mb-2 text-gray-300 mt-4">New Password</label>
              <input type="password" class="rounded-xl border border-slate-400/45 bg-slate-900/90 text-gray-100 px-3 py-2 text-sm outline-none w-full transition-all duration-150 shadow-lg shadow-slate-900/75 focus:border-indigo-500 focus:shadow-indigo-500/90 focus:shadow-xl focus:-translate-y-px focus:bg-slate-900" id="new-password" placeholder="New Password">
            </div>

            <div id="profile-error" class="mt-2 text-sm text-red-400 hidden mt-4"></div>
            <div id="profile-success" class="text-green-500 mt-4 hidden">Profile updated successfully!</div>

            <button type="submit" class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-50 shadow-lg shadow-indigo-500/50 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/70 w-full mt-6">Save Changes</button>
          </form>
        </div>

        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 flex-1">
          <h3>Account Info</h3>
          <p class="mb-2"><strong>Username:</strong> ${escapeHTML(profileData?.username || 'N/A')}</p>
          <p class="mb-2"><strong>Display Name:</strong> ${escapeHTML(profileData?.display_name || profileData?.username || 'N/A')}</p>
          <p class="mb-2"><strong>Email:</strong> ${escapeHTML(profileData?.email || 'N/A')}</p>
          <p class="mb-2"><strong>Member since:</strong> ${profileData?.created_at ? escapeHTML(new Date(profileData.created_at).toLocaleDateString()) : 'N/A'}</p>
        </div>
      </div>

      <div class="flex items-start gap-5 mt-4 flex-wrap">
        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 flex-1">
          <h3>Friends (${friends.length})</h3>
          <div id="friends-list" class="min-h-[100px]">
            ${friends.length === 0
              ? '<p class="text-gray-400 text-sm">No friends yet. Add friends to play together!</p>'
              : friends.map((f: any) => `
                  <div class="p-3 bg-slate-800 rounded-lg mb-2 flex items-center gap-3">
                    ${f.avatar_url ? `<img src="${escapeAttr(f.avatar_url)}" alt="${escapeAttr(f.display_name || f.username)}" class="w-10 h-10 rounded-full object-cover" onerror="this.style.display='none';">` : ''}
                    <div>
                      <strong>${escapeHTML(f.display_name || f.username)}</strong>
                      <div class="text-gray-400 text-sm text-sm">@${escapeHTML(f.username)}</div>
                    </div>
                  </div>
                `).join('')
            }
          </div>
        </div>

        <div class="bg-slate-900/90 rounded-2xl border border-slate-400/25 shadow-2xl p-6 relative overflow-hidden backdrop-blur-lg transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-3xl hover:border-indigo-400/65 flex-1">
          <h3>Match History (${matchHistory.length})</h3>
          <div id="match-history-list" class="min-h-[100px] max-h-[400px] overflow-y-auto">
            ${matchHistory.length === 0
              ? '<p class="text-gray-400 text-sm">No matches played yet. Start playing to see your history!</p>'
              : matchHistory.map((m: any) => `
                  <div class="p-3 bg-slate-800 rounded-lg mb-2">
                    <div class="flex justify-between items-center">
                      <div>
                        <strong>vs ${escapeHTML(m.opponent_display_name || m.opponent_username || 'Unknown')}</strong>
                        <div class="text-gray-400 text-sm text-sm">${escapeHTML(new Date(m.played_at).toLocaleString())}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-semibold ${m.result === 'win' ? 'text-green-500' : m.result === 'loss' ? 'text-red-500' : 'text-gray-400'}">
                          ${m.user_score} - ${m.opponent_score}
                        </div>
                        <div class="text-gray-400 text-sm text-xs uppercase">${escapeHTML(m.result)}</div>
                      </div>
                    </div>
                  </div>
                `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  setTimeout(() => {
    setupProfileForm(wrap);
    setupLogout(wrap);
  }, 0);

  return wrap;
};

function setupProfileForm(wrap: HTMLElement) {
  const profileForm = wrap.querySelector('#profile-form') as HTMLFormElement;
  const errorDiv = wrap.querySelector('#profile-error') as HTMLElement;
  const successDiv = wrap.querySelector('#profile-success') as HTMLElement;
  const avatarUpload = wrap.querySelector('#avatar-upload') as HTMLInputElement;
  const uploadBtn = wrap.querySelector('#upload-avatar-btn') as HTMLButtonElement;
  const avatarPreview = wrap.querySelector('#avatar-preview') as HTMLImageElement;
  const avatarUrlInput = wrap.querySelector('#avatar-url') as HTMLInputElement;

  // Avatar upload handling
  uploadBtn?.addEventListener('click', () => {
    avatarUpload?.click();
  });

  avatarUpload?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      errorDiv.textContent = 'Please select an image file';
      errorDiv.style.display = 'block';
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      errorDiv.textContent = 'Image size must be less than 2MB';
      errorDiv.style.display = 'block';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (avatarPreview && event.target?.result) {
        avatarPreview.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      errorDiv.style.display = 'none';
      const response = await userAPI.uploadAvatar(file);
      if (response.user) {
        setCurrentUser(response.user);
        avatarUrlInput.value = response.user.avatar_url || '';
        successDiv.textContent = 'Avatar uploaded successfully!';
        successDiv.style.display = 'block';
      }
    } catch (err: any) {
      errorDiv.textContent = err.message || 'Failed to upload avatar';
      errorDiv.style.display = 'block';
    }
  });

  // Update preview when URL changes
  avatarUrlInput?.addEventListener('input', (e) => {
    const url = (e.target as HTMLInputElement).value;
    if (url && avatarPreview) {
      avatarPreview.src = url;
    }
    // Note: If URL is cleared, preview will show broken image which is acceptable
    // A full refresh would occur on form submit
  });

  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const displayName = (wrap.querySelector('#display-name') as HTMLInputElement)?.value;
    const email = (wrap.querySelector('#email') as HTMLInputElement)?.value;
    const avatarUrl = avatarUrlInput?.value;
    const currentPassword = (wrap.querySelector('#current-password') as HTMLInputElement)?.value;
    const newPassword = (wrap.querySelector('#new-password') as HTMLInputElement)?.value;

    const updates: any = {};
    if (displayName) updates.display_name = displayName;
    if (email) updates.email = email;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    if (newPassword) {
      if (!currentPassword) {
        errorDiv.textContent = 'Current password is required to change password';
        errorDiv.style.display = 'block';
        return;
      }
      updates.password = newPassword;
      updates.current_password = currentPassword;
    }

    try {
      const response = await userAPI.updateProfile(updates);
      setCurrentUser(response.user);
      successDiv.style.display = 'block';
      // Clear password fields
      (wrap.querySelector('#current-password') as HTMLInputElement).value = '';
      (wrap.querySelector('#new-password') as HTMLInputElement).value = '';
      // Update avatar preview if URL was changed
      if (avatarUrl && avatarPreview) {
        avatarPreview.src = avatarUrl;
      }
      // Reload after a short delay to show updated navbar
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      errorDiv.textContent = err.message || 'Failed to update profile';
      errorDiv.style.display = 'block';
    }
  });
}

function setupLogout(wrap: HTMLElement) {
  const logoutBtn = wrap.querySelector('#logout-btn') as HTMLButtonElement;
  logoutBtn?.addEventListener('click', () => {
    authAPI.logout();
    setCurrentUser(null);
    window.location.reload();
  });
}
