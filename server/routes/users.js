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
  getMatchHistory,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingFriendRequests,
  getSentFriendRequests,
  searchUsers,
  addMatchHistory
} from '../database/db.js';

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
    const { username, email, password, display_name } = request.body;
    
    if (!username || !email || !password) {
      return reply.code(400).send({ error: 'Username, email, and password are required' });
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

  // Helper function to verify Google ID token
  async function verifyGoogleToken(idToken) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: `/oauth2/v3/tokeninfo?id_token=${idToken}`,
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
      
      // Check if email is verified by Google
      if (!tokenInfo.email_verified) {
        return reply.code(401).send({ error: 'Google email not verified' });
      }

      const googleEmail = tokenInfo.email;
      
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
      // Check if email is already taken by another user
      const existingUser = await getUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return reply.code(409).send({ error: 'Email already in use' });
      }
      updates.email = email;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }
    if (password !== undefined) {
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

    const users = await searchUsers(q);
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

      return { success: true, message: 'Friend removed' };
    } catch (err) {
      return reply.code(500).send({ error: err.message || 'Failed to remove friend' });
    }
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

