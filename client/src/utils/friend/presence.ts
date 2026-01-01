import { presenceService } from "../../services/presence";
import { friendsData, addPresenceCleanup } from "./state";

export function setupPresenceListeners() {
  const cleanupInitial = presenceService.onInitialStatuses((statuses) => {
    statuses.forEach(({ friendId, isOnline }) => {
      updateFriendOnlineStatus(friendId, isOnline);
    });
  });
  addPresenceCleanup(cleanupInitial);

  const cleanupChanges = presenceService.onFriendStatusChange((friendId, isOnline) => {
    updateFriendOnlineStatus(friendId, isOnline);
  });
  addPresenceCleanup(cleanupChanges);
}

export function updateFriendOnlineStatus(friendId: number, isOnline: boolean) {
  const friend = friendsData.find(f => f.id === friendId);
  if (friend) {
    friend.is_online = isOnline;
  }

  const friendElement = document.querySelector(`[data-friend-id="${friendId}"]`);
  if (friendElement) {
    const statusDot = friendElement.querySelector('.friend-status-dot');
    const onlineIndicator = friendElement.querySelector('.friend-online-indicator');

    if (statusDot) {
      statusDot.className = `friend-status-dot w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`;
    }

    if (onlineIndicator) {
      onlineIndicator.className = `friend-online-indicator w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-green-500' : 'hidden'}`;
      onlineIndicator.setAttribute('title', isOnline ? 'Online' : 'Offline');
    }
  }
}
