const fs = require('fs');

console.log('Loading official EN and current translations...');
const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

// 1. Defined list of single location keys
const knownSingleLocations = new Set([
  'String_STR_SnowbreathOutpost_body',
  'String_STR_TaytraTerritory_body',
  'String_STR_DestinyFortress_body',
  'String_STR_ArkanisSkyTempleEntrance_body',
  'String_STR_SleetOutpost_body',
  'String_STR_Patamorlake_body',
  'String_STR_DestinyShelter_body',
  'String_STR_TaytraFortress_body',
  'String_STR_IceFieldPass_body',
  'String_STR_AlsigHill_body',
  'String_STR_TrackerCamp_body',
  'String_STR_PatamorForestEdge_body',
  'String_STR_FirePlaza_body',
  'String_STR_NomadRetreat_body',
  'String_STR_IslandOfKromede_body',
  'String_STR_AlsigOutpost_body',
  'String_STR_ZamunkiWorkshop_body',
  'String_STR_DominionChamberEntrance_body',
  'String_STR_AshenOutpost_body',
  'String_STR_HalabanaValley_body',
  'String_STR_PatamorForestOutpost_body',
  'String_STR_ArkanisSkyTempleCircus_body',
  'String_STR_NefraSnowfield_body',
  'String_STR_PatamorVillage_body',
  'String_STR_MistManeGarrison_body',
  'String_STR_DestroyedFafniumSite_body',
  'String_STR_HunterHideout_body',
  'String_STR_InfernoShrineEntrance_body',
  'String_STR_NefraSnowfieldOutpost_body',
  'String_STR_ExilesCamp_body',
  'String_STR_PatamorForest_body',
  'String_STR_MusphelVolcanicLand_body',
  'String_STR_IslandofCrimson_body',
  'String_STR_EyeOfMusphel_body',
  'String_STR_SnowshadeHideout_body',
  'String_STR_MorheimWall_body',
  'String_STR_IslandofCrimsonCamp_body'
]);

// Determine if a key is a stand-alone entity that MUST be kept in English
function isStandAloneEntityToKeepInEnglish(key) {
  // Skill Names
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;

  // Item Names & Skins & Sets
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GODSTONE_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_PERIOD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_AD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_ARCANA_') && key.endsWith('_body')) return true;

  // Character & NPC Names
  if (key.startsWith('String_STR_N_') && key.endsWith('_body')) return true;
  if (key.startsWith('AnonymousNameData_')) return true;
  if (key.startsWith('Post_') && key.endsWith('_sender_name')) return true;

  // Monster & Boss Names
  if (key.startsWith('String_STR_M_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_KalnifElite_')) return true;
  if (key.startsWith('String_STR_Ferk_')) return true;
  if (key.startsWith('String_STR_AncientEle_')) return true;
  if (key.startsWith('String_STR_WindEle_')) return true;
  if (key.startsWith('String_STR_EarthEle_')) return true;
  if (key.startsWith('String_STR_FireEle_')) return true;
  if (key.startsWith('String_STR_WaterEle_')) return true;

  // Locations & Subzones & Servers & Monoliths
  if (key.startsWith('String_STR_Subzone_') && key.endsWith('_body')) return true;
  if (key.startsWith('ServerName_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GROUP_UNLOCK_MONOLITHFRAGMENT_')) return true;
  if (knownSingleLocations.has(key)) return true;
  if (key.startsWith('EnvObjData_') && key.includes('TeleportArtifact') && key.endsWith('_desc')) return true;

  return false;
}

