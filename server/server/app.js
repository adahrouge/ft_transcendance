import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { initDatabase, cleanupEmptyTournaments } from '../database/db.js';
import { userRoutes, avatarRoutes } from '../routes/users.js';
import { tournamentRoutes } from '../routes/tournaments.js';
import { tournamentGamesRoutes } from '../routes/tournamentGames.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { execSync } from 'child_process';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
  bodyLimit: 1048576, // 1MB
});

// Remove default JSON parser and add custom one that handles empty bodies
fastify.removeContentTypeParser('application/json');
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = body === '' || body === undefined ? {} : JSON.parse(body);
    done(null, json);
  } catch (err) {
    done(err, undefined);
  }
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
await fastify.register(tournamentGamesRoutes);

// Serve uploaded avatars
await fastify.register(staticFiles, {
  root: path.join(__dirname, '..', 'database', 'uploads'),
  prefix: '/uploads/'
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Pong server running' };
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

// Helper function to get local IP address
function getHostLANIP() {
  return process.env.HOST_LAN_IP || 'localhost';
}



// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    const lanIP = getHostLANIP();

    console.log('Pong server running on port 3001');
    console.log('');
    console.log('Access the game at:');
    console.log(`   - Local: https://localhost:8443`);
    console.log(`   - Network: https://${lanIP}:8443`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
