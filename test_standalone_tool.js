const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST: Verifying Standalone Mod Tool Package ===');

const zipPath = path.join(__dirname, 'AION2_VietHoa_Standalone_Tool.zip');
assert(fs.existsSync(zipPath), 'Standalone ZIP must exist');
const zipStat = fs.statSync(zipPath);
assert(zipStat.size > 10 * 1024 * 1024, `ZIP size should be > 10MB, got ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);
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

const dataDir = path.join(releaseDir, 'Data');
assert(fs.existsSync(dataDir), 'Data directory must exist');
const datEn = path.join(dataDir, 'en-US', 'L10NString.dat');
const datKo = path.join(dataDir, 'ko-KR', 'L10NString.dat');
const datTw = path.join(dataDir, 'zh-TW', 'L10NString.dat');
const dummyPak = path.join(dataDir, 'dummy_pak.bin');

assert(fs.existsSync(datEn), 'en-US L10NString.dat must exist');
assert(fs.existsSync(datKo), 'ko-KR L10NString.dat must exist');
assert(fs.existsSync(datTw), 'zh-TW L10NString.dat must exist');
assert(fs.existsSync(dummyPak), 'dummy_pak.bin must exist');
assert.strictEqual(fs.statSync(dummyPak).size, 15, 'dummy_pak.bin must be exactly 15 bytes');

console.log('[PASS] All L10N data files, dummy pak, and scripts verified successfully!');
console.log('✅ ALL STANDALONE TOOL TESTS PASSED!');
