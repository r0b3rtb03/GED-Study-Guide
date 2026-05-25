import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { randomInt, randomBytes } from 'node:crypto';
import { db, newId, rowToUser } from '../services/db.js';
import { sendVerificationEmail, sendPasswordResetEmail, isMailerConfigured } from '../services/mailer.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' }
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many resend attempts. Try again in an hour.' }
});

// Refresh-token endpoint gets its own (generous) limiter — a compromised
// refresh token shouldn't be usable to spin out hundreds of access tokens
// per minute, but legitimate clients legitimately hit /refresh every time
// the access token ages out. 60 per 15 min is comfortable headroom.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many refresh attempts. Try again in a few minutes.' }
});

// Login limiter is additionally keyed by email so an attacker can't burn
// the IP quota across many victims — or many attackers behind a shared NAT
// can't lock each other out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${(req.body?.email || '').toLowerCase().trim()}`,
  message: { message: 'Too many login attempts. Try again in a few minutes.' }
});

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFY_EXPIRES_MS  = 15 * 60 * 1000;
const RESET_EXPIRES_MS   = 30 * 60 * 1000;

function signTokens(user) {
  const payload = { sub: user.id, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  // jti makes each refresh token unique even when issued in the same second.
  const refreshToken = jwt.sign({ ...payload, jti: newId() }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

function storeRefresh(userId, token) {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS).toISOString();
  db.prepare('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .run(newId(), userId, token, expiresAt);
}

// HttpOnly refresh-token cookie. Inaccessible to JS so XSS can't exfiltrate
// it. SameSite=Strict prevents CSRF on /refresh. Secure in production only
// (cookies over http get dropped silently with Secure=true on localhost).
const REFRESH_COOKIE = 'ged_refresh';
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   REFRESH_EXPIRES_MS,
    path:     '/api/auth' // only sent to auth endpoints
  });
}
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}
// Read the refresh token from the cookie OR the JSON body (legacy fallback
// while older sessions still keep one in localStorage). Cookie wins.
function readRefreshToken(req) {
  return req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken || null;
}

function generateVerificationCode() {
  return String(randomInt(100000, 1000000)); // 100000..999999
}

function isEmail(v) { return /\S+@\S+\.\S+/.test(v || ''); }
function isStrongPassword(p) {
  return typeof p === 'string' && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
}

router.post('/register', authLimiter, async (req, res) => {
  const { firstName, lastName, email, password } = req.body || {};
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!isEmail(email)) return res.status(400).json({ message: 'Invalid email address.' });
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const hash = await bcrypt.hash(password, 12);
  const id = newId();
  const code = generateVerificationCode();
  const codeExpires = new Date(Date.now() + VERIFY_EXPIRES_MS).toISOString();

  db.prepare(`INSERT INTO users
              (id, first_name, last_name, email, password_hash, email_verified, verification_code, verification_expires)
              VALUES (?, ?, ?, ?, ?, 0, ?, ?)`)
    .run(id, firstName.trim(), lastName.trim(), normalizedEmail, hash, code, codeExpires);

  try {
    const sent = await sendVerificationEmail(normalizedEmail, firstName.trim(), code);
    res.status(201).json({
      message: 'Account created. Please check your email for your verification code.',
      email: normalizedEmail,
      devCode: sent.devFallback ? code : undefined // exposed only when SMTP isn't configured (dev only)
    });
  } catch (err) {
    console.error('[auth/register] mailer failed:', err);
    // Still return success so user can use resend; surface a warning
    res.status(201).json({
      message: 'Account created, but we could not send the verification email. Use "Resend code" on the verify page.',
      email: normalizedEmail
    });
  }
});

router.post('/verify-email', authLimiter, async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required.' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!row) return res.status(404).json({ message: 'Account not found.' });
  if (row.email_verified) return res.status(400).json({ message: 'Email already verified. Please sign in.' });
  if (!row.verification_code || !row.verification_expires) {
    return res.status(400).json({ message: 'No verification code on file. Request a new one.' });
  }
  if (new Date(row.verification_expires).getTime() < Date.now()) {
    return res.status(410).json({ message: 'Code expired. Request a new one.' });
  }
  if (String(row.verification_code) !== String(code).trim()) {
    return res.status(400).json({ message: 'Invalid code. Please try again.' });
  }

  db.prepare(`UPDATE users
              SET email_verified=1, verification_code=NULL, verification_expires=NULL, updated_at=datetime('now')
              WHERE id=?`).run(row.id);

  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
  const user = rowToUser(fresh);
  const { accessToken, refreshToken } = signTokens(user);
  storeRefresh(user.id, refreshToken);

  res.json({ accessToken, refreshToken, user });
});

