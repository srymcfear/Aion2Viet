const fs = require('fs');

const enData = JSON.parse(fs.readFileSync('official_en-US_strings.json', 'utf-8'));
const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));

const qkSet = new Set();
const qkRegex = /<QK>(.*?)<\/>/g;

for (const [k, v] of Object.entries(enData)) {
  if (typeof v === 'string') {
    let match;
    while ((match = qkRegex.exec(v)) !== null) {
      qkSet.add(match[1]);
    }
  }
}

console.log(`Found ${qkSet.size} unique <QK> keywords in official EN!`);
console.log('Sample <QK> keywords (first 40):');
console.log([...qkSet].slice(0, 40));
