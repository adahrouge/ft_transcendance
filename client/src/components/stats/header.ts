import { getAvatarUrl } from "../../utils/home";
import type { StatsUser } from "../../types/stats";

export function renderHeader(user: StatsUser): string {
  return `
    <div class="stats-header">
      <div class="stats-avatar-wrapper">
        <img src="${getAvatarUrl(user)}" class="stats-avatar" alt="Avatar">
      </div>
      <div class="stats-header-info">
        <div class="stats-player-name">${user.display_name || user.username}</div>
        <div class="stats-username">@${user.username}</div>
      </div>
    </div>
  `;
}
