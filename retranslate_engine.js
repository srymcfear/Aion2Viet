const fs = require('fs');
const path = require('path');

console.log('=== AION 2 LOCALIZATION RETRANSLATE ENGINE ===');
console.log('Kim chỉ nam: "Dịch thứ để hiểu, giữ thứ để tra."\n');

const enPath = path.join(__dirname, 'official_en-US_strings.json');
const currentVnPath = path.join(__dirname, 'raw_dump_strings.json');

console.log('Reading official English and current translation files...');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const currentVnData = JSON.parse(fs.readFileSync(currentVnPath, 'utf-8'));
const keys = Object.keys(enData);
console.log(`Loaded ${keys.length.toLocaleString()} keys.`);

// 1. Single location keys in String_STR_
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

// 2. Exact rule to determine if a key is a stand-alone entity to keep in English
function isEnglishEntity(key) {
  // --- SKILLS ---
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;

  // --- ITEMS, SKINS, SETS, VEHICLES, WINGS, GODSTONES ---
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GODSTONE_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_PERIOD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_AD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_ARCANA_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_str_veh_')) return true;
  if (key.startsWith('String_Set_')) return true;

  // --- CHARACTERS & NPCS ---
  if (key.startsWith('String_STR_N_') && key.endsWith('_body')) return true;
  if (key.startsWith('AnonymousNameData_')) return true;
  if (key.startsWith('Post_') && key.endsWith('_sender_name')) return true;

  // --- MONSTERS & BOSSES ---
  if (key.startsWith('String_STR_M_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_KalnifElite_') || key.startsWith('String_STR_Ferk_') ||
      key.startsWith('String_STR_AncientEle_') || key.startsWith('String_STR_WindEle_') ||
      key.startsWith('String_STR_EarthEle_') || key.startsWith('String_STR_FireEle_') ||
      key.startsWith('String_STR_WaterEle_')) return true;

  // --- LOCATIONS, SUBZONES, SERVERS, LANDMARKS ---
  if (key.startsWith('String_STR_Subzone_') && key.endsWith('_body')) return true;
  if (key.startsWith('ServerName_') && key.endsWith('_desc')) return true;
  if (knownSingleLocations.has(key)) return true;
  // --- WORLD INTERACTIVE OBJECTS (Rương, Cổng, Vật thể quest, Bia đá, Thảo dược...) ---
  if (key.startsWith('EnvObjData_')) return true;

  // --- TITLES (DANH HIỆU / TIÊU ĐỀ) ---
  // Keep title names in English (e.g. Altgard Inquirer, Guardian of Altgard)
  // while keeping _desc_long translated in Vietnamese (chú thích / yêu cầu đạt được)
  if (key.startsWith('Title_') && key.endsWith('_desc')) return true;

  // --- MAIN QUESTS (NHIỆM VỤ CHÍNH TUYẾN: HERO QUEST, ASCENSION QUEST, MAIN QUEST) ---
  // Chỉ giữ nguyên tiếng Anh cho nhiệm vụ chính tuyến, các quest khác (DQ, UQ, FQ, EQ) vẫn dịch sang tiếng Việt
  if (key.startsWith('QuestPart_')) return true; // Hồi/Chương nhiệm vụ chính (Hero & Ascension)
  if (key.startsWith('QuestString_STR_HQ')) return true; // Hero Quests (Nhiệm vụ chính cốt truyện)
  if (key.startsWith('QuestString_STR_AQ')) return true; // Ascension Quests (Nhiệm vụ thăng hoa)
  if (key.startsWith('QuestString_STR_MQ')) return true; // Main Quests
  if (key.startsWith('String_STR_MapEvent_') && /_(HQ|AQ|MQ)/i.test(key)) return true; // MapEvent của nhiệm vụ chính
  if (key.startsWith('String_STR_') && /_(HQ|AQ|MQ)\d+/i.test(key)) return true; // Địa danh/Khu vực nhiệm vụ chính
  // --- DAEVANION BOARDS (BẢNG DAEVANION) ---
  // Giữ nguyên tên các Chúa Tể Tối Cao / Bảng Daevanion (Nezekan, Zikel, Vaizel, Triniel, Ariel, Azphel, Marchutan, Yustiel)
  if (key.includes('Daevanion_Board_Title') || key.includes('DAEVANION_BOARD_0')) return true;

  // --- QUEST TRACKER UI TEMPLATES & UNITS ---
  if (key === 'String_STR_QUEST_Indicator_QuestTitle_body') return true; // [Lv. {0}] {1} (thay vì [Cấp. {0}] {1})
  if (key === 'String_STR_DISTANCE_METER_body') return true; // {0}m (sửa lỗi bản dịch nhầm m -> {0} phút)
  if (key === 'String_UI_SKILLINFO_SKILL_RANGE_body') return true; // {0}m (sửa lỗi bản dịch nhầm m -> {0} phút)
  if (key.startsWith('String_UI_SETTING_TAB_AUTO_BATTLE_TARGET_SEARCH_ACTIVE_RANGE_BUTTON_')) return true; // 20M, 50M... (thay vì 20 triệu)
  if (key.startsWith('String_UI_SETTING_TAB_BATTLE_SUBTAB_TARGETSEARCH_FINDTARGET_RADIUS_BUTTON')) return true; // 20M, 50M... (thay vì 20 triệu)
  if (key.includes('TEXT_TARGET_ALTITUDE')) return true; // 99M (thay vì 99 triệu)

  return false;
}

