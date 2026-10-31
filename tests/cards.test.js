// tests/cards.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const { makeCard, Board } = require('../cards.js');

test('新卡欄位齊全、標籤永遠是 Priority', () => {
  const k = makeCard({ id: 'c1', title: '資產清單', body: '…', assignee: '玩家', estimate: null });
  assert.strictEqual(k.tag, 'Priority'); assert.strictEqual(k.status, 'new');
  assert.deepStrictEqual(k.history, []); assert.strictEqual(k.actualMin, 0);
  assert.deepStrictEqual(k.attachments, []); assert.deepStrictEqual(k.comments, []);
});

test('看板從起始號的下一號開始發議題編號；已經有號的卡不重發', () => {
  const b = new Board('玩家', 4213);
  const a = b.add(makeCard({ id: 'a', title: 'a', assignee: '玩家' })); const c = b.add(makeCard({ id: 'c', title: 'c', assignee: '玩家', no: 99 }));
  const d = b.add(makeCard({ id: 'd', title: 'd', assignee: '玩家' }));
  assert.strictEqual(a.no, 4214); assert.strictEqual(c.no, 99); assert.strictEqual(d.no, 4215);
  assert.strictEqual(b.label('a'), '#4214'); assert.strictEqual(b.label('nope'), '#?');
  assert.strictEqual(new Board('玩家').add(makeCard({ id: 'x', title: 'x', assignee: '玩家' })).no, 101);
});

test('對卡做事會記歷史、累計實際工時、存最新版本，狀態變進行中', () => {
  const k = makeCard({ id: 'c1', title: 't', assignee: '玩家' });
  k.record('doc_spec', { minutes: 30, version: '規格 v1', at: 600 });
  k.record('doc_spec', { minutes: 20, version: '規格 v2', at: 640 });
  assert.strictEqual(k.actualMin, 50);
  assert.strictEqual(k.latest('doc_spec'), '規格 v2');
  assert.strictEqual(k.latest('code'), undefined);
  assert.deepStrictEqual(k.history.map(h => h.work), ['doc_spec', 'doc_spec']);
  assert.strictEqual(k.status, 'open');
  assert.ok(k.done('doc_spec')); assert.ok(!k.done('code'));
});

test('交 QC、退件留言、追問、封存', () => {
  const k = makeCard({ id: 'c1', title: 't', assignee: '玩家' });
  k.submit(); assert.strictEqual(k.status, 'to_qc');
  k.reject('QC 建宏', '測試案例呢？', 900); assert.strictEqual(k.status, 'returned');
  k.nag('PM 芷婷', '客戶問這個什麼時候好', 930);
  assert.strictEqual(k.comments.length, 2);
  assert.deepStrictEqual(k.comments.map(c => c.kind), ['reject', 'nag']);
  k.archive(); assert.strictEqual(k.status, 'archived');
});

test('退回 SA 是另一種狀態，會記理由', () => {
  const k = makeCard({ id: 'c1', title: 't', assignee: '玩家' });
  k.rejectToSA('這個流程不合理', 700);
  assert.strictEqual(k.status, 'rejected_to_sa');
  assert.strictEqual(k.comments.at(-1).kind, 'to_sa');
});

test('看板：別人的卡唯讀，封存後不能再動', () => {
  const b = new Board('玩家');
  const mine = b.add(makeCard({ id: 'a', title: 'a', assignee: '玩家' }), 540);
  const theirs = b.add(makeCard({ id: 'b', title: 'b', assignee: '怡君' }), 541);
  assert.ok(b.canOperate(mine)); assert.ok(!b.canOperate(theirs));
  mine.archive(); assert.ok(!b.canOperate(mine));
  assert.strictEqual(b.get('a'), mine);
});

test('看板記進件順序與欄位', () => {
  const b = new Board('玩家');
  b.add(makeCard({ id: 'a', title: 'a', assignee: '玩家' }), 540);
  b.add(makeCard({ id: 'b', title: 'b', assignee: '玩家' }), 600);
  b.add(makeCard({ id: 'c', title: 'c', assignee: '玩家' }), 620);
  assert.deepStrictEqual(b.openOrder().map(k => k.id), ['a', 'b', 'c']);
  assert.strictEqual(b.get('a').arrivedAt, 540);
  b.get('b').submit();
  const cols = b.columns();
  assert.deepStrictEqual(cols.new.map(k => k.id), ['a', 'c']);
  assert.deepStrictEqual(cols.to_qc.map(k => k.id), ['b']);
  assert.deepStrictEqual(b.openOrder().map(k => k.id), ['a', 'c']);
});

test('位置：一張卡在未處理的卡裡是最新、最早、中間還是唯一', () => {
  const b = new Board('玩家');
  for (const [id, at] of [['a', 540], ['b', 600], ['c', 620]]) b.add(makeCard({ id, title: id, assignee: '玩家' }), at);
  assert.strictEqual(b.positionOf('c'), 'newest');
  assert.strictEqual(b.positionOf('a'), 'oldest');
  assert.strictEqual(b.positionOf('b'), 'middle');
  b.get('a').archive(); b.get('c').archive();
  assert.strictEqual(b.positionOf('b'), 'only');
});
