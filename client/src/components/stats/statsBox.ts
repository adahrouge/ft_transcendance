import { i18n } from "../../services/i18n";
import type { StatsUser, MatchHistoryItem } from "../../types/stats";
import type { ComputedStats } from "../../utils/stats/compute";
import { renderHeader } from "./header";
import { renderMainStats } from "./mainStats";
import { renderStreaksAndForm } from "./streaksAndForm";
import { renderMatchHistory } from "./matchHistory";

export function renderStatsBox(user: StatsUser, stats: ComputedStats, matches: MatchHistoryItem[]): string {
  return `
    <div class="stats-box">
      <h2 class="stats-title">${i18n.t('statistics')}</h2>

      ${renderHeader(user)}
      ${renderMainStats(stats)}
      ${renderStreaksAndForm(stats)}
      ${renderMatchHistory(matches)}

      <div class="stats-footer">
        <button id="btn-back" class="stats-back-btn">${i18n.t('back')}</button>
      </div>
    </div>
  `;
}
