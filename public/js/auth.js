// Shared frontend auth + API helper. Imported as <script type="module">.

const TOKEN_KEY = 'ged_access_token';
const REFRESH_KEY = 'ged_refresh_token';
const USER_KEY = 'ged_user';

export function getAccessToken() { return localStorage.getItem(TOKEN_KEY); }
export function isGuest() { return sessionStorage.getItem('ged_guest') === 'true'; }
export function clearGuest() { sessionStorage.removeItem('ged_guest'); }
export function getRefreshToken() { return localStorage.getItem(REFRESH_KEY); }
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}
export function setSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function logout({ expired = false } = {}) {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    }).catch(() => {});
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = expired ? '/login?expired=1' : '/login';
}

export function requireLogin() {
  // Guests are not allowed on authenticated pages — push them back to landing.
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

  const refreshToken = getRefreshToken();
  if (!refreshToken) { logout({ expired: true }); return NEVER; }

  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  if (!refreshRes.ok) { logout({ expired: true }); return NEVER; }

  const { accessToken } = await refreshRes.json();
  localStorage.setItem(TOKEN_KEY, accessToken);
  // Retry the original request once with the fresh token.
  const retry = await rawFetch(url, options);
  // If the retry STILL comes back unauthorized, something's actually
  // wrong with our session — bounce cleanly.
  if (retry.status === 401) { logout({ expired: true }); return NEVER; }
  return retry;
}

export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}