// Build Glossary replacement pairs (sorted by length descending to prevent partial replacements)
const glossary = [
  // Specific phrases first
  ['Điểm Vực Sâu', 'Abyss Points'],
  ['điểm Vực Sâu', 'Abyss Points'],
  ['điểm vực sâu', 'Abyss Points'],
  ['Thử Thách Thăng Hoa', 'Ascension Trial'],
  ['Thử thách Thăng Hoa', 'Ascension Trial'],
  ['Thử Thách Thăng Cấp', 'Ascension Trial'],
  ['Thử thách Thăng Cấp', 'Ascension Trial'],
  ['Thử Thách Thăng hoa', 'Ascension Trial'],
  ['Cái Nôi của Tồn Tại Hư Vô', 'Cradle of Nihility'],
  ['Cái Nôi Của Hư Vô', 'Cradle of Nihility'],
  ['Cái Nôi Hư Vô', 'Cradle of Nihility'],
  ['Nôi Của Hư Vô', 'Cradle of Nihility'],
  ['Hầm Ngục Đã Niêm Phong', 'Sealed Dungeon'],
  ['Hầm Ngục Bị Niêm Phong', 'Sealed Dungeon'],
  ['Đền Thờ Nổi Arkanis', 'Floating Temple of Arkanis'],
  ['Đền Nổi Arkanis', 'Floating Temple of Arkanis'],
  ['Arkanis Tan Vỡ', 'Shattered Arkanis'],
  ['Arkanis tan vỡ', 'Shattered Arkanis'],
  ['Người Tìm Kiếm Nhật Ký', 'Log Seeker'],
  ['Chúa tể Empyrean', 'Empyrean Lord'],
  ['Chúa Tể Empyrean', 'Empyrean Lord'],
  ['Chư Hầu Empyrean', 'Empyrean Lord'],
  ['Đại Thần', 'Arch Daeva'],
  ['Đá Mana', 'Manastone'],
  ['đá Mana', 'Manastone'],
  ['Đá Linh Hồn', 'Soulstone'],
  ['đá linh hồn', 'Soulstone'],
  ['Đền Lửa', 'Fire Temple'],
  ['Hắc Đạo', 'Abyss'],
  ['Đảo Hơi Thở Xanh', 'Azure Breath Island'],
  ['Đảo Bầu trời Vakron', 'Vakron Sky Island'],
  ['Đảo Bầu Trời Vakron', 'Vakron Sky Island'],
  ['Hang Động Krao', 'Krao Cave'],
  ['hang động Krao', 'Krao Cave'],
  ['Hang động Krao', 'Krao Cave'],
  ['Sân Đấu Kẻ Săn Mồi Colossus Balakh', 'Predator Colossus Balakh'],
  ['Chiến binh Đen Aed', 'Black Warrior Aed'],
  ['Quân đoàn rạng đông', 'Dawn Legion'],
  ['Thương nhân Shugo', 'Shugo Merchant'],
  ['Máy tính bảng độc quyền Balaur', 'Balaur Tablet'], // hilarious tablet translation fix!
];

// Compile regex for glossary
const glossaryRules = glossary.map(([from, to]) => ({
  regex: new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
  replacement: to
}));

// Process text for Group 2
function normalizeTranslation(vnText, enText) {
  if (!vnText) return enText || '';
  if (!enText) return vnText;

  let text = vnText;

  // 1. Sync <QK> tags if both have the same number of <QK> tags
  const enQkMatches = [...enText.matchAll(/<QK>(.*?)<\/>/g)];
  const vnQkMatches = [...text.matchAll(/<QK>(.*?)<\/>/g)];

  if (enQkMatches.length > 0 && enQkMatches.length === vnQkMatches.length) {
    // Check if the enQk is an entity (Capitalized or known place/boss/item)
    // If it's an entity, replace the VN QK content with the EN QK content
    for (let i = 0; i < enQkMatches.length; i++) {
      const enTerm = enQkMatches[i][1];
      const vnTerm = vnQkMatches[i][1];
      // If enTerm starts with uppercase or is a proper name, restore EN
      if (/^[A-Z]/.test(enTerm) && enTerm.length > 1) {
        text = text.replace(`<QK>${vnTerm}</>`, `<QK>${enTerm}</>`);
      }
    }
  }

  // 2. Apply Glossary normalization
  for (const rule of glossaryRules) {
    text = text.replace(rule.regex, rule.replacement);
  }

  return text;
}

// Test on sample items
console.log('Testing sample normalization...');
const sampleTestKey = 'AchievementString_Archieve_STR_Group_D_Item_Enhance_443100803_obj_desc';
console.log('Key:', sampleTestKey);
console.log('EN:  ', enData[sampleTestKey]);
console.log('OLD: ', currentData[sampleTestKey]);
console.log('NEW: ', normalizeTranslation(currentData[sampleTestKey], enData[sampleTestKey]));

const sampleTestKey2 = 'AchievementString_Archieve_STR_Group_Season_4_D_Abyss_240140603_obj_desc';
console.log('\nKey:', sampleTestKey2);
console.log('EN:  ', enData[sampleTestKey2]);
console.log('OLD: ', currentData[sampleTestKey2]);
console.log('NEW: ', normalizeTranslation(currentData[sampleTestKey2], enData[sampleTestKey2]));

const sampleTestKey3 = 'NpcTalk_1231A627B7094098B25E2F26E9446BB5_cv_text';
console.log('\nKey:', sampleTestKey3);
console.log('EN:  ', enData[sampleTestKey3]);
console.log('OLD: ', currentData[sampleTestKey3]);
console.log('NEW: ', normalizeTranslation(currentData[sampleTestKey3], enData[sampleTestKey3]));

const sampleTestKey4 = 'TeleportArtifact_TeleportArtifact_6100103_detail_desc';
console.log('\nKey:', sampleTestKey4);
console.log('EN:  ', enData[sampleTestKey4]);
console.log('OLD: ', currentData[sampleTestKey4]);
console.log('NEW: ', normalizeTranslation(currentData[sampleTestKey4], enData[sampleTestKey4]));
