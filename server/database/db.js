import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use mounted volume path if available, otherwise use local path
// In Docker, DATABASE_PATH will be /app/database/data/database.db
// Locally, it will use database/data/database.db (relative to db.js location)
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'data', 'database.db');

// Ensure directory exists if using custom path
if (process.env.DATABASE_PATH) {
  const dbDir = dirname(dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Wrap database methods with proper promise handling
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('DB Run Error:', err.message, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('DB Get Error:', err.message, 'SQL:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('DB All Error:', err.message, 'SQL:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialize database schema
export async function initDatabase() {
  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      auth_provider TEXT DEFAULT 'local',
      last_active DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Match history table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opponent_id INTEGER,
      user_score INTEGER NOT NULL,
      opponent_score INTEGER NOT NULL,
      result TEXT NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (opponent_id) REFERENCES users(id)
    )
  `);

  // Friends table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      blocked_by_user INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id),
      UNIQUE(user_id, friend_id)
    )
  `);

  // Blocked users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_user_id) REFERENCES users(id),
      UNIQUE(user_id, blocked_user_id)
    )
  `);

  // Add board_customization column if it doesn't exist
  try {
    const tableInfo = await dbAll('PRAGMA table_info(users)');
    const hasCustomizationColumn = tableInfo.some(col => col.name === 'board_customization');

    if (!hasCustomizationColumn) {
      await dbRun('ALTER TABLE users ADD COLUMN board_customization TEXT');
      console.log('Added board_customization column to users table');
    }

    // Add xo_board_customization column if it doesn't exist
    const hasXoCustomizationColumn = tableInfo.some(col => col.name === 'xo_board_customization');
    if (!hasXoCustomizationColumn) {
      await dbRun('ALTER TABLE users ADD COLUMN xo_board_customization TEXT');
      console.log('Added xo_board_customization column to users table');
    }

    // Add last_active column if it doesn't exist
    const hasLastActiveColumn = tableInfo.some(col => col.name === 'last_active');
    if (!hasLastActiveColumn) {
      await dbRun('ALTER TABLE users ADD COLUMN last_active DATETIME');
      console.log('Added last_active column to users table');
    }

    // Add auth_provider column if it doesn't exist
    const hasAuthProviderColumn = tableInfo.some(col => col.name === 'auth_provider');
    if (!hasAuthProviderColumn) {
      await dbRun("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'");
      console.log('Added auth_provider column to users table');
    }
  } catch (err) {
    console.error('Error adding columns to users table:', err);
  }

  // Add game_type column if it doesn't exist
  try {
    const tableInfo = await dbAll('PRAGMA table_info(match_history)');
    const hasGameTypeColumn = tableInfo.some(col => col.name === 'game_type');

    if (!hasGameTypeColumn) {
      await dbRun("ALTER TABLE match_history ADD COLUMN game_type TEXT DEFAULT 'pong'");
      console.log('Added game_type column to match_history table');
    }
  } catch (err) {
    console.error('Error adding game_type column:', err);
  }
}

export async function createUser(username, email, passwordHash, displayName = null) {
  // Normalize email to lowercase to prevent case-sensitivity issues
  const normalizedEmail = email.toLowerCase();
  await dbRun(
    `INSERT INTO users (username, email, password_hash, display_name)
     VALUES (?, ?, ?, ?)`,
    [username, normalizedEmail, passwordHash, displayName || username]
  );
  return getUserByUsername(username);
}

export async function getUserByUsername(username) {
  const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
  return parseUserCustomization(user);
}

function parseUserCustomization(user) {
  if (user && user.board_customization) {
    try {
      user.board_customization = JSON.parse(user.board_customization);
    } catch (err) {
      user.board_customization = null;
    }
  }
  if (user && user.xo_board_customization) {
    try {
      user.xo_board_customization = JSON.parse(user.xo_board_customization);
    } catch (err) {
      user.xo_board_customization = null;
    }
  }
  return user;
}

export async function getUserById(id) {
  const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  return parseUserCustomization(user);
}

export async function getUserByEmail(email) {
  // Case-insensitive email lookup to prevent duplicate emails with different casing
  const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  return parseUserCustomization(user);
}

export async function updateUser(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(updates.display_name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar_url);
  }
  if (updates.password_hash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.password_hash);
  }
  if (updates.board_customization !== undefined) {
    fields.push('board_customization = ?');
    values.push(JSON.stringify(updates.board_customization));
  }
  if (updates.xo_board_customization !== undefined) {
    fields.push('xo_board_customization = ?');
    values.push(JSON.stringify(updates.xo_board_customization));
  }
  if (updates.last_active !== undefined) {
    fields.push('last_active = ?');
    values.push(updates.last_active);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await dbRun(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  return getUserById(id);
}

export async function deleteUser(id) {
  // Delete user and cascade delete related data
  // The database schema should have ON DELETE CASCADE for foreign keys
  // But we'll also manually delete to be safe

  try {
    console.log(`[deleteUser] Starting deletion for user ID: ${id}`);

    // Delete friend relationships
    console.log(`[deleteUser] Deleting friend relationships...`);
    await dbRun('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [id, id]);
    console.log(`[deleteUser] Friend relationships deleted`);

    // Delete match history (where user is either the player or opponent)
    console.log(`[deleteUser] Deleting match history...`);
    await dbRun('DELETE FROM match_history WHERE user_id = ? OR opponent_id = ?', [id, id]);
    console.log(`[deleteUser] Match history deleted`);

    // Delete blocked users
    console.log(`[deleteUser] Deleting blocked users...`);
    await dbRun('DELETE FROM blocked_users WHERE user_id = ? OR blocked_user_id = ?', [id, id]);
    console.log(`[deleteUser] Blocked users deleted`);

    // Finally delete the user
    console.log(`[deleteUser] Deleting user record...`);
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    console.log(`[deleteUser] User record deleted successfully`);
  } catch (err) {
    console.error(`[deleteUser] Error during deletion:`, err);
    throw err;
  }
}

export async function getAllUsers() {
  return await dbAll('SELECT id, username, email, display_name, avatar_url FROM users');
}

export async function searchUsers(query, currentUserId = null) {
  const searchTerm = `%${query}%`;
  let sql = `SELECT id, username, email, display_name, avatar_url 
             FROM users 
             WHERE (username LIKE ? OR display_name LIKE ?)`;
  const params = [searchTerm, searchTerm];

  if (currentUserId) {
    // Exclude users who have blocked the current user or are blocked by the current user
    sql += ` AND id NOT IN (
      SELECT blocked_user_id FROM blocked_users WHERE user_id = ?
      UNION
      SELECT user_id FROM blocked_users WHERE blocked_user_id = ?
    )`;
    params.push(currentUserId, currentUserId);
    
    // Exclude current user
    sql += ` AND id != ?`;
    params.push(currentUserId);
  }

  sql += ` LIMIT 20`;

  return await dbAll(sql, params);
}

// Match history operations
export async function addMatchHistory(userId, opponentId, userScore, opponentScore, result, gameType = 'pong') {
  await dbRun(
    `INSERT INTO match_history (user_id, opponent_id, user_score, opponent_score, result, game_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, opponentId, userScore, opponentScore, result, gameType]
  );
}

