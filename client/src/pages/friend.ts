import { friendService } from "../services/friend";
import { notificationManager } from "../services/notificationManager";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import "../styles/friend.css";
import backgroundImage from "../assets/images/background.jpg";

import { getToken } from "../utils/auth";

// Track active notification to prevent duplicates
let currentUser: any = null;
let loadFriendsTimeout: ReturnType<typeof setTimeout> | null = null;
let friendUpdateUnsubscribe: (() => void) | null = null;

export function renderFriendPage(): string {
  setTimeout(() => {
    loadFriends();
  }, 0);

  return `
    <div class="friend-container" style="background-image: url('${backgroundImage}')">
      <div class="friend-overlay"></div>
      <div class="friend-content">
        <div id="friend-root" class="w-full max-w-[900px]">
          <div class="text-center text-white font-['Pixel_Game']">${i18n.t('loading')}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadFriends() {
  const root = document.getElementById("friend-root");
  if (!root) return;

  try {
    // Get current user from notification manager (already loaded)
    currentUser = notificationManager.getCurrentUser();

    // Load friends, pending requests, and sent requests in parallel
    const [friendsResponse, pendingResponse, sentResponse] = await Promise.all([
      friendService.getFriends(),
      friendService.getPendingRequests(),
      friendService.getSentRequests()
    ]);

    const friends = friendsResponse.friends || [];
    const pendingRequests = pendingResponse.requests || [];
    const sentRequests = sentResponse.requests || [];

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
                    <div class="friend-display-name">${f.display_name || f.username}</div>
                    <div class="friend-username">@${f.username}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="friend-play-btn bg-red-600 hover:bg-red-700 text-xs px-2"
                          data-remove-id="${f.id}">✗</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

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
      cleanupFriendPage();
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
            <button class="friend-add-btn" data-add-id="${u.id}">${i18n.t('add')}</button>
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

      } catch (e) {
        resultsDiv.innerHTML = '<div class="text-red-400 text-sm">Error searching.</div>';
      }
    };

    searchBtn?.addEventListener("click", doSearch);
    searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") doSearch();
    });

    // Register for friend updates from notification manager
    friendUpdateUnsubscribe = notificationManager.onFriendUpdate(() => {
      // Debounce friend list reload to prevent rapid successive calls
      if (loadFriendsTimeout) {
        clearTimeout(loadFriendsTimeout);
      }
      loadFriendsTimeout = setTimeout(() => {
        loadFriends();
      }, 300);
    });

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}

function cleanupFriendPage() {
  // Clear timeouts
  if (loadFriendsTimeout) {
    clearTimeout(loadFriendsTimeout);
    loadFriendsTimeout = null;
  }

  // Unsubscribe from callbacks
  if (friendUpdateUnsubscribe) {
    friendUpdateUnsubscribe();
    friendUpdateUnsubscribe = null;
  }
}
