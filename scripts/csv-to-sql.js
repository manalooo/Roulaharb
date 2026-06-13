#!/usr/bin/env node
/* Reads inventory.csv → writes db/seed.sql with INSERT statements.
   Strips the leading "images/" from image paths since IMAGE_BASE prefixes that. */
const fs = require('fs');
const path = require('path');

const CSV  = path.join(__dirname, '..', 'inventory.csv');
const OUT  = path.join(__dirname, '..', 'db', 'seed.sql');

const csv = fs.readFileSync(CSV, 'utf8').trim();
const lines = csv.split(/\r?\n/);
const header = lines.shift().split(',');

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
function sqlQ(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function stripImg(p) {
  if (!p) return null;
  return p.replace(/^images\//, '');
}

const rows = [];
let order = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  const cells = parseCsvLine(line);
  const obj = {};
  header.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
  rows.push({
    id: obj.ID,
    name: obj.Name,
    category: obj.Category,
    subcollection: obj.Subcollection || null,
    collection_line: obj.Collection_Line || null,
    era: obj.Era || null,
    status: obj.Status || 'available',
    price: obj.Price || null,
    material: obj.Material || null,
    main_image: stripImg(obj.Main_Image),
    hover_image: stripImg(obj.Hover_Image),
    // Extra_Views: pipe-separated list of extra image paths (e.g. "images/paintings/piece-7.jpg|images/paintings/piece-8.jpg")
    extra_views: (() => {
      const raw = (obj.Extra_Views || '').trim();
      if (!raw) return null;
      const arr = raw.split('|').map(s => stripImg(s.trim())).filter(Boolean);
      return arr.length ? JSON.stringify(arr) : null;
    })(),
    sort_order: order++,
  });
}

let sql = '-- Auto-generated from inventory.csv by scripts/csv-to-sql.js\n';
sql += '-- Run with: wrangler d1 execute roulaharb-products --remote --file=db/seed.sql\n\n';
sql += 'DELETE FROM products;\n\n';
for (const r of rows) {
  sql += `INSERT INTO products (id, name, category, subcollection, collection_line, era, status, price, material, main_image, hover_image, extra_views, sort_order) VALUES (`
    + `${sqlQ(r.id)}, ${sqlQ(r.name)}, ${sqlQ(r.category)}, ${sqlQ(r.subcollection)}, ${sqlQ(r.collection_line)}, ${sqlQ(r.era)}, ${sqlQ(r.status)}, ${sqlQ(r.price)}, ${sqlQ(r.material)}, ${sqlQ(r.main_image)}, ${sqlQ(r.hover_image)}, ${sqlQ(r.extra_views)}, ${r.sort_order});\n`;
}

fs.writeFileSync(OUT, sql);
console.log(`✓ Wrote ${rows.length} INSERT statements to db/seed.sql`);
