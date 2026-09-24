const fs = require('fs');

const data = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const en = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));

console.log('=== SAMPLE VERIFICATION CHECKS ===\n');

// 1. Skill Name vs Skill Desc
const skillNameKey = 'SkillString_SkillString_ETC_4333_skill_name';
const skillDescKey = 'SkillString_STR_SKILL_PC_ASSASSIN_13350040_specialized_skill_desc';
console.log('1. Skill Name:');
console.log(`   [${skillNameKey}] => "${data[skillNameKey]}" (Original EN: "${en[skillNameKey]}")`);
console.log('   Skill Desc:');
console.log(`   [${skillDescKey}] => "${data[skillDescKey]}"\n`);

// 2. Item Name vs Item Desc
const itemNameKey = 'String_STR_ITEM_AGITDECO_SMALL_061A_B_body';
const itemDescKey = Object.keys(data).find(k => k.startsWith('String_STR_ITEM_') && k.includes('_DESC_') && data[k]?.length > 20);
console.log('2. Item Name:');
console.log(`   [${itemNameKey}] => "${data[itemNameKey]}" (Original EN: "${en[itemNameKey]}")`);
console.log('   Item Desc:');
console.log(`   [${itemDescKey}] => "${data[itemDescKey]}"\n`);

// 3. NPC Name vs NPC Dialogue
const npcNameKey = 'String_STR_N_L1_Lucy_body';
const npcDialogueKey = 'NpcTalk_1231A627B7094098B25E2F26E9446BB5_cv_text';
console.log('3. NPC Name:');
console.log(`   [${npcNameKey}] => "${data[npcNameKey]}"`);
console.log('   NPC Dialogue:');
console.log(`   [${npcDialogueKey}] => "${data[npcDialogueKey]}"\n`);

// 4. Boss Name vs Boss Kill Achievement
const bossNameKey = 'String_STR_M_PD_DeusCenter_Nazmun_01_body';
const bossAchieveKey = 'AchievementString_Archieve_STR_Group_D_Challenge_Boss_412104701_obj_desc';
console.log('4. Boss Name:');
console.log(`   [${bossNameKey}] => "${data[bossNameKey]}"`);
console.log('   Boss Achievement:');
console.log(`   [${bossAchieveKey}] => "${data[bossAchieveKey]}"\n`);

// 5. Subzone Name vs Monolith Fragment
const subzoneKey = 'String_STR_Subzone_Verteron_Observatory_body';
const monolithKey = 'String_STR_GROUP_UNLOCK_MONOLITHFRAGMENT_VERTERON_15_body';
console.log('5. Subzone:');
console.log(`   [${subzoneKey}] => "${data[subzoneKey]}"`);
console.log('   Monolith Fragment:');
console.log(`   [${monolithKey}] => "${data[monolithKey]}"\n`);

// 6. UI & Menu
const uiKey1 = 'String_UI_TRADE_TRADE_02_body';
const uiKey2 = 'InputKeyMapping_UI_Trade_desc';
console.log('6. UI & Menu:');
console.log(`   [${uiKey1}] => "${data[uiKey1]}"`);
console.log(`   [${uiKey2}] => "${data[uiKey2]}"\n`);

// 7. Quest & Cutscene Subtitle
const questKey = 'QuestString_STR_AQ1602000_step1_obj_1';
const cutsceneKey = 'CutsceneSubtitle_S2072_Eco_01_cv_text';
console.log('7. Quest Objective:');
console.log(`   [${questKey}] => "${data[questKey]}"`);
console.log('   Cutscene Subtitle:');
console.log(`   [${cutsceneKey}] => "${data[cutsceneKey]}"\n`);

// 8. Manastone & Soulstone in Enhancement Achievement
const enhanceKey = 'AchievementString_Archieve_STR_Group_D_Item_Enhance_443100803_obj_desc';
console.log('8. Enhanced Terminology (Manastone / Soulstone):');
console.log(`   [${enhanceKey}] => "${data[enhanceKey]}"\n`);
