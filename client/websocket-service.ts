export class WebSocketService {
  private ws: WebSocket | null = null;
  private gameState: any = null;
  private onGameStateCallbacks: ((gameState: any) => void)[] = [];
  private onChatMessageCallbacks: ((message: any) => void)[] = [];
  private currentGameId: string | null = null;
  private userRole: string = 'spectator';

  connect(token?: string) {
    try {
      // Use wss for HTTPS or ws for HTTP, based on current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = token 
        ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
        : `${protocol}//${host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Pong backend');
        
        // Authenticate if token provided
        if (token) {
          this.send({
            type: 'AUTHENTICATE',
            token: token
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from backend');
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  private handleMessage(data: any) {
    console.log('📨 Received:', data.type);
    
    switch (data.type) {
      case 'GAME_CREATED':
        this.gameState = data.gameState;
        this.currentGameId = data.gameId;
        this.userRole = data.yourRole || 'spectator';
        this.notifyGameStateCallbacks();
        break;
        
      case 'JOINED_GAME':
        this.gameState = data.gameState;
        this.currentGameId = data.gameId;
        this.userRole = data.yourRole || 'spectator';
        this.notifyGameStateCallbacks();
        break;
        
      case 'GAME_STATE_UPDATE':
        this.gameState = data.gameState;
        this.notifyGameStateCallbacks();
        break;
        
      case 'CHAT_MESSAGE':
        this.notifyChatCallbacks(data.chatMessage);
        break;
        
      case 'CHAT_HISTORY':
        // Notify for each message in history
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: any) => {
            this.notifyChatCallbacks(msg);
          });
        }
        break;
        
      case 'WELCOME':
        console.log('🎮', data.message);
        break;
        
      case 'AUTHENTICATED':
        console.log('✅ Authenticated as', data.user?.username);
        break;
        
      case 'PONG':
        console.log('🏓 Pong received');
        break;
        
      case 'ERROR':
        console.error('❌ Error from server:', data.message || data.error);
        // Notify callbacks about errors (especially auth errors)
        this.onGameStateCallbacks.forEach(callback => {
          callback(null); // Pass null to indicate error
        });
        break;
        
      case 'SPECTATOR_JOINED':
      case 'SPECTATOR_LEFT':
        // Could notify UI about spectator count changes
        break;
    }
  }

  // Game actions
  createGame(player1Name: string, player2Name: string, player2Id?: string) {
    this.send({
      type: 'CREATE_GAME',
      player1Name,
      player2Name,
      player2Id
    });
  }

  joinGame(gameId: string) {
    this.send({
      type: 'JOIN_GAME',
      gameId
    });
  }

  movePaddle(position: number, forBot?: 'player1' | 'player2') {
    this.send({
      type: 'MOVE_PADDLE',
      position,
      ...(forBot && { forBot })
    });
  }

  sendChatMessage(message: string) {
    if (message.trim()) {
      this.send({
        type: 'SEND_CHAT',
        message: message.trim()
      });
    }
  }

  // Utility methods
  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  // Subscribe to game state updates
  onGameStateUpdate(callback: (gameState: any) => void) {
    this.onGameStateCallbacks.push(callback);
  }

  // Subscribe to chat messages
  onChatMessage(callback: (message: any) => void) {
    this.onChatMessageCallbacks.push(callback);
  }

  private notifyGameStateCallbacks() {
    this.onGameStateCallbacks.forEach(callback => {
      callback(this.gameState);
    });
  }

  private notifyChatCallbacks(message: any) {
    this.onChatMessageCallbacks.forEach(callback => {
      callback(message);
    });
  }

  getCurrentGameState() {
    return this.gameState;
  }

  getCurrentGameId() {
    return this.currentGameId;
  }

  getUserRole() {
    return this.userRole;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentGameId = null;
      this.gameState = null;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
