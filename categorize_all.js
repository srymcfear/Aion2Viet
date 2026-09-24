const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

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

function categorizeKey(key) {
  // --- KEEP ENGLISH CATEGORIES ---
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return 'EN_SkillName';
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return 'EN_SkillBuffName';
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return 'EN_GatherSkillName';

  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return 'EN_ItemName';
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return 'EN_SkinName';
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return 'EN_SkinSetName';
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return 'EN_WingName';
  if (key.startsWith('String_STR_GODSTONE_') && key.endsWith('_body')) return 'EN_GodstoneName';
  if (key.startsWith('String_STR_PERIOD_') && key.endsWith('_body')) return 'EN_PeriodItemName';
  if (key.startsWith('String_STR_AD_') && key.endsWith('_body')) return 'EN_ArtworkStatueName';
  if (key.startsWith('String_STR_ARCANA_') && key.endsWith('_body')) return 'EN_ArcanaName';

  if (key.startsWith('String_STR_N_') && key.endsWith('_body')) return 'EN_NpcName';
  if (key.startsWith('AnonymousNameData_')) return 'EN_AnonymousName';
  if (key.startsWith('Post_') && key.endsWith('_sender_name')) return 'EN_SenderName';

  if (key.startsWith('String_STR_M_') && key.endsWith('_body')) return 'EN_MonsterBossName';
  if (key.startsWith('String_STR_KalnifElite_') || key.startsWith('String_STR_Ferk_') ||
      key.startsWith('String_STR_AncientEle_') || key.startsWith('String_STR_WindEle_') ||
      key.startsWith('String_STR_EarthEle_') || key.startsWith('String_STR_FireEle_') ||
      key.startsWith('String_STR_WaterEle_')) return 'EN_MonsterBossName';

  if (key.startsWith('String_STR_Subzone_') && key.endsWith('_body')) return 'EN_SubzoneName';
  if (key.startsWith('ServerName_') && key.endsWith('_desc')) return 'EN_ServerName';
  if (key.startsWith('String_STR_GROUP_UNLOCK_MONOLITHFRAGMENT_')) return 'EN_LocationMonolith';
  if (knownSingleLocations.has(key)) return 'EN_LocationLandmark';
  if (key.startsWith('EnvObjData_') && key.includes('TeleportArtifact') && key.endsWith('_desc')) return 'EN_TeleportSpot';
  if (key.startsWith('QuestString_')) return 'EN_Quest';
  if (key.startsWith('QuestPart_')) return 'EN_QuestPart';
  if (key.startsWith('String_STR_MapEvent_')) return 'EN_MapEventObjective';
  if (key.startsWith('String_STR_QUEST_GOAL_')) return 'EN_QuestGoalTemplate';

  // --- TRANSLATE VIETNAMESE CATEGORIES ---
  if (key.startsWith('SkillString_')) return 'VN_SkillDesc';
  if (key.startsWith('SkillAbnormalString_')) return 'VN_SkillAbnormalDesc';
  if (key.startsWith('SkillCondString_')) return 'VN_SkillCondition';
  if (key.startsWith('String_STR_ITEM_') && key.includes('_DESC_')) return 'VN_ItemDesc';
  if (key.startsWith('GatherSkill_') && key.endsWith('_desc_long')) return 'VN_GatherDesc';
  if (key.startsWith('CurrencyInfo_')) return 'VN_CurrencyDesc';

  if (key.startsWith('NpcTalk_')) return 'VN_NpcDialogue';
  if (key.startsWith('CutsceneSubtitle_')) return 'VN_CutsceneSubtitle';
  if (key.startsWith('NoteData_')) return 'VN_LoreNote';

  if (key.startsWith('String_UI_') || key.startsWith('UI_')) return 'VN_UI';
  if (key.startsWith('Message_')) return 'VN_Message';
  if (key.startsWith('CommandFunc_')) return 'VN_Command';
  if (key.startsWith('GuideData_')) return 'VN_GuideTutorial';
  if (key.startsWith('InputKeyMapping_') || key.startsWith('InputKeyText_')) return 'VN_InputKey';
  if (key.startsWith('AchievementString_')) return 'VN_Achievement';
  if (key.startsWith('Title_')) return 'VN_Title';
  if (key.startsWith('PcSocialAction_')) return 'VN_SocialAction';
  if (key.startsWith('String_STR_CHAT_')) return 'VN_CombatChat';
  if (key.startsWith('String_StatName_') || key.startsWith('String_AttrStatName_') || key.startsWith('String_STR_Desc_')) return 'VN_StatsDesc';

  return 'VN_OtherContent';
}

const stats = {};
for (const k of keys) {
  const cat = categorizeKey(k);
  stats[cat] = (stats[cat] || 0) + 1;
}

console.log('Category Distribution for all 156,036 keys:');
const sortedStats = Object.entries(stats).sort((a,b) => b[1] - a[1]);
let enTotal = 0;
let vnTotal = 0;
for (const [cat, count] of sortedStats) {
  console.log(`  ${cat.padEnd(25)} : ${count.toString().padStart(6)}`);
  if (cat.startsWith('EN_')) enTotal += count;
  else vnTotal += count;
}
console.log('--------------------------------------------------');
console.log(`Total Keys KEPT IN ENGLISH (tra cứu)    : ${enTotal.toLocaleString()}`);
console.log(`Total Keys TRANSLATED TO VN (thấu hiểu) : ${vnTotal.toLocaleString()}`);
console.log(`Sum Total                               : ${(enTotal + vnTotal).toLocaleString()}`);
