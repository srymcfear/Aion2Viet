const fs = require('fs');

console.log('Loading official_en-US_strings.json...');
const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));

const keys = Object.keys(enData);
console.log('Total keys in official:', keys.length);
console.log('Total keys in current translation:', Object.keys(currentData).length);

const patterns = {
  itemNames: 0,
  itemDesc: 0,
  skillNames: 0,
  skillDesc: 0,
  npcNames: 0,
  npcTalk: 0,
  questTitles: 0,
  questDesc: 0,
  places: 0,
  cutscenes: 0,
  systemUI: 0,
  achievements: 0,
  others: 0
};

const sampleMatches = {};

for (const k of keys) {
  if (k.startsWith('String_STR_ITEM_') && (k.endsWith('_name') || !k.includes('_DESC_'))) {
    // Check item name patterns
    patterns.itemNames++;
  } else if (k.includes('_DESC_') || k.endsWith('_desc') || k.endsWith('_effect') || k.endsWith('_tooltip')) {
    patterns.itemDesc++;
  } else if (k.startsWith('SkillString_') && k.endsWith('_name')) {
    patterns.skillNames++;
  } else if (k.startsWith('SkillString_') && (k.endsWith('_desc') || k.endsWith('_effect'))) {
    patterns.skillDesc++;
  } else if (k.startsWith('NpcString_') && k.endsWith('_name')) {
    patterns.npcNames++;
  } else if (k.startsWith('NpcTalk_') || k.includes('Dialogue') || k.includes('Talk_')) {
    patterns.npcTalk++;
  } else if (k.startsWith('QuestString_')) {
    patterns.questDesc++;
  } else if (k.startsWith('CutsceneSubtitle_')) {
    patterns.cutscenes++;
  } else {
    patterns.others++;
  }
}

console.log('Patterns summary:', JSON.stringify(patterns, null, 2));
