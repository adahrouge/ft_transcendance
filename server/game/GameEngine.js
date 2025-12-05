  class GameEngine {
  constructor() {
    this.games = new Map();
    this.connectedPlayers = new Map();
    this.gameIntervals = new Map();
    this.gameConnections = new Map(); // gameId -> Set of WebSocket connections
    this.gameChat = new Map(); // gameId -> Array of chat messages
    this.tournamentChat = new Map(); // tournamentId -> Array of chat messages
    this.tournamentConnections = new Map(); // tournamentId -> Set of WebSocket connections
    console.log('🎮 Game Engine initialized');
  }

  createGame(player1, player2, isP1Bot = false, isP2Bot = false) {
    const gameId = `pong_${Date.now()}`;
    const gameState = {
      id: gameId,
      players: [
        { id: player1.id, name: player1.name, score: 0, paddleY: 250, isBot: isP1Bot },
        { id: player2.id, name: player2.name, score: 0, paddleY: 250, isBot: isP2Bot }
      ],
      ball: { 
        x: 400, 
        y: 300, 
        velocityX: 5 * (Math.random() > 0.5 ? 1 : -1),
        velocityY: 5 * (Math.random() > 0.5 ? 1 : -1)
      },
      board: { width: 800, height: 600 },
      status: 'playing',
      createdAt: new Date(),
      lastUpdate: Date.now(),
      isP1Bot,
      isP2Bot
    };
    
    this.games.set(gameId, gameState);
    this.gameConnections.set(gameId, new Set());
    this.gameChat.set(gameId, []);
    
    // Start game loop
    this.startGameLoop(gameId);
    
    console.log(`🎮 New game created: ${gameId}`);
    return this.getGameState(gameId); // Return the clean game state
  }

  addConnection(gameId, connection) {
    if (!this.gameConnections.has(gameId)) {
      this.gameConnections.set(gameId, new Set());
    }
    this.gameConnections.get(gameId).add(connection);
  }

  removeConnection(gameId, connection) {
    const connections = this.gameConnections.get(gameId);
    if (connections) {
      connections.delete(connection);
    }
  }

  broadcastToGame(gameId, message, excludeConnection = null) {
    const connections = this.gameConnections.get(gameId);
    if (!connections) return;
    
    const messageStr = JSON.stringify(message);
    connections.forEach(conn => {
      if (conn !== excludeConnection && conn.readyState === 1) { // WebSocket.OPEN = 1
        try {
          conn.send(messageStr);
        } catch (err) {
          console.error('Error broadcasting to connection:', err);
        }
      }
    });
  }

  addChatMessage(gameId, userId, username, message) {
    if (!this.gameChat.has(gameId)) {
      this.gameChat.set(gameId, []);
    }
    
    const chatEntry = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId,
      username,
      message: message.substring(0, 500), // Limit message length
      timestamp: Date.now()
    };
    
    const chat = this.gameChat.get(gameId);
    chat.push(chatEntry);
    
    // Keep only last 30 messages
    if (chat.length > 30) {
      chat.shift();
    }
    
    // Broadcast chat message to all connections in this game
    this.broadcastToGame(gameId, {
      type: 'CHAT_MESSAGE',
      chatMessage: chatEntry
    });
    
    return chatEntry;
  }

  getChatHistory(gameId) {
    return this.gameChat.get(gameId) || [];
  }

  // Tournament chat methods
  addTournamentConnection(tournamentId, connection) {
    if (!this.tournamentConnections.has(tournamentId)) {
      this.tournamentConnections.set(tournamentId, new Set());
    }
    this.tournamentConnections.get(tournamentId).add(connection);
  }

  removeTournamentConnection(tournamentId, connection) {
    const connections = this.tournamentConnections.get(tournamentId);
    if (connections) {
      connections.delete(connection);
    }
  }

  broadcastToTournament(tournamentId, message, excludeConnection = null) {
    const connections = this.tournamentConnections.get(tournamentId);
    if (!connections) return;
    
    const messageStr = JSON.stringify(message);
    connections.forEach(conn => {
      if (conn !== excludeConnection && conn.readyState === 1) { // WebSocket.OPEN = 1
        try {
          conn.send(messageStr);
        } catch (err) {
          console.error('Error broadcasting to tournament connection:', err);
        }
      }
    });
  }

  addTournamentChatMessage(tournamentId, userId, username, message) {
    if (!this.tournamentChat.has(tournamentId)) {
      this.tournamentChat.set(tournamentId, []);
    }
    
    const chatEntry = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId,
      username,
      message: message.substring(0, 500), // Limit message length
      timestamp: Date.now()
    };
    
    const chat = this.tournamentChat.get(tournamentId);
    chat.push(chatEntry);
    
    // Keep only last 30 messages
    if (chat.length > 30) {
      chat.shift();
    }
    
    // Broadcast chat message to all connections in this tournament
    this.broadcastToTournament(tournamentId, {
      type: 'TOURNAMENT_CHAT_MESSAGE',
      chatMessage: chatEntry
    });
    
    return chatEntry;
  }

  getTournamentChatHistory(tournamentId) {
    const chat = this.tournamentChat.get(tournamentId) || [];
    // Return only last 30 messages
    return chat.slice(-30);
  }

  startGameLoop(gameId) {
    const interval = setInterval(() => {
      this.updateBallPosition(gameId);
      // Broadcast game state to all connections (players and spectators)
      this.broadcastToGame(gameId, {
        type: 'GAME_STATE_UPDATE',
        gameState: this.getGameState(gameId)
      });
    }, 1000 / 60); // 60 FPS
    
    this.gameIntervals.set(gameId, interval);
  }

  updatePaddlePosition(gameId, playerId, newY) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const player = game.players.find(p => p.id === playerId);
    if (player) {
      player.paddleY = Math.max(0, Math.min(newY, game.board.height - 100));
      game.lastUpdate = Date.now();
    }
    
    return this.getGameState(gameId);
  }

  updateBallPosition(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'playing') return;

    const { ball, board, players } = game;
    
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y <= 0 || ball.y >= board.height) {
      ball.velocityY *= -1;
    }

    this.checkPaddleCollision(game);

    if (ball.x <= 0) {
      players[1].score++;
      this.resetBall(game);
    } else if (ball.x >= board.width) {
      players[0].score++;
      this.resetBall(game);
    }

    game.lastUpdate = Date.now();
  }

  checkPaddleCollision(game) {
    const { ball, players, board } = game;
    const paddleWidth = 10;
    const paddleHeight = 100;

    if (ball.x <= paddleWidth && 
        ball.y >= players[0].paddleY && 
        ball.y <= players[0].paddleY + paddleHeight) {
      ball.velocityX = Math.abs(ball.velocityX);
      const hitPosition = (ball.y - players[0].paddleY) / paddleHeight;
      ball.velocityY = (hitPosition - 0.5) * 10;
    }

    if (ball.x >= board.width - paddleWidth && 
        ball.y >= players[1].paddleY && 
        ball.y <= players[1].paddleY + paddleHeight) {
      ball.velocityX = -Math.abs(ball.velocityX);
      const hitPosition = (ball.y - players[1].paddleY) / paddleHeight;
      ball.velocityY = (hitPosition - 0.5) * 10;
    }
  }

  resetBall(game) {
    game.ball = {
      x: game.board.width / 2,
      y: game.board.height / 2,
      velocityX: 5 * (Math.random() > 0.5 ? 1 : -1),
      velocityY: 5 * (Math.random() > 0.5 ? 1 : -1)
    };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  // FIXED: Properly return game state without internal properties
  getGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;
    
    // Return a clean object without internal properties
    return {
      id: game.id,
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        paddleY: p.paddleY,
        isBot: p.isBot || false
      })),
      ball: { 
        x: game.ball.x,
        y: game.ball.y,
        velocityX: game.ball.velocityX,
        velocityY: game.ball.velocityY
      },
      board: {
        width: game.board.width,
        height: game.board.height
      },
      status: game.status,
      createdAt: game.createdAt,
      lastUpdate: game.lastUpdate,
      isP1Bot: game.isP1Bot || false,
      isP2Bot: game.isP2Bot || false
    };
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'finished';
      game.finishedAt = new Date();
      
      // Broadcast game end to all connections
      this.broadcastToGame(gameId, {
        type: 'GAME_ENDED',
        gameState: this.getGameState(gameId)
      });
      
      const interval = this.gameIntervals.get(gameId);
      if (interval) {
        clearInterval(interval);
        this.gameIntervals.delete(gameId);
      }
    }
    return this.getGameState(gameId);
  }

  getSpectatorCount(gameId) {
    const connections = this.gameConnections.get(gameId);
    if (!connections) return 0;
    // Subtract 2 for the players, rest are spectators
    return Math.max(0, connections.size - 2);
  }

  getAllActiveGames() {
    const activeGames = [];
    for (const [gameId, game] of this.games.entries()) {
      if (game.status === 'playing') {
        activeGames.push({
          id: gameId,
          players: game.players.map(p => ({ id: p.id, name: p.name })),
          spectatorCount: this.getSpectatorCount(gameId),
          createdAt: game.createdAt
        });
      }
    }
    return activeGames;
  }

  getActiveGame(gameId) {
    const game = this.games.get(gameId);
    if (game && game.status === 'playing') {
      return {
        id: gameId,
        players: game.players.map(p => ({ id: p.id, name: p.name })),
        spectatorCount: this.getSpectatorCount(gameId),
        createdAt: game.createdAt
      };
    }
    return null;
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
export { GameEngine };
