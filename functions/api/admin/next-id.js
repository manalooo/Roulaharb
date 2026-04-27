import { isAuthorized, unauthorizedResponse } from './_auth.js';

const CATEGORY_PREFIX = {
  scarves: 'scarf',
  bags: 'bag',
  wearables: 'wear',
  pillows: 'plo',
};

function getPrefix(category) {
  return CATEGORY_PREFIX[category] || null;
}

async function computeNextId(env, category) {
  const prefix = getPrefix(category);
  if (!prefix) throw new Error('Invalid category');

  const likePattern = `${prefix}-%`;
  const { results } = await env.DB.prepare('SELECT id FROM products WHERE id LIKE ?').bind(likePattern).all();

  let maxNum = 0;
  for (const row of results || []) {
    const match = String(row.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) continue;
    const value = parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > maxNum) maxNum = value;
  }

  return `${prefix}-${String(maxNum + 1).padStart(2, '0')}`;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!(await isAuthorized(request, env))) return unauthorizedResponse();

    const url = new URL(request.url);
    const category = (url.searchParams.get('category') || '').trim();
    const nextId = await computeNextId(env, category);
    return new Response(JSON.stringify({ id: nextId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

