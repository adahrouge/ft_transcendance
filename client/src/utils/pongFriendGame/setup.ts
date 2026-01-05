import { DEFAULT_GAME_CONFIG } from "../pong";
import { showFriendMatchSetup } from "./matchSetup";

export function setupPongFriendGame() {
  const root = document.getElementById("game-root");
  if (!root) return;

  showFriendMatchSetup(root, DEFAULT_GAME_CONFIG);
}
