import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { db, newId } from '../services/db.js';
import { generateQuestion, checkAnswer } from '../services/ai.js';
import { isValidSubject } from '../data/subjects.js';
import { getTopic } from '../data/gedTopicGuides.js';
import {
  pickRecycleProbability, pickCachedQuestion,
  rememberQuestion, markSeen
} from '../services/questionCache.js';

const router = Router();

function validateSubjectAndTopic(req, res) {
  const subject = req.body?.subject || 'math';
  const topic   = req.body?.topic;
  if (!isValidSubject(subject))      { res.status(400).json({ message: `Unknown subject: ${subject}` }); return null; }
  if (!topic || !getTopic(subject, topic)) { res.status(400).json({ message: `Unknown topic "${topic}" for subject "${subject}"` }); return null; }
  return { subject, topic };
}

// ---- Guest-mode router ----
export const guestPracticeRouter = Router();

// Per-IP cap on guest generations. 5 questions / hour is enough to feel the
// product but tight enough that "open incognito to bypass" doesn't trivially
// work (incognito reuses the same IP). VPN / hotspot users can still rotate,
// which is expected — the goal is friction-to-convert, not perfect lockout.
const guestGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Free preview limit reached. Create a free account to keep practicing.', gated: true }
});

// /check-guest is still rate-limited but more generously — it's the answer
// validator, called once per question, and shouldn't be the gating signal.
const guestCheckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Guest limit reached. Create a free account to keep practicing.' }
});

guestPracticeRouter.post('/generate-guest', guestGenerateLimiter, async (req, res) => {
  const v = validateSubjectAndTopic(req, res); if (!v) return;
  const { difficulty = 'medium', previousQuestions = [] } = req.body || {};
  try {
    const question = await generateQuestion({ ...v, difficulty, previousQuestions });
    // Guests have no user_id, so they only contribute to the pool — they
    // don't pull recycled questions and we don't mark anything seen.
    rememberQuestion({ ...v, difficulty, question });
    res.json({ question });
  } catch (err) {
    console.error('[practice/generate-guest]', err);
    res.status(502).json({ message: 'Failed to generate question.', detail: err.message });
  }
});

guestPracticeRouter.post('/check-guest', guestCheckLimiter, async (req, res) => {
  const {
    question, correctAnswer, userAnswer, subject = 'math', topic,
    explanation, steps, encouragement
  } = req.body || {};
  if (!question || correctAnswer === undefined || userAnswer === undefined) {
    return res.status(400).json({ message: 'Missing fields.' });
  }

  const norm = v => String(v ?? '').trim().toUpperCase();
  const isCorrect = norm(userAnswer) === norm(correctAnswer);

  if (explanation && Array.isArray(steps) && steps.length) {
    return res.json({
      isCorrect,
      explanation,
      steps,
      encouragement: encouragement || (isCorrect ? 'Nice work!' : 'Every miss is a step toward mastery.'),
      fromCache: true
    });
  }

  try {
    const result = await checkAnswer({ question, correctAnswer, userAnswer, subject, topic });
    res.json(result);
  } catch (err) {
    console.error('[practice/check-guest]', err);
    res.status(502).json({ message: 'Failed to check answer.', detail: err.message });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  const v = validateSubjectAndTopic(req, res); if (!v) return;
  const { difficulty = 'medium', previousQuestions = [] } = req.body || {};
  const userId = req.user?.sub;

  // Cache helpers are wrapped individually — a DB hiccup must NEVER block
  // the actual AI call. If any cache call throws, log it and continue.
  let prob = 0;
  try { prob = pickRecycleProbability(userId, v.subject, v.topic, difficulty); }
  catch (e) { console.warn('[practice/generate] pickRecycleProbability failed:', e.message); }

  if (Math.random() < prob) {
    try {
      const cached = pickCachedQuestion({ userId, ...v, difficulty });
      if (cached) {
        try { markSeen(userId, cached.id); } catch (e) { console.warn('[practice/generate] markSeen failed:', e.message); }
        return res.json({ question: cached.question, fromCache: true });
      }
    } catch (e) { console.warn('[practice/generate] pickCachedQuestion failed:', e.message); }
  }

  // Falls through to fresh generation if we don't recycle (or the cache miss).
  try {
    const question = await generateQuestion({ ...v, difficulty, previousQuestions });
    try {
      const id = rememberQuestion({ ...v, difficulty, question });
      if (id) markSeen(userId, id);
    } catch (e) { console.warn('[practice/generate] rememberQuestion failed:', e.message); }
    res.json({ question });
  } catch (err) {
    console.error('[practice/generate]', err);
    res.status(502).json({ message: 'Failed to generate question.', detail: err.message });
  }
});

router.post('/check', requireAuth, async (req, res) => {
  const {
    question, correctAnswer, userAnswer,
    subject = 'math', topic,
    // The question generator now emits a reader-facing explanation +
    // steps + encouragement up front. When the client echoes them back
    // we skip the Claude grading round-trip entirely and just compare
    // the user's letter to the cached answer — feedback feels instant.
    explanation, steps, encouragement
  } = req.body || {};
  if (!question || correctAnswer === undefined || userAnswer === undefined) {
    return res.status(400).json({ message: 'Missing fields.' });
  }

  const norm = v => String(v ?? '').trim().toUpperCase();
  const isCorrect = norm(userAnswer) === norm(correctAnswer);

  if (explanation && Array.isArray(steps) && steps.length) {
    return res.json({
      isCorrect,
      explanation,
      steps,
      encouragement: encouragement || (isCorrect ? 'Nice work — keep that momentum going.' : 'Every miss is a step toward mastery.'),
      fromCache: true
    });
  }

  // Legacy path: old clients (or sessions issued before this rollout)
  // didn't send the pre-generated explanation. Fall back to Claude.
  try {
    const result = await checkAnswer({ question, correctAnswer, userAnswer, subject, topic });
    res.json(result);
  } catch (err) {
    console.error('[practice/check]', err);
    res.status(502).json({ message: 'Failed to check answer.', detail: err.message });
  }
});

router.post('/save-session', requireAuth, (req, res) => {
  const subject = req.body?.subject || 'math';
  const v = validateSubjectAndTopic(req, res); if (!v) return;
  const { difficulty, score, total, timeSpent, questions } = req.body || {};
  if (typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ message: 'Invalid score/total.' });
  }
  const id = newId();
  db.prepare(`INSERT INTO practice_sessions
              (id, user_id, subject, topic, difficulty, score, total, time_spent, questions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.sub, subject, v.topic, difficulty || 'medium', score, total, Math.max(0, timeSpent | 0), JSON.stringify(questions || []));
  res.json({ id });
});

router.get('/session/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.sub);
  if (!row) return res.status(404).json({ message: 'Session not found.' });
  res.json({
    id: row.id,
    subject: row.subject || 'math',
    topic: row.topic,
    difficulty: row.difficulty,
    score: row.score,
    total: row.total,
    timeSpent: row.time_spent,
    questions: JSON.parse(row.questions || '[]'),
    createdAt: row.created_at
  });
});

export default router;
