const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== TEST: Verifying Release Package & Mod Backup ===');

const zipPath = path.join(__dirname, 'AION2_VietHoa_Purple_Mod.zip');
assert(fs.existsSync(zipPath), 'Release ZIP must exist');
const zipStat = fs.statSync(zipPath);
assert(zipStat.size > 30 * 1024 * 1024, `ZIP size should be > 30MB, got ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log(`[PASS] ZIP Package exists and valid: ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);

const releaseDir = path.join(__dirname, 'release', 'AION2_VietHoa_Purple_Mod');
assert(fs.existsSync(releaseDir), 'Release directory must exist');

const installerBat = path.join(releaseDir, 'CAI_DAT_TU_DONG.bat');
assert(fs.existsSync(installerBat), '1-click installer BAT must exist');
const batContent = fs.readFileSync(installerBat, 'utf8');
assert(batContent.includes('A2_WW_L_GA_PURPLE'), 'BAT script must check Aion2 Global registry');
assert(batContent.includes('A2_TW_L_GA_PURPLE'), 'BAT script must check Aion2 TW registry');
console.log('[PASS] Auto installer script verified');

const docFile = path.join(releaseDir, 'HUONG_DAN_SU_DUNG.txt');
assert(fs.existsSync(docFile), 'Instructions TXT must exist');
console.log('[PASS] User documentation verified');

const locales = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU'];
const l10nDir = path.join(releaseDir, 'Aion2', 'Content', 'L10N', 'Text');

for (const loc of locales) {
  const locFolder = path.join(l10nDir, loc);
  assert(fs.existsSync(locFolder), `Locale folder ${loc} must exist`);

  const datFiles = fs.readdirSync(locFolder).filter(f => f.startsWith('L10NString.dat.'));
  assert.strictEqual(datFiles.length, 1, `Locale ${loc} must contain exactly one dat file`);

  const datPath = path.join(locFolder, datFiles[0]);
  const expectedHash = datFiles[0].replace('L10NString.dat.', '');
  const data = fs.readFileSync(datPath);
  const actualHash = crypto.createHash('md5').update(data).digest('hex').toLowerCase();

  assert.strictEqual(actualHash, expectedHash, `Hash mismatch for ${datFiles[0]}`);
  console.log(`[PASS] ${loc}: ${datFiles[0]} (${(data.length / (1024 * 1024)).toFixed(2)} MB)`);
}

console.log('\n✅ ALL PACKAGE TESTS PASSED SUCCESSFULLY!');
