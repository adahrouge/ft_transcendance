import { navigateTo } from "../../router";
import { type BallSpeedLevel } from "../pong";
import { createMatchSetup } from "../../components/pongFriendGame";
import { pongFriendState } from "./state";
import { startFriendMatch } from "./match";

export function showFriendMatchSetup(root: HTMLElement, config: any) {
  root.innerHTML = createMatchSetup(config.scoreToWin, pongFriendState.selectedBallSpeed);

  setupBallSpeedSelection();
  
  document.getElementById("btn-start")?.addEventListener("click", () => startFriendMatch(root, config));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/pong"));
}

function setupBallSpeedSelection() {
  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pongFriendState.selectedBallSpeed = (btn as HTMLElement).dataset.speed as BallSpeedLevel;
      document.querySelectorAll("[data-speed]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}
