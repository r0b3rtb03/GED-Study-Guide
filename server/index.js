import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllStudyGuides } from './services/studyGuideLoader.js';
import { isAiEnabled } from './services/ai.js';
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

// Helmet
// - CSP allow-list: own origin for scripts/styles/images, plus the KaTeX
//   CDN and Google Fonts. 'unsafe-inline' is still on script/style-src
//   because the HTML pages contain a lot of inline <script type="module">
//   blocks and inline event handlers; replacing all of those with nonces
//   is a separate refactor. The CSP still meaningfully restricts WHERE
//   scripts/styles can come from.
// - frame-ancestors 'none' is the modern X-Frame-Options.
// - crossOriginEmbedderPolicy off so the PDFs/iframes embed cleanly.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc:      ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      fontSrc:       ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
      imgSrc:        ["'self'", 'data:', 'https://lh3.googleusercontent.com'],
      connectSrc:    ["'self'"],
      frameSrc:      ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc:     ["'none'"],
      baseUri:       ["'self'"],
      formAction:    ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' }
}));

// CORS: require an explicit allow-list in production. Falling back to
// `origin: true` (reflect any caller) defeats the purpose of CORS, so we
// refuse to boot if CORS_ORIGIN isn't set in NODE_ENV=production.
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
  console.error('[security] CORS_ORIGIN must be set in production (comma-separated list of allowed origins).');
  process.exit(1);
}
app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
  credentials: true
}));

// Cookie parser is needed so /api/auth/refresh can read the HttpOnly cookie.
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

// Cache-Control middleware: long cache for fingerprint-able-by-deploy
// static assets (PDFs, logo, favicon). HTML stays uncached because it
// holds references to other assets and we want deploys to ship instantly.
app.use((req, res, next) => {
  if (/\.(pdf|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.endsWith('.css') || req.path.endsWith('.js')) {
    // Until we add content hashes to filenames, cache CSS/JS for an hour.
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

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
    console.log(`\nGED Study Guide running on http://localhost:${port}`);
    console.log(`  Anthropic key: ${isAiEnabled() ? 'present (AI on)' : 'missing (mock mode)'}`);
  });
})();
