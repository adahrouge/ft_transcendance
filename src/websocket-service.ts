export class WebSocketService {
  private ws: WebSocket | null = null;
  private gameState: any = null;
  private onGameStateCallbacks: ((gameState: any) => void)[] = [];

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:3001/ws');
      
      this.ws.onopen = () => {
        console.log('✅ Connected to Pong backend');
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
        this.notifyGameStateCallbacks();
        break;
        
      case 'GAME_STATE_UPDATE':
        this.gameState = data.gameState;
        this.notifyGameStateCallbacks();
        break;
        
      case 'WELCOME':
        console.log('🎮', data.message);
        break;
        
      case 'PONG':
        console.log('🏓 Pong received');
        break;
    }
  }

  // Game actions
  createGame(player1Name: string, player2Name: string) {
    this.send({
      type: 'CREATE_GAME',
      player1Name,
      player2Name
    });
  }

  movePaddle(position: number) {
    this.send({
      type: 'MOVE_PADDLE',
      position
    });
  }

  joinGame(gameId: string) {
    this.send({
      type: 'JOIN_GAME',
      gameId
    });
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

  private notifyGameStateCallbacks() {
    this.onGameStateCallbacks.forEach(callback => {
      callback(this.gameState);
    });
  }

  getCurrentGameState() {
    return this.gameState;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
