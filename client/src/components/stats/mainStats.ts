import { i18n } from "../../services/i18n";
import type { ComputedStats } from "../../utils/stats/compute";
import { renderStatCard } from "./statCard";

export function renderMainStats(stats: ComputedStats): string {
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
