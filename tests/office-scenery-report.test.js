// tests/office-scenery-report.test.js（node --test）：第二關結算卡——紅字、紙本、怪東西、卡住的單、公斤數、成就、小潘、主卡
const test = require('node:test');
const assert = require('node:assert');
const { C, XIUQIN, play, tickTo, right, skipMeeting, shipped, codeWith } = require('./scenery-helpers.js');
const opened = () => skipMeeting(play());
const q = (e, id, work) => e.board.get(id).subtasks.find(s => s.work === work).question;
const swapped = (qq, i, v) => { const a = right(qq); a[i] = v; return a; };
const extra = (e) => e.script.report(e).extra;
const traits = (e) => e.report().traits.map(t => t.title);
const peers = (e) => e.report().peers.map(p => `${p.who}：${p.text}`);
const PAN = '同事 小潘：你上次幫阿賢做的是讓他自己打，這次是根本不給打，兩個都對，好玄。';

test('還沒有模組上線：沒有紅字那幾行', () => {
  const e = opened();
  assert.ok(!extra(e).some(t => t.startsWith('員工看到紅字')));
});
test('收購兩題跳紅字上線：紅字 48 次、12 張變回紙本；沒有卡住的單就不列', () => {
  const e = opened(); const a = right(q(e, 'buy', 'ui_design')); a[0] = 1; a[1] = 1;
  shipped(e, 'buy', { ui_design: a });
  assert.ok(extra(e).includes('員工看到紅字 48 次')); assert.ok(extra(e).includes('有 12 張又變回紙本'));
  assert.ok(!extra(e).some(t => t.startsWith('卡住的單')));
});
test('怪東西、卡住的單', () => {
  const e = opened();
  shipped(e, 'buy', { ui_design: swapped(q(e, 'buy', 'ui_design'), 0, 2), code: codeWith(e, 'buy', { noWeightYet: 1 }) });
  e.doWork('buy', 'ui_design', right(q(e, 'buy', 'ui_design'))); e.submit('buy'); tickTo(e, e.clock.minute + C.QC_TURNAROUND_MIN + 1);
  assert.ok(extra(e).includes('被填進去的怪東西：『時價』'));
  assert.ok(extra(e).includes('卡住的單：1 張'));
});
test('加工估量的公斤數三行', () => {
  const e = opened();
  shipped(e, 'yield', { ui_design: swapped(q(e, 'yield', 'ui_design'), 2, 1), code: codeWith(e, 'yield', { surplus: 3, agingLog: 1 }) });
  for (const line of ['跟客戶報的量，實際少交了 120 公斤', '多做出來、去向沒記的：40 公斤', '放到最後做成寵物零食的：35 公斤']) assert.ok(extra(e).includes(line), line);
});

test('最美的風景：五個模組都上線，沒有紅字、怪東西、卡住的單；小潘講第一天的對照', () => {
  const e = opened();
  for (const id of ['buy', 'yield', 'shift', 'trace', 'stock']) shipped(e, id);
  assert.ok(traits(e).includes('最美的風景'));
  assert.ok(peers(e).includes(PAN));
});
test('少一個模組沒上線就沒有最美的風景', () => {
  const e = opened();
  for (const id of ['buy', 'yield', 'shift', 'trace']) shipped(e, id);
  assert.ok(!traits(e).includes('最美的風景'));
});
test('紅字地獄：紅字超過 100 次', () => {
  const e = opened();
  const ui = (id, picks) => { const a = right(q(e, id, 'ui_design')); for (const [i, v] of picks) a[i] = v; return a; };
  shipped(e, 'buy', { ui_design: ui('buy', [[0, 1], [1, 1]]) });       // 2 × 24
  shipped(e, 'yield', { ui_design: ui('yield', [[1, 1], [3, 1]]) });   // 2 × 6
  shipped(e, 'shift', { ui_design: ui('shift', [[0, 1], [1, 1]]) });   // 2 × 15
  shipped(e, 'trace', { ui_design: ui('trace', [[0, 1]]) });           // 1 × 16
  assert.strictEqual(e.usageTally().red, 106);
  assert.ok(traits(e).includes('紅字地獄')); assert.ok(!peers(e).includes(PAN), '收購的欄位做錯，小潘不講');
  assert.ok(peers(e).includes(`${XIUQIN}：「系統是不錯，但早就跟建宏說電腦比不上人腦啦。」`), '收購結案了，但紅字多到紅字地獄，秀琴姐不誇');
  assert.ok(!peers(e).some(p => p.includes('手套都不用脫')));
});
test('上線後月底才出事的（late），秀琴姐在同事怎麼說講，最多三句', () => {
  const e = opened(); shipped(e, 'buy', { code: codeWith(e, 'buy', { regularPrice: 1 }) });
  assert.ok(peers(e).includes(`${XIUQIN}：（月底對帳）月底不知道為什麼這筆比較便宜`));
});
test('收購計價是主卡：結案後需求單位的評語是秀琴姐、有測試風格；結算卡縮圖畫收購單', () => {
  const e = opened(); shipped(e, 'buy');
  assert.ok(peers(e).includes(`${XIUQIN}：「雄哥說這個好用，手套都不用脫。」`));
  assert.ok(e.report().traits.some(t => t.title === '測試'));
  assert.strictEqual(e.script.mainCard, 'buy');
  const shot = require('../screen.js').model(e.board.get(e.script.mainCard));   // app.js 的 reportView 照這個畫縮圖
  assert.strictEqual(shot.app, '源裕水產 ERP・收購單'); assert.ok(shot.built && shot.form);
});
test('收購沒結案：秀琴姐說明天還是寫紙本', () => {
  const e = opened();
  assert.ok(peers(e).includes(`${XIUQIN}：「明天還是寫紙本。」`));
});
