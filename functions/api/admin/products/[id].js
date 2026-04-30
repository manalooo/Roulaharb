import { isAuthorized, unauthorizedResponse } from '../_auth.js';

const VALID_STATUS  = new Set(['available', 'sold']);
const VALID_SECTION = new Set(['current', 'archive']);

export async function onRequestPut({ request, env, params }) {
  try {
    if (!(await isAuthorized(request, env))) return unauthorizedResponse();

    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body    = await request.json();
    const updates = [];
    const values  = [];

    if (body.name !== undefined) {
      const n = String(body.name || '').trim();
      if (!n) throw new Error('Name cannot be empty');
      updates.push('name = ?'); values.push(n);
    }
    if (body.status !== undefined) {
      const s = String(body.status || '').trim().toLowerCase();
      if (!VALID_STATUS.has(s)) throw new Error('Invalid status');
      updates.push('status = ?'); values.push(s);
    }
    if (body.section !== undefined) {
      const sec = String(body.section || '').trim().toLowerCase();
      if (!VALID_SECTION.has(sec)) throw new Error('Invalid section');
      updates.push('section = ?'); values.push(sec);
    }
    if (body.subcollection !== undefined) {
      updates.push('subcollection = ?');
      values.push(String(body.subcollection || '').trim() || null);
    }
    if (body.era !== undefined) {
      updates.push('era = ?');
      values.push(String(body.era || '').trim() || null);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      values.push(String(body.price || '').trim() || null);
    }
    if (body.material !== undefined) {
      updates.push('material = ?');
      values.push(String(body.material || '').trim() || null);
    }

    if (!updates.length) {
      return new Response(JSON.stringify({ ok: true, id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    values.push(id);
    const result = await env.DB
      .prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return new Response(
      JSON.stringify({ ok: true, id, changes: result.meta ? result.meta.changes : null }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
