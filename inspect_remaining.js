const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

function shouldKeepEnglish(key) {
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GODSTONE_')) return true;
  if (key.startsWith('String_STR_PERIOD_')) return true;
  if (key.startsWith('String_STR_N_')) return true;
  if (key.startsWith('AnonymousNameData_')) return true;
  if (key.startsWith('String_STR_M_')) return true;
  if (key.startsWith('String_STR_Subzone_')) return true;
  if (key.startsWith('ServerName_')) return true;
  return false;
}

const remainingKeys = keys.filter(k => !shouldKeepEnglish(k));
const remainingPrefixes = new Map();

for (const k of remainingKeys) {
  const parts = k.split('_');
  const p = parts.slice(0, 2).join('_');
  remainingPrefixes.set(p, (remainingPrefixes.get(p) || 0) + 1);
}

console.log('Top 40 remaining prefixes:');
for (const [p, c] of [...remainingPrefixes.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 40)) {
  const sample = remainingKeys.find(k => k.startsWith(p));
  console.log(`${p.padEnd(35)} : ${c.toString().padStart(6)} (EN: "${enData[sample]?.slice(0, 30)}") (VN: "${currentData[sample]?.slice(0, 30)}")`);
}
