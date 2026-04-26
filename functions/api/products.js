/* Cloudflare Pages Function — GET /api/products
   Queries the D1 database, returns products as JSON with full image URLs
   (prefixed with the IMAGE_BASE env var). */
export async function onRequestGet({ env, request }) {
  try {
    const { results } = await env.DB
      .prepare('SELECT id, name, category, subcollection, era, status, price, material, main_image, hover_image, sort_order FROM products ORDER BY sort_order')
      .all();

    const base = (env.IMAGE_BASE || '/images/').replace(/\/?$/, '/');
    const products = results.map(r => ({
      id:            r.id,
      name:          r.name,
      category:      r.category,
      subcollection: r.subcollection || '',
      era:           r.era || '',
      status:        r.status,
      price:         r.price || '',
      material:      r.material || '',
      // Render expects full paths in `images.main` / `images.hover`
      images: {
        main:  r.main_image  ? base + r.main_image  : '',
        hover: r.hover_image ? base + r.hover_image : '',
      },
    }));

    return new Response(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',  // 1min browser, 5min edge
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
