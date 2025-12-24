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

  // Tournaments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      max_players INTEGER NOT NULL,
      status TEXT DEFAULT 'waiting',
      started_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // Tournament players table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS tournament_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      user_id INTEGER,
      bracket_position INTEGER NOT NULL,
      is_bot INTEGER DEFAULT 0,
      bot_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(tournament_id, bracket_position)
    )
  `);

  // Tournament matches table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      winner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (player1_id) REFERENCES tournament_players(id),
      FOREIGN KEY (player2_id) REFERENCES tournament_players(id),
      FOREIGN KEY (winner_id) REFERENCES tournament_players(id),
      UNIQUE(tournament_id, round, match_number)
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
  } catch (err) {
    console.error('Error adding board_customization column:', err);
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

  console.log('Database initialized');
}

// User operations
export async function createUser(username, email, passwordHash, displayName = null) {
  await dbRun(
    `INSERT INTO users (username, email, password_hash, display_name)
     VALUES (?, ?, ?, ?)`,
    [username, email, passwordHash, displayName || username]
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
  const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
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

  // Remove any existing friendship or pending requests
  await removeFriend(userId, blockedUserId);

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
     WHERE f.user_id = ? AND f.status = 'accepted'`,
    [userId]
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

// Tournament operations
export async function createTournament(creatorId, maxPlayers) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tournaments (creator_id, max_players, status)
       VALUES (?, ?, 'waiting')`,
      [creatorId, maxPlayers],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        const tournamentId = this.lastID;
        
        // Add creator to bracket position 0
        db.run(
          `INSERT INTO tournament_players (tournament_id, user_id, bracket_position, is_bot)
           VALUES (?, ?, 0, 0)`,
          [tournamentId, creatorId],
          async (err2) => {
            if (err2) {
              reject(err2);
              return;
            }
            try {
              const tournament = await getTournamentById(tournamentId);
              resolve(tournament);
            } catch (err3) {
              reject(err3);
            }
          }
        );
      }
    );
  });
}

export async function getTournamentById(tournamentId) {
  return await dbGet(
    `SELECT t.*, u.username as creator_username, u.display_name as creator_display_name
     FROM tournaments t
     JOIN users u ON t.creator_id = u.id
     WHERE t.id = ?`,
    [tournamentId]
  );
}

export async function getActiveTournaments() {
  return await dbAll(
    `SELECT t.id, t.creator_id, t.max_players, t.status, t.started_at, t.created_at,
            u.username as creator_username, u.display_name as creator_display_name,
            COUNT(tp.id) as current_players
     FROM tournaments t
     JOIN users u ON t.creator_id = u.id
     LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
     WHERE t.status = 'waiting'
     GROUP BY t.id, t.creator_id, t.max_players, t.status, t.started_at, t.created_at,
              u.username, u.display_name
     ORDER BY t.created_at DESC`
  );
}

export async function getTournamentPlayers(tournamentId) {
  return await dbAll(
    `SELECT tp.*, u.username, u.display_name, u.avatar_url
     FROM tournament_players tp
     LEFT JOIN users u ON tp.user_id = u.id
     WHERE tp.tournament_id = ?
     ORDER BY tp.bracket_position`,
    [tournamentId]
  );
}

export async function joinTournament(tournamentId, userId) {
  // Check if tournament exists and is waiting
  const tournament = await getTournamentById(tournamentId);
  if (!tournament || tournament.status !== 'waiting') {
    throw new Error('Tournament not found or not accepting players');
  }
  
  // Check if user already joined
  const existing = await dbGet(
    `SELECT * FROM tournament_players WHERE tournament_id = ? AND user_id = ?`,
    [tournamentId, userId]
  );
  if (existing) {
    throw new Error('You have already joined this tournament');
  }
  
  // Find first available bracket position
  const players = await getTournamentPlayers(tournamentId);
  const occupied = new Set(players.map(p => p.bracket_position));
  let position = -1;
  for (let i = 0; i < tournament.max_players; i++) {
    if (!occupied.has(i)) {
      position = i;
      break;
    }
  }
  
  if (position === -1) {
    throw new Error('Tournament is full');
  }
  
  await dbRun(
    `INSERT INTO tournament_players (tournament_id, user_id, bracket_position, is_bot)
     VALUES (?, ?, ?, 0)`,
    [tournamentId, userId, position]
  );
  
  return getTournamentById(tournamentId);
}

export async function fillTournamentWithBots(tournamentId) {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== 'waiting') {
    throw new Error('Tournament is not accepting players');
  }

  const players = await getTournamentPlayers(tournamentId);
  const occupied = new Set(players.map(p => p.bracket_position));

  // Check if tournament is already full
  if (occupied.size >= tournament.max_players) {
    throw new Error('Tournament is already full');
  }

  // Generate bot `AI Bot n` for each free slot
  const botInserts = [];
  for (let i = 0; i < tournament.max_players; i++) {
    if (!occupied.has(i)) {
      botInserts.push({ position: i, name: `AI Bot ${i + 1}` });
    }
  }

  if (botInserts.length === 0) {
    throw new Error('No empty slots to fill');
  }

  for (const bot of botInserts) {
    try {
      await dbRun(
        `INSERT INTO tournament_players (tournament_id, user_id, bracket_position, is_bot, bot_name)
         VALUES (?, NULL, ?, 1, ?)`,
        [tournamentId, bot.position, bot.name]
      );
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE')) {
        continue;
      }
      throw err;
    }
  }

  return getTournamentById(tournamentId);
}

export async function generateTournamentBracket(tournamentId) {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  const players = await getTournamentPlayers(tournamentId);
  if (players.length !== tournament.max_players) {
    throw new Error('Tournament is not full');
  }
  
  // Shuffle players
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Generate first round matches
  for (let i = 0; i < shuffled.length; i += 2) {
    const matchNum = Math.floor(i / 2) + 1;
    await dbRun(
      `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id, status)
       VALUES (?, 1, ?, ?, ?, 'pending')`,
      [tournamentId, matchNum, shuffled[i].id, shuffled[i + 1]?.id || null]
    );
  }
  
  // Update tournament status
  await dbRun(
    `UPDATE tournaments SET status = 'active', started_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [tournamentId]
  );
  
  return getTournamentById(tournamentId);
}

