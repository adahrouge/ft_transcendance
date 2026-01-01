import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { createLoginPrompt, createModeSelection } from "../../components/tictactoe";

export function setupTicTacToe() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    showLoginPrompt(root);
    return;
  }

  showModeSelection(root);
}

function showLoginPrompt(root: HTMLElement) {
  root.innerHTML = createLoginPrompt();
  
  document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}

function showModeSelection(root: HTMLElement) {
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
