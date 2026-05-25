# GED Study Guide

A focused GED prep workspace with AI-generated practice grounded in the
official study guides. Covers all four GED subjects (Math, Social Studies,
English/RLA, Science), tracks per-difficulty mastery, recycles cached
questions to control AI spend, and ships a public marketing landing plus
an authenticated dashboard, practice session, study notes, history, and
account-settings flow.

## Quick start

```bash
cp .env.example .env
# Set GEMINI_API_KEY and/or ANTHROPIC_API_KEY for live AI.
# In production NODE_ENV=production also requires CORS_ORIGIN.
npm install
npm start          # prestart hook auto-builds /styles.css and /js/dist/*
```

Then open <http://localhost:3000>. The home page is now a public marketing
landing — sign up, sign in, or hit "Continue as Guest" to try a practice
session without an account.

## Stack

- **Frontend** — Vanilla HTML + ES modules + Tailwind built locally
  (no CDN). Light/dark theme switching is driven by CSS variables in
  [`public/js/theme.js`](public/js/theme.js); Tailwind tokens that
  resolve to those vars are defined in [`tailwind.config.cjs`](tailwind.config.cjs).
- **Backend** — Node 22 + Express in `server/`. The `--experimental-sqlite`
  flag is on — we use Node's built-in `node:sqlite`.
- **DB** — SQLite at `/data/ged_math.sqlite` in production (Railway Volume),
  `./server/data/ged_math.sqlite` locally. Schema + lightweight migrations
  in [`server/services/db.js`](server/services/db.js).
- **AI** — Dual-LLM orchestrator in [`server/services/ai.js`](server/services/ai.js):
  Gemini 2.5 Flash generates questions, Claude Sonnet 4.6 checks answers.
  Falls back to canned questions if both keys are missing, so the app is
  demoable with no env at all.
- **Math typesetting** — KaTeX rendered client-side over a custom
  `[m]...[/m]` / `[M]...[/M]` markup that's JSON-safe (no backslash
  escaping in the AI's response).
- **Email** — Resend HTTP API in `server/services/mailer.js`; in dev with
  no `RESEND_API_KEY` we surface the verification code in the response so
  you can verify without configuring SMTP.

## Subjects + topic guides

Subjects live in [`server/data/subjects.js`](server/data/subjects.js)
(currently `math`, `social-studies`, `english`, `science`). Each subject
has 5 topics in
[`server/data/gedTopicGuides.js`](server/data/gedTopicGuides.js), each
with a page-mapped concept index so Gemini can cite the right pages of
the official PDF, and pre-written sections in
[`server/data/staticNotes.js`](server/data/staticNotes.js) so
`/api/notes/:topic` returns instantly without an AI round-trip.

Adding a subject: drop a PDF in `server/data/studyGuides/`, add an entry
in `subjects.js`, define topics in `gedTopicGuides.js`, and add static
notes in `staticNotes.js`. The picker, dashboard analytics, Priority
Review, History, and Study Guide tabs all pick it up automatically.

## Question cache

Every successful AI generation is stored in `practice_questions` keyed by
`(subject, topic, difficulty, content_hash)`; `user_question_seen` tracks
which cached questions a given user has already received so we never
recycle the same one to the same person. On each request the recycle
probability is decided by the user's current mastery band:

| Band     | Threshold      | Recycle chance |
|----------|----------------|----------------|
| Red      | < 60%          | 40%            |
| Orange   | 60 – 79%       | 25%            |
| Green    | ≥ 80%          | 10%            |
| No data  | (first try)    | 10%            |

Cache miss falls through to a fresh AI generation so the user is never
blocked waiting on a recycled question that doesn't exist yet. Guest
sessions feed the pool but don't pull from it. See
[`server/services/questionCache.js`](server/services/questionCache.js).

## Security

- **CORS** — `CORS_ORIGIN` is required in `NODE_ENV=production` (comma
  separated list of allowed origins). The server refuses to boot
  otherwise to prevent accidental reflect-any defaults.
- **Helmet CSP** — allow-list of `'self'` plus fonts.googleapis.com,
  fonts.gstatic.com, cdn.jsdelivr.net (KaTeX), lh3.googleusercontent.com
  (homepage hero). `frame-ancestors 'none'` + `objectSrc 'none'` +
  `baseUri 'self'` + `formAction 'self'`. `'unsafe-inline'` is still on
  script/style-src — flagged for a future nonce-based refactor.
- **Refresh token** — lives in an `HttpOnly; SameSite=Strict; Secure`
  cookie scoped to `/api/auth`. JS can't read it; XSS can't exfiltrate
  it. Older sessions with a localStorage token continue to work via a
  body fallback until they log out, then the cookie path takes over.
- **Rate limiting** — `/api/auth/login` is keyed by IP + email
  (10/15min). `/api/auth/refresh` (60/15min), `/api/auth/register`,
  `/api/auth/verify-email`, `/api/auth/reset-password` (authLimiter,
  20/15min). `/api/auth/resend-verification`, `/api/auth/forgot-password`
  (resendLimiter, 3/hour).
- **Cache-Control** — PDFs, images, fonts → 1 year + immutable.
  CSS/JS → 1 hour (no content-hashed filenames yet).

## Routes

