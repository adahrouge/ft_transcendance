// Navbar user display management

import { getUserAvatar } from '../utils/user.js';
import { escapeHTML } from '../utils/utils.js';
import type { User } from '../types/user.js';

export function updateNavbarUser(user: User | null) {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  if (user) {
    // User is logged in - show profile
    const avatarUrl = getUserAvatar(user);
    const displayName = user.display_name || user.username;

    headerActions.innerHTML = `
      <div class="flex items-center gap-3 mr-3">
        <div class="flex flex-col items-end">
          <span class="text-sm font-medium text-white">${escapeHTML(displayName)}</span>
          <span class="text-xs text-gray-400">@${escapeHTML(user.username)}</span>
        </div>
        <a href="/profile" data-link class="block">
          <img src="${escapeHTML(avatarUrl)}"
               alt="${escapeHTML(displayName)}"
               class="w-10 h-10 rounded-full border-2 border-indigo-500 cursor-pointer object-cover"
               title="View Profile" />
        </a>
      </div>
      <a href="/home" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap bg-transparent text-gray-400 hover:bg-slate-900/80 hover:text-gray-100">Home</a>
      <a href="/profile" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px">My Profile</a>
    `;
  } else {
    // User is not logged in
    headerActions.innerHTML = `
      <a href="/home" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-transparent text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap bg-transparent text-gray-400 hover:bg-slate-900/80 hover:text-gray-100">Home</a>
      <a href="/profile" data-link class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide cursor-pointer transition-all duration-150 ease-out whitespace-nowrap border-slate-400/50 text-gray-100 bg-gradient-to-br from-slate-400/10 to-transparent hover:bg-slate-900 hover:border-indigo-400/90 hover:shadow-lg hover:-translate-y-px">My Profile</a>
    `;
  }
}

