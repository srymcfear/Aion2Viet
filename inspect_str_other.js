const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

const strKeys = keys.filter(k => k.startsWith('String_STR_'));
console.log('Total String_STR_ keys:', strKeys.length);

const subGroups = new Map();
for (const k of strKeys) {
  // Already handled: String_STR_ITEM_, String_STR_M_, String_STR_N_, String_STR_Subzone_, String_STR_GODSTONE_, String_STR_PERIOD_
  if (k.startsWith('String_STR_ITEM_') || k.startsWith('String_STR_M_') || k.startsWith('String_STR_N_') ||
      k.startsWith('String_STR_Subzone_') || k.startsWith('String_STR_GODSTONE_') || k.startsWith('String_STR_PERIOD_')) {
    continue;
  }
  const parts = k.slice('String_STR_'.length).split('_');
  const g = parts[0];
  subGroups.set(g, (subGroups.get(g) || 0) + 1);
}

console.log('Other String_STR_ sub-groups:');
for (const [g, c] of [...subGroups.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 35)) {
  const sample = strKeys.find(k => k.startsWith(`String_STR_${g}_`) || k === `String_STR_${g}`);
  console.log(`${g.padEnd(25)} : ${c.toString().padStart(6)} (EN: "${enData[sample]?.slice(0, 35)}") (VN: "${currentData[sample]?.slice(0, 35)}")`);
}
