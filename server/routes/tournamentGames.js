import { getTournamentMatches, getTournamentById, getTournamentPlayers } from '../database/db.js';
import { gameEngine } from '../game/GameEngine.js';
import jwt from 'jsonwebtoken';
import { getUserById } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function getUserFromToken(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return await getUserById(decoded.userId);
  } catch (err) {
    return null;
  }
}

export async function tournamentGamesRoutes(fastify) {
  // Create or get a game for a tournament match
  fastify.post('/api/tournaments/:tournamentId/matches/:matchId/game', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    const { tournamentId, matchId } = request.params;
    try {
      const matches = await getTournamentMatches(parseInt(tournamentId));
      const match = matches.find(m => m.id === parseInt(matchId));
      if (!match) {
        return reply.code(404).send({ error: 'Match not found' });
      }
      // Only allow if user is a participant
      if (match.p1_user_id !== user.id && match.p2_user_id !== user.id) {
        return reply.code(403).send({ error: 'Not a participant in this match' });
      }
      // Check if a game already exists for this match
      if (match.game_id) {
        return { gameId: match.game_id };
      }
      // Get player info
      const players = await getTournamentPlayers(tournamentId);
      const p1 = players.find(p => p.id === match.player1_id);
      const p2 = players.find(p => p.id === match.player2_id);
      // Create game with bot logic if needed
      const isP1Bot = p1 && p1.is_bot;
      const isP2Bot = p2 && p2.is_bot;
      const game = gameEngine.createGame(
        { id: p1 ? p1.id.toString() : 'bot', name: p1 ? (p1.display_name || p1.username || p1.bot_name) : 'Bot' },
        { id: p2 ? p2.id.toString() : 'bot', name: p2 ? (p2.display_name || p2.username || p2.bot_name) : 'Bot' },
        isP1Bot,
        isP2Bot
      );
      // Save game_id to match (you may need to implement this in db.js)
      // await setTournamentMatchGameId(match.id, game.id);
      return { gameId: game.id };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
