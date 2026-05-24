import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/requireAuth.js';
import { db, rowToUser } from '../services/db.js';
import { TOPICS_BY_SUBJECT, getTopic } from '../data/gedTopicGuides.js';
import { SUBJECTS, SUBJECT_SLUGS } from '../data/subjects.js';

const router = Router();

function getUserRow(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// Public catalog of subjects + their topics for the frontend pickers.
// Open (no auth) so the guest practice flow can use it.
router.get('/catalog', (req, res) => {
  const subjects = Object.values(SUBJECTS).map(s => ({
    slug: s.slug,
    name: s.name,
    fullName: s.fullName,
    icon: s.icon,
    pdfPath: s.pdfPath,
    description: s.description,
    intro: s.intro || null,
    topics: Object.entries(TOPICS_BY_SUBJECT[s.slug] || {}).map(([slug, t]) => ({
      slug,
      name: t.name,
      sectionName: t.sectionName,
      pageRange: t.pageRange,
      firstPage: t.pageRange?.[0] || 1
    }))
  }));
  res.json({ subjects });
});

router.get('/me', requireAuth, (req, res) => {
  const row = getUserRow(req.user.sub);
  if (!row) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rowToUser(row) });
});

router.get('/stats', requireAuth, (req, res) => {
  const userId = req.user.sub;
  const sessions = db.prepare(
    'SELECT subject, topic, difficulty, score, total, time_spent, created_at FROM practice_sessions WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);

  // Coverage-based scoring. Every topic is treated as having 30 questions
  // available (10 per difficulty). A topic's percent = score / 30, so
  // mastery requires completing all three difficulty levels:
  //   - 3/10 Easy + 0/0 Medium + 0/0 Hard  →  3/30 = 10%
  //   - 10/10 Easy only                     →  10/30 = 33%
  //   - 10/10 across all difficulties       →  30/30 = 100%
  // This naturally penalizes uneven coverage without arbitrarily weighting.
  const QUESTIONS_PER_DIFFICULTY = 10;
  const DIFFICULTIES = ['easy', 'medium', 'hard'];
  const TOPIC_MAX = QUESTIONS_PER_DIFFICULTY * DIFFICULTIES.length; // 30

  const totalCorrect = sessions.reduce((s, r) => s + r.score, 0);
  const totalTimeSec = sessions.reduce((s, r) => s + r.time_spent, 0);

  // Per-subject → per-topic breakdown. Each topic tracks BOTH raw
  // score/total and a weighted score/total + per-difficulty buckets.
  function freshTopicBucket(name) {
    return {
      name,
      score: 0, total: 0,
      maxPossible: TOPIC_MAX,   // 30 — fixed ceiling so coverage matters
      percent: 0, sessions: 0,
      byDifficulty: {
        easy:   { score: 0, total: 0, percent: 0 },
        medium: { score: 0, total: 0, percent: 0 },
        hard:   { score: 0, total: 0, percent: 0 }
      }
    };
  }
  const bySubject = {};
  for (const sub of SUBJECT_SLUGS) {
    const topics = {};
    for (const slug of Object.keys(TOPICS_BY_SUBJECT[sub] || {})) {
      topics[slug] = freshTopicBucket(TOPICS_BY_SUBJECT[sub][slug].name);
    }
    bySubject[sub] = {
      slug: sub,
      name: SUBJECTS[sub].name,
      pdfPath: SUBJECTS[sub].pdfPath,
      icon: SUBJECTS[sub].icon,
      score: 0, total: 0,
      maxPossible: TOPIC_MAX * Object.keys(topics).length,
      percent: 0, sessions: 0, timeSec: 0,
      topics
    };
  }
  for (const s of sessions) {
    const subj = s.subject || 'math';
    if (!bySubject[subj]) {
      bySubject[subj] = { slug: subj, name: subj, topics: {}, score: 0, total: 0, maxPossible: 0, percent: 0, sessions: 0, timeSec: 0 };
    }
    bySubject[subj].score    += s.score;
    bySubject[subj].total    += s.total;
    bySubject[subj].sessions += 1;
    bySubject[subj].timeSec  += s.time_spent;

    const t = bySubject[subj].topics[s.topic] || freshTopicBucket(s.topic);
    t.score    += s.score;
    t.total    += s.total;
    t.sessions += 1;
    const d = s.difficulty in t.byDifficulty ? s.difficulty : 'medium';
    t.byDifficulty[d].score += s.score;
    t.byDifficulty[d].total += s.total;
    bySubject[subj].topics[s.topic] = t;
  }
  // Compute coverage percents — score / 30 per topic, summed for subject.
  for (const sub of Object.values(bySubject)) {
    sub.percent = sub.maxPossible
      ? Math.round((sub.score / sub.maxPossible) * 100)
      : 0;
    for (const t of Object.values(sub.topics)) {
      t.percent = Math.round((t.score / TOPIC_MAX) * 100);
      for (const d of Object.values(t.byDifficulty)) {
        d.percent = d.total ? Math.round((d.score / d.total) * 100) : 0;
      }
    }
  }

  // Legacy flat byTopic (math only) — kept so older dashboard code still works.
  const byTopic = {};
  for (const [slug, t] of Object.entries(bySubject['math']?.topics || {})) byTopic[slug] = t;

  // Streak (consecutive days ending today)
  const dates = new Set(sessions.map(s => s.created_at.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) streak++;
    else if (i === 0) continue;
    else break;
  }

  // Priority Review — per-(topic × difficulty) weak attempts.
  // Old logic flagged whole topics by coverage %, which surfaced "10/10
  // Easy" topics as weak (because 10/30 = 33%). New logic looks at each
  // difficulty INDEPENDENTLY: if you actually attempted that level AND
  // scored under 70%, surface it. So 10/10 easy never gets flagged, but
  // 3/10 easy does. Sort worst-first, cap at 4.
  const WEAK_THRESHOLD = 70;
  const weakAttempts = [];
  for (const sub of Object.values(bySubject)) {
    for (const [slug, t] of Object.entries(sub.topics)) {
      const guide = getTopic(sub.slug, slug) || {};
      const [first, last] = guide.pageRange || [null, null];
      const subjMeta = SUBJECTS[sub.slug];
      const pdfHref = first && subjMeta ? `${subjMeta.pdfPath}#page=${first}` : (subjMeta?.pdfPath || '/study-guide.pdf');
      for (const [diff, d] of Object.entries(t.byDifficulty)) {
        if (d.total < 1) continue;                  // skip unattempted
        if (d.percent >= WEAK_THRESHOLD) continue;  // skip strong
        weakAttempts.push({
          subject:     sub.slug,
          subjectName: sub.name,
          slug,
          name:        guide.name || slug,
          difficulty:  diff,
          score:       d.score,
          total:       d.total,
          percent:     d.percent,
          pageRange:   guide.pageRange || null,
          pdfHref,
          recommendation: first
            ? `You scored ${d.score}/${d.total} on ${diff}. Review pages ${first}–${last} and try again.`
            : `You scored ${d.score}/${d.total} on ${diff}. Review the Study Guide and try again.`
        });
      }
    }
  }
  weakAttempts.sort((a, b) => a.percent - b.percent);

  // Legacy alias so any older callers using `weakTopics` still work.
  const weakTopics = weakAttempts;

  // Overall = total correct across all subjects / total possible (subjects × topics × 30)
  const overallMax = Object.values(bySubject).reduce((s, sub) => s + (sub.maxPossible || 0), 0);
  const overallScore = overallMax ? Math.round((totalCorrect / overallMax) * 100) : 0;

  res.json({
    overallScore,
    totalTimeMinutes: Math.round(totalTimeSec / 60),
    sessionsCompleted: sessions.length,
    streakDays: streak,
    bySubject,
    byTopic,                       // legacy
    weakAttempts: weakAttempts.slice(0, 4),
    weakTopics:   weakTopics.slice(0, 4)   // legacy alias
  });
});

router.get('/history', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);
  const rows = db.prepare(`SELECT id, subject, topic, difficulty, score, total, time_spent, created_at
                           FROM practice_sessions WHERE user_id = ?
                           ORDER BY created_at DESC LIMIT ?`).all(req.user.sub, limit);
  res.json({
    sessions: rows.map(r => ({
      id: r.id,
      subject: r.subject || 'math',
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
