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
  let currentTournamentId = null;
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
              
              // Register player for global notifications (invites)
              gameEngine.registerPlayer(userId.toString(), connection.socket);
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
          
          // Check if players are bots (indicated by playerId starting with 'bot_')
          const isP2Bot = data.player2Id && data.player2Id.toString().startsWith('bot_');
          const isP1Bot = data.player1Id && data.player1Id.toString().startsWith('bot_');
          
          // For bots, use the bot ID directly; for humans, use userId
          const p1Id = isP1Bot ? data.player1Id : (data.player1Id || userId.toString());
          
          // Determine which player the user is
          let userRole = 'spectator';
          if (!isP1Bot && p1Id === userId.toString()) {
            userRole = 'player1';
          }
          
          let game;
          if (data.player2Id || data.player2Name) {
             const p2Id = isP2Bot ? data.player2Id : (data.player2Id || userId.toString());
             if (!isP2Bot && p2Id === userId.toString()) {
                userRole = 'player2';
             }
             game = gameEngine.createGame(
              { id: p1Id, name: data.player1Name || username },
              { id: p2Id, name: data.player2Name || 'Player 2' },
              isP1Bot,
              isP2Bot
            );
          } else {
            // Create waiting game
            game = gameEngine.createGame(
              { id: p1Id, name: data.player1Name || username },
              null,
              isP1Bot,
              false
            );
          }

          currentGameId = game.id;
          playerId = userId.toString();
          role = userRole;
          
          // Add connection to game
          gameEngine.addConnection(currentGameId, connection.socket);
          
          // If creating a game with a specific player, try to send them an invite
          if (data.player2Id) {
            gameEngine.sendInvite(data.player2Id, username, game.id);
          }
          
          // Send chat history
          const chatHistory = gameEngine.getChatHistory(currentGameId);
          send({
            type: 'CHAT_HISTORY',
            messages: chatHistory
          });
          
          send({
            type: 'GAME_CREATED',
            gameId: game.id,
            gameState: gameEngine.getGameState(currentGameId),
            yourPlayerId: playerId,
            yourRole: role,
            isP2Bot: isP2Bot
          });
          break;

        case 'JOIN_GAME':
          if (data.gameId) {
            const game = gameEngine.getGame(data.gameId);
            if (game) {
              currentGameId = data.gameId;
              
              // Check if user is already a player in this game (reconnect or reserved join)
              const isPlayer1 = game.players[0].id.toString() === (userId ? userId.toString() : '');
              const isPlayer2 = game.players[1] && game.players[1].id.toString() === (userId ? userId.toString() : '');

              if (isPlayer1 || isPlayer2) {
                  role = isPlayer1 ? 'player1' : 'player2';
                  playerId = userId.toString();
                  
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
                  break;
              }

              // Check if we can join as player 2
              if (game.status === 'waiting' && userId) {
                 const updatedGame = gameEngine.joinGameAsPlayer(currentGameId, {
                   id: userId,
                   name: username
                 });
                 
                 if (updatedGame) {
                   role = 'player2';
                   playerId = userId.toString();
                   
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
                     gameState: updatedGame,
                     yourRole: role,
                     spectatorCount: gameEngine.getSpectatorCount(currentGameId)
                   });
                   
                   // Notify others that player 2 joined
                   gameEngine.broadcastToGame(currentGameId, {
                     type: 'PLAYER_JOINED',
                     player: { id: userId, name: username },
                     gameState: updatedGame
                   }, connection.socket);
                   
                   break;
                 }
              }

              // Join as spectator
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
          if (currentGameId) {
            // Allow movement for current role OR for bot players
            const game = gameEngine.getGame(currentGameId);
            let playerIdToUse = null;
            
            if (role === 'player1' || role === 'player2') {
              playerIdToUse = role === 'player1' ? 'player1' : 'player2';
            } else if (data.forBot) {
              // Allow sending movements for bot players
              playerIdToUse = data.forBot === 'player1' ? 'player1' : 'player2';
              // Verify this is actually a bot
              if (game && ((data.forBot === 'player1' && !game.isP1Bot) || 
                           (data.forBot === 'player2' && !game.isP2Bot))) {
                // Not a bot, reject
                break;
              }
            }
            
            if (playerIdToUse) {
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

        case 'JOIN_TOURNAMENT_CHAT':
          if (data.tournamentId) {
            currentTournamentId = parseInt(data.tournamentId);
            gameEngine.addTournamentConnection(currentTournamentId, connection.socket);
            
            // Send chat history
            const tournamentChatHistory = gameEngine.getTournamentChatHistory(currentTournamentId);
            send({
              type: 'TOURNAMENT_CHAT_HISTORY',
              messages: tournamentChatHistory
            });
          }
          break;

        case 'SEND_TOURNAMENT_CHAT':
          if (currentTournamentId && data.message && data.message.trim()) {
            const chatMsg = gameEngine.addTournamentChatMessage(
              currentTournamentId,
              userId || 'guest',
              username,
              data.message.trim()
            );
            // Message is already broadcasted by addTournamentChatMessage
          }
          break;

        case 'REQUEST_GAME_STATE':
          if (currentGameId) {
            sendGameState(currentGameId);
          }
          break;

        case 'CHECK_ONLINE_STATUS':
          if (data.userIds && Array.isArray(data.userIds)) {
            const onlineStatus = gameEngine.getOnlineUsers(data.userIds);
            send({
              type: 'ONLINE_STATUS_UPDATE',
              onlineStatus
            });
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

      // If a player (not spectator) disconnects, end the game
      if (role === 'player1' || role === 'player2') {
        const game = gameEngine.getGame(currentGameId);
        if (game && game.status === 'playing') {
          // Notify the other player that opponent left
          gameEngine.broadcastToGame(currentGameId, {
            type: 'PLAYER_LEFT',
            playerRole: role,
            message: `${username} has left the game`
          });

          // End the game
          gameEngine.endGame(currentGameId);
        } else if (game && game.status === 'waiting') {
          // If waiting, just end it
          gameEngine.endGame(currentGameId);
        }
      } else {
        // Spectator left
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
    }

    if (userId) {
      gameEngine.unregisterPlayer(userId.toString(), connection.socket);
    }

    if (currentTournamentId) {
      gameEngine.removeTournamentConnection(currentTournamentId, connection.socket);
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
      'CHECK_ONLINE_STATUS',
      'SEND_CHAT',
      'AUTHENTICATE'
    ]
  });
}
