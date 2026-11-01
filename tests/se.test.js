// tests/se.test.js（node --test）：認識軟體工程頁的內容資料
const test = require('node:test'); const assert = require('node:assert');
const SE = require('../se-content.js');

const field = (blocks, label) => blocks.find(b => b.t === 'field' && b.label === label);
const allText = JSON.stringify(SE);

test('開場：從生活情境帶出問題、說清楚看完會懂什麼，每題都連到有答案的那一站', () => {
  assert.match(SE.hero[0].text, /兩週？$/);
  const opening = JSON.stringify(SE.hero);
  assert.match(opening, /巷口那間常去的手搖飲/);
  assert.match(opening, /走完一遍，你會知道/);
  const hooks = SE.hero.find(b => b.t === 'list').items.map(item => /\(#s(\d+)\)$/.exec(item)[1]).map(Number);
  assert.deepStrictEqual(hooks, [8, 9, 2, 10]);
  assert.match(JSON.stringify(SE.walk.stations[7].blocks), /連按兩次付款/);
  assert.match(JSON.stringify(SE.walk.stations[8].blocks), /第 40 筆/);
  assert.match(JSON.stringify(SE.walk.stations[1].blocks), /在地限定品項/);
  assert.match(JSON.stringify(SE.walk.stations[9].blocks), /少冰/);
});

test('結尾回到開場的巷口和兩週，第 12 站也接得上那個折扣', () => {
  const ending = JSON.stringify(SE.summary);
  assert.match(ending, /巷口/);
  assert.match(ending, /兩週/);
  assert.match(ending, /軟體工程/);
  assert.match(JSON.stringify(SE.walk.stations[11].blocks), /新折扣/);
});

test('12 站照順序，每站都有產出、做什麼、誰負責、例子和新人訓練的對照', () => {
  assert.strictEqual(SE.walk.stations.length, 12);
  SE.walk.stations.forEach((s, i) => {
    assert.strictEqual(s.no, i + 1);
    assert.ok(s.short && s.title);
    for (const label of ['這一站可能的產出', '這一站做什麼', '誰負責', '手搖飲需求案裡發生什麼', '遊戲內的新人訓練對應劇情']) assert.ok(field(s.blocks, label), `第 ${s.no} 站少了 ${label}`);
    assert.strictEqual(s.blocks[0].label, '這一站可能的產出', '產出排在最前面');
  });
  assert.match(SE.walk.closing.text, /^走到這裡/);
});

test('每個小範本都有連結點得到，連結也都找得到範本', () => {
  const links = [...allText.matchAll(/\]\(#(t\d+-\d+)\)/g)].map(m => m[1]);
  assert.deepStrictEqual([...new Set(links)].sort(), Object.keys(SE.templates).sort());
  for (const [id, t] of Object.entries(SE.templates)) assert.ok(t.title && t.blocks.length, id);
});

test('三種模型和 AI 開發的常見誤解都分成誤解和正解', () => {
  assert.strictEqual(SE.models.items.length, 3);
  for (const blocks of [...SE.models.items.map(m => m.blocks), SE.ai.blocks]) {
    const trap = field(blocks, '常見誤解');
    assert.ok(trap && trap.wrong && trap.right);
  }
  assert.ok(field(SE.models.items[2].blocks, '怎麼排').quote.length === 4, '敏捷宣言四句');
});

test('最後聊一題有四個選項，第四個是結論', () => {
  assert.deepStrictEqual(SE.question.options.map(o => o.label), ['瀑布模型', '迭代式開發', '敏捷式開發', '都有一點，也都不太像']);
  assert.match(JSON.stringify(SE.question.options[3].blocks), /沒有哪個模型是唯一解/);
});

test('內容稿的備註和本機路徑不會進到頁面', () => {
  for (const leak of ['還沒定的事', '做成頁面時', '小圖', 'docs/specs', '阿宇']) assert.ok(!allText.includes(leak), leak);
  assert.ok(SE.updated);
});
