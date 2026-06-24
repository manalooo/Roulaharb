const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');
const cp = require('child_process');
// Disable internal file cache + concurrency — Windows otherwise holds locks across calls
sharp.cache(false);
sharp.concurrency(1);

const ROOT = path.join(__dirname, '..', 'images');
const MIN_BYTES = 500 * 1024; // only touch files over 500KB

// Per-folder policy. Stickers are decorative → squeeze hard; artwork/products kept crisp.
function policy(p) {
  const u = p.replace(/\\/g, '/');
  if (/\/logos\//.test(u))     return null;                                   // leave logos alone
  if (/\/stickers\//.test(u))  return { max: 1000, jpg: 78, palette: true };  // decorative → aggressive
  if (/\/paintings\//.test(u)) return { max: 2200, jpg: 88, palette: false }; // artwork → gentle
  if (/\/hero\//.test(u))      return { max: 2000, jpg: 84, palette: false };
  return { max: 1500, jpg: 84, palette: true };                               // products (jookh, plo)
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) out.push({ path: full, size: stat.size });
  }
  return out;
}

function writeRetry(file, buf) {
  for (let k = 0; k < 12; k++) { try { fs.writeFileSync(file, buf); return true; } catch (e) { cp.execSync('powershell -NoProfile -Command "Start-Sleep -Milliseconds 600"'); } }
  return false;
}

(async () => {
  const targets = walk(ROOT).filter(f => f.size > MIN_BYTES && policy(f.path));
  const beforeTotal = targets.reduce((s, f) => s + f.size, 0);
  console.log(`Compressing ${targets.length} files (${(beforeTotal/1048576).toFixed(0)}MB)...`);

  let savedTotal = 0, succ = 0, skip = 0, fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const file = targets[i];
    const pol = policy(file.path);
    const ext = path.extname(file.path).toLowerCase().slice(1);
    try {
      const img = sharp(file.path).rotate();
      const meta = await img.metadata();
      let pipe = img.resize({ width: pol.max, height: pol.max, fit: 'inside', withoutEnlargement: true });
      if (ext === 'png')        pipe = pipe.png({ compressionLevel: 9, palette: pol.palette, quality: pol.jpg, effort: 8 });
      else if (ext === 'webp')  pipe = pipe.webp({ quality: pol.jpg });
      else                      pipe = pipe.jpeg({ quality: pol.jpg, mozjpeg: true });
      const buf = await pipe.toBuffer();
      if (buf.length < file.size * 0.95 && writeRetry(file.path, buf)) {
        savedTotal += (file.size - buf.length); succ++;
        console.log(`  ${(file.size/1024).toFixed(0)}KB -> ${(buf.length/1024).toFixed(0)}KB  ${file.path.replace(/\\/g,'/').replace(/.*images\//,'images/')}`);
      } else skip++;
    } catch (err) { fail++; console.error('  FAILED:', path.basename(file.path), err.message); }
  }
  console.log(`\n✓ Compressed ${succ} | Skipped ${skip} | Failed ${fail} | Saved ${(savedTotal/1048576).toFixed(1)}MB`);
})();
