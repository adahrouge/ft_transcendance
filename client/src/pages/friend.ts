import { setupFriendPage, setupGlobalFriendEventListeners } from "../utils/friend";
import "../styles/friend.css";

export function renderFriendPage(): string {
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
