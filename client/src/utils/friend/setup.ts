import { friendService } from "../../services/friend";
import { navigateTo } from "../../router";
import { setFriendsData, clearPresenceListeners } from "./state";
import { setupPresenceListeners } from "./presence";
import { handleAction } from "./actions";
import { setupSearch } from "./search";
import { renderFriendBox } from "../../components/friend";

export async function setupFriendPage() {
  const root = document.getElementById("friend-root");
  if (!root) return;

  clearPresenceListeners();

  try {
    const [friendsRes, pendingRes, sentRes, blockedRes] = await Promise.all([
      friendService.getFriends(),
      friendService.getPendingRequests(),
      friendService.getSentRequests(),
      friendService.getBlockedUsers()
    ]);

    const friends = friendsRes.friends || [];
    const pending = pendingRes.requests || [];
    const sent = sentRes.requests || [];
    const blocked = blockedRes.blockedUsers || [];

    setFriendsData(friends);

    root.innerHTML = renderFriendBox(friends, pending, sent, blocked);
    setupEventListeners(root);
    setupPresenceListeners();
  } catch {
    root.innerHTML = '<div class="text-red-500">Failed to load friends.</div>';
  }
}

function setupEventListeners(root: HTMLElement) {
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));

  root.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("[data-action]") as HTMLElement;
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id || "0");
    if (!id) return;

    await handleAction(action!, id);
  });

  setupSearch();
}
