const fs = require('fs');
const path = require('path');

const [startArg, endArg] = process.argv.slice(2);
const startId = parseInt(startArg || '79', 10);
const endId   = parseInt(endArg   || '117', 10);

const csvPath = 'inventory.csv';
const outHtml = `review-${startId}-${endId}.html`;
const outMosaic = `review-${startId}-${endId}.jpg`;
const imgDir = 'images/jookh/wearables';

const rows = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1).map(line => {
  const [id, name, category, subcollection, collection_line, era, status, price, material, main_image, hover_image, extra_views] = line.split(',');
  return { id, name, category, subcollection, collection_line, status, price, material, main_image, hover_image };
});

const products = rows
  .filter(r => {
    const num = parseInt(r.id.replace(/\D/g, ''), 10);
    return r.category === 'wearables' && num >= startId && num <= endId;
  })
  .sort((a, b) => parseInt(a.id.replace(/\D/g, ''), 10) - parseInt(b.id.replace(/\D/g, ''), 10));

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Review wear-${startId} to wear-${endId}</title>
<style>
body { font-family: sans-serif; background: #111; color: #eee; margin: 0; padding: 1rem; }
h1 { margin: 0 0 1rem; font-size: 1.2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1rem; }
.card { background: #222; border-radius: 8px; padding: .5rem; }
.card img { width: 49%; aspect-ratio: 1/1; object-fit: contain; background: #333; border-radius: 4px; }
.card .info { margin-top: .4rem; font-size: .9rem; }
.card .id { font-weight: bold; color: #0ff; font-size: 1.1rem; }
.card .warn { color: #f66; font-weight: bold; }
.missing { opacity: .4; }
</style>
</head>
<body>
<h1>Review wear-${startId} to wear-${endId} — ${products.length} products</h1>
<div class="grid">
`;

for (const p of products) {
  const main = p.main_image || '';
  const hover = p.hover_image || '';
  const mainExists = main && fs.existsSync(main);
  const hoverExists = hover && fs.existsSync(hover);
  const missing = [];
  if (main && !mainExists) missing.push('main');
  if (hover && !hoverExists) missing.push('hover');
  html += `<div class="card${missing.length ? ' missing' : ''}">
    <img src="${main}" loading="lazy" title="${p.id} view-1">
    <img src="${hover}" loading="lazy" title="${p.id} view-2">
    <div class="info">
      <span class="id">${p.id}</span> — ${p.name} — ${p.collection_line}<br>
      ${p.status} · ${p.price} · ${p.material}
      ${missing.length ? `<br><span class="warn">Missing: ${missing.join(', ')}</span>` : ''}
    </div>
  </div>\n`;
}

html += `</div></body></html>`;
fs.writeFileSync(outHtml, html);
console.log('Wrote', outHtml, `(${products.length} products)`);

(async () => {
  const sharp = require('sharp');
  const thumbW = 360;
  const thumbH = 450;
  const perRow = 2; // 2 products per row => 4 thumbs
  const rows = Math.ceil(products.length / perRow);
  const canvasW = perRow * thumbW * 2;
  const canvasH = rows * (thumbH + 32);
  const composite = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const xBase = col * thumbW * 2;
    const yBase = row * (thumbH + 32);

    const paths = [p.main_image, p.hover_image].filter(Boolean);
    for (let v = 0; v < 2; v++) {
      const ip = paths[v];
      const left = xBase + v * thumbW;
      if (ip && fs.existsSync(ip)) {
        const buf = await sharp(ip)
          .resize(thumbW, thumbH, { fit: 'contain', background: { r: 30, g: 30, b: 30 } })
          .jpeg({ quality: 85 })
          .toBuffer();
        composite.push({ input: buf, left, top: yBase + 32 });
      } else {
        const buf = await sharp({ create: { width: thumbW, height: thumbH, channels: 3, background: { r: 30, g: 30, b: 30 } } })
          .jpeg().toBuffer();
        composite.push({ input: buf, left, top: yBase + 32 });
      }
    }

    const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${thumbW * 2}" height="32">
      <rect width="100%" height="100%" fill="#000"/>
      <text x="5" y="23" fill="#0ff" font-size="18" font-family="sans-serif">${p.id} — ${p.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
    </svg>`);
    composite.push({ input: labelSvg, left: xBase, top: yBase });
  }

  await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: { r: 17, g: 17, b: 17 } } })
    .jpeg({ quality: 88 })
    .composite(composite)
    .toFile(outMosaic);
  console.log('Wrote', outMosaic);
})().catch(err => console.error(err));
