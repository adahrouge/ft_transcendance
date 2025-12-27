import { friendService } from "../services/friend";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import type { Friend, FriendRequest, BlockedUser, SearchUser } from "../types/friend";

// ============ Main Setup ============

export async function setupFriendPage() {
  const root = document.getElementById("friend-root");
  if (!root) return;

  try {
    const [friendsRes, pendingRes, sentRes, blockedRes] = await Promise.all([
      friendService.getFriends(),
      friendService.getPendingRequests(),
      friendService.getSentRequests(),
      friendService.getBlockedUsers()
    ]);

    const friends = friendsRes.friends || [];
    const pending = pendingRes.requests || [];
    const sent = sentRes.requests || [];
    const blocked = blockedRes.blockedUsers || [];

    root.innerHTML = renderFriendBox(friends, pending, sent, blocked);
    setupEventListeners(root);
  } catch {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}

// ============ Templates ============

function renderFriendBox(friends: Friend[], pending: FriendRequest[], sent: FriendRequest[], blocked: BlockedUser[]): string {
  return `
    <div class="friend-box">
      <h2 class="friend-title">${i18n.t('friends')}</h2>

      ${pending.length > 0 ? renderSection({
        title: `🔔 ${i18n.t('friend_requests')} (${pending.length})`,
        style: 'border: 2px solid #fbbf24; background: rgba(251, 191, 36, 0.1)',
        titleColor: '#fbbf24',
        items: pending.map(r => renderUserItem(r, 'bg-yellow-400', [
          { action: 'accept', label: `✓ ${i18n.t('accept')}`, class: 'bg-green-600 hover:bg-green-700' },
          { action: 'reject', label: `✗ ${i18n.t('reject')}`, class: 'bg-red-600 hover:bg-red-700' },
          { action: 'block', label: '🚫', class: 'bg-gray-600 hover:bg-gray-700' }
        ]))
      }) : ''}

      ${sent.length > 0 ? renderSection({
        title: `📤 ${i18n.t('sent_requests')} (${sent.length})`,
        style: 'background: rgba(100, 100, 100, 0.1)',
        titleColor: '#94a3b8',
        items: sent.map(r => renderUserItem(r, 'bg-gray-400', [], `<span class="text-gray-400 text-sm italic">${i18n.t('pending')}</span>`))
      }) : ''}

      ${renderSection({
        title: `${i18n.t('your_friends')} (${friends.length})`,
        items: friends.length === 0
          ? [`<p class="friend-list-empty">${i18n.t('no_friends')}</p>`]
          : friends.map(f => renderUserItem(f, f.is_online ? 'bg-green-500' : '', [
              { action: 'remove', label: '✗', class: 'bg-red-600 hover:bg-red-700 text-xs px-2' },
              { action: 'block', label: '🚫', class: 'bg-gray-600 hover:bg-gray-700 text-xs px-2' }
            ], '', f.is_online))
      })}

      ${blocked.length > 0 ? renderSection({
        title: `🚫 ${i18n.t('blocked_users')} (${blocked.length})`,
        style: 'background: rgba(239, 68, 68, 0.1)',
        titleColor: '#ef4444',
        items: blocked.map(u => renderUserItem(u, 'bg-red-500', [
          { action: 'unblock', label: i18n.t('unblock'), class: 'bg-gray-600 hover:bg-gray-700' }
        ]))
      }) : ''}

      <div class="friend-add-section">
        <h3 class="friend-section-title">${i18n.t('add_friend')}</h3>
        <div class="friend-search-bar">
          <input type="text" id="search-input" placeholder="Search username..." class="friend-search-input">
          <button id="search-btn" class="friend-search-btn">SEARCH</button>
        </div>
        <div id="search-results" class="friend-search-results"></div>
      </div>

      <div class="friend-footer">
        <button id="btn-back" class="friend-back-btn">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}

function renderSection(opts: { title: string; style?: string; titleColor?: string; items: string[] }): string {
  return `
    <div class="friend-list-section" ${opts.style ? `style="${opts.style}"` : ''}>
      <h3 class="friend-section-title" ${opts.titleColor ? `style="color: ${opts.titleColor}"` : ''}>${opts.title}</h3>
      <div class="friend-list">${opts.items.join('')}</div>
    </div>
  `;
}

function renderUserItem(user: Friend | FriendRequest | BlockedUser, dotColor: string, actions: { action: string; label: string; class: string }[], extra = '', showOnline = false): string {
  return `
    <div class="friend-list-item">
      <div class="flex items-center gap-3">
        ${dotColor ? `<div class="w-3 h-3 rounded-full ${dotColor}"></div>` : ''}
        <div>
          <div class="friend-display-name flex items-center gap-2">
            ${user.display_name || user.username}
            ${showOnline ? '<span class="w-2 h-2 rounded-full bg-green-500 inline-block" title="Online"></span>' : ''}
          </div>
          <div class="friend-username">@${user.username}</div>
        </div>
      </div>
      ${extra || (actions.length > 0 ? `
        <div class="flex gap-2">
          ${actions.map(a => `<button class="friend-play-btn ${a.class}" data-action="${a.action}" data-id="${user.id}">${a.label}</button>`).join('')}
        </div>
      ` : '')}
    </div>
  `;
}

// ============ Event Handling ============

function setupEventListeners(root: HTMLElement) {
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));

  // Delegate all button actions
  root.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("[data-action]") as HTMLElement;
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id || "0");
    if (!id) return;

    await handleAction(action!, id);
  });

  setupSearch();
}

async function handleAction(action: string, id: number) {
  const actions: Record<string, { fn: () => Promise<any>; success: string; confirm?: { title: string; message: string; confirmText: string } }> = {
    accept: { fn: () => friendService.acceptFriendRequest(id), success: "Friend request accepted!" },
    reject: { fn: () => friendService.rejectFriendRequest(id), success: "Friend request rejected" },
    remove: {
      fn: () => friendService.removeFriend(id),
      success: "Friend removed",
      confirm: { title: i18n.t('friends'), message: i18n.t('confirm_remove_friend'), confirmText: i18n.t('delete') }
    },
    block: {
      fn: () => friendService.blockUser(id),
      success: "User blocked",
      confirm: { title: i18n.t('block_user'), message: i18n.t('confirm_block_user'), confirmText: i18n.t('block') }
    },
    unblock: { fn: () => friendService.unblockUser(id), success: "User unblocked" }
  };

  const config = actions[action];
  if (!config) return;

  if (config.confirm) {
    const confirmed = await showConfirm({ ...config.confirm, cancelText: i18n.t('back') });
    if (!confirmed) return;
  }

  try {
    await config.fn();
    showNotification(config.success, { type: 'success' });
    setupFriendPage();
  } catch {
    showNotification(`Failed to ${action}`, { type: 'error' });
  }
}

function setupSearch() {
  const input = document.getElementById("search-input") as HTMLInputElement;
  const btn = document.getElementById("search-btn");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  const doSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    results.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('searching')}</div>`;

    try {
      const res = await friendService.searchUsers(query);
      const users = res.users || [];

      if (users.length === 0) {
        results.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('no_users_found')}</div>`;
        return;
      }

      results.innerHTML = users.map((u: SearchUser) => `
        <div class="friend-search-result-item">
          <span class="friend-search-result-name">${u.username}</span>
          <div class="flex gap-2">
            <button class="friend-add-btn" data-search-action="add" data-id="${u.id}">${i18n.t('add')}</button>
            <button class="friend-add-btn text-red-400 hover:text-red-300" data-search-action="block" data-id="${u.id}">🚫</button>
          </div>
        </div>
      `).join('');

      results.addEventListener("click", async (e) => {
        const btn = (e.target as HTMLElement).closest("[data-search-action]") as HTMLElement;
        if (!btn) return;

        const action = btn.dataset.searchAction;
        const id = parseInt(btn.dataset.id || "0");
        if (!id) return;

        if (action === "add") {
          try {
            await friendService.sendFriendRequest(id);
            showNotification(i18n.t('friend_request_sent'), { type: 'success' });
            setupFriendPage();
          } catch (e: any) {
            showNotification(e.message || "Failed to send request", { type: 'error' });
          }
        } else if (action === "block") {
          await handleAction("block", id);
        }
      });
    } catch {
      results.innerHTML = '<div class="text-red-400 text-sm">Error searching.</div>';
    }
  };

  btn?.addEventListener("click", doSearch);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") doSearch(); });
}
