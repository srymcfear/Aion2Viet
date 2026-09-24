const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

// Let's search for keys containing NPC, Boss, Monster
const npcKeys = [];
for (const k of keys) {
  const kl = k.toLowerCase();
  if (kl.includes('npc') || kl.includes('boss') || kl.includes('monster') || kl.includes('creature')) {
    npcKeys.push(k);
  }
}

console.log('Total keys with npc/boss/monster/creature:', npcKeys.length);
const prefixCount = {};
for (const k of npcKeys) {
  const p = k.split('_').slice(0, 2).join('_');
  prefixCount[p] = (prefixCount[p] || 0) + 1;
}
console.log('Top prefixes in npcKeys:', Object.entries(prefixCount).sort((a,b)=>b[1]-a[1]).slice(0, 15));

// What about String_STR_N_ ?
const strNKeys = keys.filter(k => k.startsWith('String_STR_N_'));
console.log('String_STR_N_ count:', strNKeys.length);
for (const k of strNKeys.slice(0, 10)) {
  console.log(`  ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}

// What about String_STR_M_ ?
const strMKeys = keys.filter(k => k.startsWith('String_STR_M_'));
console.log('String_STR_M_ count:', strMKeys.length);
for (const k of strMKeys.slice(0, 10)) {
  console.log(`  ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}
