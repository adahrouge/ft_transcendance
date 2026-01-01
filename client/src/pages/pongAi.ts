import { setupPongAi } from "../utils/pongAi";
import "../styles/pong.css";

export function renderPongAiPage(): string {
  setTimeout(setupPongAi, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
