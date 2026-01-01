import { navigateTo } from "../../router";
import { isAuthenticated } from "../auth";
import { DEFAULT_GAME_CONFIG } from "../pong";
import { createLoginPrompt } from "../../components/pongAi";
import { showAiMatchSetup } from "./matchSetup";

export function setupPongAi() {
  const root = document.getElementById("game-root");
  if (!root) return;

  if (!isAuthenticated()) {
    showLoginPrompt(root);
    return;
  }

  showAiMatchSetup(root, DEFAULT_GAME_CONFIG);
}

function showLoginPrompt(root: HTMLElement) {
  root.innerHTML = createLoginPrompt();
  
  document.getElementById("btn-login")?.addEventListener("click", () => navigateTo("/auth"));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/pong"));
}
