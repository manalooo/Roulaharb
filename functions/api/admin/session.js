import { isAuthorized } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const ok = await isAuthorized(request, env);
  return new Response(JSON.stringify({ ok }), {
    status: ok ? 200 : 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

