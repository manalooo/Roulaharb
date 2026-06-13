#!/usr/bin/env node
/**
 * Process new wearable screenshots into standard product files.
 * Assumes consecutive pairs = (view-1, view-2) of one product.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = 'images/jookh/wearables';
const csvPath = 'inventory.csv';
const mappingPath = 'new-wearables-mapping.csv';

function parseCsvLine(line) {
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function pad2(n) { return String(n).padStart(2, '0'); }

(async () => {
  // Source screenshots sorted
  const screenshots = fs.readdirSync(srcDir)
    .filter(f => /^Capture d'.*\.png$/i.test(f))
    .sort();

  if (!screenshots.length) {
    console.log('No new screenshots found.');
    return;
  }

  // Find next wear ID
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvLines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  const header = parseCsvLine(csvLines[0]);
  const idIdx = header.indexOf('ID');
  let maxWear = 0;
  for (let i = 1; i < csvLines.length; i++) {
    const id = parseCsvLine(csvLines[i])[idIdx];
    const m = String(id).match(/^wear-(\d+)$/i);
    if (m) maxWear = Math.max(maxWear, parseInt(m[1], 10));
  }

  const pairs = [];
  for (let i = 0; i < screenshots.length; i += 2) {
    pairs.push({
      idNum: maxWear + 1 + Math.floor(i / 2),
      view1: screenshots[i],
      view2: screenshots[i + 1] || null,
    });
  }

  const mappingLines = ['product_id,name,view1,view2'];
  const newCsvLines = [];

  for (const p of pairs) {
    const id = `wear-${p.idNum}`;
    const pieceNum = p.idNum;
    const name = `Levi's x Jookh ${pad2(p.idNum - maxWear)}`;

    // Process view 1
    const out1 = `piece-${pieceNum}-view-1.jpg`;
    await sharp(path.join(srcDir, p.view1))
      .jpeg({ quality: 90, progressive: true })
      .toFile(path.join(srcDir, out1));
    fs.unlinkSync(path.join(srcDir, p.view1));

    let out2 = '';
    if (p.view2) {
      out2 = `piece-${pieceNum}-view-2.jpg`;
      await sharp(path.join(srcDir, p.view2))
        .jpeg({ quality: 90, progressive: true })
        .toFile(path.join(srcDir, out2));
      fs.unlinkSync(path.join(srcDir, p.view2));
    }

    mappingLines.push([id, name, p.view1, p.view2 || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const mainImg = `images/jookh/wearables/${out1}`;
    const hoverImg = out2 ? `images/jookh/wearables/${out2}` : '';
    newCsvLines.push(`${id},${name},wearables,Levi's x Jookh,Essential,,available,ENTER PRICE HERE,ENTER MATERIAL HERE,${mainImg},${hoverImg},`);
  }

  // Append to inventory.csv
  fs.writeFileSync(csvPath, csvLines.join('\r\n') + '\r\n' + newCsvLines.join('\r\n') + '\r\n', 'utf8');
  fs.writeFileSync(mappingPath, mappingLines.join('\r\n') + '\r\n', 'utf8');

  console.log(`Processed ${screenshots.length} images into ${pairs.length} products (wear-${maxWear + 1} → wear-${maxWear + pairs.length})`);
  console.log('Updated inventory.csv');
  console.log('Saved mapping to', mappingPath);
})();
