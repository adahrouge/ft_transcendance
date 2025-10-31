import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { GameWebSocket } from '../websocket/GameWebSocket.js';

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(websocket);

// WebSocket for real-time gameplay
fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, GameWebSocket);
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Pong server running' };
});

// Game routes
fastify.get('/games', async (request, reply) => {
  return { games: [] };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🎮 Pong server running on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
