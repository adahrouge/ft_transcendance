import type { BallSpeedLevel } from "../../types/pong";

export interface PongAiState {
  selectedBallSpeed: BallSpeedLevel;
  selectedAIDifficulty: number;
  globalRaf: number | null;
}

export const pongAiState: PongAiState = {
  selectedBallSpeed: "normal",
  selectedAIDifficulty: 50,
  globalRaf: null,
};
