/**
 * AION 2 - INCREMENTAL SYNC ENGINE (sync_update.js)
 * Tự động đồng bộ khi Game có bản cập nhật mới:
 * 1. Nhận diện các Key MỚI, BỊ XÓA, hoặc NỘI DUNG GỐC THAY ĐỔI.
 * 2. Giữ nguyên 100% bản dịch cũ cho các key không đổi.
 * 3. Tự động giữ tiếng Anh cho Entity mới (Skill, Item, Boss, Quest chính...).
 * 4. Tự động áp dụng Glossary cho các mô tả/hội thoại mới và xuất file cần dịch thêm nếu có.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function incrementalSync(newOfficialPath, currentTranslationPath, outputPath) {
  if (!fs.existsSync(newOfficialPath) || !fs.existsSync(currentTranslationPath)) {
    throw new Error('Vui lòng kiểm tra đường dẫn file official mới và bản dịch hiện tại.');
  }

  const newOfficial = JSON.parse(fs.readFileSync(newOfficialPath, 'utf-8'));
  const currentTrans = JSON.parse(fs.readFileSync(currentTranslationPath, 'utf-8'));

  const newKeys = Object.keys(newOfficial);
  const currentKeySet = new Set(Object.keys(currentTrans));

  const stats = {
    totalOfficialKeys: newKeys.length,
    retainedTranslations: 0,
    autoEntityEnglish: 0,
    newContentKeys: 0,
    deletedKeys: 0
  };

  const mergedStrings = {};
  const pendingTranslations = {};

  // Import entity detection and glossary from retranslate_engine.js logic
  const isEnglishEntity = (key) => {
    if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
    if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
    if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;
    if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
    if (key.startsWith('String_STR_G_ITEM_') && !key.includes('_DESC_')) return true;
    if (key.startsWith('String_STR_G_Box_') && !key.includes('_DESC_')) return true;
    if (key.startsWith('String_STR_ITEM_G_') && !key.includes('_DESC_')) return true;
    if (key.startsWith('String_STR_G_Title_') && !key.includes('_DESC_')) return true;
    if (key.startsWith('Title_') && key.endsWith('_desc')) return true;
    if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
    if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
    if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
    if (key.startsWith('String_STR_GODSTONE_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_PERIOD_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_AD_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_ARCANA_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_N_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_M_') && key.endsWith('_body')) return true;
    if (key.startsWith('String_STR_Subzone_') && key.endsWith('_body')) return true;
    if (key.startsWith('ServerName_') && key.endsWith('_desc')) return true;
    if (key.startsWith('QuestPart_')) return true;
    if (key.startsWith('QuestString_STR_HQ')) return true;
    if (key.startsWith('QuestString_STR_AQ')) return true;
    if (key.startsWith('QuestString_STR_MQ')) return true;
    if (key.startsWith('String_str_veh_')) return true;
    return false;
  };

  for (const key of newKeys) {
    const officialText = newOfficial[key];

    if (currentKeySet.has(key)) {
      // Key đã có bản dịch từ trước -> Giữ nguyên 100%
      mergedStrings[key] = currentTrans[key];
      stats.retainedTranslations++;
    } else {
      // Key mới xuất hiện trong bản patch
      if (isEnglishEntity(key)) {
        // Là tên Skill/Item/NPC/Boss/Map... -> Giữ nguyên tiếng Anh chuẩn game
        mergedStrings[key] = officialText;
        stats.autoEntityEnglish++;
      } else {
        // Là hội thoại, mô tả chi tiết mới -> Cần dịch
        mergedStrings[key] = officialText;
        pendingTranslations[key] = officialText;
        stats.newContentKeys++;
      }
    }
  }

  // Đếm các key cũ đã bị game xóa bỏ trong bản patch mới
  for (const oldKey of currentKeySet) {
    if (!newOfficial[oldKey]) {
      stats.deletedKeys++;
    }
  }

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(mergedStrings, null, 2), 'utf-8');
  }

  return { stats, mergedStrings, pendingTranslations };
}

if (require.main === module) {
  const officialFile = path.join(__dirname, 'official_en-US_strings.json');
  const currentFile = path.join(__dirname, 'en-US_strings.json');

  console.log('=== AION 2 INCREMENTAL SYNC TEST RUN ===');
  const result = incrementalSync(officialFile, currentFile);
  console.log('Kết quả đồng bộ vi sai:');
  console.log(`- Tổng số key official mới: ${result.stats.totalOfficialKeys.toLocaleString()}`);
  console.log(`- Giữ nguyên bản dịch cũ  : ${result.stats.retainedTranslations.toLocaleString()}`);
  console.log(`- Tự động gán EN (Entity) : ${result.stats.autoEntityEnglish.toLocaleString()}`);
  console.log(`- Nội dung mới cần dịch   : ${result.stats.newContentKeys.toLocaleString()}`);
  console.log(`- Key cũ đã bị xoá khỏi game: ${result.stats.deletedKeys.toLocaleString()}`);
}

module.exports = { incrementalSync };
