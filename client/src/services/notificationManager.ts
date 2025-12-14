import { onlineGameService } from "./onlineGame";
import { authService } from "./auth";
import { showNotification } from "../utils/notifications";
import { i18n } from "./i18n";
import { navigateTo } from "../router";

class NotificationManager {
  private initialized = false;
  private currentUser: any = null;
  private friendUpdateCallbacks: Set<() => void> = new Set();
  private gameInviteHandlers: Set<(inviterName: string, gameId: string) => void> = new Set();

  async initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    try {
      this.currentUser = await authService.getCurrentUser();
    } catch (e) {
      console.error("Failed to get current user for notifications");
      return;
    }

    // Set up friend event listener (global)
    onlineGameService.onFriendEvent((eventType, data) => {
      console.log('Friend event received:', eventType, data);

      // Notify all registered callbacks (e.g., friend page to reload)
      this.notifyFriendUpdate();

      // Show notification based on event type
      if (eventType === 'friend_request_received' && data.fromUsername) {
        showNotification(`${data.fromUsername} ${i18n.t('sent_you_friend_request')}`, { 
          type: 'info',
          duration: 5000,
          onClick: () => navigateTo('/friend')
        });
      } else if (eventType === 'friend_request_accepted' && data.byUsername) {
        showNotification(`${data.byUsername} ${i18n.t('accepted_your_friend_request')}`, { 
          type: 'success',
          duration: 5000,
          onClick: () => navigateTo('/friend')
        });
      } else if (eventType === 'friend_removed' && data.byUsername) {
        showNotification(`${data.byUsername} ${i18n.t('removed_you_as_friend')}`, { 
          type: 'warning',
          duration: 5000
        });
      }
    });

    // Set up game invite listener (global) 
    onlineGameService.onGameInvite((inviterName, gameId) => {
      console.log('🎮 Game invite received:', inviterName, gameId);
      console.log('Custom handlers registered:', this.gameInviteHandlers.size);
      
      // If there are custom handlers registered (e.g., from friend page), use those
      if (this.gameInviteHandlers.size > 0) {
        this.gameInviteHandlers.forEach(handler => handler(inviterName, gameId));
      } else {
        // Otherwise, show default global notification
        this.showDefaultGameInviteNotification(inviterName, gameId);
      }
    });

    console.log("✅ Global notification manager initialized");
  }

  // Allow friend page to register for friend updates
  onFriendUpdate(callback: () => void) {
    this.friendUpdateCallbacks.add(callback);
    return () => this.friendUpdateCallbacks.delete(callback);
  }

  private notifyFriendUpdate() {
    this.friendUpdateCallbacks.forEach(callback => callback());
  }

  // Allow custom game invite handlers (e.g., friend page has special UI)
  onGameInviteReceived(handler: (inviterName: string, gameId: string) => void) {
    this.gameInviteHandlers.add(handler);
    return () => this.gameInviteHandlers.delete(handler);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  private showDefaultGameInviteNotification(inviterName: string, gameId: string) {
    // Simple notification with click to join
    showNotification(`🎮 ${inviterName} ${i18n.t('wants_to_play')}`, {
      type: 'info',
      duration: 10000,
      onClick: () => {
        navigateTo(`/online-game?id=${gameId}`);
      }
    });
  }
}

export const notificationManager = new NotificationManager();
