import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Create a new game
  ws.send(JSON.stringify({
    type: 'CREATE_GAME',
    player1Name: 'Test Player 1',
    player2Name: 'Test Player 2'
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response.type);
  
  if (response.type === 'GAME_CREATED') {
    console.log('🎮 Game created with ID:', response.gameId);
    
    if (response.gameState) {
      console.log('✅ Game State:');
      console.log('  Players:', response.gameState.players);
      console.log('  Ball:', response.gameState.ball);
      console.log('  Board:', response.gameState.board);
    } else {
      console.log('❌ gameState is still undefined!');
    }
    
    // Test moving the paddle
    setTimeout(() => {
      console.log('🔄 Testing paddle movement...');
      ws.send(JSON.stringify({
        type: 'MOVE_PADDLE',
        position: 300
      }));
    }, 1000);
  }
  
  if (response.type === 'GAME_STATE_UPDATE') {
    console.log('🔄 Game state updated:');
    console.log('  Players:', response.gameState.players.map(p => `${p.name}: ${p.score} (y:${p.paddleY})`));
    console.log('  Ball:', `x:${response.gameState.ball.x} y:${response.gameState.ball.y}`);
  }
});

setTimeout(() => {
  console.log('⏰ Test completed');
  ws.close();
}, 3000);
