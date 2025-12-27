import { statsService } from "../services/stats";
import { navigateTo } from "../router";
import { getAvatarUrl } from "../utils/home";
import { i18n } from "../services/i18n";
import type { MatchHistoryItem, StatsUser, PlayerStats } from "../types/stats";

// ============ Main Setup ============

export async function setupStatsPage() {
  const root = document.getElementById("stats-root");
  if (!root) return;

  try {
    const userResponse = await statsService.getUserProfile();
    const user = userResponse.user;

    let matchHistory: MatchHistoryItem[] = [];
    let stats: PlayerStats | null = null;

    try {
      const historyResponse = await statsService.getMatchHistory();
      matchHistory = historyResponse.matches || [];
    } catch { /* ignore */ }

    try {
      const statsResponse = await statsService.getStats();
      stats = statsResponse.stats;
    } catch { /* ignore */ }

    const computed = computeStats(stats, matchHistory);
    root.innerHTML = renderStatsBox(user, computed, matchHistory);
    setupEventListeners();
  } catch {
    root.innerHTML = '<div class="text-red-500 font-[\'Pixel_Game\']">Failed to load statistics.</div>';
  }
}

// ============ Stats Computation ============

interface ComputedStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tournamentsWon: number;
  currentStreak: number;
  longestStreak: number;
  pongStats: { played: number; wins: number; losses: number };
  tttStats: { played: number; wins: number; losses: number };
  recentForm: string[];
  avgScore: number;
  avgOpponentScore: number;
}

function computeStats(stats: PlayerStats | null, matches: MatchHistoryItem[]): ComputedStats {
  const totalGames = stats?.total_games ?? matches.length;
  const wins = stats?.wins ?? matches.filter(m => m.result === 'win').length;
  const losses = stats?.losses ?? matches.filter(m => m.result === 'loss').length;
  const draws = stats?.draws ?? matches.filter(m => m.result === 'draw').length;
  const winRate = stats?.win_rate ?? (totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0);
  const tournamentsWon = stats?.tournaments_won ?? matches.filter(m => m.game_type === 'tournament' && m.result === 'win').length;
  const currentStreak = stats?.current_win_streak ?? calculateCurrentStreak(matches);
  const longestStreak = stats?.longest_win_streak ?? calculateLongestStreak(matches);

  // Per-game stats
  const pongMatches = matches.filter(m => m.game_type === 'pong' || m.game_type === 'online');
  const tttMatches = matches.filter(m => m.game_type === 'tictactoe');

  const pongStats = {
    played: pongMatches.length,
    wins: pongMatches.filter(m => m.result === 'win').length,
    losses: pongMatches.filter(m => m.result === 'loss').length
  };

  const tttStats = {
    played: tttMatches.length,
    wins: tttMatches.filter(m => m.result === 'win').length,
    losses: tttMatches.filter(m => m.result === 'loss').length
  };

  // Recent form (last 5 games)
  const recentForm = matches.slice(0, 5).map(m => m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D');

  // Average scores
  const scoredMatches = matches.filter(m => m.game_type !== 'tournament');
  const totalScored = scoredMatches.reduce((sum, m) => sum + m.user_score, 0);
  const totalConceded = scoredMatches.reduce((sum, m) => sum + m.opponent_score, 0);
  const avgScore = scoredMatches.length > 0 ? Math.round((totalScored / scoredMatches.length) * 10) / 10 : 0;
  const avgOpponentScore = scoredMatches.length > 0 ? Math.round((totalConceded / scoredMatches.length) * 10) / 10 : 0;

  return { totalGames, wins, losses, draws, winRate, tournamentsWon, currentStreak, longestStreak, pongStats, tttStats, recentForm, avgScore, avgOpponentScore };
}

function calculateCurrentStreak(matches: MatchHistoryItem[]): number {
  let streak = 0;
  for (const m of matches) {
    if (m.result === 'win') streak++;
    else break;
  }
  return streak;
}

function calculateLongestStreak(matches: MatchHistoryItem[]): number {
  let longest = 0, current = 0;
  for (const m of matches) {
    if (m.result === 'win') {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

// ============ Templates ============

function renderStatsBox(user: StatsUser, stats: ComputedStats, matches: MatchHistoryItem[]): string {
  return `
    <div class="stats-box">
      <h2 class="stats-title">${i18n.t('statistics')}</h2>

      ${renderHeader(user)}
      ${renderMainStats(stats)}
      ${renderStreaksAndForm(stats)}
      ${renderGameBreakdown(stats)}
      ${renderMatchHistory(matches)}

      <div class="stats-footer">
        <button id="btn-back" class="stats-back-btn">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}

function renderHeader(user: StatsUser): string {
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

function renderMainStats(stats: ComputedStats): string {
  return `
    <div class="stats-grid">
      ${renderStatCard(stats.totalGames.toString(), i18n.t('total_games'))}
      ${renderStatCard(stats.wins.toString(), i18n.t('wins'), 'stats-card-win')}
      ${renderStatCard(stats.losses.toString(), i18n.t('losses'), 'stats-card-loss')}
      ${renderStatCard(stats.draws.toString(), i18n.t('draw') || 'Draws')}
      ${renderStatCard(`${stats.winRate}%`, i18n.t('win_rate'))}
      ${renderStatCard(stats.tournamentsWon.toString(), i18n.t('tournaments_won'), 'stats-card-tournament')}
    </div>
  `;
}

function renderStreaksAndForm(stats: ComputedStats): string {
  const formColors: Record<string, string> = { W: 'bg-green-500', L: 'bg-red-500', D: 'bg-yellow-500' };

  return `
    <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr);">
      ${renderStatCard(stats.currentStreak.toString(), 'Streak')}
      ${renderStatCard(stats.longestStreak.toString(), 'Best')}
      ${renderStatCard(`${stats.pongStats.wins}/${stats.pongStats.played}`, 'Pong')}
      ${renderStatCard(`${stats.tttStats.wins}/${stats.tttStats.played}`, 'TTT')}
      <div class="stats-card">
        <div class="stats-card-value flex gap-0.5 justify-center">
          ${stats.recentForm.length > 0
            ? stats.recentForm.map(r => `<span class="w-4 h-4 rounded ${formColors[r]} flex items-center justify-center text-[8px] font-bold">${r}</span>`).join('')
            : '-'}
        </div>
        <div class="stats-card-label">Form</div>
      </div>
    </div>
  `;
}

function renderGameBreakdown(_stats: ComputedStats): string {
  return '';
}

function renderStatCard(value: string, label: string, extraClass = ''): string {
  return `
    <div class="stats-card ${extraClass}">
      <div class="stats-card-value">${value}</div>
      <div class="stats-card-label">${label}</div>
    </div>
  `;
}

function renderMatchHistory(matches: MatchHistoryItem[]): string {
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
          : `<span class="stats-match-name" style="color: #eab308;">${i18n.t('tournament_champion')}</span>`}
      </div>
      <div class="stats-match-result ${resultClass}">
        ${m.game_type === 'tournament' ? `${m.user_score}-man` : `${m.user_score} - ${m.opponent_score}`}
      </div>
    </div>
  `;
}

// ============ Event Listeners ============

function setupEventListeners() {
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
