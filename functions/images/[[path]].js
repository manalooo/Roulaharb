/* Cloudflare Pages Function — GET /images/*
   Serves image files directly from the bound R2 bucket.
   This keeps `IMAGE_BASE=/images/` working in production without exposing R2 URLs. */

function guessContentType(key) {
  const ext = key.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

export async function onRequestGet({ env, params, request }) {
  const rawPath = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const key = rawPath.replace(/^\/+/, '');

  // Guard against empty keys and path traversal attempts.
  if (!key || key.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  // Try R2 bucket first (existing images live here).
  if (env.IMAGES) {
    const object = await env.IMAGES.get(key);
    if (object) {
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Content-Type', object.httpMetadata?.contentType || guessContentType(key));
      if (object.httpEtag) {
        headers.set('ETag', object.httpEtag);
      }
      return new Response(object.body, { headers });
    }
  }

  // Fallback: serve from static assets (new images deployed via git).
  if (env.ASSETS) {
    const assetUrl = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(assetUrl);
    if (assetResponse.status === 200) {
      return assetResponse;
    }
  }

  return new Response('Not found', { status: 404 });
}
