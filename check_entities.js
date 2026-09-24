const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));

// Find sample NPC names like "Kromede", "Tahabata", "Tiamat", "Spatalos", "Pernos", "Munin"
const testNames = ['Kromede', 'Tahabata', 'Tiamat', 'Spatalos', 'Pernos', 'Munin', 'Telemachus', 'Vegir'];
console.log('Searching for known NPC/Boss names in official_en-US:');
for (const name of testNames) {
  for (const [k, v] of Object.entries(enData)) {
    if (v === name || (typeof v === 'string' && (v.startsWith(name + ' ') || v.endsWith(' ' + name)))) {
      console.log(`Match for "${name}": [${k}] = "${v}" (in current: "${currentData[k]}")`);
      break;
    }
  }
}

// Find sample Skill names like "Flame Bolt", "Judgement", "Ferocious Strike"
const testSkills = ['Flame Bolt', 'Ferocious Strike', 'Hydro Eruption', 'Soul Frozen'];
console.log('\nSearching for known Skill names in official_en-US:');
for (const skill of testSkills) {
  for (const [k, v] of Object.entries(enData)) {
    if (v === skill || (typeof v === 'string' && v.includes(skill) && k.includes('Skill'))) {
      console.log(`Match for "${skill}": [${k}] = "${v}" (in current: "${currentData[k]}")`);
      break;
    }
  }
}

// Check String_STR_ITEM pattern
console.log('\nChecking String_STR_ITEM patterns:');
let itemCount = 0, itemDescCount = 0;
for (const k of Object.keys(enData)) {
  if (k.startsWith('String_STR_ITEM_')) {
    if (k.includes('_DESC_')) itemDescCount++;
    else itemCount++;
  }
}
console.log(`Item names count: ${itemCount}, Item desc count: ${itemDescCount}`);

// Let's print a sample item name and its desc
for (const k of Object.keys(enData)) {
  if (k.startsWith('String_STR_ITEM_') && !k.includes('_DESC_') && enData[k] && enData[k] !== '<DNT>') {
    const descKey = k.replace('String_STR_ITEM_', 'String_STR_ITEM_DESC_');
    console.log(`Item sample:`);
    console.log(`  Name key: ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
    console.log(`  Desc key: ${descKey} => EN: "${enData[descKey]?.slice(0, 50)}" | CURR: "${currentData[descKey]?.slice(0, 50)}"`);
    break;
  }
}