export async function getTournamentMatches(tournamentId) {
  return await dbAll(
    `SELECT m.*,
            p1.user_id as p1_user_id, p1.is_bot as p1_is_bot, p1.bot_name as p1_bot_name,
            u1.username as p1_username, u1.display_name as p1_display_name,
            p2.user_id as p2_user_id, p2.is_bot as p2_is_bot, p2.bot_name as p2_bot_name,
            u2.username as p2_username, u2.display_name as p2_display_name
     FROM tournament_matches m
     LEFT JOIN tournament_players p1 ON m.player1_id = p1.id
     LEFT JOIN users u1 ON p1.user_id = u1.id
     LEFT JOIN tournament_players p2 ON m.player2_id = p2.id
     LEFT JOIN users u2 ON p2.user_id = u2.id
     WHERE m.tournament_id = ?
     ORDER BY m.round, m.match_number`,
    [tournamentId]
  );
}

export async function updateTournamentMatch(matchId, player1Score, player2Score, winnerId) {
  await dbRun(
    `UPDATE tournament_matches 
     SET player1_score = ?, player2_score = ?, winner_id = ?, status = 'finished'
     WHERE id = ?`,
    [player1Score, player2Score, winnerId, matchId]
  );
}

export async function deleteTournament(tournamentId) {
  // Delete in order: matches, players, then tournament (due to foreign keys)
  await dbRun(`DELETE FROM tournament_matches WHERE tournament_id = ?`, [tournamentId]);
  await dbRun(`DELETE FROM tournament_players WHERE tournament_id = ?`, [tournamentId]);
  await dbRun(`DELETE FROM tournaments WHERE id = ?`, [tournamentId]);
}

export async function cleanupEmptyTournaments() {
  // Delete tournaments that have been waiting for more than 5 minutes with only the creator
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const emptyTournaments = await dbAll(
    `SELECT t.id, COUNT(tp.id) as player_count
     FROM tournaments t
     LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
     WHERE t.status = 'waiting' 
       AND t.created_at < ?
     GROUP BY t.id
     HAVING player_count <= 1`,
    [fiveMinutesAgo]
  );
  
  for (const tournament of emptyTournaments) {
    await deleteTournament(tournament.id);
  }
  
  return emptyTournaments.length;
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

