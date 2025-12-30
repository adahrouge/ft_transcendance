import jwt from 'jsonwebtoken';
import { getUserById } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Queue of players waiting for a match: Array<{ socket, userId, username }>
const matchmakingQueue = [];

// Active games: Map<gameId, { player1, player2, board, currentPlayer, gameId }>
const activeGames = new Map();

// Map socket to gameId for cleanup
const socketToGame = new Map();

// Map socket to user info
const socketToUser = new Map();

let gameIdCounter = 0;

function generateGameId() {
  return `ttt_${++gameIdCounter}_${Date.now()}`;
}

function broadcastQueueCount() {
  const count = matchmakingQueue.length;
  matchmakingQueue.forEach(({ socket }) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({ type: 'queue_update', count }));
    }
  });
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  return null;
}

function createGame(player1, player2) {
  const gameId = generateGameId();
  
  // Randomly assign X and O
  const isPlayer1X = Math.random() < 0.5;
  
  const game = {
    gameId,
    player1: {
      socket: player1.socket,
      userId: player1.userId,
      username: player1.username,
      symbol: isPlayer1X ? 'X' : 'O'
    },
    player2: {
      socket: player2.socket,
      userId: player2.userId,
      username: player2.username,
      symbol: isPlayer1X ? 'O' : 'X'
    },
    board: Array(9).fill(null),
    currentPlayer: 'X', // X always goes first
    winner: null
  };

  activeGames.set(gameId, game);
  socketToGame.set(player1.socket, gameId);
  socketToGame.set(player2.socket, gameId);

  // Notify both players
  const gameStartMsg1 = {
    type: 'game_start',
    gameId,
    yourSymbol: game.player1.symbol,
    opponent: game.player2.username,
    currentPlayer: 'X',
    board: game.board
  };

  const gameStartMsg2 = {
    type: 'game_start',
    gameId,
    yourSymbol: game.player2.symbol,
    opponent: game.player1.username,
    currentPlayer: 'X',
    board: game.board
  };

  if (player1.socket.readyState === 1) {
    player1.socket.send(JSON.stringify(gameStartMsg1));
  }
  if (player2.socket.readyState === 1) {
    player2.socket.send(JSON.stringify(gameStartMsg2));
  }

  return game;
}

function handleMove(socket, gameId, index) {
  const game = activeGames.get(gameId);
  if (!game) {
    socket.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
    return;
  }

  // Determine which player made the move
  let player, opponent;
  if (game.player1.socket === socket) {
    player = game.player1;
    opponent = game.player2;
  } else if (game.player2.socket === socket) {
    player = game.player2;
    opponent = game.player1;
  } else {
    socket.send(JSON.stringify({ type: 'error', message: 'Not a player in this game' }));
    return;
  }

  // Check if it's this player's turn
  if (game.currentPlayer !== player.symbol) {
    socket.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }

  // Check if move is valid
  if (index < 0 || index > 8 || game.board[index] !== null) {
    socket.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
    return;
  }

  // Make the move
  game.board[index] = player.symbol;
  game.currentPlayer = player.symbol === 'X' ? 'O' : 'X';

  // Check for winner
  const winner = checkWinner(game.board);
  game.winner = winner;

  const updateMsg = {
    type: 'game_update',
    board: game.board,
    currentPlayer: game.currentPlayer,
    lastMove: { index, symbol: player.symbol },
    winner: winner
  };

  // Broadcast to both players
  if (player.socket.readyState === 1) {
    player.socket.send(JSON.stringify(updateMsg));
  }
  if (opponent.socket.readyState === 1) {
    opponent.socket.send(JSON.stringify(updateMsg));
  }

  // If game is over, clean up
  if (winner) {
    setTimeout(() => {
      cleanupGame(gameId);
    }, 5000); // Keep game data for 5 seconds after end
  }
}

function cleanupGame(gameId) {
  const game = activeGames.get(gameId);
  if (game) {
    socketToGame.delete(game.player1.socket);
    socketToGame.delete(game.player2.socket);
    activeGames.delete(gameId);
  }
}

