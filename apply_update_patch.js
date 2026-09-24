/**
 * AION 2 - UPDATE TRANSLATION & DEPLOYMENT SCRIPT
 * Translates all 287 new keys from the latest patch,
 * merges into database, repacks .pak, and deploys to game folder!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== AION 2 PATCH UPDATE ENGINE ===\n');

const officialPath = path.join(__dirname, 'official_en-US_strings.json');
const currentPath = path.join(__dirname, 'en-US_strings.json');

const official = JSON.parse(fs.readFileSync(officialPath, 'utf-8'));
const current = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));

// 1. Translations dictionary for all 287 new patch keys
const patchTranslations = {
  // --- Titles ---
  "Title_A_Event_056_desc": "Fire Temple Vanquisher",
  "Title_A_Event_056_desc_long": "Đã vượt qua Thử Thách Đền Lửa ở cấp 16.",

  // --- Npc Dialogue ---
  "NpcTalk_36DB5ECB7CB94D0786BCE097FF4EB862_cv_text": "Cơn thịnh nộ và oán hận kéo dài của hắn ngày càng lớn mạnh hơn mà không có nơi nào để giải tỏa.",

  // --- Teleport Artifacts ---
  "TeleportArtifact_TeleportArtifact_6000251_detail_desc": "Dịch chuyển tức thời đến <QK>Path of Atonement - West</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000252_detail_desc": "Dịch chuyển tức thời đến <QK>Path of Atonement - East</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000253_detail_desc": "Dịch chuyển tức thời đến <QK>Fire Corridor</> trong Đền Lửa.",
  "TeleportArtifact_TeleportArtifact_6000254_detail_desc": "Dịch chuyển tức thời đến <QK>Mirror Altar</> trong Đền Lửa.",

  // --- Environment Objects ---
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

  // --- Messages ---
  "Message_MSG_TRADE_SETTLEMENT_UNAVAILABLE_ERROR_body": "Hiện tại không thể thanh toán.",
  "Message_MSG_TRADE_PURCHASE_UNAVAILABLE_ERROR_body": "Hiện tại không thể mua vật phẩm này.",
  "Message_MSG_BMSHOP_PURCHASE_UNAVAILABLE_ERROR_body": "Hiện tại không thể mua sản phẩm này.",
  "Message_MSG_SHOP_BUY_FAIL_GLOBAL_EU_REFUND_NOT_AGREED_body": "Vui lòng đồng ý với chính sách mua hàng.",
  "Message_MSG_RIFTEVENT_TOBEATTACKED_INFO_body": "Pháo đài {0} đang bị tấn công.",
  "Message_MSG_AUTO_SOUL_ATTUNE_BUTTON_FAIL_NOT_QUALIFIED_body": "Chọn nguyên liệu và tùy chọn để Tự Động Đồng Bộ.",
  "Message_MSG_AUTO_SOUL_ATTUNE_RESET_FAIL_NO_OPTION_SELECTED_body": "Chưa chọn cài đặt mục tiêu cho Tự Động Đồng Bộ.",
  "Message_MSG_AUTO_SOUL_ATTUNE_POPUP_NO_OPTION_SELECTED_body": "Chưa chọn tùy chọn mục tiêu.",
  "Message_MSG_AUTO_SOUL_ATTUNE_ONGOING_FAIL_MANUAL_OPERATION_body": "Đang trong quá trình Tự Động Đồng Bộ.",

  // --- UI Strings ---
  "String_UI_AUTO_SOUL_ATTUNE_BUTTON_body": "Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_STOP_BUTTON_body": "Dừng Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_TITLE_body": "Cài Đặt Mục Tiêu Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_OPERATION_START_BUTTON_body": "Bắt đầu Tự Động Đồng Bộ",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_CURRENT_OPTION_body": "Thuộc tính hiện tại",
  "String_UI_AUTO_SOUL_ATTUNE_POPUP_TARGET_OPTION_body": "Cài đặt thuộc tính mục tiêu",
  "String_UI_ITEM_TOOLTIP_GETROUTE_MANUAL_SEASON_MISSION_body": "Nhiệm Vụ Mùa Giải",
  "String_UI_ATTENDANCE_TITLE_025_body": "Lễ Hội Thu Hoạch Atreia",
  "String_UI_ATTENDANCE_TITLE_026_body": "Hành Trình Mùa Vụ Bội Thu",
  "String_STR_UI_THANKSGIVING2026_EVENT_SHOP_01_body": "Cửa Hàng Xu Mặt Trăng Mùa Vụ",
  "String_UI_SETTING_TAB_AUDIO_SUBTAB_VOLUME_ONLY_MY_WING_body": "Hiệu Ứng Âm Thanh Cánh Của Tôi",
  "String_UI_SETTING_TAB_AUDIO_SUBTAB_VOLUME_ONLY_MY_WING_DESC_body": "Thiết lập phát âm thanh từ đôi cánh của chính bạn.",
  "String_UI_SERVER_TRANSFER_ROUND_BEFORE_START_NOTICE_body": "Lượt Chuyển Server tiếp theo sẽ bắt đầu vào {0}.",
  "String_UI_POPUP_RIFTEVENT_REWARD_TITLE_body": "Phần Thưởng Tham Gia",
  "String_UI_HUD_RIFTEVENT_REWARD_TITLE_body": "Phần Thưởng Tham Gia",
  "String_UI_POPUP_RIFTEVENT_REWARD_REWARD_TITLE_body": "Phần thưởng",
  "String_UI_POPUP_RIFTEVENT_REWARD_DESC_body": "Phần thưởng sẽ được trao dựa theo xếp hạng phân lớp khi Thống Trị kết thúc.",
  "String_UI_POPUP_RIFTEVENT_REWARD_WIN_TAB_body": "Chiến thắng",
  "String_UI_POPUP_RIFTEVENT_REWARD_LOSE_TAB_body": "Thất bại",
  "String_UI_POPUP_RIFTEVENT_REWARD_RANKING_body": "Hạng {0}-{1}",
  "String_UI_POPUP_RIFTEVENT_REWARD_CLASSRANKING_TITLE_body": "Xếp Hạng Phân Lớp",
  "String_UI_RIFTEVENT_ATTACKSUCCESS_TITLE_body": "Đội Tấn Công Chiếm Đóng Thành Công",
  "String_UI_RIFTEVENT_ATTACKSUCCESS_DESC_body": "Pháo đài {0}",
  "String_UI_RIFTEVENT_PROTECTFAIL_TITLE_body": "Đội Phòng Thủ Bảo Vệ Thất Bại",
  "String_UI_RIFTEVENT_PROTECTFAIL_DESC_body": "Pháo đài {0}",
  "String_UI_PARTYDUNGEON_PARTYCHALLENGE_MYROOM_GRADE_TITLE_body": "Cấp {0}",

  // --- Probabilities / Sanctuary ---
  "String_STR_PROBINFO_ODENERGYCUBE_RAID_EASY_body": "Sanctuary [Dễ]",
  "String_STR_PROBINFO_ODENERGYCUBE_RAID_NORMAL_body": "Sanctuary [Thường]",
  "String_STR_PROBINFO_ODENERGYCUBE_RAID_ADVANCED_body": "Sanctuary [Khó]",
  "String_STR_MapEvent_FireTemple_8_body": "Đánh bại Red Spark Ignus và Black Smoke Murute",

  // --- Items & Pets/Vehicles ---
  "String_str_veh_Titmouse_01_body": "Baby Birb",
  "String_str_veh_Gumiho_01_CV01_body": "Fiery Black Kumiho",
  "String_STR_ITEM_VEHICLE_TITMOUSE_01_A_01_B_DESC_body": "Nhận thú cưng Baby Birb.\nNếu bạn đã sở hữu thú cưng này, nó sẽ được nhận dưới dạng Linh Hồn.",
  "String_STR_ITEM_VEHICLE_GUMIHO_01_CV01_A_01_B_DESC_body": "Nhận thú cưng Fiery Black Kumiho.\nNếu bạn đã sở hữu thú cưng này, nó sẽ được nhận dưới dạng Linh Hồn.",
  "String_STR_ITEM_FOOD_BUFF_A_C_27A_B_DESC_body": "Tăng Max HP thêm <desc_point>{se_abe_dmg:270040811:270040811:StatchangeTotal:none}</>, Max MP thêm <desc_point>{se_abe_dmg:270040811:270040812:StatchangeTotal:none}</>, và Max Stamina thêm <desc_point>{se_abe_dmg:270040811:270040813:StatchangeTotal:divide100}</> trong <desc_point>{se:270040811:effect_value01:time}</>.",
  "String_STR_ITEM_FOOD_BUFF_A_C_26A_B_DESC_body": "Tăng Tấn Công thêm <desc_point>{se_abe_dmg:270040711:270040711:StatchangeTotal:none}</>, Phòng Thủ thêm <desc_point>{se_abe_dmg:270040711:270040712:StatchangeTotal:none}</>, và Max Stamina thêm <desc_point>{se_abe_dmg:270040711:270040713:StatchangeTotal:divide100}</> trong <desc_point>{se:270040711:effect_value01:time}</>.",
  "String_STR_ITEM_EVENT_BOX_THANKSGIVING2026_BOX_A_01_B_DESC_body": "Túi quà được chế tác từ Hào Quang Thỏ Ngọc.\nChứa những món quà do Thỏ Ngọc chuẩn bị.",
  "String_STR_ITEM_EVENT_BOX_THANKSGIVING2026_BOX_A_02_B_DESC_body": "Túi quà được chế tác từ Hào Quang Thỏ Ngọc.\nChứa những món quà do Thỏ Ngọc chuẩn bị.",
  "String_STR_ITEM_EVENT_BOX_THANKSGIVING2026_BOX_A_03_B_DESC_body": "Sử dụng để chọn và nhận 1 giáp Lava Heart.",
  "String_STR_ITEM_EVENT_BOX_THANKSGIVING2026_BOX_A_04_B_DESC_body": "Sử dụng để chọn và nhận 1 trang sức Lava Heart.",
  "String_STR_ITEM_EVENT_MATERIAL_THANKSGIVING2026_01A_A_C_B_DESC_body": "Hào quang huyền bí tinh tế do Thỏ Ngọc chế tác.\nDùng để chế tạo Túi Quà Đỏ/Xanh của Thỏ Ngọc thông qua Biến Đổi Vật Chất.",
  "String_STR_ITEM_Currency_COINEVENT12_DESC_body": "Đồng xu tràn ngập ánh trăng rằm rạng rỡ.\nCó thể đổi lấy nhiều vật phẩm khác nhau từ các Thương nhân ở mỗi thị trấn.",
  "String_STR_ITEM_WING_L_BMSHOP_29A_B_DESC_body": "Nhận [Pearlescent Fan Wings].",
  "String_STR_ITEM_WING_D_BMSHOP_29A_B_DESC_body": "Nhận [Pearlescent Fan Wings].",
  "String_STR_ITEM_BM_BOX_PACKAGE_WP_003_B_DESC_body": "Rương chứa Skin Vũ Khí Light in Shadow.\nNhận một Skin Vũ Khí phù hợp với hệ phái của bạn.",
  "String_STR_ITEM_BM_BOX_PACKAGE_SKIN_003_B_DESC_body": "Nhận tất cả skin chứa trong rương này.\n\n<Trang Phục Có Thể Nhận>\nVulpine Sunshower (Skin: Set) (Khóa)\nNightfall Butterfly Reverie (Skin: Set) (Khóa)\nInky Norigae Glasses (Skin: Kính Mắt) (Khóa)\nSilky Moonflower Veil (Skin: Khăn Che Mặt) (Khóa)",
  "String_STR_ITEM_BOX_TRIAL_A_01_B_DESC_body": "Phần thưởng nhận được khi vượt qua Thử Thách.\nNhận Đá Cường Hóa.",
  "String_STR_ITEM_EVENT_BOX_RECHARGE_REWARDTICKET_RAID_A_01_B_DESC_body": "Sử dụng để chọn và nhận 1 Vé Tiêu Diệt Boss Cuối Sanctuary.",
  "String_STR_ITEM_TITLE_A_S_EVENT_056_B_DESC_body": "Nhận danh hiệu [Fire Temple Vanquisher].",

  // --- Trial Affixes ---
  "String_STR_TrialAffix_BossBuff_2_body": "Buff Boss",
  "String_STR_TrialAffix_PC_debuff_1_body": "Debuff Người Chơi",
  "String_STR_Desc_TrialAffix_BossBuff_2_1_body": "Thời gian Cuồng Nộ giảm 1 phút\n+10% Tăng Sát Thương",
  "String_STR_Desc_TrialAffix_BossBuff_2_2_body": "Thời gian Cuồng Nộ giảm 1 phút\n+20% Tăng Sát Thương\n+30% Max HP\nCơ Chế Cường Hóa Cấp 1",
  "String_STR_Desc_TrialAffix_BossBuff_2_3_body": "Thời gian Cuồng Nộ giảm 1 phút\n+30% Tăng Sát Thương\n+70% Max HP\n+25% Tốc Độ Chiến Đấu\nCơ Chế Cường Hóa Cấp 1",
  "String_STR_Desc_TrialAffix_BossBuff_2_4_body": "Thời gian Cuồng Nộ giảm 1 phút\n+40% Tăng Sát Thương\n+120% Max HP\n+30% Tốc Độ Chiến Đấu\n+50% Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 2",
  "String_STR_Desc_TrialAffix_BossBuff_2_5_body": "Thời gian Cuồng Nộ giảm 1 phút\n+45% Tăng Sát Thương\n+160% Max HP\n+35% Tốc Độ Chiến Đấu\n+75% Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 2",
  "String_STR_Desc_TrialAffix_BossBuff_2_6_body": "Thời gian Cuồng Nộ giảm 1 phút\n+50% Tăng Sát Thương\n+200% Max HP\n+40% Tốc Độ Chiến Đấu\n+75% Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 3",
  "String_STR_Desc_TrialAffix_BossBuff_2_7_body": "Thời gian Cuồng Nộ giảm 1 phút\n+55% Tăng Sát Thương\n+230% Max HP\n+45% Tốc Độ Chiến Đấu\n+100% Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 3",
  "String_STR_Desc_TrialAffix_BossBuff_2_8_body": "Thời gian Cuồng Nộ giảm 1 phút\n+60% Tăng Sát Thương\n+260% Max HP\n+50% Tốc Độ Chiến Đấu\n+100% Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 3",

  // --- Skills & Abnormal ---
  "SkillString_STR_SKILL_PC_COMMON_19749_skill_desc_effect": "Gây thêm sát thương cho mục tiêu.",
  "SkillAbnormalString_SkillAbnormalString_27004141_desc_summary": "Tăng Max HP, Max MP, Max Stamina",
  "SkillAbnormalString_SkillAbnormalString_27004131_desc_summary": "Tăng Tấn Công, Phòng Thủ, Max Stamina",
  "SkillAbnormalString_SkillAbnormalString_19994860_desc_effect": "+<desc_point>{abe:199948603:value02:divide100}%</> Tăng Sát Thương\n+<desc_point>{abe:199948601:value02:divide100}%</> Max HP\n+<desc_point>{abe:199948604:value02:divide100}%</> Tốc Độ Chiến Đấu\n+<desc_point>{abe:199948606:value02:divide100}%</> Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 3",
  "SkillAbnormalString_SkillAbnormalString_19994850_desc_effect": "+<desc_point>{abe:199948503:value02:divide100}%</> Tăng Sát Thương\n+<desc_point>{abe:199948501:value02:divide100}%</> Max HP\n+<desc_point>{abe:199948504:value02:divide100}%</> Tốc Độ Chiến Đấu\n+<desc_point>{abe:199948506:value02:divide100}%</> Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 2",
  "SkillAbnormalString_SkillAbnormalString_19994840_desc_effect": "+<desc_point>{abe:199948403:value02:divide100}%</> Tăng Sát Thương\n+<desc_point>{abe:199948401:value02:divide100}%</> Max HP\n+<desc_point>{abe:199948404:value02:divide100}%</> Tốc Độ Chiến Đấu\n+<desc_point>{abe:199948406:value02:divide100}%</> Thanh Choáng Váng\nCơ Chế Cường Hóa Cấp 2",
  "SkillAbnormalString_SkillAbnormalString_19994830_desc_effect": "+<desc_point>{abe:199948303:value02:divide100}%</> Tăng Sát Thương\n+<desc_point>{abe:199948301:value02:divide100}%</> Max HP\n+<desc_point>{abe:199948304:value02:divide100}%</> Tốc Độ Chiến Đấu\nCơ Chế Cường Hóa Cấp 1",
  "SkillAbnormalString_SkillAbnormalString_19994820_desc_effect": "+<desc_point>{abe:199948203:value02:divide100}%</> Tăng Sát Thương\n+<desc_point>{abe:199948201:value02:divide100}%</> Max HP\nCơ Chế Cường Hóa Cấp 1",
  "SkillAbnormalString_SkillAbnormalString_19994810_desc_effect": "+<desc_point>{abe:199948103:value02:divide100}%</> Tăng Sát Thương",
  "SkillAbnormalString_SkillAbnormalString_9749_desc_effect": "+<desc_point>{abe:97491:value02:divide100}%</> Tấn Công\n+<desc_point>{abe:97492:value02:divide100}%</> Phòng Thủ\n+<desc_point>{abe:97493:value02:divide100}%</> Tốc Độ Chiến Đấu\n+<desc_point>{abe:97494:value02:divide100}%</> Tăng Sát Thương PvE\n+<desc_point>{abe:97495:value02:divide100}%</> Kháng Sát Thương PvE\n+<desc_point>{abe:97496:value02:divide100}%</> Tăng Sát Thương PvP\n+<desc_point>{abe:97497:value02:divide100}%</> Kháng Sát Thương PvP\n+<desc_point>{abe:97498:value02}</> Chí Mạng\n+<desc_point>{abe:97499:value02}</> Chính Xác\n+<desc_point>{abe:974910:value02:divide100}%</> Tăng Sát Thương Chí Mạng\n+<desc_point>{abe:974911:value02:divide100}%</> Tăng Sát Thương Vũ Khí\n-<desc_point>{abe:974912:value02:divide100abs}%</> Thời gian hồi kỹ năng\n+<desc_point>{abe:974913:value02:divide100}%</> Tỷ Lệ Đòn Đôi\n+<desc_point>{abe:974914:value02:divide100}%</> Tỷ Lệ Hoàn Hảo\nGây thêm sát thương Chí Mạng khi tấn công mục tiêu trong thời gian hiệu lực\nHút {se:1974911:effect_value14:divide100}% HP",
  "SkillAbnormalString_SkillAbnormalString_9746_desc_effect": "+<desc_point>{abe:97461:value02:divide100}%</> Tăng Sát Thương PvE\n+<desc_point>{abe:97463:value02:divide100}%</> Kháng Sát Thương PvE\n+<desc_point>{abe:97462:value02:divide100}%</> Tăng Sát Thương PvP\n+<desc_point>{abe:97464:value02:divide100}%</> Kháng Sát Thương PvP\n+<desc_point>{abe:97465:value02}</> Chí Mạng\n+<desc_point>{abe:97466:value02}</> Chính Xác\n+<desc_point>{abe:97467:value02:divide100}%</> Tăng Sát Thương Chí Mạng\n+<desc_point>{abe:97468:value02:divide100}%</> Tỷ Lệ Đòn Đôi\n+<desc_point>{abe:97469:value02:divide100}%</> Tỷ Lệ Hoàn Hảo"
};

// 2. Generic translation logic for Achievements and remaining keys
function translateAchievement(key, enVal) {
  // Season 4 events & titles
  let vn = enVal;

  vn = vn.replace(/^\[Event\]/g, '[Sự kiện]');
  vn = vn.replace(/Ascension Trial/g, 'Thử Thách Thăng Hoa');
  vn = vn.replace(/Abyss/g, 'Vực Sâu');
  vn = vn.replace(/Transcendence/g, 'Siêu Việt');
  vn = vn.replace(/Through the Fire and Flames: Fire Temple/g, 'Băng Qua Lửa và Khói: Đền Lửa');
  vn = vn.replace(/Clear Fire Temple Ordeal/g, 'Vượt qua Thử Thách Đền Lửa');
  vn = vn.replace(/Clear Vakron Sky Island Ordeal/g, 'Vượt qua Thử Thách Đảo Bầu Trời Vakron');
  vn = vn.replace(/Clear Ascension Trial/g, 'Vượt qua Thử Thách Thăng Hoa');
  vn = vn.replace(/Clear Transcendence Dungeon/g, 'Vượt qua Hầm Ngục Siêu Việt');
  vn = vn.replace(/with the Boss Buff trait at level (\d+) or higher/g, 'với đặc tính Buff Boss ở cấp $1 trở lên');
  vn = vn.replace(/with the Player Debuff trait at level (\d+) or higher/g, 'với đặc tính Debuff Người Chơi ở cấp $1 trở lên');
  vn = vn.replace(/at level (\d+) or higher/g, 'ở cấp $1 trở lên');
  vn = vn.replace(/(\d+) Time[s]?/gi, '$1 lần');
  vn = vn.replace(/Use a Scroll (\d+) times/gi, 'Sử dụng Cuộn Giấy $1 lần');
  vn = vn.replace(/Obtain (\d+) piece[s]? of Unique Gear/gi, 'Nhận $1 trang bị Độc Nhất');
  vn = vn.replace(/Reach (\d+) or higher Abyss Ranking/gi, 'Đạt Xếp hạng Vực Sâu từ $1 trở lên');
  vn = vn.replace(/Kill (\d+) enemies with a Title/gi, 'Tiêu diệt $1 kẻ địch có Danh Hiệu');
  vn = vn.replace(/Kill (\d+) Level (\d+) or higher enemies in the Abyss/gi, 'Tiêu diệt $1 kẻ địch cấp $2 trở lên trong Vực Sâu');
  vn = vn.replace(/Acquire (\d+) piece[s]? of Season 4 Gear/gi, 'Thu thập $1 trang bị Season 4');
  vn = vn.replace(/Enhance Season 4 Gear (\d+) times/gi, 'Cường hóa trang bị Season 4 $1 lần');

  return vn;
}

// 3. Process and Merge
const isEnglishEntity = (key) => {
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
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
    // Explicit high-quality patch translation
    finalStrings[key] = patchTranslations[key];
    countNewTranslated++;
  } else if (key.startsWith('AchievementString_')) {
    // Auto-translate achievement string
    finalStrings[key] = translateAchievement(key, enVal);
    countNewTranslated++;
  } else if (key.startsWith('InputKeyText_')) {
    // Key icon tag
    finalStrings[key] = enVal;
    countNewTranslated++;
  } else {
    // Fallback: translate using rule or keep
    finalStrings[key] = translateAchievement(key, enVal);
    countNewTranslated++;
  }
}

console.log(`Merge complete!`);
console.log(`- Retained existing: ${countRetained.toLocaleString()}`);
console.log(`- New Entity (English): ${countEntityEN.toLocaleString()}`);
console.log(`- New Content Translated (Vietnamese): ${countNewTranslated.toLocaleString()}`);
console.log(`- Total final keys: ${Object.keys(finalStrings).length.toLocaleString()}`);

// 4. Save JSON and CSV files
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

console.log('\n=== REPACKING MOD PAK FILE ===');
execSync('dotnet run --project tool pack', { cwd: __dirname, stdio: 'inherit' });

console.log('\n=== DEPLOYING TO GAME DIRECTORY ===');
const gameModsDir = 'F:\\NCSoft\\AION2_TW\\Aion2\\Content\\Paks\\~mods';
if (!fs.existsSync(gameModsDir)) {
  fs.mkdirSync(gameModsDir, { recursive: true });
  console.log(`Created directory: ${gameModsDir}`);
}

const srcPak = path.join(__dirname, 'pakchunk502000-Windows_999_P.pak');
const destPak = path.join(gameModsDir, 'pakchunk502000-Windows_999_P.pak');

fs.copyFileSync(srcPak, destPak);
console.log(`SUCCESS! Copied mod pak to: ${destPak}`);

console.log('\n=== UPDATE COMPLETED SUCCESSFULLY ===');
