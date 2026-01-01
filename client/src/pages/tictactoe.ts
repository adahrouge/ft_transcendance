import { setupTicTacToe } from "../utils/tictactoe";
import "../styles/tictactoe.css";

export function renderTicTacToePage(): string {
  setTimeout(setupTicTacToe, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}

