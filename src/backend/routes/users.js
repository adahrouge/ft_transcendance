import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  getMatchHistory,
  getFriends,
  addFriend
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
    
    // Check if user already exists
    const existingUser = await getUserByUsername(username) || await getUserByEmail(email);
    if (existingUser) {
      return reply.code(409).send({ error: 'User already exists' });
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

  // Get user friends
  fastify.get('/api/users/me/friends', async (request, reply) => {
    const user = await getUserFromToken(request);
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    
    const friends = await getFriends(user.id);
    return { friends };
  });

  // Search users
  fastify.get('/api/users/search', async (request, reply) => {
    const { q } = request.query;
    if (!q || q.length < 2) {
      return { users: [] };
    }
    
    // This would need a search implementation in db.js
    // For now, return empty array
    return { users: [] };
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
      console.error('Error uploading avatar:', err);
      return reply.code(500).send({ error: 'Failed to upload avatar' });
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

