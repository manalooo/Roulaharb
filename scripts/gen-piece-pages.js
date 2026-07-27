// Generate a shareable, SEO-ready HTML page per product at /piece/<id>/index.html,
// plus sitemap.xml. Source: data/products.json (already merged from both inventories).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VER = 'v=20260618collection-040';           // keep in step with the HTML cache-bust token
const SITE = 'https://roulaharb.com';
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'))
  .filter(p => p.id && p.category && p.name);

const PLO_CATS = ['pillows', 'paintings'];
const isPlo = p => PLO_CATS.indexOf(p.category) !== -1;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const absImg = v => SITE + '/' + String(v).replace(/^\//, '');
const rootImg = v => '/' + String(v).replace(/^\//, '') + '?' + VER;

function priceInfo(p) {
  var raw = p.price != null ? String(p.price).trim() : '';
  var num = parseFloat(raw);
  if (raw && raw.indexOf('ENTER') === -1 && raw.indexOf('[') === -1 && !isNaN(num)) return { label: '$' + num.toLocaleString('en-US'), num: num };
  return { label: 'Price on request', num: null };
}

// ── shared shell pieces ──────────────────────────────────
function nav(active) {
  const item = (href, label, cur) => '<li role="none"><a href="' + href + '" role="menuitem"' + (cur ? ' aria-current="page"' : '') + '>' + label + '</a></li>';
  return '<nav id="navbar" aria-label="Main navigation"><div class="nav-inner">' +
    '<a href="/" class="nav-logo" aria-label="Roula Harb — Home"><span class="nav-logo-name">Roula Harb</span></a>' +
    '<ul class="nav-links" id="nav-links" role="menubar">' +
      item('/#shop', 'Shop') + item('/collection/', 'Collection', active === 'collection') +
      item('/p-lo/', 'P&middot;Lo', active === 'plo') + item('/lookbook/', 'Lookbook') +
      item('/#about', 'About') + item('/#contact', 'Contact') +
    '</ul>' +
    '<span class="nav-edition" aria-hidden="true"><span class="nav-edition-dot"></span>Est. Beirut</span>' +
    '<button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links"><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span></button>' +
    '</div></nav>';
}
const FOOTER =
  '<footer id="footer"><div class="footer-gradient-bar" aria-hidden="true"></div>' +
  '<div class="container footer-inner">' +
    '<div class="footer-brand"><p class="footer-logo">Roula Harb</p><p class="footer-tagline">The Conceptual Art World</p></div>' +
    '<div class="footer-links"><a href="/#shop">Shop</a><a href="/collection/">Collection</a><a href="/p-lo/">P&middot;Lo</a><a href="/lookbook/">Lookbook</a><a href="/#about">About</a><a href="/#contact">Contact</a></div>' +
    '<div class="footer-social">' +
      '<a href="https://www.instagram.com/jookhcouture" target="_blank" rel="noopener" aria-label="Jookh Instagram" class="footer-social-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg><span class="footer-social-label">Jookh</span></a>' +
      '<a href="https://www.instagram.com/artonpillows/" target="_blank" rel="noopener" aria-label="P-Lo Instagram" class="footer-social-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg><span class="footer-social-label">P-Lo</span></a>' +
    '</div></div>' +
  '<div class="footer-bottom"><p>&copy; 2026 The Conceptual Art World of Roula Harb. All rights reserved. Each piece is an original work of art.</p></div></footer>';

function specRows(p) {
  const rows = [];
  const add = (k, v) => { if (v && String(v).indexOf('ENTER') === -1 && String(v).indexOf('[') === -1) rows.push('<div class="piece-spec"><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>'); };
  add('Medium', p.medium); add('Type', p.type); add('Colour', p.color);
  add('Fit', p.fit); add('Motif', p.motif); add('Technique', p.technique);
  if (p.subcollection) add('Collection', p.subcollection);
  return rows.length ? '<dl class="piece-specs">' + rows.join('') + '</dl>' : '';
}

function related(p) {
  const plo = isPlo(p);
  let pool = products.filter(q => q.id !== p.id && (plo ? isPlo(q) : !isPlo(q)));
  if (plo) {
    const sameCat = pool.filter(q => q.category === p.category);   // pillows → pillows, paintings → paintings
    if (sameCat.length >= 2) pool = sameCat;
  } else if (p.subcollection) {
    const same = pool.filter(q => q.subcollection === p.subcollection);
    if (same.length >= 2) pool = same;
  }
  pool = pool.filter(q => q.status !== 'sold').concat(pool.filter(q => q.status === 'sold'));
  const picks = pool.slice(0, 4);
  if (!picks.length) return '';
  const cards = picks.map(q => {
    const img = (q.views && q.views[0]) || '';
    return '<a class="rel-card" href="/piece/' + esc(q.id) + '/">' +
      '<span class="rel-img"><img src="' + rootImg(img) + '" alt="' + esc(q.name) + '" loading="lazy" decoding="async" /></span>' +
      '<span class="rel-name">' + esc(q.name) + '</span></a>';
  }).join('');
  return '<section class="piece-related"><h2 class="piece-related-title">More from ' + (plo ? 'P&middot;Lo' : 'this collection') + '</h2><div class="rel-grid">' + cards + '</div></section>';
}

function page(p) {
  const plo = isPlo(p);
  const brand = plo ? 'P·Lo' : 'Jookh Couture';
  const sold = p.status === 'sold';
  const pr = priceInfo(p);
  const url = SITE + '/piece/' + p.id + '/';
  const views = (p.views || []).filter(Boolean);
  const mainV = views[0] || '';
  const desc = (p.name + ' — ' + (p.medium && p.medium.indexOf('ENTER') === -1 ? p.medium + '. ' : '') +
    'A one-of-a-kind, hand-painted ' + (plo ? 'work' : 'piece') + ' from ' + brand +
    (p.subcollection ? ', ' + p.subcollection : '') + '. Signed by the artist.').replace(/\s+/g, ' ').slice(0, 300);

  const jsonld = {
    '@context': 'https://schema.org/', '@type': 'Product',
    name: p.name, image: views.map(absImg), description: desc,
    brand: { '@type': 'Brand', name: 'Roula Harb' }, category: p.category,
    offers: Object.assign({ '@type': 'Offer', url: url, availability: 'https://schema.org/' + (sold ? 'SoldOut' : 'InStock'), itemCondition: 'https://schema.org/NewCondition' },
      pr.num != null ? { priceCurrency: 'USD', price: pr.num } : {})
  };

  const thumbs = views.length > 1 ? '<div class="piece-thumbs" role="tablist">' + views.map((v, i) =>
    '<button class="piece-thumb' + (i === 0 ? ' is-active' : '') + '" data-src="' + rootImg(v) + '" aria-label="View ' + (i + 1) + '"' + (i === 0 ? ' aria-selected="true"' : '') + '><img src="' + rootImg(v) + '" alt="" loading="lazy" /></button>').join('') + '</div>' : '';

  const cta = sold
    ? '<p class="piece-sold">This piece found its person.</p>'
    : '<a class="btn-inquire' + (plo ? ' btn-inquire--plo' : '') + ' piece-reserve" href="#" role="button" aria-pressed="false"' +
        ' data-product-id="' + esc(p.id) + '" data-product-name="' + esc(p.name) + '"' +
        ' data-product-collection="' + esc(brand) + '" data-product-thumb="' + esc(mainV) + '">Reserve this piece</a>';

  const crumbHome = plo ? '/p-lo/' : '/collection/';
  const crumbLabel = plo ? 'P·Lo' : 'Collection';

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '<title>' + esc(p.name) + ' — ' + brand + ' · Roula Harb</title>\n' +
    '<meta name="description" content="' + esc(desc) + '" />\n' +
    '<link rel="canonical" href="' + url + '" />\n' +
    '<meta name="theme-color" content="#3B1E3A" />\n' +
    '<meta property="og:type" content="product" />\n' +
    '<meta property="og:url" content="' + url + '" />\n' +
    '<meta property="og:site_name" content="Roula Harb" />\n' +
    '<meta property="og:title" content="' + esc(p.name) + ' — ' + brand + '" />\n' +
    '<meta property="og:description" content="' + esc(desc) + '" />\n' +
    '<meta property="og:image" content="' + absImg(mainV) + '" />\n' +
    '<meta name="twitter:card" content="summary_large_image" />\n' +
    '<meta name="twitter:title" content="' + esc(p.name) + ' — ' + brand + '" />\n' +
    '<meta name="twitter:description" content="' + esc(desc) + '" />\n' +
    '<meta name="twitter:image" content="' + absImg(mainV) + '" />\n' +
    '<script type="application/ld+json">' + JSON.stringify(jsonld) + '</script>\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />\n' +
    '<link rel="stylesheet" href="/style.css?' + VER + '" />\n' +
    '<script>document.documentElement.classList.add("js-enabled");</script>\n</head>\n' +
    '<body class="page-piece' + (plo ? ' page-plo piece--plo' : '') + '">\n' +
    '<div class="cursor-dot" id="cursor-dot" aria-hidden="true"></div>\n' +
    nav(plo ? 'plo' : 'collection') + '\n' +
    '<main class="piece-main container">\n' +
    '<nav class="piece-crumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="' + crumbHome + '">' + crumbLabel + '</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(p.name) + '</span></nav>\n' +
    '<div class="piece-layout">\n' +
      '<div class="piece-gallery">\n' +
        '<div class="piece-stage' + (sold ? ' is-sold' : '') + '">' + (sold ? '<span class="piece-stage-tag">Claimed</span>' : '') +
          '<img id="piece-hero" src="' + rootImg(mainV) + '" alt="' + esc(p.name) + '" /></div>\n' + thumbs + '\n' +
      '</div>\n' +
      '<aside class="piece-details">\n' +
        '<p class="piece-brand">' + brand + '</p>\n' +
        '<h1 class="piece-name">' + esc(p.name) + '</h1>\n' +
        '<div class="piece-meta-top"><span class="piece-status ' + (sold ? 'is-sold' : 'is-available') + '">' + (sold ? 'Claimed' : 'Available') + '</span>' +
          '<span class="piece-price">' + esc(pr.label) + '</span></div>\n' +
        specRows(p) +
        '<p class="piece-edition">' + esc(p.edition || 'One-of-a-kind · Signed by the artist') + '</p>\n' +
        '<div class="piece-cta">' + cta + '</div>\n' +
        '<p class="piece-note">One-of-a-kind and signed by the artist. Reserve here, or message on WhatsApp / Instagram to arrange the details.</p>\n' +
      '</aside>\n' +
    '</div>\n' +
    related(p) + '\n' +
    '</main>\n' + FOOTER + '\n' +
    '<script src="/script.js?' + VER + '"></script>\n' +
    '<script>(function(){var hero=document.getElementById("piece-hero");var t=document.querySelectorAll(".piece-thumb");t.forEach(function(b){b.addEventListener("click",function(){hero.src=b.dataset.src;t.forEach(function(x){x.classList.remove("is-active");x.setAttribute("aria-selected","false");});b.classList.add("is-active");b.setAttribute("aria-selected","true");});});})();</script>\n' +
    '</body>\n</html>\n';
}

// ── write pages ──────────────────────────────────────────
let n = 0;
for (const p of products) {
  const dir = path.join(ROOT, 'piece', p.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(p));
  n++;
}

// ── sitemap.xml (static pages + every piece) ─────────────
const staticUrls = ['/', '/collection/', '/p-lo/', '/lookbook/'];
const today = new Date().toISOString().slice(0, 10);
const sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  staticUrls.map(u => '  <url><loc>' + SITE + u + '</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>').join('\n') + '\n' +
  products.map(p => '  <url><loc>' + SITE + '/piece/' + p.id + '/</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>').join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

if (!fs.existsSync(path.join(ROOT, 'robots.txt'))) {
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + SITE + '/sitemap.xml\n');
}

console.log('Generated ' + n + ' piece pages + sitemap.xml (' + (staticUrls.length + products.length) + ' urls).');
