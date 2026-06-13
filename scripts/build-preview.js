const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = 'images/jookh/wearables';
const out = 'new-wearables-preview.html';

(async () => {
  const files = fs.readdirSync(dir).filter(f => /^Capture d'.*\.png$/i.test(f)).sort();
  const items = [];
  for (const f of files) {
    const m = await sharp(path.join(dir, f)).metadata();
    items.push({ file: f, w: m.width, h: m.height, ratio: (m.width / m.height).toFixed(2) });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Wearables Preview</title>
<style>
body { font-family: sans-serif; padding: 1rem; background: #111; color: #eee; }
h1 { font-size: 1.2rem; margin-bottom: .5rem; }
p { color: #aaa; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.card { background: #222; border-radius: 8px; overflow: hidden; }
.card img { width: 100%; height: 220px; object-fit: contain; background: #000; display: block; }
.meta { padding: .5rem; font-size: .75rem; color: #ccc; }
</style>
</head>
<body>
<h1>New Wearables Preview (${items.length} images)</h1>
<p>These are the screenshots in <code>images/jookh/wearables/</code>. Review and tell me which images belong to which product.</p>
<div class="grid">
${items.map(i => `  <div class="card"><img src="${dir}/${i.file}" alt="${i.file}" loading="lazy"><div class="meta">${i.file}<br>${i.w}×${i.h} · ratio ${i.ratio}</div></div>`).join('\n')}
</div>
</body>
</html>`;

  fs.writeFileSync(out, html);
  console.log('Created', out, 'with', items.length, 'images');
})();
