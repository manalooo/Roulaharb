const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = 'images/jookh/wearables';
const thumbSize = 200;
const cols = 10;
const out = 'new-wearables-mosaic.jpg';

(async () => {
  const files = fs.readdirSync(dir).filter(f => /^Capture d'.*\.png$/i.test(f)).sort();
  const rows = Math.ceil(files.length / cols);
  const canvasW = cols * thumbSize;
  const canvasH = rows * thumbSize;

  const composite = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const thumb = await sharp(path.join(dir, f))
      .resize(thumbSize, thumbSize, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    composite.push({
      input: thumb,
      left: (i % cols) * thumbSize,
      top: Math.floor(i / cols) * thumbSize,
    });
  }

  await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .jpeg({ quality: 90 })
    .composite(composite)
    .toFile(out);

  console.log('Created', out, `(${canvasW}x${canvasH}) with ${files.length} images`);
})();
