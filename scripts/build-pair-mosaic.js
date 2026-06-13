const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = 'images/jookh/wearables';
const out = 'new-wearables-pairs.jpg';
const thumbW = 320;
const thumbH = 400;
const cols = 4; // 4 products per row => 8 thumbs per row

(async () => {
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
  const rows = Math.ceil(ids.length / cols);
  const canvasW = cols * thumbW * 2;
  const canvasH = rows * thumbH;

  const composite = [];
  ids.forEach((id, i) => {
    const views = products[id].sort((a, b) => a.view - b.view);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const xBase = col * thumbW * 2;
    const yBase = row * thumbH;

    views.forEach((v, idx) => {
      const thumb = sharp(path.join(dir, v.file)).resize(thumbW, thumbH, { fit: 'contain', background: { r: 240, g: 240, b: 240 } }).jpeg({ quality: 85 });
      composite.push({ input: await thumb.toBuffer(), left: xBase + idx * thumbW, top: yBase });
    });

    // label background
    const labelW = thumbW * 2;
    const labelH = 28;
    const labelBuf = await sharp({
      create: { width: labelW, height: labelH, channels: 3, background: { r: 20, g: 20, b: 20 } }
    }).jpeg({ quality: 90 }).toBuffer();
    composite.push({ input: labelBuf, left: xBase, top: yBase });

    // Could add text with sharp? Skip for now; use overlay? Sharp doesn't support text easily.
    // We'll just label in HTML instead.
  });

  await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: { r: 240, g: 240, b: 240 } } })
    .jpeg({ quality: 90 })
    .composite(composite)
    .toFile(out);

  console.log('Created', out, `with ${ids.length} products`);
})();
