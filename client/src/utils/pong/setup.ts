import { navigateTo } from "../../router";
import { createModeSelection } from "../../components/pong";

export function setupPongPage() {
  const root = document.getElementById("game-root");
  if (!root) return;

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

  document.getElementById("btn-local-tournament")?.addEventListener("click", () => {
    navigateTo("/local-tournament");
  });

  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/home"));
}