// 3. Glossary Replacements for Content & Descriptions (Ordered by length descending)
const glossary = [
  // Multi-word phrases first
  ['Nê Trạch Can', 'Nezekan'],
  ['Máctútan', 'Marchutan'],
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
  ['Máy tính bảng độc quyền Balaur', 'Balaur Tablet'],
  ['Máy tính bảng Balaur', 'Balaur Tablet'],
  ['Thước đo Thăng Hoa', 'Ascension Gauge'],
  ['Không gian Phụ trợ Thăng Hoa', 'Ascension Subspace'],
  ['Thần chú biến hình', 'Transformation Whizz'],
  ['Phòng Ảo Ảnh Chinh Phạt', 'Hall of Illusion'],
  ['Căn cứ Nghiên cứu Deus', 'Deus Research Base'],
  ['Thung lũng Halabana', 'Halabana Canyon'],
  ['Pháo đài Mistmane', 'Mistmane Stronghold'],
  ['Xưởng Zamunki', 'Zamunki Workshop'],
  ['Vùng Núi Lửa Muspel', 'Muspel Volcano'],
  ['Đảo Đỏ Tía', 'Crimson Isle'],
  ['Đảo Crimson', 'Crimson Isle'],
  ['Thành lũy Morheim', 'Morheim Bulwark'],
  ['Căn Cứ Gốc Tây Rift', 'Rift Western Root Base'],
  ['Căn Cứ Gốc Đông Rift', 'Rift Eastern Root Base'],
  ['Dãy núi phía Tây Latesran', 'Latesran Western Ridge'],
  ['Dãy núi phía Đông Latesran', 'Latesran Eastern Ridge'],
  ['Rễ Phương Đông Latesran', 'Latesran Eastern Root'],
  ['Rễ Phương Tây Latesran', 'Latesran Western Root'],
  ['Cánh trái của Siel', 'Siel\'s Left Wing'],
  ['Cánh phải của Siel', 'Siel\'s Right Wing'],
  ['Đảo Cây Lưu Huỳnh', 'Sulfur Tree Island'],
  ['Sông Nhựa Thối', 'River of Rotten Sap'],
  ['Pháo đài Krotan', 'Krotan Fortress']
];

const glossaryRules = glossary.map(([from, to]) => ({
  regex: new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
  replacement: to
}));

