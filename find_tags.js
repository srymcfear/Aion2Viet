const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const tagTypes = new Set();
const tagRegex = /<([a-zA-Z0-9_]+)[^>]*>/g;

for (const v of Object.values(enData)) {
  if (typeof v === 'string') {
    let match;
    while ((match = tagRegex.exec(v)) !== null) {
      tagTypes.add(match[1]);
    }
  }
}

console.log('Tag types found in official EN:', [...tagTypes]);
