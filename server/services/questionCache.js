// Question cache. Every successful AI generation is stored in SQLite so we
// can recycle it later — reducing Gemini/Claude spend while still serving the
// same user a question they haven't seen.
//
// Recycle probability is driven by the user's mastery for the exact
// (subject, topic, difficulty) bucket the request is for:
//
//   red    (< 60%)        → 40% chance to pull from cache
//   orange (60–79%)       → 25%
//   green  (>= 80%)       → 10%
//   no attempts yet       → 10%   (start fresh, build the pool first)
//
// If the dice says "recycle" but the cache has nothing the user hasn't
// already seen, we fall through to a fresh AI generation — so cache misses
// never block question delivery.

import { db, newId } from './db.js';
import { createHash } from 'node:crypto';

const RECYCLE_PROB = {
  red:    0.40,
  orange: 0.25,
  green:  0.10,
  none:   0.10
};

// Same band thresholds the dashboard uses.
function bandFor(percent) {
  if (percent == null) return 'none';
  if (percent < 60)  return 'red';
  if (percent < 80)  return 'orange';
  return 'green';
}

// Hash the question text so the same prompt produced twice doesn't create
// two cache entries. We hash the question string only — options can be
// shuffled per-user so the question is the stable identity.
function hashQuestion(question) {
  return createHash('sha256').update(String(question || '').trim().toLowerCase()).digest('hex').slice(0, 32);
}

// Per-difficulty percent for this user in this (subject, topic, difficulty).
// Pulled from completed practice_sessions; uses the same score/total math
// the dashboard surfaces.
function userPercent(userId, subject, topic, difficulty) {
  if (!userId) return null;
  const row = db.prepare(`
    SELECT SUM(score) AS s, SUM(total) AS t
    FROM practice_sessions
    WHERE user_id = ? AND subject = ? AND topic = ? AND difficulty = ?
  `).get(userId, subject, topic, difficulty);
  if (!row || !row.t) return null;
  return Math.round((row.s / row.t) * 100);
}

export function pickRecycleProbability(userId, subject, topic, difficulty) {
  return RECYCLE_PROB[bandFor(userPercent(userId, subject, topic, difficulty))];
}

// Pull one random cached question the user hasn't seen yet. Returns the
// parsed question object plus its row id (for marking seen), or null.
export function pickCachedQuestion({ userId, subject, topic, difficulty }) {
  const row = db.prepare(`
    SELECT q.id, q.question_json
    FROM practice_questions q
    WHERE q.subject = ? AND q.topic = ? AND q.difficulty = ?
      AND NOT EXISTS (
        SELECT 1 FROM user_question_seen s
        WHERE s.user_id = ? AND s.question_id = q.id
      )
    ORDER BY RANDOM()
    LIMIT 1
  `).get(subject, topic, difficulty, userId || '');
  if (!row) return null;
  try {
    return { id: row.id, question: JSON.parse(row.question_json) };
  } catch {
    return null;
  }
}

// Store a freshly-generated question. Idempotent on (subject, topic,
// difficulty, content_hash) — duplicates are silently ignored. Returns the
// row id so callers can mark the question as seen for the requesting user.
export function rememberQuestion({ subject, topic, difficulty, question }) {
  if (!question || !question.question) return null;
  const hash = hashQuestion(question.question);
  const existing = db.prepare(
    `SELECT id FROM practice_questions WHERE content_hash = ?`
  ).get(hash);
  if (existing) return existing.id;

  const id = newId();
  try {
    db.prepare(`
      INSERT INTO practice_questions (id, subject, topic, difficulty, content_hash, question_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, subject, topic, difficulty, hash, JSON.stringify(question));
    return id;
  } catch (e) {
    // Race: another request inserted the same hash between our check and now.
    const again = db.prepare(`SELECT id FROM practice_questions WHERE content_hash = ?`).get(hash);
    return again?.id || null;
  }
}

export function markSeen(userId, questionId) {
  if (!userId || !questionId) return;
  try {
    db.prepare(`
      INSERT OR IGNORE INTO user_question_seen (user_id, question_id) VALUES (?, ?)
    `).run(userId, questionId);
    db.prepare(`UPDATE practice_questions SET use_count = use_count + 1 WHERE id = ?`).run(questionId);
  } catch { /* non-fatal */ }
}