function processContentString(vnText, enText) {
  if (vnText === undefined || vnText === null) return enText || '';
  if (enText === undefined || enText === null) return vnText;

  let text = vnText;

  // 1. Sync <QK> tags if both have the same number of <QK> tags
  const enQkMatches = [...enText.matchAll(/<QK>(.*?)<\/>/g)];
  const vnQkMatches = [...text.matchAll(/<QK>(.*?)<\/>/g)];

  if (enQkMatches.length > 0 && enQkMatches.length === vnQkMatches.length) {
    for (let i = 0; i < enQkMatches.length; i++) {
      const enTerm = enQkMatches[i][1];
      const vnTerm = vnQkMatches[i][1];
      // If enTerm is a capitalized name/proper noun, preserve English in tag
      if (/^[A-Z]/.test(enTerm) && enTerm.length > 1) {
        text = text.replace(`<QK>${vnTerm}</>`, `<QK>${enTerm}</>`);
      }
    }
  }

  // 2. Apply Glossary Normalization
  for (const rule of glossaryRules) {
    text = text.replace(rule.regex, rule.replacement);
  }

  return text;
}

// 4. Execute Full Re-translation
console.log('Processing all 156,036 keys...');
const finalStrings = {};
let countEnglishPreserved = 0;
let countVietnameseProcessed = 0;

for (const k of keys) {
  const enVal = enData[k];
  const vnVal = currentVnData[k];

  if (isEnglishEntity(k)) {
    // 100% Stand-alone English Entity: use official EN value
    finalStrings[k] = enVal;
    countEnglishPreserved++;
  } else if (k.startsWith('String_STR_ITEM_TITLE_') && k.includes('_DESC_')) {
    // Item voucher description: translate text but keep the title name in [English Title]
    let processed = processContentString(vnVal, enVal);
    processed = processed
      .replace(/\[Efek Sở Hữu\]/g, '[Hiệu ứng sở hữu]')
      .replace(/\[Ef-Đã Sở Hữu\]/g, '[Hiệu ứng sở hữu]')
      .replace(/\[Efek Trang Bị\]/g, '[Hiệu ứng trang bị]')
      .replace(/\[Ef-Trang Bị\]/g, '[Hiệu ứng trang bị]');
    const enMatch = enVal.match(/\[(.*?)\]/);
    if (enMatch) {
      processed = processed.replace(/\[.*?\]/, enMatch[0]);
    }
    finalStrings[k] = processed;
    countVietnameseProcessed++;
  } else if (enVal && enVal.startsWith('Skill Level Up - ')) {
    // Daevanion node: Nâng cấp kỹ năng - [English Skill Name]
    finalStrings[k] = 'Nâng cấp kỹ năng - ' + enVal.slice('Skill Level Up - '.length);
    countVietnameseProcessed++;
  } else {
    // Vietnamese translation: process content and normalize terms
    finalStrings[k] = processContentString(vnVal, enVal);
    countVietnameseProcessed++;
  }
}

console.log(`\nRe-translation processing complete!`);
console.log(`- Kept 100% English (tra cứu): ${countEnglishPreserved.toLocaleString()} keys`);
console.log(`- Translated Vietnamese (thấu hiểu): ${countVietnameseProcessed.toLocaleString()} keys`);
console.log(`- Total output entries: ${Object.keys(finalStrings).length.toLocaleString()} keys`);

// 5. Save back to en-US_strings.json, ko-KR_strings.json, zh-TW_strings.json
const jsonOptions = {
  WriteIndented: true
};

const stringified = JSON.stringify(finalStrings, null, 2);

console.log('\nWriting updated files:');
const targetLocales = ['en-US', 'ko-KR', 'zh-TW'];
for (const loc of targetLocales) {
  const targetPath = path.join(__dirname, `${loc}_strings.json`);
  fs.writeFileSync(targetPath, stringified, 'utf-8');
  console.log(`  -> Updated ${targetPath}`);

  // Also update CSV
  const csvPath = path.join(__dirname, `${loc}_strings.csv`);
  const lines = ['Key,Value'];
  for (const [k, v] of Object.entries(finalStrings)) {
    const escK = `"${k.replace(/"/g, '""')}"`;
    const escV = `"${(v || '').replace(/"/g, '""')}"`;
    lines.push(`${escK},${escV}`);
  }
  fs.writeFileSync(csvPath, '\ufeff' + lines.join('\n'), 'utf-8');
  console.log(`  -> Updated ${csvPath}`);
}

console.log('\n=== PIPELINE SUCCESSFUL ===');
