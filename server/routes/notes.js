import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { structureNotes } from '../services/ai.js';
import { TOPICS_BY_SUBJECT } from '../data/gedTopicGuides.js';
import { STATIC_NOTES } from '../data/staticNotes.js';
import { createRequire } from 'node:module';

// Find which subject owns a topic slug (slugs are unique across subjects).
function resolveSubject(slug) {
  for (const [subject, topics] of Object.entries(TOPICS_BY_SUBJECT)) {
    if (topics[slug]) return subject;
  }
  return null;
}

const router = Router();
const require = createRequire(import.meta.url);

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Only PDF, TXT, MD, DOC, and DOCX files are allowed.'));
    }
    cb(null, true);
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.sub || req.ip,
  message: { message: 'Upload limit reached. Try again in an hour.' }
});

router.get('/:topic', (req, res) => {
  const topic = req.params.topic;
  const subject = resolveSubject(topic);
  if (!subject) return res.status(404).json({ message: 'Topic not found.' });

  // Every topic has hand-written static notes now — no AI call needed at
  // serve time. The structureNotes() path is kept ONLY for /upload (user
  // uploads their own PDF/text), it's no longer reachable from this route.
  const staticNote = STATIC_NOTES[subject]?.[topic];
  if (staticNote) return res.json(staticNote);

  // Safety net: a topic that's registered in TOPICS_BY_SUBJECT but missing
  // from STATIC_NOTES still returns its scope, never a 500.
  const t = TOPICS_BY_SUBJECT[subject][topic];
  return res.json({
    title: t.name,
    sections: [{ heading: 'Topic Scope', content: t.scope.trim(), keyFormulas: [], tips: [] }]
  });
});

router.post('/upload', requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const { originalname, mimetype, buffer } = req.file;
  let text = '';
  try {
    if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      text = buffer.toString('utf-8');
    }
  } catch (err) {
    return res.status(400).json({ message: 'Could not read file.', detail: err.message });
  }

  if (!text.trim()) return res.status(400).json({ message: 'File contained no extractable text.' });

  try {
    const structured = await structureNotes(text);
    res.json(structured);
  } catch (err) {
    console.error('[notes/upload]', err);
    res.status(502).json({ message: 'Failed to process notes.', detail: err.message });
  }
});

export default router;
