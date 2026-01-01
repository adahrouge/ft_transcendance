import { i18n } from "../../services/i18n";
import type { MatchHistoryItem } from "../../types/stats";

export function renderMatchHistory(matches: MatchHistoryItem[]): string {
  return `
    <div class="stats-history-section">
      <h3 class="stats-section-title">${i18n.t('match_history')}</h3>
      <div class="stats-history-list">
        ${matches.length === 0
          ? `<p class="stats-empty">${i18n.t('no_matches')}</p>`
          : matches.map(renderMatchItem).join('')}
      </div>
    </div>
  `;
}

function renderMatchItem(m: MatchHistoryItem): string {
  const typeColor = m.game_type === 'tournament' ? '#eab308' : '#5db3d1';
  const typeLabel = m.game_type === 'tournament' ? 'TOURNAMENT' : (m.game_type === 'tictactoe' ? 'TTT' : 'PONG');
  const resultClass = m.result === 'win' ? 'stats-win' : m.result === 'draw' ? 'text-yellow-400' : 'stats-loss';

  return `
    <div class="stats-match-item">
      <div class="stats-match-opponent">
        <span class="stats-match-type" style="font-size: 10px; color: ${typeColor}; margin-right: 8px; border: 1px solid ${typeColor}; padding: 2px 4px;">
          ${typeLabel}
        </span>
        ${m.game_type !== 'tournament'
          ? `<span class="stats-match-vs">${i18n.t('vs')}</span><span class="stats-match-name">${m.opponent_username || 'AI Bot'}</span>`
          : m.result === 'win'
            ? `<span class="stats-match-name" style="color: #eab308;">${i18n.t('tournament_champion')}</span>`
            : `<span class="stats-match-name" style="color: #ef4444;">ELIMINATED</span>`}
      </div>
      <div class="stats-match-result ${resultClass}">
        ${m.game_type === 'tournament' ? `${m.user_score}-MAN` : `${m.user_score} - ${m.opponent_score}`}
      </div>
    </div>
  `;
}
