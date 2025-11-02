// src/views/Profile.ts
import { authAPI, userAPI } from '../api.js';
import { escapeHTML } from '../utils.js';
import { setCurrentUser, getUserAvatar } from '../user-state.js';

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
    wrap.innerHTML = `
      <div class="card">
        <h2>My Profile</h2>
        <p class="muted">Please log in or register to view your profile.</p>
        <div class="row" style="margin-top:24px;">
          <div class="card" style="flex:1;">
            <h3>Login</h3>
            <form id="login-form">
              <input type="text" class="input-field" id="login-username" placeholder="Username" required>
              <input type="password" class="input-field" id="login-password" placeholder="Password" required>
              <div id="login-error" class="error-message" style="display:none;"></div>
              <button type="submit" class="btn primary" style="width:100%;">Login</button>
            </form>
          </div>
          <div class="card" style="flex:1;">
            <h3>Register</h3>
            <form id="register-form">
              <input type="text" class="input-field" id="register-username" placeholder="Username" required>
              <input type="email" class="input-field" id="register-email" placeholder="Email" required>
              <input type="text" class="input-field" id="register-display-name" placeholder="Display Name (optional)">
              <input type="password" class="input-field" id="register-password" placeholder="Password" required>
              <div id="register-error" class="error-message" style="display:none;"></div>
              <button type="submit" class="btn primary" style="width:100%;">Register</button>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for login/register
    setTimeout(() => {
      setupAuthForms(wrap);
    }, 0);
    
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
  } catch (err) {
    wrap.innerHTML = `
      <div class="card">
        <h2>Error</h2>
        <p class="error-message">Failed to load profile: ${err.message}</p>
        <button class="btn primary" id="logout-btn" style="margin-top:16px;">Logout</button>
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
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <h2>My Profile</h2>
        <button class="btn outline" id="logout-btn">Logout</button>
      </div>
      
      <div class="row" style="margin-top:16px;">
        <div class="card" style="flex:1;">
          <h3>Account Settings</h3>
          <form id="profile-form">
            <label style="display:block; margin-bottom:8px; color:#ddd;">Display Name</label>
            <input type="text" class="input-field" id="display-name" value="${escapeAttr(profileData?.display_name || profileData?.username)}" placeholder="Display Name">
            
            <label style="display:block; margin-bottom:8px; color:#ddd; margin-top:16px;">Email</label>
            <input type="email" class="input-field" id="email" value="${escapeAttr(profileData?.email)}" placeholder="Email">
            
            <label style="display:block; margin-bottom:8px; color:#ddd; margin-top:16px;">Avatar</label>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
              <img id="avatar-preview" src="${getUserAvatar(profileData)}" alt="Avatar" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #5e81f4;">
              <div style="flex:1;">
                <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
                <button type="button" class="btn outline" id="upload-avatar-btn" style="width:100%; margin-bottom:8px;">Upload Image</button>
                <input type="url" class="input-field" id="avatar-url" value="${escapeAttr(profileData?.avatar_url)}" placeholder="Or enter avatar URL">
              </div>
            </div>
            
            <div style="margin-top:24px; padding-top:24px; border-top:1px solid #333;">
              <h4 style="margin-bottom:16px;">Change Password</h4>
              <label style="display:block; margin-bottom:8px; color:#ddd;">Current Password</label>
              <input type="password" class="input-field" id="current-password" placeholder="Current Password">
              
              <label style="display:block; margin-bottom:8px; color:#ddd; margin-top:16px;">New Password</label>
              <input type="password" class="input-field" id="new-password" placeholder="New Password">
            </div>
            
            <div id="profile-error" class="error-message" style="display:none; margin-top:16px;"></div>
            <div id="profile-success" style="color:#4caf50; margin-top:16px; display:none;">Profile updated successfully!</div>
            
            <button type="submit" class="btn primary" style="width:100%; margin-top:24px;">Save Changes</button>
          </form>
        </div>
        
        <div class="card" style="flex:1;">
          <h3>Account Info</h3>
          <p style="margin-bottom:8px;"><strong>Username:</strong> ${escapeHTML(profileData?.username || 'N/A')}</p>
          <p style="margin-bottom:8px;"><strong>Display Name:</strong> ${escapeHTML(profileData?.display_name || profileData?.username || 'N/A')}</p>
          <p style="margin-bottom:8px;"><strong>Email:</strong> ${escapeHTML(profileData?.email || 'N/A')}</p>
          <p style="margin-bottom:8px;"><strong>Member since:</strong> ${profileData?.created_at ? escapeHTML(new Date(profileData.created_at).toLocaleDateString()) : 'N/A'}</p>
        </div>
      </div>

      <div class="row" style="margin-top:16px;">
        <div class="card" style="flex:1;">
          <h3>Friends (${friends.length})</h3>
          <div id="friends-list" style="min-height:100px;">
            ${friends.length === 0 
              ? '<p class="muted">No friends yet. Add friends to play together!</p>' 
              : friends.map(f => `
                  <div style="padding:12px; background:#333; border-radius:8px; margin-bottom:8px; display:flex; align-items:center; gap:12px;">
                    ${f.avatar_url ? `<img src="${escapeAttr(f.avatar_url)}" alt="${escapeAttr(f.display_name || f.username)}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" onerror="this.style.display='none';">` : ''}
                    <div>
                      <strong>${escapeHTML(f.display_name || f.username)}</strong>
                      <div class="muted" style="font-size:14px;">@${escapeHTML(f.username)}</div>
                    </div>
                  </div>
                `).join('')
            }
          </div>
        </div>
        
        <div class="card" style="flex:1;">
          <h3>Match History (${matchHistory.length})</h3>
          <div id="match-history-list" style="min-height:100px; max-height:400px; overflow-y:auto;">
            ${matchHistory.length === 0 
              ? '<p class="muted">No matches played yet. Start playing to see your history!</p>' 
              : matchHistory.map(m => `
                  <div style="padding:12px; background:#333; border-radius:8px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <strong>vs ${escapeHTML(m.opponent_display_name || m.opponent_username || 'Unknown')}</strong>
                        <div class="muted" style="font-size:14px;">${escapeHTML(new Date(m.played_at).toLocaleString())}</div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-size:20px; font-weight:600; color:${m.result === 'win' ? '#4caf50' : m.result === 'loss' ? '#e74c3c' : '#aaa'};">
                          ${m.user_score} - ${m.opponent_score}
                        </div>
                        <div class="muted" style="font-size:12px; text-transform:uppercase;">${escapeHTML(m.result)}</div>
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

function setupAuthForms(wrap: HTMLElement) {
  const loginForm = wrap.querySelector('#login-form') as HTMLFormElement;
  const registerForm = wrap.querySelector('#register-form') as HTMLFormElement;
  const loginError = wrap.querySelector('#login-error') as HTMLElement;
  const registerError = wrap.querySelector('#register-error') as HTMLElement;
  
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    
    const username = (wrap.querySelector('#login-username') as HTMLInputElement)?.value;
    const password = (wrap.querySelector('#login-password') as HTMLInputElement)?.value;
    
    try {
      const data = await authAPI.login(username, password);
      setCurrentUser(data.user);
      // Reload to show updated navbar
      window.location.reload();
    } catch (err: any) {
      loginError.textContent = err.message || 'Login failed';
      loginError.style.display = 'block';
    }
  });
  
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.style.display = 'none';
    
    const username = (wrap.querySelector('#register-username') as HTMLInputElement)?.value;
    const email = (wrap.querySelector('#register-email') as HTMLInputElement)?.value;
    const displayName = (wrap.querySelector('#register-display-name') as HTMLInputElement)?.value;
    const password = (wrap.querySelector('#register-password') as HTMLInputElement)?.value;
    
    try {
      const data = await authAPI.register(username, email, password, displayName || undefined);
      setCurrentUser(data.user);
      // Reload to show updated navbar
      window.location.reload();
    } catch (err: any) {
      registerError.textContent = err.message || 'Registration failed';
      registerError.style.display = 'block';
    }
  });
}

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
    } else {
      // Get default avatar
      const currentUser = wrap.querySelector('#account-info')?.textContent;
      // This is a bit hacky, but we'll refresh the preview properly on form submit
    }
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
