const fs = require('fs');
const path = require('path');

const dir = 'images/jookh/wearables';
const out = 'new-wearables-pairs.html';

const files = fs.readdirSync(dir).filter(f => /^wear-\d+-view-\d+\.(jpg|jpeg|png)$/i.test(f));
const products = {};
files.forEach(f => {
  const m = f.match(/^wear-(\d+)-view-(\d+)\.(jpg|jpeg|png)$/i);
  if (!m) return;
  const id = parseInt(m[1], 10);
  if (!products[id]) products[id] = [];
  products[id].push({ view: parseInt(m[2], 10), file: f });
});

const ids = Object.keys(products).map(Number).sort((a, b) => a - b);

const items = ids.map(id => {
  const views = products[id].sort((a, b) => a.view - b.view);
  const imgs = views.map(v => `<img src="${dir}/${v.file}" alt="wear-${id} view-${v.view}" loading="lazy">`).join('');
  return `<div class="pair"><div class="pair-label">wear-${id}</div><div class="pair-imgs">${imgs}</div></div>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Wearables — Pair Check</title>
<style>
body { font-family: sans-serif; padding: 1rem; background: #111; color: #eee; }
h1 { font-size: 1.2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
.pair { background: #222; border-radius: 8px; overflow: hidden; }
.pair-label { padding: 0.5rem; font-size: 0.85rem; color: #fff; background: #000; }
.pair-imgs { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.pair-imgs img { width: 100%; height: 260px; object-fit: contain; background: #eee; display: block; }
</style>
</head>
<body>
<h1>New Wearables — Pair Check (${ids.length} products)</h1>
<p>Check that view-1 and view-2 belong to the same product.</p>
<div class="grid">
${items}
</div>
</body>
</html>`;

fs.writeFileSync(out, html);
console.log('Created', out, `with ${ids.length} products`);
