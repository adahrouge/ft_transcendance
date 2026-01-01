import { friendService } from "../../services/friend";
import { i18n } from "../../services/i18n";
import { showNotification } from "../notifications";
import type { SearchUser } from "../../types/friend";
import { handleAction } from "./actions";
import { setupFriendPage } from "./setup";

export function setupSearch() {
  const input = document.getElementById("search-input") as HTMLInputElement;
  const btn = document.getElementById("search-btn");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  const doSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    results.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('searching')}</div>`;

    try {
      const res = await friendService.searchUsers(query);
      const users = res.users || [];

      if (users.length === 0) {
        results.innerHTML = `<div class="text-gray-500 text-sm">${i18n.t('no_users_found')}</div>`;
        return;
      }

      results.innerHTML = users.map((u: SearchUser) => `
        <div class="friend-search-result-item">
          <span class="friend-search-result-name">${u.username}</span>
          <div class="flex gap-2">
            <button class="friend-add-btn" data-search-action="add" data-id="${u.id}">${i18n.t('add')}</button>
            <button class="friend-add-btn text-red-400 hover:text-red-300" data-search-action="block" data-id="${u.id}">🚫</button>
          </div>
        </div>
      `).join('');

      results.addEventListener("click", async (e) => {
        const btn = (e.target as HTMLElement).closest("[data-search-action]") as HTMLElement;
        if (!btn) return;

        const action = btn.dataset.searchAction;
        const id = parseInt(btn.dataset.id || "0");
        if (!id) return;

        if (action === "add") {
          try {
            await friendService.sendFriendRequest(id);
            showNotification(i18n.t('friend_request_sent'), { type: 'success' });
            setupFriendPage();
          } catch (e: any) {
            showNotification(e.message || "Failed to send request", { type: 'error' });
          }
        } else if (action === "block") {
          await handleAction("block", id);
        }
      });
    } catch {
      results.innerHTML = '<div class="text-red-400 text-sm">Error searching.</div>';
    }
  };

  btn?.addEventListener("click", doSearch);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") doSearch(); });
}
