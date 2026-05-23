import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

// Pick the DB path. We aggressively prefer /data when it exists because the
// Railway Volume mount is the only durable storage in production. A common
// failure mode is DATABASE_FILE having been left as a relative path in env
// vars from before the volume was attached — that would silently send writes
// back to the ephemeral container disk. So the precedence is:
//   1. /data exists and is writable  → /data/<dbname>.sqlite (ALWAYS, even if
//      DATABASE_FILE points elsewhere — we override and log the override)
//   2. DATABASE_FILE is an ABSOLUTE path → honor it
//   3. DATABASE_FILE is relative or unset → ./server/data/ged_math.sqlite
function canWrite(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch { return false; }
}

function resolveDbFile() {
  const envPath = process.env.DATABASE_FILE;
  const dataExists = fs.existsSync('/data') && fs.statSync('/data').isDirectory() && canWrite('/data');

  if (dataExists) {
    const volumePath = '/data/ged_math.sqlite';
    if (envPath && path.resolve(envPath) !== volumePath) {
      console.warn(`[db] ⚠️  DATABASE_FILE is set to "${envPath}" but /data volume is mounted.`);
      console.warn(`[db]     Overriding to ${volumePath} so data survives deployments.`);
      console.warn(`[db]     Remove the DATABASE_FILE env var on Railway (or set it to ${volumePath}) to silence this warning.\n`);
    }
    return volumePath;
  }

  if (envPath && path.isAbsolute(envPath)) return envPath;
  return path.resolve('server/data/ged_math.sqlite');
}

const dbFile = resolveDbFile();
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const onVolume = dbFile.startsWith('/data');
if (process.env.NODE_ENV === 'production' && !onVolume) {
  console.warn('\n[db] ⚠️  WARNING: running in production but DB is on EPHEMERAL container storage.');
  console.warn('[db]     Every redeploy will wipe all users and sessions.');
  console.warn('[db]     Fix: attach a Railway Volume mounted at /data — the app will auto-detect it.');
  console.warn('[db]     Current path: ' + dbFile + '\n');
} else if (onVolume) {
  console.log('[db] ✓ using persistent volume:', dbFile);
} else {
  console.log('[db] using', dbFile, '(local dev)');
}

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