```
POST /api/auth/register             { firstName, lastName, email, password }
POST /api/auth/verify-email         { email, code }
POST /api/auth/resend-verification  { email }
POST /api/auth/forgot-password      { email }
POST /api/auth/reset-password       { token, password }
POST /api/auth/login                { email, password }              → sets HttpOnly refresh cookie
POST /api/auth/refresh                                                  reads cookie, returns new access token
POST /api/auth/logout                                                   clears cookie + revokes token
GET  /api/auth/mail-status                                              { configured: bool }

GET  /api/user/me                   (auth)
GET  /api/user/stats                (auth)   per-subject + per-topic + per-difficulty mastery + weakAttempts
GET  /api/user/history?limit=N      (auth)
GET  /api/user/catalog                       open — subjects + topics + intro
PATCH /api/user/profile             (auth)
PATCH /api/user/password            (auth)
PATCH /api/user/preferences         (auth)

POST /api/practice/generate         (auth)   uses the question cache; returns { question, fromCache? }
POST /api/practice/check            (auth)
POST /api/practice/save-session     (auth)
GET  /api/practice/session/:id      (auth)
POST /api/practice/generate-guest             rate-limited; feeds the cache but doesn't pull
POST /api/practice/check-guest                rate-limited

GET  /api/notes/:topic                       static, served instantly
POST /api/notes/upload              (auth)   multipart file=…; parses PDF via pdf-parse

GET  /api/health                             { status, ai }
```

## Frontend pages

```
/                                  public marketing landing
/login, /create_account            auth + verification flow
/forgot_password, /reset_password
/verify_email
/dashboard                         (auth) overall + per-subject stats, Priority Review, Quick Start, Detailed Progress
/study_notes                       (auth) static notes; Subject Catalog sidebar with priority badges
/study_guide                       (public) subject tabs over the official PDFs + Math formula sheet + non-calculator tips
/practice_session                  picker (subject → difficulty → topic) + 10-question runner with prefetch
/growth_history                    (auth) trend chart + Subject Mastery + filterable session list
/account_settings                  (auth)
/privacy, /terms
```

The sidebar is rendered by
[`public/js/layout.js`](public/js/layout.js) and includes a Home tab
linking back to the public landing. A global desktop top bar carries the
theme toggle, search, help (launches the guided tour), and the profile
chip (hover-expands to show name + email + account-settings link).

## Build pipeline

`npm start` triggers `prestart`, which runs:

1. `npm run build:css` — Tailwind compiles `src/input.css` (just the
   three `@tailwind` directives + the cog-loader CSS) against the
   content glob into `public/styles.css`.
2. `npm run build:js` — esbuild bundles `auth.js`, `layout.js`, and
   `math-format.js` into `public/js/dist/*.js`. HTML pages import the
   bundled paths.

The build tools (`tailwindcss`, `esbuild`, `autoprefixer`,
`@tailwindcss/forms`, `@tailwindcss/container-queries`) live in
`dependencies` (not `devDependencies`) so Railway installs them even
when `NODE_ENV=production`.

## Environment

| Var | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | for live AI | Used as the question generator. |
| `ANTHROPIC_API_KEY` | for live AI | Used as the answer checker. Either provider alone works as a fallback. |
| `RESEND_API_KEY` | for verification email | Without it, dev mode returns the verification code in the response. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | yes (in prod) | Defaulted in dev for convenience. |
| `CORS_ORIGIN` | yes (in prod) | Comma-separated allow-list. Server refuses to boot in production without it. |
| `PORT` | no | Default `3000`. |
| `DATABASE_FILE` | no | Defaults to `/data/ged_math.sqlite` if `/data` exists (Railway Volume), else `./server/data/ged_math.sqlite`. |
| `NODE_ENV` | recommended | `production` enables Secure cookies and the CORS check. |

## Tour

The Help button in the top bar launches a guided tour
([`public/js/site-tour.js`](public/js/site-tour.js)) that walks through
the sidebar, then each page (Dashboard, Study Notes, Study Guide,
Practice picker, History) with a "Skip section" button that jumps past
the current section without ending the whole tour.

## Recent changes — quick log

- **Subjects** expanded from Math + Social Studies to all four GED
  subjects (added English + Science with topic guides, static notes,
  hero tiles, and PDFs).
- **Public homepage** at `/` (Stitch-inspired marketing landing) +
  global "Home" sidebar item; dashboard remains gated.
- **Public Study Guides** — `/study_guide` is reachable without an
  account; guest header matches the homepage style.
- **Math typesetting** — KaTeX rendering with `[m]...[/m]` /
  `[M]...[/M]` delimiters (JSON-safe).
- **Formula Sheet** — toggled inline next to Hint / Show Answer on
  math sessions, opens a docked right-side panel with a native HTML/
  KaTeX rendering of the official sheet (PDF still available).
- **Static study notes** for every topic; eliminates the per-page AI
  call for `/api/notes/:topic`.
- **Question cache** — see "Question cache" above.
- **Priority Review** redesigned with red/orange/green bands and
  sort + filter pills (priority / difficulty / subject).
- **History** redesigned with Week/Month trend toggle, Subject Mastery
  card, and topic filter pills.
- **Difficulty locked** during an active session (read-only badge).
- **Security pass** — HttpOnly refresh cookie, CSP back on with an
  allow-list, frame-ancestors 'none', login + refresh limiters, CORS
  required in prod, Cache-Control headers.
- **Build pipeline** — Tailwind compiled locally (no CDN); JS bundled
  with esbuild.
- **Cog loader** — pure-CSS three-gear loader (in the GED palette)
  replaces the previous skeleton blocks during AI calls.

## Known limitations

- `'unsafe-inline'` is still on the CSP for `script-src` / `style-src`
  because the HTML pages have many inline `<script type="module">`
  blocks and inline event handlers. A nonce-based pass would close
  this.
- Bundles aren't content-hashed yet; CSS/JS use a 1-hour cache. A
  content-hash + 1-year cache is the next perf step.
