import { setupPongFriendGame } from "../utils/pongFriendGame";
import "../styles/pong.css";

export function renderFriendGamePage(): string {
  setTimeout(setupPongFriendGame, 0);

  return `
    <div class="pong-container">
      <div class="pong-overlay"></div>
      <div class="pong-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
