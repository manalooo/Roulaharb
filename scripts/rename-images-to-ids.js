#!/usr/bin/env node
/**
 * Rename product image files to match product IDs.
 * Main  -> <id>-view-1.<ext>
 * Hover -> <id>-view-2.<ext>
 * Extra -> <id>-view-3.<ext>, etc.
 * Updates inventory.csv paths and re-syncs products + seed SQL.
 */
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'inventory.csv');
const TEMP_SUFFIX = '.___tmp___';

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

function extOf(p) {
  return path.extname(p).toLowerCase();
}

function renameFile(oldPath, newPath) {
  const absOld = path.join(__dirname, '..', oldPath);
  const absNew = path.join(__dirname, '..', newPath);
  if (!fs.existsSync(absOld)) {
    console.warn('  ! missing', oldPath);
    return false;
  }
  if (fs.existsSync(absNew)) {
    console.warn('  ! target exists', newPath);
    return false;
  }
  fs.renameSync(absOld, absNew);
  return true;
}

const csvText = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
const header = parseCsvLine(lines[0]);
const idx = {
  id: header.indexOf('ID'),
  main: header.indexOf('Main_Image'),
  hover: header.indexOf('Hover_Image'),
  extra: header.indexOf('Extra_Views'),
};

const outLines = [lines[0]];
let renamedCount = 0;

for (let i = 1; i < lines.length; i++) {
  const cells = parseCsvLine(lines[i]);
  const id = cells[idx.id];
  const oldPaths = [cells[idx.main], cells[idx.hover]].filter(Boolean);
  const extrasRaw = cells[idx.extra] || '';
  const extras = extrasRaw.split('|').map(s => s.trim()).filter(Boolean);
  const allOldPaths = oldPaths.concat(extras);

  const newPaths = [];

  // First pass: rename to temp names to avoid collisions
  const tempPaths = [];
  allOldPaths.forEach((oldPath, n) => {
    const dir = path.dirname(oldPath);
    const ext = extOf(oldPath);
    const tempName = `${id}-view-${n + 1}${ext}${TEMP_SUFFIX}`;
    const tempPath = path.join(dir, tempName).replace(/\\/g, '/');
    if (renameFile(oldPath, tempPath)) {
      tempPaths.push(tempPath);
    } else {
      tempPaths.push(oldPath); // keep old if rename failed
    }
  });

  // Second pass: remove temp suffix
  tempPaths.forEach((tempPath, n) => {
    if (!tempPath.endsWith(TEMP_SUFFIX)) {
      newPaths.push(tempPath);
      return;
    }
    const dir = path.dirname(tempPath);
    const ext = extOf(tempPath.replace(TEMP_SUFFIX, ''));
    const newName = `${id}-view-${n + 1}${ext}`;
    const newPath = path.join(dir, newName).replace(/\\/g, '/');
    const absTemp = path.join(__dirname, '..', tempPath);
    const absNew = path.join(__dirname, '..', newPath);
    if (fs.existsSync(absNew)) {
      console.warn('  ! target exists (final)', newPath);
      newPaths.push(tempPath);
      return;
    }
    fs.renameSync(absTemp, absNew);
    newPaths.push(newPath);
    renamedCount++;
  });

  cells[idx.main] = newPaths[0] || '';
  cells[idx.hover] = newPaths[1] || '';
  cells[idx.extra] = newPaths.slice(2).join('|');
  outLines.push(cells.join(','));
}

fs.writeFileSync(CSV_PATH, outLines.join('\r\n') + '\r\n', 'utf8');
console.log(`Renamed ${renamedCount} image files.`);
console.log('Updated inventory.csv');
