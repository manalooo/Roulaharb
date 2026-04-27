import { createSessionToken, makeSessionCookie } from './_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'ADMIN_PASSWORD is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const password = body && typeof body.password === 'string' ? body.password : '';
    if (!password || password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await createSessionToken(env.ADMIN_PASSWORD);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': makeSessionCookie(token),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

