// tests/home.test.js（node --test）：下班選單的資料與判定
const test = require('node:test'); const assert = require('node:assert');
const Home = require('../home.js');

test('21:00 前是晚餐，之後只剩宵夜', () => {
  assert.strictEqual(Home.menuFor(18 * 60), 'dinner');
  assert.strictEqual(Home.menuFor(20 * 60 + 59), 'dinner');
  assert.strictEqual(Home.menuFor(21 * 60), 'lateNight');
  assert.deepStrictEqual(Home.MENUS.dinner.delivery.items.slice(0, 5), Home.MENUS.dinner.pickup.items, '外送有順路買的全部');
  for (const menu of Object.values(Home.MENUS)) for (const ch of Object.values(menu)) for (const id of ch.items) assert.ok(Home.FOODS[id], id);
});

test('買多少都可以；不在選單上的、沒主餐的加購飲料不行', () => {
  assert.strictEqual(Home.checkOrder('dinner', 'pickup', { bento: 9, bubble_tea: 3 }), null);
  assert.strictEqual(Home.checkOrder('dinner', 'pickup', {}), null, '什麼都不買也可以');
  assert.ok(Home.checkOrder('dinner', 'pickup', { steak: 1 }), '牛排只有外送');
  assert.ok(Home.checkOrder('lateNight', 'delivery', { black_tea: 1 }), '紅茶要跟滷味或鹹酥雞一起加購');
  assert.strictEqual(Home.checkOrder('lateNight', 'delivery', { yansuji: 1, black_tea: 2 }), null);
});

test('大胃王：選單每一樣都買；小鳥胃：什麼都沒買或只買一杯飲料', () => {
  const all = Object.fromEntries(Home.MENUS.dinner.pickup.items.map(id => [id, 1]));
  assert.strictEqual(Home.appetite('dinner', 'pickup', all), '大胃王');
  assert.strictEqual(Home.appetite('dinner', 'pickup', {}), '小鳥胃');
  assert.strictEqual(Home.appetite('lateNight', 'pickup', { cvs_coffee: 1 }), '小鳥胃');
  assert.strictEqual(Home.appetite('dinner', 'pickup', { bento: 1 }), null);
});

test('下班休閒玩了多久照小時寫', () => {
  assert.strictEqual(Home.describeFun({ console: 90, manga: 30, tablet: 0 }), '打電動 1 小時 30 分鐘、看漫畫 30 分鐘');
  assert.strictEqual(Home.describeFun({}), '');
  assert.strictEqual(Home.progress('tablet', 0), '第 1 集');
  assert.strictEqual(Home.progress('console', 31), '第 3 關');
});

test('茶几上的品名照份數寫', () => {
  assert.strictEqual(Home.describe({ bento: 2, bubble_tea: 1, fried_rice: 0 }), '便當×2、手搖飲');
  assert.strictEqual(Home.describe({}), '什麼都沒買');
});
