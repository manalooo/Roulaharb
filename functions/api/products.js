/* Cloudflare Pages Function — GET /api/products
   Queries the D1 database, returns products as JSON with full image URLs
   (prefixed with the IMAGE_BASE env var). */
export async function onRequestGet({ env, request }) {
  try {
    const { results } = await env.DB
      .prepare('SELECT id, name, category, subcollection, collection_line, era, status, price, material, main_image, hover_image, extra_views, type, color, fit, motif, technique, sort_order FROM products ORDER BY sort_order')
      .all();

    const base = (env.IMAGE_BASE || '/images/').replace(/\/?$/, '/');
    const products = results.map(r => {
      // Parse extra_views JSON; tolerate malformed
      let extras = [];
      if (r.extra_views) {
        try { const parsed = JSON.parse(r.extra_views); if (Array.isArray(parsed)) extras = parsed; } catch (_) {}
      }
      return {
        id:            r.id,
        name:          r.name,
        category:      r.category,
        subcollection: r.subcollection || '',
        collection_line: r.collection_line || '',
        era:           r.era || '',
        status:        r.status,
        price:         r.price || '',
        material:      r.material || '',
        type:          r.type || '',
        color:         r.color || '',
        fit:           r.fit || '',
        motif:         r.motif || '',
        technique:     r.technique || '',
        images: {
          main:  r.main_image  ? base + r.main_image  : '',
          hover: r.hover_image ? base + r.hover_image : '',
          extra: extras.map(p => base + p),
        },
      };
    });

    return new Response(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
