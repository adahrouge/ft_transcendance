import { DEFAULT_GAME_CONFIG } from "../pong";
import { showAiMatchSetup } from "./matchSetup";

export function setupPongAi() {
  const root = document.getElementById("game-root");
  if (!root) return;

  showAiMatchSetup(root, DEFAULT_GAME_CONFIG);
}
