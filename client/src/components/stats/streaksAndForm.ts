import type { ComputedStats } from "../../utils/stats/compute";
import { renderStatCard } from "./statCard";

export function renderStreaksAndForm(stats: ComputedStats): string {
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
