const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

const strCategories = new Map();
for (const k of keys) {
  if (k.startsWith('String_STR_')) {
    const parts = k.slice('String_STR_'.length).split('_');
    const sub = parts[0];
    strCategories.set(sub, (strCategories.get(sub) || 0) + 1);
  }
}

console.log('All String_STR_ sub-types:');
for (const [sub, count] of [...strCategories.entries()].sort((a,b)=>b[1]-a[1])) {
  const sampleKey = keys.find(k => k.startsWith(`String_STR_${sub}_`) || k === `String_STR_${sub}`);
  console.log(`${sub.padEnd(20)} : ${count.toString().padStart(6)} (EN: "${enData[sampleKey]?.slice(0, 30)}") (CURR: "${currentData[sampleKey]?.slice(0, 30)}")`);
}
