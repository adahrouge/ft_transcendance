import sqlite3 from 'sqlite3';
import { promisify } from 'util';
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
    console.log('Connected to SQLite database');
  }
});

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

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
  return await dbGet('SELECT * FROM users WHERE username = ?', [username]);
}

export async function getUserById(id) {
  return await dbGet('SELECT id, username, email, display_name, avatar_url, created_at, updated_at FROM users WHERE id = ?', [id]);
}

export async function getUserByEmail(email) {
  return await dbGet('SELECT * FROM users WHERE email = ?', [email]);
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

// Match history operations
export async function addMatchHistory(userId, opponentId, userScore, opponentScore, result) {
  await dbRun(
    `INSERT INTO match_history (user_id, opponent_id, user_score, opponent_score, result)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, opponentId, userScore, opponentScore, result]
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
export async function addFriend(userId, friendId) {
  try {
    await dbRun(
      `INSERT INTO friends (user_id, friend_id, status)
       VALUES (?, ?, 'accepted')`,
      [userId, friendId]
    );
    return true;
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return false; // Already friends
    }
    throw err;
  }
}

export async function getFriends(userId) {
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, f.status
     FROM friends f
     JOIN users u ON f.friend_id = u.id
     WHERE f.user_id = ? AND f.status = 'accepted'`,
    [userId]
  );
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

