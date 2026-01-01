import type { BallSpeedLevel } from "../../types/pong";

export interface PongFriendState {
  selectedBallSpeed: BallSpeedLevel;
  globalRaf: number | null;
}

export const pongFriendState: PongFriendState = {
  selectedBallSpeed: "normal",
  globalRaf: null,
};
