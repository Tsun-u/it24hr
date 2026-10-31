// tests/share.test.js（node --test）：結算卡分享的那段話（圖是 canvas 畫的，在瀏覽器驗）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const Share = require('../share.js');

const view = { scriptName: '第二天：Hybrid', report: { kind: 'Stack', line: '最後進來的最先處理。' } };

test('分享的那段話：哪一天、今天你是什麼、總評、遊戲一句話和 hashtag', () => {
  assert.strictEqual(Share.text(view), '我在 IT24hr 過完了第二天，今天我是「Stack」：最後進來的最先處理。 軟體工程師的一天，免安裝的小遊戲 #IT24hr');
});
test('複製到剪貼簿的版本帶網址（系統分享另外帶網址）', () => {
  assert.strictEqual(Share.url(), `${C.SHARE_URL}?utm_source=share`);
  assert.match(Share.text(view, true), new RegExp(`免安裝的小遊戲：${C.SHARE_URL.replace(/[.?/]/g, '\\$&')}\\?utm_source=share #IT24hr$`));
});
test('BAD END 的那段話寫原因', () => {
  assert.match(Share.text({ ...view, badEnd: '06:00 了。下個月的盤點，阿賢還是一台一台對。' }), /^我在 IT24hr 的第二天 BAD END 了：「06:00 了。/);
});

test('三天總結算的分享文字：完成新人訓練＋印章一串', () => {
  const summary = { days: [], chain: 'Stack → Queue → Tree' };
  assert.match(Share.text({ summary }), /^我在 IT24hr 完成了新人訓練：Stack → Queue → Tree/);
  assert.ok(Share.text({ summary }, true).includes(C.SHARE_URL));
});
