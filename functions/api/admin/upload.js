import { isAuthorized, unauthorizedResponse } from './_auth.js';

const CATEGORY_FOLDER = {
  scarves: 'jookh/scarves',
  bags: 'jookh/bags',
  wearables: 'jookh/wearables',
  pillows: 'plo',
};

function sanitizeSegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function extensionForType(type) {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  return null;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!(await isAuthorized(request, env))) return unauthorizedResponse();
    if (!env.IMAGES) {
      return new Response(JSON.stringify({ error: 'R2 binding IMAGES is missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const form = await request.formData();
    const file = form.get('file');
    const category = String(form.get('category') || '').trim();
    const role = String(form.get('role') || 'main').trim();
    const name = String(form.get('name') || '').trim();
    if (!file || typeof file.arrayBuffer !== 'function') {
      return new Response(JSON.stringify({ error: 'Missing file upload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const folder = CATEGORY_FOLDER[category];
    if (!folder) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = extensionForType(file.type);
    if (!ext) {
      return new Response(JSON.stringify({ error: 'Only jpg, png, webp, gif are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image too large (max 10MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeName = sanitizeSegment(name || 'piece');
    const safeRole = role === 'hover' ? 'view-2' : 'view-1';
    const stamp = Date.now();
    const key = `${folder}/${safeName}-${safeRole}-${stamp}.${ext}`;

    await env.IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ key, url: `/images/${key}` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

