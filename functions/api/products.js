/* Cloudflare Pages Function — GET /api/products */

async function ensureSection(env) {
  try {
    await env.DB.prepare("ALTER TABLE products ADD COLUMN section TEXT NOT NULL DEFAULT 'current'").run();
  } catch (_) {}
}

export async function onRequestGet({ env }) {
  try {
    await ensureSection(env);

    const { results } = await env.DB
      .prepare('SELECT id, name, category, subcollection, era, status, section, price, material, main_image, hover_image, sort_order FROM products ORDER BY sort_order')
      .all();

    const base = (env.IMAGE_BASE || '/images/').replace(/\/?$/, '/');
    const products = results.map(r => ({
      id:            r.id,
      name:          r.name,
      category:      r.category,
      subcollection: r.subcollection || '',
      era:           r.era || '',
      status:        r.status,
      section:       r.section || 'current',
      price:         r.price || '',
      material:      r.material || '',
      images: {
        main:  r.main_image  ? base + r.main_image  : '',
        hover: r.hover_image ? base + r.hover_image : '',
      },
    }));

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
