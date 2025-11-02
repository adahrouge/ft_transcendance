// src/navbar.ts - Navbar user display management

import { getUserAvatar } from './user-state';
import { escapeHTML } from './utils';
import type { User } from './user-state';

export function updateNavbarUser(user: User | null) {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  if (user) {
    // User is logged in - show profile
    const avatarUrl = getUserAvatar(user);
    const displayName = user.display_name || user.username;
    
    headerActions.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-right:12px;">
        <div style="display:flex; flex-direction:column; align-items:flex-end;">
          <span style="font-size:14px; font-weight:500; color:#fff;">${escapeHTML(displayName)}</span>
          <span style="font-size:11px; color:#aaa;">@${escapeHTML(user.username)}</span>
        </div>
        <a href="/profile" data-link style="display:block;">
          <img src="${escapeHTML(avatarUrl)}" 
               alt="${escapeHTML(displayName)}" 
               style="width:40px; height:40px; border-radius:50%; border:2px solid #5e81f4; cursor:pointer; object-fit:cover;"
               title="View Profile" />
        </a>
      </div>
      <a href="/" data-link class="btn ghost">Home</a>
      <a href="/profile" data-link class="btn outline">My Profile</a>
    `;
  } else {
    // User is not logged in
    headerActions.innerHTML = `
      <a href="/" data-link class="btn ghost">Home</a>
      <a href="/profile" data-link class="btn outline">My Profile</a>
    `;
  }
}

