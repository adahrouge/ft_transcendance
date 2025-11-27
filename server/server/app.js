import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { GameWebSocket } from '../websocket/GameWebSocket.js';
import { initDatabase, cleanupEmptyTournaments } from '../database/db.js';
import { userRoutes, avatarRoutes } from '../routes/users.js';
import { tournamentRoutes } from '../routes/tournaments.js';
import { gameEngine } from '../game/GameEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Initialize database
await initDatabase();

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(websocket);
await fastify.register(multipart);

// Register routes
await fastify.register(userRoutes);
await fastify.register(avatarRoutes);
await fastify.register(tournamentRoutes);

// Serve uploaded avatars
await fastify.register(staticFiles, {
  root: path.join(__dirname, '..', 'database', 'uploads'),
  prefix: '/uploads/'
});

// WebSocket for real-time gameplay
fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, GameWebSocket);
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Pong server running' };
});

// Game routes - get active games for spectators
fastify.get('/api/games', async (request, reply) => {
  const activeGames = gameEngine.getAllActiveGames();
  return { games: activeGames };
});

// Get specific active game info
fastify.get('/api/games/:gameId', async (request, reply) => {
  const { gameId } = request.params;
  const game = gameEngine.getActiveGame(gameId);
  if (!game) {
    return reply.code(404).send({ error: 'Game not found or not active' });
  }
  return game;
});

// Auto-cleanup empty tournaments every minute
setInterval(async () => {
  try {
    const deletedCount = await cleanupEmptyTournaments();
    if (deletedCount > 0) {
      fastify.log.info(`Cleaned up ${deletedCount} empty tournament(s)`);
    }
  } catch (err) {
    fastify.log.error('Error cleaning up tournaments:', err);
  }
}, 60000); // Run every 60 seconds

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
