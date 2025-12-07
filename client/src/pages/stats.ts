import { statsService } from "../services/stats";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
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
          <div class="text-center text-white font-['Pixel_Game']">Loading statistics...</div>
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
        <h2 class="stats-title">STATISTICS</h2>

        <div class="stats-player-info">
          <img src="${getAvatarUrl(user)}"
               class="stats-avatar" alt="Avatar">
          <div class="stats-player-name">${user.display_name || user.username}</div>
        </div>

        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-card-value">${totalGames}</div>
            <div class="stats-card-label">TOTAL GAMES</div>
          </div>
          <div class="stats-card stats-card-win">
            <div class="stats-card-value">${wins}</div>
            <div class="stats-card-label">WINS</div>
          </div>
          <div class="stats-card stats-card-loss">
            <div class="stats-card-value">${losses}</div>
            <div class="stats-card-label">LOSSES</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-value">${winRate}%</div>
            <div class="stats-card-label">WIN RATE</div>
          </div>
        </div>

        <div class="stats-history-section">
          <h3 class="stats-section-title">MATCH HISTORY</h3>
          <div class="stats-history-list">
            ${matchHistory.length === 0 ? '<p class="stats-empty">No matches played yet.</p>' : matchHistory.map(m => `
              <div class="stats-match-item">
                <div class="stats-match-opponent">
                  <span class="stats-match-vs">vs</span>
                  <span class="stats-match-name">${m.opponent_username || 'Unknown'}</span>
                </div>
                <div class="stats-match-result ${m.result === 'win' ? 'stats-win' : 'stats-loss'}">
                  ${m.user_score} - ${m.opponent_score}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="stats-footer">
          <button id="btn-back" class="stats-back-btn">BACK</button>
        </div>
      </div>
    `;

    document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));

  } catch (err) {
    root.innerHTML = '<div class="text-red-500 font-[\'Pixel_Game\']">Failed to load statistics.</div>';
  }
}
