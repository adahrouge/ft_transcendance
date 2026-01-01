import { setupPongPage } from "../utils/pong";
import "../styles/pong.css";

export function renderGamePage(): string {
  setTimeout(setupPongPage, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

