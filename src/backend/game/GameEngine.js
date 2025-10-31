export class GameEngine {
  constructor() {
    this.games = new Map();
    this.connectedPlayers = new Map();
    this.gameIntervals = new Map();
    console.log('🎮 Game Engine initialized');
  }

  createGame(player1, player2) {
    const gameId = `pong_${Date.now()}`;
    const gameState = {
      id: gameId,
      players: [
        { id: player1.id, name: player1.name, score: 0, paddleY: 250 },
        { id: player2.id, name: player2.name, score: 0, paddleY: 250 }
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
      lastUpdate: Date.now()
    };
    
    this.games.set(gameId, gameState);
    
    // Start game loop
    this.startGameLoop(gameId);
    
    console.log(`�� New game created: ${gameId}`);
    return this.getGameState(gameId); // Return the clean game state
  }

  startGameLoop(gameId) {
    const interval = setInterval(() => {
      this.updateBallPosition(gameId);
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
        paddleY: p.paddleY
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
      lastUpdate: game.lastUpdate
    };
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'finished';
      game.finishedAt = new Date();
      
      const interval = this.gameIntervals.get(gameId);
      if (interval) {
        clearInterval(interval);
        this.gameIntervals.delete(gameId);
      }
    }
    return this.getGameState(gameId);
  }
}
