// Compress 22 new lookbook 2022 screenshots → look-2022-13.jpg through look-2022-34.jpg
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

sharp.cache(false);
sharp.concurrency(1);

const DIR = path.join(__dirname, '..', 'images', 'lookbook', '2022');

// Map: source filename → destination number
const MAP = [
  ["Capture d'écran 2026-05-16 205519.png", 13],
  ["Capture d'écran 2026-05-16 205544.png", 14],
  ["Capture d'écran 2026-05-16 205557.png", 15],
  ["Capture d'écran 2026-05-16 205623.png", 16],
  ["Capture d'écran 2026-05-16 205637.png", 17],
  ["Capture d'écran 2026-05-16 205656.png", 18],
  ["Capture d'écran 2026-05-16 205839.png", 19],
  ["Capture d'écran 2026-05-16 205855.png", 20],
  ["Capture d'écran 2026-05-16 205901.png", 21],
  ["Capture d'écran 2026-05-16 205914.png", 22],
  ["Capture d'écran 2026-05-16 205932.png", 23],
  ["Capture d'écran 2026-05-16 205919.png", 24],
  ["Capture d'écran 2026-05-16 205939.png", 25],
  ["Capture d'écran 2026-05-16 205952.png", 26],
  ["Capture d'écran 2026-05-16 205959.png", 27],
  ["Capture d'écran 2026-05-16 210012.png", 28],
  ["Capture d'écran 2026-05-16 210019.png", 29],
  ["Capture d'écran 2026-05-16 210031.png", 30],
  ["Capture d'écran 2026-05-16 210038.png", 31],
  ["Capture d'écran 2026-05-16 210051.png", 32],
  ["Capture d'écran 2026-05-16 210100.png", 33],
  ["Capture d'écran 2026-05-16 210111.png", 34],
];

(async () => {
  for (const [src, n] of MAP) {
    const srcPath = path.join(DIR, src);
    const dstPath = path.join(DIR, `look-2022-${n}.jpg`);
    if (!fs.existsSync(srcPath)) { console.warn('missing', src); continue; }
    const buf = await sharp(srcPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(dstPath, buf);
    const kb = (buf.length / 1024).toFixed(0);
    console.log(`look-2022-${n}.jpg  ${kb} KB`);
  }
  console.log('done');
})();
