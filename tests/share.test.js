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

test('總結算圖每天一句同事評語：三天盡量不同人、不同句，沒評語的那天留空', () => {
  const SA = { who: 'SA 怡君', text: '「文件寫得比我開的卡還清楚。」' }, QC = { who: 'QC 阿姿', text: '「自己先測過的卡，驗起來就是不一樣。」' };
  const pan = { who: '同事 小潘', text: '「這段程式我不想接。」' };
  assert.deepStrictEqual(Share.dayQuotes([{ peers: [SA, QC, pan] }, { peers: [SA, QC, pan] }, { peers: [SA, QC, pan] }]).map(p => p.who), ['SA 怡君', 'QC 阿姿', '同事 小潘'], '第一句永遠是 SA：不能三天都是她');
  assert.deepStrictEqual(Share.dayQuotes([{ peers: [SA] }, { peers: [{ who: 'SA 怡君', text: '「換一句。」' }] }]).map(p => p.text), [SA.text, '「換一句。」'], '只有同一個人：換一句');
  assert.deepStrictEqual(Share.dayQuotes([{ peers: [SA] }, { peers: [SA] }]).map(p => p.text), [SA.text, SA.text], '真的只有這句就還是放');
  assert.deepStrictEqual(Share.dayQuotes([{ peers: [] }, {}, { peers: [QC] }]), [null, null, QC], '舊存檔沒有評語的那天留空');
});
