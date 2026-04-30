import { isAuthorized, unauthorizedResponse } from './_auth.js';

const CATEGORY_PREFIX = {
  scarves: 'scarf',
  bags: 'bag',
  wearables: 'wear',
  pillows: 'plo',
};

const VALID_STATUS  = new Set(['available', 'sold']);
const VALID_SECTION = new Set(['current', 'archive']);

// Adds the section column if it doesn't exist yet — safe to call repeatedly.
async function ensureSection(env) {
  try {
    await env.DB.prepare("ALTER TABLE products ADD COLUMN section TEXT NOT NULL DEFAULT 'current'").run();
  } catch (_) {
    // Already exists — ignore.
  }
}

function requiredString(value, field) {
  const out = String(value || '').trim();
  if (!out) throw new Error(`${field} is required`);
  return out;
}

async function nextId(env, category) {
  const prefix = CATEGORY_PREFIX[category];
  if (!prefix) throw new Error('Invalid category');
  const likePattern = `${prefix}-%`;
  const { results } = await env.DB.prepare('SELECT id FROM products WHERE id LIKE ?').bind(likePattern).all();
  let maxNum = 0;
  for (const row of results || []) {
    const match = String(row.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) continue;
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > maxNum) maxNum = n;
  }
  return `${prefix}-${String(maxNum + 1).padStart(2, '0')}`;
}

async function nextSortOrder(env) {
  const row = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM products').first();
  return Number(row && row.value != null ? row.value : 0);
}

export async function onRequestGet({ request, env }) {
  try {
    if (!(await isAuthorized(request, env))) return unauthorizedResponse();
    await ensureSection(env);

    const { results } = await env.DB
      .prepare('SELECT id, name, category, subcollection, era, status, section, price, material, main_image, hover_image, sort_order FROM products ORDER BY sort_order ASC, id ASC')
      .all();

    return new Response(JSON.stringify(results || []), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!(await isAuthorized(request, env))) return unauthorizedResponse();
    await ensureSection(env);

    const body     = await request.json();
    const name     = requiredString(body.name, 'Name');
    const category = requiredString(body.category, 'Category');
    const status   = String(body.status  || 'available').trim().toLowerCase();
    const section  = String(body.section || 'current').trim().toLowerCase();
    const mainImage = requiredString(body.main_image, 'Main image');

    if (!CATEGORY_PREFIX[category]) throw new Error('Invalid category');
    if (!VALID_STATUS.has(status))   throw new Error('Invalid status');
    if (!VALID_SECTION.has(section)) throw new Error('Invalid section');

    const id        = await nextId(env, category);
    const sortOrder = await nextSortOrder(env);

    await env.DB.prepare(
      'INSERT INTO products (id, name, category, subcollection, era, status, section, price, material, main_image, hover_image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, name, category,
      String(body.subcollection || '').trim() || null,
      String(body.era           || '').trim() || null,
      status, section,
      String(body.price    || '').trim() || null,
      String(body.material || '').trim() || null,
      mainImage,
      String(body.hover_image || '').trim() || null,
      sortOrder
    ).run();

    return new Response(JSON.stringify({ ok: true, id, sort_order: sortOrder }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
