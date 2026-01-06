import { setupLocalTournament } from "../utils/pongLocalTournament";
import "../styles/pong.css";
import "../styles/pongTournament.css";

export function renderLocalTournamentPage(): string {
  setTimeout(setupLocalTournament, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
