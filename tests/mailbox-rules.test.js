// tests/mailbox-rules.test.js（node --test）：美玲的信箱規則——刪除的郵件、封存位置、會計師的信、下午第二輪轉寄
const test = require('node:test');
const assert = require('node:assert');
const { MailboxRules: M } = require('../mailbox-rules.js');

const run = (state, ...actions) => {
  const outs = [];
  for (const [i, a] of actions.entries()) { const out = M.apply(state, { at: 810 + i, ...a }); outs.push(out); state = out.state; }
  return { state, outs, last: outs.at(-1) };
};

test('一開始：2,020 MB／2,000 MB，超過上限寄不出去', () => {
  const s = M.init();
  assert.strictEqual(M.used(s), 2020);
  assert.strictEqual(M.pct(s), 101);
  assert.ok(!M.done(s));
});

test('刪掉的信先進「刪除的郵件」，容量不變；清空才真的少', () => {
  const r = run(M.init(), { type: 'delete', ids: ['video'] });
  assert.strictEqual(M.used(r.state), 2020);
  assert.ok(!r.last.done);
  const purged = M.apply(r.state, { type: 'purge', at: 820 });
  assert.strictEqual(M.used(purged.state), 1606);
  assert.ok(purged.done, '低於上限，寄得出去');
});

test('只清掉尾牙影片：寄得出去，但還在安全線上（80.3%）', () => {
  const r = run(M.init(), { type: 'delete', ids: ['video'] }, { type: 'purge' });
  assert.ok(M.done(r.state));
  assert.ok(!M.safe(r.state));
  assert.strictEqual(M.pct(r.state), 80.3);
});

test('第一次寄得出信後 60 分鐘第二輪轉寄；還在安全線上就又爆（refull、reopen）', () => {
  const r = run(M.init(), { type: 'delete', ids: ['video'] }, { type: 'purge' });
  assert.deepStrictEqual(r.last.later, [{ after: 60, act: { type: 'refill' } }]);
  const refill = M.apply(r.state, { type: 'refill', at: 880 });
  assert.ok(refill.events.includes('refull'));
  assert.ok(refill.reopen);
  assert.ok(!M.done(refill.state));
});

test('清到安全線以下，第二輪進來也不會爆，不出聲', () => {
  const r = run(M.init(), { type: 'delete', ids: ['video', 'catalog'] }, { type: 'purge' });
  assert.ok(M.safe(r.state));
  const refill = M.apply(r.state, { type: 'refill', at: 880 });
  assert.deepStrictEqual(refill.events, []);
  assert.ok(M.done(refill.state));
});

test('第一次封存要先選位置；選了這台電腦，封存直接搬出信箱', () => {
  const first = M.apply(M.init(), { type: 'archive', ids: ['audit'], at: 810 });
  assert.ok(first.needPlace);
  assert.strictEqual(M.used(first.state), 2020);
  const r = run(M.init(), { type: 'archiveTo', place: 'local' }, { type: 'archive', ids: ['audit', 'video'] });
  assert.strictEqual(M.used(r.state), 2020 - 176 - 414);
  assert.ok(!r.last.later || !r.last.later.some(l => l.act.type === 'shareCheck'));
});

test('封存檔放共用槽：30 分鐘後共用槽滿（shareFull）；在那之前改回這台電腦就沒事', () => {
  const r = run(M.init(), { type: 'archiveTo', place: 'share' }, { type: 'archive', ids: ['video'] });
  assert.ok(r.last.later.some(l => l.after === 30 && l.act.type === 'shareCheck'));
  const full = M.apply(r.state, { type: 'shareCheck', at: 850 });
  assert.ok(full.events.includes('shareFull'));
  assert.deepStrictEqual(full.flags, { shareFull: true });
  const moved = run(r.state, { type: 'archiveTo', place: 'local' }, { type: 'shareCheck' });
  assert.deepStrictEqual(moved.last.events, []);
});

test('會計師的信：刪了還沒清空可以移回來；清空之後 15:30 起會計師來要', () => {
  const back = run(M.init(), { type: 'delete', ids: ['audit'] }, { type: 'restore', ids: ['audit'] }, { type: 'purge' });
  assert.ok(!back.state.accountantGone);
  const gone = run(M.init(), { type: 'delete', ids: ['audit', 'video'] }, { type: 'purge' });
  assert.ok(gone.state.accountantGone);
  assert.deepStrictEqual(gone.last.flags, { accountantGone: true });
  const ask = gone.last.later.find(l => l.act.type === 'accountantAsks');
  assert.strictEqual(ask.after, 15 * 60 + 30 - 811, '13:31 清空：等到 15:30');
  const late = M.apply(gone.state, { type: 'accountantAsks', at: 950 });
  assert.ok(late.events.includes('accountantAsks'));
});

test('其他往來信件（一千多封小信）不能整串動', () => {
  const r = run(M.init(), { type: 'delete', ids: ['misc'] });
  assert.strictEqual(r.state.groups.find(g => g.id === 'misc').where, 'inbox');
});
