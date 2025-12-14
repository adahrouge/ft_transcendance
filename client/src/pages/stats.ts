import { statsService } from "../services/stats";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import { i18n } from "../services/i18n";
import { onlineGameService } from "../services/onlineGame";
import { getToken } from "../utils/auth";
import type { MatchHistoryItem, StatsUser, PlayerStats } from "../types/stats";
import "../styles/stats.css";
import backgroundImage from "../assets/images/background.jpg";

export function renderStatsPage(): string {
  setTimeout(() => {
    loadStats();
  }, 0);

  return `
    <div class="stats-container" style="background-image: url('${backgroundImage}')">
      <div class="stats-overlay"></div>
      <div class="stats-content">
        <div id="stats-root" class="w-full max-w-[800px]">
          <div class="text-center text-white font-['Pixel_Game']">${i18n.t('loading')}</div>
        </div>
      </div>
    </div>
  `;
}

async function loadStats() {
  const root = document.getElementById("stats-root");
  if (!root) return;

  try {
    const userResponse = await statsService.getUserProfile();
    const user: StatsUser = userResponse.user;

    let matchHistory: MatchHistoryItem[] = [];
    let stats: PlayerStats | null = null;

    try {
      const historyResponse = await statsService.getMatchHistory();
      matchHistory = historyResponse.matches || [];
    } catch (e) { console.error(e); }

    try {
      const statsResponse = await statsService.getStats();
      stats = statsResponse.stats;
    } catch (e) { console.error(e); }

    // Calculate stats from match history if stats endpoint not available
    const totalGames = stats?.total_games ?? matchHistory.length;
    const wins = stats?.wins ?? matchHistory.filter(m => m.result === 'win').length;
    const losses = stats?.losses ?? (totalGames - wins);
    const winRate = stats?.win_rate ?? (totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0);

    root.innerHTML = `
      <div class="stats-box">
        <h2 class="stats-title">${i18n.t('statistics')}</h2>

        <div class="stats-player-info">
          <img src="${getAvatarUrl(user)}"
               class="stats-avatar" alt="Avatar">
          <div class="stats-player-name">${user.display_name || user.username}</div>
        </div>

        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-value">${totalGames}</div>
            <div class="stats-card-label">${i18n.t('total_games')}</div>
          </div>
          <div class="stats-card stats-card-win">
            <div class="stats-card-value">${wins}</div>
            <div class="stats-card-label">${i18n.t('wins')}</div>
          </div>
          <div class="stats-card stats-card-loss">
            <div class="stats-card-value">${losses}</div>
            <div class="stats-card-label">${i18n.t('losses')}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-value">${winRate}%</div>
            <div class="stats-card-label">${i18n.t('win_rate')}</div>
          </div>
        </div>

        <div class="stats-history-section">
          <h3 class="stats-section-title">${i18n.t('match_history')}</h3>
          <div class="stats-history-list">
            ${matchHistory.length === 0 ? `<p class="stats-empty">${i18n.t('no_matches')}</p>` : matchHistory.map(m => `
              <div class="stats-match-item">
                <div class="stats-match-opponent">
                  <span class="stats-match-vs">${i18n.t('vs')}</span>
                  <span class="stats-match-name">${m.opponent_username || 'AI Bot'}</span>
                </div>
                <div class="stats-match-result ${m.result === 'win' ? 'stats-win' : 'stats-loss'}">
                  ${m.user_score} - ${m.opponent_score}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="stats-footer">
          <button id="btn-back" class="stats-back-btn">${i18n.t('back')}</button>
        </div>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));

    // Connect to WebSocket to register as online
    const token = getToken();
    if (token) {
      onlineGameService.connect(token);
    }

  } catch (err) {
    root.innerHTML = '<div class="text-red-500 font-[\'Pixel_Game\']">Failed to load statistics.</div>';
  }
}
