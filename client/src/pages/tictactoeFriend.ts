import { setupTicTacToeFriend } from "../utils/tictactoeFriend";
import "../styles/tictactoe.css";

export function renderTicTacToeFriendPage(): string {
  setTimeout(setupTicTacToeFriend, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
