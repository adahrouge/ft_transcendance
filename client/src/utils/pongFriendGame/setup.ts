import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { DEFAULT_GAME_CONFIG } from "../pong";
import { createLoginPrompt } from "../../components/pongFriendGame";
import { showFriendMatchSetup } from "./matchSetup";

export function setupPongFriendGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    showLoginPrompt(root);
    return;
  }

  showFriendMatchSetup(root, DEFAULT_GAME_CONFIG);
}

function showLoginPrompt(root: HTMLElement) {
  root.innerHTML = createLoginPrompt();
  
  document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
