// Shared frontend auth + API helper. Imported as <script type="module">.
//
// Refresh token lives in an HttpOnly, SameSite=Strict cookie set by the
// server — JS can't read or send it, so XSS can't exfiltrate it. We just
// have to remember to send `credentials: 'include'` on any /api/auth call
// that needs it (login, refresh, logout). Everything else continues to use
// the Authorization: Bearer <access> header.

const TOKEN_KEY = 'ged_access_token';
const USER_KEY  = 'ged_user';
// Legacy: we used to keep the refresh token in localStorage. Old sessions
// may still have one — we clear it on the next logout/expiry below so
// nothing reads from it after this rollout.
const LEGACY_REFRESH_KEY = 'ged_refresh_token';

export function getAccessToken() { return localStorage.getItem(TOKEN_KEY); }
export function isGuest() { return sessionStorage.getItem('ged_guest') === 'true'; }
export function clearGuest() { sessionStorage.removeItem('ged_guest'); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
export function setSession({ accessToken, user }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Wipe the legacy refresh token if a login still produces one in storage.
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}
export function logout({ expired = false } = {}) {
  // Server clears the cookie + revokes the refresh token row. We don't
  // need to send anything in the body — the cookie travels automatically.
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  }).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
  window.location.href = expired ? '/login?expired=1' : '/login';
}

export function requireLogin() {
  if (isGuest() && !getAccessToken()) {
    window.location.href = '/index';
    return false;
  }
  if (!getAccessToken()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

async function rawFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

// Sentinel — returning a never-settling promise on session expiry stops
// callers from running catch blocks that render half-broken UI before
// window.location.href = '/login' kicks them off the page.
const NEVER = new Promise(() => {});

export async function apiFetch(url, options = {}) {
  let res = await rawFetch(url, options);
  if (res.status !== 401) return res;

  // 401 → try to refresh. The HttpOnly cookie travels with this request;
  // we don't need to send anything in the body.
  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  if (!refreshRes.ok) { logout({ expired: true }); return NEVER; }

  const { accessToken } = await refreshRes.json();
  localStorage.setItem(TOKEN_KEY, accessToken);
  const retry = await rawFetch(url, options);
  if (retry.status === 401) { logout({ expired: true }); return NEVER; }
  return retry;
}

export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}
