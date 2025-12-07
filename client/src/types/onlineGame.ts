export interface GamePlayer {
  id?: number;
  username: string;
  display_name?: string;
  score: number;
  paddleY: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface OnlineGameState {
  players: GamePlayer[];
  ball: Ball;
  status: "waiting" | "playing" | "finished";
  winner?: string;
}

export interface ActiveGame {
  id: string;
  p1: string;
  p2: string;
  status: string;
}

export interface GameMessage {
  type: string;
  gameId?: string;
  gameState?: OnlineGameState;
  yourRole?: UserRole;
  message?: string;
  error?: string;
  chatMessage?: ChatMessage;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

export type UserRole = "player1" | "player2" | "spectator";

export interface OnlineGameConfig {
  width: number;
  height: number;
  paddleW: number;
  paddleH: number;
  ballR: number;
}

export const DEFAULT_ONLINE_GAME_CONFIG: OnlineGameConfig = {
  width: 960,
  height: 540,
  paddleW: 14,
  paddleH: 90,
  ballR: 8,
};
