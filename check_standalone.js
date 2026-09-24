const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const keys = Object.keys(enData);

// Known location key prefixes or patterns in String_STR_
const locationPrefixes = [
  'String_STR_Subzone_',
  'ServerName_',
  'String_STR_GROUP_UNLOCK_MONOLITHFRAGMENT_',
];

// Single location keys identified earlier in String_STR_
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

function isStandAloneEntityToKeepInEnglish(key) {
  // 1. Skill Names
  if (key.startsWith('SkillString_') && key.endsWith('_skill_name')) return true;
  if (key.startsWith('SkillAbnormalString_') && key.endsWith('_desc_name')) return true;
  if (key.startsWith('GatherSkill_') && key.endsWith('_string_skill')) return true;

  // 2. Item Names
  if (key.startsWith('String_STR_ITEM_') && !key.includes('_DESC_')) return true;
  if (key.startsWith('Skin_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('SkinSet_') && (key.endsWith('_desc_light') || key.endsWith('_desc_dark'))) return true;
  if (key.startsWith('Wing_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GODSTONE_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_PERIOD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_AD_') && key.endsWith('_body')) return true;
  if (key.startsWith('String_STR_ARCANA_') && key.endsWith('_body')) return true;

  // 3. Character & NPC Names
  if (key.startsWith('String_STR_N_') && key.endsWith('_body')) return true;
  if (key.startsWith('AnonymousNameData_')) return true;
  if (key.startsWith('Post_') && key.endsWith('_sender_name')) return true;

  // 4. Monster & Boss Names
  if (key.startsWith('String_STR_M_') && key.endsWith('_body')) return true;

  // 5. Locations & Subzones & Servers
  if (key.startsWith('String_STR_Subzone_') && key.endsWith('_body')) return true;
  if (key.startsWith('ServerName_') && key.endsWith('_desc')) return true;
  if (key.startsWith('String_STR_GROUP_UNLOCK_MONOLITHFRAGMENT_')) return true;
  if (knownSingleLocations.has(key)) return true;
  if (key.startsWith('EnvObjData_') && key.includes('TeleportArtifact') && key.endsWith('_desc')) return true;

  return false;
}

let count = 0;
for (const k of keys) {
  if (isStandAloneEntityToKeepInEnglish(k)) count++;
}
console.log(`Identified ${count} keys for 100% English preservation.`);
