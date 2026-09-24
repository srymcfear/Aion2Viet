const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

const skillKeys = keys.filter(k => k.startsWith('SkillString_'));
console.log('SkillString total:', skillKeys.length);

const skillSuffixes = new Map();
for (const k of skillKeys) {
  const parts = k.split('_');
  const suf = parts.slice(-2).join('_');
  skillSuffixes.set(suf, (skillSuffixes.get(suf) || 0) + 1);
}
console.log('SkillString sub-suffixes:', [...skillSuffixes.entries()].sort((a,b)=>b[1]-a[1]));

for (const suf of [...skillSuffixes.keys()].slice(0, 5)) {
  const k = skillKeys.find(key => key.endsWith(suf));
  console.log(`Sample ${suf}: ${k} => EN: "${enData[k]}" | CURR: "${currentData[k]}"`);
}
