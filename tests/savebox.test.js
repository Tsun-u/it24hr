// tests/savebox.test.js（node --test）：存檔備份的 key 清單跟程式實際用到的一致（面板本身是共用模組，在瀏覽器驗）
const test = require('node:test'); const assert = require('node:assert');
const fs = require('node:fs'); const path = require('node:path');
const { C } = require('../contract.js');

const ROOT = path.join(__dirname, '..');
const usedKeys = () => {
  const keys = new Set();
  for (const file of fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && f !== 'contract.js')) {
    for (const [, key] of fs.readFileSync(path.join(ROOT, file), 'utf8').matchAll(/['"`](it24hr\.[A-Za-z]+)['"`]/g)) keys.add(key);
  }
  keys.delete('it24hr.jpg');   // 分享圖的檔名，不是存檔
  return [...keys].sort();
};

test('存檔備份帶走程式用到的每個 localStorage key：漏一個還原時會默默少一塊', () => {
  assert.ok(usedKeys().length >= 4, '掃得到 key');
  assert.deepStrictEqual([...C.SAVE_KEYS].sort(), usedKeys());
});
