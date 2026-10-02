const fs = require('fs');
const assert = require('assert');

console.log('Running test_mode_titles.js...');

const en = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf8'));
const vn = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf8'));
const tw = JSON.parse(fs.readFileSync('zh-TW_strings.json', 'utf8'));

const protectedModes = ['Season', 'Transcendence', 'Nightmare', 'Abyss', 'Arena', 'Arcana', 'Ascension Trial'];

for (const mode of protectedModes) {
  const enKeys = Object.keys(en).filter(k => en[k] === mode);
  assert(enKeys.length > 0, `Expected keys for mode: ${mode}`);
  
  for (const k of enKeys) {
    assert.strictEqual(
      vn[k], 
      mode, 
      `Mode title [${k}] in en-US_strings.json must remain in English '${mode}', got '${vn[k]}'`
    );
    assert.strictEqual(
      tw[k], 
      mode, 
      `Mode title [${k}] in zh-TW_strings.json must remain in English '${mode}', got '${tw[k]}'`
    );
  }
}

console.log(`PASS: All protected game mode titles remain strictly in English across ${protectedModes.length} modes.`);
