const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== TEST: Verifying Standalone Mod Tool Package ===');

const zipPath = path.join(__dirname, 'AION2_VietHoa_Standalone_Tool.zip');
assert(fs.existsSync(zipPath), 'Standalone ZIP must exist');
const zipStat = fs.statSync(zipPath);
assert(zipStat.size > 15 * 1024 * 1024, `ZIP size should be > 15MB, got ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log(`[PASS] ZIP Package exists and valid: ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);

const releaseDir = path.join(__dirname, 'release', 'AION2_VietHoa_Standalone');
assert(fs.existsSync(releaseDir), 'Release directory must exist');

const installBat = path.join(releaseDir, 'CAI_DAT_TIENG_VIET.bat');
assert(fs.existsSync(installBat), 'CAI_DAT_TIENG_VIET.bat must exist');

const uninstallBat = path.join(releaseDir, 'KHOI_PHUC_GOC.bat');
assert(fs.existsSync(uninstallBat), 'KHOI_PHUC_GOC.bat must exist');

const installPs = path.join(releaseDir, 'install.ps1');
assert(fs.existsSync(installPs), 'install.ps1 must exist');
const psContent = fs.readFileSync(installPs, 'utf8');
assert(psContent.startsWith('\uFEFF'), 'install.ps1 must have UTF-8 BOM for Windows PowerShell 5.1');
assert(psContent.includes('ExcludedUpdateList.dat'), 'install.ps1 must configure ExcludedUpdateList.dat');

const paksDir = path.join(releaseDir, 'Paks');
assert(fs.existsSync(paksDir), 'Paks directory must exist');
const pakEn = path.join(paksDir, 'pakchunk502000-Windows_999_P.pak');
const pakKo = path.join(paksDir, 'pakchunk501000-Windows_999_P.pak');
const pakTw = path.join(paksDir, 'pakchunk502000-Windows_999_P_universal.pak');

assert(fs.existsSync(pakEn), 'en-US pak must exist');
assert(fs.existsSync(pakKo), 'ko-KR pak must exist');
assert(fs.existsSync(pakTw), 'TW pak must exist');

console.log('[PASS] All mod paks and scripts verified successfully!');

// Test installer execution in dry-run/real verification
const repakExe = path.join(__dirname, 'repak_bin', 'repak.exe');
const aesKey = '0x06038EF544B6007614F8574F1B7C2A3F0D565F74CDCC1B366B4EA1A17B97CBFF';
const infoEn = execSync(`"${repakExe}" -a "${aesKey}" info "${pakEn}"`).toString();
assert(infoEn.includes('mount point: ../../../AION2/Content/L10N/Text/en-US/'), 'pak mount point verified');
assert(infoEn.includes('path hash seed: Some(6E1C6CD8)'), 'pak hash seed verified');

console.log('✅ ALL STANDALONE TOOL TESTS PASSED!');
