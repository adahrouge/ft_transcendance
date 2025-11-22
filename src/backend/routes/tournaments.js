import jwt from 'jsonwebtoken';
import {
  createTournament,
  getTournamentById,
  getActiveTournaments,
  getTournamentPlayers,
  joinTournament,
  fillTournamentWithBots,
  generateTournamentBracket,
  getTournamentMatches,
  updateTournamentMatch,
  deleteTournament,
  cleanupEmptyTournaments,
  getUserById
} from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to get user from JWT token
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

export async function tournamentRoutes(fastify) {
  // Create tournament
  fastify.post('/api/tournaments', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { max_players } = request.body;
    if (!max_players || (max_players !== 4 && max_players !== 8)) {
      return reply.code(400).send({ error: 'max_players must be 4 or 8' });
    }
    
    try {
      const tournament = await createTournament(user.id, max_players);
      return { tournament };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  
  // Get active tournaments
  fastify.get('/api/tournaments/active', async (request, reply) => {
    try {
      const tournaments = await getActiveTournaments();
      return { tournaments };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  
  // Get tournament details
  fastify.get('/api/tournaments/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const tournament = await getTournamentById(id);
      if (!tournament) {
        return reply.code(404).send({ error: 'Tournament not found' });
      }
      
      const players = await getTournamentPlayers(id);
      const matches = tournament.status === 'active' ? await getTournamentMatches(id) : [];
      
      return {
        tournament: {
          ...tournament,
          players,
          matches
        }
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  
  // Join tournament
  fastify.post('/api/tournaments/:id/join', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { id } = request.params;
    try {
      await joinTournament(parseInt(id), user.id);
      const tournament = await getTournamentById(id);
      const players = await getTournamentPlayers(id);
      return {
        tournament: {
          ...tournament,
          players
        }
      };
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });
  
  // Fill tournament with bots
  fastify.post('/api/tournaments/:id/fill-bots', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { id } = request.params;
    try {
      const tournament = await getTournamentById(id);
      if (!tournament) {
        return reply.code(404).send({ error: 'Tournament not found' });
      }
      
      if (tournament.creator_id !== user.id) {
        return reply.code(403).send({ error: 'Only the tournament creator can fill with bots' });
      }
      
      await fillTournamentWithBots(parseInt(id));
      const updatedTournament = await getTournamentById(id);
      const players = await getTournamentPlayers(id);
      return {
        tournament: {
          ...updatedTournament,
          players
        }
      };
    } catch (err) {
      fastify.log.error('Fill bots error:', err);
      return reply.code(400).send({ error: err.message || 'Failed to fill tournament with bots' });
    }
  });
  
  // Start tournament
  fastify.post('/api/tournaments/:id/start', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { id } = request.params;
    try {
      const tournament = await getTournamentById(id);
      if (!tournament) {
        return reply.code(404).send({ error: 'Tournament not found' });
      }
      
      if (tournament.creator_id !== user.id) {
        return reply.code(403).send({ error: 'Only the tournament creator can start the tournament' });
      }
      
      await generateTournamentBracket(parseInt(id));
      const updatedTournament = await getTournamentById(id);
      const players = await getTournamentPlayers(id);
      const matches = await getTournamentMatches(id);
      
      return {
        tournament: {
          ...updatedTournament,
          players,
          matches
        }
      };
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });
  
  // Get tournament match
  fastify.get('/api/tournaments/:tournamentId/matches/:matchId', async (request, reply) => {
    const { tournamentId, matchId } = request.params;
    try {
      const matches = await getTournamentMatches(parseInt(tournamentId));
      const match = matches.find(m => m.id === parseInt(matchId));
      if (!match) {
        return reply.code(404).send({ error: 'Match not found' });
      }
      return { match };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  
  // Update tournament match result
  fastify.post('/api/tournaments/:tournamentId/matches/:matchId/result', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { tournamentId, matchId } = request.params;
    const { player1_score, player2_score, winner_id } = request.body;
    
    try {
      await updateTournamentMatch(parseInt(matchId), player1_score, player2_score, winner_id);
      return { success: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  
  // Delete tournament (creator only)
  fastify.delete('/api/tournaments/:id', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    
    const { id } = request.params;
    try {
      const tournament = await getTournamentById(id);
      if (!tournament) {
        return reply.code(404).send({ error: 'Tournament not found' });
      }
      
      if (tournament.creator_id !== user.id) {
        return reply.code(403).send({ error: 'Only the tournament creator can delete the tournament' });
      }
      
      // Only allow deletion if tournament hasn't started
      if (tournament.status === 'active') {
        return reply.code(400).send({ error: 'Cannot delete an active tournament' });
      }
      
      await deleteTournament(parseInt(id));
      return { success: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

