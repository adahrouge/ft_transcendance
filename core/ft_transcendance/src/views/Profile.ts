// src/views/Profile.ts
export const ProfileView = () => {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="card">
      <h2>My Profile</h2>
      <p class="muted">This is a placeholder. We’ll connect it to the backend later (OAuth / user management).</p>

      <div class="row" style="margin-top:16px;">
        <div class="card" style="flex:1;">
          <h3>Account</h3>
          <p class="muted">Display name, email, password, 2FA (coming soon)</p>
        </div>
        <div class="card" style="flex:1;">
          <h3>Avatar</h3>
          <p class="muted">Upload/change avatar (coming soon)</p>
        </div>
      </div>

      <div class="row" style="margin-top:16px;">
        <div class="card" style="flex:1;">
          <h3>Friends</h3>
          <p class="muted">Friend list & online status (coming soon)</p>
        </div>
        <div class="card" style="flex:1;">
          <h3>Match History</h3>
          <p class="muted">1v1 results with dates & stats (coming soon)</p>
        </div>
      </div>
    </div>
  `;
  return wrap;
};
