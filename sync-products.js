#!/usr/bin/env node
/**
 * sync-products.js
 * Reads inventory.csv and generates:
 *   data/products.json  — raw data (used by the website via fetch)
 *   data/products.js    — window.PRODUCTS wrapper (fallback for file:// access)
 *
 * Usage:
 *   node sync-products.js
 *
 * After running, refresh your browser — the website will show updated products.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const CSV_FILE  = path.join(__dirname, 'inventory.csv');
const JSON_FILE = path.join(__dirname, 'data', 'products.json');
const JS_FILE   = path.join(__dirname, 'data', 'products.js');

// ─── CSV PARSER ──────────────────────────────────────────────────────────────
// Handles quoted fields (values that contain commas), CRLF and LF line endings.

function parseCSV(text) {
  // Normalise line endings
  var lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Remove blank trailing lines
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  if (lines.length < 2) {
    console.error('ERROR: inventory.csv has no data rows.');
    process.exit(1);
  }

  var headers = splitLine(lines[0]);
  var rows    = [];

  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var values = splitLine(lines[i]);
    var row    = {};
    headers.forEach(function (h, idx) {
      row[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

// Split one CSV line into fields, respecting double-quoted fields.
function splitLine(line) {
  var fields = [];
  var field  = '';
  var inQ    = false;

  for (var c = 0; c < line.length; c++) {
    var ch   = line[c];
    var next = line[c + 1];

    if (inQ) {
      if (ch === '"' && next === '"') { field += '"'; c++; }   // escaped quote
      else if (ch === '"')            { inQ = false; }          // closing quote
      else                            { field += ch; }
    } else {
      if (ch === '"')  { inQ = true; }
      else if (ch === ',') { fields.push(field); field = ''; }
      else             { field += ch; }
    }
  }
  fields.push(field);
  return fields;
}

// ─── EXTRA VIEW DETECTION ────────────────────────────────────────────────────
// For products whose Main_Image follows the pattern …/piece-N-view-1.ext,
// this function scans the filesystem for view-3, view-4, … and returns them.
// This preserves all lightbox images even though the CSV only shows main+hover.

function detectExtraViews(mainImage) {
  if (!mainImage) return [];

  // Match: everything up to and including "view-1" then the extension
  var match = mainImage.match(/^(.+?-view-)1(\.\w+)$/);
  if (!match) return [];

  var prefix = match[1]; // e.g. "images/jookh/wearables/piece-1-view-"
  var ext    = match[2]; // e.g. ".jpeg"
  var extras = [];

  for (var n = 3; n <= 30; n++) {
    // Try clean extension first, then the .jpg.jpeg double-extension variant
    var candidates = [
      prefix + n + ext,
      prefix + n + '.jpg' + ext
    ];

    var found = false;
    for (var j = 0; j < candidates.length; j++) {
      var abs = path.join(__dirname, candidates[j]);
      if (fs.existsSync(abs)) {
        extras.push(candidates[j]);
        found = true;
        break;
      }
    }

    // Stop scanning once there is a gap
    if (!found) break;
  }

  return extras;
}

// ─── COLLECTION MAPPING ──────────────────────────────────────────────────────

function collectionFor(category) {
  return category === 'pillows' ? 'P-Lo' : 'Jookh Couture';
}

// ─── BUILD PRODUCT ───────────────────────────────────────────────────────────

function buildProduct(row) {
  var category        = (row.Category        || '').toLowerCase().trim();
  var status          = ((row.Status || row.sold) || 'available').toLowerCase().trim();
  var subcollection   = (row.Subcollection   || '').trim();
  var collectionLine  = (row.Collection_Line || '').trim();
  var era             = (row.Era             || '').trim().toLowerCase(); // 'new' | 'archive' | ''
  if (status !== 'sold') status = 'available';

  // Build views array: main → hover → explicit Extra_Views column → any auto-detected on disk
  var views = [row.Main_Image, row.Hover_Image].filter(function (v) {
    return v && v.trim() !== '';
  });

  (row.Extra_Views || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (v) {
    if (views.indexOf(v) === -1) views.push(v);
  });

  var extras = detectExtraViews(row.Main_Image);
  extras.forEach(function (v) {
    if (views.indexOf(v) === -1) views.push(v);
  });

  var product = {
    id:         row.ID,
    name:       row.Name,
    category:   category,
    collection: collectionFor(category),
    price:      row.Price,
    medium:     row.Material,
    edition:    'One-of-a-kind \u00b7 Signed by the artist',
    views:          views,
    status:         status
  };

  // Only include subcollection / collection_line / era if filled in
  if (subcollection)  product.subcollection  = subcollection;
  if (collectionLine) product.collection_line = collectionLine;
  if (era)            product.era            = era; // 'new' | 'archive'

  // Catalogue metadata \u2014 only emitted when filled in. Powers the Collection-page
  // refine filters (Type / Colour / Fit / Motif). Empty cells are simply omitted.
  var meta = {
    type:      (row.Type      || '').trim(),
    color:     (row.Color     || '').trim(),
    fit:       (row.Fit       || '').trim(),
    motif:     (row.Motif     || '').trim(),
    technique: (row.Technique || '').trim()
  };
  Object.keys(meta).forEach(function (k) { if (meta[k]) product[k] = meta[k]; });

  return product;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(CSV_FILE)) {
  console.error('ERROR: inventory.csv not found at ' + CSV_FILE);
  process.exit(1);
}

// Ensure data/ directory exists
var dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

var rows     = parseCSV(fs.readFileSync(CSV_FILE, 'utf8'));   // Jookh
var PLO_FILE = path.join(__dirname, 'inventory-plo.csv');     // P-Lo (pillows + paintings)
if (fs.existsSync(PLO_FILE)) {
  rows = rows.concat(parseCSV(fs.readFileSync(PLO_FILE, 'utf8')));
}
var products = rows.map(buildProduct);

// Validate: warn if placeholder values remain
var placeholderCount = products.filter(function (p) {
  return p.name.indexOf('ENTER') !== -1;
}).length;

// Write data/products.json
var jsonContent = JSON.stringify(products, null, 2);
fs.writeFileSync(JSON_FILE, jsonContent, 'utf8');
console.log('\u2713 data/products.json  \u2014 ' + products.length + ' products written');

// Write data/products.js (window.PRODUCTS wrapper for file:// fallback)
var jsContent =
  '/* Auto-generated by sync-products.js — do not edit manually.\n' +
  '   Edit inventory.csv then run:  node sync-products.js          */\n' +
  'window.PRODUCTS = ' + jsonContent + ';\n';
fs.writeFileSync(JS_FILE, jsContent, 'utf8');
console.log('\u2713 data/products.js   \u2014 window.PRODUCTS ready');

// Summary
var byCategory = {};
products.forEach(function (p) {
  byCategory[p.category] = (byCategory[p.category] || 0) + 1;
});
console.log('\nBreakdown:');
Object.keys(byCategory).sort().forEach(function (cat) {
  console.log('  ' + cat + ': ' + byCategory[cat]);
});

if (placeholderCount > 0) {
  console.log('\n\u26a0  ' + placeholderCount + ' product(s) still have placeholder values.');
  console.log('   Open inventory.csv, fill in Name / Price / Story, then re-run.');
}

// Regenerate the per-piece pages (/piece/<id>/) + sitemap from the fresh products.json.
try {
  require('child_process').execSync('node ' + path.join(__dirname, 'scripts', 'gen-piece-pages.js'), { stdio: 'inherit' });
} catch (e) {
  console.log('⚠  Could not regenerate piece pages: ' + e.message);
}

console.log('\nDone. Refresh your browser to see the changes.');
