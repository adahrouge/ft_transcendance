import { friendService } from "../services/friend";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import "../styles/friend.css";

export function renderFriendPage(): string {
  setTimeout(() => {
    loadFriends();
  }, 0);

  return `
    <div class="friend-container">
      <div class="friend-overlay"></div>
      <div class="friend-content">
        <div id="friend-root" class="w-full flex justify-center items-center min-h-[300px]">
          <svg style="color: #5db3d1; animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
        </div>
      </div>
    </div>
  `;
}

async function loadFriends() {
  const root = document.getElementById("friend-root");
  if (!root) return;

  try {
    // Load friends, pending requests, sent requests, and blocked users in parallel
    const [friendsResponse, pendingResponse, sentResponse, blockedResponse] = await Promise.all([
      friendService.getFriends(),
      friendService.getPendingRequests(),
      friendService.getSentRequests(),
      friendService.getBlockedUsers()
    ]);

    const friends = friendsResponse.friends || [];
    const pendingRequests = pendingResponse.requests || [];
    const sentRequests = sentResponse.requests || [];
    const blockedUsers = blockedResponse.blockedUsers || [];

    root.innerHTML = `
      <div class="friend-box">
        <h2 class="friend-title">${i18n.t('friends')}</h2>

        <!-- Pending Friend Requests Section -->
        ${pendingRequests.length > 0 ? `
        <div class="friend-list-section" style="border: 2px solid #fbbf24; background: rgba(251, 191, 36, 0.1);">
          <h3 class="friend-section-title" style="color: #fbbf24;">
            🔔 ${i18n.t('friend_requests')} (${pendingRequests.length})
          </h3>
          <div class="friend-list" id="pending-requests-list">
            ${pendingRequests.map((r: any) => `
              <div class="friend-list-item">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-yellow-400" title="Pending"></div>
                  <div>
                    <div class="friend-display-name">${r.display_name || r.username}</div>
                    <div class="friend-username">@${r.username}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="friend-play-btn bg-green-600 hover:bg-green-700"
                          data-accept-id="${r.id}">✓ ${i18n.t('accept')}</button>
                  <button class="friend-play-btn bg-red-600 hover:bg-red-700"
                          data-reject-id="${r.id}">✗ ${i18n.t('reject')}</button>
                  <button class="friend-play-btn bg-gray-600 hover:bg-gray-700"
                          data-block-id="${r.id}" title="${i18n.t('block')}">🚫</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Sent Friend Requests Section -->
        ${sentRequests.length > 0 ? `
        <div class="friend-list-section" style="background: rgba(100, 100, 100, 0.1);">
          <h3 class="friend-section-title" style="color: #94a3b8;">
            📤 ${i18n.t('sent_requests')} (${sentRequests.length})
          </h3>
          <div class="friend-list" id="sent-requests-list">
            ${sentRequests.map((r: any) => `
              <div class="friend-list-item">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-gray-400" title="Pending"></div>
                  <div>
                    <div class="friend-display-name">${r.display_name || r.username}</div>
                    <div class="friend-username">@${r.username}</div>
                  </div>
                </div>
                <span class="text-gray-400 text-sm italic">${i18n.t('pending')}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Friends List Section -->
        <div class="friend-list-section">
          <h3 class="friend-section-title">${i18n.t('your_friends')} (${friends.length})</h3>
          <div class="friend-list" id="friends-list">
            ${friends.length === 0 ? `<p class="friend-list-empty">${i18n.t('no_friends')}</p>` : friends.map((f: any) => `
              <div class="friend-list-item">
                <div class="flex items-center gap-3">
                  <div>
                    <div class="friend-display-name flex items-center gap-2">
                      ${f.display_name || f.username}
                      ${f.is_online ? '<span class="w-2 h-2 rounded-full bg-green-500 inline-block" title="Online"></span>' : ''}
                    </div>
                    <div class="friend-username">@${f.username}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="friend-play-btn bg-red-600 hover:bg-red-700 text-xs px-2"
                          data-remove-id="${f.id}">✗</button>
                  <button class="friend-play-btn bg-gray-600 hover:bg-gray-700 text-xs px-2"
                          data-block-id="${f.id}" title="${i18n.t('block')}">🚫</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Blocked Users Section -->
        ${blockedUsers.length > 0 ? `
        <div class="friend-list-section" style="background: rgba(239, 68, 68, 0.1);">
          <h3 class="friend-section-title" style="color: #ef4444;">
            🚫 ${i18n.t('blocked_users')} (${blockedUsers.length})
          </h3>
          <div class="friend-list" id="blocked-users-list">
            ${blockedUsers.map((u: any) => `
              <div class="friend-list-item">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-red-500" title="Blocked"></div>
                  <div>
                    <div class="friend-display-name">${u.display_name || u.username}</div>
                    <div class="friend-username">@${u.username}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="friend-play-btn bg-gray-600 hover:bg-gray-700"
                          data-unblock-id="${u.id}">${i18n.t('unblock')}</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Add Friend Section -->
        <div class="friend-add-section">
          <h3 class="friend-section-title">${i18n.t('add_friend')}</h3>
          <div class="friend-search-bar">
            <input type="text" id="search-input" placeholder="Search username..."
                   class="friend-search-input">
            <button id="search-btn" class="friend-search-btn">SEARCH</button>
          </div>
          <div id="search-results" class="friend-search-results"></div>
        </div>

        <div class="friend-footer">
          <button id="btn-back" class="friend-back-btn">${i18n.t('back')}</button>
        </div>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => {
      navigateTo("/home");
    });

    // Accept friend request buttons
    root.querySelectorAll('[data-accept-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = parseInt((btn as HTMLElement).dataset.acceptId || "0");
        if (friendId) {
          try {
            await friendService.acceptFriendRequest(friendId);
            showNotification("Friend request accepted!", { type: 'success' });
            loadFriends(); // Reload to show updated lists
          } catch (e) {
            showNotification("Failed to accept friend request", { type: 'error' });
          }
        }
      });
    });

    // Reject friend request buttons
    root.querySelectorAll('[data-reject-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = parseInt((btn as HTMLElement).dataset.rejectId || "0");
        if (friendId) {
          try {
            await friendService.rejectFriendRequest(friendId);
            showNotification("Friend request rejected", { type: 'info' });
            loadFriends(); // Reload to show updated lists
          } catch (e) {
            showNotification("Failed to reject friend request", { type: 'error' });
          }
        }
      });
    });

    // Remove friend buttons
    root.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const friendId = parseInt((btn as HTMLElement).dataset.removeId || "0");
        if (friendId) {
          const confirmed = await showConfirm({
            title: i18n.t('friends'),
            message: i18n.t('confirm_remove_friend'),
            confirmText: i18n.t('delete'),
            cancelText: i18n.t('back')
          });

          if (confirmed) {
            try {
              await friendService.removeFriend(friendId);
              showNotification("Friend removed", { type: 'success' });
              loadFriends(); // Reload to show updated lists
            } catch (e) {
              showNotification("Failed to remove friend", { type: 'error' });
            }
          }
        }
      });
    });

    // Block user buttons
    root.querySelectorAll('[data-block-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = parseInt((btn as HTMLElement).dataset.blockId || "0");
        if (userId) {
          const confirmed = await showConfirm({
            title: i18n.t('block_user'),
            message: i18n.t('confirm_block_user'),
            confirmText: i18n.t('block'),
            cancelText: i18n.t('back')
          });

          if (confirmed) {
            try {
              await friendService.blockUser(userId);
              showNotification("User blocked", { type: 'success' });
              loadFriends(); // Reload to show updated lists
            } catch (e) {
              showNotification("Failed to block user", { type: 'error' });
            }
          }
        }
      });
    });

    // Unblock user buttons
    root.querySelectorAll('[data-unblock-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = parseInt((btn as HTMLElement).dataset.unblockId || "0");
        if (userId) {
          try {
            await friendService.unblockUser(userId);
            showNotification("User unblocked", { type: 'success' });
            loadFriends(); // Reload to show updated lists
          } catch (e) {
            showNotification("Failed to unblock user", { type: 'error' });
          }
        }
      });
    });

    // Search setup
    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn");
    const resultsDiv = document.getElementById("search-results");

    const doSearch = async () => {
      const query = searchInput.value.trim();
      if (!query || !resultsDiv) return;
      
      resultsDiv.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('searching')}</div>`;
      try {
        const res = await friendService.searchUsers(query);
        const users = res.users || [];
        
        if (users.length === 0) {
          resultsDiv.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('no_users_found')}</div>`;
          return;
        }

        resultsDiv.innerHTML = users.map((u: any) => `
          <div class="friend-search-result-item">
            <span class="friend-search-result-name">${u.username}</span>
            <div class="flex gap-2">
              <button class="friend-add-btn" data-add-id="${u.id}">${i18n.t('add')}</button>
              <button class="friend-add-btn text-red-400 hover:text-red-300" data-block-search-id="${u.id}">🚫</button>
            </div>
          </div>
        `).join('');

        resultsDiv.querySelectorAll('[data-add-id]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = parseInt((btn as HTMLElement).dataset.addId || "0");
            if (id) {
              try {
                await friendService.sendFriendRequest(id);
                showNotification(i18n.t('friend_request_sent'), { type: 'success' });
                loadFriends(); // Reload list
              } catch (e: any) {
                showNotification(e.message || "Failed to send friend request", { type: 'error' });
              }
            }
          });
        });

        resultsDiv.querySelectorAll('[data-block-search-id]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = parseInt((btn as HTMLElement).dataset.blockSearchId || "0");
            if (id) {
              const confirmed = await showConfirm({
                title: i18n.t('block_user'),
                message: i18n.t('confirm_block_user'),
                confirmText: i18n.t('block'),
                cancelText: i18n.t('back')
              });

              if (confirmed) {
                try {
                  await friendService.blockUser(id);
                  showNotification("User blocked", { type: 'success' });
                  loadFriends(); // Reload list
                  doSearch(); // Refresh search results
                } catch (e: any) {
                  showNotification(e.message || "Failed to block user", { type: 'error' });
                }
              }
            }
          });
        });

      } catch (e) {
        resultsDiv.innerHTML = '<div class="text-red-400 text-sm">Error searching.</div>';
      }
    };

    searchBtn?.addEventListener("click", doSearch);
    searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") doSearch();
    });

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}
