import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { initDatabase, updateUserActivity } from '../database/db.js';
import { userRoutes, avatarRoutes } from '../routes/users.js';
import { tictactoeMatchmakingRoutes } from '../routes/tictactoeMatchmaking.js';
import { presenceRoutes } from '../routes/presence.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_SECRET = process.env.SESSION_SECRET || 'a-very-long-secret-key-for-session-encryption-must-be-32-bytes';

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
  origin: true, // Allow all origins for development, restrict in production
  credentials: true // Allow cookies
});

await fastify.register(cookie);
await fastify.register(session, {
  secret: SESSION_SECRET,
  cookie: {
    path: '/',
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Allow cross-site for WebSocket
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  saveUninitialized: false
});

// Middleware to update last_active
fastify.addHook('onRequest', async (request, reply) => {
  if (request.session.userId) {
    await updateUserActivity(request.session.userId);
  }
});

// Hook to ensure WebSocket connections have session loaded
fastify.addHook('preValidation', async (request, reply) => {
  // This runs before websocket upgrade, ensuring session is available
  // Fastify's session plugin should have already deserialized it
  if (request.url.includes('/api/tictactoe/matchmaking') || request.url.includes('/api/presence')) {
    // Force session to be initialized if not already
    if (!request.session) {
      request.session = {};
    }
  }
});

await fastify.register(websocket);
await fastify.register(multipart);

// Register routes
await fastify.register(userRoutes);
await fastify.register(avatarRoutes);
await fastify.register(tictactoeMatchmakingRoutes);
await fastify.register(presenceRoutes);


// Serve uploaded avatars
await fastify.register(staticFiles, {
  root: path.join(__dirname, '..', 'database', 'uploads'),
  prefix: '/uploads/'
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Pong server running' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    fastify.log.info('Pong server running on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
