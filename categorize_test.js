const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

function shouldKeepEnglish(key) {
  // 1. Skill Names
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;

  // 2. Item Names
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GODSTONE_')) return true;
  if (key.startsWith('String_STR_PERIOD_')) return true;

  // 3. NPC & Character Names
  if (key.startsWith('String_STR_N_')) return true;
  if (key.startsWith('AnonymousNameData_')) return true;

  // 4. Monster & Boss Names
  if (key.startsWith('String_STR_M_')) return true;

  // 5. Locations & Subzones & Servers
  if (key.startsWith('String_STR_Subzone_')) return true;
  if (key.startsWith('ServerName_')) return true;

  return false;
}

let keepEnCount = 0;
let translateCount = 0;

for (const k of keys) {
  if (shouldKeepEnglish(k)) {
    keepEnCount++;
  } else {
    translateCount++;
  }
}

console.log(`Total Keys: ${keys.length}`);
console.log(`Keys kept in English: ${keepEnCount}`);
console.log(`Keys kept in Vietnamese (translated): ${translateCount}`);
