import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { createLoginPrompt, createModeSelection } from "../../components/pong";

export function setupPongPage() {
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
    navigateTo("/pong-ai");
  });

  document.getElementById("btn-vs-friend")?.addEventListener("click", () => {
    navigateTo("/pong-friend");
  });

  document.getElementById("btn-tournament")?.addEventListener("click", () => {
    navigateTo("/tournament");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
