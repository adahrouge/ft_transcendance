import { i18n } from "../../services/i18n";
import type { Friend, FriendRequest, BlockedUser } from "../../types/friend";
import { renderSection } from "./section";
import { renderUserItem } from "./userItem";
import { renderSearchBar } from "./searchBar";

export function renderFriendBox(
  friends: Friend[],
  pending: FriendRequest[],
  sent: FriendRequest[],
  blocked: BlockedUser[]
): string {
  return `
    <div class="friend-box">
      <h2 class="friend-title">${i18n.t('friends')}</h2>

      ${pending.length > 0 ? renderSection({
        title: `🔔 ${i18n.t('friend_requests')} (${pending.length})`,
        style: 'border: 2px solid #fbbf24; background: rgba(251, 191, 36, 0.1)',
        titleColor: '#fbbf24',
        items: pending.map(r => renderUserItem(r, 'bg-yellow-400', [
          { action: 'accept', label: `✓ ${i18n.t('accept')}`, class: 'bg-green-600 hover:bg-green-700' },
          { action: 'reject', label: `✗ ${i18n.t('reject')}`, class: 'bg-red-600 hover:bg-red-700' },
          { action: 'block', label: '🚫', class: 'bg-gray-600 hover:bg-gray-700' }
        ]))
      }) : ''}

      ${sent.length > 0 ? renderSection({
        title: `📤 ${i18n.t('sent_requests')} (${sent.length})`,
        style: 'background: rgba(100, 100, 100, 0.1)',
        titleColor: '#94a3b8',
        items: sent.map(r => renderUserItem(r, 'bg-gray-400', [], `<span class="text-gray-400 text-sm italic">${i18n.t('pending')}</span>`))
      }) : ''}

      ${renderSection({
        title: `${i18n.t('your_friends')} (${friends.length})`,
        items: friends.length === 0
          ? [`<p class="friend-list-empty">${i18n.t('no_friends')}</p>`]
          : friends.map(f => renderUserItem(f, f.is_online ? 'bg-green-500' : 'bg-gray-400', [
              { action: 'remove', label: '✗', class: 'bg-red-600 hover:bg-red-700 text-xs px-2' },
              { action: 'block', label: '🚫', class: 'bg-gray-600 hover:bg-gray-700 text-xs px-2' }
            ]))
      })}

      ${blocked.length > 0 ? renderSection({
        title: `🚫 ${i18n.t('blocked_users')} (${blocked.length})`,
        style: 'background: rgba(239, 68, 68, 0.1)',
        titleColor: '#ef4444',
        items: blocked.map(u => renderUserItem(u, 'bg-red-500', [
          { action: 'unblock', label: i18n.t('unblock'), class: 'bg-gray-600 hover:bg-gray-700' }
        ]))
      }) : ''}

      ${renderSearchBar()}

      <div class="friend-footer">
        <button id="btn-back" class="friend-back-btn">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}
