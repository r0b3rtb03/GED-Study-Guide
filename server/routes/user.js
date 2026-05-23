import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/requireAuth.js';
import { db, rowToUser } from '../services/db.js';
import { GED_TOPIC_SLUGS } from '../data/gedTopicGuides.js';

const router = Router();

function getUserRow(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

router.get('/me', requireAuth, (req, res) => {
  const row = getUserRow(req.user.sub);
  if (!row) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rowToUser(row) });
});

router.get('/stats', requireAuth, (req, res) => {
  const userId = req.user.sub;
  const sessions = db.prepare('SELECT topic, score, total, time_spent, created_at FROM practice_sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId);

  const totalCorrect = sessions.reduce((s, r) => s + r.score, 0);
  const totalQuestions = sessions.reduce((s, r) => s + r.total, 0);
  const totalTimeSec = sessions.reduce((s, r) => s + r.time_spent, 0);
  const overallScore = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Per topic breakdown
  const byTopic = {};
  for (const slug of GED_TOPIC_SLUGS) byTopic[slug] = { score: 0, total: 0, percent: 0, sessions: 0 };
  for (const s of sessions) {
    if (!byTopic[s.topic]) byTopic[s.topic] = { score: 0, total: 0, percent: 0, sessions: 0 };
    byTopic[s.topic].score += s.score;
    byTopic[s.topic].total += s.total;
    byTopic[s.topic].sessions += 1;
  }
  for (const k of Object.keys(byTopic)) {
    const t = byTopic[k];
    t.percent = t.total ? Math.round((t.score / t.total) * 100) : 0;
  }

  // Streak (consecutive days ending today)
  const dates = new Set(sessions.map(s => s.created_at.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) streak++;
    else if (i === 0) continue; // allow today to be missing
    else break;
  }

  res.json({
    overallScore,
    totalTimeMinutes: Math.round(totalTimeSec / 60),
    sessionsCompleted: sessions.length,
    streakDays: streak,
    byTopic
  });
});

router.get('/history', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);
  const rows = db.prepare(`SELECT id, topic, difficulty, score, total, time_spent, created_at
                           FROM practice_sessions WHERE user_id = ?
                           ORDER BY created_at DESC LIMIT ?`).all(req.user.sub, limit);
  res.json({
    sessions: rows.map(r => ({
      id: r.id,
      topic: r.topic,
      difficulty: r.difficulty,
      score: r.score,
      total: r.total,
      percent: r.total ? Math.round((r.score / r.total) * 100) : 0,
      timeSpent: r.time_spent,
      createdAt: r.created_at
    }))
  });
});

router.patch('/profile', requireAuth, (req, res) => {
  const { firstName, lastName, email } = req.body || {};
  const row = getUserRow(req.user.sub);
  if (!row) return res.status(404).json({ message: 'User not found.' });
  const newFirst = firstName?.trim() || row.first_name;
  const newLast = lastName?.trim() || row.last_name;
  let newEmail = row.email;
  if (email && email !== row.email) {
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: 'Invalid email.' });
    const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), row.id);
    if (dup) return res.status(409).json({ message: 'Email already in use.' });
    newEmail = email.toLowerCase().trim();
  }
  db.prepare(`UPDATE users SET first_name=?, last_name=?, email=?, updated_at=datetime('now') WHERE id=?`)
    .run(newFirst, newLast, newEmail, row.id);
  res.json({ user: rowToUser(getUserRow(row.id)) });
});

router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required.' });
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({ message: 'New password must be 8+ chars with letter and number.' });
  }
  const row = getUserRow(req.user.sub);
  if (!row) return res.status(404).json({ message: 'User not found.' });
  const ok = await bcrypt.compare(currentPassword, row.password_hash);
  if (!ok) return res.status(401).json({ message: 'Current password incorrect.' });
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare(`UPDATE users SET password_hash=?, updated_at=datetime('now') WHERE id=?`).run(hash, row.id);
  res.json({ ok: true });
});

router.patch('/preferences', requireAuth, (req, res) => {
  const { preferences } = req.body || {};
  if (!preferences || typeof preferences !== 'object') return res.status(400).json({ message: 'Invalid preferences.' });
  const row = getUserRow(req.user.sub);
  if (!row) return res.status(404).json({ message: 'User not found.' });
  const merged = { ...JSON.parse(row.preferences || '{}'), ...preferences };
  db.prepare(`UPDATE users SET preferences=?, updated_at=datetime('now') WHERE id=?`)
    .run(JSON.stringify(merged), row.id);
  res.json({ preferences: merged });
});

export default router;
