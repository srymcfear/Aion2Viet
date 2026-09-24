const fs = require('fs');

const currentData = JSON.parse(fs.readFileSync('en-US_strings.json', 'utf-8'));
const entries = Object.entries(currentData);

const terms = [
  'Đá Mana',
  'Đá Linh Hồn',
  'Điểm Vực Sâu',
  'Hắc Đạo',
  'Thử Thách Thăng Hoa',
  'Thử Thách Thăng Cấp',
  'Thử Thách Thăng hoa',
  'Đại Thần',
  'Chư Hầu',
  'Chúa tể Empyrean',
  'Đền Lửa',
  'Cái Nôi Của Hư Vô',
  'Cái Nôi của Tồn Tại Hư Vô',
  'Vực Thẳm',
  'Vực thẳm',
  'Thánh địa',
  'Người Tìm Kiếm Nhật Ký',
];

console.log('Counting translated game terms in current translations:');
for (const t of terms) {
  let c = 0;
  for (const [k, v] of entries) {
    if (typeof v === 'string' && v.includes(t)) c++;
  }
  console.log(`  "${t}": ${c} occurrences`);
}
