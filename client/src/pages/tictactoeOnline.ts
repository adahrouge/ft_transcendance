import { setupTicTacToeOnline } from "../utils/tictactoeOnline";
import "../styles/tictactoe.css";

export function renderTicTacToeOnlinePage(): string {
  setTimeout(setupTicTacToeOnline, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
