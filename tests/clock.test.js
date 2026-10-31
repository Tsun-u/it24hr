// tests/clock.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const { C } = require('../contract.js');
const { Clock } = require('../clock.js');

test('09:00 起算，推進真實毫秒換算成遊戲分鐘', () => {
  const c = new Clock();
  assert.strictEqual(c.minute, C.DAY_START_MIN);
  c.advance(C.MS_PER_GAME_MIN * 30);
  assert.strictEqual(c.minute, C.DAY_START_MIN + 30);
  assert.strictEqual(c.label(), '09:30');
});

test('暫停時不前進；玩家暫停與提示暫停各自獨立', () => {
  const c = new Clock();
  c.pause('player'); c.advance(5000); assert.strictEqual(c.minute, C.DAY_START_MIN);
  c.pause('hint'); c.resume('player'); c.advance(5000); assert.strictEqual(c.minute, C.DAY_START_MIN);
  assert.ok(c.isPaused);
  c.resume('hint'); assert.ok(!c.isPaused);
  c.advance(C.MS_PER_GAME_MIN); assert.strictEqual(c.minute, C.DAY_START_MIN + 1);
});

test('到點事件只觸發一次，順序照時間', () => {
  const c = new Clock(); const fired = [];
  c.at(C.DAY_START_MIN + 10, () => fired.push('b'));
  c.at(C.DAY_START_MIN + 5, () => fired.push('a'));
  c.advance(C.MS_PER_GAME_MIN * 20);
  assert.deepStrictEqual(fired, ['a', 'b']);
  c.advance(C.MS_PER_GAME_MIN * 20);
  assert.deepStrictEqual(fired, ['a', 'b']);
});

test('spend 直接吃掉一段遊戲時間，到點事件照樣觸發', () => {
  const c = new Clock(); const fired = [];
  c.at(C.DAY_START_MIN + 30, () => fired.push('x'));
  c.spend(45);
  assert.strictEqual(c.label(), '09:45');
  assert.deepStrictEqual(fired, ['x']);
});

test('不滿一分鐘的毫秒會累積，不會掉', () => {
  const c = new Clock();
  for (let i = 0; i < 10; i++) c.advance(C.MS_PER_GAME_MIN / 10);
  assert.strictEqual(c.minute, C.DAY_START_MIN + 1);
});

test('跨過午夜的標籤與「過了多少小時」', () => {
  const c = new Clock();
  c.spend(16 * 60 + 30);
  assert.strictEqual(c.label(), '01:30');
  assert.strictEqual(c.elapsedMin, 16 * 60 + 30);
});
