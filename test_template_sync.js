/**
 * Test verification for Aion 2 Purple Translate Template Mod
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

const templateRoot = 'H:/AION2_Code/aion2wwpurple-translate/Aion2/Content/L10N/Text';
const locales = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU'];

console.log('=== TEST: Verifying Aion2 Purple Template Mod Integrity ===');

assert(fs.existsSync(templateRoot), 'Template root directory must exist');

for (const loc of locales) {
  const locDir = path.join(templateRoot, loc);
  assert(fs.existsSync(locDir), `Locale directory ${loc} must exist`);

  const files = fs.readdirSync(locDir).filter(f => f.startsWith('L10NString.dat.'));
  assert.strictEqual(files.length, 1, `Locale ${loc} must have exactly one L10NString.dat.<md5> file`);

  const fileName = files[0];
  const expectedMd5 = fileName.replace('L10NString.dat.', '');
  const filePath = path.join(locDir, fileName);
  const data = fs.readFileSync(filePath);

  assert(data.length > 4000000, `File ${fileName} size (${data.length}) should be > 4MB`);
  
  const actualMd5 = crypto.createHash('md5').update(data).digest('hex').toLowerCase();
  assert.strictEqual(actualMd5, expectedMd5, `MD5 of ${fileName} must match its filename hash`);

  console.log(`[PASS] ${loc}: ${fileName} (${(data.length / (1024 * 1024)).toFixed(2)} MB, MD5: ${actualMd5})`);
}

console.log('\nAll 8 Purple Translate locale mod files verified successfully!');
