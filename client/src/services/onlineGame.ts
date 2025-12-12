import { apiRequest } from "../api";
import type {
  ActiveGame,
  OnlineGameState,
  GameMessage,
  ChatMessage,
  UserRole,
} from "../types/onlineGame";

type GameStateCallback = (gameState: OnlineGameState) => void;
type ChatMessageCallback = (message: ChatMessage) => void;
type GameEndCallback = (reason: string, message?: string) => void;
type GoalScoredCallback = (scorer: string, conceder: string) => void;
type GameInviteCallback = (inviterName: string, gameId: string) => void;
type OnlineStatusCallback = (onlineStatus: Record<string, boolean>) => void;

class OnlineGameService {
  private ws: WebSocket | null = null;
  private gameState: OnlineGameState | null = null;
  private onGameStateCallbacks: GameStateCallback[] = [];
  private onChatMessageCallbacks: ChatMessageCallback[] = [];
  private onGameEndCallbacks: GameEndCallback[] = [];
  private onGoalScoredCallbacks: GoalScoredCallback[] = [];
  private onGameInviteCallbacks: GameInviteCallback[] = [];
  private onOnlineStatusCallbacks: OnlineStatusCallback[] = [];
  private currentGameId: string | null = null;
  private userRole: UserRole = "spectator";
  private messageQueue: string[] = [];

  async getActiveGames(): Promise<{ games: ActiveGame[] }> {
    return apiRequest<{ games: ActiveGame[] }>("/api/games");
  }

  async getGame(gameId: string): Promise<OnlineGameState> {
    return apiRequest<OnlineGameState>(`/api/games/${gameId}`);
  }

  connect(token?: string): void {
    if (this.ws) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = token
      ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
      : `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("Connected to Pong backend");
      if (token) {
        this.send({ type: "AUTHENTICATE", token });
      }
      
      // Flush message queue
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg && this.ws) this.ws.send(msg);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data: GameMessage = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("Disconnected from backend");
      this.ws = null;
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleMessage(data: GameMessage): void {
    switch (data.type) {
      case "GAME_CREATED":
      case "JOINED_GAME":
        if (data.gameState) {
          this.gameState = data.gameState;
        }
        this.currentGameId = data.gameId || null;
        this.userRole = data.yourRole || "spectator";
        this.notifyGameStateCallbacks();
        break;
      case "GAME_STATE_UPDATE":
        if (data.gameState) {
          this.gameState = data.gameState;
        }
        this.notifyGameStateCallbacks();
        break;
      case "CHAT_MESSAGE":
        if (data.chatMessage) {
          this.notifyChatCallbacks(data.chatMessage);
        }
        break;
      case "CHAT_HISTORY":
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg) => this.notifyChatCallbacks(msg));
        }
        break;
      case "GOAL_SCORED":
        if (data.scorer && data.conceder) {
          this.notifyGoalScoredCallbacks(data.scorer, data.conceder);
        }
        break;
      case "PLAYER_LEFT":
        this.notifyGameEndCallbacks("player_left", data.message);
        break;
      case "GAME_ENDED":
        if (data.gameState) {
          this.gameState = data.gameState;
        }
        this.notifyGameEndCallbacks("game_ended");
        break;
      case "ERROR":
        console.error("Error from server:", data.message || data.error);
        break;
      case "GAME_INVITE":
        if (data.inviterName && data.gameId) {
          this.notifyGameInviteCallbacks(data.inviterName, data.gameId);
        }
        break;
      case "ONLINE_STATUS_UPDATE":
        if (data.onlineStatus) {
          this.notifyOnlineStatusCallbacks(data.onlineStatus);
        }
        break;
    }
  }

  createGame(
    player1Name?: string,
    player2Name?: string,
    player2Id?: string,
    player1Id?: string
  ): void {
    this.send({ type: "CREATE_GAME", player1Name, player2Name, player2Id, player1Id });
  }

  joinGame(gameId: string): void {
    this.send({ type: "JOIN_GAME", gameId });
  }

  movePaddle(position: number, forBot?: "player1" | "player2"): void {
    this.send({ type: "MOVE_PADDLE", position, ...(forBot && { forBot }) });
  }

  checkOnlineStatus(userIds: number[]): void {
    this.send({ type: "CHECK_ONLINE_STATUS", userIds });
  }

  sendChatMessage(message: string): void {
    if (message.trim()) {
      this.send({ type: "SEND_CHAT", message: message.trim() });
    }
  }

  private send(message: Record<string, unknown>): void {
    const msgStr = JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msgStr);
    } else {
      this.messageQueue.push(msgStr);
    }
  }

  onGameStateUpdate(callback: GameStateCallback): void {
    this.onGameStateCallbacks.push(callback);
  }

  onChatMessage(callback: ChatMessageCallback): void {
    this.onChatMessageCallbacks.push(callback);
  }

  onGameEnd(callback: GameEndCallback): void {
    this.onGameEndCallbacks.push(callback);
  }

  onGoalScored(callback: GoalScoredCallback): void {
    this.onGoalScoredCallbacks.push(callback);
  }

  onGameInvite(callback: GameInviteCallback): void {
    this.onGameInviteCallbacks.push(callback);
  }

  onOnlineStatusUpdate(callback: OnlineStatusCallback): void {
    this.onOnlineStatusCallbacks.push(callback);
  }

  private notifyGameStateCallbacks(): void {
    if (this.gameState) {
      this.onGameStateCallbacks.forEach((callback) => callback(this.gameState!));
    }
  }

  private notifyChatCallbacks(message: ChatMessage): void {
    this.onChatMessageCallbacks.forEach((callback) => callback(message));
  }

  private notifyGameEndCallbacks(reason: string, message?: string): void {
    this.onGameEndCallbacks.forEach((callback) => callback(reason, message));
  }

  private notifyGoalScoredCallbacks(scorer: string, conceder: string): void {
    this.onGoalScoredCallbacks.forEach((callback) => callback(scorer, conceder));
  }

  private notifyGameInviteCallbacks(inviterName: string, gameId: string): void {
    this.onGameInviteCallbacks.forEach((callback) => callback(inviterName, gameId));
  }

  private notifyOnlineStatusCallbacks(onlineStatus: Record<string, boolean>): void {
    this.onOnlineStatusCallbacks.forEach((callback) => callback(onlineStatus));
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  getUserRole(): UserRole {
    return this.userRole;
  }

  getGameState(): OnlineGameState | null {
    return this.gameState;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentGameId = null;
      this.gameState = null;
      this.onGameStateCallbacks = [];
      this.onChatMessageCallbacks = [];
      this.onGameEndCallbacks = [];
      this.onGoalScoredCallbacks = [];
      this.onOnlineStatusCallbacks = [];
      this.userRole = "spectator";
    }
  }
}

export const onlineGameService = new OnlineGameService();
