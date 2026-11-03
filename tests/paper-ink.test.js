const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { textKey, handFor } = require('../paper-ink.js');
const { collect } = require('../scripts/build-handwriting.js');
require('../hand-data.js');

const ROOT = path.resolve(__dirname, '..');

test('textKey：同一段文字得到同一個 key，不同文字不同', () => {
  assert.strictEqual(textKey('平板要充電'), textKey('平板要充電'));
  assert.notStrictEqual(textKey('平板要充電'), textKey('平板要充電。'));
  assert.match(textKey('a\nb'), /^[0-9a-f]{8}$/);
});

test('handFor：查得到給圖檔路徑與寬高，查不到回 null', () => {
  const data = { [textKey('測試')]: [120, 34] };
  assert.deepStrictEqual(handFor('測試', data), { src: `assets/hand/${textKey('測試')}.png`, width: 120, height: 34 });
  assert.strictEqual(handFor('沒畫過', data), null);
});

test('劇本裡的手寫文字都畫好了（改了文字要重跑 scripts/build-handwriting.js）', () => {
  const stale = collect().filter(e => !globalThis.HAND_DATA[e.key]).map(e => `${e.role}: ${e.text.split('\n')[0]}`);
  assert.deepStrictEqual(stale, []);
});

test('對照表裡的每張圖都在 assets/hand/', () => {
  const missing = Object.keys(globalThis.HAND_DATA).filter(k => !fs.existsSync(path.join(ROOT, 'assets', 'hand', `${k}.png`)));
  assert.deepStrictEqual(missing, []);
});
