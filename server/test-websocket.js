import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket server');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'PING',
    message: 'Hello from test client'
  }));
});

ws.on('message', function message(data) {
  console.log('📨 Received:', data.toString());
});

ws.on('close', function close() {
  console.log('❌ Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
  console.log('❌ WebSocket error:', err);
});
