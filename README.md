# GED Math Master

AI-powered GED Mathematical Reasoning practice app. Generates problems with Claude,
checks answers with step-by-step explanations, tracks progress over time.

## Quick start

```bash
cp .env.example .env
# optional: paste your Anthropic key into .env
npm install
npm start
```

Then open <http://localhost:3000> — you'll land on the login page. Create an
account and you're in.

## Stack

- **Frontend**: Vanilla HTML + Tailwind (CDN) + ES modules. 7 pages in `public/`.
- **Backend**: Node + Express in `server/`.
- **DB**: SQLite via `better-sqlite3` (single file, zero setup). Schema lives in
  `server/services/db.js` and is created on boot.
- **AI**: Anthropic Claude (`claude-3-5-sonnet-20241022`). Falls back to canned
  sample questions if `ANTHROPIC_API_KEY` is missing, so the whole flow is
  demoable without a key.

## Study guides

`server/data/studyGuides/` is the source of truth Claude uses to ground its
questions. Drop one file per topic slug — `algebra.pdf`, `geometry.txt`, etc. —
or a single shared `ged-math.pdf` (already included), which is used as the
fallback for every topic when no per-topic file is present.

Supported formats: `.pdf` (parsed with `pdf-parse`), `.txt`, `.md`, `.json`.

## Environment

| Var | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | for live AI | If unset, AI routes return mock data. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | yes (in prod) | Defaulted in dev for convenience. Set both for production. |
| `PORT` | no | Default `3000`. |
| `DATABASE_FILE` | no | Default `./server/data/ged_math.sqlite`. |

## Routes

```
POST /api/auth/register         { firstName, lastName, email, password }
POST /api/auth/login            { email, password }
POST /api/auth/refresh          { refreshToken }
POST /api/auth/logout

GET  /api/user/me               (auth)
GET  /api/user/stats            (auth)
GET  /api/user/history?limit=N  (auth)
PATCH /api/user/profile         (auth)
PATCH /api/user/password        (auth)
PATCH /api/user/preferences     (auth)

POST /api/practice/generate     (auth)
POST /api/practice/check        (auth)
POST /api/practice/save-session (auth)
GET  /api/practice/session/:id  (auth)

GET  /api/notes/:topic
POST /api/notes/upload          multipart file=...

GET  /api/health
```

## Notes on the spec

A few pragmatic deviations from the original Master Developer Prompt to keep
the app runnable locally with zero infra:

- **SQLite** instead of PostgreSQL. The schema is a 1:1 translation
  (UUID → TEXT, JSONB → TEXT). Swapping in `pg` later is straightforward.
- **Notes upload** is unauthenticated to match the original page UX (you can
  drop a file before signing in). Tighten by adding `requireAuth` to the
  router if needed.
- The "Help" link in the side nav is a placeholder (`href="#"`).
