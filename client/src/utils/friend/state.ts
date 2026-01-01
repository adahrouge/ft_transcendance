import type { Friend } from "../../types/friend";

export let friendsData: Friend[] = [];
export let cleanupPresenceListeners: (() => void)[] = [];

export function setFriendsData(data: Friend[]) {
  friendsData = data;
}

export function clearPresenceListeners() {
  cleanupPresenceListeners.forEach(cleanup => cleanup());
  cleanupPresenceListeners = [];
}

export function addPresenceCleanup(cleanup: () => void) {
  cleanupPresenceListeners.push(cleanup);
}
