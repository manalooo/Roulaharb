const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseCookies(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const parts = cookieHeader.split(';').map((p) => p.trim()).filter(Boolean);
  const out = {};
  parts.forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx)] = part.slice(idx + 1);
  });
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function signPayload(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(secret) {
  const payloadObj = { exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
  const sig = await signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export async function isAuthorized(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token || token.indexOf('.') === -1) return false;
  const [payload, givenSig] = token.split('.', 2);
  const expectedSig = await signPayload(payload, env.ADMIN_PASSWORD);
  if (!timingSafeEqual(givenSig || '', expectedSig)) return false;

  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
  } catch (_) {
    return false;
  }
  return !!parsed.exp && parsed.exp > Math.floor(Date.now() / 1000);
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function makeSessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

