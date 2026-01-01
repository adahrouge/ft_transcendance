import type { Board, Player } from "../../types/tictactoe";

export let matchmakingSocket: WebSocket | null = null;

export interface OnlineGameState {
  gameId: string | null;
  mySymbol: Player | null;
  opponent: string | null;
  board: Board;
  currentPlayer: Player;
  isMyTurn: boolean;
}

export let onlineGameState: OnlineGameState | null = null;

export function setMatchmakingSocket(socket: WebSocket | null) {
  matchmakingSocket = socket;
}

export function setOnlineGameState(state: OnlineGameState | null) {
  onlineGameState = state;
}

export function cleanupMatchmaking() {
  if (matchmakingSocket) {
    matchmakingSocket.close();
    matchmakingSocket = null;
  }
  onlineGameState = null;
}
