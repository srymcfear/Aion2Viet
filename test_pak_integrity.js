const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== RUNNING PAK INTEGRITY & MOUNT POINT UNIT TEST ===');

const repakExe = path.join(__dirname, 'repak_bin', 'repak.exe');
const aesKey = '0x06038EF544B6007614F8574F1B7C2A3F0D565F74CDCC1B366B4EA1A17B97CBFF';

// 1. Verify en-US pak structure
const pakEn = path.join(__dirname, 'pakchunk502000-Windows_999_P.pak');
assert(fs.existsSync(pakEn), 'en-US mod pak must exist');
const infoEn = execSync(`"${repakExe}" -a "${aesKey}" info "${pakEn}"`).toString();
assert(infoEn.includes('mount point: ../../../AION2/Content/L10N/Text/en-US/'), 'en-US mount point must match official casing AION2');
assert(infoEn.includes('path hash seed: Some(6E1C6CD8)'), 'en-US seed must be 0x6E1C6CD8');

const listEn = execSync(`"${repakExe}" -a "${aesKey}" list "${pakEn}"`).toString();
assert(listEn.includes('AION2/Content/L10N/Text/en-US/L10NString.dat'), 'en-US file entry must have AION2 path');

// 2. Verify ko-KR pak structure
const pakKo = path.join(__dirname, 'pakchunk501000-Windows_999_P.pak');
assert(fs.existsSync(pakKo), 'ko-KR mod pak must exist');
const infoKo = execSync(`"${repakExe}" -a "${aesKey}" info "${pakKo}"`).toString();
assert(infoKo.includes('mount point: ../../../AION2/Content/L10N/Text/ko-KR/'), 'ko-KR mount point must match official casing AION2');
assert(infoKo.includes('path hash seed: Some(4A74C4E7)'), 'ko-KR seed must be 0x4A74C4E7');

const listKo = execSync(`"${repakExe}" -a "${aesKey}" list "${pakKo}"`).toString();
assert(listKo.includes('AION2/Content/L10N/Text/ko-KR/L10NString.dat'), 'ko-KR file entry must have AION2 path');

// 3. Verify deployed files in Game folder (if game is installed)
const gameDir = 'F:\\NCSoft\\AION 2\\Aion2\\Content\\Paks';
if (fs.existsSync(gameDir)) {
  const deployedEn = path.join(gameDir, 'L10N', 'Text', 'en-US', 'pakchunk502000-Windows_999_P.pak');
  assert(fs.existsSync(deployedEn), 'Deployed en-US pak must exist in game folder');

  // Verify no .sig exists which would fail UE RSA verification
  const fakeSig = path.join(gameDir, 'L10N', 'Text', 'en-US', 'pakchunk502000-Windows_999_P.sig');
  assert(!fs.existsSync(fakeSig), 'Fake .sig must NOT exist in game folder');

  const basePak = path.join(gameDir, 'L10N', 'Text', 'en-US', 'pakchunk502000-Windows_0_P.pak');
  assert(fs.existsSync(basePak), 'Deployed _0_P.pak base must exist');

  const baseSig = path.join(gameDir, 'L10N', 'Text', 'en-US', 'pakchunk502000-Windows_0_P.sig');
  assert(!fs.existsSync(baseSig), 'Official _0_P.sig must be disabled so UE does not fail RSA check');
}

console.log('✅ ALL PAK INTEGRITY TESTS PASSED!');
