import { navigateTo } from "../../router";
import { getDifficultyLabel, type BallSpeedLevel } from "../pong";
import { createMatchSetup } from "../../components/pongAi";
import { pongAiState } from "./state";
import { startAiMatch } from "./match";

export function showAiMatchSetup(root: HTMLElement, config: any) {
  const difficultyLabel = getDifficultyLabel(pongAiState.selectedAIDifficulty);
  
  root.innerHTML = createMatchSetup(
    config.scoreToWin,
    pongAiState.selectedBallSpeed,
    pongAiState.selectedAIDifficulty,
    difficultyLabel
  );

  setupBallSpeedSelection();
  setupDifficultySlider();
  
  document.getElementById("btn-start")?.addEventListener("click", () => startAiMatch(root, config));
  document.getElementById("btn-back")?.addEventListener("click", () => navigateTo("/pong"));
}

function setupBallSpeedSelection() {
  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pongAiState.selectedBallSpeed = (btn as HTMLElement).dataset.speed as BallSpeedLevel;
      document.querySelectorAll("[data-speed]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function setupDifficultySlider() {
  const difficultySlider = document.getElementById("difficulty-slider") as HTMLInputElement;
  const difficultyLabel = document.getElementById("difficulty-label");
  
  difficultySlider?.addEventListener("input", () => {
    pongAiState.selectedAIDifficulty = parseInt(difficultySlider.value, 10);
    if (difficultyLabel) {
      difficultyLabel.textContent = getDifficultyLabel(pongAiState.selectedAIDifficulty);
    }
  });
}
