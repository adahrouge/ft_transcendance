import { setupTournament } from "../utils/pongTournament";
import "../styles/pong.css";
import "../styles/pongTournament.css";

export function renderTournamentPage(): string {
  setTimeout(setupTournament, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
