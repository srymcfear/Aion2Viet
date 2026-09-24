const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

const prefixMap = new Map();
const suffixMap = new Map();

for (const k of keys) {
  const parts = k.split('_');
  const prefix = parts[0];
  const suffix = parts.length > 1 ? parts[parts.length - 1] : '';
  prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
  suffixMap.set(suffix, (suffixMap.get(suffix) || 0) + 1);
}

console.log('--- Top 20 Prefixes ---');
const sortedPrefixes = [...prefixMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [p, c] of sortedPrefixes) {
  // Find a sample key
  const sampleKey = keys.find(k => k.startsWith(p + '_')) || p;
  console.log(`${p.padEnd(25)} : ${c.toString().padStart(6)} (e.g. ${sampleKey} = "${enData[sampleKey]?.slice(0, 30)}")`);
}

console.log('\n--- Top 20 Suffixes ---');
const sortedSuffixes = [...suffixMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [s, c] of sortedSuffixes) {
  const sampleKey = keys.find(k => k.endsWith('_' + s)) || s;
  console.log(`${s.padEnd(25)} : ${c.toString().padStart(6)} (e.g. ${sampleKey} = "${enData[sampleKey]?.slice(0, 30)}")`);
}
