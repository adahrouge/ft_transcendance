// Game Engine for tournament matches

class GameEngine {
  constructor() {
    this.games = new Map();
    this.gameCounter = 0;
  }

  createGame(player1, player2, isP1Bot = false, isP2Bot = false) {
    const gameId = `game_${++this.gameCounter}_${Date.now()}`;
    
    const game = {
      id: gameId,
      player1: {
        ...player1,
        isBot: isP1Bot,
        score: 0,
        paddle: { y: 250 }
      },
      player2: {
        ...player2,
        isBot: isP2Bot,
        score: 0,
        paddle: { y: 250 }
      },
      ball: {
        x: 400,
        y: 300,
        vx: 5,
        vy: 3
      },
      status: 'waiting',
      winningScore: 5,
      createdAt: Date.now()
    };

    this.games.set(gameId, game);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  updateGame(gameId, updates) {
    const game = this.games.get(gameId);
    if (game) {
      Object.assign(game, updates);
    }
    return game;
  }

  deleteGame(gameId) {
    return this.games.delete(gameId);
  }

  // Start a game
  startGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'playing';
      game.startedAt = Date.now();
    }
    return game;
  }

  // End a game
  endGame(gameId, winnerId) {
    const game = this.games.get(gameId);
    if (game) {
      game.status = 'finished';
      game.winnerId = winnerId;
      game.endedAt = Date.now();
    }
    return game;
  }
}

export const gameEngine = new GameEngine();
