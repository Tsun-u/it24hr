// tests/verdict.test.js（node --test）
const test = require('node:test'); const assert = require('node:assert');
const V = require('../verdict.js');
const pick = (position, acted = true, cardId = 'x', minute = 600) => ({ minute, cardId, position, opened: true, acted });

test('大多拿最新 → Stack', () => assert.strictEqual(V.classify([pick('newest'), pick('newest'), pick('oldest')]).kind, 'stack'));
test('大多拿最早 → Queue', () => assert.strictEqual(V.classify([pick('oldest'), pick('oldest'), pick('newest')]).kind, 'queue'));
test('兩頭都拿、中間不碰 → Deque', () =>
  assert.strictEqual(V.classify([pick('newest'), pick('oldest'), pick('newest'), pick('oldest')]).kind, 'deque'));
test('看了沒做、來回比較才動手 → Tree', () => {
  const log = [pick('newest', false, 'a'), pick('middle', false, 'b'), pick('oldest', false, 'c'), pick('middle', true, 'b')];
  assert.strictEqual(V.classify(log).kind, 'tree');
});
test('整天沒點 → null', () => assert.strictEqual(V.classify([]).kind, 'null'));
test('只有一張卡時位置是 only，不算進任何一邊', () => {
  assert.strictEqual(V.classify([pick('only'), pick('only')]).kind, 'mixed');
});
test('判定附證據：列出支持結論的那幾次點擊，帶時間', () => {
  const r = V.classify([pick('newest', true, 'a', 860), pick('newest', true, 'b', 905)]);
  assert.ok(r.evidence.length >= 1); assert.match(r.evidence[0], /14:20.*拿了最新/);
});
test('每種結果都有名字和一句話', () => {
  for (const kind of ['stack', 'queue', 'deque', 'tree', 'null', 'mixed']) {
    assert.ok(V.NAMES[kind].name); assert.ok(V.NAMES[kind].line);
  }
});
test('結算卡固定一行：真正被優先處理 0 件', () => {
  const card = V.report({ player: { name: '小宇', title: '軟體工程師' }, verdict: V.classify([pick('newest')]),
    handled: 3, skippedDocs: 1, works: [], unlabeled: {}, leftAt: '19:10' });
  assert.ok(card.lines.some(l => l.includes('真正被優先處理：0 件')));
  assert.ok(card.lines.some(l => l.includes('Stack')));
  assert.ok(card.lines.some(l => l.includes('跳過的文件：1')));
});
test('結算卡的分數最多一位小數、無條件捨去（差一點也不會顯示成滿分）', () => {
  const card = V.report({ player: { name: '小宇', title: '軟體工程師' }, verdict: V.classify([pick('newest')]), handled: 1, skippedDocs: 0,
    works: [{ card: '#121 資產管理', items: [{ label: '開發計畫文件', score: (1 + 6 / 7) / 2, max: 1, times: 1 }, { label: '開發規格文件', score: 5 / 6, max: 1, times: 1 }, { label: '前端設計', score: 2, max: 3, times: 1 }] }],
    unlabeled: {}, leftAt: '18:00' });
  assert.ok(card.lines.includes('開發計畫文件：0.9／1'));
  assert.ok(card.lines.includes('開發規格文件：0.8／1'));
  assert.ok(card.lines.includes('前端設計：2／3'));
});
test('結算卡的分數照卡分組：卡名在前，同一張卡重做的註明次數；便條、平板、習慣與成就排在右欄', () => {
  const card = V.report({ player: { name: '小宇', title: '軟體工程師' }, verdict: V.classify([pick('newest')]), handled: 2, skippedDocs: 0,
    works: [{ card: '#124 資產盤點平台', items: [{ label: '部署', score: 1, max: 1, times: 2 }] }, { card: '#125 部門下拉', items: [{ label: '部署', score: 1, max: 1, times: 1 }] }],
    unlabeled: { note: true, charged: false }, traits: [{ title: '大胃王', text: '把商圈買光了' }], leftAt: '18:00' });
  assert.deepStrictEqual(card.tally.filter(t => t.weight === 'card').map(t => t.text), ['#124 資產盤點平台', '#125 部門下拉']);
  assert.ok(card.lines.includes('部署：1／1（做了 2 次）'));
  assert.ok(!card.tally.some(t => /便條|平板|大胃王/.test(t.text)), '左欄不放便條、平板、成就');
  assert.deepStrictEqual(card.traits.map(t => t.title), ['大胃王', '便條', '平板']);
});

test('三天總結算：照第一、二、三天排，各一個印章一句總評，印章接成一串；少一天就少一格', () => {
  const day = (kind, line, mode) => ({ mode, report: { kind, line } });
  const s = V.summary({ day3: day('Tree', '三', 'speedrun'), day1: day('Stack', '一', 'legacy'), day2: day('Queue', '二', 'hybrid') });
  assert.deepStrictEqual(s.days.map(d => [d.day, d.mode, d.stamp, d.line]), [['第一天', 'legacy', 'Stack', '一'], ['第二天', 'hybrid', 'Queue', '二'], ['第三天', 'speedrun', 'Tree', '三']]);
  assert.strictEqual(s.chain, 'Stack → Queue → Tree');
  assert.strictEqual(V.summary({ day1: day('Stack', '一', 'legacy') }).days.length, 1);
  const peers = [{ who: 'QC 阿姿', text: '「這次運氣好。」' }];
  assert.deepStrictEqual(V.summary({ day1: { mode: 'legacy', report: { kind: 'Stack', line: '一', peers } } }).days[0].peers, peers, '每天帶著那天的同事評語');
  assert.deepStrictEqual(s.days[0].peers, [], '沒有評語就是空的');
  const traits = [{ title: '大胃王', text: '晚餐點了三人份' }];
  assert.deepStrictEqual(V.summary({ day2: { mode: 'hybrid', report: { kind: 'Queue', line: '二', traits } } }).days[0].traits, traits, '成就也帶著');
  const estimates = [{ card: '#121 盤點', yours: '4 小時', actual: '2 小時', boss: '你在摸魚嗎？' }];
  assert.deepStrictEqual(V.summary({ day1: { mode: 'legacy', report: { kind: 'Stack', line: '一', estimates } } }).days[0].estimates, estimates, '估時也帶著');
});
