import type { Board, Player } from "../types/tictactoe";

export interface OnlineGameState {
  gameId: string;
  mySymbol: Player;
  opponent: string;
  board: Board;
  currentPlayer: Player;
  isMyTurn: boolean;
}

export interface GameUpdateData {
  board: Board;
  currentPlayer: Player;
  winner?: Player | 'draw';
}

type QueueUpdateListener = (count: number) => void;
type JoinedQueueListener = () => void;
type LeftQueueListener = () => void;
type GameStartListener = (state: OnlineGameState) => void;
type GameUpdateListener = (data: GameUpdateData) => void;
type OpponentDisconnectedListener = () => void;
type ErrorListener = (message: string) => void;

class TictactoeMatchmakingService {
  private socket: WebSocket | null = null;
  private queueUpdateListeners: QueueUpdateListener[] = [];
  private joinedQueueListeners: JoinedQueueListener[] = [];
  private leftQueueListeners: LeftQueueListener[] = [];
  private gameStartListeners: GameStartListener[] = [];
  private gameUpdateListeners: GameUpdateListener[] = [];
  private opponentDisconnectedListeners: OpponentDisconnectedListener[] = [];
  private errorListeners: ErrorListener[] = [];

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}/api/tictactoe/matchmaking`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      // Close any existing socket that's not open (e.g., CONNECTING, CLOSING, CLOSED)
      if (this.socket) {
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.onopen = null;
        if (this.socket.readyState !== WebSocket.CLOSED) {
          this.socket.close();
        }
        this.socket = null;
      }

      try {
        this.socket = new WebSocket(this.getWebSocketUrl());

        this.socket.onopen = () => resolve();
        this.socket.onerror = (err) => reject(err);

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        this.socket.onclose = (event) => {
          // Only nullify if this is still the current socket
          if (this.socket && this.socket === event.target) {
            this.socket = null;
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'authenticated':
        this.send({ type: 'get_queue_count' });
        break;

      case 'queue_update':
        this.queueUpdateListeners.forEach(l => l(data.count));
        break;

      case 'joined_queue':
        this.joinedQueueListeners.forEach(l => l());
        break;

      case 'left_queue':
        this.leftQueueListeners.forEach(l => l());
        break;

      case 'game_start':
        this.gameStartListeners.forEach(l => l({
          gameId: data.gameId,
          mySymbol: data.yourSymbol,
          opponent: data.opponent,
          board: data.board,
          currentPlayer: data.currentPlayer,
          isMyTurn: data.yourSymbol === data.currentPlayer
        }));
        break;

      case 'game_update':
        this.gameUpdateListeners.forEach(l => l({
          board: data.board,
          currentPlayer: data.currentPlayer,
          winner: data.winner
        }));
        break;

      case 'opponent_disconnected':
        this.opponentDisconnectedListeners.forEach(l => l());
        break;

      case 'error':
        this.errorListeners.forEach(l => l(data.message));
        break;
    }
  }

  private send(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  joinQueue() {
    this.send({ type: 'join_queue' });
  }

  leaveQueue() {
    this.send({ type: 'leave_queue' });
  }

  makeMove(index: number) {
    this.send({ type: 'move', index });
  }

  onQueueUpdate(listener: QueueUpdateListener) {
    this.queueUpdateListeners.push(listener);
    return () => {
      const i = this.queueUpdateListeners.indexOf(listener);
      if (i > -1) this.queueUpdateListeners.splice(i, 1);
    };
  }

  onJoinedQueue(listener: JoinedQueueListener) {
    this.joinedQueueListeners.push(listener);
    return () => {
      const i = this.joinedQueueListeners.indexOf(listener);
      if (i > -1) this.joinedQueueListeners.splice(i, 1);
    };
  }

  onLeftQueue(listener: LeftQueueListener) {
    this.leftQueueListeners.push(listener);
    return () => {
      const i = this.leftQueueListeners.indexOf(listener);
      if (i > -1) this.leftQueueListeners.splice(i, 1);
    };
  }

  onGameStart(listener: GameStartListener) {
    this.gameStartListeners.push(listener);
    return () => {
      const i = this.gameStartListeners.indexOf(listener);
      if (i > -1) this.gameStartListeners.splice(i, 1);
    };
  }

  onGameUpdate(listener: GameUpdateListener) {
    this.gameUpdateListeners.push(listener);
    return () => {
      const i = this.gameUpdateListeners.indexOf(listener);
      if (i > -1) this.gameUpdateListeners.splice(i, 1);
    };
  }

  onOpponentDisconnected(listener: OpponentDisconnectedListener) {
    this.opponentDisconnectedListeners.push(listener);
    return () => {
      const i = this.opponentDisconnectedListeners.indexOf(listener);
      if (i > -1) this.opponentDisconnectedListeners.splice(i, 1);
    };
  }

  onError(listener: ErrorListener) {
    this.errorListeners.push(listener);
    return () => {
      const i = this.errorListeners.indexOf(listener);
      if (i > -1) this.errorListeners.splice(i, 1);
    };
  }

  clearListeners() {
    this.queueUpdateListeners = [];
    this.joinedQueueListeners = [];
    this.leftQueueListeners = [];
    this.gameStartListeners = [];
    this.gameUpdateListeners = [];
    this.opponentDisconnectedListeners = [];
    this.errorListeners = [];
  }
}

export const tictactoeMatchmakingService = new TictactoeMatchmakingService();
