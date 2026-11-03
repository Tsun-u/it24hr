// tests/wifi-rules.test.js（node --test）：老闆娘 Wi-Fi 的規則——私人位址、MAC 白名單、四個錯誤做法
const test = require('node:test');
const assert = require('node:assert');
const { WifiRules: W } = require('../wifi-rules.js');

const run = (state, ...actions) => {
  const outs = [];
  for (const [i, a] of actions.entries()) { const out = W.apply(state, { at: 700 + i, ...a }); outs.push(out); state = out.state; }
  return { state, outs, last: outs.at(-1) };
};
const blockedMacs = (s) => s.log.filter(r => r.result === 'blocked').map(r => r.mac);

test('一開始：公司網路連不上，紀錄裡 10:58 那筆被擋的是她手機的私人位址', () => {
  const s = W.init();
  assert.strictEqual(s.connected, null);
  assert.ok(s.phone.private);
  assert.ok(s.log.some(r => r.at === 10 * 60 + 58 && r.mac === W.PRIVATE_MAC && r.result === 'blocked'));
  assert.ok(!W.done(s));
});

test('私人位址是隨機的（第一組的第二個字是 2、6、A、E），真正的 MAC 不是', () => {
  assert.match(W.PRIVATE_MAC, /^.[26AE]:/);
  assert.doesNotMatch(W.REAL_MAC, /^.[26AE]:/);
});

test('正解：關掉私人位址 → 真正的 MAC 被擋一筆 → 加進白名單 → 連上、結案', () => {
  const r = run(W.init(), { type: 'togglePrivate' });
  assert.deepStrictEqual(blockedMacs(r.state).at(-1), W.REAL_MAC);
  assert.strictEqual(r.state.connected, null);
  const done = W.apply(r.state, { type: 'whitelist', mac: W.REAL_MAC, at: 720 });
  assert.strictEqual(done.state.connected, 'office');
  assert.ok(done.done);
  assert.ok(done.events.includes('connected'));
  assert.ok(!done.flags || !done.flags.privateListed);
});

test('順序反過來：先把私人位址加進白名單再關私人位址，換成真正的 MAC 又被擋', () => {
  const r = run(W.init(), { type: 'whitelist', mac: W.PRIVATE_MAC });
  assert.strictEqual(r.state.connected, 'office', '只登記私人位址也連得上');
  const after = W.apply(r.state, { type: 'togglePrivate', at: 730 });
  assert.strictEqual(after.state.connected, null);
  assert.strictEqual(blockedMacs(after.state).at(-1), W.REAL_MAC);
});

test('只登記私人位址：算結案；最後的狀態看得出是靠私人位址連上的（結算卡多一句），照正解補做就不是', () => {
  const out = W.apply(W.init(), { type: 'whitelist', mac: W.PRIVATE_MAC, at: 700 });
  assert.ok(out.done);
  assert.ok(W.privateListed(out.state));
  const fixed = run(out.state, { type: 'togglePrivate' }, { type: 'whitelist', mac: W.REAL_MAC });
  assert.ok(!W.privateListed(fixed.state));
});

test('關掉過濾後又打開：沒登記的她會被踢掉，雜事重新打開', () => {
  const r = run(W.init(), { type: 'filter', on: false }, { type: 'filter', on: true });
  assert.strictEqual(r.state.connected, null);
  assert.ok(r.last.reopen);
});

test('重打密碼：沒用，還是連不上', () => {
  const r = run(W.init(), { type: 'retype' }, { type: 'retype' });
  assert.strictEqual(r.state.connected, null);
  assert.strictEqual(r.last.say, '還是無法加入網路。');
  assert.strictEqual(r.state.phone.retyped, 2);
});

test('重開基地台：全公司斷線（outage 事件），她還是連不上，次數記下來', () => {
  const r = run(W.init(), { type: 'reboot' });
  assert.ok(r.last.events.includes('outage'));
  assert.strictEqual(r.state.connected, null);
  assert.deepStrictEqual(r.last.flags, { reboots: 1 });
});

test('關掉 MAC 過濾：馬上連上、算結案；排一個 30 分鐘後的資安檢查', () => {
  const out = W.apply(W.init(), { type: 'filter', on: false, at: 700 });
  assert.strictEqual(out.state.connected, 'office');
  assert.ok(out.done);
  assert.deepStrictEqual(out.flags, { filterOff: true });
  assert.deepStrictEqual(out.later, [{ after: 30, act: { type: 'securityCheck' } }]);
  const check = W.apply(out.state, { type: 'securityCheck', at: 730 });
  assert.ok(check.events.includes('securityMail'));
});

test('改連訪客網路：連得上、算結案；30 分鐘後印不到，雜事打開，切回公司網路照正解做才再結案', () => {
  const out = W.apply(W.init(), { type: 'join', network: 'guest', at: 700 });
  assert.strictEqual(out.state.connected, 'guest');
  assert.ok(out.done);
  assert.deepStrictEqual(out.flags, { guest: true });
  assert.deepStrictEqual(out.later, [{ after: 30, act: { type: 'printFail' } }]);
  const fail = W.apply(out.state, { type: 'printFail', at: 730 });
  assert.ok(fail.reopen);
  assert.ok(fail.events.includes('printFail'));
  assert.ok(!W.done(fail.state), '印不到之後不算好');
  const back = run(fail.state, { type: 'join', network: 'office' }, { type: 'togglePrivate' }, { type: 'whitelist', mac: W.REAL_MAC });
  assert.strictEqual(back.state.connected, 'office');
  assert.ok(back.last.done);
});

test('早就切回公司網路的話，30 分鐘後的印不到不會發生', () => {
  const r = run(W.init(), { type: 'join', network: 'guest' }, { type: 'join', network: 'office' }, { type: 'printFail' });
  assert.ok(!r.last.reopen);
});
