// Main setup
export { setupPongPage } from "./setup";

// AI
export { PongAI, clamp } from "./ai";

// Config
export { 
  DEFAULT_GAME_CONFIG, 
  BALL_SPEEDS, 
  AI_DIFFICULTY_LABELS, 
  getAIConfigFromDifficulty, 
  getDifficultyLabel 
} from "./config";

// Game Engine
export { 
  renderGame, 
  createGameState, 
  updateBallPhysics, 
  setupTouchControls, 
  startCountdown 
} from "./gameEngine";

// Re-export types for convenience
export type { BallSpeedLevel, SharedGameState } from "../../types/pong";

