import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { db, newId } from '../services/db.js';
import { generateQuestion, checkAnswer } from '../services/ai.js';
import { GED_TOPIC_GUIDES } from '../data/gedTopicGuides.js';

const router = Router();

// ---- Guest-mode router ----
export const guestPracticeRouter = Router();

const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20, // 20 generations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Guest limit reached. Create a free account to keep practicing.' }
});

guestPracticeRouter.post('/generate-guest', guestLimiter, async (req, res) => {
  const { topic, difficulty = 'medium', previousQuestions = [] } = req.body || {};
  if (!GED_TOPIC_GUIDES[topic]) return res.status(400).json({ message: 'Unknown topic.' });
  try {
    const question = await generateQuestion({ topic, difficulty, previousQuestions });
    res.json({ question });
  } catch (err) {
    console.error('[practice/generate-guest]', err);
    res.status(502).json({ message: 'Failed to generate question.', detail: err.message });
  }
});

guestPracticeRouter.post('/check-guest', guestLimiter, async (req, res) => {
  const { question, correctAnswer, userAnswer, topic } = req.body || {};
  if (!question || correctAnswer === undefined || userAnswer === undefined) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  try {
    const result = await checkAnswer({ question, correctAnswer, userAnswer, topic });
    res.json(result);
  } catch (err) {
    console.error('[practice/check-guest]', err);
    res.status(502).json({ message: 'Failed to check answer.', detail: err.message });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  const { topic, difficulty = 'medium', previousQuestions = [] } = req.body || {};
  if (!GED_TOPIC_GUIDES[topic]) return res.status(400).json({ message: 'Unknown topic.' });
  try {
    const question = await generateQuestion({ topic, difficulty, previousQuestions });
    res.json({ question });
  } catch (err) {
    console.error('[practice/generate]', err);
    res.status(502).json({ message: 'Failed to generate question.', detail: err.message });
  }
});

router.post('/check', requireAuth, async (req, res) => {
  const { question, correctAnswer, userAnswer, topic } = req.body || {};
  if (!question || correctAnswer === undefined || userAnswer === undefined) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  try {
    const result = await checkAnswer({ question, correctAnswer, userAnswer, topic });
    res.json(result);
  } catch (err) {
    console.error('[practice/check]', err);
    res.status(502).json({ message: 'Failed to check answer.', detail: err.message });
  }
});

router.post('/save-session', requireAuth, (req, res) => {
  const { topic, difficulty, score, total, timeSpent, questions } = req.body || {};
  if (!GED_TOPIC_GUIDES[topic]) return res.status(400).json({ message: 'Unknown topic.' });
  if (typeof score !== 'number' || typeof total !== 'number') {
    return res.status(400).json({ message: 'Invalid score/total.' });
  }
  const id = newId();
  db.prepare(`INSERT INTO practice_sessions
              (id, user_id, topic, difficulty, score, total, time_spent, questions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.sub, topic, difficulty || 'medium', score, total, Math.max(0, timeSpent | 0), JSON.stringify(questions || []));
  res.json({ id });
});

router.get('/session/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM practice_sessions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.sub);
  if (!row) return res.status(404).json({ message: 'Session not found.' });
  res.json({
    id: row.id,
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
