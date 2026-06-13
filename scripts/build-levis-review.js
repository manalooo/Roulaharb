const fs = require('fs');
const path = require('path');
const csvPath = 'inventory.csv';
const outHtml = 'levis-review.html';
const outMosaic = 'levis-review-mosaic.jpg';
const imgDir = 'images/jookh/wearables';

const rows = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1).map(line => {
  const [id, name, category, subcollection, collection_line, era, status, price, material, main_image, hover_image, extra_views] = line.split(',');
  return { id, name, collection_line, status, price, material, main_image, hover_image };
});

const products = rows
  .filter(r => r.collection_line === "Levi's x Jookh")
  .sort((a, b) => {
    const na = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Levi's x Jookh Pair Review</title>
<style>
body { font-family: sans-serif; background: #111; color: #eee; margin: 0; padding: 1rem; }
h1 { margin: 0 0 1rem; font-size: 1.2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
.card { background: #222; border-radius: 8px; padding: .5rem; }
.card img { width: 49%; aspect-ratio: 1/1; object-fit: contain; background: #333; border-radius: 4px; }
.card .info { margin-top: .4rem; font-size: .8rem; }
.card .id { font-weight: bold; color: #0ff; }
.card .warn { color: #f66; font-weight: bold; }
.missing { opacity: .4; }
</style>
</head>
<body>
<h1>Levi's x Jookh Pair Review — ${products.length} products</h1>
<div class="grid">
`;

for (const p of products) {
  const main = p.main_image || '';
  const hover = p.hover_image || '';
  const mainExists = main && fs.existsSync(path.join('images', main));
  const hoverExists = hover && fs.existsSync(path.join('images', hover));
  const missing = [];
  if (main && !mainExists) missing.push('main');
  if (hover && !hoverExists) missing.push('hover');
  html += `<div class="card${missing.length ? ' missing' : ''}">
    <img src="${main || ''}" loading="lazy" title="${p.id} view-1">
    <img src="${hover || ''}" loading="lazy" title="${p.id} view-2">
    <div class="info">
      <span class="id">${p.id}</span> — ${p.name}<br>
      ${p.status} · ${p.price} · ${p.material}
      ${missing.length ? `<br><span class="warn">Missing: ${missing.join(', ')}</span>` : ''}
    </div>
  </div>\n`;
}

html += `</div></body></html>`;
fs.writeFileSync(outHtml, html);
console.log('Wrote', outHtml, `(${products.length} products)`);

// Optional mosaic with labels using sharp
(async () => {
  const sharp = require('sharp');
  const thumbW = 280;
  const thumbH = 350;
  const cols = 6; // 3 products per row => 6 thumbs
  const rows = Math.ceil(products.length / 3);
  const canvasW = cols * thumbW;
  const canvasH = rows * (thumbH + 24);
  const composite = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const row = Math.floor(i / 3);
    const col = i % 3;
    const xBase = col * thumbW * 2;
    const yBase = row * (thumbH + 24);

    const paths = [p.main_image, p.hover_image].filter(Boolean).map(p => path.join('.', p));
    for (let v = 0; v < 2; v++) {
      const imgPath = paths[v];
      const left = xBase + v * thumbW;
      if (imgPath && fs.existsSync(imgPath)) {
        const buf = await sharp(imgPath)
          .resize(thumbW, thumbH, { fit: 'contain', background: { r: 30, g: 30, b: 30 } })
          .jpeg({ quality: 80 })
          .toBuffer();
        composite.push({ input: buf, left, top: yBase + 24 });
      } else {
        const buf = await sharp({ create: { width: thumbW, height: thumbH, channels: 3, background: { r: 30, g: 30, b: 30 } } })
          .jpeg().toBuffer();
        composite.push({ input: buf, left, top: yBase + 24 });
      }
    }

    // label bar with product id using SVG
    const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${thumbW * 2}" height="24">
      <rect width="100%" height="100%" fill="#000"/>
      <text x="5" y="17" fill="#0ff" font-size="14" font-family="sans-serif">${p.id}</text>
    </svg>`);
    composite.push({ input: labelSvg, left: xBase, top: yBase });
  }

  await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: { r: 17, g: 17, b: 17 } } })
    .jpeg({ quality: 85 })
    .composite(composite)
    .toFile(outMosaic);
  console.log('Wrote', outMosaic);
})().catch(err => console.error(err));
