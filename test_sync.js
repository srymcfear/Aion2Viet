const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { incrementalSync } = require('./sync_update');

console.log('=== RUNNING UNIT TEST FOR INCREMENTAL SYNC ===');

// Mock data
const mockOfficialPath = path.join(__dirname, 'mock_official.json');
const mockCurrentPath = path.join(__dirname, 'mock_current.json');

const mockOfficial = {
  "String_STR_ITEM_OldSword": "Broadsword",
  "String_STR_ITEM_NewKatana": "Shadow Katana", // New Entity
  "String_STR_G_ITEM_GlobalChest": "Special Daeva Supply Chest (Bound)", // Global Entity
  "Title_G_L_Achievement_005_desc": "Ferocious Statue", // Global Title Entity
  "NpcTalk_OldDialogue": "Hello traveler.",
  "NpcTalk_NewDialogue": "Beware the Abyss invasion." // New Content
};

const mockCurrent = {
  "String_STR_ITEM_OldSword": "Broadsword",
  "NpcTalk_OldDialogue": "Xin chào lữ khách.", // Existing translation
  "Obsolete_Key_Deleted": "Nội dung cũ" // Obsolete
};

fs.writeFileSync(mockOfficialPath, JSON.stringify(mockOfficial));
fs.writeFileSync(mockCurrentPath, JSON.stringify(mockCurrent));

try {
  const { stats, mergedStrings, pendingTranslations } = incrementalSync(mockOfficialPath, mockCurrentPath);

  // Assertions
  assert.strictEqual(stats.retainedTranslations, 2, 'Phải giữ nguyên 2 key cũ');
  assert.strictEqual(mergedStrings["NpcTalk_OldDialogue"], "Xin chào lữ khách.", 'Bản dịch cũ phải được bảo toàn');
  assert.strictEqual(stats.autoEntityEnglish, 3, 'Key entity/item/title mới phải được tự động nhận dạng là EN');
  assert.strictEqual(mergedStrings["String_STR_ITEM_NewKatana"], "Shadow Katana", 'Item mới giữ tên tiếng Anh');
  assert.strictEqual(mergedStrings["String_STR_G_ITEM_GlobalChest"], "Special Daeva Supply Chest (Bound)", 'Global item giữ tên tiếng Anh');
  assert.strictEqual(mergedStrings["Title_G_L_Achievement_005_desc"], "Ferocious Statue", 'Title name giữ tiếng Anh');
  assert.strictEqual(stats.newContentKeys, 1, 'Hội thoại mới phải đưa vào pending');
  assert.strictEqual(pendingTranslations["NpcTalk_NewDialogue"], "Beware the Abyss invasion.");
  assert.strictEqual(stats.deletedKeys, 1, 'Phải phát hiện 1 key bị xóa');

  console.log('✅ ALL TEST CASES PASSED SUCCESSFULLY!');
} finally {
  if (fs.existsSync(mockOfficialPath)) fs.unlinkSync(mockOfficialPath);
  if (fs.existsSync(mockCurrentPath)) fs.unlinkSync(mockCurrentPath);
}
