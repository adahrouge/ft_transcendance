export interface GamePlayer {
  id?: number;
  name?: string;
  username?: string;
  display_name?: string;
  score: number;
  paddleX: number;  // Horizontal position for vertical game
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
  scorer?: string;
  conceder?: string;
  inviterName?: string;
  onlineStatus?: Record<string, boolean>;
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

// Vertical orientation like offline game - paddles at top/bottom
export const DEFAULT_ONLINE_GAME_CONFIG: OnlineGameConfig = {
  width: 600,
  height: 600,
  paddleW: 80,   // Horizontal paddle width
  paddleH: 12,   // Horizontal paddle height
  ballR: 6,
};
