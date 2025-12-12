  class GameEngine {
  constructor() {
    this.games = new Map();
    this.connectedPlayers = new Map(); // userId -> Set of WebSocket connections
    this.gameIntervals = new Map();
    this.gameConnections = new Map(); // gameId -> Set of WebSocket connections
    this.gameChat = new Map(); // gameId -> Array of chat messages
    this.tournamentChat = new Map(); // tournamentId -> Array of chat messages
    this.tournamentConnections = new Map(); // tournamentId -> Set of WebSocket connections
    console.log('🎮 Game Engine initialized');
  }

  registerPlayer(userId, connection) {
    if (!this.connectedPlayers.has(userId)) {
      this.connectedPlayers.set(userId, new Set());
    }
    this.connectedPlayers.get(userId).add(connection);
  }

  unregisterPlayer(userId, connection) {
    if (this.connectedPlayers.has(userId)) {
      const connections = this.connectedPlayers.get(userId);
      connections.delete(connection);
      if (connections.size === 0) {
        this.connectedPlayers.delete(userId);
      }
    }
  }

  isUserOnline(userId) {
    return this.connectedPlayers.has(userId.toString());
  }

  getOnlineUsers(userIds) {
    const onlineStatus = {};
    userIds.forEach(id => {
      onlineStatus[id] = this.isUserOnline(id);
    });
    return onlineStatus;
  }

  sendInvite(targetUserId, inviterName, gameId) {
    const connections = this.connectedPlayers.get(targetUserId.toString());
    if (connections) {
      const message = JSON.stringify({
        type: 'GAME_INVITE',
        inviterName,
        gameId
      });
      connections.forEach(conn => {
        if (conn.readyState === 1) {
          conn.send(message);
        }
      });
      return true;
    }
    return false;
  }

  createGame(player1, player2 = null, isP1Bot = false, isP2Bot = false) {
    const gameId = `pong_${Date.now()}`;
    const status = player2 ? 'playing' : 'waiting';

    // Vertical orientation: paddleX is horizontal position, paddles at top/bottom
    const initialPaddleX = 300 - 40; // Center of 600px width, minus half paddle width (80/2)
    const p2 = player2 || { id: 'waiting', name: 'Waiting...', score: 0, paddleX: initialPaddleX, isBot: false };

    const gameState = {
      id: gameId,
      players: [
        { id: player1.id, name: player1.name, score: 0, paddleX: initialPaddleX, isBot: isP1Bot },  // Player 1 at TOP
        { id: p2.id, name: p2.name, score: 0, paddleX: initialPaddleX, isBot: isP2Bot }             // Player 2 at BOTTOM
      ],
      ball: {
        x: 300,
        y: 300,
        velocityX: 3 * (Math.random() > 0.5 ? 1 : -1),
        velocityY: 5 * (Math.random() > 0.5 ? 1 : -1)  // Primary movement is vertical
      },
      board: { width: 600, height: 600 },
      paddle: { width: 80, height: 12 },
      status: status,
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
    
    console.log(`🎮 New game created: ${gameId} (Status: ${status})`);
    return this.getGameState(gameId); // Return the clean game state
  }

  joinGameAsPlayer(gameId, player2) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'waiting') return null;

    const initialPaddleX = 300 - 40; // Center minus half paddle width
    game.players[1] = {
      id: player2.id,
      name: player2.name,
      score: 0,
      paddleX: initialPaddleX,
      isBot: false
    };
    game.status = 'playing';
    game.lastUpdate = Date.now();

    return this.getGameState(gameId);
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

  updatePaddlePosition(gameId, playerId, newX) {
    const game = this.games.get(gameId);
    if (!game) return null;

    // playerId is 'player1' or 'player2'
    const playerIndex = playerId === 'player1' ? 0 : 1;
    const player = game.players[playerIndex];
    if (player) {
      const paddleWidth = game.paddle?.width || 80;
      player.paddleX = Math.max(0, Math.min(newX, game.board.width - paddleWidth));
      game.lastUpdate = Date.now();
    }

    return this.getGameState(gameId);
  }

  updateBallPosition(gameId) {
    const game = this.games.get(gameId);
    if (!game || (game.status !== 'playing' && game.status !== 'paused')) return;

    // Don't update ball when paused or finishing
    if (game.status === 'paused' || game.status === 'finishing') return;

    const { ball, board, players, paddle } = game;
    const paddleWidth = paddle?.width || 80;
    const paddleHeight = paddle?.height || 12;
    const ballRadius = 6;

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Bounce off LEFT and RIGHT walls (vertical orientation)
    if (ball.x - ballRadius <= 0) {
      ball.velocityX = Math.abs(ball.velocityX);
      ball.x = ballRadius;
    }
    if (ball.x + ballRadius >= board.width) {
      ball.velocityX = -Math.abs(ball.velocityX);
      ball.x = board.width - ballRadius;
    }

    this.checkPaddleCollision(game);

    // Scoring: ball passes TOP -> player2 scores, ball passes BOTTOM -> player1 scores
    const SCORE_TO_WIN = 5;

    if (ball.y - ballRadius <= 0) {
      players[1].score++;  // Player 2 (bottom) scores

      // Broadcast goal scored event
      this.broadcastToGame(gameId, {
        type: 'GOAL_SCORED',
        scorer: 'player2',
        conceder: 'player1',
        score: { p1: players[0].score, p2: players[1].score }
      });

      if (players[1].score >= SCORE_TO_WIN) {
        // Delay game end slightly to show the goal
        setTimeout(() => this.endGame(gameId), 1500);
        game.status = 'finishing';  // Prevent further updates
        return;
      }

      // Pause before reset
      this.pauseAndResetBall(gameId, 1);
    } else if (ball.y + ballRadius >= board.height) {
      players[0].score++;  // Player 1 (top) scores

      // Broadcast goal scored event
      this.broadcastToGame(gameId, {
        type: 'GOAL_SCORED',
        scorer: 'player1',
        conceder: 'player2',
        score: { p1: players[0].score, p2: players[1].score }
      });

      if (players[0].score >= SCORE_TO_WIN) {
        // Delay game end slightly to show the goal
        setTimeout(() => this.endGame(gameId), 1500);
        game.status = 'finishing';  // Prevent further updates
        return;
      }

      // Pause before reset
      this.pauseAndResetBall(gameId, -1);
    }

    game.lastUpdate = Date.now();
  }

  pauseAndResetBall(gameId, direction) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Stop ball temporarily
    game.ball.velocityX = 0;
    game.ball.velocityY = 0;
    game.status = 'paused';

    // Resume after delay
    setTimeout(() => {
      if (game.status === 'paused') {
        game.status = 'playing';
        this.resetBall(game, direction);
      }
    }, 2500);
  }

  checkPaddleCollision(game) {
    const { ball, players, board, paddle } = game;
    const paddleWidth = paddle?.width || 80;
    const paddleHeight = paddle?.height || 12;
    const ballRadius = 6;
    const paddleOffset = 10;  // Distance from edge

    // Player 1 paddle at TOP (y = paddleOffset)
    const p1PaddleY = paddleOffset;
    if (ball.y - ballRadius <= p1PaddleY + paddleHeight && ball.velocityY < 0) {
      const p1X = players[0].paddleX;
      if (ball.x >= p1X && ball.x <= p1X + paddleWidth) {
        ball.velocityY = Math.abs(ball.velocityY);  // Bounce down
        // Add spin based on where ball hit paddle
        const hitPosition = (ball.x - p1X) / paddleWidth;
        ball.velocityX = (hitPosition - 0.5) * 8;
        ball.y = p1PaddleY + paddleHeight + ballRadius;
      }
    }

    // Player 2 paddle at BOTTOM (y = board.height - paddleOffset - paddleHeight)
    const p2PaddleY = board.height - paddleOffset - paddleHeight;
    if (ball.y + ballRadius >= p2PaddleY && ball.velocityY > 0) {
      const p2X = players[1].paddleX;
      if (ball.x >= p2X && ball.x <= p2X + paddleWidth) {
        ball.velocityY = -Math.abs(ball.velocityY);  // Bounce up
        // Add spin based on where ball hit paddle
        const hitPosition = (ball.x - p2X) / paddleWidth;
        ball.velocityX = (hitPosition - 0.5) * 8;
        ball.y = p2PaddleY - ballRadius;
      }
    }
  }

  resetBall(game, direction = 1) {
    // direction: 1 = serve down (toward player2), -1 = serve up (toward player1)
    game.ball = {
      x: game.board.width / 2,
      y: game.board.height / 2,
      velocityX: 3 * (Math.random() > 0.5 ? 1 : -1),
      velocityY: 5 * direction
    };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  // Return clean game state without internal properties
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
        paddleX: p.paddleX,  // Horizontal position for vertical game
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
      paddle: {
        width: game.paddle?.width || 80,
        height: game.paddle?.height || 12
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
      if (game.status === 'playing' || game.status === 'waiting') {
        activeGames.push({
          id: gameId,
          players: game.players.map(p => ({ id: p.id, name: p.name })),
          status: game.status,
          spectatorCount: this.getSpectatorCount(gameId),
          createdAt: game.createdAt
        });
      }
    }
    return activeGames;
  }

  getActiveGame(gameId) {
    const game = this.games.get(gameId);
    if (game && (game.status === 'playing' || game.status === 'waiting')) {
      return {
        id: gameId,
        players: game.players.map(p => ({ id: p.id, name: p.name })),
        status: game.status,
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
