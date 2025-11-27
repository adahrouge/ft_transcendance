import { gameEngine } from '../game/GameEngine.js';
import jwt from 'jsonwebtoken';
import { getUserById } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to get user from JWT token
async function getUserFromToken(token) {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return await getUserById(decoded.userId);
  } catch (err) {
    return null;
  }
}

export function GameWebSocket(connection, req) {
  console.log('🔌 New WebSocket connection for Pong game');
  let currentGameId = null;
  let playerId = null;
  let userId = null;
  let username = 'Guest';
  let role = 'spectator'; // 'player1', 'player2', or 'spectator'
  let userToken = null;

  // Get token from query string or Authorization header
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token') || 
                (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

  // Authenticate user
  getUserFromToken(token).then(user => {
    if (user) {
      userId = user.id;
      username = user.display_name || user.username;
      userToken = token;
    }
  });

  // Function to send message to this connection
  const send = (message) => {
    if (connection.socket.readyState === 1) { // WebSocket.OPEN
      try {
        connection.socket.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending message:', err);
      }
    }
  };

  // Function to send game state to this connection
  const sendGameState = (gameId) => {
    const gameState = gameEngine.getGameState(gameId);
    if (gameState) {
      send({
        type: 'GAME_STATE_UPDATE',
        gameState: gameState,
        spectatorCount: gameEngine.getSpectatorCount(gameId)
      });
    }
  };

  connection.socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type);
      
      switch (data.type) {
        case 'PING':
          send({
            type: 'PONG',
            timestamp: Date.now()
          });
          break;

        case 'AUTHENTICATE':
          // Authenticate with token
          if (data.token) {
            const user = await getUserFromToken(data.token);
            if (user) {
              userId = user.id;
              username = user.display_name || user.username;
              userToken = data.token;
              send({
                type: 'AUTHENTICATED',
                user: { id: user.id, username: user.username, displayName: user.display_name }
              });
            }
          }
          break;

        case 'CREATE_GAME':
          // Require authentication to create games
          if (!userId || !username || username === 'Guest') {
            send({
              type: 'ERROR',
              message: 'You must be logged in to create a game. Please register or login first.'
            });
            break;
          }
          
          const game = gameEngine.createGame(
            { id: userId.toString(), name: data.player1Name || username },
            { id: data.player2Id || 'player2', name: data.player2Name || 'Player 2' }
          );
          currentGameId = game.id;
          playerId = userId.toString();
          role = 'player1';
          
          // Add connection to game
          gameEngine.addConnection(currentGameId, connection.socket);
          
          // Send chat history
          const chatHistory = gameEngine.getChatHistory(currentGameId);
          send({
            type: 'CHAT_HISTORY',
            messages: chatHistory
          });
          
          send({
            type: 'GAME_CREATED',
            gameId: game.id,
            gameState: gameEngine.getGameState(game.id),
            yourPlayerId: playerId,
            yourRole: role
          });
          break;

        case 'JOIN_GAME':
          // Join as spectator
          if (data.gameId) {
            const game = gameEngine.getGame(data.gameId);
            if (game && game.status === 'playing') {
              currentGameId = data.gameId;
              role = 'spectator';
              
              // Add connection to game
              gameEngine.addConnection(currentGameId, connection.socket);
              
              // Send current game state
              sendGameState(currentGameId);
              
              // Send chat history
              const chatHistory = gameEngine.getChatHistory(currentGameId);
              send({
                type: 'CHAT_HISTORY',
                messages: chatHistory
              });
              
              send({
                type: 'JOINED_GAME',
                gameId: currentGameId,
                gameState: gameEngine.getGameState(currentGameId),
                yourRole: role,
                spectatorCount: gameEngine.getSpectatorCount(currentGameId)
              });
              
              // Notify others that a spectator joined
              gameEngine.broadcastToGame(currentGameId, {
                type: 'SPECTATOR_JOINED',
                spectatorCount: gameEngine.getSpectatorCount(currentGameId),
                username: username
              }, connection.socket);
            } else {
              send({
                type: 'ERROR',
                message: 'Game not found or not available'
              });
            }
          }
          break;

        case 'MOVE_PADDLE':
          if (currentGameId && (role === 'player1' || role === 'player2')) {
            const playerIdToUse = role === 'player1' ? 'player1' : 'player2';
            const updatedGame = gameEngine.updatePaddlePosition(
              currentGameId, 
              playerIdToUse, 
              data.position
            );
            if (updatedGame) {
              // Broadcast to all (including spectators)
              gameEngine.broadcastToGame(currentGameId, {
                type: 'GAME_STATE_UPDATE',
                gameState: updatedGame,
                spectatorCount: gameEngine.getSpectatorCount(currentGameId)
              });
            }
          }
          break;

        case 'SEND_CHAT':
          if (currentGameId && data.message && data.message.trim()) {
            const chatMsg = gameEngine.addChatMessage(
              currentGameId,
              userId || 'guest',
              username,
              data.message.trim()
            );
            // Message is already broadcasted by addChatMessage
          }
          break;

        case 'REQUEST_GAME_STATE':
          if (currentGameId) {
            sendGameState(currentGameId);
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      send({ 
        type: 'ERROR',
        error: 'Invalid message format',
        details: error.message 
      });
    }
  });

  connection.socket.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    if (currentGameId) {
      gameEngine.removeConnection(currentGameId, connection.socket);
      
      // Notify others that someone left
      gameEngine.broadcastToGame(currentGameId, {
        type: 'SPECTATOR_LEFT',
        spectatorCount: gameEngine.getSpectatorCount(currentGameId)
      });
      
      // Only end game if no connections remain
      const connections = gameEngine.gameConnections.get(currentGameId);
      if (!connections || connections.size === 0) {
        gameEngine.endGame(currentGameId);
      }
    }
  });

  // Send welcome message
  send({
    type: 'WELCOME',
    message: 'Connected to Pong game server',
    timestamp: Date.now(),
    authenticated: !!userId,
    supportedActions: [
      'CREATE_GAME', 
      'JOIN_GAME', 
      'MOVE_PADDLE', 
      'REQUEST_GAME_STATE',
      'SEND_CHAT',
      'AUTHENTICATE'
    ]
  });
}