export async function getMatchHistory(userId) {
  return await dbAll(
    `SELECT m.*, u.username as opponent_username, u.display_name as opponent_display_name
     FROM match_history m
     LEFT JOIN users u ON m.opponent_id = u.id
     WHERE m.user_id = ?
     ORDER BY m.played_at DESC
     LIMIT 50`,
    [userId]
  );
}

// Friends operations
export async function sendFriendRequest(userId, friendId) {
  try {
    // Check if either user has blocked the other
    const blocked = await dbGet(
      `SELECT * FROM blocked_users 
       WHERE (user_id = ? AND blocked_user_id = ?) 
          OR (user_id = ? AND blocked_user_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (blocked) {
      return { success: false, error: 'Cannot send friend request to this user' };
    }

    // Check if request already exists in either direction
    const existing = await dbGet(
      `SELECT * FROM friends
       WHERE (user_id = ? AND friend_id = ?)
          OR (user_id = ? AND friend_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (existing) {
      console.log(`Friend request blocked - existing relationship found:`, existing);
      if (existing.status === 'pending') {
        return { success: false, error: 'Friend request already pending' };
      }
      return { success: false, error: 'Already friends with this user' };
    }

    await dbRun(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES (?, ?, 'pending')`,
      [userId, friendId]
    );
    return { success: true };
  } catch (err) {
    throw err;
  }
}

export async function acceptFriendRequest(userId, friendId) {
  // Find the pending request where friendId sent request to userId
  const request = await dbGet(
    `SELECT * FROM friends
     WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
    [friendId, userId]
  );

  if (!request) {
    throw new Error('Friend request not found');
  }

  // Update the request to accepted
  await dbRun(
    `UPDATE friends SET status = 'accepted' WHERE id = ?`,
    [request.id]
  );

  // Create reciprocal friendship (both users are now friends)
  try {
    await dbRun(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES (?, ?, 'accepted')`,
      [userId, friendId]
    );
  } catch (err) {
    // If it already exists, just ignore (might be edge case)
    if (!err.message.includes('UNIQUE')) {
      throw err;
    }
  }

  return true;
}

export async function rejectFriendRequest(userId, friendId) {
  await dbRun(
    `DELETE FROM friends
     WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
    [friendId, userId]
  );
  return true;
}

export async function removeFriend(userId, friendId) {
  // First check what exists before deletion
  const before = await dbAll(
    `SELECT * FROM friends
     WHERE (user_id = ? AND friend_id = ?)
        OR (user_id = ? AND friend_id = ?)`,
    [userId, friendId, friendId, userId]
  );
  console.log(`Before removal - found ${before.length} friendship records between ${userId} and ${friendId}:`, before);

  // Remove both directions of friendship
  await dbRun(
    `DELETE FROM friends
     WHERE (user_id = ? AND friend_id = ?)
        OR (user_id = ? AND friend_id = ?)`,
    [userId, friendId, friendId, userId]
  );

  // Verify deletion
  const after = await dbAll(
    `SELECT * FROM friends
     WHERE (user_id = ? AND friend_id = ?)
        OR (user_id = ? AND friend_id = ?)`,
    [userId, friendId, friendId, userId]
  );
  console.log(`After removal - remaining records: ${after.length}`, after);

  return true;
}

export async function blockUser(userId, blockedUserId) {
  // Check if already blocked
  const existing = await dbGet(
    `SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?`,
    [userId, blockedUserId]
  );

  if (existing) {
    return { success: false, error: 'User already blocked' };
  }

  // Remove any PENDING friend requests (but keep accepted friendships)
  await dbRun(
    `DELETE FROM friends
     WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
     AND status = 'pending'`,
    [userId, blockedUserId, blockedUserId, userId]
  );

  // Add to blocked_users
  await dbRun(
    `INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)`,
    [userId, blockedUserId]
  );

  return { success: true };
}

export async function unblockUser(userId, blockedUserId) {
  await dbRun(
    `DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?`,
    [userId, blockedUserId]
  );
  return { success: true };
}

export async function getBlockedUsers(userId) {
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, b.created_at
     FROM blocked_users b
     JOIN users u ON b.blocked_user_id = u.id
     WHERE b.user_id = ?`,
    [userId]
  );
}

export async function isBlocked(userId, otherUserId) {
  const blocked = await dbGet(
    `SELECT * FROM blocked_users 
     WHERE (user_id = ? AND blocked_user_id = ?) 
        OR (user_id = ? AND blocked_user_id = ?)`,
    [userId, otherUserId, otherUserId, userId]
  );
  return !!blocked;
}

export async function getFriends(userId) {
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url,
            CASE WHEN u.last_active IS NOT NULL
                 AND datetime(u.last_active) > datetime('now', '-10 seconds')
                 THEN 1 ELSE 0 END as is_online
     FROM friends f
     JOIN users u ON f.friend_id = u.id
     LEFT JOIN blocked_users b1 ON (b1.user_id = ? AND b1.blocked_user_id = u.id)
     LEFT JOIN blocked_users b2 ON (b2.user_id = u.id AND b2.blocked_user_id = ?)
     WHERE f.user_id = ? AND f.status = 'accepted' AND b1.id IS NULL AND b2.id IS NULL`,
    [userId, userId, userId]
  );
}

export async function getPendingFriendRequests(userId) {
  // Get requests sent TO this user (they can accept/reject)
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, f.created_at
     FROM friends f
     JOIN users u ON f.user_id = u.id
     WHERE f.friend_id = ? AND f.status = 'pending'`,
    [userId]
  );
}

export async function getSentFriendRequests(userId) {
  // Get requests sent BY this user (pending, waiting for response)
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, f.created_at
     FROM friends f
     JOIN users u ON f.friend_id = u.id
     WHERE f.user_id = ? AND f.status = 'pending'`,
    [userId]
  );
}

export async function updateUserActivity(userId) {
  await dbRun(
    `UPDATE users SET last_active = datetime('now') WHERE id = ?`,
    [userId]
  );
}

// Legacy function for backwards compatibility - now uses sendFriendRequest
export async function addFriend(userId, friendId) {
  const result = await sendFriendRequest(userId, friendId);
  return result.success;
}

// Close database connection (for graceful shutdown)
export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

