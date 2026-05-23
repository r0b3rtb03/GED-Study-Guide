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

  // Difficulty weights. Mastery of hard questions counts more toward a
  // topic's overall percent than easy questions, so getting 10/10 easy
  // doesn't read as "100% on this topic" the way it used to.
  const WEIGHT = { easy: 1, medium: 2, hard: 3 };
  const w = d => WEIGHT[d] || 2;

  const totalCorrect = sessions.reduce((s, r) => s + r.score, 0);
  const totalQuestions = sessions.reduce((s, r) => s + r.total, 0);
  const totalTimeSec = sessions.reduce((s, r) => s + r.time_spent, 0);
  // Overall is also weighted now.
  let overallWeightedScore = 0, overallWeightedTotal = 0;
  for (const s of sessions) {
    overallWeightedScore += s.score * w(s.difficulty);
    overallWeightedTotal += s.total * w(s.difficulty);
  }
  const overallScore = overallWeightedTotal
    ? Math.round((overallWeightedScore / overallWeightedTotal) * 100)
    : 0;

  // Per-subject → per-topic breakdown. Each topic tracks BOTH raw
  // score/total and a weighted score/total + per-difficulty buckets.
  function freshTopicBucket(name) {
    return {
      name,
      score: 0, total: 0,
      weightedScore: 0, weightedTotal: 0,
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
      weightedScore: 0, weightedTotal: 0,
      percent: 0, sessions: 0, timeSec: 0,
      topics
    };
  }
  for (const s of sessions) {
    const subj = s.subject || 'math';
    if (!bySubject[subj]) {
      bySubject[subj] = { slug: subj, name: subj, topics: {}, score: 0, total: 0, weightedScore: 0, weightedTotal: 0, percent: 0, sessions: 0, timeSec: 0 };
    }
    const wt = w(s.difficulty);
    bySubject[subj].score          += s.score;
    bySubject[subj].total          += s.total;
    bySubject[subj].weightedScore  += s.score * wt;
    bySubject[subj].weightedTotal  += s.total * wt;
    bySubject[subj].sessions       += 1;
    bySubject[subj].timeSec        += s.time_spent;

    const t = bySubject[subj].topics[s.topic] || freshTopicBucket(s.topic);
    t.score         += s.score;
    t.total         += s.total;
    t.weightedScore += s.score * wt;
    t.weightedTotal += s.total * wt;
    t.sessions      += 1;
    const d = s.difficulty in t.byDifficulty ? s.difficulty : 'medium';
    t.byDifficulty[d].score += s.score;
    t.byDifficulty[d].total += s.total;
    bySubject[subj].topics[s.topic] = t;
  }
  // Compute weighted percents.
  for (const sub of Object.values(bySubject)) {
    sub.percent = sub.weightedTotal ? Math.round((sub.weightedScore / sub.weightedTotal) * 100) : 0;
    for (const t of Object.values(sub.topics)) {
      t.percent = t.weightedTotal ? Math.round((t.weightedScore / t.weightedTotal) * 100) : 0;
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

  // Recommended Review across all subjects: ≥3 attempts AND <70% accuracy.
  const weakTopics = [];
  for (const sub of Object.values(bySubject)) {
    for (const [slug, t] of Object.entries(sub.topics)) {
      if (t.total < 3 || t.percent >= 70) continue;
      const guide = getTopic(sub.slug, slug) || {};
      const [first, last] = guide.pageRange || [null, null];
      const subjMeta = SUBJECTS[sub.slug];
      weakTopics.push({
        subject: sub.slug,
        subjectName: sub.name,
        slug,
        name: guide.name || slug,
        percent: t.percent,
        attempts: t.total,
        sectionName: guide.sectionName || '',
        pageRange: guide.pageRange || null,
        pdfHref: first && subjMeta ? `${subjMeta.pdfPath}#page=${first}` : (subjMeta?.pdfPath || '/study-guide.pdf'),
        recommendation: first
          ? `You're struggling with ${guide.name} (${sub.name}). We recommend reviewing pages ${first}–${last} in the ${sub.name} Study Guide.`
          : `You're struggling with ${guide.name} (${sub.name}). Review it in the Study Guide.`
      });
    }
  }
  weakTopics.sort((a, b) => a.percent - b.percent);

  res.json({
    overallScore,
    totalTimeMinutes: Math.round(totalTimeSec / 60),
    sessionsCompleted: sessions.length,
    streakDays: streak,
    bySubject,
    byTopic,                       // legacy
    weakTopics: weakTopics.slice(0, 3)
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
