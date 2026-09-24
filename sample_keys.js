const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

// Let's find all unique prefixes up to 2 underscores or semantic groups
const categories = {
  // To identify
};

// Check keys matching NPC
const npcSampleKeys = keys.filter(k => k.toLowerCase().includes('npc') || k.toLowerCase().includes('monster') || k.startsWith('String_STR_N_'));
console.log('Sample NPC/Monster keys (first 20):');
for (const k of npcSampleKeys.slice(0, 20)) {
  console.log(`  ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}

// Check keys matching Skill
const skillSampleKeys = keys.filter(k => k.toLowerCase().includes('skill'));
console.log('\nSample Skill keys (first 20):');
for (const k of skillSampleKeys.slice(0, 20)) {
  console.log(`  ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}

// Check keys matching Zone / Location
const zoneSampleKeys = keys.filter(k => k.toLowerCase().includes('zone') || k.toLowerCase().includes('world') || k.toLowerCase().includes('teleport') || k.toLowerCase().includes('map'));
console.log('\nSample Zone/Location/Teleport keys (first 20):');
for (const k of zoneSampleKeys.slice(0, 20)) {
  console.log(`  ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}
