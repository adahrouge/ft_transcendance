import { setupFriendPage } from "../utils/friend";
import { presenceService, type FriendEvent } from "../services/presence";
import { showNotification } from "../utils/notifications";
import "../styles/friend.css";

// Global flag to ensure listeners are only set up once
let globalListenersSetup = false;

// Setup global friend event listeners (runs once per app session)
function setupGlobalFriendEventListeners() {
  if (globalListenersSetup) return;
  globalListenersSetup = true;

  presenceService.onFriendEvent((event: FriendEvent) => {
    const fromUser = event.from.display_name || event.from.username;
    const onFriendPage = document.getElementById("friend-root") !== null;

    switch (event.type) {
      case 'friend_request_received':
        showNotification(`${fromUser} sent you a friend request!`, { type: 'info' });
        if (onFriendPage) setupFriendPage();
        break;

      case 'friend_request_accepted':
        showNotification(`${fromUser} accepted your friend request!`, { type: 'success' });
        if (onFriendPage) setupFriendPage();
        break;

      case 'friend_request_rejected':
        showNotification(`${fromUser} rejected your friend request`, { type: 'info' });
        if (onFriendPage) setupFriendPage();
        break;

      case 'friend_removed':
        showNotification(`${fromUser} removed you from their friends`, { type: 'info' });
        if (onFriendPage) setupFriendPage();
        break;

      case 'user_blocked':
        showNotification(`${fromUser} blocked you`, { type: 'info' });
        if (onFriendPage) setupFriendPage();
        break;

      case 'user_unblocked':
        showNotification(`${fromUser} unblocked you`, { type: 'info' });
        if (onFriendPage) setupFriendPage();
        break;
    }
  });
}

export function renderFriendPage(): string {
  // Setup global listeners on first visit to friend page
  setupGlobalFriendEventListeners();

  setTimeout(setupFriendPage, 0);

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
