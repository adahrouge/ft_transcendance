import { setupTicTacToeAi } from "../utils/tictactoeAi";
import "../styles/tictactoe.css";

export function renderTicTacToeAiPage(): string {
  setTimeout(setupTicTacToeAi, 0);

  return `
    <div class="tictactoe-container">
      <div class="tictactoe-overlay"></div>
      <div class="tictactoe-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;
}
