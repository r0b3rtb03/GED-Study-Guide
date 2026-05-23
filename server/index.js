import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllStudyGuides } from './services/studyGuideLoader.js';
import { isAiEnabled } from './services/claude.js';
import authRoutes from './routes/auth.js';
import practiceRoutes, { guestPracticeRouter } from './routes/practice.js';
import userRoutes from './routes/user.js';
import notesRoutes from './routes/notes.js';

if (!process.env.JWT_SECRET) {
  console.warn('[boot] JWT_SECRET not set — using insecure default. Set it in .env for production.');
  process.env.JWT_SECRET = 'dev-only-jwt-secret-change-me-1234567890';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'dev-only-refresh-secret-change-me-0987654321';
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const app = express();
app.set('trust proxy', 1); // for Railway / proxy-aware rate limiting

// Helmet — CSP relaxed because we use Tailwind/Material CDNs and inline scripts.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/practice', guestPracticeRouter);   // /generate-guest
app.use('/api/user', userRoutes);
app.use('/api/notes', notesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ai: isAiEnabled() });
});

// Canonical clean URLs: /foo.html → /foo (301)
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.endsWith('.html')) {
    const clean = req.path.slice(0, -5) || '/';
    const qs = req.url.slice(req.path.length);
    return res.redirect(301, (clean === '/index' ? '/' : clean) + qs);
  }
  next();
});

// Serve /foo.html when the URL is /foo (no extension needed in links)
app.use(express.static(publicDir, { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Multer / generic error handler (must come AFTER routes)
app.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 5MB.' });
  }
  if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Invalid upload.' });
  }
  if (err?.message) return res.status(400).json({ message: err.message });
  console.error('[error]', err);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = process.env.PORT || 3000;

(async () => {
  await loadAllStudyGuides();
  app.listen(port, () => {
    console.log(`\nGED Math Master running on http://localhost:${port}`);
    console.log(`  Anthropic key: ${isAiEnabled() ? 'present (AI on)' : 'missing (mock mode)'}`);
  });
})();
