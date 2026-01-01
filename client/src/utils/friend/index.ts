// Main setup
export { setupFriendPage } from "./setup";

// Global event listeners
export { setupGlobalFriendEventListeners } from "./globalListeners";

// State management
export { friendsData, setFriendsData, clearPresenceListeners } from "./state";

// Presence
export { setupPresenceListeners, updateFriendOnlineStatus } from "./presence";

// Actions
export { handleAction } from "./actions";

// Search
export { setupSearch } from "./search";
