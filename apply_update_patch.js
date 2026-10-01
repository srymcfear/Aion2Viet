/**
 * AION 2 - UPDATE TRANSLATION & DEPLOYMENT SCRIPT FOR GLOBAL & TW
 * Synchronizes official Global strings, applies high-fidelity translations,
 * repacks .pak files with exact mount points, and deploys to the game directory!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== AION 2 GLOBAL & TW PATCH UPDATE ENGINE ===\n');

const officialPath = path.join(__dirname, 'official_en-US_strings.json');
const currentPath = path.join(__dirname, 'en-US_strings.json');

const official = JSON.parse(fs.readFileSync(officialPath, 'utf-8'));
const current = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));

// 1. High-Quality Manual Translations Dictionary for specific patch keys
const patchTranslations = {
  // --- Currency Info (Global Cash & Quna) ---
  "CurrencyInfo_GameCashNonbinding_desc": "Quna Trả Phí",
  "CurrencyInfo_GameCashPending_desc": "Quna Chờ Duyệt",
  "CurrencyInfo_GameCashBinding_desc": "Quna Tặng Kèm",
  "CurrencyInfo_GameCashNonbinding_desc_long": "Đá quý đặc biệt được các Thương nhân Shugo coi trọng.\nCó thể dùng để mua các vật phẩm đặc biệt từ Thương nhân Shugo.",
  "CurrencyInfo_GameCashBinding_desc_long": "Đá quý đặc biệt được các Thương nhân Shugo coi trọng.\nCó thể dùng để mua các vật phẩm đặc biệt từ Thương nhân Shugo.",
  "CurrencyInfo_GameCashPending_desc_long": "Chuyển thành Quna Trả Phí sau thời gian chờ quy định (72 giờ).\nĐá quý đặc biệt được các Thương nhân Shugo coi trọng.\nCó thể dùng để mua các vật phẩm đặc biệt từ Thương nhân Shugo.",

  // --- Environment Objects ---
  "EnvObjData_E_D1_MorheimEnterPortal_01_desc": "Morheim",
  "EnvObjData_E_D1_MorheimEnterPortal_01_interact_desc": "Đang tiến vào Morheim...",
  "EnvObjData_E_D2_AltgardEnterPortal_01_desc": "Altgard",
  "EnvObjData_E_D2_AltgardEnterPortal_01_interact_desc": "Đang tiến vào Altgard...",
  "EnvObjData_E_D2_DrakanTower_01_V01_01_desc": "Tháp Truyền Tin Balaur",
  "EnvObjData_E_PD_SunkenTemple_PrisonDoor_04_desc": "Cửa Đã Khóa",
  "EnvObjData_E_D_Event_Thanksgiving_01_desc": "Cối Giã Ánh Trăng",
  "EnvObjData_E_D_Event_Thanksgiving_02_desc": "Rương Mây",
  "EnvObjData_E_PD_Fire_Temple_T_01_DungeonKibel_01_003_desc": "Hành Lang Lửa",
  "EnvObjData_E_PD_Fire_Temple_T_01_DungeonKibel_01_004_desc": "Hành Lang Lửa",
  "EnvObjData_E_PD_Fire_Temple_T_01_DungeonKibel_01_003_interact_desc": "Đang liên kết với Kibelisk...",
  "EnvObjData_E_PD_Fire_Temple_T_01_DungeonKibel_01_004_interact_desc": "Đang liên kết với Kibelisk...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_001_interact_desc": "Đang mở cửa...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_002_interact_desc": "Đang mở cửa...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_003_interact_desc": "Đang mở cửa...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_004_interact_desc": "Đang mở cửa...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_005_interact_desc": "Đang mở cửa...",
  "EnvObjData_E_PD_Fire_Temple_T_01_Gate_01_006_interact_desc": "Đang mở cửa...",

  // --- Guide Data (Subscription / System Popups) ---
  "GuideData_TG_G_Subscribe_TypePopup_001_title": "Kho Từ Xa",
  "GuideData_TG_G_Subscribe_TypePopup_001_desc": "Bạn có thể sử dụng Kho Máy Chủ và Kho Nhân Vật từ xa thông qua menu [Kho Từ Xa] ở góc dưới bên phải Cube.\nBạn có thể truy cập kho từ bất cứ đâu và bất kỳ lúc nào, có thể chuyển hoặc lấy vật phẩm tương tự như ở Kho thông thường.",
  "GuideData_TG_G_Subscribe_TypePopup_003_title": "Chợ Giao Dịch",
  "GuideData_TG_G_Subscribe_TypePopup_003_desc": "Bạn có thể mua các vật phẩm đang niêm yết hoặc đăng bán vật phẩm tại Chợ.\nCó thể đăng bán tối đa 10 vật phẩm cùng một lúc.\nNgười chơi khác có thể mua các vật phẩm đã đăng ký và tiền thanh toán sẽ được gửi khi giao dịch hoàn tất.",
  "GuideData_TG_G_Subscribe_TypePopup_004_title": "Sàn Giao Dịch Quna",
  "GuideData_TG_G_Subscribe_TypePopup_004_desc": "Rương Kina có thể bán để đổi lấy Quna.\nBạn có thể đăng bán Rương Kina chế tạo từ Biến Đổi Vật Chất hoặc dùng Quna mua Rương Kina do người chơi khác đăng bán.\nCó thể đăng ký tối đa 10 lượt bán.",
  "GuideData_TG_G_Subscribe_TypePopup_005_title": "Thương Nhân Gió Thoảng",
  "GuideData_TG_G_Subscribe_TypePopup_005_desc": "Nhiều vật phẩm hữu ích có sẵn để mua qua [Cửa Hàng - Thương Nhân Gió Thoảng].\nBạn có thể mua nhiều vật phẩm khác nhau để hỗ trợ cho hành trình của mình.",
  "GuideData_TG_G_Subscribe_TypePopup_006_title": "Khối Năng Lượng Odyle",
  "GuideData_TG_G_Subscribe_TypePopup_006_desc": "Hệ thống nhận Thưởng Khối Năng Lượng Odyle từ Viễn Chinh (Thám Hiểm/Chinh Phục), Siêu Việt và Sanctuary.\nKhi mở Khối, có thể truyền Năng Lượng Odyle tối đa 2 lần.\nBạn phải sở hữu đủ Năng Lượng Odyle mới có thể nhận thêm phần thưởng.",
  "GuideData_TG_G_Subscribe_TypePopup_007_title": "Năng Lượng Odyle",
  "GuideData_TG_G_Subscribe_TypePopup_007_desc": "Giới hạn chứa Năng Lượng Odyle tối đa tăng lên 840.",
  "GuideData_TG_G_Subscribe_TypePopup_008_title": "Lễ Hội Shugo",
  "GuideData_TG_G_Subscribe_TypePopup_008_desc": "Số Chìa Khóa Phần Thưởng Lễ Hội Shugo tối đa tăng lên 21.",

  // --- Title Descriptions (Long) ---
  "Title_G_D_Achievement_006_desc_long": "Đã thu thập 6 loại Tượng Ác Mộng.",
  "Title_G_D_Achievement_004_desc_long": "Đã thu thập 6 Loại Tranh Nghệ Thuật Viễn Chinh.",
  "Title_L_Event_u_001_desc_long": "Danh hiệu trao cho Daeva đã kiến tạo bầu trời.",
  "Title_G_A_Event_001_desc_long": "Danh hiệu dành cho Nhà Sáng Tạo Nội Dung.",
  "Title_G_D_Achievement_008_desc_long": "Đã thu thập 13 Loại Tranh Nghệ Thuật Quái Dã Ngoại, Boss Độc Nhất.",
  "Title_G_D_Achievement_002_desc_long": "Đã thu thập 10 Loại Tranh Nghệ Thuật Lễ Hội Shugo.",
  "Title_G_D_Achievement_001_desc_long": "Đã thu thập 7 Loại Tranh Nghệ Thuật Lễ Hội Shugo.",
  "Title_G_L_Achievement_001_desc_long": "Đã thu thập 7 Loại Tranh Nghệ Thuật Lễ Hội Shugo.",
  "Title_D_Event_u_002_desc_long": "Danh hiệu trao cho Daeva đã kiến tạo bầu trời.",
  "Title_G_L_Achievement_004_desc_long": "Đã thu thập 6 Loại Tranh Nghệ Thuật Viễn Chinh.",
  "Title_G_D_Achievement_005_desc_long": "Đã thu thập 4 loại Tượng Ác Mộng.",
  "Title_G_L_Achievement_005_desc_long": "Đã thu thập 4 loại Tượng Ác Mộng.",
  "Title_G_D_Achievement_003_desc_long": "Đã thu thập 4 Loại Tranh Nghệ Thuật Viễn Chinh.",
  "Title_D_Event_u_001_desc_long": "Danh hiệu trao cho Daeva đã kiến tạo bầu trời.",
  "Title_G_L_Achievement_007_desc_long": "Đã thu thập 9 Loại Tranh Nghệ Thuật Quái Dã Ngoại, Boss Độc Nhất.",
  "Title_G_L_Achievement_002_desc_long": "Đã thu thập 10 Loại Tranh Nghệ Thuật Lễ Hội Shugo.",
  "Title_G_L_Achievement_008_desc_long": "Đã thu thập 13 Loại Tranh Nghệ Thuật Quái Dã Ngoại, Boss Độc Nhất.",
  "Title_L_Event_u_002_desc_long": "Danh hiệu trao cho Daeva đã kiến tạo bầu trời.",
  "Title_G_A_Event_002_desc_long": "Danh hiệu dành cho Nhà Sáng Tạo Nội Dung Đối Tác.",
  "Title_G_L_Achievement_003_desc_long": "Đã thu thập 4 Loại Tranh Nghệ Thuật Viễn Chinh.",
  "Title_G_D_Achievement_007_desc_long": "Đã thu thập 9 Loại Tranh Nghệ Thuật Quái Dã Ngoại, Boss Độc Nhất.",
  "Title_A_Event_056_desc_long": "Đã vượt qua Thử Thách Đền Lửa ở cấp 16.",

  // --- Teleport Artifacts ---
  "TeleportArtifact_TeleportArtifact_6000251_detail_desc": "Dịch chuyển tức thời đến <QK>Path of Atonement - West</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000252_detail_desc": "Dịch chuyển tức thời đến <QK>Path of Atonement - East</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000253_detail_desc": "Dịch chuyển tức thời đến <QK>Fire Corridor</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000254_detail_desc": "Dịch chuyển tức thời đến <QK>Mirror Altar</> trong Đền Lửa.",

  // --- Messages & UI ---
  "Message_MSG_TRADE_SETTLEMENT_UNAVAILABLE_ERROR_body": "Hiện tại không thể thanh toán.",
  "Message_MSG_TRADE_PURCHASE_UNAVAILABLE_ERROR_body": "Hiện tại không thể mua vật phẩm này.",
  "Message_MSG_BMSHOP_PURCHASE_UNAVAILABLE_ERROR_body": "Hiện tại không thể mua sản phẩm này.",
  "Message_MSG_SHOP_BUY_FAIL_GLOBAL_EU_REFUND_NOT_AGREED_body": "Vui lòng đồng ý với chính sách mua hàng.",
  "Message_MSG_RIFTEVENT_TOBEATTACKED_INFO_body": "Pháo đài {0} đang bị tấn công.",
  "Message_MSG_AUTO_SOUL_ATTUNE_BUTTON_FAIL_NOT_QUALIFIED_body": "Chọn nguyên liệu và tùy chọn để Tự Động Đồng Bộ.",
  "Message_MSG_AUTO_SOUL_ATTUNE_RESET_FAIL_NO_OPTION_SELECTED_body": "Chưa chọn cài đặt mục tiêu cho Tự Động Đồng Bộ.",
  "Message_MSG_AUTO_SOUL_ATTUNE_POPUP_NO_OPTION_SELECTED_body": "Chưa chọn tùy chọn mục tiêu.",
  "Message_MSG_AUTO_SOUL_ATTUNE_ONGOING_FAIL_MANUAL_OPERATION_body": "Đang trong quá trình Tự Động Đồng Bộ.",
  "String_UI_AUTO_SOUL_ATTUNE_BUTTON_body": "Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_STOP_BUTTON_body": "Dừng Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_TITLE_body": "Cài Đặt Mục Tiêu Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_OPERATION_START_BUTTON_body": "Bắt đầu Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_CURRENT_OPTION_body": "Thuộc tính hiện tại",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_TARGET_OPTION_body": "Cài đặt thuộc tính mục tiêu",
  "String_STR_G_Daevanion_Node_Stat_Title_01_body": "Xuyên Thấu"
};

// 2. Generic content translation logic (Achievements, item descriptions, etc.)
function translateContent(key, text) {
  if (!text || text === 'Temporary Content') return text;
  let vn = text;

  // Event & general tags
  vn = vn.replace(/^\[Event\]/g, '[Sự kiện]');
  vn = vn.replace(/Ascension Trial/g, 'Thử Thách Thăng Hoa');
  vn = vn.replace(/Abyss/g, 'Vực Sâu');
  vn = vn.replace(/Transcendence/g, 'Siêu Việt');
  vn = vn.replace(/Through the Fire and Flames: Fire Temple/g, 'Băng Qua Lửa và Khói: Đền Lửa');
  vn = vn.replace(/Clear Fire Temple Ordeal/g, 'Vượt qua Thử Thách Đền Lửa');
  vn = vn.replace(/Clear Vakron Sky Island Ordeal/g, 'Vượt qua Thử Thách Đảo Bầu Trời Vakron');
  vn = vn.replace(/Clear Ascension Trial/g, 'Vượt qua Thử Thách Thăng Hoa');
  vn = vn.replace(/Clear Transcendence Dungeon/g, 'Vượt qua Hầm Ngục Siêu Việt');

  // Item description templates
  vn = vn.replace(/It contains items that will greatly assist you on your adventure\./gi, 'Chứa các vật phẩm hỗ trợ đắc lực cho chuyến phiêu lưu của bạn.');
  vn = vn.replace(/Open the chest to earn ([\d,]+) Kina \(Bound\)\./gi, 'Mở rương để nhận $1 Kina (Khóa).');
  vn = vn.replace(/A chest containing various items to aid your adventure in the world of AION 2\./gi, 'Rương chứa nhiều vật phẩm hỗ trợ chuyến phiêu lưu của bạn trong thế giới AION 2.');
  vn = vn.replace(/This item is unlocked by the Battle Pass\./gi, 'Vật phẩm này được mở khóa bằng Battle Pass.');
  vn = vn.replace(/Contains rewards for helping Daeva in combat\./gi, 'Chứa phần thưởng hỗ trợ Daeva trong chiến đấu.');
  vn = vn.replace(/A chest from which you can select a (.*) to obtain\./gi, 'Rương cho phép bạn chọn và nhận 1 $1.');
  vn = vn.replace(/Grants \[(.*)\] Weapon Skin\./gi, 'Nhận Skin Vũ Khí [$1].');
  vn = vn.replace(/Grants the title \[(.*)\]\./gi, 'Nhận danh hiệu [$1].');
  vn = vn.replace(/\[Owned Effect\]/gi, '[Hiệu ứng Sở hữu]');
  vn = vn.replace(/\[Equipped Effect\]/gi, '[Hiệu ứng Trang bị]');
  vn = vn.replace(/Combat Speed:/gi, 'Tốc Độ Chiến Đấu:');
  vn = vn.replace(/Evasion Bonus:/gi, 'Né Tránh:');

  // Achievement objective descriptions
  vn = vn.replace(/Kill (\d+) Elyos players in (.*)/gi, 'Tiêu diệt $1 người chơi Elyos tại $2');
  vn = vn.replace(/Kill (\d+) Asmodian players in (.*)/gi, 'Tiêu diệt $1 người chơi Asmodian tại $2');
  vn = vn.replace(/Collect (\d+) Unique Field Monster, Boss Artwork/gi, 'Thu thập $1 Tranh Nghệ Thuật Quái Dã Ngoại, Boss Độc Nhất');
  vn = vn.replace(/Collect (\d+) Unique Expedition Artwork/gi, 'Thu thập $1 Tranh Nghệ Thuật Viễn Chinh Độc Nhất');
  vn = vn.replace(/Collect (\d+) Unique Shugo Festival Artwork/gi, 'Thu thập $1 Tranh Nghệ Thuật Lễ Hội Shugo Độc Nhất');
  vn = vn.replace(/Collect (\d+) Unique Nightmare Statue/gi, 'Thu thập $1 Tượng Ác Mộng Độc Nhất');
  vn = vn.replace(/Defeat (\d+) Abyss boss monster[s]?/gi, 'Đánh bại $1 quái vật boss Abyss');
  vn = vn.replace(/Clear (.*) Level (\d+)/gi, 'Vượt qua $1 Cấp $2');
  vn = vn.replace(/Clear (.*) Stage (\d+)/gi, 'Vượt qua $1 Giai Đoạn $2');
  vn = vn.replace(/Achieve a final score of ([\d,]+) in Ascension Trial/gi, 'Đạt tổng điểm $1 trong Thử Thách Thăng Hoa');
  vn = vn.replace(/Achieve a final score of ([\d,]+) in (.*)/gi, 'Đạt tổng điểm $1 trong $2');
  vn = vn.replace(/Enhance (.*) (\d+) times/gi, 'Cường hóa $1 $2 lần');
  vn = vn.replace(/Reach (\d+) or higher Abyss Ranking/gi, 'Đạt Xếp hạng Vực Sâu từ $1 trở lên');
  vn = vn.replace(/Kill (\d+) enemies with a Title/gi, 'Tiêu diệt $1 kẻ địch có Danh Hiệu');
  vn = vn.replace(/Kill (\d+) Level (\d+) or higher enemies in the Abyss/gi, 'Tiêu diệt $1 kẻ địch cấp $2 trở lên trong Vực Sâu');
  vn = vn.replace(/Use a Scroll (\d+) times/gi, 'Sử dụng Cuộn Giấy $1 lần');
  vn = vn.replace(/Obtain (\d+) piece[s]? of Unique Gear/gi, 'Nhận $1 trang bị Độc Nhất');
  vn = vn.replace(/with the Boss Buff trait at level (\d+) or higher/gi, 'với đặc tính Buff Boss ở cấp $1 trở lên');
  vn = vn.replace(/with the Player Debuff trait at level (\d+) or higher/gi, 'với đặc tính Debuff Người Chơi ở cấp $1 trở lên');
  vn = vn.replace(/at level (\d+) or higher/gi, 'ở cấp $1 trở lên');
  vn = vn.replace(/(\d+) Time[s]?/gi, '$1 lần');

  return vn;
}

// 3. Entity filter - "Dịch thứ để hiểu, giữ thứ để tra"
const isEnglishEntity = (key) => {
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('String_STR_G_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('String_STR_G_Box_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('String_STR_ITEM_G_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('String_STR_G_Title_') && !key.includes('_DESC_')) return true;
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
  if (key.startsWith('Title_') && key.endsWith('_desc')) return true;
  return false;
};

// 4. Merge and Process
const finalStrings = {};
let countRetained = 0;
let countEntityEN = 0;
let countNewTranslated = 0;

for (const [key, enVal] of Object.entries(official)) {
  if (current[key] !== undefined) {
    // Retain existing translation
    finalStrings[key] = current[key];
    countRetained++;
  } else if (isEnglishEntity(key)) {
    // Brand new Entity -> keep official English
    finalStrings[key] = enVal;
    countEntityEN++;
  } else if (patchTranslations[key]) {
    // Explicit manual translation
    finalStrings[key] = patchTranslations[key];
    countNewTranslated++;
  } else if (key.startsWith('InputKeyText_')) {
    finalStrings[key] = enVal;
    countNewTranslated++;
  } else {
    // Fallback: translate content via regex rules
    finalStrings[key] = translateContent(key, enVal);
    countNewTranslated++;
  }
}

console.log(`Merge complete!`);
console.log(`- Retained existing translations: ${countRetained.toLocaleString()}`);
console.log(`- New Entities preserved in English: ${countEntityEN.toLocaleString()}`);
console.log(`- New Content Translated to Vietnamese: ${countNewTranslated.toLocaleString()}`);
console.log(`- Total final keys in database: ${Object.keys(finalStrings).length.toLocaleString()}`);

// 5. Save JSON and CSV files
const jsonString = JSON.stringify(finalStrings, null, 2);
const locales = ['en-US', 'ko-KR', 'zh-TW'];

for (const loc of locales) {
  const jsonOut = path.join(__dirname, `${loc}_strings.json`);
  fs.writeFileSync(jsonOut, jsonString, 'utf-8');
  console.log(`Saved: ${jsonOut}`);

  const csvOut = path.join(__dirname, `${loc}_strings.csv`);
  const lines = ['Key,Value'];
  for (const [k, v] of Object.entries(finalStrings)) {
    lines.push(`"${k.replace(/"/g, '""')}","${(v || '').replace(/"/g, '""')}"`);
  }
  fs.writeFileSync(csvOut, '\ufeff' + lines.join('\n'), 'utf-8');
  console.log(`Saved: ${csvOut}`);
}

// 6. Repack PAK files
console.log('\n=== REPACKING MOD PAK FILES ===');
execSync('dotnet run --project tool pack', { cwd: __dirname, stdio: 'inherit' });

// 7. Deploy to Game Directories
console.log('\n=== DEPLOYING TO GAME DIRECTORY ===');

// Global Client Directory
const globalPaksDir = 'F:\\NCSoft\\AION 2\\Aion2\\Content\\Paks';
if (fs.existsSync(globalPaksDir)) {
  const globalEnDir = path.join(globalPaksDir, 'L10N', 'Text', 'en-US');
  const globalKoDir = path.join(globalPaksDir, 'L10N', 'Text', 'ko-KR');

  if (!fs.existsSync(globalEnDir)) fs.mkdirSync(globalEnDir, { recursive: true });
  if (!fs.existsSync(globalKoDir)) fs.mkdirSync(globalKoDir, { recursive: true });

  const crypto = require('crypto');

  // 1. Root ~mods folder (Content\Paks\~mods) - Universal Mod Pak (AION2 tree)
  const globalModsDir = path.join(globalPaksDir, '~mods');
  if (!fs.existsSync(globalModsDir)) fs.mkdirSync(globalModsDir, { recursive: true });
  const srcUniversalPak = path.join(__dirname, 'pakchunk502000-Windows_999_P_universal.pak');
  fs.copyFileSync(srcUniversalPak, path.join(globalModsDir, 'pakchunk502000-Windows_999_P.pak'));
  console.log(`SUCCESS! Deployed Universal mod to: ${path.join(globalModsDir, 'pakchunk502000-Windows_999_P.pak')}`);

  // 2. en-US Locale: overwrite base pak with newly fixed translation (correct prefix 27F0BB57...)
  const srcEnPak = path.join(__dirname, 'pakchunk502000-Windows_999_P.pak');
  let sha1En = '';
  if (fs.existsSync(srcEnPak)) {
    const baseEnPak = path.join(globalEnDir, 'pakchunk502000-Windows_0_P.pak');
    const bakEnPak = path.join(globalEnDir, 'pakchunk502000-Windows_0_P.pak.official_bak');
    const baseSig = path.join(globalEnDir, 'pakchunk502000-Windows_0_P.sig');
    const bakSig = path.join(globalEnDir, 'pakchunk502000-Windows_0_P.sig.bak');

    if (!fs.existsSync(bakEnPak) && fs.existsSync(baseEnPak)) {
      fs.copyFileSync(baseEnPak, bakEnPak);
    }
    if (fs.existsSync(baseSig)) {
      if (!fs.existsSync(bakSig)) fs.copyFileSync(baseSig, bakSig);
      fs.unlinkSync(baseSig);
      console.log(`DISABLED: Base sig disabled to prevent RSA check failure`);
    }

    fs.copyFileSync(srcEnPak, baseEnPak);
    sha1En = crypto.createHash('sha1').update(fs.readFileSync(baseEnPak)).digest('hex');

    // Also deploy as 999_P and in ~mods
    const destEnPak = path.join(globalEnDir, 'pakchunk502000-Windows_999_P.pak');
    fs.copyFileSync(srcEnPak, destEnPak);

    const fakeEnSig = path.join(globalEnDir, 'pakchunk502000-Windows_999_P.sig');
    if (fs.existsSync(fakeEnSig)) fs.unlinkSync(fakeEnSig);

    const enModsDir = path.join(globalEnDir, '~mods');
    if (!fs.existsSync(enModsDir)) fs.mkdirSync(enModsDir, { recursive: true });
    fs.copyFileSync(srcEnPak, path.join(enModsDir, 'pakchunk502000-Windows_999_P.pak'));
    console.log(`SUCCESS! Deployed fixed en-US translation to base pak: ${baseEnPak}`);
  }

  // 3. ko-KR Locale: overwrite base pak with newly fixed translation (correct prefix 4346B960...)
  const srcKoPak = path.join(__dirname, 'pakchunk501000-Windows_999_P.pak');
  let sha1Ko = '';
  if (fs.existsSync(srcKoPak)) {
    const baseKoPak = path.join(globalKoDir, 'pakchunk501000-Windows_0_P.pak');
    const bakKoPak = path.join(globalKoDir, 'pakchunk501000-Windows_0_P.pak.official_bak');
    const baseKoSig = path.join(globalKoDir, 'pakchunk501000-Windows_0_P.sig');
    const bakKoSig = path.join(globalKoDir, 'pakchunk501000-Windows_0_P.sig.bak');

    if (!fs.existsSync(bakKoPak) && fs.existsSync(baseKoPak)) {
      fs.copyFileSync(baseKoPak, bakKoPak);
    }
    if (fs.existsSync(baseKoSig)) {
      if (!fs.existsSync(bakKoSig)) fs.copyFileSync(baseKoSig, bakKoSig);
      fs.unlinkSync(baseKoSig);
      console.log(`DISABLED: Base ko-KR sig disabled to prevent RSA check failure`);
    }

    fs.copyFileSync(srcKoPak, baseKoPak);
    sha1Ko = crypto.createHash('sha1').update(fs.readFileSync(baseKoPak)).digest('hex');

    const destKoPak = path.join(globalKoDir, 'pakchunk501000-Windows_999_P.pak');
    fs.copyFileSync(srcKoPak, destKoPak);

    const fakeKoSig = path.join(globalKoDir, 'pakchunk501000-Windows_999_P.sig');
    if (fs.existsSync(fakeKoSig)) fs.unlinkSync(fakeKoSig);

    const koModsDir = path.join(globalKoDir, '~mods');
    if (!fs.existsSync(koModsDir)) fs.mkdirSync(koModsDir, { recursive: true });
    fs.copyFileSync(srcKoPak, path.join(koModsDir, 'pakchunk501000-Windows_999_P.pak'));
    console.log(`SUCCESS! Deployed fixed ko-KR translation to base pak: ${baseKoPak}`);
  }

  // 4. Update Purple Launcher UpdatedList.dat & ExcludedUpdateList.dat
  const gameRoot = path.dirname(path.dirname(globalPaksDir)); // F:\NCSoft\AION 2
  const updatedListFile = path.join(gameRoot, 'UpdatedList.dat');
  if (fs.existsSync(updatedListFile)) {
    let content = fs.readFileSync(updatedListFile, 'utf8');
    if (sha1En) {
      content = content.replace(/Aion2\/Content\/Paks\/L10N\/Text\/en-US\/pakchunk502000-Windows_0_P\.pak:[a-f0-9]+:/g, 'Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak:' + sha1En + ':');
    }
    if (sha1Ko) {
      content = content.replace(/Aion2\/Content\/Paks\/L10N\/Text\/ko-KR\/pakchunk501000-Windows_0_P\.pak:[a-f0-9]+:/g, 'Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak:' + sha1Ko + ':');
    }
    fs.writeFileSync(updatedListFile, content, 'utf8');
    console.log('SUCCESS! Updated Purple launcher UpdatedList.dat manifest.');
  }

  const excludedFile = path.join(gameRoot, 'ExcludedUpdateList.dat');
  const exclEntries = [
    'Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.pak',
    'Aion2/Content/Paks/L10N/Text/en-US/pakchunk502000-Windows_0_P.sig',
    'Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.pak',
    'Aion2/Content/Paks/L10N/Text/ko-KR/pakchunk501000-Windows_0_P.sig'
  ].join('\r\n') + '\r\n';
  fs.writeFileSync(excludedFile, exclEntries, 'utf8');
  console.log('SUCCESS! Updated Purple launcher ExcludedUpdateList.dat.');
}

// TW Client Directory (if exists)
const twModsDir = 'F:\\NCSoft\\AION2_TW\\Aion2\\Content\\Paks\\~mods';
if (fs.existsSync(path.dirname(twModsDir))) {
  if (!fs.existsSync(twModsDir)) fs.mkdirSync(twModsDir, { recursive: true });
  const srcUniversal = path.join(__dirname, 'pakchunk502000-Windows_999_P_universal.pak');
  const destTwPak = path.join(twModsDir, 'pakchunk502000-Windows_999_P.pak');
  if (fs.existsSync(srcUniversal)) {
    fs.copyFileSync(srcUniversal, destTwPak);
    console.log(`SUCCESS! Deployed TW mod to: ${destTwPak}`);
  }
}

console.log('\n=== UPDATE AND DEPLOYMENT COMPLETED SUCCESSFULLY ===');
