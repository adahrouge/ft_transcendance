import { presenceService, type FriendEvent } from "../../services/presence";
import { showNotification } from "../notifications";
import { setupFriendPage } from "./setup";

let globalListenersSetup = false;

export function setupGlobalFriendEventListeners() {
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