router.post('/resend-verification', resendLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email required.' });

  const row = db.prepare('SELECT id, first_name, email, email_verified FROM users WHERE email = ?')
    .get(String(email).toLowerCase().trim());
  if (!row) return res.status(404).json({ message: 'Account not found.' });
  if (row.email_verified) return res.status(400).json({ message: 'Email already verified.' });

  const code = generateVerificationCode();
  const expires = new Date(Date.now() + VERIFY_EXPIRES_MS).toISOString();
  db.prepare(`UPDATE users SET verification_code=?, verification_expires=?, updated_at=datetime('now') WHERE id=?`)
    .run(code, expires, row.id);

  try {
    const sent = await sendVerificationEmail(row.email, row.first_name, code);
    res.json({
      message: 'A new verification code has been sent to your email.',
      devCode: sent.devFallback ? code : undefined
    });
  } catch (err) {
    console.error('[auth/resend] mailer failed:', err);
    res.status(502).json({ message: 'Could not send email. Try again shortly.' });
  }
});

// ---- Password reset ----

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL
      || process.env.CORS_ORIGIN
      || `${req.protocol}://${req.get('host')}`;
}

router.post('/forgot-password', resendLimiter, async (req, res) => {
  const { email } = req.body || {};
  // Always respond the same way so we don't leak which emails are registered.
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };
  if (!email || !isEmail(email)) return res.json(genericResponse);

  const row = db.prepare('SELECT id, first_name, email FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!row) return res.json(genericResponse);

  // Invalidate any prior unused tokens for this user so only the newest works.
  db.prepare(`UPDATE password_reset_tokens SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL`).run(row.id);

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + RESET_EXPIRES_MS).toISOString();
  db.prepare('INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .run(newId(), row.id, token, expires);

  const resetUrl = `${publicBaseUrl(req)}/reset_password?token=${encodeURIComponent(token)}`;

  try {
    const sent = await sendPasswordResetEmail(row.email, row.first_name, resetUrl);
    if (sent.devFallback) return res.json({ ...genericResponse, devResetUrl: resetUrl });
    res.json(genericResponse);
  } catch (err) {
    console.error('[auth/forgot-password] mailer failed:', err);
    // Still surface a generic message — don't reveal whether the address exists.
    res.json(genericResponse);
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required.' });
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number.' });
  }

  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token);
  if (!row)       return res.status(400).json({ message: 'Invalid or expired reset link.' });
  if (row.used_at) return res.status(400).json({ message: 'This reset link has already been used.' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ message: 'Reset link expired. Request a new one.' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, row.user_id);
  db.prepare(`UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?`).run(row.id);
  // Revoke all existing refresh tokens so any device using the old password is signed out.
  db.prepare(`DELETE FROM refresh_tokens WHERE user_id = ?`).run(row.user_id);

  res.json({ message: 'Password updated. Please sign in with your new password.' });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!row) return res.status(401).json({ message: 'Invalid email or password.' });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

  if (!row.email_verified) {
    return res.status(403).json({
      message: 'Please verify your email address before signing in.',
      unverified: true,
      email: row.email
    });
  }

  const user = rowToUser(row);
  const { accessToken, refreshToken } = signTokens(user);
  storeRefresh(user.id, refreshToken);
  setRefreshCookie(res, refreshToken);

  // refreshToken is intentionally NOT returned in the body anymore — it
  // lives in an HttpOnly cookie. Older clients that still expect it in
  // the response continue to work because they ignore unknown fields.
  res.json({ accessToken, user });
});

router.post('/refresh', refreshLimiter, (req, res) => {
  const refreshToken = readRefreshToken(req);
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token.' });

  const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken);
  if (!stored) { clearRefreshCookie(res); return res.status(401).json({ message: 'Refresh token revoked.' }); }
  if (new Date(stored.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh token expired.' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }

  const accessToken = jwt.sign({ sub: payload.sub, email: payload.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  res.json({ accessToken });
});

router.post('/logout', (req, res) => {
  const refreshToken = readRefreshToken(req);
  if (refreshToken) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  clearRefreshCookie(res);
  res.json({ ok: true });
});

// Surface mailer config status (useful for /verify_email.html UX)
router.get('/mail-status', (req, res) => {
  res.json({ configured: isMailerConfigured() });
});

export default router;
