import { setupStatsPage } from "../utils/stats";
import "../styles/stats.css";

export function renderStatsPage(): string {
  setTimeout(setupStatsPage, 0);

  return `
    <div class="stats-container">
      <div class="stats-overlay"></div>
      <div class="stats-content">
        <div id="stats-root" class="w-full max-w-[900px] flex justify-center items-center min-h-[500px]">
          <svg style="color: #5db3d1; animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
        </div>
      </div>
    </div>
  `;
}
