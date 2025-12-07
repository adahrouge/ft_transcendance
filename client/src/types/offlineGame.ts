export type AIConfig = {
  tableW: number;
  tableH: number;
  paddleW: number;
  paddleH: number;
  paddleY: number;
  ballSize: number;
  baseBallSpeed: number;
  maxSpeed: number;
  maxAccel: number;
  reactionMs: number;
  aimJitter: number;
  steadyJitter: number;
  overshootBias: number;
  minReactionMs: number;
  maxReactionMs: number;
  minJitter: number;
  maxJitter: number;
  focusCycleMs: number;
  defocusFrac: number;
  defocusMultiplier: number;
};

export type BallState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type AISnapshot = {
  targetX: number;
  predictedX: number | null;
  tracking: "idle" | "predicting" | "centering";
};

export type GameState = {
  playerX: number;
  aiX: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  scorePlayer: number;
  scoreAI: number;
  paused: boolean;
  gameStarted: boolean;
};

export type GameConfig = {
  width: number;
  height: number;
  paddleW: number;
  paddleH: number;
  ballSize: number;
  paddleSpeed: number;
  ballSpeed: number;
  scoreToWin: number;
};
