const fs = require('fs');
const lines = fs.readFileSync('inventory.csv', 'utf8').split(/\r?\n/).filter(l => l.trim());
const header = lines[0].split(',');
const idIdx = header.indexOf('ID');
const nameIdx = header.indexOf('Name');
const catIdx = header.indexOf('Category');
const rows = lines.slice(1).map(l => { const c = l.split(','); return { id: c[idIdx], name: c[nameIdx], cat: c[catIdx] }; });

console.log('Total rows', rows.length);

const counts = {};
rows.forEach(r => { counts[r.name] = (counts[r.name] || 0) + 1; });
const dups = Object.entries(counts).filter(([k, v]) => v > 1).sort((a, b) => b[1] - a[1]);
console.log('\nDuplicate names:', dups.length);
dups.slice(0, 30).forEach(([name, count]) => console.log(count, name));

console.log('\nPlaceholder Levi names count:', rows.filter(r => /Levi's x Jookh \d+/.test(r.name)).length);

console.log('\nNames with double quotes or backslash:');
rows.filter(r => /["\\]/.test(r.name)).forEach(r => console.log(r.id, JSON.stringify(r.name)));

console.log('\nEmpty names:');
rows.filter(r => !r.name.trim()).forEach(r => console.log(r.id));
