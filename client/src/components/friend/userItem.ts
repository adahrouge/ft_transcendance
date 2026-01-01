import type { Friend, FriendRequest, BlockedUser } from "../../types/friend";

export interface ActionButton {
  action: string;
  label: string;
  class: string;
}

export function renderUserItem(
  user: Friend | FriendRequest | BlockedUser,
  dotColor: string,
  actions: ActionButton[],
  extra = ''
): string {
  const isFriend = 'is_online' in user;
  const isOnline = isFriend && user.is_online;

  return `
    <div class="friend-list-item" ${isFriend ? `data-friend-id="${user.id}"` : ''}>
      <div class="flex items-center gap-3">
        ${dotColor ? `<div class="friend-status-dot w-3 h-3 rounded-full ${dotColor}"></div>` : ''}
        <div>
          <div class="friend-display-name flex items-center gap-2">
            ${user.display_name || user.username}
            ${isFriend ? `<span class="friend-online-indicator w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-green-500' : 'hidden'}" title="${isOnline ? 'Online' : 'Offline'}"></span>` : ''}
          </div>
          <div class="friend-username">@${user.username}</div>
        </div>
      </div>
      ${extra || (actions.length > 0 ? `
        <div class="flex gap-2">
          ${actions.map(a => `<button class="friend-play-btn ${a.class}" data-action="${a.action}" data-id="${user.id}">${a.label}</button>`).join('')}
        </div>
      ` : '')}
    </div>
  `;
}
