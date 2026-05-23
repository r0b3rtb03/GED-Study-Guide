import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

// Pick the DB path:
//   1. DATABASE_FILE env var wins (use this on Railway: /data/ged_math.sqlite)
//   2. If a /data directory exists (Railway Volume), use /data/ged_math.sqlite
//   3. Otherwise fall back to ./server/data/ged_math.sqlite (local dev)
function resolveDbFile() {
  if (process.env.DATABASE_FILE) return process.env.DATABASE_FILE;
  if (fs.existsSync('/data') && fs.statSync('/data').isDirectory()) {
    return '/data/ged_math.sqlite';
  }
  return path.resolve('server/data/ged_math.sqlite');
}

const dbFile = resolveDbFile();
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

if (process.env.NODE_ENV === 'production' && !dbFile.startsWith('/data')) {
  console.warn('\n[db] ⚠️  WARNING: running in production but DB is on EPHEMERAL container storage.');
  console.warn('[db]     Every redeploy will wipe all users and sessions.');
  console.warn('[db]     Fix: attach a Railway Volume mounted at /data and set DATABASE_FILE=/data/ged_math.sqlite');
  console.warn('[db]     Current path: ' + dbFile + '\n');
}
console.log('[db] using', dbFile);

export const db = new DatabaseSync(dbFile);
db.exec(`PRAGMA journal_mode = WAL;`);
db.exec(`PRAGMA foreign_keys = ON;`);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  avatar_url           TEXT,
  preferences          TEXT NOT NULL DEFAULT '{"studyReminders":true,"weeklyReport":true,"curriculumUpdates":false}',
  email_verified       INTEGER NOT NULL DEFAULT 0,
  verification_code    TEXT,
  verification_expires TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS practice_sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic      TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score      INTEGER NOT NULL,
  total      INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  questions  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_topic ON practice_sessions(topic);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON practice_sessions(created_at);
`);

// Lightweight migration: add columns added after the original CREATE TABLE on
// databases created before the column existed. SQLite ignores "if not exists"
// on ALTER, so we read the current schema and only add what's missing.
function ensureUserColumns() {
  const cols = db.prepare(`PRAGMA table_info(users)`).all().map(r => r.name);
  const adds = [];
  if (!cols.includes('email_verified'))       adds.push(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
  if (!cols.includes('verification_code'))    adds.push(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
  if (!cols.includes('verification_expires')) adds.push(`ALTER TABLE users ADD COLUMN verification_expires TEXT`);
  for (const sql of adds) { try { db.exec(sql); } catch (e) { console.warn('[db] migration skipped:', e.message); } }
}
ensureUserColumns();

export const newId = () => randomUUID();

export function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    preferences: JSON.parse(row.preferences || '{}'),
    emailVerified: !!row.email_verified,
    createdAt: row.created_at
  };
}
