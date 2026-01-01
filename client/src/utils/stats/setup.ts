import { statsService } from "../../services/stats";
import { navigateTo } from "../../router";
import type { MatchHistoryItem, PlayerStats } from "../../types/stats";
import { computeStats } from "./compute";
import { renderStatsBox } from "../../components/stats";

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

function setupEventListeners() {
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
