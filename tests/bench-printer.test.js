// tests/bench-printer.test.js（node --test）：淑芬那台印表機換碳粉匣的規則（純邏輯，畫面在 bench-view.js 的 printer 場景）
const test = require('node:test');
const assert = require('node:assert');
const { BenchPrinter } = require('../bench-printer.js');

const run = (state, ...actions) => actions.reduce((acc, a) => {
  const out = BenchPrinter.apply(acc.state, a);
  return { state: out.state, outs: [...acc.outs, out] };
}, { state, outs: [] });
const last = (r) => r.outs[r.outs.length - 1];
const delivered = (series) => BenchPrinter.deliver(BenchPrinter.init(), series);
const cart = (state, series) => state.carts.find(c => c.series === series).id;

test('還沒到貨：開得了蓋、抽得出舊匣，印不出來', () => {
  const r = run(BenchPrinter.init(), { type: 'open' }, { type: 'pullOld' }, { type: 'close' }, { type: 'print' });
  assert.strictEqual(r.state.old, 'out');
  assert.match(last(r).say, /沒有碳粉匣/);
  assert.ok(!last(r).done);
});

test('蓋子關著不能抽舊匣；舊匣沒抽不能裝新的', () => {
  const s = delivered(['C']);
  assert.match(last(run(s, { type: 'pullOld' })).say, /前蓋/);
  const r = run(s, { type: 'open' }, { type: 'insert', cart: cart(s, 'C') });
  assert.match(last(r).say, /舊的/);
  assert.strictEqual(r.state.carts[0].at, 'desk');
});

test('系列不對推不進去，留在桌上', () => {
  const s = delivered(['A', 'B', 'C', 'D', 'E']);
  const r = run(s, { type: 'open' }, { type: 'pullOld' }, { type: 'insert', cart: cart(s, 'B') });
  assert.match(last(r).say, /推不進去/);
  assert.ok(last(r).events.includes('refused'));
  assert.strictEqual(r.state.carts.find(c => c.series === 'B').at, 'desk');
});

test('忘了撕封條：測試頁一片空白，拉出來撕掉再印就好了', () => {
  const s = delivered(['C']); const c = cart(s, 'C');
  let r = run(s, { type: 'open' }, { type: 'pullOld' }, { type: 'insert', cart: c }, { type: 'close' }, { type: 'print' });
  assert.strictEqual(r.state.page, 'blank');
  assert.match(last(r).say, /一片空白/);
  assert.ok(!last(r).done && !BenchPrinter.done(r.state));
  r = run(r.state, { type: 'open' }, { type: 'pull', cart: c }, { type: 'peel', cart: c }, { type: 'insert', cart: c }, { type: 'close' }, { type: 'print' });
  assert.strictEqual(r.state.page, 'ok');
  assert.ok(last(r).done && BenchPrinter.done(r.state));
});

test('裝在印表機裡的不能撕封條、不能搖；前蓋開著不能印', () => {
  const s = delivered(['C']); const c = cart(s, 'C');
  const r = run(s, { type: 'open' }, { type: 'pullOld' }, { type: 'insert', cart: c });
  assert.match(last(run(r.state, { type: 'peel', cart: c })).say, /拿出來/);
  assert.match(last(run(r.state, { type: 'print' })).say, /前蓋/);
});

test('十六連擊：同一盒搖到第 5 下「要更快」、第 10 下「還要更快！」、第 16 下「良し！」，之後沒有變化', () => {
  const s = delivered(['C']); const c = cart(s, 'C');
  const shakes = Array.from({ length: 17 }, () => ({ type: 'shake', cart: c }));
  const r = run(s, ...shakes);
  assert.strictEqual(r.outs[4].say, '要更快');
  assert.strictEqual(r.outs[9].say, '還要更快！');
  assert.strictEqual(r.outs[15].say, '良し！');
  assert.ok(r.outs[15].events.includes('starburst'));
  assert.ok(!r.outs[16].events.includes('starburst'));
  assert.notStrictEqual(r.outs[16].say, '良し！');
});

test('星爆16連擊：裝進去的那盒剛好搖 16 下才算；15、17 下、抽出來多搖一下再裝都不算', () => {
  const insertAfter = (n) => {
    const s = delivered(['C']); const c = cart(s, 'C');
    const r = run(s, { type: 'open' }, { type: 'pullOld' }, ...Array.from({ length: n }, () => ({ type: 'shake', cart: c })), { type: 'insert', cart: c });
    return { r, c, flag: last(r).flags.starburst };
  };
  assert.strictEqual(insertAfter(16).flag, true);
  assert.strictEqual(insertAfter(15).flag, false);
  assert.strictEqual(insertAfter(17).flag, false);
  const { r, c } = insertAfter(16);
  const again = run(r.state, { type: 'pull', cart: c }, { type: 'shake', cart: c }, { type: 'insert', cart: c });
  assert.strictEqual(last(again).flags.starburst, false);
});

test('第一次打開前蓋：先講看得到碳粉匣，再自己說「幫我撐十秒」、淑芬回一句；之後再開只有第一句', () => {
  const r = run(BenchPrinter.init(), { type: 'open' }, { type: 'close' }, { type: 'open' });
  assert.match(r.outs[0].say, /^打開前蓋，看得到裡面的碳粉匣。\n你：「幫我撐十秒！」/);
  assert.match(r.outs[0].say, /好，知道了，換快一點。/);
  assert.ok(!/幫我撐十秒/.test(r.outs[2].say));
  assert.strictEqual(r.outs[2].say, '打開前蓋，看得到裡面的碳粉匣。');
});

test('轉到背面看到財產貼紙：記一個旗標（之後打電話報得出型號）', () => {
  const out = BenchPrinter.apply(BenchPrinter.init(), { type: 'sawBack' });
  assert.ok(out.state.sticker && out.events.includes('sticker'));
  assert.deepStrictEqual(out.flags, { sawSticker: true });
  assert.ok(!BenchPrinter.apply(out.state, { type: 'sawBack' }).events.includes('sticker'), '看過了不重複');
});

test('人走開時印表機不能用（蓋子開著、舊的抽了新的沒裝）淑芬才會催；沒東西要搬', () => {
  assert.ok(!BenchPrinter.blocked(BenchPrinter.init()));
  const opened = run(BenchPrinter.init(), { type: 'open' }).state;
  assert.ok(BenchPrinter.blocked(opened));
  assert.deepStrictEqual(BenchPrinter.carrying(opened), { items: [], heavy: false });
});
