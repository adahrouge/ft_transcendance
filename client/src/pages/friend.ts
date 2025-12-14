import { friendService } from "../services/friend";
import { onlineGameService } from "../services/onlineGame";
import { notificationManager } from "../services/notificationManager";
import { navigateTo } from "../router";
import { i18n } from "../services/i18n";
import { showNotification, showConfirm } from "../utils/notifications";
import "../styles/friend.css";
import backgroundImage from "../assets/images/background.jpg";

import { getToken } from "../utils/auth";

// Track active notification to prevent duplicates
let activeNotificationId: string | null = null;
let activeGamesRefreshInterval: ReturnType<typeof setInterval> | null = null;
let currentActiveGames: any[] = [];
let currentOnlineStatus: Record<string, boolean> = {};
let currentUser: any = null;
let loadFriendsTimeout: ReturnType<typeof setTimeout> | null = null;
let friendUpdateUnsubscribe: (() => void) | null = null;
let gameInviteUnsubscribe: (() => void) | null = null;
let onlineStatusUnsubscribe: (() => void) | null = null;

function showGameInviteNotification(inviterName: string, gameId: string) {
  // Remove any existing notification
  const existing = document.getElementById('game-invite-notification');
  if (existing) {
    existing.remove();
  }

  // Prevent duplicate notifications for the same game
  if (activeNotificationId === gameId) {
    return;
  }
  activeNotificationId = gameId;

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'game-invite-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.3);
    z-index: 10000;
    min-width: 320px;
    font-family: 'Pixel Game', monospace;
    animation: slideInRight 0.3s ease-out;
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    </style>
    <div style="margin-bottom: 12px;">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 6px;">🎮 ${i18n.t('game_invite')}</div>
      <div style="font-size: 14px; opacity: 0.9;">${inviterName} ${i18n.t('wants_to_play')}</div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="accept-invite-btn" style="
        flex: 1;
        background: white;
        color: #059669;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        font-family: 'Pixel Game', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
      ">${i18n.t('accept')}</button>
      <button id="decline-invite-btn" style="
        flex: 1;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 10px 16px;
        border-radius: 6px;
        font-family: 'Pixel Game', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
      ">${i18n.t('decline')}</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Add hover effects
  const acceptBtn = document.getElementById('accept-invite-btn');
  const declineBtn = document.getElementById('decline-invite-btn');

  if (acceptBtn) {
    acceptBtn.addEventListener('mouseenter', () => {
      acceptBtn.style.transform = 'scale(1.05)';
      acceptBtn.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.4)';
    });
    acceptBtn.addEventListener('mouseleave', () => {
      acceptBtn.style.transform = 'scale(1)';
      acceptBtn.style.boxShadow = 'none';
    });
    acceptBtn.addEventListener('click', () => {
      activeNotificationId = null;
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        notification.remove();
        navigateTo(`/online-game?id=${gameId}`);
      }, 300);
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('mouseenter', () => {
      declineBtn.style.transform = 'scale(1.05)';
      declineBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    declineBtn.addEventListener('mouseleave', () => {
      declineBtn.style.transform = 'scale(1)';
      declineBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    declineBtn.addEventListener('click', () => {
      activeNotificationId = null;
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    });
  }

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      activeNotificationId = null;
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 15000);
}

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

  // Clear any existing interval to prevent leaks
  if (activeGamesRefreshInterval) {
    clearInterval(activeGamesRefreshInterval);
    activeGamesRefreshInterval = null;
  }

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
                  <div id="status-${f.id}" class="w-3 h-3 rounded-full bg-gray-400" title="Offline"></div>
                  <div>
                    <div class="friend-display-name">${f.display_name || f.username}</div>
                    <div class="friend-username">@${f.username}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="friend-play-btn opacity-50 cursor-not-allowed" disabled
                          data-play-id="${f.id}" data-play-name="${f.username}">${i18n.t('offline')}</button>
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

    // Helper to check if a user is in an active game
    const isUserInGame = (username: string, userId: number) => {
      return currentActiveGames.some((g: any) => {
        const p1 = g.players?.[0];
        const p2 = g.players?.[1];
        
        // Check Player 1
        const p1Match = p1 && (
          String(p1.id) === String(userId) || 
          p1.name === username || 
          p1.username === username
        );

        // Check Player 2
        const p2Match = p2 && (
          String(p2.id) === String(userId) || 
          p2.name === username || 
          p2.username === username
        );

        return p1Match || p2Match;
      });
    };

    // Update UI based on status and active games
    const updateUI = () => {
      friends.forEach((f: any) => {
        const isOnline = currentOnlineStatus[f.id];
        const inGame = isUserInGame(f.username, f.id);
        
        const btn = root.querySelector(`[data-play-id="${f.id}"]`) as HTMLButtonElement;
        const statusIndicator = root.querySelector(`#status-${f.id}`) as HTMLElement;

        if (btn) {
          if (isOnline && !inGame) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.title = "Play with friend";
            btn.textContent = i18n.t('play');
          } else {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            if (inGame) {
              btn.title = "Friend is in a game";
              btn.textContent = i18n.t('in_game');
            } else {
              btn.title = "Friend is offline";
              btn.textContent = i18n.t('offline');
            }
          }
        }

        if (statusIndicator) {
          if (inGame) {
             statusIndicator.style.backgroundColor = '#fbbf24'; // Yellow/Orange
             statusIndicator.title = 'In Game';
          } else {
             statusIndicator.style.backgroundColor = isOnline ? '#4ade80' : '#94a3b8';
             statusIndicator.title = isOnline ? i18n.t('online') : i18n.t('offline');
          }
        }
      });
    };

    // Play buttons
    root.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = (btn as HTMLElement).dataset.playName;
        const friendId = (btn as HTMLElement).dataset.playId;
        
        if (name && friendId) {
          // Double check restrictions
          if (isUserInGame(name, parseInt(friendId))) {
            showNotification(i18n.t('friend_in_game'), { type: 'warning' });
            return;
          }
          if (currentUser && isUserInGame(currentUser.username, currentUser.id)) {
            showNotification(i18n.t('you_in_game'), { type: 'warning' });
            return;
          }

          const token = getToken();
          if (!token) return;
          
          onlineGameService.connect(token);
          
          // Listen for game creation
          const onGameCreated = () => {
             const gameId = onlineGameService.getCurrentGameId();
             if (gameId) {
                 if (activeGamesRefreshInterval) clearInterval(activeGamesRefreshInterval);
                 navigateTo(`/online-game?id=${gameId}`);
             }
          };
          
          onlineGameService.onGameStateUpdate(onGameCreated);

          // Wait a bit for connection
          setTimeout(() => {
            onlineGameService.createGame(currentUser.username, name, friendId, String(currentUser.id));
          }, 500);
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

    // Start polling active games and online status
    const fetchActiveGames = async () => {
      if (!document.getElementById("friend-root")) {
        if (activeGamesRefreshInterval) clearInterval(activeGamesRefreshInterval);
        return;
      }
      try {
        const response = await onlineGameService.getActiveGames();
        currentActiveGames = response.games || [];
        updateUI();
      } catch (e) {
        console.error("Failed to fetch active games", e);
      }
    };

    const checkOnlineStatus = () => {
      const friendIds = friends.map((f: any) => f.id);
      if (friendIds.length > 0) {
        onlineGameService.checkOnlineStatus(friendIds);
      }
    };

    // Set up online status updates
    onlineStatusUnsubscribe = onlineGameService.onOnlineStatusUpdate((status) => {
      currentOnlineStatus = status;
      updateUI();
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

    // Register for game invites with custom notification display
    gameInviteUnsubscribe = notificationManager.onGameInviteReceived((inviterName, gameId) => {
      // Check if I am in a game
      if (currentUser && isUserInGame(currentUser.username, currentUser.id)) {
        return;
      }
      showGameInviteNotification(inviterName, gameId);
    });

    // Start polling for active games and online status
    fetchActiveGames();
    
    // Initial online status check
    setTimeout(() => {
      checkOnlineStatus();
    }, 500);

    // Start interval for continuous updates (only if not already running)
    if (!activeGamesRefreshInterval) {
      activeGamesRefreshInterval = setInterval(() => {
        fetchActiveGames();
        checkOnlineStatus();
      }, 2000); // Reduced from 3000ms to 2000ms for faster updates
    }

  } catch (err) {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}

function cleanupFriendPage() {
  // Clear intervals
  if (activeGamesRefreshInterval) {
    clearInterval(activeGamesRefreshInterval);
    activeGamesRefreshInterval = null;
  }

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

  if (gameInviteUnsubscribe) {
    gameInviteUnsubscribe();
    gameInviteUnsubscribe = null;
  }

  if (onlineStatusUnsubscribe) {
    onlineStatusUnsubscribe();
    onlineStatusUnsubscribe = null;
  }

  // Reset state
  currentActiveGames = [];
  currentOnlineStatus = {};
  activeNotificationId = null;
}
