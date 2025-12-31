import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
  getMatchHistory,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingFriendRequests,
  getSentFriendRequests,
  searchUsers,
  addMatchHistory,
  blockUser,
  unblockUser,
  getBlockedUsers
} from '../database/db.js';
import { broadcastToUserById } from './presence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATAR_DIR = path.join(__dirname, '..', 'database', 'uploads');
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

export async function userRoutes(fastify) {
  // Register new user
  fastify.post('/api/users/register', async (request, reply) => {
    try {
      const { username, email, password, display_name } = request.body;
      
      if (!username || !email || !password) {
        return reply.code(400).send({ error: 'Username, email, and password are required' });
      }

      // Validate input format
      if (username.length < 3 || username.length > 20) {
        return reply.code(400).send({ error: 'Username must be between 3 and 20 characters' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return reply.code(400).send({ error: 'Username can only contain letters, numbers, and underscores' });
      }

      if (password.length < 6 || password.length > 64) {
        return reply.code(400).send({ error: 'Password must be between 6 and 64 characters' });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }
      
      // Check if username already exists
      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return reply.code(409).send({ error: 'Username already taken' });
      }
      
      // Check if email already exists
      const existingEmail = await getUserByEmail(email);
      if (existingEmail) {
        return reply.code(409).send({ error: 'Email already in use' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await createUser(username, email, passwordHash, display_name);
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '7d'
      });
      
      // Return user data (without password)
      const { password_hash, ...userData } = user;
      return {
        user: userData,
        token
      };
    } catch (err) {
      request.log.error('Registration error:', err);
      return reply.code(500).send({ error: 'Registration failed: ' + err.message });
    }
  });

  // Login
  fastify.post('/api/users/login', async (request, reply) => {
    const { username, password } = request.body;
    
    if (!username || !password) {
      return reply.code(400).send({ error: 'Username and password are required' });
    }
    
    const user = await getUserByUsername(username);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // Return user data (without password)
    const { password_hash, ...userData } = user;
    return {
      user: userData,
      token
    };
  });

  // Save offline match result
  fastify.post('/api/users/me/offline-match', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { playerScore, aiScore, result, difficulty, gameType } = request.body;
    
    // We'll use a special ID for AI opponent (e.g., 0 or -1) or handle it in addMatchHistory
    // Since addMatchHistory expects an opponent_id which references users table, 
    // we might need to ensure a "Bot" user exists or allow NULL.
    // Let's check if we can pass NULL for opponent_id.
    
    // In db.js:
    // FOREIGN KEY (opponent_id) REFERENCES users(id)
    // This means opponent_id must be a valid ID or NULL (if the column allows NULL).
    // The schema definition: opponent_id INTEGER
    // It doesn't say NOT NULL, so NULL is allowed.
    
    try {
      await addMatchHistory(user.id, null, playerScore, aiScore, result, gameType || 'pong');
      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to save match history' });
    }
  });

  // Save tournament win
  fastify.post('/api/users/me/tournament-win', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { size, rounds } = request.body;
    
    try {
      // Add to match history as a tournament win
      await addMatchHistory(user.id, null, size, 0, 'win', 'tournament');
      
      // Could also update a tournaments_won stat in user profile if column exists
      // For now, we just record it in match history
      
      return { success: true, message: 'Tournament victory recorded!' };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to save tournament win' });
    }
  });

  // Helper function to verify Google ID token or access token
  async function verifyGoogleToken(token) {
    return new Promise((resolve, reject) => {
      // Detect token type: ID tokens are JWTs (have dots), access tokens are opaque
      const isIdToken = token.includes('.');
      const tokenParam = isIdToken ? 'id_token' : 'access_token';

      const options = {
        hostname: 'www.googleapis.com',
        path: `/oauth2/v3/tokeninfo?${tokenParam}=${token}`,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(parsed.error_description || 'Token verification failed'));
            } else {
              resolve(parsed);
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Google OAuth endpoint
  fastify.post('/api/users/google-auth', async (request, reply) => {
    const { idToken, email, name, googleId } = request.body;

    if (!idToken) {
      return reply.code(400).send({ error: 'ID token is required' });
    }

    try {
      // Verify the Google token
      const tokenInfo = await verifyGoogleToken(idToken);

      // Log tokenInfo for debugging
      request.log.info('Google tokenInfo:', tokenInfo);

      // Check if email is verified by Google (for ID tokens)
      // Access tokens from Google OAuth always have verified emails
      if (tokenInfo.email_verified === false) {
        return reply.code(401).send({ error: 'Google email not verified' });
      }

      // For access tokens, tokenInfo might not have email, so use the one from request
      // But verify it matches if tokenInfo has email (security check)
      const googleEmail = tokenInfo.email || email;

      if (!googleEmail) {
        request.log.error('No email in tokenInfo or request body');
        return reply.code(400).send({ error: 'Email not found in Google response' });
      }

      // If tokenInfo has email and it doesn't match the request email, reject
      if (tokenInfo.email && tokenInfo.email !== email) {
        request.log.error('Email mismatch:', { tokenEmail: tokenInfo.email, requestEmail: email });
        return reply.code(401).send({ error: 'Email mismatch' });
      }
      
      // Check if user exists by email
      let user = await getUserByEmail(googleEmail);

      if (user) {
        // User exists, generate token and return
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
          expiresIn: '7d'
        });
        const { password_hash, ...userData } = user;
        return {
          user: userData,
          token
        };
      } else {
        // Create new user from Google data
        // Generate a unique username from email or name
        let baseUsername = name ? name.toLowerCase().replace(/\s+/g, '_') : googleEmail.split('@')[0];
        let username = baseUsername;
        let counter = 1;

        // Ensure username is unique
        while (await getUserByUsername(username)) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }

        // Create user with hashed password (Google users won't use password login)
        const randomPassword = Math.random().toString(36).slice(-32);
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        const newUser = await createUser(username, googleEmail, passwordHash, name || username);

        // Generate JWT token
        const token = jwt.sign({ userId: newUser.id, username: newUser.username }, JWT_SECRET, {
          expiresIn: '7d'
        });

        const { password_hash, ...userData } = newUser;
        return {
          user: userData,
          token
        };
      }
    } catch (error) {
      request.log.error('Google OAuth error:', error);
      return reply.code(401).send({ error: error.message || 'Google authentication failed' });
    }
  });

  // Get current user profile
  fastify.get('/api/users/me', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    const { password_hash, ...userData } = user;
    return { user: userData };
  });

  // Update user profile
  fastify.put('/api/users/me', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    const { display_name, email, avatar_url, password, current_password } = request.body;
    const updates = {};
    
    if (display_name !== undefined) {
      updates.display_name = display_name;
    }
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase();
      // Check if email is already taken by another user
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser && existingUser.id !== user.id) {
        return reply.code(409).send({ error: 'Email already in use' });
      }
      updates.email = normalizedEmail;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }
    if (password !== undefined) {
      if (password.length < 8 || password.length > 64) {
        return reply.code(400).send({ error: 'Password must be between 8 and 64 characters' });
      }
      if (!/[0-9]/.test(password)) {
        return reply.code(400).send({ error: 'Password must contain at least one number' });
      }
      if (!/[A-Z]/.test(password)) {
        return reply.code(400).send({ error: 'Password must contain at least one uppercase letter' });
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return reply.code(400).send({ error: 'Password must contain at least one special character' });
      }
      if (!current_password) {
        return reply.code(400).send({ error: 'Current password is required to change password' });
      }
      // Verify current password
      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        return reply.code(401).send({ error: 'Current password is incorrect' });
      }
      // Hash new password
      updates.password_hash = await bcrypt.hash(password, 10);
    }
    
    const updatedUser = await updateUser(user.id, updates);
    const { password_hash, ...userData } = updatedUser;
    return { user: userData };
  });

  // Delete user account
  fastify.delete('/api/users/me', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      console.log(`Deleting account for user ID: ${user.id}, username: ${user.username}`);

      // Delete user's avatar file if it exists
      if (user.avatar_url && user.avatar_url.startsWith('/uploads/')) {
        const filename = user.avatar_url.split('/').pop();
        const filePath = path.join(AVATAR_DIR, filename);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted avatar file: ${filePath}`);
        } catch (err) {
          console.log(`Avatar file not found or already deleted: ${filePath}`);
        }
      }

      // Delete user from database
      console.log(`Calling deleteUser for user ID: ${user.id}`);
      await deleteUser(user.id);
      console.log(`Successfully deleted user ID: ${user.id}`);

      return { success: true, message: 'Account deleted successfully' };
    } catch (err) {
      console.error('Error deleting user account:', err);
      console.error('Error stack:', err.stack);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        errno: err.errno
      });
      return reply.code(500).send({
        error: 'Failed to delete account',
        details: err.message || 'Unknown error'
      });
    }
  });

  // Get user stats
  fastify.get('/api/users/me/stats', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const history = await getMatchHistory(user.id);

    // Compute stats from match history
    const totalGames = history.length;
    const wins = history.filter(m => m.result === 'win').length;
    const losses = history.filter(m => m.result === 'loss').length;
    const draws = history.filter(m => m.result === 'draw').length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const tournamentsWon = history.filter(m => m.game_type === 'tournament' && m.result === 'win').length;

    // Calculate current win streak
    let currentWinStreak = 0;
    for (const match of history) {
      if (match.result === 'win') currentWinStreak++;
      else break;
    }

    // Calculate longest win streak
    let longestWinStreak = 0;
    let tempStreak = 0;
    for (const match of history) {
      if (match.result === 'win') {
        tempStreak++;
        longestWinStreak = Math.max(longestWinStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      stats: {
        total_games: totalGames,
        wins,
        losses,
        draws,
        win_rate: winRate,
        tournaments_won: tournamentsWon,
        current_win_streak: currentWinStreak,
        longest_win_streak: longestWinStreak
      }
    };
  });

  // Get user match history
  fastify.get('/api/users/me/match-history', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const history = await getMatchHistory(user.id);
    return { matches: history };
  });

  // Get user friends (accepted only)
  fastify.get('/api/users/me/friends', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const friends = await getFriends(user.id);
    return { friends };
  });

  // Get pending friend requests (received by user)
  fastify.get('/api/users/me/friend-requests', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const requests = await getPendingFriendRequests(user.id);
    return { requests };
  });

  // Get sent friend requests (sent by user)
  fastify.get('/api/users/me/friend-requests/sent', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const requests = await getSentFriendRequests(user.id);
    return { requests };
  });

  // Search users
  fastify.get('/api/users/search', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { q } = request.query;
    if (!q || q.length < 2) {
      return { users: [] };
    }

    const users = await searchUsers(q, user.id);
    return { users };
  });

  // Send friend request
  fastify.post('/api/users/me/friends/request', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { friend_id } = request.body;
    if (!friend_id) {
      return reply.code(400).send({ error: 'friend_id is required' });
    }

    if (friend_id === user.id) {
      return reply.code(400).send({ error: 'Cannot send friend request to yourself' });
    }

    // Verify friend exists
    const friendUser = await getUserById(friend_id);
    if (!friendUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    try {
      const result = await sendFriendRequest(user.id, friend_id);
      if (!result.success) {
        return reply.code(409).send({ error: result.error });
      }

      // Notify the recipient about the new friend request
      broadcastToUserById(friend_id, {
        type: 'friend_request_received',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'Friend request sent' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to send friend request' });
    }
  });

  // Accept friend request
  fastify.post('/api/users/me/friends/accept', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { friend_id } = request.body;
    if (!friend_id) {
      return reply.code(400).send({ error: 'friend_id is required' });
    }

    try {
      await acceptFriendRequest(user.id, friend_id);

      // Notify the requester that their request was accepted
      broadcastToUserById(friend_id, {
        type: 'friend_request_accepted',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'Friend request accepted' };
    } catch (err) {
      return reply.code(404).send({ error: err.message || 'Friend request not found' });
    }
  });

  // Reject friend request
  fastify.post('/api/users/me/friends/reject', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { friend_id } = request.body;
    if (!friend_id) {
      return reply.code(400).send({ error: 'friend_id is required' });
    }

    try {
      await rejectFriendRequest(user.id, friend_id);

      // Notify the requester that their request was rejected
      broadcastToUserById(friend_id, {
        type: 'friend_request_rejected',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'Friend request rejected' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to reject friend request' });
    }
  });

  // Remove friend
  fastify.delete('/api/users/me/friends/:friendId', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { friendId } = request.params;
    if (!friendId) {
      return reply.code(400).send({ error: 'friendId is required' });
    }

    try {
      await removeFriend(user.id, parseInt(friendId));

      // Notify the removed friend
      broadcastToUserById(parseInt(friendId), {
        type: 'friend_removed',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'Friend removed' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to remove friend' });
    }
  });

  // Block user
  fastify.post('/api/users/me/blocked', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { blocked_user_id } = request.body;
    if (!blocked_user_id) {
      return reply.code(400).send({ error: 'blocked_user_id is required' });
    }

    if (blocked_user_id === user.id) {
      return reply.code(400).send({ error: 'Cannot block yourself' });
    }

    try {
      const result = await blockUser(user.id, blocked_user_id);
      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }

      // Notify the blocked user
      broadcastToUserById(blocked_user_id, {
        type: 'user_blocked',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'User blocked' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to block user' });
    }
  });

  // Unblock user
  fastify.delete('/api/users/me/blocked/:blockedUserId', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { blockedUserId } = request.params;
    if (!blockedUserId) {
      return reply.code(400).send({ error: 'blockedUserId is required' });
    }

    try {
      await unblockUser(user.id, parseInt(blockedUserId));

      // Notify the unblocked user (optional - they might want to know)
      broadcastToUserById(parseInt(blockedUserId), {
        type: 'user_unblocked',
        from: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      });

      return { success: true, message: 'User unblocked' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to unblock user' });
    }
  });

  // Get blocked users
  fastify.get('/api/users/me/blocked', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const blockedUsers = await getBlockedUsers(user.id);
    return { blockedUsers };
  });

  // Upload avatar
  fastify.post('/api/users/me/avatar', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    // Validate file type
    if (!data.mimetype.startsWith('image/')) {
      return reply.code(400).send({ error: 'File must be an image' });
    }

    try {
      // Read file buffer
      const buffer = await data.toBuffer();
      
      // Validate file size (max 2MB)
      if (buffer.length > 2 * 1024 * 1024) {
        return reply.code(400).send({ error: 'Image size must be less than 2MB' });
      }

      // Ensure uploads directory exists
      await fs.mkdir(AVATAR_DIR, { recursive: true });
      
      // Generate filename
      const ext = path.extname(data.filename) || '.jpg';
      const filename = `avatar_${user.id}_${Date.now()}${ext}`;
      const filepath = path.join(AVATAR_DIR, filename);

      // Save file
      await fs.writeFile(filepath, buffer);

      // Update user avatar URL (relative path or full URL depending on setup)
      // For simplicity, store relative path - in production, use absolute URL
      const avatarUrl = `/uploads/${filename}`;
      const updatedUser = await updateUser(user.id, { avatar_url: avatarUrl });
      
      const { password_hash, ...userData } = updatedUser;
      return { user: userData };
    } catch (err) {
      request.log.error('Error uploading avatar:', err);
      return reply.code(500).send({ error: 'Failed to upload avatar' });
    }
  });

  // Get user's board customization
  fastify.get('/api/board-customization', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    return {
      customization: user.board_customization || null
    };
  });

  // Update user's board customization
  fastify.put('/api/board-customization', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { customization } = request.body;

    if (!customization) {
      return reply.code(400).send({ error: 'Customization data is required' });
    }

    // Validate customization structure
    if (!customization.theme || !customization.colors) {
      return reply.code(400).send({ error: 'Invalid customization format' });
    }

    try {
      const updatedUser = await updateUser(user.id, {
        board_customization: customization
      });

      return {
        customization: updatedUser.board_customization
      };
    } catch (err) {
      request.log.error('Error saving board customization:', err);
      return reply.code(500).send({ error: 'Failed to save customization' });
    }
  });

  // Get user's XO board customization
  fastify.get('/api/xo-board-customization', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    return {
      customization: user.xo_board_customization || null
    };
  });

  // Update user's XO board customization
  fastify.put('/api/xo-board-customization', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { customization } = request.body;

    if (!customization) {
      return reply.code(400).send({ error: 'Customization data is required' });
    }

    // Validate customization structure
    if (!customization.theme || !customization.colors) {
      return reply.code(400).send({ error: 'Invalid customization format' });
    }

    try {
      const updatedUser = await updateUser(user.id, {
        xo_board_customization: customization
      });

      return {
        customization: updatedUser.xo_board_customization
      };
    } catch (err) {
      request.log.error('Error saving XO board customization:', err);
      return reply.code(500).send({ error: 'Failed to save customization' });
    }
  });
}

// Helper to serve avatar files
export async function avatarRoutes(fastify) {
  fastify.get('/uploads/:filename', async (request, reply) => {
    const { filename } = request.params;
    const filepath = path.join(AVATAR_DIR, filename);
    
    try {
      await fs.access(filepath);
      return reply.sendFile(filename, AVATAR_DIR);
    } catch (err) {
      return reply.code(404).send({ error: 'Avatar not found' });
    }
  });
}