function handleDisconnect(socket) {
  // Remove from queue if present
  const queueIndex = matchmakingQueue.findIndex(p => p.socket === socket);
  if (queueIndex !== -1) {
    matchmakingQueue.splice(queueIndex, 1);
    broadcastQueueCount();
  }

  // Handle active game disconnect
  const gameId = socketToGame.get(socket);
  if (gameId) {
    const game = activeGames.get(gameId);
    if (game && !game.winner) {
      // Notify opponent that player disconnected
      const opponent = game.player1.socket === socket ? game.player2 : game.player1;
      if (opponent.socket.readyState === 1) {
        opponent.socket.send(JSON.stringify({
          type: 'opponent_disconnected',
          message: 'Your opponent disconnected. You win!'
        }));
      }
      cleanupGame(gameId);
    }
  }

  socketToUser.delete(socket);
}

export async function tictactoeMatchmakingRoutes(fastify) {
  // Get queue count (REST endpoint)
  fastify.get('/api/tictactoe/queue-count', async (request, reply) => {
    return { count: matchmakingQueue.length };
  });

  // WebSocket endpoint for matchmaking
  fastify.get('/api/tictactoe/matchmaking', { websocket: true }, (connection, req) => {
    const socket = connection.socket;
    let userId = null;
    let username = null;

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth') {
          // Authenticate user
          const token = data.token;
          if (!token) {
            socket.send(JSON.stringify({ type: 'error', message: 'No token provided' }));
            return;
          }

          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await getUserById(decoded.userId);
            if (!user) {
              socket.send(JSON.stringify({ type: 'error', message: 'User not found' }));
              return;
            }

            userId = user.id;
            username = user.username;
            socketToUser.set(socket, { userId, username });

            socket.send(JSON.stringify({ type: 'authenticated', userId, username }));
          } catch (err) {
            socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
          }
        }

        else if (data.type === 'join_queue') {
          if (!userId) {
            socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          // Check if already in queue
          const alreadyInQueue = matchmakingQueue.some(p => p.userId === userId);
          if (alreadyInQueue) {
            socket.send(JSON.stringify({ type: 'error', message: 'Already in queue' }));
            return;
          }

          // Check if already in a game
          if (socketToGame.has(socket)) {
            socket.send(JSON.stringify({ type: 'error', message: 'Already in a game' }));
            return;
          }

          // Add to queue
          matchmakingQueue.push({ socket, userId, username });
          socket.send(JSON.stringify({ type: 'joined_queue' }));
          broadcastQueueCount();

          // Try to match players
          if (matchmakingQueue.length >= 2) {
            const player1 = matchmakingQueue.shift();
            const player2 = matchmakingQueue.shift();
            createGame(player1, player2);
            broadcastQueueCount();
          }
        }

        else if (data.type === 'leave_queue') {
          const queueIndex = matchmakingQueue.findIndex(p => p.socket === socket);
          if (queueIndex !== -1) {
            matchmakingQueue.splice(queueIndex, 1);
            socket.send(JSON.stringify({ type: 'left_queue' }));
            broadcastQueueCount();
          }
        }

        else if (data.type === 'move') {
          const gameId = socketToGame.get(socket);
          if (gameId) {
            handleMove(socket, gameId, data.index);
          } else {
            socket.send(JSON.stringify({ type: 'error', message: 'Not in a game' }));
          }
        }

        else if (data.type === 'rematch_request') {
          // Handle rematch logic if needed
          socket.send(JSON.stringify({ type: 'info', message: 'Rematch not implemented yet' }));
        }

      } catch (err) {
        console.error('TicTacToe matchmaking error:', err);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    socket.on('close', () => {
      handleDisconnect(socket);
    });

    socket.on('error', (err) => {
      console.error('TicTacToe WebSocket error:', err);
      handleDisconnect(socket);
    });
  });
}
