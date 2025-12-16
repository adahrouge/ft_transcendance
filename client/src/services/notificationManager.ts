import { authService } from "./auth";

class NotificationManager {
  private initialized = false;
  private currentUser: any = null;
  private friendUpdateCallbacks: Set<() => void> = new Set();

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

    console.log("✅ Global notification manager initialized");
  }

  // Allow friend page to register for friend updates
  onFriendUpdate(callback: () => void) {
    this.friendUpdateCallbacks.add(callback);
    return () => this.friendUpdateCallbacks.delete(callback);
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

export const notificationManager = new NotificationManager();
