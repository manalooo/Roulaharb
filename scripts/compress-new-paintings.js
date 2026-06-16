// Compress + rename the 3 new single-canvas paintings to paint-11/12/13-view-1.jpg
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
sharp.cache(false); sharp.concurrency(1);

const DIR = path.join(__dirname, '..', 'images', 'paintings');
const MAP = [
  ['20210113_121529.jpg', 'paint-11-view-1.jpg'],
  ['_52A2136 (1).png',    'paint-12-view-1.jpg'],
  ['piece-8.jpg',         'paint-13-view-1.jpg'],
];

(async () => {
  for (const [src, dst] of MAP) {
    const s = path.join(DIR, src), d = path.join(DIR, dst);
    if (!fs.existsSync(s)) { console.warn('missing', src); continue; }
    const buf = await sharp(s).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    fs.writeFileSync(d, buf);
    console.log(dst + '  ' + (buf.length / 1024).toFixed(0) + ' KB  (was ' + (fs.statSync(s).size / 1024).toFixed(0) + ' KB)');
    fs.unlinkSync(s); // remove heavy original
  }
  console.log('done');
})();
