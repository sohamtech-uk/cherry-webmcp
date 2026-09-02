const DEFAULT_API_BASE = 'https://cherrybank.money/api';
const TOKEN_KEY = 'cherry-webmcp-live-token';
const PROFILE_KEY = 'cherry-webmcp-live-profile';
const ALLOWED_API_ORIGINS = new Set([
  'https://cherrybank.money',
  'https://www.cherrybank.money',
  'http://localhost:8000',
]);

function normaliseApiBase(value) {
  const url = new URL(String(value || DEFAULT_API_BASE).replace(/\/$/, ''));
  if (!ALLOWED_API_ORIGINS.has(url.origin)) {
    throw new Error('The configured Cherry Money API origin is not approved.');
  }
  return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
}

export const LIVE_API_BASE = normaliseApiBase(
  import.meta.env.VITE_CHERRY_API_BASE_URL || DEFAULT_API_BASE,
);

export function getLiveToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getSavedProfile() {
  try {
    return JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function hasLiveSession() {
  return Boolean(getLiveToken());
}

export function clearLiveSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  } catch {
    // Embedded/private browser contexts may disable storage.
  }
}

async function request(path, options = {}) {
  const token = getLiveToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${LIVE_API_BASE}${path}`, {
    ...options,
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'strict-origin-when-cross-origin',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    clearLiveSession();
    window.dispatchEvent(new CustomEvent('cherry-live-session-expired'));
  }

  if (!response.ok) {
    const validation = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : '';
    const message = payload?.message || payload?.reply || validation || `Cherry Money returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function loginToCherryMoney(email, password) {
  const payload = await request('/login', {
    method: 'POST',
    body: { email, password },
  });

  if (!payload?.token) {
    throw new Error(payload?.error || 'Cherry Money did not return an authenticated session token.');
  }

  try {
    sessionStorage.setItem(TOKEN_KEY, payload.token);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(payload.user || null));
  } catch {
    clearLiveSession();
    throw new Error('This browser does not allow tab-scoped session storage, so a secure live session cannot be retained.');
  }

  return payload;
}

export async function logoutLiveSession() {
  try {
    if (getLiveToken()) await request('/logout', { method: 'GET' });
  } finally {
    clearLiveSession();
  }
}

export const liveStatus = () => request('/webmcp/status');
export const liveBootstrap = (limit = 50) => request(`/webmcp/bootstrap?limit=${encodeURIComponent(limit)}`);

export function askLiveCherry(message, history = []) {
  return request('/webmcp/ask', {
    method: 'POST',
    body: { message, history },
  });
}

export function suggestLiveReconciliation(transactionId) {
  return request('/webmcp/reconciliation/suggest', {
    method: 'POST',
    body: { transaction_id: transactionId },
  });
}

export function stageLiveReconciliation(transactionId, invoiceId) {
  return request('/webmcp/reconciliation/stage', {
    method: 'POST',
    body: { transaction_id: transactionId, invoice_id: invoiceId },
  });
}

export function approveLiveReconciliation(proposalId) {
  return request(`/webmcp/reconciliation/${encodeURIComponent(proposalId)}/approve`, {
    method: 'POST',
    headers: { 'X-Cherry-Human-Approval': 'confirmed' },
    body: { confirmation: true },
  });
}

export function createLivePaymentDraft(input) {
  return request('/webmcp/payment-drafts', {
    method: 'POST',
    body: input,
  });
}
