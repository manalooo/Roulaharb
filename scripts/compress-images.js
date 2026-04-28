const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');
// Disable internal file cache + concurrency — Windows otherwise holds locks across calls
sharp.cache(false);
sharp.concurrency(1);

const ROOT = path.join(__dirname, '..', 'images');
const SKIP = ['stickers', 'logos'];
const MIN_BYTES = 500 * 1024;
const MAX_DIM   = 1600;
const JPG_QUALITY = 82;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (SKIP.includes(name)) continue;
      walk(full, out);
    } else if (/\.(jpe?g|png|webp)$/i.test(name)) {
      out.push({ path: full, size: stat.size });
    }
  }
  return out;
}

(async () => {
  const all = walk(ROOT);
  const targets = all.filter(f => f.size > MIN_BYTES);
  const beforeTotal = targets.reduce((s, f) => s + f.size, 0);
  console.log(`Compressing ${targets.length} files (${(beforeTotal/1048576).toFixed(0)}MB)...`);

  let savedTotal = 0, succ = 0, skip = 0, fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const file = targets[i];
    const ext = path.extname(file.path).toLowerCase().slice(1);
    try {
      const img = sharp(file.path).rotate();
      const meta = await img.metadata();
      let pipe = img.resize({ width: meta.width  > MAX_DIM ? MAX_DIM : meta.width,
                              height: meta.height > MAX_DIM ? MAX_DIM : meta.height,
                              fit: 'inside', withoutEnlargement: true });
      if (ext === 'jpg' || ext === 'jpeg') pipe = pipe.jpeg({ quality: JPG_QUALITY, mozjpeg: true });
      else if (ext === 'png')              pipe = pipe.png({ compressionLevel: 9, palette: true });
      else if (ext === 'webp')             pipe = pipe.webp({ quality: 85 });
      const buf = await pipe.toBuffer();
      if (buf.length < file.size * 0.95) {
        // overwrite using writeFileSync — opens with O_TRUNC, works even if other readers have shared access
        fs.writeFileSync(file.path, buf);
        savedTotal += (file.size - buf.length);
        succ++;
        if (i % 5 === 0 || i === targets.length - 1) {
          process.stdout.write(`  [${i+1}/${targets.length}] ${path.basename(file.path)}  ${(file.size/1024).toFixed(0)}KB → ${(buf.length/1024).toFixed(0)}KB\n`);
        }
      } else {
        skip++;
      }
    } catch (err) {
      fail++;
      console.error('  FAILED:', path.basename(file.path), err.message);
    }
  }
  console.log(`\n✓ Compressed: ${succ} | Skipped (already small): ${skip} | Failed: ${fail}`);
  console.log(`✓ Saved ${(savedTotal/1048576).toFixed(0)}MB.`);
})();
