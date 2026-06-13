const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = 'images/jookh/wearables';
const files = fs.readdirSync(dir).filter(f => /^wear-\d+-view-\d+\.(jpg|jpeg|png)$/i.test(f)).sort();

async function aHash(file) {
  const buffer = await sharp(path.join(dir, file))
    .greyscale()
    .resize(8, 8, { fit: 'fill' })
    .raw()
    .toBuffer();
  const pixels = Array.from(buffer);
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  return pixels.map(p => (p >= avg ? 1 : 0)).join('');
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

(async () => {
  const hashes = {};
  for (const f of files) hashes[f] = await aHash(f);

  const pairs = [];
  const names = Object.keys(hashes);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      const dist = hamming(hashes[a], hashes[b]);
      if (dist <= 8) pairs.push({ a, b, dist });
    }
  }
  pairs.sort((x, y) => x.dist - y.dist);
  console.log('Near-duplicate pairs (hamming <= 8):');
  pairs.forEach(p => console.log(`${p.dist}\t${p.a}\t${p.b}`));
})();
