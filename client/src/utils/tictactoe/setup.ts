import { navigateTo } from "../../router";
import { createModeSelection } from "../../components/tictactoe";

export function setupTicTacToe() {
  const root = document.getElementById("game-root");
  if (!root) return;

  root.innerHTML = createModeSelection();

  document.getElementById("btn-vs-ai")?.addEventListener("click", () => {
    navigateTo("/tictactoe-ai");
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    navigateTo("/tictactoe-friend");
  });

  document.getElementById("btn-find-game")?.addEventListener("click", () => {
    navigateTo("/tictactoe-online");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
