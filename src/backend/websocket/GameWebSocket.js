import { GameEngine } from '../game/GameEngine.js';

const gameEngine = new GameEngine();

export function GameWebSocket(connection, req) {
  console.log('🔌 New WebSocket connection for Pong game');
  let currentGameId = null;
  let playerId = null;

  // Function to broadcast game state to this connection
  const sendGameState = (gameId) => {
    const gameState = gameEngine.getGameState(gameId);
    if (gameState) {
      connection.socket.send(JSON.stringify({
        type: 'GAME_STATE_UPDATE',
        gameState: gameState
      }));
    }
  };

  connection.socket.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type);
      
      switch (data.type) {
        case 'PING':
          connection.socket.send(JSON.stringify({
            type: 'PONG',
            timestamp: Date.now()
          }));
          break;

        case 'CREATE_GAME':
          const game = gameEngine.createGame(
            { id: 'player1', name: data.player1Name || 'Player 1' },
            { id: 'player2', name: data.player2Name || 'Player 2' }
          );
          currentGameId = game.id;
          playerId = 'player1';
          
          connection.socket.send(JSON.stringify({
            type: 'GAME_CREATED',
            gameId: game.id,
            gameState: gameEngine.getGameState(game.id),
            yourPlayerId: playerId
          }));
          break;

        case 'MOVE_PADDLE':
          if (currentGameId && playerId) {
            const updatedGame = gameEngine.updatePaddlePosition(
              currentGameId, 
              playerId, 
              data.position
            );
            if (updatedGame) {
              sendGameState(currentGameId);
            }
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
      connection.socket.send(JSON.stringify({ 
        error: 'Invalid message format',
        details: error.message 
      }));
    }
  });

  connection.socket.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    if (currentGameId) {
      gameEngine.endGame(currentGameId);
    }
  });

  // Send welcome message
  connection.socket.send(JSON.stringify({
    type: 'WELCOME',
    message: 'Connected to Pong game server - Ready for action!',
    timestamp: Date.now(),
    supportedActions: ['CREATE_GAME', 'MOVE_PADDLE', 'REQUEST_GAME_STATE']
  }));
}
