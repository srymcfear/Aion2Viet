const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

const stringSubPatterns = new Map();
for (const k of keys) {
  if (k.startsWith('String_')) {
    const parts = k.split('_');
    // e.g. String_STR_ITEM_...
    const sub = parts.slice(0, 3).join('_');
    stringSubPatterns.set(sub, (stringSubPatterns.get(sub) || 0) + 1);
  }
}

console.log('Top String_ sub-patterns:');
for (const [sub, count] of [...stringSubPatterns.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 30)) {
  const sampleKey = keys.find(k => k.startsWith(sub));
  console.log(`${sub.padEnd(30)} : ${count.toString().padStart(6)} (EN: "${enData[sampleKey]?.slice(0, 40)}") (CURR: "${currentData[sampleKey]?.slice(0, 40)}")`);
}
